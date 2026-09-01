"""✓ Price history works"""

from decimal import Decimal

from django.test import TestCase

from pricing.apply_service import apply_safe_price_update
from pricing.models import PriceChangeHistory
from pricing.pricing_service import calculate_suggested_price
from pricing.safety_service import NEEDS_APPROVAL, evaluate_pricing_result

from .factories import make_config, make_mapping, make_price, make_product


class PriceHistoryTests(TestCase):
    def test_rejects_a_non_safe_decision_price_stays_untouched(self):
        product = make_product(name='Reject Apply Product', price=Decimal('10000.00'))
        m = make_mapping(product, platform='amazon', external_id='B0REJECTAPPLY')
        make_price(m, Decimal('5000.00'))
        make_config(product, max_auto_decrease_percent=Decimal('10.00'))

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        self.assertEqual(decision.outcome, NEEDS_APPROVAL)

        with self.assertRaises(ValueError):
            apply_safe_price_update(product, result, decision)

        product.refresh_from_db()
        self.assertEqual(product.discount_price, Decimal('10000.00'))
        self.assertEqual(PriceChangeHistory.objects.filter(product=product).count(), 0)

    def test_exact_spec_example_history_row(self):
        """Collabo 10,000 -> 9,500, Amazon 9,600, Flipkart 9,550."""
        product = make_product(name='Spec Example Product', price=Decimal('10000.00'))
        m_amz = make_mapping(product, platform='amazon', external_id='B0EX9600')
        m_fk = make_mapping(product, platform='flipkart', external_id='FKEX9550')
        make_price(m_amz, Decimal('9600.00'))
        make_price(m_fk, Decimal('9550.00'))
        make_config(
            product, pricing_strategy='undercut_amount', undercut_amount=Decimal('50.00'),
            max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'),
        )

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        history = apply_safe_price_update(product, result, decision)

        product.refresh_from_db()
        self.assertEqual(product.discount_price, Decimal('9500.00'))
        self.assertEqual(product.price, Decimal('10000.00'), 'MRP stays put — this is a discount, not a sticker change')

        self.assertEqual(history.old_price, Decimal('10000.00'))
        self.assertEqual(history.new_price, Decimal('9500.00'))
        self.assertEqual(history.marketplace, 'flipkart')
        self.assertEqual(history.new_competitor_price, Decimal('9550.00'))
        self.assertEqual(history.update_type, PriceChangeHistory.AUTOMATIC)
        self.assertIn('Amazon', history.reason)
        self.assertIn('9600', history.reason)
        self.assertIn('Flipkart', history.reason)
        self.assertIn('9550', history.reason)

    def test_history_is_append_only_across_multiple_updates(self):
        product = make_product(name='Append Only Product', price=Decimal('10000.00'))
        m_fk = make_mapping(product, platform='flipkart', external_id='FKAPPEND1')
        make_price(m_fk, Decimal('9550.00'))
        make_config(product, pricing_strategy='undercut_amount', undercut_amount=Decimal('50.00'),
                    max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        result1 = calculate_suggested_price(product)
        decision1 = evaluate_pricing_result(product, result1)
        apply_safe_price_update(product, result1, decision1)

        make_price(m_fk, Decimal('9400.00'))
        product.refresh_from_db()
        result2 = calculate_suggested_price(product)
        decision2 = evaluate_pricing_result(product, result2)
        history2 = apply_safe_price_update(product, result2, decision2)

        rows = list(PriceChangeHistory.objects.filter(product=product).order_by('created_at'))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0].new_price, Decimal('9500.00'))
        self.assertEqual(rows[1].new_price, Decimal('9350.00'))
        self.assertEqual(history2.previous_competitor_price, Decimal('9550.00'))
        self.assertEqual(history2.new_competitor_price, Decimal('9400.00'))

    def test_increase_above_mrp_raises_price_field_too(self):
        product = make_product(name='Increase Above MRP Product', price=Decimal('500.00'))
        m = make_mapping(product, platform='amazon', external_id='B0INCRMRP')
        make_price(m, Decimal('540.00'))  # +8%, within default 10% limit
        make_config(product, max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        apply_safe_price_update(product, result, decision)

        product.refresh_from_db()
        self.assertEqual(product.price, Decimal('540.00'))
        self.assertEqual(product.discount_price, Decimal('540.00'))
        self.assertEqual(product.discount_percent, 0)
