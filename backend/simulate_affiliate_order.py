"""
Script to simulate a customer purchase via an affiliate link.
Creates test order + commission record for end-to-end verification.
"""
import os
import django
import sys
import json
import random
import string
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from accounts.models import User
from ecommerce.models import (
    Product, Cart, CartItem, Address, Order, OrderItem,
    ProductReview, AffiliateCommission
)

REFERRAL_CODE = 'ref-12-7dfbdad5'
PRODUCT_ID = 5

# Customer
customer = User.objects.filter(email='company@test.com').first()
if not customer:
    print("ERROR: Customer not found")
    sys.exit(1)
print(f"Customer: {customer.email}")

# Product
product = Product.objects.get(id=PRODUCT_ID)
print(f"Product: {product.name}, Price: {product.discount_price}, Commission Rate: {product.commission_rate}%")

# Address
addr, created = Address.objects.get_or_create(
    user=customer,
    defaults={
        'name': 'Test Customer',
        'phone': '9876543210',
        'street_address': '123 Test Street',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'postal_code': '400001',
        'is_default': True,
    }
)
print(f"Address: {addr.name}, {addr.city} (created={created})")

# Create order
subtotal = product.discount_price * 1
delivery_charge = Decimal('0') if subtotal > 1500 else Decimal('99')
final_amount = subtotal + delivery_charge

random_digits = ''.join(random.choices(string.digits, k=7))
order_id = f"ORD-SIM-{random_digits}"

order = Order.objects.create(
    user=customer,
    address=addr,
    total_amount=subtotal,
    discount_amount=Decimal('0'),
    delivery_charge=delivery_charge,
    final_amount=final_amount,
    payment_method='upi',
    payment_status='completed',
    status='processing',
    order_id=order_id,
    referral_code=REFERRAL_CODE
)
print(f"Order created: {order.order_id}")

order_item = OrderItem.objects.create(
    order=order,
    product=product,
    price=product.discount_price,
    quantity=1
)
print(f"Order item: {order_item.product.name} x {order_item.quantity} @ {order_item.price}")

# Process commission
review = ProductReview.objects.filter(referral_code=REFERRAL_CODE, product=product).first()
if review:
    # Get global rate
    SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ecommerce', 'platform_settings.json')
    try:
        with open(SETTINGS_FILE) as f:
            settings = json.load(f)
            global_rate = settings.get('global_commission_rate', 10)
    except Exception:
        global_rate = 10

    rate = product.commission_rate  # 12%
    commission_amount = Decimal(str(order_item.price * order_item.quantity)) * Decimal(str(rate)) / Decimal('100')
    commission_amount = commission_amount.quantize(Decimal('0.01'))

    AffiliateCommission.objects.create(
        influencer=review.influencer,
        order=order,
        product=product,
        amount=commission_amount,
        status='completed'
    )
    print(f"\n✅ Commission created!")
    print(f"   Influencer: {review.influencer.email}")
    print(f"   Rate applied: {rate}% (product specific)")
    print(f"   Commission amount: ₹{commission_amount}")
    print(f"   Order ID: {order.order_id}")
    print(f"\nExpected calculation: {product.discount_price} × 12% = ₹{product.discount_price * Decimal('0.12')}")
else:
    print(f"ERROR: No review found for referral code '{REFERRAL_CODE}'")

# Summary
print("\n=== SUMMARY ===")
print(f"Total Reviews: {ProductReview.objects.count()}")
print(f"Total Commissions: {AffiliateCommission.objects.count()}")
total_earned = sum(c.amount for c in AffiliateCommission.objects.filter(influencer=review.influencer))
print(f"Total Earned by {review.influencer.email}: ₹{total_earned}")
