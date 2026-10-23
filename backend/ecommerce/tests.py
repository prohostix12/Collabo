import hashlib
import hmac
import json
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Address, Cart, CartItem, Order, Product

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
