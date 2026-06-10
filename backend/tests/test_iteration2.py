"""
Iteration 2 Tests: Frontend page accessibility.

(The original Rule-of-72 .docx document tests were removed — the free guides
are now served as PDFs via /api/pdf/{slug}; PDF delivery is covered by
test_iteration3.py and test_gbp_currency_sweep.py.)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://income-uk-checkout.preview.emergentagent.com').rstrip('/')


class TestFrontendEndpoints:
    """Tests for frontend page accessibility"""

    def test_homepage_loads(self):
        """Test that the homepage loads successfully"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Homepage returned {response.status_code}"

    def test_donate_page_loads(self):
        """Test that the donate page loads successfully"""
        response = requests.get(f"{BASE_URL}/donate")
        assert response.status_code == 200, f"Donate page returned {response.status_code}"

    def test_success_stories_page_loads(self):
        """Test that the success stories page loads successfully"""
        response = requests.get(f"{BASE_URL}/success-stories")
        assert response.status_code == 200, f"Success Stories page returned {response.status_code}"

    def test_admin_login_page_loads(self):
        """Test that the admin login page loads successfully"""
        response = requests.get(f"{BASE_URL}/admin/login")
        assert response.status_code == 200, f"Admin Login page returned {response.status_code}"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
