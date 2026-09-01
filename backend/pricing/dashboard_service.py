"""Aggregates the summary stats and the product comparison table for the
Dynamic Pricing admin dashboard. Read-only reporting only — this never
calculates a new suggestion beyond what pricing_service already computes for
each product, and never writes anything.

The summary counts (amazon_checked, flipkart_checked, prices_changed,
api_failures) are scoped to the most recent sync window
(PricingSyncSettings.last_sync_started_at onward) — they describe "what
happened in the last sync run", matching how the dashboard is meant to read.
pending_approval is a live queue depth, not time-scoped, since it's a
backlog rather than an event count.
"""

import logging

from django.db.models import Prefetch

from .models import (
    CompetitorPrice,
    CompetitorProductMapping,
    PendingPriceApproval,
    PriceChangeHistory,
    PricingSyncSettings,
)
from .pricing_service import calculate_suggested_price

logger = logging.getLogger('pricing.dashboard_service')


def _monitored_mappings_queryset():
    """Mappings that are actually part of the automatic sync's scope — same
    filter fetch_service and tasks.py use to decide what to touch."""
    return CompetitorProductMapping.objects.filter(
        is_verified=True,
        is_active=True,
        product__pricing_config__auto_pricing_enabled=True,
    )


def get_dashboard_summary() -> dict:
    sync_settings = PricingSyncSettings.get_settings()
    window_start = sync_settings.last_sync_started_at

    products_monitored = _monitored_mappings_queryset().values('product_id').distinct().count()

    if window_start is None:
        amazon_checked = flipkart_checked = prices_changed = api_failures = 0
    else:
        checked_qs = CompetitorPrice.objects.filter(fetched_at__gte=window_start)
        amazon_checked = (
            checked_qs.filter(platform='amazon', fetch_succeeded=True)
            .values('product_id').distinct().count()
        )
        flipkart_checked = (
            checked_qs.filter(platform='flipkart', fetch_succeeded=True)
            .values('product_id').distinct().count()
        )
        api_failures = checked_qs.filter(fetch_succeeded=False).count()
        prices_changed = PriceChangeHistory.objects.filter(created_at__gte=window_start).count()

    pending_approval = PendingPriceApproval.objects.filter(status=PendingPriceApproval.PENDING).count()

    return {
        'global_auto_pricing_enabled': sync_settings.global_auto_pricing_enabled,
        'last_sync_started_at': sync_settings.last_sync_started_at,
        'last_sync_completed_at': sync_settings.last_sync_completed_at,
        'sync_interval_minutes': sync_settings.sync_interval_minutes,
        'products_monitored': products_monitored,
        'amazon_checked': amazon_checked,
        'flipkart_checked': flipkart_checked,
        'prices_changed': prices_changed,
        'pending_approval': pending_approval,
        'api_failures': api_failures,
    }


def get_comparison_table() -> list:
    """One row per monitored product: name, latest Amazon/Flipkart price,
    Collabo's current selling price, and what the pricing engine would
    suggest right now (the raw pricing_service output, not the
    safety-clamped figure — this table is a monitoring view, not an
    approval action)."""

    from ecommerce.models import Product

    product_ids = _monitored_mappings_queryset().values_list('product_id', flat=True).distinct()
    products = (
        Product.objects.filter(id__in=product_ids)
        .select_related('pricing_config')
        .prefetch_related(
            Prefetch(
                'competitor_mappings',
                queryset=CompetitorProductMapping.objects.prefetch_related(
                    Prefetch('price_records', queryset=CompetitorPrice.objects.order_by('-fetched_at'))
                ),
            )
        )
    )

    rows = []
    for product in products:
        result = calculate_suggested_price(product)

        platform_prices = {}
        last_checked = None
        for mapping in product.competitor_mappings.all():
            if not (mapping.is_verified and mapping.is_active):
                continue
            records = list(mapping.price_records.all())
            latest = records[0] if records else None
            if latest is None:
                continue
            platform_prices[mapping.platform] = latest.price if latest.fetch_succeeded else None
            if last_checked is None or latest.fetched_at > last_checked:
                last_checked = latest.fetched_at

        collabo_price = product.discount_price if product.discount_price is not None else product.price

        rows.append({
            'product_id': product.id,
            'product_name': product.name,
            'product_image': product.image,
            'amazon_price': platform_prices.get('amazon'),
            'flipkart_price': platform_prices.get('flipkart'),
            'collabo_price': collabo_price,
            'suggested_price': result.suggested_price,
            'has_valid_data': result.has_valid_data,
            'last_checked': last_checked,
        })
    return rows
