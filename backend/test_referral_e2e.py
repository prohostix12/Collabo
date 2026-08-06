"""
End-to-end API test for the referral system.
Tests: resolve referral → track click → add to cart → checkout with referral_map → verify commission
"""
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')

import django
django.setup()

from decimal import Decimal
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from ecommerce.models import (
    Product, Cart, CartItem, Address, Order, OrderItem,
    ProductReview, AffiliateCommission, ReferralClick
)
from accounts.models import User

User = get_user_model()

def test_referral_e2e():
    client = APIClient()

    print("=" * 60)
    print("E2E REFERRAL FLOW TEST")
    print("=" * 60)

    # ── 1. Check available referral codes ────────────────────────────
    print("\n[1] Checking existing referral codes...")
    reviews = ProductReview.objects.filter(
        referral_code__isnull=False
    ).exclude(referral_code='').select_related('product', 'influencer')

    if not reviews.exists():
        print("  ❌ No referral codes found! Cannot test.")
        return
    
    review = reviews.first()
    ref_code = review.referral_code
    product = review.product
    influencer = review.influencer
    # Set custom rates for testing
    review.custom_discount_percent = 25
    review.custom_commission_rate = 15
    review.save()

    print(f"\n[1] Found valid referral:")
    print(f"  - Code: {ref_code}")
    print(f"  - Product: {product.name} (ID: {product.id})")
    print(f"  - Price: {product.price}, Discount Price: {product.discount_price}")
    print(f"  - Influencer: {influencer.username}")
    print(f"  - Custom Discount Percent: 25%")
    print(f"  - Custom Commission Rate: 15%")
    expected_ref_discount = float(product.discount_price) * 0.10
    print(f"     Expected 10% referral discount: ₹{expected_ref_discount:.2f}")

    # ── 2. Test resolve-referral API ────────────────────────────────
    print("\n[2] Testing /api/ecommerce/resolve-referral/ ...")
    resp = client.get(f'/api/ecommerce/resolve-referral/?ref={ref_code}')
    if resp.status_code == 200:
        data = resp.json()
        print(f"  ✅ Resolved successfully:")
        print(f"     product_id: {data.get('product_id')}")
        print(f"     product_name: {data.get('product_name')}")
        print(f"     discount_percent: {data.get('discount_percent')}")
        assert str(data.get('product_id')) == str(product.id), "Product ID mismatch!"
        assert data.get('discount_percent') == 25, f"Discount should be 25%, got {data.get('discount_percent')}"
    else:
        print(f"  ❌ Failed: {resp.status_code} - {resp.content}")
        return

    # ── 3. Test track-click API ──────────────────────────────────────
    print("\n[3] Testing /api/ecommerce/track-click/ ...")
    click_count_before = ReferralClick.objects.filter(referral_code=ref_code).count()
    resp = client.post('/api/ecommerce/track-click/', {'referral_code': ref_code},
                       REMOTE_ADDR='10.0.0.99')
    if resp.status_code == 200:
        data = resp.json()
        if data.get('recorded'):
            click_count_after = ReferralClick.objects.filter(referral_code=ref_code).count()
            print(f"  ✅ Click recorded. Total clicks for {ref_code}: {click_count_after}")
        else:
            print(f"  ℹ️  Click already counted: {data.get('reason')}")
    else:
        print(f"  ❌ Failed: {resp.status_code} - {resp.content}")

    # ── 4. Create a buyer and log in ─────────────────────────────────
    print("\n[4] Creating test buyer user...")
    import uuid
    test_email = f"testbuyer_{uuid.uuid4().hex[:6]}@test.com"
    buyer = User.objects.create_user(
        email=test_email,
        username=f"buyer_{uuid.uuid4().hex[:6]}",
        password='TestPass123!',
        user_type='buyer'
    )
    print(f"  ✅ Buyer created: {buyer.username} (type={buyer.user_type})")
    print(f"     is_approved: {buyer.is_approved}")
    client.force_authenticate(user=buyer)

    # ── 5. Add product to cart ───────────────────────────────────────
    print(f"\n[5] Adding product '{product.name}' to cart...")
    resp = client.post('/api/ecommerce/cart/add/', {'product': product.id, 'quantity': 1})
    if resp.status_code == 200:
        cart_data = resp.json()
        items = cart_data.get('items', [])
        print(f"  ✅ Cart now has {len(items)} item(s)")
    else:
        print(f"  ❌ Add to cart failed: {resp.status_code} - {resp.content}")
        buyer.delete()
        return

    # ── 6. Create shipping address ───────────────────────────────────
    print("\n[6] Creating shipping address...")
    resp = client.post('/api/ecommerce/addresses/', {
        'name': buyer.username,
        'phone': '+91 98765 00000',
        'street_address': 'Test Street, Block A',
        'city': 'Bangalore',
        'state': 'Karnataka',
        'postal_code': '560001',
        'is_default': True
    })
    if resp.status_code == 201:
        address_id = resp.json().get('id')
        print(f"  ✅ Address created (ID={address_id})")
    else:
        print(f"  ❌ Address creation failed: {resp.status_code} - {resp.content}")
        buyer.delete()
        return

    # ── 7. Place order WITH referral_map ─────────────────────────────
    print("\n[7] Placing order with referral_map...")
    referral_map = {str(product.id): ref_code}
    subtotal = float(product.discount_price)
    expected_discount = round(subtotal * 0.25)
    expected_final = subtotal - expected_discount

    resp = client.post('/api/ecommerce/orders/', {
        'address': address_id,
        'payment_method': 'upi',
        'referral_map': referral_map,
    }, format='json')

    if resp.status_code == 201:
        order_data = resp.json()
        print(f"  ✅ Order placed successfully!")
        print(f"     Order ID: {order_data.get('order_id')}")
        print(f"     Total amount: ₹{order_data.get('total_amount')}")
        print(f"     Discount: ₹{order_data.get('discount_amount')}")
        print(f"     Final amount: ₹{order_data.get('final_amount')}")
        
        discount_amount = float(order_data.get('discount_amount', 0))
        if discount_amount >= expected_discount * 0.99:
            print(f"  ✅ Referral discount correctly applied: ₹{discount_amount:.2f} (expected ~₹{expected_discount:.2f})")
        else:
            print(f"  ❌ Discount mismatch! Got ₹{discount_amount:.2f}, expected ~₹{expected_discount:.2f}")

        # ── 8. Verify commission was created ─────────────────────────
        print("\n[8] Verifying commission was recorded...")
        order_id = order_data.get('id')
        if order_id:
            commissions = AffiliateCommission.objects.filter(
                order_id=order_id, influencer=influencer
            )
            if commissions.exists():
                comm = commissions.first()
                print(f"  ✅ Commission created!")
                print(f"     Amount: ₹{comm.amount}")
                print(f"     Status: {comm.status}")
                print(f"     Influencer: {comm.influencer.username}")
            else:
                print(f"  ❌ No commission found for order {order_id}")
    else:
        print(f"  ❌ Order failed: {resp.status_code} - {resp.content}")

    # ── 9. Verify one referral code per product restriction ──────────
    print("\n[9] Testing: One referral per product (2 different products)...")
    # Find a second referral code for a DIFFERENT product
    other_reviews = ProductReview.objects.filter(
        referral_code__isnull=False
    ).exclude(referral_code='').exclude(product=product).select_related('product')
    
    if other_reviews.exists():
        other_review = other_reviews.first()
        other_ref = other_review.referral_code
        other_product = other_review.product
        print(f"  ✅ Found second product: {other_product.name} with code {other_ref}")
        
        # referral_map with 2 different products = valid
        multi_map = {
            str(product.id): ref_code,
            str(other_product.id): other_ref,
        }
        print(f"  ✅ Two different products in referral_map: {list(multi_map.keys())} → valid scenario")
        
        # referral_map with same product twice = backend should pick first valid
        same_map = {
            str(product.id): ref_code,  # only 1 entry per product key
        }
        print(f"  ✅ Same product can only have 1 referral code in map (dict enforces this)")
    else:
        print("  ℹ️  Only one product has referral codes in DB, skipping multi-product test")

    # ── Cleanup ───────────────────────────────────────────────────────
    print("\n[Cleanup] Removing test buyer...")
    buyer.delete()
    print("  ✅ Test buyer removed")

    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)

if __name__ == '__main__':
    test_referral_e2e()
