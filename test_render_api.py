#!/usr/bin/env python3
"""
Test script for Render backend API
Run: python test_render_api.py
"""

import requests
import json

BACKEND_URL = "https://collabo-backend-y2de.onrender.com"

def test_api_root():
    """Test API root endpoint"""
    print("\n" + "="*60)
    print("TEST 1: API Root Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: API is responding!")
            print(f"Response: {response.text[:200]}")
        else:
            print(f"❌ FAILED: Got status code {response.status_code}")
            print(f"Response: {response.text[:500]}")
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")

def test_admin_panel():
    """Test admin panel"""
    print("\n" + "="*60)
    print("TEST 2: Admin Panel")
    print("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/admin/", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Admin panel is accessible!")
        elif response.status_code == 302:
            print("✅ SUCCESS: Admin panel redirecting (normal behavior)")
        else:
            print(f"❌ FAILED: Got status code {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")

def test_register_endpoint():
    """Test register endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Register Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/accounts/register/", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 405:
            print("✅ SUCCESS: Endpoint exists (405 = Method Not Allowed for GET)")
        elif response.status_code == 200:
            print("✅ SUCCESS: Endpoint is accessible!")
        else:
            print(f"⚠️  WARNING: Got status code {response.status_code}")
            print(f"Response: {response.text[:500]}")
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")

def test_campaigns_endpoint():
    """Test campaigns endpoint"""
    print("\n" + "="*60)
    print("TEST 4: Campaigns Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/collaborations/campaigns/", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ SUCCESS: Endpoint exists (401 = Authentication required)")
        elif response.status_code == 200:
            print("✅ SUCCESS: Endpoint is accessible!")
            data = response.json()
            print(f"Campaigns found: {len(data.get('results', []))}")
        else:
            print(f"⚠️  WARNING: Got status code {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")

def main():
    print("\n" + "="*60)
    print("RENDER BACKEND API TEST")
    print("="*60)
    print(f"Testing: {BACKEND_URL}")
    print("="*60)
    
    test_api_root()
    test_admin_panel()
    test_register_endpoint()
    test_campaigns_endpoint()
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print("\nIf all tests passed:")
    print("✅ Your backend is working correctly!")
    print("\nNext steps:")
    print("1. Create superuser in Render Shell:")
    print("   python manage.py createsuperuser")
    print("2. Deploy frontend to Vercel")
    print("3. Update frontend .env with backend URL")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
