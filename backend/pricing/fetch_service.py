"""Orchestrates fetching + normalizing competitor prices. This is the one
place that knows how to turn a provider's CompetitorPriceResult into a stored
CompetitorPrice row — nothing downstream (the pricing engine, the API, the
React UI) ever talks to AmazonProvider/FlipkartProvider directly, and nothing
here cares which marketplace it's dealing with. That's the point of the
provider architecture: add a third marketplace later and only providers/ and
PLATFORM_CHOICES change — this file, the engine, and the UI don't.

Two entry points:
  fetch_price_for_mapping()      — one mapping, used by the admin "Fetch Price
                                    Now" action. Does NOT require is_verified,
                                    since verifying a mapping usually means
                                    fetching it first to see if it looks right.
  fetch_prices_for_active_products() — bulk entry point for scheduled sync
                                    (STEP 7). Only touches verified, active
                                    mappings on products with auto pricing on.

Neither of these ever raises for an expected failure — every call always
returns/creates something the caller can inspect. A CompetitorPrice row is
append-only: a failed fetch never overwrites the last good price, it just
adds a new row recording that this attempt failed (see models.py).
"""

import logging

from django.utils import timezone

from .models import CompetitorPrice
from .providers.base import CompetitorPriceResult
from .providers.registry import get_provider

logger = logging.getLogger('pricing.fetch_service')


def fetch_price_for_mapping(mapping) -> CompetitorPrice:
    """Fetch, normalize, and store one CompetitorPrice row for a single
    mapping. Always returns a saved row, whether the fetch succeeded or not."""

    logger.info(
        'Price fetch started: mapping_id=%s product_id=%s platform=%s external_id=%s',
        mapping.id, mapping.product_id, mapping.platform, mapping.external_product_id,
    )

    if not mapping.is_active:
        result = CompetitorPriceResult.failure('Mapping is inactive — fetch skipped.')
    else:
        provider = get_provider(mapping.platform)
        if provider is None:
            result = CompetitorPriceResult.failure(f'No provider registered for platform "{mapping.platform}".')
        else:
            try:
                result = provider.get_product_price(mapping)
            except Exception as exc:  # noqa: BLE001 — providers are contracted to never raise, but a broken
                # implementation must not take down a bulk sync over one mapping.
                logger.error('Unexpected provider exception for mapping_id=%s: %s', mapping.id, exc)
                result = CompetitorPriceResult.failure(f'Unexpected provider error: {exc}')

    # Normalization-level sanity check (not a business rule — staleness /
    # margin / max-change rules belong to the pricing engine, not here). A
    # provider claiming success with a non-positive price is a malformed
    # response and must not be trusted as real data.
    if result.success and result.price is not None and result.price <= 0:
        logger.error('Mapping_id=%s: provider returned invalid price %s', mapping.id, result.price)
        result = CompetitorPriceResult.failure(f'Provider returned invalid price: {result.price}')

    price_row = CompetitorPrice.objects.create(
        product=mapping.product,
        mapping=mapping,
        platform=mapping.platform,
        external_product_id=mapping.external_product_id,
        price=result.price,
        original_price=result.original_price,
        currency=result.currency,
        availability=result.availability,
        seller_info=result.seller_info,
        product_url=result.product_url or mapping.external_url,
        fetch_succeeded=result.success,
        error_message=result.error_message,
        fetched_at=timezone.now(),
    )

    if result.success:
        logger.info(
            'Price fetch succeeded: mapping_id=%s price=%s %s availability=%s',
            mapping.id, result.price, result.currency, result.availability,
        )
    else:
        logger.warning('Price fetch failed: mapping_id=%s error=%s', mapping.id, result.error_message)

    return price_row


def fetch_prices_for_mappings(mappings) -> dict:
    """Fetch for an iterable of mappings. One mapping's failure — or even a
    DB error saving its row — never stops the rest of the batch, matching
    the 'Amazon fails, Flipkart still processes' requirement."""

    succeeded = 0
    failed = 0
    for mapping in mappings:
        try:
            row = fetch_price_for_mapping(mapping)
            if row.fetch_succeeded:
                succeeded += 1
            else:
                failed += 1
        except Exception as exc:  # noqa: BLE001
            logger.error('Unexpected error fetching mapping_id=%s: %s', mapping.id, exc)
            failed += 1
    return {'succeeded': succeeded, 'failed': failed, 'total': succeeded + failed}


def fetch_prices_for_active_products() -> dict:
    """Bulk entry point: only verified + active mappings on products with
    auto_pricing_enabled=True. This is what the scheduled sync (STEP 7) will
    call — never fetches for a product where auto pricing is off.

    Also respects the global PricingSyncSettings kill-switch — an admin can
    pause all monitoring platform-wide without touching every product's
    individual config."""

    from .models import CompetitorProductMapping, PricingSyncSettings

    sync_settings = PricingSyncSettings.get_settings()
    if not sync_settings.global_auto_pricing_enabled:
        logger.info('Bulk price fetch skipped: global_auto_pricing_enabled is False')
        return {'succeeded': 0, 'failed': 0, 'total': 0, 'skipped': True}

    mappings = CompetitorProductMapping.objects.filter(
        is_verified=True,
        is_active=True,
        product__pricing_config__auto_pricing_enabled=True,
    ).select_related('product', 'product__pricing_config')

    count = mappings.count()
    logger.info('Bulk price fetch started: %d eligible mappings', count)

    sync_settings.last_sync_started_at = timezone.now()
    sync_settings.save(update_fields=['last_sync_started_at'])

    summary = fetch_prices_for_mappings(mappings)
    summary['skipped'] = False

    sync_settings.last_sync_completed_at = timezone.now()
    sync_settings.save(update_fields=['last_sync_completed_at'])

    logger.info('Bulk price fetch finished: %s', summary)
    return summary
