"""Orchestrates a single competitor price check: fetch HTML via Bright Data,
parse it, write a CompetitorPriceHistory row, and refresh the cached
last_* fields on the CompetitorLink. This module never touches
ecommerce.models.Product — Collabo's own price is never written here."""

import logging

from django.utils import timezone

from . import brightdata_client, parsers
from .models import CompetitorLink, CompetitorPriceHistory

logger = logging.getLogger('pricing.services')


def check_link(link: CompetitorLink) -> CompetitorPriceHistory:
    """Fetches and records one price check for `link`. Always returns a
    CompetitorPriceHistory row — on failure it's a success=False row with
    price/in_stock left null, never an exception, so the caller (a bulk sync
    over many links) can treat every link independently."""

    try:
        html = brightdata_client.fetch_html(link.product_url)
        parsed = parsers.parse(link.platform, html)

        if parsed.price is None:
            history = CompetitorPriceHistory.objects.create(
                link=link, success=False,
                error_message='Price not found on page (site markup may have changed).',
            )
        else:
            history = CompetitorPriceHistory.objects.create(
                link=link, price=parsed.price, currency=parsed.currency,
                in_stock=parsed.in_stock, success=True,
            )
    except (brightdata_client.BrightDataError, brightdata_client.BrightDataNotConfigured) as exc:
        logger.warning('Price check failed for link %s (%s): %s', link.id, link.platform, exc)
        history = CompetitorPriceHistory.objects.create(
            link=link, success=False, error_message=str(exc),
        )
    except Exception as exc:  # noqa: BLE001 — one bad link must never abort the batch
        logger.exception('Unexpected error checking link %s (%s)', link.id, link.platform)
        history = CompetitorPriceHistory.objects.create(
            link=link, success=False, error_message=f'Unexpected error: {exc}',
        )

    link.last_checked_at = timezone.now()
    if history.success:
        link.last_price = history.price
        link.last_currency = history.currency
        link.last_in_stock = history.in_stock
        link.last_error = ''
    else:
        link.last_error = history.error_message
        # Keep last known price/availability on a failed check — a transient
        # scrape failure shouldn't blank out the last good comparison data.
    link.save(update_fields=[
        'last_checked_at', 'last_price', 'last_currency', 'last_in_stock', 'last_error',
    ])

    return history


def sync_all_active_links() -> dict:
    """Runs check_link() for every active CompetitorLink. Called by the
    every-12h Celery task. Returns a small summary dict for logging."""

    summary = {'checked': 0, 'succeeded': 0, 'failed': 0}
    links = CompetitorLink.objects.filter(is_active=True).select_related('product')

    for link in links:
        history = check_link(link)
        summary['checked'] += 1
        summary['succeeded' if history.success else 'failed'] += 1

    logger.info('Competitor price sync complete: %s', summary)
    return summary
