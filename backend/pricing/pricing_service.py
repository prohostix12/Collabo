"""Calculates a suggested Collabo price from stored competitor data:

    Amazon = 29,499
    Flipkart = 28,499
           |
           v
    Lowest = 28,499
           |
           v
    Pricing Rule (ProductPricingConfig.pricing_strategy)
           |
           v
    Suggested Collabo Price = 28,399

Pure calculation only — this module never touches ecommerce.Product, never
writes anything, and never talks to Amazon/Flipkart. It reads what
fetch_service.py already fetched and stored. Deliberately a separate module
from fetch_service.py (which owns talking to providers and normalizing their
responses) and never called from inside a Django view directly — a view
imports calculate_suggested_price() and renders the result, it doesn't
reimplement any of this logic itself.

This step deliberately stops at "here is the suggested price and why" — it
does NOT apply minimum-margin or max-change-percent protection, and it never
writes to Product.price. Those guardrails, and the approval workflow, are a
later step precisely because nothing before that point may touch a live
price.
"""

import logging
from dataclasses import dataclass, field
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import List, Optional

from django.utils import timezone

from .models import CompetitorPrice, PricingSyncSettings, ProductPricingConfig

logger = logging.getLogger('pricing.pricing_service')

# Collabo has no multi-currency support anywhere in ecommerce (no currency
# field on Product, Razorpay is INR-only) — a competitor quote in any other
# currency can't be compared to a Collabo price and must be excluded.
COLLABO_CURRENCY = 'INR'

TWO_PLACES = Decimal('0.01')


def _round_currency(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _effective_selling_price(product) -> Decimal:
    """The price a customer actually pays: ecommerce/views.py uses
    product.discount_price for cart subtotal, order-item price, and
    checkout everywhere (product.price is the MRP / "was" price shown next
    to a discount badge — Product.save() keeps discount_price mirroring
    price whenever no discount is configured). Competitor price matching
    must compare against — and ultimately update — this field, the same
    fallback pattern ecommerce/views.py itself uses at views.py:1110."""
    return product.discount_price if product.discount_price is not None else product.price


@dataclass
class CompetitorQuote:
    """One platform's currently-valid, non-stale price for a product —
    the output of the COMPETITOR PRICE VALIDATION gate."""

    platform: str
    price: Decimal
    fetched_at: object
    mapping_id: int


@dataclass
class PricingResult:
    product_id: int
    has_valid_data: bool
    current_price: Decimal
    strategy: str
    quotes: List[CompetitorQuote] = field(default_factory=list)
    lowest_competitor_price: Optional[Decimal] = None
    lowest_competitor_platform: Optional[str] = None
    average_competitor_price: Optional[Decimal] = None
    suggested_price: Optional[Decimal] = None
    reason: str = ''


def get_valid_competitor_quotes(product) -> List[CompetitorQuote]:
    """The COMPETITOR PRICE VALIDATION gate. For each verified+active mapping
    on this product, takes its single most recent CompetitorPrice row and
    keeps it only if it passes every check:
      - the fetch actually succeeded
      - the price is a real positive number
      - the currency matches Collabo's (INR)
      - the listing was reported available
      - the fetch isn't older than PricingSyncSettings.stale_price_threshold_minutes
    A mapping with no currently-valid price simply contributes nothing — it
    is never treated as a zero or an outage that blocks the other platform."""

    sync_settings = PricingSyncSettings.get_settings()
    stale_cutoff = timezone.now() - timedelta(minutes=sync_settings.stale_price_threshold_minutes)

    quotes = []
    mappings = product.competitor_mappings.filter(is_verified=True, is_active=True)
    for mapping in mappings:
        latest = mapping.price_records.order_by('-fetched_at').first()
        if latest is None:
            continue
        if not latest.fetch_succeeded:
            continue
        if latest.price is None or latest.price <= 0:
            continue
        if latest.currency != COLLABO_CURRENCY:
            logger.warning(
                'Mapping_id=%s excluded from pricing: currency %s != %s',
                mapping.id, latest.currency, COLLABO_CURRENCY,
            )
            continue
        if latest.availability != CompetitorPrice.AVAILABLE:
            continue
        if latest.fetched_at < stale_cutoff:
            logger.info(
                'Mapping_id=%s excluded from pricing: price is stale (fetched_at=%s, cutoff=%s)',
                mapping.id, latest.fetched_at, stale_cutoff,
            )
            continue

        quotes.append(CompetitorQuote(
            platform=mapping.platform,
            price=latest.price,
            fetched_at=latest.fetched_at,
            mapping_id=mapping.id,
        ))
    return quotes


def calculate_suggested_price(product) -> PricingResult:
    """Runs the diagram above for one product. Always returns a PricingResult
    — check has_valid_data before trusting suggested_price; it is None
    whenever there was nothing valid to calculate from."""

    config = getattr(product, 'pricing_config', None)
    strategy = config.pricing_strategy if config else ProductPricingConfig.STRATEGY_KEEP_CURRENT

    quotes = get_valid_competitor_quotes(product)

    if not quotes:
        logger.info('No valid competitor data for product_id=%s — no suggestion possible', product.id)
        return PricingResult(
            product_id=product.id,
            has_valid_data=False,
            current_price=_effective_selling_price(product),
            strategy=strategy,
            quotes=[],
            reason='No valid competitor price available (no verified mapping has a recent, available, successful fetch).',
        )

    lowest_quote = min(quotes, key=lambda q: q.price)
    lowest = lowest_quote.price
    average = _round_currency(sum(q.price for q in quotes) / len(quotes))

    if strategy == ProductPricingConfig.STRATEGY_MATCH_LOWEST:
        suggested = lowest
        reason = f'Match lowest competitor ({lowest_quote.platform}: ₹{lowest})'

    elif strategy == ProductPricingConfig.STRATEGY_UNDERCUT_AMOUNT:
        undercut = config.undercut_amount if config else Decimal('0')
        suggested = _round_currency(lowest - undercut)
        reason = f'₹{undercut} below lowest competitor ({lowest_quote.platform}: ₹{lowest})'

    elif strategy == ProductPricingConfig.STRATEGY_UNDERCUT_PERCENT:
        pct = config.undercut_percentage if config else Decimal('0')
        suggested = _round_currency(lowest * (Decimal('100') - pct) / Decimal('100'))
        reason = f'{pct}% below lowest competitor ({lowest_quote.platform}: ₹{lowest})'

    elif strategy == ProductPricingConfig.STRATEGY_MATCH_AVERAGE:
        suggested = average
        reason = f'Match average competitor price (₹{average} across {len(quotes)} platform(s))'

    else:  # STRATEGY_KEEP_CURRENT or an unrecognized value — monitoring only
        suggested = _effective_selling_price(product)
        reason = 'Pricing strategy is "keep current price" — monitoring only, no change suggested.'

    logger.info(
        'Suggested price calculated: product_id=%s strategy=%s lowest=%s suggested=%s',
        product.id, strategy, lowest, suggested,
    )

    return PricingResult(
        product_id=product.id,
        has_valid_data=True,
        current_price=_effective_selling_price(product),
        strategy=strategy,
        quotes=quotes,
        lowest_competitor_price=lowest,
        lowest_competitor_platform=lowest_quote.platform,
        average_competitor_price=average,
        suggested_price=suggested,
        reason=reason,
    )
