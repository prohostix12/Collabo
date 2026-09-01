"""✓ Celery task works

Calls run_dynamic_pricing_sync() directly (synchronous — this is the
standard way to test Celery task logic without a running broker) and proves
the full pipeline behaves correctly end to end: fetch -> save -> calculate ->
validate -> update or approval.
"""

from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase

from pricing.models import (
    CompetitorPrice,
    PendingPriceApproval,
    PriceChangeHistory,
    PricingSyncSettings,
)
from pricing.providers.base import CompetitorPriceResult
from pricing.tasks import run_dynamic_pricing_sync

from .factories import make_config, make_mapping, make_product


class DynamicPricingSyncTaskTests(TestCase):
    def setUp(self):
        self.p_safe = make_product(name='Safe Sync Product', price=Decimal('1000.00'))
        self.m_safe = make_mapping(self.p_safe, platform='amazon', external_id='B0SYNCSAFE')
        make_config(self.p_safe, auto_pricing_enabled=True,
                    max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        self.p_unsafe = make_product(name='Unsafe Sync Product', price=Decimal('5000.00'))
        self.m_unsafe = make_mapping(self.p_unsafe, platform='flipkart', external_id='FKSYNCUNSAFE')
        make_config(self.p_unsafe, auto_pricing_enabled=True,
                    max_auto_decrease_percent=Decimal('10.00'), max_auto_increase_percent=Decimal('10.00'))

        self.p_disabled = make_product(name='Disabled Sync Product', price=Decimal('300.00'))
        self.m_disabled = make_mapping(self.p_disabled, platform='amazon', external_id='B0SYNCDISABLED')
        make_config(self.p_disabled, auto_pricing_enabled=False)

    def _run_with_mocks(self, amazon_side_effect=None, flipkart_side_effect=None):
        with patch('pricing.providers.amazon.AmazonProvider.is_configured', return_value=True), \
             patch('pricing.providers.amazon.AmazonProvider.get_product_price') as mock_amz, \
             patch('pricing.providers.flipkart.FlipkartProvider.is_configured', return_value=True), \
             patch('pricing.providers.flipkart.FlipkartProvider.get_product_price') as mock_fk:
            if amazon_side_effect is not None:
                mock_amz.side_effect = amazon_side_effect
            if flipkart_side_effect is not None:
                mock_fk.side_effect = flipkart_side_effect
            summary = run_dynamic_pricing_sync()
            return summary, mock_amz, mock_fk

    def test_full_pipeline_safe_update_and_pending_approval(self):
        def amazon_effect(mapping):
            if mapping.id == self.m_safe.id:
                return CompetitorPriceResult(success=True, price=Decimal('960.00'), availability='available')
            raise AssertionError('Amazon should not be called for a non-Amazon mapping')

        def flipkart_effect(mapping):
            if mapping.id == self.m_unsafe.id:
                return CompetitorPriceResult(success=True, price=Decimal('2000.00'), availability='available')
            raise AssertionError('Flipkart should not be called for a non-Flipkart mapping')

        summary, mock_amz, mock_fk = self._run_with_mocks(amazon_effect, flipkart_effect)

        self.assertEqual(mock_amz.call_count, 1)
        self.assertEqual(mock_fk.call_count, 1)
        self.assertEqual(summary['updated'], 1)
        self.assertEqual(summary['pending_approval'], 1)

        self.p_safe.refresh_from_db()
        self.assertEqual(self.p_safe.discount_price, Decimal('960.00'))
        self.assertTrue(PriceChangeHistory.objects.filter(product=self.p_safe).exists())

        self.p_unsafe.refresh_from_db()
        self.assertEqual(self.p_unsafe.discount_price, Decimal('5000.00'))
        approval = PendingPriceApproval.objects.get(product=self.p_unsafe, status=PendingPriceApproval.PENDING)
        self.assertEqual(approval.suggested_price, Decimal('2000.00'))

    def test_disabled_product_never_fetched_or_touched(self):
        with patch('pricing.providers.amazon.AmazonProvider.get_product_price') as mock_amz:
            run_dynamic_pricing_sync()
            for call in mock_amz.call_args_list:
                mapping_arg = call.args[0]
                self.assertNotEqual(mapping_arg.id, self.m_disabled.id)

        self.p_disabled.refresh_from_db()
        self.assertEqual(self.p_disabled.discount_price, Decimal('300.00'))
        self.assertFalse(CompetitorPrice.objects.filter(product=self.p_disabled).exists())

    def test_second_run_refreshes_pending_approval_instead_of_duplicating(self):
        self._run_with_mocks(
            amazon_side_effect=lambda m: CompetitorPriceResult(success=True, price=Decimal('960.00'), availability='available'),
            flipkart_side_effect=lambda m: CompetitorPriceResult(success=True, price=Decimal('2000.00'), availability='available'),
        )
        self._run_with_mocks(
            amazon_side_effect=lambda m: CompetitorPriceResult(success=True, price=Decimal('955.00'), availability='available'),
            flipkart_side_effect=lambda m: CompetitorPriceResult(success=True, price=Decimal('1900.00'), availability='available'),
        )

        pending_rows = PendingPriceApproval.objects.filter(product=self.p_unsafe, status=PendingPriceApproval.PENDING)
        self.assertEqual(pending_rows.count(), 1)
        self.assertEqual(pending_rows.first().suggested_price, Decimal('1900.00'))

        history_rows = PriceChangeHistory.objects.filter(product=self.p_safe)
        self.assertEqual(history_rows.count(), 2, 'history must stay append-only across runs')

    def test_global_kill_switch_stops_entire_pipeline(self):
        sync_settings = PricingSyncSettings.get_settings()
        sync_settings.global_auto_pricing_enabled = False
        sync_settings.save()

        with patch('pricing.providers.amazon.AmazonProvider.get_product_price') as mock_amz, \
             patch('pricing.providers.flipkart.FlipkartProvider.get_product_price') as mock_fk:
            summary = run_dynamic_pricing_sync()
            mock_amz.assert_not_called()
            mock_fk.assert_not_called()

        self.assertTrue(summary.get('skipped'))

    def test_one_platform_failing_does_not_stop_the_sync(self):
        summary, mock_amz, mock_fk = self._run_with_mocks(
            amazon_side_effect=RuntimeError('Amazon API down'),
            flipkart_side_effect=lambda m: CompetitorPriceResult(success=True, price=Decimal('2000.00'), availability='available'),
        )
        # Amazon's failure must not prevent Flipkart's product from being evaluated
        self.assertEqual(summary['fetch']['failed'], 1)
        self.assertEqual(summary['fetch']['succeeded'], 1)
        self.assertGreaterEqual(summary['pending_approval'] + summary['updated'] + summary['no_action'], 1)
