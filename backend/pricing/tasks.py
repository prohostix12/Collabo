"""
pricing/tasks.py
Celery task that wires the whole dynamic-pricing pipeline together:

    Celery Beat (every 6 hours)
         v
    Get enabled products
         v
    Amazon API / Flipkart API   (fetch_service.fetch_prices_for_active_products)
         v
    Save competitor prices      (pricing.CompetitorPrice rows)
         v
    Run pricing engine          (pricing_service.calculate_suggested_price)
         v
    Validate                    (safety_service.evaluate_pricing_result)
         v
    Update / approval           (apply_service.apply_safe_price_update /
                                  PendingPriceApproval.objects.update_or_create)

This file is orchestration only — it contains no calculation or decision
logic of its own. Every step it calls was built and tested in isolation in
prior stages specifically so this task could stay thin: fetch, calculate,
validate, and act are each someone else's job; this just calls them in
order and keeps one product's failure from stopping the rest, matching the
per-item try/except pattern used by ecommerce/tasks.py.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='pricing.tasks.run_dynamic_pricing_sync')
def run_dynamic_pricing_sync():
    """The full automatic pipeline, once per scheduled run. Respects the
    global PricingSyncSettings kill-switch, then processes every product
    that has at least one verified+active mapping and auto_pricing_enabled.
    Returns a summary dict — never raises for an individual product's
    failure."""
    from decimal import Decimal

    from ecommerce.models import Product

    from .apply_service import apply_safe_price_update
    from .fetch_service import fetch_prices_for_active_products
    from .models import CompetitorProductMapping, PendingPriceApproval, PricingSyncSettings
    from .pricing_service import calculate_suggested_price
    from .safety_service import NEEDS_APPROVAL, SAFE_AUTO_UPDATE, evaluate_pricing_result

    sync_settings = PricingSyncSettings.get_settings()
    if not sync_settings.global_auto_pricing_enabled:
        logger.info('Dynamic pricing sync skipped: global_auto_pricing_enabled is False')
        return {'skipped': True}

    logger.info('Dynamic pricing sync started')

    # Step 1-3: get enabled products -> hit Amazon/Flipkart -> save competitor prices.
    # fetch_prices_for_active_products() already filters to verified+active
    # mappings on products with auto_pricing_enabled=True, and already
    # isolates one platform's failure from the other (see fetch_service.py).
    fetch_summary = fetch_prices_for_active_products()
    logger.info('Dynamic pricing sync — fetch stage complete: %s', fetch_summary)

    if fetch_summary.get('skipped'):
        # Global switch was flipped off between the check above and here, or
        # (more likely) this dict came back from a nested skip — either way,
        # nothing was fetched, so there is nothing new to price.
        return {'fetch': fetch_summary, 'updated': 0, 'pending_approval': 0, 'no_action': 0, 'failed': 0}

    product_ids = (
        CompetitorProductMapping.objects
        .filter(is_verified=True, is_active=True, product__pricing_config__auto_pricing_enabled=True)
        .values_list('product_id', flat=True)
        .distinct()
    )

    updated = 0
    pending = 0
    no_action = 0
    failed = 0

    for product_id in product_ids:
        try:
            product = Product.objects.select_related('pricing_config').get(pk=product_id)

            # Step 4: run the pricing engine.
            result = calculate_suggested_price(product)
            # Step 5: validate.
            decision = evaluate_pricing_result(product, result)

            # Step 6: update, or send to approval.
            if decision.outcome == SAFE_AUTO_UPDATE:
                apply_safe_price_update(product, result, decision)
                updated += 1
            elif decision.outcome == NEEDS_APPROVAL:
                PendingPriceApproval.objects.update_or_create(
                    product=product,
                    status=PendingPriceApproval.PENDING,
                    defaults={
                        'current_price': decision.current_price,
                        'suggested_price': decision.final_price,
                        'change_percent': decision.change_percent or Decimal('0'),
                        'lowest_competitor_price': result.lowest_competitor_price,
                        'reason': decision.reason,
                    },
                )
                pending += 1
            else:
                no_action += 1

        except Exception as exc:  # noqa: BLE001 — one product's failure must never stop the batch
            logger.error('Dynamic pricing sync failed for product_id=%s: %s', product_id, exc)
            failed += 1

    summary = {
        'fetch': fetch_summary,
        'updated': updated,
        'pending_approval': pending,
        'no_action': no_action,
        'failed': failed,
    }
    logger.info('Dynamic pricing sync finished: %s', summary)
    return summary
