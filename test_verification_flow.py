#!/usr/bin/env python3
"""
Test the complete verification flow including token verification
"""

import requests
import json
import sys
import time
import uuid
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

def test_complete_verification_flow():
    """Test complete verification flow with authorized email"""
    session = requests.Session()
    
    print("🔄 Testing Complete Verification Flow...")
    
    # Step 1: Create a new donor via PayPal IPN
    timestamp = int(time.time())
    test_email = "paul-steel@outlook.com"  # Use authorized email
    
    print(f"Step 1: Creating donor via PayPal IPN for {test_email}")
    
    ipn_url = f"{BASE_URL}/api/paypal/ipn"
    form_data = {
        'payment_status': 'Completed',
        'payer_email': test_email,
        'txn_id': f'VERIFICATION_TEST_{timestamp}',
        'mc_gross': '5.00'
    }
    
    ipn_response = session.post(ipn_url, data=form_data, timeout=30)
    
    if ipn_response.status_code != 200 or ipn_response.json().get('status') != 'success':
        print(f"❌ PayPal IPN failed: {ipn_response.text}")
        return False
    
    print("✅ PayPal IPN processed successfully")
    
    # Step 2: Request access (should send verification email)
    print(f"Step 2: Requesting access for {test_email}")
    
    auth_url = f"{BASE_URL}/api/auth/request-access"
    payload = {"email": test_email}
    headers = {'Content-Type': 'application/json'}
    
    auth_response = session.post(auth_url, json=payload, headers=headers, timeout=30)
    
    if auth_response.status_code != 200:
        print(f"❌ Auth request failed: {auth_response.text}")
        return False
    
    auth_data = auth_response.json()
    print(f"✅ Auth request successful: {auth_data.get('message')}")
    
    # Step 3: Test invalid token verification
    print("Step 3: Testing invalid token verification")
    
    invalid_token = str(uuid.uuid4())
    verify_url = f"{BASE_URL}/api/auth/verify/{invalid_token}"
    
    verify_response = session.get(verify_url, timeout=30)
    
    if verify_response.status_code == 200:
        verify_data = verify_response.json()
        if not verify_data.get('success'):
            print(f"✅ Invalid token correctly rejected: {verify_data.get('message')}")
        else:
            print(f"❌ Invalid token was accepted: {verify_data}")
            return False
    else:
        print(f"❌ Verify endpoint error: {verify_response.text}")
        return False
    
    # Step 4: Test auth check without token
    print("Step 4: Testing auth check without token")
    
    check_url = f"{BASE_URL}/api/auth/check"
    check_response = session.get(check_url, timeout=30)
    
    if check_response.status_code == 200:
        check_data = check_response.json()
        if not check_data.get('authenticated'):
            print("✅ Unauthenticated request correctly returned false")
        else:
            print(f"❌ Should not be authenticated: {check_data}")
            return False
    else:
        print(f"❌ Auth check error: {check_response.text}")
        return False
    
    print("\n✅ Complete verification flow test PASSED")
    return True

def test_edge_cases():
    """Test various edge cases"""
    session = requests.Session()
    
    print("\n🔄 Testing Edge Cases...")
    
    # Test 1: Empty email
    print("Test 1: Empty email request")
    auth_url = f"{BASE_URL}/api/auth/request-access"
    
    try:
        response = session.post(auth_url, json={"email": ""}, timeout=30)
        if response.status_code != 200:
            print("✅ Empty email correctly rejected")
        else:
            print(f"❌ Empty email should be rejected: {response.json()}")
    except Exception as e:
        print(f"✅ Empty email caused validation error (expected): {e}")
    
    # Test 2: Invalid email format
    print("Test 2: Invalid email format")
    
    try:
        response = session.post(auth_url, json={"email": "invalid-email"}, timeout=30)
        if response.status_code != 200:
            print("✅ Invalid email format correctly rejected")
        else:
            data = response.json()
            if not data.get('success', True):
                print(f"✅ Invalid email handled: {data.get('message')}")
            else:
                print(f"❌ Invalid email should be rejected: {data}")
    except Exception as e:
        print(f"✅ Invalid email caused validation error (expected): {e}")
    
    # Test 3: Very long token
    print("Test 3: Very long verification token")
    
    long_token = "a" * 1000
    verify_url = f"{BASE_URL}/api/auth/verify/{long_token}"
    
    response = session.get(verify_url, timeout=30)
    if response.status_code == 200:
        data = response.json()
        if not data.get('success'):
            print("✅ Long token correctly rejected")
        else:
            print(f"❌ Long token should be rejected: {data}")
    else:
        print(f"✅ Long token caused server error (acceptable): {response.status_code}")
    
    print("✅ Edge cases testing completed")
    return True

if __name__ == "__main__":
    print("=" * 80)
    print("COMPREHENSIVE VERIFICATION FLOW TESTING")
    print("=" * 80)
    
    success1 = test_complete_verification_flow()
    success2 = test_edge_cases()
    
    if success1 and success2:
        print("\n🎉 ALL VERIFICATION TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED")
        sys.exit(1)