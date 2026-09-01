"""Decides whether a suggested price from pricing_service.calculate_suggested_price()
is safe to apply automatically, or must go to admin approval:

    Suggested Price
          |
          v
    Minimum margin / minimum selling price  -> CLAMP the price up, keep going
          |
          v
    Maximum decrease / maximum increase     -> BLOCK, needs admin approval
          |
          v
    Safe -> automatic update   /   Unsafe -> admin approval

(Competitor availability, price freshness, and product mapping verification
are already enforced upstream, inside pricing_service.get_valid_competitor_quotes()
— a stale, unavailable, or unverified-mapping price never becomes part of the
PricingResult this function receives in the first place. If nothing valid
survived that gate, has_valid_data is False and this function returns
NO_ACTION before touching any of the checks below.)

Pure decision logic — like pricing_service, this never writes to Product and
never creates a PendingPriceApproval row itself; it only decides. Applying
the decision (an actual Product.price update, or creating the
PendingPriceApproval record) is a separate step, because writing a live
price is the single highest-risk action in this whole feature and must not
happen anywhere near the code that merely calculates.

The two protections behave differently on purpose:

  Margin / minimum price violation -> CLAMPED, update still proceeds. A
  margin floor is a hard business rule ("never sell below cost"), not a
  judgment call — clamping and moving on is strictly safer than either
  applying the too-low price or blocking the whole cycle over it.

  Maximum decrease/increase violation -> BLOCKED, sent to approval instead.
  A price outside a normal-looking range is exactly the signature of a bad
  competitor read (wrong product matched, a garbled price, a clearance
  listing) — that IS a judgment call, so an admin has to make it.
"""

import logging
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from typing import List, Optional

from .pricing_service import PricingResult

logger = logging.getLogger('pricing.safety_service')

SAFE_AUTO_UPDATE = 'safe_auto_update'
NEEDS_APPROVAL = 'needs_approval'
NO_ACTION = 'no_action'

TWO_PLACES = Decimal('0.01')
DEFAULT_MAX_CHANGE_PERCENT = Decimal('10')


def _round_currency(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@dataclass
class SafetyDecision:
    outcome: str  # SAFE_AUTO_UPDATE | NEEDS_APPROVAL | NO_ACTION
    current_price: Decimal
    raw_suggested_price: Optional[Decimal] = None
    final_price: Optional[Decimal] = None  # after margin clamping, if any
    change_percent: Optional[Decimal] = None  # % change from current_price to final_price
    margin_clamped: bool = False
    reasons: List[str] = field(default_factory=list)

    @property
    def reason(self) -> str:
        return ' '.join(self.reasons)


def _no_action(current_price, raw_suggested, reason) -> SafetyDecision:
    return SafetyDecision(
        outcome=NO_ACTION,
        current_price=current_price,
        raw_suggested_price=raw_suggested,
        final_price=None,
        change_percent=None,
        reasons=[reason],
    )


def evaluate_pricing_result(product, pricing_result: PricingResult) -> SafetyDecision:
    """The full safety gate. Takes the output of calculate_suggested_price()
    plus the product's ProductPricingConfig and decides what happens next."""

    current_price = pricing_result.current_price

    if not pricing_result.has_valid_data or pricing_result.suggested_price is None:
        return _no_action(
            current_price, None,
            pricing_result.reason or 'No valid competitor data — nothing to evaluate.',
        )

    if current_price is None or current_price <= 0:
        return _no_action(
            current_price, pricing_result.suggested_price,
            'Current product price is invalid — cannot safely compute a percentage change.',
        )

    raw_suggested = pricing_result.suggested_price

    if raw_suggested == current_price:
        return SafetyDecision(
            outcome=NO_ACTION,
            current_price=current_price,
            raw_suggested_price=raw_suggested,
            final_price=current_price,
            change_percent=Decimal('0.00'),
            reasons=['Suggested price equals current price — nothing to change.'],
        )

    config = getattr(product, 'pricing_config', None)
    reasons = []
    final_price = raw_suggested
    margin_clamped = False

    # --- Minimum price / margin protection: CLAMP, don't block ---
    floor_candidates = []
    if config and config.minimum_selling_price is not None:
        floor_candidates.append((config.minimum_selling_price, 'configured minimum selling price'))
    if config and config.cost_price is not None and config.minimum_margin_percentage is not None:
        margin_floor = _round_currency(
            config.cost_price * (Decimal('100') + config.minimum_margin_percentage) / Decimal('100')
        )
        floor_candidates.append((
            margin_floor,
            f'{config.minimum_margin_percentage}% minimum margin over cost price ₹{config.cost_price}',
        ))

    if floor_candidates:
        floor_price, floor_label = max(floor_candidates, key=lambda pair: pair[0])
        if final_price < floor_price:
            reasons.append(
                f'Suggested price ₹{final_price} was below the {floor_label} '
                f'(₹{floor_price}) — clamped up to ₹{floor_price}.'
            )
            final_price = floor_price
            margin_clamped = True

    # --- Maximum change protection: BLOCK, don't clamp ---
    change_percent = _round_currency((final_price - current_price) / current_price * Decimal('100'))

    max_decrease = config.max_auto_decrease_percent if config and config.max_auto_decrease_percent is not None else DEFAULT_MAX_CHANGE_PERCENT
    max_increase = config.max_auto_increase_percent if config and config.max_auto_increase_percent is not None else DEFAULT_MAX_CHANGE_PERCENT

    if change_percent < 0 and abs(change_percent) > max_decrease:
        reasons.append(
            f'Decrease of {abs(change_percent)}% exceeds the maximum automatic decrease of {max_decrease}%.'
        )
        logger.info('Safety decision for product_id=%s: NEEDS_APPROVAL (%s)', product.id, reasons[-1])
        return SafetyDecision(
            outcome=NEEDS_APPROVAL, current_price=current_price, raw_suggested_price=raw_suggested,
            final_price=final_price, change_percent=change_percent, margin_clamped=margin_clamped, reasons=reasons,
        )

    if change_percent > 0 and change_percent > max_increase:
        reasons.append(
            f'Increase of {change_percent}% exceeds the maximum automatic increase of {max_increase}%.'
        )
        logger.info('Safety decision for product_id=%s: NEEDS_APPROVAL (%s)', product.id, reasons[-1])
        return SafetyDecision(
            outcome=NEEDS_APPROVAL, current_price=current_price, raw_suggested_price=raw_suggested,
            final_price=final_price, change_percent=change_percent, margin_clamped=margin_clamped, reasons=reasons,
        )

    reasons.append(
        'Within maximum change limits after margin clamping — safe to auto-update.'
        if margin_clamped else
        'Within all safety limits — safe to auto-update.'
    )
    logger.info(
        'Safety decision for product_id=%s: SAFE_AUTO_UPDATE (%s -> %s, %s%%)',
        product.id, current_price, final_price, change_percent,
    )
    return SafetyDecision(
        outcome=SAFE_AUTO_UPDATE, current_price=current_price, raw_suggested_price=raw_suggested,
        final_price=final_price, change_percent=change_percent, margin_clamped=margin_clamped, reasons=reasons,
    )
