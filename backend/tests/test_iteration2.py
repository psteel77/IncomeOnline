"""
Iteration 2 Tests: MoneyRules Template and Theme Migration
Tests for:
1. Rule of 72 .docx endpoint with page borders
2. Theme color verification (no teal/cyan)
"""
import pytest
import requests
import os
import zipfile
from io import BytesIO

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRule72Document:
    """Tests for the Rule of 72 Word document endpoint"""
    
    def test_endpoint_returns_200(self):
        """Test that the endpoint returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Endpoint returns 200")
    
    def test_content_type_is_docx(self):
        """Test that the content type is correct for .docx files"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content_type = response.headers.get('Content-Type', '')
        assert 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type, \
            f"Expected docx content type, got {content_type}"
        print("✓ Content type is correct for .docx")
    
    def test_content_disposition_header(self):
        """Test that the Content-Disposition header is set for download"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, f"Expected attachment disposition, got {content_disp}"
        assert '.docx' in content_disp, f"Expected .docx in filename, got {content_disp}"
        print("✓ Content-Disposition header is correct")
    
    def test_file_is_valid_docx(self):
        """Test that the returned file is a valid .docx (ZIP) file"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        buffer = BytesIO(response.content)
        
        # .docx files are ZIP archives
        assert zipfile.is_zipfile(buffer), "File is not a valid ZIP/DOCX"
        
        with zipfile.ZipFile(buffer, 'r') as z:
            # Check for required .docx components
            assert 'word/document.xml' in z.namelist(), "Missing word/document.xml"
            assert '[Content_Types].xml' in z.namelist(), "Missing [Content_Types].xml"
        print("✓ File is a valid .docx")
    
    def test_docx_has_page_borders(self):
        """Test that the document has page borders (pgBorders element)"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        buffer = BytesIO(response.content)
        
        with zipfile.ZipFile(buffer, 'r') as z:
            content = z.read('word/document.xml').decode('utf-8')
            assert 'pgBorders' in content, "Document does not have page borders"
        print("✓ Document has page borders")
    
    def test_docx_has_pink_purple_border_color(self):
        """Test that the page border uses pink/purple color (DB2777)"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        buffer = BytesIO(response.content)
        
        with zipfile.ZipFile(buffer, 'r') as z:
            content = z.read('word/document.xml').decode('utf-8')
            # Check for the pink/purple border color
            assert 'DB2777' in content or 'db2777' in content.lower(), \
                "Document does not have pink/purple border color (DB2777)"
        print("✓ Document has pink/purple border color")
    
    def test_docx_has_incomeonline_branding(self):
        """Test that the document has IncomeOnline branding"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        buffer = BytesIO(response.content)
        
        with zipfile.ZipFile(buffer, 'r') as z:
            content = z.read('word/document.xml').decode('utf-8')
            assert 'incomeonline' in content.lower(), \
                "Document does not have IncomeOnline branding"
        print("✓ Document has IncomeOnline branding")
    
    def test_docx_contains_rule_of_72_content(self):
        """Test that the document contains Rule of 72 content"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        buffer = BytesIO(response.content)
        
        with zipfile.ZipFile(buffer, 'r') as z:
            content = z.read('word/document.xml').decode('utf-8')
            assert 'Rule of 72' in content or 'rule of 72' in content.lower(), \
                "Document does not contain Rule of 72 content"
        print("✓ Document contains Rule of 72 content")
    
    def test_file_size_is_reasonable(self):
        """Test that the file size is reasonable (not empty, not too large)"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        file_size = len(response.content)
        
        # Should be at least 10KB and less than 1MB
        assert file_size > 10000, f"File too small: {file_size} bytes"
        assert file_size < 1000000, f"File too large: {file_size} bytes"
        print(f"✓ File size is reasonable: {file_size} bytes")


class TestFrontendEndpoints:
    """Tests for frontend page accessibility"""
    
    def test_homepage_loads(self):
        """Test that the homepage loads successfully"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Homepage returned {response.status_code}"
        print("✓ Homepage loads successfully")
    
    def test_donate_page_loads(self):
        """Test that the donate page loads successfully"""
        response = requests.get(f"{BASE_URL}/donate")
        assert response.status_code == 200, f"Donate page returned {response.status_code}"
        print("✓ Donate page loads successfully")
    
    def test_success_stories_page_loads(self):
        """Test that the success stories page loads successfully"""
        response = requests.get(f"{BASE_URL}/success-stories")
        assert response.status_code == 200, f"Success Stories page returned {response.status_code}"
        print("✓ Success Stories page loads successfully")
    
    def test_admin_login_page_loads(self):
        """Test that the admin login page loads successfully"""
        response = requests.get(f"{BASE_URL}/admin/login")
        assert response.status_code == 200, f"Admin Login page returned {response.status_code}"
        print("✓ Admin Login page loads successfully")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
