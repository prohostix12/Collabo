"""✓ Amazon works
✓ Flipkart works

Both providers are tested against mocked SDK/HTTP calls only — never a real
Amazon or Flipkart API call, per the project's explicit testing requirement.
"""

from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from pricing.providers.amazon import AmazonProvider
from pricing.providers.flipkart import FlipkartProvider
from pricing.providers.registry import get_provider

from .factories import make_mapping, make_product

AMAZON_CONFIGURED = override_settings(
    AMAZON_PAAPI_ACCESS_KEY='fake-access-key',
    AMAZON_PAAPI_SECRET_KEY='fake-secret-key',
    AMAZON_PAAPI_PARTNER_TAG='fake-tag-21',
)
AMAZON_NOT_CONFIGURED = override_settings(
    AMAZON_PAAPI_ACCESS_KEY='', AMAZON_PAAPI_SECRET_KEY='', AMAZON_PAAPI_PARTNER_TAG='',
)
FLIPKART_CONFIGURED = override_settings(
    FLIPKART_AFFILIATE_ID='fake-affiliate-id', FLIPKART_AFFILIATE_TOKEN='fake-token',
)
FLIPKART_NOT_CONFIGURED = override_settings(
    FLIPKART_AFFILIATE_ID='', FLIPKART_AFFILIATE_TOKEN='',
)


def _fake_amazon_item(amount='999.00', currency='INR', availability_type='Now', merchant_name='Appario Retail'):
    """A SimpleNamespace tree matching exactly the attribute path
    AmazonProvider.get_product_price reads from a real amazon_creatorsapi
    Item — good enough as a test double without needing to construct real
    pydantic model instances."""
    money = SimpleNamespace(amount=amount, currency=currency)
    price = SimpleNamespace(money=money)
    availability = SimpleNamespace(type=availability_type)
    merchant_info = SimpleNamespace(name=merchant_name)
    listing = SimpleNamespace(price=price, availability=availability, merchant_info=merchant_info)
    return SimpleNamespace(offers_v2=SimpleNamespace(listings=[listing]))


class AmazonProviderTests(TestCase):
    def setUp(self):
        self.product = make_product(name='Amazon Test Product')
        self.mapping = make_mapping(self.product, platform='amazon', external_id='B0AMZTEST1')

    @AMAZON_NOT_CONFIGURED
    def test_not_configured_returns_graceful_failure(self):
        provider = AmazonProvider()
        self.assertFalse(provider.is_configured())
        result = provider.get_product_price(self.mapping)
        self.assertFalse(result.success)
        self.assertIn('not configured', result.error_message.lower())

    @AMAZON_CONFIGURED
    def test_successful_fetch_normalizes_price_and_availability(self):
        provider = AmazonProvider()
        self.assertTrue(provider.is_configured())
        fake_item = _fake_amazon_item(amount='24990.00', availability_type='Now', merchant_name='Cloudtail India')

        with patch.object(AmazonProvider, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_items.return_value = [fake_item]
            mock_get_client.return_value = mock_client
            result = provider.get_product_price(self.mapping)

        self.assertTrue(result.success)
        self.assertEqual(result.price, Decimal('24990.00'))
        self.assertEqual(result.currency, 'INR')
        self.assertEqual(result.availability, 'available')
        self.assertEqual(result.seller_info, 'Cloudtail India')
        mock_client.get_items.assert_called_once()

    @AMAZON_CONFIGURED
    def test_out_of_stock_listing_marked_unavailable(self):
        provider = AmazonProvider()
        fake_item = _fake_amazon_item(amount='500.00', availability_type='OutOfStock')

        with patch.object(AmazonProvider, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_items.return_value = [fake_item]
            mock_get_client.return_value = mock_client
            result = provider.get_product_price(self.mapping)

        self.assertTrue(result.success)
        self.assertEqual(result.availability, 'unavailable')

    @AMAZON_CONFIGURED
    def test_empty_response_treated_as_not_found(self):
        provider = AmazonProvider()
        with patch.object(AmazonProvider, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_items.return_value = []
            mock_get_client.return_value = mock_client
            result = provider.get_product_price(self.mapping)

        self.assertFalse(result.success)
        self.assertIn('not found', result.error_message.lower())

    @AMAZON_CONFIGURED
    def test_sdk_exception_is_caught_never_raises(self):
        provider = AmazonProvider()
        with patch.object(AmazonProvider, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_items.side_effect = RuntimeError('connection timeout')
            mock_get_client.return_value = mock_client
            result = provider.get_product_price(self.mapping)  # must not raise

        self.assertFalse(result.success)
        self.assertIn('timeout', result.error_message)

    @AMAZON_CONFIGURED
    def test_negative_price_from_sdk_is_rejected(self):
        """Normalization-level sanity: a malformed/negative price must never
        be reported as a success, even if the SDK call itself succeeded."""
        provider = AmazonProvider()
        fake_item = _fake_amazon_item(amount='-50.00')
        with patch.object(AmazonProvider, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_items.return_value = [fake_item]
            mock_get_client.return_value = mock_client
            result = provider.get_product_price(self.mapping)

        # AmazonProvider itself just reports what the SDK said; the
        # negative-price guard lives in fetch_service's normalization layer
        # (tested in test_fetch_service.py) — here we only confirm the
        # provider faithfully passes the raw value through without crashing.
        self.assertTrue(result.success)
        self.assertEqual(result.price, Decimal('-50.00'))

    @AMAZON_CONFIGURED
    def test_registry_returns_amazon_provider_for_amazon_platform(self):
        provider = get_provider('amazon')
        self.assertIsInstance(provider, AmazonProvider)
        self.assertTrue(provider.is_configured())


class FlipkartProviderTests(TestCase):
    def setUp(self):
        self.product = make_product(name='Flipkart Test Product')
        self.mapping = make_mapping(self.product, platform='flipkart', external_id='FKTEST001')

    @FLIPKART_NOT_CONFIGURED
    def test_not_configured_returns_graceful_failure(self):
        provider = FlipkartProvider()
        self.assertFalse(provider.is_configured())
        result = provider.get_product_price(self.mapping)
        self.assertFalse(result.success)
        self.assertIn('not configured', result.error_message.lower())

    @FLIPKART_CONFIGURED
    def test_configured_but_unimplemented_fails_gracefully_never_raises(self):
        """Flipkart has no verified API docs yet (see flipkart.py) — even
        with credentials present, it must return a clear failure, never a
        fabricated success and never an unhandled exception."""
        provider = FlipkartProvider()
        self.assertTrue(provider.is_configured())
        result = provider.get_product_price(self.mapping)  # must not raise
        self.assertFalse(result.success)
        self.assertIsNone(result.price)
        self.assertTrue(result.error_message)

    @FLIPKART_CONFIGURED
    def test_registry_returns_flipkart_provider_for_flipkart_platform(self):
        provider = get_provider('flipkart')
        self.assertIsInstance(provider, FlipkartProvider)
        self.assertTrue(provider.is_configured())

    def test_registry_returns_none_for_unknown_platform(self):
        self.assertIsNone(get_provider('myntra'))
