"""✓ Minimum margin works
✓ Maximum price change works
"""

from decimal import Decimal

from django.test import TestCase

from pricing.models import ProductPricingConfig
from pricing.pricing_service import calculate_suggested_price
from pricing.safety_service import NEEDS_APPROVAL, NO_ACTION, SAFE_AUTO_UPDATE, evaluate_pricing_result

from .factories import make_config, make_mapping, make_price, make_product


class MaximumPriceChangeTests(TestCase):
    def test_exact_spec_example_large_decrease_blocked(self):
        """Collabo = 10,000, Amazon = 5,000, Flipkart = 5,100 — a 50% drop
        must never auto-apply."""
        product = make_product(name='Blocked Decrease Product', price=Decimal('10000.00'))
        m_amz = make_mapping(product, platform='amazon', external_id='B0BLOCK1')
        m_fk = make_mapping(product, platform='flipkart', external_id='FKBLOCK1')
        make_price(m_amz, Decimal('5000.00'))
        make_price(m_fk, Decimal('5100.00'))
        make_config(product, pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_LOWEST,
                    max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)

        self.assertEqual(decision.outcome, NEEDS_APPROVAL)
        self.assertEqual(decision.final_price, Decimal('5000.00'))
        self.assertIn('exceeds the maximum automatic decrease', decision.reason)

    def test_safe_small_decrease_auto_applies(self):
        product = make_product(name='Safe Decrease Product', price=Decimal('999.00'))
        m = make_mapping(product, platform='flipkart', external_id='FKSAFE1')
        make_price(m, Decimal('960.00'))
        make_config(product, max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)

        self.assertEqual(decision.outcome, SAFE_AUTO_UPDATE)
        self.assertEqual(decision.final_price, Decimal('960.00'))

    def test_large_increase_blocked(self):
        product = make_product(name='Blocked Increase Product', price=Decimal('500.00'))
        m = make_mapping(product, platform='amazon', external_id='B0INCR1')
        make_price(m, Decimal('900.00'))  # +80%
        make_config(product, max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)

        self.assertEqual(decision.outcome, NEEDS_APPROVAL)
        self.assertIn('exceeds the maximum automatic increase', decision.reason)

    def test_no_valid_data_is_no_action_not_needs_approval(self):
        product = make_product(name='No Data Product')
        make_config(product)
        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        self.assertEqual(decision.outcome, NO_ACTION)
        self.assertIsNone(decision.final_price)

    def test_suggested_equals_current_is_no_action(self):
        product = make_product(name='No Change Product', price=Decimal('700.00'))
        m = make_mapping(product, platform='flipkart', external_id='FKNOCHANGE')
        make_price(m, Decimal('700.00'))
        make_config(product)
        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        self.assertEqual(decision.outcome, NO_ACTION)
        self.assertEqual(decision.change_percent, Decimal('0.00'))


class MinimumMarginTests(TestCase):
    def test_exact_spec_example_margin_clamp(self):
        """Cost price = 1,200, minimum margin = 10% -> floor = 1,320.
        Target price = 1,250 must be clamped UP to 1,320, and still
        auto-applies (a margin floor is a hard rule, not a judgment call)."""
        product = make_product(name='Margin Clamp Product', price=Decimal('1400.00'))
        m = make_mapping(product, platform='amazon', external_id='B0MARGIN1')
        make_price(m, Decimal('1250.00'))
        make_config(
            product, cost_price=Decimal('1200.00'), minimum_margin_percentage=Decimal('10.00'),
            max_auto_decrease_percent=Decimal('20.00'), max_auto_increase_percent=Decimal('20.00'),
        )

        result = calculate_suggested_price(product)
        self.assertEqual(result.suggested_price, Decimal('1250.00'))

        decision = evaluate_pricing_result(product, result)
        self.assertEqual(decision.outcome, SAFE_AUTO_UPDATE)
        self.assertEqual(decision.final_price, Decimal('1320.00'))
        self.assertTrue(decision.margin_clamped)

    def test_minimum_selling_price_stricter_than_margin_wins(self):
        product = make_product(name='Stricter Floor Product', price=Decimal('1400.00'))
        m = make_mapping(product, platform='amazon', external_id='B0FLOOR1')
        make_price(m, Decimal('1100.00'))
        make_config(
            product, cost_price=Decimal('1000.00'), minimum_margin_percentage=Decimal('10.00'),  # margin floor = 1100
            minimum_selling_price=Decimal('1250.00'),  # stricter floor
            max_auto_decrease_percent=Decimal('20.00'), max_auto_increase_percent=Decimal('20.00'),
        )

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        self.assertEqual(decision.final_price, Decimal('1250.00'))
        self.assertTrue(decision.margin_clamped)

    def test_no_margin_configured_no_clamping(self):
        product = make_product(name='No Margin Product', price=Decimal('1000.00'))
        m = make_mapping(product, platform='amazon', external_id='B0NOMARGIN')
        make_price(m, Decimal('950.00'))
        make_config(product)  # no cost_price / minimum_margin_percentage set

        result = calculate_suggested_price(product)
        decision = evaluate_pricing_result(product, result)
        self.assertFalse(decision.margin_clamped)
        self.assertEqual(decision.final_price, Decimal('950.00'))
