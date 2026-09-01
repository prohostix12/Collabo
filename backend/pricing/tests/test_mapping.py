"""✓ Product mapping works
✓ Variant matching works

Collabo has no SKU/GTIN/variant model — a "variant" is just a separate
Product row (e.g. "iPhone 16 128GB" and "iPhone 16 256GB" are two different
Product ids). Since matching is explicit admin mapping keyed by product_id
(not by name), variant-safety is a property of the architecture — these
tests prove it holds: two similarly-named products' competitor data never
bleed into each other.
"""

from decimal import Decimal

from django.test import TestCase
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from pricing.models import CompetitorProductMapping
from pricing.pricing_service import calculate_suggested_price
from pricing.serializers import CompetitorProductMappingSerializer

from .factories import make_admin_user, make_mapping, make_price, make_product


class CompetitorProductMappingModelTests(TestCase):
    """Product mapping works — constraint-level checks."""

    def setUp(self):
        self.product = make_product(name='Mapping Test Product')

    def test_duplicate_platform_for_same_product_rejected_at_db_level(self):
        make_mapping(self.product, platform='amazon', external_id='B0FIRST')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                CompetitorProductMapping.objects.create(
                    product=self.product, platform='amazon', external_product_id='B0SECOND',
                    match_method='manual',
                )

    def test_duplicate_external_id_on_same_platform_rejected_at_db_level(self):
        other_product = make_product(name='Other Product')
        make_mapping(self.product, platform='amazon', external_id='B0SHARED')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                CompetitorProductMapping.objects.create(
                    product=other_product, platform='amazon', external_product_id='B0SHARED',
                    match_method='manual',
                )

    def test_same_product_can_map_to_both_platforms(self):
        make_mapping(self.product, platform='amazon', external_id='B0BOTH')
        make_mapping(self.product, platform='flipkart', external_id='FKBOTH')
        self.assertEqual(self.product.competitor_mappings.count(), 2)


class CompetitorProductMappingSerializerTests(TestCase):
    """Product mapping works — the serializer-level validation the API relies on."""

    def setUp(self):
        self.product = make_product(name='Serializer Test Product')

    def test_duplicate_product_platform_rejected_with_clear_message(self):
        make_mapping(self.product, platform='amazon', external_id='B0EXIST')
        serializer = CompetitorProductMappingSerializer(data={
            'product': self.product.id, 'platform': 'amazon',
            'external_product_id': 'B0DIFFERENT', 'match_method': 'manual',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('platform', serializer.errors)

    def test_duplicate_external_id_rejected_with_clear_message(self):
        make_mapping(self.product, platform='amazon', external_id='B0SHARED2')
        other_product = make_product(name='Another Product')
        serializer = CompetitorProductMappingSerializer(data={
            'product': other_product.id, 'platform': 'amazon',
            'external_product_id': 'B0SHARED2', 'match_method': 'manual',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('external_product_id', serializer.errors)

    def test_valid_mapping_passes(self):
        serializer = CompetitorProductMappingSerializer(data={
            'product': self.product.id, 'platform': 'flipkart',
            'external_product_id': 'FKVALID001', 'match_method': 'manual',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)


class CompetitorMappingAPITests(TestCase):
    """Product mapping works — the full HTTP stack, including the admin-only
    permission gate."""

    def setUp(self):
        self.admin = make_admin_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.product = make_product(name='API Test Product')

    def test_create_verify_and_list_via_api(self):
        create_resp = self.client.post('/api/pricing/competitor-mappings/', {
            'product': self.product.id, 'platform': 'amazon',
            'external_product_id': 'B0APICREATE', 'match_method': 'manual',
        })
        self.assertEqual(create_resp.status_code, 201, create_resp.data)
        mapping_id = create_resp.data['id']
        self.assertFalse(create_resp.data['is_verified'])

        verify_resp = self.client.post(f'/api/pricing/competitor-mappings/{mapping_id}/verify/')
        self.assertEqual(verify_resp.status_code, 200)
        self.assertTrue(verify_resp.data['is_verified'])

        list_resp = self.client.get('/api/pricing/competitor-mappings/', {'product': self.product.id})
        self.assertEqual(list_resp.status_code, 200)

    def test_non_admin_forbidden(self):
        from .factories import make_non_admin_user
        buyer = make_non_admin_user()
        client = APIClient()
        client.force_authenticate(user=buyer)
        resp = client.get('/api/pricing/competitor-mappings/')
        self.assertEqual(resp.status_code, 403)

    def test_unauthenticated_rejected(self):
        client = APIClient()
        resp = client.get('/api/pricing/competitor-mappings/')
        self.assertEqual(resp.status_code, 401)


class VariantIsolationTests(TestCase):
    """Variant matching works — two products with near-identical names must
    never share competitor data or pricing calculations, exactly the
    iPhone-16-128GB-vs-256GB scenario from the spec."""

    def test_similar_products_have_fully_isolated_pricing(self):
        product_128gb = make_product(name='iPhone 16 128GB Black', brand='Apple', price=Decimal('79900.00'))
        product_256gb = make_product(name='iPhone 16 256GB Black', brand='Apple', price=Decimal('89900.00'))

        mapping_128 = make_mapping(product_128gb, platform='amazon', external_id='B0IPHONE128')
        mapping_256 = make_mapping(product_256gb, platform='amazon', external_id='B0IPHONE256')

        make_price(mapping_128, Decimal('75000.00'))  # 128GB variant's own competitor price
        make_price(mapping_256, Decimal('85000.00'))  # 256GB variant's own competitor price

        from .factories import make_config
        make_config(product_128gb)
        make_config(product_256gb)

        result_128 = calculate_suggested_price(product_128gb)
        result_256 = calculate_suggested_price(product_256gb)

        # Each product's suggestion must come ONLY from its own mapping's price
        self.assertEqual(result_128.lowest_competitor_price, Decimal('75000.00'))
        self.assertEqual(result_256.lowest_competitor_price, Decimal('85000.00'))
        self.assertEqual(len(result_128.quotes), 1)
        self.assertEqual(len(result_256.quotes), 1)

        # And the 128GB product's quote must not even reference the 256GB mapping
        self.assertEqual(result_128.quotes[0].mapping_id, mapping_128.id)
        self.assertNotEqual(result_128.quotes[0].mapping_id, mapping_256.id)

    def test_deleting_one_variants_mapping_does_not_affect_the_other(self):
        product_a = make_product(name='Samsung TV 55 inch', price=Decimal('50000.00'))
        product_b = make_product(name='Samsung TV 65 inch', price=Decimal('70000.00'))

        mapping_a = make_mapping(product_a, platform='flipkart', external_id='FKTV55')
        mapping_b = make_mapping(product_b, platform='flipkart', external_id='FKTV65')
        make_price(mapping_a, Decimal('48000.00'))
        make_price(mapping_b, Decimal('65000.00'))

        mapping_a.delete()

        from .factories import make_config
        make_config(product_a)
        make_config(product_b)

        result_a = calculate_suggested_price(product_a)
        result_b = calculate_suggested_price(product_b)

        self.assertFalse(result_a.has_valid_data)  # its only mapping is gone
        self.assertTrue(result_b.has_valid_data)   # completely unaffected
        self.assertEqual(result_b.lowest_competitor_price, Decimal('65000.00'))
