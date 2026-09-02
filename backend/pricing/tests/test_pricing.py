from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from ecommerce.models import Product

from ..brightdata_client import BrightDataError
from ..models import CompetitorLink, CompetitorPriceHistory
from ..parsers import parse_amazon, parse_flipkart
from ..services import check_link, sync_all_active_links


def make_product(**kwargs):
    seller = User.objects.create_user(username='seller1', password='pw', email='seller1@example.com')
    defaults = dict(
        seller=seller, name='Test Widget', category='Electronics',
        price=Decimal('1000.00'), discount_price=Decimal('900.00'), description='desc',
    )
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


class ParserTests(TestCase):
    def test_parse_amazon_price_and_stock(self):
        html = '''
        <div id="corePriceDisplay_desktop_feature_div">
          <span class="a-price"><span class="a-offscreen">₹1,234.00</span></span>
        </div>
        <div id="availability"><span>In Stock.</span></div>
        '''
        result = parse_amazon(html)
        self.assertEqual(result.price, Decimal('1234.00'))
        self.assertTrue(result.in_stock)

    def test_parse_amazon_out_of_stock(self):
        html = '<div id="availability"><span>Currently unavailable.</span></div>'
        result = parse_amazon(html)
        self.assertIsNone(result.price)
        self.assertFalse(result.in_stock)

    def test_parse_flipkart_price(self):
        html = '<div class="_25b18c"><div class="Nx9bqj">₹2,499</div></div>'
        result = parse_flipkart(html)
        self.assertEqual(result.price, Decimal('2499'))
        self.assertTrue(result.in_stock)

    def test_parse_flipkart_sold_out(self):
        html = '<div class="_16FRp0">SOLD OUT</div>'
        result = parse_flipkart(html)
        self.assertIsNone(result.price)
        self.assertFalse(result.in_stock)


class ServiceTests(TestCase):
    def setUp(self):
        self.product = make_product()
        self.link = CompetitorLink.objects.create(
            product=self.product, platform='amazon',
            product_url='https://www.amazon.in/dp/TEST123',
        )

    @patch('pricing.services.brightdata_client.fetch_html')
    def test_check_link_success_updates_cache_and_history(self, mock_fetch):
        mock_fetch.return_value = (
            '<span class="a-price"><span class="a-offscreen">₹1,500.00</span></span>'
            '<div id="availability"><span>In Stock.</span></div>'
        )
        history = check_link(self.link)

        self.assertTrue(history.success)
        self.assertEqual(history.price, Decimal('1500.00'))
        self.link.refresh_from_db()
        self.assertEqual(self.link.last_price, Decimal('1500.00'))
        self.assertTrue(self.link.last_in_stock)
        self.assertIsNotNone(self.link.last_checked_at)
        self.assertEqual(CompetitorPriceHistory.objects.filter(link=self.link).count(), 1)

    @patch('pricing.services.brightdata_client.fetch_html')
    def test_check_link_failure_keeps_last_known_price(self, mock_fetch):
        self.link.last_price = Decimal('999.00')
        self.link.last_in_stock = True
        self.link.save(update_fields=['last_price', 'last_in_stock'])
        mock_fetch.side_effect = BrightDataError('boom')

        history = check_link(self.link)

        self.assertFalse(history.success)
        self.link.refresh_from_db()
        # last-good price/availability survive a failed check
        self.assertEqual(self.link.last_price, Decimal('999.00'))
        self.assertTrue(self.link.last_in_stock)
        self.assertIn('boom', self.link.last_error)

    @patch('pricing.services.brightdata_client.fetch_html')
    def test_sync_all_active_links_skips_inactive(self, mock_fetch):
        mock_fetch.return_value = '<span class="a-offscreen">₹1,000.00</span>'
        inactive = CompetitorLink.objects.create(
            product=self.product, platform='flipkart',
            product_url='https://www.flipkart.com/p/TEST', is_active=False,
        )
        summary = sync_all_active_links()

        self.assertEqual(summary['checked'], 1)
        mock_fetch.assert_called_once_with(self.link.product_url)
        inactive.refresh_from_db()
        self.assertIsNone(inactive.last_checked_at)

    def test_never_writes_to_product_price(self):
        """Guards the hard requirement: this app must never change Collabo's
        own product price, no matter what a competitor check returns."""
        original_price = self.product.price
        original_discount = self.product.discount_price
        with patch('pricing.services.brightdata_client.fetch_html') as mock_fetch:
            mock_fetch.return_value = '<span class="a-offscreen">₹1.00</span>'
            check_link(self.link)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, original_price)
        self.assertEqual(self.product.discount_price, original_discount)


class ComparisonViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.product = make_product()
        CompetitorLink.objects.create(
            product=self.product, platform='amazon',
            product_url='https://www.amazon.in/dp/TEST123',
            last_price=Decimal('1100.00'), last_in_stock=True,
        )
        CompetitorLink.objects.create(
            product=self.product, platform='flipkart',
            product_url='https://www.flipkart.com/p/TEST', is_active=False,
        )

    def test_returns_collabo_price_and_active_competitors_only(self):
        url = reverse('pricing-compare', args=[self.product.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['product_id'], self.product.id)
        self.assertEqual(Decimal(response.data['collabo_price']), self.product.discount_price)
        platforms = [c['platform'] for c in response.data['competitors']]
        self.assertEqual(platforms, ['amazon'])

    def test_404_for_unknown_product(self):
        url = reverse('pricing-compare', args=[999999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
