"""✓ API failure works
✓ One marketplace failure doesn't stop the other
"""

from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase

from pricing.fetch_service import (
    fetch_price_for_mapping,
    fetch_prices_for_active_products,
    fetch_prices_for_mappings,
)
from pricing.models import CompetitorPrice, PricingSyncSettings
from pricing.providers.base import CompetitorPriceResult

from .factories import make_config, make_mapping, make_product


class ApiFailureTests(TestCase):
    def setUp(self):
        self.product = make_product(name='Fetch Failure Product')
        self.mapping = make_mapping(self.product, platform='amazon', external_id='B0FAIL001')

    def test_not_configured_provider_recorded_as_failed_fetch(self):
        row = fetch_price_for_mapping(self.mapping)
        self.assertFalse(row.fetch_succeeded)
        self.assertIn('not configured', row.error_message.lower())
        self.assertIsInstance(row, CompetitorPrice)

    @patch('pricing.providers.amazon.AmazonProvider.is_configured', return_value=True)
    @patch('pricing.providers.amazon.AmazonProvider.get_product_price')
    def test_provider_exception_does_not_crash_fetch_service(self, mock_fetch, _mock_configured):
        mock_fetch.side_effect = RuntimeError('connection reset')
        row = fetch_price_for_mapping(self.mapping)  # must not raise
        self.assertFalse(row.fetch_succeeded)
        self.assertIn('connection reset', row.error_message)

    @patch('pricing.providers.amazon.AmazonProvider.is_configured', return_value=True)
    @patch('pricing.providers.amazon.AmazonProvider.get_product_price')
    def test_negative_price_normalized_to_failure(self, mock_fetch, _mock_configured):
        mock_fetch.return_value = CompetitorPriceResult(success=True, price=Decimal('-10.00'), availability='available')
        row = fetch_price_for_mapping(self.mapping)
        self.assertFalse(row.fetch_succeeded)
        self.assertIn('invalid price', row.error_message.lower())

    def test_inactive_mapping_skipped_without_calling_provider(self):
        self.mapping.is_active = False
        self.mapping.save(update_fields=['is_active'])
        with patch('pricing.providers.amazon.AmazonProvider.get_product_price') as mock_fetch:
            row = fetch_price_for_mapping(self.mapping)
            mock_fetch.assert_not_called()
        self.assertFalse(row.fetch_succeeded)
        self.assertIn('inactive', row.error_message.lower())

    @patch('pricing.providers.amazon.AmazonProvider.is_configured', return_value=True)
    @patch('pricing.providers.amazon.AmazonProvider.get_product_price')
    def test_failed_fetch_never_overwrites_previous_successful_row(self, mock_fetch, _mock_configured):
        """A failed fetch must append a new failure row, never mutate or
        delete the last successful CompetitorPrice."""
        mock_fetch.return_value = CompetitorPriceResult(success=True, price=Decimal('500.00'), availability='available')
        good_row = fetch_price_for_mapping(self.mapping)
        self.assertTrue(good_row.fetch_succeeded)

        mock_fetch.return_value = CompetitorPriceResult.failure('timeout')
        fail_row = fetch_price_for_mapping(self.mapping)
        self.assertFalse(fail_row.fetch_succeeded)

        good_row.refresh_from_db()
        self.assertTrue(good_row.fetch_succeeded)
        self.assertEqual(good_row.price, Decimal('500.00'))
        self.assertEqual(CompetitorPrice.objects.filter(mapping=self.mapping).count(), 2)


class OneMarketplaceFailureDoesNotStopTheOtherTests(TestCase):
    def setUp(self):
        self.product = make_product(name='Mixed Result Product')
        self.m_amazon = make_mapping(self.product, platform='amazon', external_id='B0MIXED1')
        self.m_flipkart = make_mapping(self.product, platform='flipkart', external_id='FKMIXED1')

    @patch('pricing.providers.amazon.AmazonProvider.is_configured', return_value=True)
    @patch('pricing.providers.amazon.AmazonProvider.get_product_price')
    @patch('pricing.providers.flipkart.FlipkartProvider.is_configured', return_value=True)
    @patch('pricing.providers.flipkart.FlipkartProvider.get_product_price')
    def test_amazon_fails_flipkart_still_processed(self, mock_fk, _mock_fk_conf, mock_amz, _mock_amz_conf):
        mock_amz.side_effect = RuntimeError('Amazon API down')
        mock_fk.return_value = CompetitorPriceResult(success=True, price=Decimal('300.00'), availability='available')

        summary = fetch_prices_for_mappings([self.m_amazon, self.m_flipkart])

        self.assertEqual(summary, {'succeeded': 1, 'failed': 1, 'total': 2})
        mock_amz.assert_called_once()
        mock_fk.assert_called_once()

        amazon_row = CompetitorPrice.objects.get(mapping=self.m_amazon)
        flipkart_row = CompetitorPrice.objects.get(mapping=self.m_flipkart)
        self.assertFalse(amazon_row.fetch_succeeded)
        self.assertTrue(flipkart_row.fetch_succeeded)
        self.assertEqual(flipkart_row.price, Decimal('300.00'))

    @patch('pricing.providers.amazon.AmazonProvider.is_configured', return_value=True)
    @patch('pricing.providers.amazon.AmazonProvider.get_product_price')
    @patch('pricing.providers.flipkart.FlipkartProvider.is_configured', return_value=True)
    @patch('pricing.providers.flipkart.FlipkartProvider.get_product_price')
    def test_bulk_sync_only_touches_eligible_mappings(self, mock_fk, _mock_fk_conf, mock_amz, _mock_amz_conf):
        make_config(self.product, auto_pricing_enabled=True)
        self.m_amazon.is_verified = True
        self.m_amazon.save()
        self.m_flipkart.is_verified = True
        self.m_flipkart.save()

        disabled_product = make_product(name='Disabled Product')
        disabled_mapping = make_mapping(disabled_product, platform='amazon', external_id='B0DISABLED')
        make_config(disabled_product, auto_pricing_enabled=False)

        mock_amz.return_value = CompetitorPriceResult(success=True, price=Decimal('100.00'), availability='available')
        mock_fk.return_value = CompetitorPriceResult(success=True, price=Decimal('95.00'), availability='available')

        summary = fetch_prices_for_active_products()

        self.assertEqual(summary['total'], 2)
        self.assertEqual(mock_amz.call_count, 1)
        self.assertEqual(mock_fk.call_count, 1)
        self.assertFalse(CompetitorPrice.objects.filter(mapping=disabled_mapping).exists())

    def test_global_kill_switch_halts_bulk_sync_entirely(self):
        make_config(self.product, auto_pricing_enabled=True)
        self.m_amazon.is_verified = True
        self.m_amazon.save()

        settings_row = PricingSyncSettings.get_settings()
        settings_row.global_auto_pricing_enabled = False
        settings_row.save()

        with patch('pricing.providers.amazon.AmazonProvider.get_product_price') as mock_amz:
            summary = fetch_prices_for_active_products()
            mock_amz.assert_not_called()

        self.assertTrue(summary.get('skipped'))
