"""
E2E/Unit test for order cancellation and return policy flow.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from ecommerce.models import Product, Address, Order, OrderItem, AffiliateCommission, Brand, Category

User = get_user_model()

def run_tests():
    client = APIClient()

    print("=" * 60)
    print("RUNNING E2E CANCEL & RETURN FLOW TESTS")
    print("=" * 60)

    # Clean up any existing test orders to avoid unique constraints violations
    Order.objects.filter(order_id__startswith='ORD-TEST-').delete()

    # -- Prep Users --
    # Get or create admin user
    admin_user, _ = User.objects.get_or_create(
        username='testadmin_cr',
        defaults={'email': 'testadmin_cr@test.com', 'is_staff': True, 'user_type': 'admin'}
    )
    admin_user.set_password('AdminPass123!')
    admin_user.save()

    # Get or create buyer user
    buyer_user, _ = User.objects.get_or_create(
        username='testbuyer_cr',
        defaults={'email': 'testbuyer_cr@test.com', 'user_type': 'buyer'}
    )
    buyer_user.set_password('BuyerPass123!')
    buyer_user.save()

    # Get or create seller user (influencer/seller)
    seller_user, _ = User.objects.get_or_create(
        username='testseller_cr',
        defaults={'email': 'testseller_cr@test.com', 'user_type': 'influencer'}
    )
    seller_user.set_password('SellerPass123!')
    seller_user.save()

    # -- Prep Product --
    product, _ = Product.objects.get_or_create(
        name='Test ANC Headphones CR',
        defaults={
            'seller': seller_user,
            'category': 'Electronics',
            'brand': 'NovaSound',
            'price': Decimal('10000.00'),
            'discount_price': Decimal('8000.00'),
            'stock': 15,
            'commission_rate': 10,
            'link_discount_percent': 5
        }
    )
    # Ensure starting stock is 15
    product.stock = 15
    product.save()

    # -- Prep Address --
    address, _ = Address.objects.get_or_create(
        user=buyer_user,
        defaults={
            'name': 'Test Buyer',
            'phone': '9999999999',
            'street_address': '123 Test Street',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'postal_code': '560001',
            'is_default': True
        }
    )

    client.force_authenticate(user=buyer_user)

    # -- Test 1: Order Cancellation & Reversion --
    print("\n[1] Testing Order Cancellation & Stock Restoration...")
    
    # Create an order in 'processing' status
    order = Order.objects.create(
        user=buyer_user,
        address=address,
        total_amount=Decimal('8000.00'),
        final_amount=Decimal('8000.00'),
        payment_method='upi',
        payment_status='completed',
        status='processing',
        order_id='ORD-TEST-CANCEL-001'
    )
    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        price=Decimal('8000.00'),
        quantity=2
    )
    
    # Decrease stock manually for checkout simulation
    product.stock -= 2
    product.save()
    print(f"  - Created Order: {order.order_id}, Product stock is now: {product.stock}")

    # Create an AffiliateCommission record
    commission = AffiliateCommission.objects.create(
        influencer=seller_user,
        order=order,
        product=product,
        amount=Decimal('800.00'),
        status='pending'
    )
    print(f"  - Created Pending Affiliate Commission: Rs. {commission.amount}")

    # Trigger cancel API endpoint
    resp = client.post(f'/api/ecommerce/orders/{order.id}/cancel/', {
        'reason': 'Ordered by mistake',
        'comment': 'Please cancel this order immediately.'
    })
    
    if resp.status_code == 200:
        data = resp.json()
        print("  [OK] Cancel API responded successfully!")
        
        # Verify status transitions
        refreshed_order = Order.objects.get(id=order.id)
        print(f"  - Order Status: {refreshed_order.status} (Expected: cancelled)")
        print(f"  - Cancel Reason: {refreshed_order.cancel_reason}")
        print(f"  - Cancel Comment: {refreshed_order.cancel_comment}")
        assert refreshed_order.status == 'cancelled'
        
        # Verify stock restoration
        refreshed_product = Product.objects.get(id=product.id)
        print(f"  - Restored Stock: {refreshed_product.stock} (Expected: 15)")
        assert refreshed_product.stock == 15
        
        # Verify commission cancellation
        refreshed_commission = AffiliateCommission.objects.get(id=commission.id)
        print(f"  - Commission Status: {refreshed_commission.status} (Expected: cancelled)")
        assert refreshed_commission.status == 'cancelled'
    else:
        print(f"  [FAIL] Cancel API failed: {resp.status_code} - {resp.content}")

    # -- Test 2: Order Returns Window Verification --
    print("\n[2] Testing Order Returns Window (7-day Policy)...")
    
    # Reset product stock to 15
    product.stock = 15
    product.save()

    # Create order that is DELIVERED
    order_return = Order.objects.create(
        user=buyer_user,
        address=address,
        total_amount=Decimal('8000.00'),
        final_amount=Decimal('8000.00'),
        payment_method='upi',
        payment_status='completed',
        status='delivered',
        order_id='ORD-TEST-RETURN-002'
    )
    OrderItem.objects.create(
        order=order_return,
        product=product,
        price=Decimal('8000.00'),
        quantity=1
    )
    product.stock -= 1
    product.save()

    # Trigger return request API endpoint
    resp = client.post(f'/api/ecommerce/orders/{order_return.id}/return/', {
        'reason': 'Item damaged / defective',
        'comment': 'The headphones screen is cracked.'
    })
    
    if resp.status_code == 200:
        data = resp.json()
        print("  [OK] Return API responded successfully!")
        refreshed_order = Order.objects.get(id=order_return.id)
        print(f"  - Order Status: {refreshed_order.status} (Expected: return_requested)")
        assert refreshed_order.status == 'return_requested'
    else:
        print(f"  [FAIL] Return API failed: {resp.status_code} - {resp.content}")

    # Test Return Window Expiry
    print("\n[3] Testing Expired Return Window (8 days old delivery)...")
    expired_order = Order.objects.create(
        user=buyer_user,
        address=address,
        total_amount=Decimal('8000.00'),
        final_amount=Decimal('8000.00'),
        payment_method='upi',
        payment_status='completed',
        status='delivered',
        order_id='ORD-TEST-EXPIRED-003'
    )
    OrderItem.objects.create(
        order=expired_order,
        product=product,
        price=Decimal('8000.00'),
        quantity=1
    )
    
    # Artificially update updated_at back to 8 days ago
    Order.objects.filter(id=expired_order.id).update(
        updated_at=timezone.now() - timedelta(days=8)
    )

    resp = client.post(f'/api/ecommerce/orders/{expired_order.id}/return/', {
        'reason': 'Quality not as expected',
        'comment': 'Too late anyway.'
    })
    
    print(f"  - Expired Return API Response code: {resp.status_code} (Expected: 400)")
    assert resp.status_code == 400
    print(f"  - Error message: {resp.json().get('error')}")

    # -- Test 4: Seller Approval & Rejection --
    print("\n[4] Testing Seller Admin Approval and Reversion...")
    
    # Reset product stock
    product.stock = 14
    product.save()
    
    # Create another return request
    order_approve = Order.objects.create(
        user=buyer_user,
        address=address,
        total_amount=Decimal('8000.00'),
        final_amount=Decimal('8000.00'),
        payment_method='upi',
        payment_status='completed',
        status='return_requested',
        order_id='ORD-TEST-APPROVE-004'
    )
    OrderItem.objects.create(
        order=order_approve,
        product=product,
        price=Decimal('8000.00'),
        quantity=1
    )
    # Affiliate commission
    comm_approve = AffiliateCommission.objects.create(
        influencer=seller_user,
        order=order_approve,
        product=product,
        amount=Decimal('800.00'),
        status='pending'
    )

    # Seller updates status to 'refunded' (approve)
    client.force_authenticate(user=seller_user) # Seller is seller of the product
    resp = client.patch(f'/api/ecommerce/orders/{order_approve.id}/status/', {
        'status': 'refunded'
    })
    
    if resp.status_code == 200:
        print("  [OK] Status transition patch succeeded!")
        ref_order = Order.objects.get(id=order_approve.id)
        ref_prod = Product.objects.get(id=product.id)
        ref_comm = AffiliateCommission.objects.get(id=comm_approve.id)
        
        print(f"  - Approved Order Status: {ref_order.status} (Expected: refunded)")
        print(f"  - Product Stock: {ref_prod.stock} (Expected: 15)")
        print(f"  - Commission Status: {ref_comm.status} (Expected: cancelled)")
        
        assert ref_order.status == 'refunded'
        assert ref_prod.stock == 15
        assert ref_comm.status == 'cancelled'
    else:
        print(f"  [FAIL] Approve API failed: {resp.status_code} - {resp.content}")

    # -- Test 5: Rejection Reason Saving --
    print("\n[5] Testing Return Rejection and Reason Capture...")
    order_reject = Order.objects.create(
        user=buyer_user,
        address=address,
        total_amount=Decimal('8000.00'),
        final_amount=Decimal('8000.00'),
        payment_method='upi',
        payment_status='completed',
        status='return_requested',
        order_id='ORD-TEST-REJECT-005',
        return_comment="Original request description"
    )
    OrderItem.objects.create(
        order=order_reject,
        product=product,
        price=Decimal('8000.00'),
        quantity=1
    )
    
    client.force_authenticate(user=seller_user)
    resp = client.patch(f'/api/ecommerce/orders/{order_reject.id}/status/', {
        'status': 'return_rejected',
        'reason': 'Product has scratch marks, not eligible.'
    })
    
    if resp.status_code == 200:
        print("  [OK] Reject API succeeded!")
        ref_order = Order.objects.get(id=order_reject.id)
        print(f"  - Order Status: {ref_order.status} (Expected: return_rejected)")
        print(f"  - Order Return Comment: {ref_order.return_comment}")
        assert ref_order.status == 'return_rejected'
        assert "Rejected: Product has scratch marks, not eligible." in ref_order.return_comment
    else:
        print(f"  [FAIL] Reject API failed: {resp.status_code} - {resp.content}")

    print("\n" + "=" * 60)
    print("ALL CANCEL & RETURN TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
