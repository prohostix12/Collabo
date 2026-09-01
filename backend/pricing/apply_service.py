"""Writes a real price change to a product and records it, atomically. This
is the ONLY place in the entire pricing feature that writes to
ecommerce.Product. Every other service (fetch_service, pricing_service,
safety_service) is strictly read/calculate-only by design, specifically so
this file is the single, auditable choke point for the one truly high-risk
action in this whole feature.

Two entry points, both funnel through the same low-level _write_price_change:

  apply_safe_price_update()   — called automatically by pricing.tasks for a
                                 SAFE_AUTO_UPDATE safety_service decision.
  apply_admin_approved_price() / reject_pending_approval() — called from the
                                 PendingPriceApprovalViewSet approve/reject
                                 actions when an admin reviews a NEEDS_APPROVAL
                                 case by hand.

Which field actually gets updated:
ecommerce/views.py uses product.discount_price everywhere money changes
hands (cart subtotal, OrderItem price, checkout) — product.price is the MRP
/ "was" price. Product.save() also silently clamps discount_price down to
price whenever discount_price > price (ecommerce/models.py:71-82), which
would quietly defeat an upward price change if we only touched
discount_price. So:
  - price DECREASE (new <= current price/MRP): only discount_price moves —
    this shows as a normal "was X, now Y" discount, same as any manual sale.
  - price AT-OR-ABOVE the current MRP: price is raised to match too, so
    there's no stale "was" price left implying a discount that isn't real.
"""

import logging

from django.db import transaction
from django.utils import timezone

from .models import CompetitorPrice, PendingPriceApproval, PriceChangeHistory
from .safety_service import SAFE_AUTO_UPDATE, SafetyDecision

logger = logging.getLogger('pricing.apply_service')

PLATFORM_LABELS = {'amazon': 'Amazon', 'flipkart': 'Flipkart'}


def _format_competitor_snapshot(quotes) -> str:
    """'Amazon: ₹9,600, Flipkart: ₹9,550' — every valid quote that went into
    this decision, so the reason on a PriceChangeHistory row is readable on
    its own without joining back to CompetitorPrice."""
    if not quotes:
        return ''
    parts = [f'{PLATFORM_LABELS.get(q.platform, q.platform)}: ₹{q.price}' for q in quotes]
    return ', '.join(parts)


def _find_previous_competitor_price(deciding_quote):
    """The deciding platform's price from before this one, for the same
    mapping — lets the audit trail say "Flipkart dropped from X to Y", not
    just "Flipkart is currently Y". None if this is the first recorded price
    for that mapping."""
    if deciding_quote is None:
        return None
    prior_row = (
        CompetitorPrice.objects
        .filter(mapping_id=deciding_quote.mapping_id, fetch_succeeded=True)
        .exclude(fetched_at=deciding_quote.fetched_at)
        .order_by('-fetched_at')
        .first()
    )
    return prior_row.price if prior_row else None


def _write_price_change(
    product_id, new_price, previous_competitor_price, new_competitor_price,
    marketplace, reason, update_type,
) -> PriceChangeHistory:
    """The single choke point that actually touches Product.price /
    discount_price and creates the matching PriceChangeHistory row, inside
    one locked transaction. Both the automatic path and the admin-approval
    path call this — neither writes to Product any other way."""

    with transaction.atomic():
        # Lock the row for the duration of the update so a concurrent fetch
        # cycle or admin action can't race this read-modify-write.
        from ecommerce.models import Product
        locked_product = Product.objects.select_for_update().get(pk=product_id)
        old_price = (
            locked_product.discount_price
            if locked_product.discount_price is not None
            else locked_product.price
        )

        if new_price >= locked_product.price:
            locked_product.price = new_price
            locked_product.discount_price = new_price
        else:
            locked_product.discount_price = new_price
        locked_product.save(update_fields=['price', 'discount_price', 'discount_percent', 'updated_at'])

        history = PriceChangeHistory.objects.create(
            product=locked_product,
            old_price=old_price,
            new_price=new_price,
            previous_competitor_price=previous_competitor_price,
            new_competitor_price=new_competitor_price,
            marketplace=marketplace,
            reason=reason,
            update_type=update_type,
        )

    logger.info(
        'Applied price change (%s): product_id=%s %s -> %s (history_id=%s)',
        update_type, product_id, old_price, new_price, history.id,
    )
    return history


