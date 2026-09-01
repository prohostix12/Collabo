"""✓ Lowest price calculation works

Covers every pricing_strategy and the COMPETITOR PRICE VALIDATION gate
(availability, staleness, verification) that decides what counts as a valid
quote in the first place.
"""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from pricing.models import ProductPricingConfig
from pricing.pricing_service import calculate_suggested_price

from .factories import make_config, make_mapping, make_price, make_product


class PricingEngineTests(TestCase):
    def setUp(self):
        self.product = make_product(name='Sony XM5', price=Decimal('28999.00'))
        self.m_amazon = make_mapping(self.product, platform='amazon', external_id='B0SONYAMZ')
        self.m_flipkart = make_mapping(self.product, platform='flipkart', external_id='FKSONYFK')
        make_price(self.m_amazon, Decimal('29499.00'))
        make_price(self.m_flipkart, Decimal('28499.00'))

    def test_exact_spec_example_undercut_amount(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_UNDERCUT_AMOUNT,
                    undercut_amount=Decimal('100.00'))
        result = calculate_suggested_price(self.product)
        self.assertTrue(result.has_valid_data)
        self.assertEqual(result.lowest_competitor_price, Decimal('28499.00'))
        self.assertEqual(result.lowest_competitor_platform, 'flipkart')
        self.assertEqual(result.suggested_price, Decimal('28399.00'))

    def test_match_lowest_strategy(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_LOWEST)
        result = calculate_suggested_price(self.product)
        self.assertEqual(result.suggested_price, Decimal('28499.00'))

    def test_match_average_strategy(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_AVERAGE)
        result = calculate_suggested_price(self.product)
        self.assertEqual(result.suggested_price, Decimal('28999.00'))

    def test_undercut_percent_strategy(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_UNDERCUT_PERCENT,
                    undercut_percentage=Decimal('2.00'))
        result = calculate_suggested_price(self.product)
        expected = (Decimal('28499.00') * Decimal('98') / Decimal('100')).quantize(Decimal('0.01'))
        self.assertEqual(result.suggested_price, expected)

    def test_keep_current_strategy_suggests_no_change(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_KEEP_CURRENT)
        result = calculate_suggested_price(self.product)
        self.assertEqual(result.suggested_price, self.product.discount_price)

    def test_no_config_defaults_to_keep_current_never_crashes(self):
        result = calculate_suggested_price(self.product)
        self.assertEqual(result.strategy, ProductPricingConfig.STRATEGY_KEEP_CURRENT)
        self.assertEqual(result.suggested_price, self.product.discount_price)

    def test_one_platform_unavailable_only_the_other_is_used(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_LOWEST)
        make_price(self.m_amazon, None, availability='unavailable')
        result = calculate_suggested_price(self.product)
        self.assertEqual(len(result.quotes), 1)
        self.assertEqual(result.quotes[0].platform, 'flipkart')
        self.assertEqual(result.suggested_price, Decimal('28499.00'))

    def test_both_unavailable_no_suggestion(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_LOWEST)
        make_price(self.m_amazon, None, availability='unavailable')
        make_price(self.m_flipkart, None, availability='unavailable')
        result = calculate_suggested_price(self.product)
        self.assertFalse(result.has_valid_data)
        self.assertIsNone(result.suggested_price)

    def test_stale_price_excluded(self):
        make_config(self.product, pricing_strategy=ProductPricingConfig.STRATEGY_MATCH_LOWEST)
        old_product = make_product(name='Stale Test Product')
        mapping = make_mapping(old_product, platform='amazon', external_id='B0STALE')
        make_price(mapping, Decimal('500.00'), fetched_at=timezone.now() - timedelta(minutes=500))
        make_config(old_product)
        result = calculate_suggested_price(old_product)
        self.assertFalse(result.has_valid_data)

    def test_unverified_mapping_excluded_even_with_a_great_price(self):
        product = make_product(name='Unverified Test Product')
        mapping = make_mapping(product, platform='amazon', external_id='B0UNVER', verified=False)
        make_price(mapping, Decimal('1.00'))
        make_config(product)
        result = calculate_suggested_price(product)
        self.assertFalse(result.has_valid_data)

    def test_wrong_currency_excluded(self):
        product = make_product(name='Currency Test Product')
        mapping = make_mapping(product, platform='amazon', external_id='B0USD')
        make_price(mapping, Decimal('50.00'), currency='USD')
        make_config(product)
        result = calculate_suggested_price(product)
        self.assertFalse(result.has_valid_data)

    def test_current_price_reads_discount_price_not_mrp(self):
        """Regression test for the field-selection bug found and fixed
        during STEP 9 — current_price must reflect what a customer actually
        pays (discount_price), not the MRP (price)."""
        product = make_product(name='Discount Field Test', price=Decimal('2000.00'), discount_price=Decimal('1500.00'))
        result = calculate_suggested_price(product)
        self.assertEqual(result.current_price, Decimal('1500.00'))
