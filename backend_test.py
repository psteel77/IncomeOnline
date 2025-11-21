#!/usr/bin/env python3
"""
Backend API Testing Script for Online Earning Opportunities Website
Tests all backend endpoints with comprehensive validation
"""

import requests
import json
import sys
from typing import Dict, List, Any

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

print(f"Testing backend at: {BASE_URL}")

class BackendTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, endpoint: str, status: str, details: str):
        """Log test results"""
        result = {
            'endpoint': endpoint,
            'status': status,
            'details': details
        }
        self.test_results.append(result)
        status_symbol = "✅" if status == "PASS" else "❌"
        print(f"{status_symbol} {endpoint}: {details}")
        
    def test_seed_endpoint(self):
        """Test POST /api/seed endpoint"""
        try:
            url = f"{self.base_url}/api/seed"
            response = self.session.post(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'categories_added' in data and 'platforms_added' in data:
                    if data['categories_added'] == 8 and data['platforms_added'] == 12:
                        self.log_test("POST /api/seed", "PASS", 
                                    f"Successfully seeded {data['categories_added']} categories and {data['platforms_added']} platforms")
                    else:
                        self.log_test("POST /api/seed", "FAIL", 
                                    f"Expected 8 categories and 12 platforms, got {data['categories_added']} and {data['platforms_added']}")
                else:
                    self.log_test("POST /api/seed", "FAIL", f"Missing expected fields in response: {data}")
            else:
                self.log_test("POST /api/seed", "FAIL", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("POST /api/seed", "FAIL", f"Exception: {str(e)}")
            
    def test_categories_endpoint(self):
        """Test GET /api/categories endpoint"""
        try:
            url = f"{self.base_url}/api/categories"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'categories' in data:
                    categories = data['categories']
                    if len(categories) == 8:
                        # Check if all expected categories are present
                        expected_categories = [
                            "Freelancing", "Surveys & Research", "Content Creation", 
                            "Trading & Investing", "E-commerce", "Teaching & Tutoring", 
                            "Remote Jobs", "Gig Economy"
                        ]
                        
                        category_names = [cat['name'] for cat in categories]
                        missing_categories = [cat for cat in expected_categories if cat not in category_names]
                        
                        if not missing_categories:
                            # Validate category structure
                            required_fields = ['id', 'name', 'description', 'count', 'color', 'borderColor', 'textColor']
                            valid_structure = True
                            for category in categories:
                                for field in required_fields:
                                    if field not in category:
                                        valid_structure = False
                                        break
                                if not valid_structure:
                                    break
                                    
                            if valid_structure:
                                self.log_test("GET /api/categories", "PASS", 
                                            f"Retrieved all 8 categories with correct structure")
                            else:
                                self.log_test("GET /api/categories", "FAIL", 
                                            f"Categories missing required fields: {required_fields}")
                        else:
                            self.log_test("GET /api/categories", "FAIL", 
                                        f"Missing categories: {missing_categories}")
                    else:
                        self.log_test("GET /api/categories", "FAIL", 
                                    f"Expected 8 categories, got {len(categories)}")
                else:
                    self.log_test("GET /api/categories", "FAIL", f"Missing 'categories' field in response")
            else:
                self.log_test("GET /api/categories", "FAIL", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/categories", "FAIL", f"Exception: {str(e)}")
            
    def test_platforms_endpoint(self):
        """Test GET /api/platforms endpoint"""
        try:
            url = f"{self.base_url}/api/platforms"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'platforms' in data and 'total' in data:
                    platforms = data['platforms']
                    if len(platforms) == 12 and data['total'] == 12:
                        # Validate platform structure
                        required_fields = ['id', 'name', 'category', 'description', 'earningsPotential', 
                                         'difficulty', 'rating', 'minPayout', 'paymentMethods', 'featured', 'link']
                        valid_structure = True
                        for platform in platforms:
                            for field in required_fields:
                                if field not in platform:
                                    valid_structure = False
                                    break
                            if not valid_structure:
                                break
                                
                        if valid_structure:
                            self.log_test("GET /api/platforms", "PASS", 
                                        f"Retrieved all 12 platforms with correct structure")
                        else:
                            self.log_test("GET /api/platforms", "FAIL", 
                                        f"Platforms missing required fields: {required_fields}")
                    else:
                        self.log_test("GET /api/platforms", "FAIL", 
                                    f"Expected 12 platforms, got {len(platforms)} (total: {data['total']})")
                else:
                    self.log_test("GET /api/platforms", "FAIL", f"Missing 'platforms' or 'total' field in response")
            else:
                self.log_test("GET /api/platforms", "FAIL", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/platforms", "FAIL", f"Exception: {str(e)}")
            
    def test_platforms_category_filter(self):
        """Test GET /api/platforms?category=Freelancing"""
        try:
            url = f"{self.base_url}/api/platforms?category=Freelancing"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'platforms' in data:
                    platforms = data['platforms']
                    # Check if all returned platforms are in Freelancing category
                    freelancing_platforms = [p for p in platforms if p['category'] == 'Freelancing']
                    if len(freelancing_platforms) == len(platforms):
                        # Should include Upwork and Fiverr
                        platform_names = [p['name'] for p in platforms]
                        if 'Upwork' in platform_names and 'Fiverr' in platform_names:
                            self.log_test("GET /api/platforms?category=Freelancing", "PASS", 
                                        f"Retrieved {len(platforms)} Freelancing platforms including Upwork and Fiverr")
                        else:
                            self.log_test("GET /api/platforms?category=Freelancing", "FAIL", 
                                        f"Missing expected platforms Upwork/Fiverr. Got: {platform_names}")
                    else:
                        self.log_test("GET /api/platforms?category=Freelancing", "FAIL", 
                                    f"Some platforms not in Freelancing category")
                else:
                    self.log_test("GET /api/platforms?category=Freelancing", "FAIL", 
                                f"Missing 'platforms' field in response")
            else:
                self.log_test("GET /api/platforms?category=Freelancing", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/platforms?category=Freelancing", "FAIL", f"Exception: {str(e)}")
            
    def test_platforms_featured_filter(self):
        """Test GET /api/platforms?featured=true"""
        try:
            url = f"{self.base_url}/api/platforms?featured=true"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'platforms' in data:
                    platforms = data['platforms']
                    # Check if all returned platforms are featured
                    featured_platforms = [p for p in platforms if p.get('featured', False)]
                    if len(featured_platforms) == len(platforms):
                        # Should include expected featured platforms
                        platform_names = [p['name'] for p in platforms]
                        expected_featured = ['Upwork', 'Fiverr', 'YouTube', 'Amazon FBA', 'FlexJobs', 'Etsy']
                        found_featured = [name for name in expected_featured if name in platform_names]
                        
                        if len(found_featured) >= 4:  # At least most of them should be there
                            self.log_test("GET /api/platforms?featured=true", "PASS", 
                                        f"Retrieved {len(platforms)} featured platforms including {found_featured}")
                        else:
                            self.log_test("GET /api/platforms?featured=true", "FAIL", 
                                        f"Missing expected featured platforms. Expected: {expected_featured}, Found: {found_featured}")
                    else:
                        self.log_test("GET /api/platforms?featured=true", "FAIL", 
                                    f"Some platforms not marked as featured")
                else:
                    self.log_test("GET /api/platforms?featured=true", "FAIL", 
                                f"Missing 'platforms' field in response")
            else:
                self.log_test("GET /api/platforms?featured=true", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/platforms?featured=true", "FAIL", f"Exception: {str(e)}")
            
    def test_platforms_search_filter(self):
        """Test GET /api/platforms?search=youtube"""
        try:
            url = f"{self.base_url}/api/platforms?search=youtube"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'platforms' in data:
                    platforms = data['platforms']
                    # Check if search is case-insensitive and matches name or description
                    youtube_found = False
                    for platform in platforms:
                        if 'youtube' in platform['name'].lower() or 'youtube' in platform['description'].lower():
                            youtube_found = True
                            break
                            
                    if youtube_found and len(platforms) > 0:
                        self.log_test("GET /api/platforms?search=youtube", "PASS", 
                                    f"Search returned {len(platforms)} platforms matching 'youtube'")
                    else:
                        self.log_test("GET /api/platforms?search=youtube", "FAIL", 
                                    f"Search did not return expected YouTube-related platforms")
                else:
                    self.log_test("GET /api/platforms?search=youtube", "FAIL", 
                                f"Missing 'platforms' field in response")
            else:
                self.log_test("GET /api/platforms?search=youtube", "FAIL", 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/platforms?search=youtube", "FAIL", f"Exception: {str(e)}")
            
    def test_platform_by_id(self):
        """Test GET /api/platforms/1"""
        try:
            url = f"{self.base_url}/api/platforms/1"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                platform = response.json()
                if 'error' not in platform:
                    # Should be Upwork (ID 1)
                    if platform.get('name') == 'Upwork':
                        required_fields = ['id', 'name', 'category', 'description', 'earningsPotential', 
                                         'difficulty', 'rating', 'minPayout', 'paymentMethods', 'featured', 'link']
                        missing_fields = [field for field in required_fields if field not in platform]
                        
                        if not missing_fields:
                            self.log_test("GET /api/platforms/1", "PASS", 
                                        f"Retrieved Upwork platform with all required fields")
                        else:
                            self.log_test("GET /api/platforms/1", "FAIL", 
                                        f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("GET /api/platforms/1", "FAIL", 
                                    f"Expected Upwork, got {platform.get('name', 'unknown')}")
                else:
                    self.log_test("GET /api/platforms/1", "FAIL", f"Error in response: {platform['error']}")
            else:
                self.log_test("GET /api/platforms/1", "FAIL", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/platforms/1", "FAIL", f"Exception: {str(e)}")
            
    def test_stats_endpoint(self):
        """Test GET /api/stats endpoint"""
        try:
            url = f"{self.base_url}/api/stats"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'stats' in data:
                    stats = data['stats']
                    if len(stats) == 4:
                        # Check for expected stats
                        stat_labels = [stat['label'] for stat in stats]
                        expected_labels = ["Total Platforms", "Categories", "Avg. Monthly Earning", "Success Stories"]
                        
                        if all(label in stat_labels for label in expected_labels):
                            # Check specific values
                            platforms_stat = next((s for s in stats if s['label'] == 'Total Platforms'), None)
                            categories_stat = next((s for s in stats if s['label'] == 'Categories'), None)
                            
                            if platforms_stat and platforms_stat['value'] == '12+' and \
                               categories_stat and categories_stat['value'] == '8':
                                self.log_test("GET /api/stats", "PASS", 
                                            f"Retrieved all 4 stats with correct values: Total Platforms=12+, Categories=8")
                            else:
                                self.log_test("GET /api/stats", "FAIL", 
                                            f"Incorrect stat values. Platforms: {platforms_stat['value'] if platforms_stat else 'missing'}, Categories: {categories_stat['value'] if categories_stat else 'missing'}")
                        else:
                            missing_labels = [label for label in expected_labels if label not in stat_labels]
                            self.log_test("GET /api/stats", "FAIL", f"Missing stat labels: {missing_labels}")
                    else:
                        self.log_test("GET /api/stats", "FAIL", f"Expected 4 stats, got {len(stats)}")
                else:
                    self.log_test("GET /api/stats", "FAIL", f"Missing 'stats' field in response")
            else:
                self.log_test("GET /api/stats", "FAIL", f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/stats", "FAIL", f"Exception: {str(e)}")
            
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("BACKEND API TESTING - Online Earning Opportunities Website")
        print("=" * 60)
        
        # Test in order of priority
        self.test_seed_endpoint()
        self.test_categories_endpoint()
        self.test_platforms_endpoint()
        self.test_platforms_category_filter()
        self.test_platforms_featured_filter()
        self.test_platforms_search_filter()
        self.test_platform_by_id()
        self.test_stats_endpoint()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"❌ {result['endpoint']}: {result['details']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester(BASE_URL)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)