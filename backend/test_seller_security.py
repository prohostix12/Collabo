import os
import sys
import django

# Set up django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import SellerProfile
from ecommerce.models import Product
from rest_framework.test import APIClient
from django.urls import reverse

User = get_user_model()

def test_seller_lifecycle():
    print("--- Starting Seller Onboarding & Security Verification Test ---")
    
    # 1. Clean up existing test users if they exist
    User.objects.filter(email__in=['buyer_test@test.com', 'admin_test@test.com']).delete()
    
    # 2. Create test accounts
    buyer = User.objects.create_user(
        username='buyer_test',
        email='buyer_test@test.com',
        password='testpassword123',
        user_type='buyer'
    )
    admin = User.objects.create_superuser(
        username='admin_test',
        email='admin_test@test.com',
        password='testpassword123',
        user_type='admin'
    )
    
    print("OK: Created test accounts: buyer_test@test.com, admin_test@test.com")
    
    client = APIClient()
    
    # 3. Authenticate as buyer and try to create a product (should fail with 403)
    client.force_authenticate(user=buyer)
    product_data = {
        'name': 'Secure Test Product',
        'category': 'Electronics',
        'brand': 'Vanguard',
        'price': 1000.00,
        'description': 'Security boundary verification product',
        'stock': 10,
        'delivery': 'Free delivery'
    }
    
    url = '/api/ecommerce/products/'
    response = client.post(url, product_data, format='json')
    print(f"Test 1: Buyer POST product without profile -> Status: {response.status_code}")
    assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    print("OK: Security block 1 passed: Buyer cannot list products.")
    
    # 4. Try to self-promote via PATCH to /auth/profile/ (should be blocked - user_type read-only)
    profile_url = '/api/auth/profile/'
    response = client.patch(profile_url, {'user_type': 'seller'}, format='json')
    print(f"Test 2: Self-promote via PATCH to profile -> Status: {response.status_code}")
    # The view returns 200 but user_type must not change because it is read_only
    buyer.refresh_from_db()
    assert buyer.user_type == 'buyer', f"Vulnerability: user_type changed to {buyer.user_type}!"
    print("OK: Security block 2 passed: Direct role self-modification blocked.")
    
    # 5. Submit Seller registration onboarding details
    registration_url = '/api/auth/seller-profile/'
    registration_data = {
        'store_name': 'Test Buyer Store',
        'tax_id': 'GST12345',
        'bank_name': 'Test Bank',
        'bank_account_number': '1234567890',
        'bank_ifsc': 'TEST0001234',
        'business_address': '123, Testing Street'
    }
    response = client.post(registration_url, registration_data, format='json')
    print(f"Test 3: Apply for seller profile -> Status: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    profile = SellerProfile.objects.get(user=buyer)
    print(f"  Seller profile status: {profile.verification_status}")
    assert profile.verification_status == 'pending', "Expected pending status"
    
    # 6. Try to post product with pending profile (should still fail with 403)
    response = client.post(url, product_data, format='json')
    print(f"Test 4: Post product with pending profile -> Status: {response.status_code}")
    assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    print("OK: Security block 3 passed: Pending profile seller cannot list products.")
    
    # 7. Approve seller as Admin
    client.force_authenticate(user=admin)
    approve_url = f'/api/auth/admin/approve-seller/{buyer.id}/'
    response = client.post(approve_url, format='json')
    print(f"Test 5: Admin approves seller profile -> Status: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    profile.refresh_from_db()
    buyer.refresh_from_db()
    print(f"  Approved Seller user_type: {buyer.user_type}, profile verification status: {profile.verification_status}")
    assert profile.verification_status == 'approved', "Expected approved status"
    assert buyer.user_type == 'seller', "Expected user_type to be seller"
    
    # 8. Post product as approved seller (should succeed with 201)
    client.force_authenticate(user=buyer)
    response = client.post(url, product_data, format='json')
    print(f"Test 6: Post product as approved seller -> Status: {response.status_code}")
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    print("OK: Seller onboarding flow passed: Approved seller listed product successfully.")
    
    # Clean up
    User.objects.filter(email__in=['buyer_test@test.com', 'admin_test@test.com']).delete()
    print("--- All Security & Authorization Tests Passed Successfully ---")

if __name__ == '__main__':
    test_seller_lifecycle()
