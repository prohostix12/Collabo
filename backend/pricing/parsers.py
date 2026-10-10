"""Best-effort HTML price/availability extraction for Amazon.in and
Flipkart.com product pages fetched via Bright Data's Web Unlocker.

Both sites change their markup and CSS class names periodically (Flipkart in
particular ships obfuscated, frequently-rotated class names), so each parser
tries a list of selectors from most to least specific, then falls back to a
plain "₹<digits>" regex scan of the page as a last resort. A parser that
finds nothing returns price=None rather than raising — a missing price is
reported to the caller as a failed check, not a crash.
"""

import logging
import re
from decimal import Decimal, InvalidOperation
from typing import NamedTuple, Optional

from bs4 import BeautifulSoup

logger = logging.getLogger('pricing.parsers')

_AMOUNT_RE = re.compile(r'[\d][\d,]*(?:\.\d+)?')
_RUPEE_SCAN_RE = re.compile(r'₹\s*([\d][\d,]*(?:\.\d+)?)')


class ParsedPrice(NamedTuple):
    price: Optional[Decimal]
    currency: str
    in_stock: Optional[bool]


def _to_decimal(text: str) -> Optional[Decimal]:
    if not text:
        return None
    match = _AMOUNT_RE.search(text.replace(',', ''))
    if not match:
        return None
    try:
        return Decimal(match.group(0))
    except InvalidOperation:
        return None


def _first_text(soup: BeautifulSoup, selectors) -> Optional[str]:
    for selector in selectors:
        el = soup.select_one(selector)
        if el and el.get_text(strip=True):
            return el.get_text(strip=True)
    return None


def _scan_for_rupee_amount(html: str) -> Optional[Decimal]:
    match = _RUPEE_SCAN_RE.search(html)
    if not match:
        return None
    try:
        return Decimal(match.group(1).replace(',', ''))
    except InvalidOperation:
        return None


def parse_amazon(html: str) -> ParsedPrice:
    soup = BeautifulSoup(html, 'html.parser')

    price_text = _first_text(soup, [
        '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
        '#corePrice_feature_div .a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price .a-offscreen',
    ])
    price = _to_decimal(price_text) if price_text else _scan_for_rupee_amount(html)

    availability_text = (_first_text(soup, ['#availability span', '#availability']) or '').lower()
    if not availability_text:
        in_stock = None
    elif 'unavailable' in availability_text or 'out of stock' in availability_text:
        in_stock = False
    elif 'in stock' in availability_text or 'available' in availability_text:
        in_stock = True
    else:
        # Amazon shows the Buy Box price/availability only when in stock — if
        # we found a price but no explicit availability string, treat it as in stock.
        in_stock = True if price is not None else None

    return ParsedPrice(price=price, currency='INR', in_stock=in_stock)


def parse_flipkart(html: str) -> ParsedPrice:
    soup = BeautifulSoup(html, 'html.parser')

    price_text = _first_text(soup, [
        '[class*="Nx9bqj"]',      # current (2024+) price class, may rotate
        '[class*="_30jeq3"]',     # older price class, kept as fallback
        '[class*="_16Jk6d"]',     # older price class, kept as fallback
    ])
    price = _to_decimal(price_text) if price_text else _scan_for_rupee_amount(html)

    lowered = html.lower()
    if 'sold out' in lowered or 'currently unavailable' in lowered or 'out of stock' in lowered:
        in_stock = False
    elif price is not None:
        in_stock = True
    else:
        in_stock = None

    return ParsedPrice(price=price, currency='INR', in_stock=in_stock)


PARSERS = {
    'amazon': parse_amazon,
    'flipkart': parse_flipkart,
}


def parse(platform: str, html: str) -> ParsedPrice:
    parser = PARSERS.get(platform)
    if parser is None:
        raise ValueError(f'No parser registered for platform: {platform}')
    return parser(html)
