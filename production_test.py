#!/usr/bin/env python3
"""
PRODUCTION VERIFICATION TEST for Income Online Website
Tests the live production domain: https://www.incomeonline.info
"""

import requests
import json
import sys
import uuid
from typing import Dict, List, Any

# PRODUCTION URL - DO NOT CHANGE
PRODUCTION_URL = "https://www.incomeonline.info"

class ProductionTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        
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
        
    def test_cms_admin_login(self):
        """Test CMS Admin Login at /admin/login with admin/admin123"""
        try:
            # Test admin login endpoint
            login_url = f"{self.base_url}/api/cms/login"
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = self.session.post(login_url, json=login_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'token' in data:
                    self.auth_token = data['token']
                    self.log_test("CMS Admin Login", "PASS", 
                                f"Successfully logged in with admin/admin123, received JWT token")
                    
                    # Test admin dashboard access
                    self.test_admin_dashboard_access()
                else:
                    self.log_test("CMS Admin Login", "FAIL", 
                                f"Login failed - no success or token in response: {data}")
            else:
                self.log_test("CMS Admin Login", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("CMS Admin Login", "FAIL", f"Exception: {str(e)}")
            
    def test_admin_dashboard_access(self):
        """Test admin dashboard loads after login"""
        if not self.auth_token:
            self.log_test("Admin Dashboard Access", "FAIL", "No auth token available")
            return
            
        try:
            # Test CMS content endpoint with auth
            content_url = f"{self.base_url}/api/cms/content"
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            response = self.session.get(content_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'content' in data:
                    content_sections = data['content']
                    expected_sections = ['hero', 'categories', 'donation', 'featured_platforms', 'all_platforms', 'footer']
                    
                    found_sections = [section for section in expected_sections if section in content_sections]
                    
                    if len(found_sections) >= 4:  # At least most sections should be there
                        self.log_test("Admin Dashboard Access", "PASS", 
                                    f"Admin dashboard loads correctly with {len(found_sections)} content sections")
                    else:
                        self.log_test("Admin Dashboard Access", "FAIL", 
                                    f"Missing content sections. Expected: {expected_sections}, Found: {found_sections}")
                else:
                    self.log_test("Admin Dashboard Access", "FAIL", 
                                f"Invalid content response: {data}")
            else:
                self.log_test("Admin Dashboard Access", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Dashboard Access", "FAIL", f"Exception: {str(e)}")
            
    def test_homepage_content(self):
        """Test homepage loads correctly with all content"""
        try:
            # Test categories endpoint
            categories_url = f"{self.base_url}/api/categories"
            response = self.session.get(categories_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'categories' in data:
                    categories = data['categories']
                    if len(categories) == 8:
                        category_names = [cat['name'] for cat in categories]
                        expected_categories = [
                            "Survey Sites", "Freelancing", "Content Creation", "Online Teaching", 
                            "Affiliate Marketing", "E-commerce", "Investing", "Microtasks"
                        ]
                        
                        # Check if we have the expected categories (allowing for variations)
                        found_categories = []
                        for expected in expected_categories:
                            for actual in category_names:
                                if expected.lower() in actual.lower() or actual.lower() in expected.lower():
                                    found_categories.append(actual)
                                    break
                        
                        if len(found_categories) >= 6:  # At least 6 out of 8 should match
                            self.log_test("Homepage Categories", "PASS", 
                                        f"Found {len(categories)} categories including: {found_categories}")
                        else:
                            self.log_test("Homepage Categories", "FAIL", 
                                        f"Expected categories not found. Got: {category_names}")
                    else:
                        self.log_test("Homepage Categories", "FAIL", 
                                    f"Expected 8 categories, got {len(categories)}")
                else:
                    self.log_test("Homepage Categories", "FAIL", "No categories field in response")
            else:
                self.log_test("Homepage Categories", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Homepage Categories", "FAIL", f"Exception: {str(e)}")
            
    def test_platform_data(self):
        """Test platform data - verify 50+ platforms exist"""
        try:
            platforms_url = f"{self.base_url}/api/platforms"
            response = self.session.get(platforms_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'platforms' in data:
                    platforms = data['platforms']
                    platform_count = len(platforms)
                    
                    if platform_count >= 50:
                        self.log_test("Platform Data Count", "PASS", 
                                    f"Found {platform_count} platforms (meets 50+ requirement)")
                        
                        # Test platform details
                        if platforms:
                            sample_platform = platforms[0]
                            required_fields = ['name', 'category', 'description']
                            missing_fields = [field for field in required_fields if field not in sample_platform]
                            
                            if not missing_fields:
                                self.log_test("Platform Data Structure", "PASS", 
                                            f"Platforms have required fields including detailed descriptions")
                            else:
                                self.log_test("Platform Data Structure", "FAIL", 
                                            f"Platforms missing required fields: {missing_fields}")
                    else:
                        self.log_test("Platform Data Count", "FAIL", 
                                    f"Only found {platform_count} platforms, expected 50+")
                else:
                    self.log_test("Platform Data Count", "FAIL", "No platforms field in response")
            else:
                self.log_test("Platform Data Count", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Platform Data Count", "FAIL", f"Exception: {str(e)}")
            
    def test_authentication_endpoints(self):
        """Test authentication flow endpoints"""
        try:
            # Test request access endpoint
            request_url = f"{self.base_url}/api/auth/request-access"
            test_email = "test@example.com"
            
            response = self.session.post(request_url, json={"email": test_email}, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'message' in data:
                    self.log_test("Auth Request Access Endpoint", "PASS", 
                                f"POST /api/auth/request-access responds correctly: {data['message']}")
                else:
                    self.log_test("Auth Request Access Endpoint", "FAIL", 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Auth Request Access Endpoint", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Request Access Endpoint", "FAIL", f"Exception: {str(e)}")
            
        try:
            # Test verify endpoint (with dummy token - should fail gracefully)
            verify_url = f"{self.base_url}/api/auth/verify/dummy-token"
            response = self.session.get(verify_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and 'message' in data:
                    self.log_test("Auth Verify Endpoint", "PASS", 
                                f"GET /api/auth/verify/{{token}} endpoint exists and responds correctly")
                else:
                    self.log_test("Auth Verify Endpoint", "FAIL", 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Auth Verify Endpoint", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Verify Endpoint", "FAIL", f"Exception: {str(e)}")
            
        try:
            # Test auth check endpoint
            check_url = f"{self.base_url}/api/auth/check"
            response = self.session.get(check_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'authenticated' in data:
                    self.log_test("Auth Check Endpoint", "PASS", 
                                f"GET /api/auth/check responds correctly: authenticated={data['authenticated']}")
                else:
                    self.log_test("Auth Check Endpoint", "FAIL", 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("Auth Check Endpoint", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Check Endpoint", "FAIL", f"Exception: {str(e)}")
            
    def test_paypal_ipn_webhook(self):
        """Test PayPal IPN webhook endpoint"""
        try:
            ipn_url = f"{self.base_url}/api/paypal/ipn"
            
            # Test with minimal IPN data
            ipn_data = {
                "payment_status": "Pending",
                "payer_email": "test@example.com",
                "txn_id": "test_txn_123"
            }
            
            response = self.session.post(ipn_url, data=ipn_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data:
                    self.log_test("PayPal IPN Webhook", "PASS", 
                                f"POST /api/paypal/ipn endpoint exists and responds: {data['status']}")
                else:
                    self.log_test("PayPal IPN Webhook", "FAIL", 
                                f"Invalid response structure: {data}")
            else:
                self.log_test("PayPal IPN Webhook", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("PayPal IPN Webhook", "FAIL", f"Exception: {str(e)}")
            
    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            # Test root API endpoint
            root_url = f"{self.base_url}/api/"
            response = self.session.get(root_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("API Health Check", "PASS", 
                                f"API root endpoint responds: {data['message']}")
                else:
                    self.log_test("API Health Check", "PASS", 
                                f"API root endpoint responds with valid JSON")
            else:
                self.log_test("API Health Check", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("API Health Check", "FAIL", f"Exception: {str(e)}")
            
        try:
            # Test stats endpoint for basic functionality
            stats_url = f"{self.base_url}/api/stats"
            response = self.session.get(stats_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'stats' in data:
                    self.log_test("API Core Functionality", "PASS", 
                                f"Core API endpoints working - stats returned successfully")
                else:
                    self.log_test("API Core Functionality", "FAIL", 
                                f"Stats endpoint not returning expected data: {data}")
            else:
                self.log_test("API Core Functionality", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("API Core Functionality", "FAIL", f"Exception: {str(e)}")
            
    def run_production_tests(self):
        """Run all production verification tests"""
        print("=" * 80)
        print("PRODUCTION VERIFICATION TEST - Income Online Website")
        print(f"Testing live domain: {self.base_url}")
        print("=" * 80)
        
        # Run tests in priority order
        print("\n🔐 Testing CMS Admin System...")
        self.test_cms_admin_login()
        
        print("\n🏠 Testing Homepage & Content...")
        self.test_homepage_content()
        
        print("\n📊 Testing Platform Data...")
        self.test_platform_data()
        
        print("\n🔑 Testing Authentication Flow...")
        self.test_authentication_endpoints()
        
        print("\n💳 Testing PayPal Integration...")
        self.test_paypal_ipn_webhook()
        
        print("\n🔧 Testing API Health...")
        self.test_api_health()
        
        # Summary
        print("\n" + "=" * 80)
        print("PRODUCTION TEST SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        
        if failed > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"❌ {result['test']}: {result['details']}")
        else:
            print("\n🎉 ALL PRODUCTION TESTS PASSED!")
        
        print("\n" + "=" * 80)
        
        return failed == 0

if __name__ == "__main__":
    print(f"Starting production verification test on: {PRODUCTION_URL}")
    tester = ProductionTester(PRODUCTION_URL)
    success = tester.run_production_tests()
    sys.exit(0 if success else 1)