def apply_safe_price_update(product, pricing_result, decision: SafetyDecision) -> PriceChangeHistory:
    """Applies exactly one SAFE_AUTO_UPDATE decision to `product` and records
    it. Raises ValueError for any other outcome — callers must check
    decision.outcome themselves first; this function refuses to guess."""

    if decision.outcome != SAFE_AUTO_UPDATE:
        raise ValueError(
            f'apply_safe_price_update() called with outcome="{decision.outcome}" — '
            'only a SAFE_AUTO_UPDATE decision may ever be applied automatically.'
        )
    if decision.final_price is None:
        raise ValueError('SafetyDecision has no final_price to apply.')

    deciding_quote = min(pricing_result.quotes, key=lambda q: q.price) if pricing_result.quotes else None
    previous_competitor_price = _find_previous_competitor_price(deciding_quote)

    reason = decision.reason
    snapshot = _format_competitor_snapshot(pricing_result.quotes)
    if snapshot:
        reason = f'{reason} Competitor prices at decision time — {snapshot}.'

    return _write_price_change(
        product_id=product.pk,
        new_price=decision.final_price,
        previous_competitor_price=previous_competitor_price,
        new_competitor_price=deciding_quote.price if deciding_quote else None,
        marketplace=deciding_quote.platform if deciding_quote else '',
        reason=reason,
        update_type=PriceChangeHistory.AUTOMATIC,
    )


def apply_admin_approved_price(approval: PendingPriceApproval, admin_user) -> PriceChangeHistory:
    """An admin approves a NEEDS_APPROVAL case by hand: writes
    approval.suggested_price to the product, records a MANUAL_APPROVED
    history row, and marks the approval approved. Raises ValueError if the
    approval isn't currently pending — an approval can only be actioned
    once."""

    if approval.status != PendingPriceApproval.PENDING:
        raise ValueError(
            f'Cannot approve an approval with status="{approval.status}" — '
            'only a pending approval can be approved.'
        )

    reason = f'Manually approved by admin. {approval.reason}'.strip()

    history = _write_price_change(
        product_id=approval.product_id,
        new_price=approval.suggested_price,
        previous_competitor_price=None,
        new_competitor_price=approval.lowest_competitor_price,
        marketplace='',  # PendingPriceApproval doesn't record which platform was deciding
        reason=reason,
        update_type=PriceChangeHistory.MANUAL_APPROVED,
    )

    approval.status = PendingPriceApproval.APPROVED
    approval.reviewed_by = admin_user
    approval.reviewed_at = timezone.now()
    approval.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'updated_at'])

    return history


def reject_pending_approval(approval: PendingPriceApproval, admin_user, rejection_reason: str = '') -> PendingPriceApproval:
    """An admin rejects a NEEDS_APPROVAL case: no price change, just records
    the rejection. Raises ValueError if the approval isn't currently
    pending."""

    if approval.status != PendingPriceApproval.PENDING:
        raise ValueError(
            f'Cannot reject an approval with status="{approval.status}" — '
            'only a pending approval can be rejected.'
        )

    approval.status = PendingPriceApproval.REJECTED
    approval.reviewed_by = admin_user
    approval.reviewed_at = timezone.now()
    approval.rejection_reason = rejection_reason
    approval.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'updated_at'])

    logger.info('Pending approval %s rejected by %s', approval.id, getattr(admin_user, 'email', admin_user))
    return approval
