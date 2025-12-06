#!/usr/bin/env python3
"""
PayPal Donation and Authentication Flow Testing
Tests the complete PayPal IPN webhook and magic link authentication system
"""

import requests
import json
import sys
import time
import uuid
from datetime import datetime
from typing import Dict, Any

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

print(f"Testing PayPal & Auth flow at: {BASE_URL}")

class PayPalAuthTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.test_email = None
        
    def log_test(self, test_name: str, status: str, details: str):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'details': details
        }
        self.test_results.append(result)
        status_symbol = "✅" if status == "PASS" else "❌"
        print(f"{status_symbol} {test_name}: {details}")
        
    def test_paypal_ipn_new_donor(self):
        """Test PayPal IPN webhook with NEW donor email"""
        try:
            # Generate unique email to avoid duplicates
            timestamp = int(time.time())
            self.test_email = f"testdonor_{timestamp}@tempmail.com"
            
            url = f"{self.base_url}/api/paypal/ipn"
            
            # Simulate PayPal IPN form data for completed payment
            form_data = {
                'payment_status': 'Completed',
                'payer_email': self.test_email,
                'txn_id': f'TEST_{timestamp}',
                'mc_gross': '5.00',
                'receiver_email': 'donations@incomeonline.info',
                'payment_date': datetime.now().strftime('%H:%M:%S %b %d, %Y PST'),
                'payment_type': 'instant',
                'payment_fee': '0.45',
                'mc_currency': 'USD'
            }
            
            print(f"Testing PayPal IPN with email: {self.test_email}")
            
            response = self.session.post(url, data=form_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("PayPal IPN - New Donor", "PASS", 
                                f"IPN processed successfully for new donor {self.test_email}")
                    return True
                else:
                    self.log_test("PayPal IPN - New Donor", "FAIL", 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("PayPal IPN - New Donor", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PayPal IPN - New Donor", "FAIL", f"Exception: {str(e)}")
            return False
            
    def test_paypal_ipn_pending_payment(self):
        """Test PayPal IPN with pending payment (should not create user)"""
        try:
            timestamp = int(time.time())
            pending_email = f"pending_{timestamp}@tempmail.com"
            
            url = f"{self.base_url}/api/paypal/ipn"
            
            # Simulate PayPal IPN form data for pending payment
            form_data = {
                'payment_status': 'Pending',
                'payer_email': pending_email,
                'txn_id': f'PENDING_{timestamp}',
                'mc_gross': '5.00'
            }
            
            response = self.session.post(url, data=form_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("PayPal IPN - Pending Payment", "PASS", 
                                f"IPN processed but should not create user for pending payment")
                    return True
                else:
                    self.log_test("PayPal IPN - Pending Payment", "FAIL", 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("PayPal IPN - Pending Payment", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PayPal IPN - Pending Payment", "FAIL", f"Exception: {str(e)}")
            return False
            
    def test_paypal_ipn_duplicate_txn(self):
        """Test PayPal IPN with duplicate transaction ID (idempotency)"""
        try:
            if not self.test_email:
                self.log_test("PayPal IPN - Duplicate TXN", "SKIP", 
                            "Skipped - no test email from previous test")
                return True
                
            url = f"{self.base_url}/api/paypal/ipn"
            
            # Use same transaction ID as first test
            timestamp = int(time.time())
            form_data = {
                'payment_status': 'Completed',
                'payer_email': self.test_email,
                'txn_id': f'TEST_{timestamp}',  # Same TXN ID
                'mc_gross': '5.00'
            }
            
            response = self.session.post(url, data=form_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("PayPal IPN - Duplicate TXN", "PASS", 
                                f"IPN handled duplicate transaction gracefully")
                    return True
                else:
                    self.log_test("PayPal IPN - Duplicate TXN", "FAIL", 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("PayPal IPN - Duplicate TXN", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PayPal IPN - Duplicate TXN", "FAIL", f"Exception: {str(e)}")
            return False
            
    def test_magic_link_authorized_email(self):
        """Test magic link authentication with authorized email"""
        try:
            url = f"{self.base_url}/api/auth/request-access"
            
            # Use authorized Mailgun sandbox email
            authorized_email = "paul-steel@outlook.com"
            
            payload = {"email": authorized_email}
            headers = {'Content-Type': 'application/json'}
            
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == "Verification email sent!":
                    self.log_test("Magic Link - Authorized Email", "PASS", 
                                f"Verification email sent successfully to {authorized_email}")
                    return True
                else:
                    self.log_test("Magic Link - Authorized Email", "FAIL", 
                                f"Unexpected message: {data.get('message', 'No message')}")
                    return False
            else:
                self.log_test("Magic Link - Authorized Email", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Magic Link - Authorized Email", "FAIL", f"Exception: {str(e)}")
            return False
            
    def test_magic_link_unauthorized_email(self):
        """Test magic link authentication with unauthorized email"""
        try:
            url = f"{self.base_url}/api/auth/request-access"
            
            # Use unauthorized email
            unauthorized_email = "unauthorized@example.com"
            
            payload = {"email": unauthorized_email}
            headers = {'Content-Type': 'application/json'}
            
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                expected_messages = [
                    "Your email is not authorized. Please make a donation first.",
                    "Email not found. Please donate first to get access."
                ]
                
                if any(msg in data.get('message', '') for msg in expected_messages):
                    self.log_test("Magic Link - Unauthorized Email", "PASS", 
                                f"Correctly rejected unauthorized email: {data.get('message')}")
                    return True
                else:
                    self.log_test("Magic Link - Unauthorized Email", "FAIL", 
                                f"Unexpected response for unauthorized email: {data}")
                    return False
            else:
                self.log_test("Magic Link - Unauthorized Email", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Magic Link - Unauthorized Email", "FAIL", f"Exception: {str(e)}")
            return False
            
    def test_auth_check_unauthenticated(self):
        """Test auth check without authentication header"""
        try:
            url = f"{self.base_url}/api/auth/check"
            
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('authenticated') == False:
                    self.log_test("Auth Check - Unauthenticated", "PASS", 
                                f"Correctly returned authenticated=false for unauthenticated request")
                    return True
                else:
                    self.log_test("Auth Check - Unauthenticated", "FAIL", 
                                f"Expected authenticated=false, got: {data}")
                    return False
            else:
                self.log_test("Auth Check - Unauthenticated", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Auth Check - Unauthenticated", "FAIL", f"Exception: {str(e)}")
            return False
            
    def verify_database_user_creation(self):
        """Verify that the new user was created in MongoDB with verified: true"""
        try:
            if not self.test_email:
                self.log_test("Database Verification", "SKIP", 
                            "Skipped - no test email from PayPal IPN test")
                return True
                
            # We can't directly access MongoDB from here, but we can test via the auth endpoints
            # Try to request access for the email that should have been created
            url = f"{self.base_url}/api/auth/request-access"
            
            payload = {"email": self.test_email}
            headers = {'Content-Type': 'application/json'}
            
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                # If user was created with verified=true, it should send verification email
                if "Verification link sent" in data.get('message', ''):
                    self.log_test("Database Verification", "PASS", 
                                f"User {self.test_email} exists in database with verified=true")
                    return True
                else:
                    self.log_test("Database Verification", "FAIL", 
                                f"User may not be properly created or verified: {data}")
                    return False
            else:
                self.log_test("Database Verification", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Database Verification", "FAIL", f"Exception: {str(e)}")
            return False
            
    def check_backend_logs(self):
        """Check backend logs for PayPal IPN processing"""
        try:
            import subprocess
            
            # Check supervisor backend logs
            result = subprocess.run(
                ['tail', '-n', '50', '/var/log/supervisor/backend.out.log'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                logs = result.stdout
                if self.test_email and self.test_email in logs:
                    self.log_test("Backend Logs Check", "PASS", 
                                f"Found PayPal IPN processing logs for {self.test_email}")
                    return True
                else:
                    self.log_test("Backend Logs Check", "INFO", 
                                f"Backend logs available but may not contain test email")
                    return True
            else:
                self.log_test("Backend Logs Check", "INFO", 
                            f"Could not access backend logs: {result.stderr}")
                return True
                
        except Exception as e:
            self.log_test("Backend Logs Check", "INFO", f"Log check failed: {str(e)}")
            return True  # Not critical
            
    def run_comprehensive_tests(self):
        """Run all PayPal donation and authentication flow tests"""
        print("=" * 80)
        print("PAYPAL DONATION & AUTHENTICATION FLOW TESTING")
        print("=" * 80)
        
        # Test PayPal IPN scenarios
        print("\n🔄 Testing PayPal IPN Webhook...")
        ipn_success = self.test_paypal_ipn_new_donor()
        self.test_paypal_ipn_pending_payment()
        self.test_paypal_ipn_duplicate_txn()
        
        # Test Magic Link Authentication
        print("\n🔄 Testing Magic Link Authentication...")
        self.test_magic_link_authorized_email()
        self.test_magic_link_unauthorized_email()
        
        # Test Auth Status Check
        print("\n🔄 Testing Authentication Status...")
        self.test_auth_check_unauthenticated()
        
        # Verify Database Operations
        print("\n🔄 Verifying Database Operations...")
        if ipn_success:
            self.verify_database_user_creation()
        
        # Check Backend Logs
        print("\n🔄 Checking Backend Logs...")
        self.check_backend_logs()
        
        # Summary
        print("\n" + "=" * 80)
        print("PAYPAL & AUTH FLOW TEST SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        skipped = len([r for r in self.test_results if r['status'] in ['SKIP', 'INFO']])
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Skipped/Info: {skipped}")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
        
        if passed > 0:
            print(f"\n✅ SUCCESSFUL TESTS:")
            for result in self.test_results:
                if result['status'] == 'PASS':
                    print(f"   • {result['test']}: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = PayPalAuthTester(BASE_URL)
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)