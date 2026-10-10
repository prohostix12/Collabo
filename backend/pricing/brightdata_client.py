"""Thin wrapper around Bright Data's Web Unlocker API
(https://docs.brightdata.com/scraping-automation/web-unlocker/send-your-first-request).

One HTTP POST per product page: Bright Data renders the target URL through
its unlocker zone (proxy rotation + anti-bot handling) and hands back the raw
HTML, which pricing/parsers.py then scrapes for price/availability. All
credentials come from environment variables — never hardcoded, never sent
anywhere except https://api.brightdata.com.
"""

import logging

import requests
from django.conf import settings

logger = logging.getLogger('pricing.brightdata')


class BrightDataError(Exception):
    """Raised for any non-2xx response or transport failure talking to Bright Data."""


class BrightDataNotConfigured(Exception):
    """Raised when BRIGHTDATA_API_KEY / BRIGHTDATA_ZONE are missing."""


def is_configured() -> bool:
    return bool(settings.BRIGHTDATA_API_KEY and settings.BRIGHTDATA_ZONE)


def fetch_html(url: str) -> str:
    """Fetches the rendered HTML of `url` through Bright Data's Web Unlocker.
    Raises BrightDataNotConfigured or BrightDataError — callers (pricing.services)
    are responsible for catching these and recording a failed price-check
    instead of letting them propagate into the Celery task."""

    if not is_configured():
        raise BrightDataNotConfigured('BRIGHTDATA_API_KEY / BRIGHTDATA_ZONE are not set')

    try:
        response = requests.post(
            settings.BRIGHTDATA_API_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {settings.BRIGHTDATA_API_KEY}',
            },
            json={
                'zone': settings.BRIGHTDATA_ZONE,
                'url': url,
                'format': 'raw',
                # Amazon.in / Flipkart.com show different prices (and non-INR
                # currency) to non-Indian IPs — pin the unlocker's exit node
                # to India so parsers.py's ₹-only assumptions hold.
                'country': settings.BRIGHTDATA_COUNTRY,
            },
            timeout=settings.BRIGHTDATA_TIMEOUT_SECS,
        )
    except requests.RequestException as exc:
        raise BrightDataError(f'Bright Data request failed: {exc}') from exc

    if response.status_code != 200:
        raise BrightDataError(
            f'Bright Data returned HTTP {response.status_code} for {url}: {response.text[:300]}'
        )

    return response.text
