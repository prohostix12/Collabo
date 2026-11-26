import hashlib
import hmac
import json
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import SellerProfile
from .models import Address, Cart, CartItem, Order, OrderItem, Product, ProductVariant

User = get_user_model()

KEY_SECRET = 'test_secret_value_1234567890'
HOOK_SECRET = 'hook_secret_value_1234567890'


def sign(order_id, payment_id, secret=KEY_SECRET):
    return hmac.new(secret.encode(), f'{order_id}|{payment_id}'.encode(), hashlib.sha256).hexdigest()


class FakeRazorpay:
    """Stands in for razorpay.Client so no real network call is made."""

    def __init__(self, payment, order):
        self._payment, self._order = payment, order
        self.payment = mock.Mock(fetch=lambda pid: self._payment)
        self.order = mock.Mock(fetch=lambda oid: self._order)


@override_settings(RAZORPAY_KEY_ID='rzp_live_testkey', RAZORPAY_KEY_SECRET=KEY_SECRET,
                   RAZORPAY_WEBHOOK_SECRET=HOOK_SECRET, DEBUG=False, ALLOWED_HOSTS=['*'])
class RazorpayFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='buyer@example.com', username='buyer', password='pass12345!', user_type='buyer')
        self.other = User.objects.create_user(email='other@example.com', username='other', password='pass12345!', user_type='buyer')
        seller = User.objects.create_user(email='seller@example.com', username='seller', password='pass12345!', user_type='seller')
        self.product = Product.objects.create(seller=seller, name='Test item', category='Kids', price=Decimal('500'),
                                              discount_price=Decimal('400'), stock=10)
        self.addr = Address.objects.create(user=self.user, name='Buyer', phone='9999999999', street_address='1 St',
                                           city='Kochi', state='Kerala', postal_code='682001')
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def _verify(self, payment_id='pay_1', order_id='order_1', sig=None, payment=None, rzp_order=None, user_id=None):
        payment = payment or {'order_id': order_id, 'status': 'captured', 'amount': 99900}
        rzp_order = rzp_order or {'notes': {'user_id': str(user_id or self.user.id)}}
        body = {'razorpay_order_id': order_id, 'razorpay_payment_id': payment_id,
                'razorpay_signature': sig or sign(order_id, payment_id), 'address': self.addr.id}
        with mock.patch('ecommerce.views.razorpay.Client', return_value=FakeRazorpay(payment, rzp_order)):
            return self.client.post('/api/ecommerce/razorpay/verify-payment/', body, format='json')

    def test_valid_payment_creates_one_order_with_references(self):
        r = self._verify()
        self.assertEqual(r.status_code, 200, r.content)
        order = Order.objects.get(order_id=r.data['order_id'])
        self.assertEqual(order.razorpay_payment_id, 'pay_1')
        self.assertEqual(order.razorpay_order_id, 'order_1')
        self.assertEqual(order.payment_status, 'completed')

    def test_same_payment_never_makes_two_orders(self):
        first = self._verify()
        second = self._verify()
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data['order_id'], second.data['order_id'])
        self.assertEqual(Order.objects.count(), 1)

    def test_bad_signature_rejected(self):
        r = self._verify(sig='0' * 64)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_mock_signature_rejected_in_production(self):
        r = self._verify(sig='mock_signature')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_underpayment_rejected_and_nothing_saved(self):
        # order total is Rs 400 + delivery; paying Rs 1 must not buy it
        r = self._verify(payment={'order_id': 'order_1', 'status': 'captured', 'amount': 100})
        self.assertEqual(r.status_code, 400)
        self.assertIn('does not match', r.data['error'])
        self.assertEqual(Order.objects.count(), 0)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)  # rolled back

    def test_payment_not_captured_rejected(self):
        r = self._verify(payment={'order_id': 'order_1', 'status': 'failed', 'amount': 99900})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_payment_for_a_different_user_rejected(self):
        r = self._verify(user_id=self.other.id)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_payment_for_another_razorpay_order_rejected(self):
        r = self._verify(payment={'order_id': 'order_OTHER', 'status': 'captured', 'amount': 99900})
        self.assertEqual(r.status_code, 400)

    def test_create_order_validates_amount(self):
        for bad in ['abc', '0', '-5', '9999999']:
            r = self.client.post('/api/ecommerce/razorpay/create-order/', {'amount': bad}, format='json')
            self.assertEqual(r.status_code, 400, bad)


@override_settings(RAZORPAY_WEBHOOK_SECRET=HOOK_SECRET, ALLOWED_HOSTS=['*'])
class WebhookTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='b@example.com', username='b', password='pass12345!', user_type='buyer')
        self.order = Order.objects.create(user=self.user, total_amount=100, final_amount=100, order_id='ORD-1',
                                          payment_status='pending', status='processing',
                                          razorpay_order_id='order_1', razorpay_payment_id='pay_1')

    def _post(self, event, secret=HOOK_SECRET, sig=None):
        body = json.dumps({'event': event, 'payload': {'payment': {'entity': {'id': 'pay_1', 'order_id': 'order_1', 'amount': 10000}}}})
        sig = sig or hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        return self.client.post('/api/ecommerce/razorpay/webhook/', body, content_type='application/json',
                                HTTP_X_RAZORPAY_SIGNATURE=sig)

    def test_unsigned_or_wrongly_signed_events_ignored(self):
        self.assertEqual(self._post('payment.captured', sig='bad').status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    @override_settings(RAZORPAY_WEBHOOK_SECRET='')
    def test_refuses_everything_when_no_secret_configured(self):
        self.assertEqual(self._post('payment.captured', sig='x').status_code, 503)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    def test_captured_marks_paid(self):
        self.assertEqual(self._post('payment.captured').status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'completed')

    def test_failed_never_downgrades_a_paid_order(self):
        self.order.payment_status = 'completed'
        self.order.save()
        self._post('payment.failed')
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'completed')


class VariantPricingTests(TestCase):
    """Phase 3 Part 1: regular_price / selling price / computed discount_percent."""

    def setUp(self):
        self.seller = User.objects.create_user(email='vseller@example.com', username='vseller', password='pass12345!', user_type='seller')
        self.product = Product.objects.create(seller=self.seller, name='Variant Shirt', category='Fashion',
                                               price=Decimal('500'), discount_price=Decimal('500'), stock=0)

    def test_discount_percent_computed_correctly(self):
        v = ProductVariant.objects.create(product=self.product, attributes={'Color': 'Black'},
                                           regular_price=Decimal('1000'), price=Decimal('750'), stock=10)
        self.assertEqual(v.discount_percent, 25)

    def test_no_regular_price_means_zero_discount(self):
        v = ProductVariant.objects.create(product=self.product, attributes={'Color': 'White'},
                                           price=Decimal('500'), stock=10)
        self.assertIsNone(v.regular_price)
        self.assertEqual(v.discount_percent, 0)

    def test_different_discounts_for_different_colors(self):
        black = ProductVariant.objects.create(product=self.product, attributes={'Color': 'Black'},
                                               regular_price=Decimal('1000'), price=Decimal('900'), stock=10)  # 10%
        white = ProductVariant.objects.create(product=self.product, attributes={'Color': 'White'},
                                               regular_price=Decimal('1000'), price=Decimal('500'), stock=10)  # 50%
        self.assertEqual(black.discount_percent, 10)
        self.assertEqual(white.discount_percent, 50)

    def test_selling_price_above_regular_price_rejected_via_api(self):
        client = APIClient()
        client.force_authenticate(self.seller)
        SellerProfile.objects.create(user=self.seller, store_name='V Seller Store', verification_status='approved')
        r = client.post('/api/ecommerce/product-variants/', {
            'product': self.product.id, 'attributes': {'Color': 'Red'},
            'regular_price': '500', 'price': '700', 'stock': 5,
        }, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        self.assertIn('price', r.json())

    def test_migration_backfill_preserves_existing_price_with_zero_discount(self):
        # Simulates a pre-Phase-3 variant: only `price` was ever set, as if the
        # 0059 data migration had just backfilled regular_price = price.
        v = ProductVariant.objects.create(product=self.product, attributes={'Color': 'Legacy'}, price=Decimal('499'), stock=3)
        v.regular_price = v.price
        v.save()
        self.assertEqual(v.discount_percent, 0)
        self.assertEqual(v.price, Decimal('499.00'))


class CheckoutVariantValidationTests(TestCase):
    """Phase 3 Part 2: server-side re-validation at order placement — never
    trust the frontend for price, and recheck status/active/stock fresh."""

    def setUp(self):
        self.buyer = User.objects.create_user(email='vbuyer@example.com', username='vbuyer', password='pass12345!', user_type='buyer')
        self.seller = User.objects.create_user(email='vseller2@example.com', username='vseller2', password='pass12345!', user_type='seller')
        self.addr = Address.objects.create(user=self.buyer, name='Buyer', phone='9999999999', street_address='1 St',
                                            city='Kochi', state='Kerala', postal_code='682001')
        self.client = APIClient()
        self.client.force_authenticate(self.buyer)

    def _product(self, **kwargs):
        defaults = dict(seller=self.seller, name='Checkout Test Item', category='Fashion',
                         price=Decimal('500'), discount_price=Decimal('500'), stock=0, status='approved')
        defaults.update(kwargs)
        return Product.objects.create(**defaults)

    def _checkout(self):
        return self.client.post('/api/ecommerce/orders/', {'address': self.addr.id, 'payment_method': 'cod'}, format='json')

    def test_legacy_non_variant_checkout_still_works(self):
        product = self._product(stock=5)
        cart, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart, product=product, quantity=1)
        r = self._checkout()
        self.assertEqual(r.status_code, 201, r.content)
        item = OrderItem.objects.get(order__order_id=r.data['order_id'])
        self.assertIsNone(item.variant)
        self.assertEqual(item.price, Decimal('500'))

    def test_order_uses_db_price_never_a_client_supplied_one(self):
        """Price manipulation from the frontend: nothing in the checkout payload
        can specify a price — create_order_for_user only ever reads it from the
        locked variant/product row, so there's no field to manipulate at all."""
        product = self._product()
        variant = ProductVariant.objects.create(product=product, attributes={'Size': 'M'}, price=Decimal('999'), stock=5)
        cart, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart, product=product, variant=variant, quantity=1)
        # Attempt to smuggle a price override in the checkout body — ignored entirely.
        r = self.client.post('/api/ecommerce/orders/', {
            'address': self.addr.id, 'payment_method': 'cod', 'price': '1',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        item = OrderItem.objects.get(order__order_id=r.data['order_id'])
        self.assertEqual(item.price, Decimal('999'))
        self.assertEqual(item.variant_id, variant.id)

    def test_out_of_stock_variant_blocks_checkout(self):
        product = self._product()
        variant = ProductVariant.objects.create(product=product, attributes={'Size': 'L'}, price=Decimal('500'), stock=1)
        cart, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart, product=product, variant=variant, quantity=5)
        r = self._checkout()
        self.assertEqual(r.status_code, 400)
        self.assertEqual(OrderItem.objects.filter(variant=variant).count(), 0)

    def test_inactive_variant_blocks_checkout_even_if_added_before_deactivation(self):
        product = self._product()
        variant = ProductVariant.objects.create(product=product, attributes={'Size': 'S'}, price=Decimal('500'), stock=5)
        cart, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart, product=product, variant=variant, quantity=1)
        # Simulate the seller deactivating it *after* it was already in the cart.
        variant.is_active = False
        variant.save(update_fields=['is_active'])
        r = self._checkout()
        self.assertEqual(r.status_code, 400)
        self.assertIn('no longer available', r.json()['error'])

    def test_unapproved_product_blocks_checkout_even_if_added_before_rejection(self):
        product = self._product(stock=5)
        cart, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart, product=product, quantity=1)
        # Simulate admin rejecting the product after it was already in the cart.
        product.status = 'rejected'
        product.save(update_fields=['status'])
        r = self._checkout()
        self.assertEqual(r.status_code, 400)
        self.assertIn('no longer available', r.json()['error'])

    def test_deactivated_product_blocks_checkout(self):
        product = self._product(stock=5, is_active=False)
        cart, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart, product=product, quantity=1)
        r = self._checkout()
        self.assertEqual(r.status_code, 400)

    def test_invalid_variant_product_combination_rejected_at_cart_add(self):
        """A variant belonging to a *different* product can never enter the cart
        against this product — get_object_or_404 filters on product=product, so a
        cross-product variant ID 404s instead of silently attaching."""
        product_a = self._product(name='Product A')
        ProductVariant.objects.create(product=product_a, attributes={'Size': 'S'}, price=Decimal('500'), stock=5)
        product_b = self._product(name='Product B')
        variant_of_b = ProductVariant.objects.create(product=product_b, attributes={'Size': 'M'}, price=Decimal('500'), stock=5)
        r = self.client.post('/api/ecommerce/cart/add/', {
            'product': product_a.id, 'variant': variant_of_b.id, 'quantity': 1,
        }, format='json')
        self.assertEqual(r.status_code, 404)

    def test_concurrent_purchase_cannot_oversell_limited_stock(self):
        """Sequentially exhaust stock=1 across two separate checkouts for the same
        variant — select_for_update locking inside the atomic transaction means
        the second request's stock re-check always sees the first's decrement,
        so it can never both succeed (the realistic failure mode for true
        concurrency — two threads both reading stock=1 before either writes —
        is exactly what row locking prevents)."""
        product = self._product()
        variant = ProductVariant.objects.create(product=product, attributes={'Size': 'XL'}, price=Decimal('500'), stock=1)

        buyer2 = User.objects.create_user(email='vbuyer2@example.com', username='vbuyer2', password='pass12345!', user_type='buyer')
        addr2 = Address.objects.create(user=buyer2, name='Buyer2', phone='9888888888', street_address='2 St',
                                        city='Kochi', state='Kerala', postal_code='682001')

        cart1, _ = Cart.objects.get_or_create(user=self.buyer)
        CartItem.objects.create(cart=cart1, product=product, variant=variant, quantity=1)
        r1 = self._checkout()
        self.assertEqual(r1.status_code, 201, r1.content)

        client2 = APIClient()
        client2.force_authenticate(buyer2)
        cart2, _ = Cart.objects.get_or_create(user=buyer2)
        CartItem.objects.create(cart=cart2, product=product, variant=variant, quantity=1)
        r2 = client2.post('/api/ecommerce/orders/', {'address': addr2.id, 'payment_method': 'cod'}, format='json')
        self.assertEqual(r2.status_code, 400)

        variant.refresh_from_db()
        self.assertEqual(variant.stock, 0)
        self.assertEqual(OrderItem.objects.filter(variant=variant).count(), 1)
