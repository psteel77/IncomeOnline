"""
Test cases for the Rule of 72 Word document download endpoint.
Tests the /api/pdf/rule-of-72 endpoint functionality.
"""
import pytest
import requests
import os
import zipfile
from io import BytesIO

# Get the backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRule72Endpoint:
    """Tests for the Rule of 72 document download endpoint"""
    
    def test_endpoint_returns_200(self):
        """Test that the endpoint returns HTTP 200 status"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"SUCCESS: Endpoint returned status code {response.status_code}")
    
    def test_content_type_is_docx(self):
        """Test that the response has correct content-type for Word documents"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content_type = response.headers.get('content-type', '')
        expected_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        assert expected_type in content_type, f"Expected content-type '{expected_type}', got '{content_type}'"
        print(f"SUCCESS: Content-Type is correct: {content_type}")
    
    def test_content_disposition_header(self):
        """Test that the response has correct content-disposition header for download"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content_disposition = response.headers.get('content-disposition', '')
        assert 'attachment' in content_disposition, f"Expected 'attachment' in content-disposition, got '{content_disposition}'"
        assert 'Rule_of_72' in content_disposition, f"Expected 'Rule_of_72' in filename, got '{content_disposition}'"
        print(f"SUCCESS: Content-Disposition header is correct: {content_disposition}")
    
    def test_file_size_is_reasonable(self):
        """Test that the file size is reasonable (between 30KB and 100KB)"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content_length = len(response.content)
        # Expected around 45KB based on the static file
        assert content_length > 30000, f"File too small: {content_length} bytes"
        assert content_length < 100000, f"File too large: {content_length} bytes"
        print(f"SUCCESS: File size is {content_length} bytes (within expected range)")
    
    def test_file_is_valid_docx(self):
        """Test that the downloaded file is a valid .docx (ZIP-based) file"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content = response.content
        
        # Check for ZIP magic bytes (PK)
        assert content[:2] == b'PK', "File does not start with ZIP magic bytes (PK)"
        print("SUCCESS: File starts with correct ZIP magic bytes")
        
        # Try to open as a ZIP file (docx is a ZIP archive)
        try:
            with zipfile.ZipFile(BytesIO(content), 'r') as zf:
                # Check for required docx internal files
                namelist = zf.namelist()
                assert '[Content_Types].xml' in namelist, "Missing [Content_Types].xml"
                assert any('document.xml' in name for name in namelist), "Missing document.xml"
                print(f"SUCCESS: Valid DOCX structure with {len(namelist)} internal files")
        except zipfile.BadZipFile:
            pytest.fail("Downloaded file is not a valid ZIP/DOCX file")
    
    def test_docx_contains_expected_content(self):
        """Test that the document contains expected content about Rule of 72"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        content = response.content
        
        try:
            with zipfile.ZipFile(BytesIO(content), 'r') as zf:
                # Read the main document content
                doc_xml = None
                for name in zf.namelist():
                    if 'document.xml' in name:
                        doc_xml = zf.read(name).decode('utf-8')
                        break
                
                assert doc_xml is not None, "Could not find document.xml in DOCX"
                
                # Check for expected content keywords
                expected_keywords = ['Rule of 72', 'investment', 'double']
                for keyword in expected_keywords:
                    assert keyword.lower() in doc_xml.lower(), f"Expected keyword '{keyword}' not found in document"
                
                print(f"SUCCESS: Document contains expected keywords: {expected_keywords}")
        except Exception as e:
            pytest.fail(f"Error reading DOCX content: {str(e)}")


class TestEndpointMethods:
    """Test HTTP methods on the endpoint"""
    
    def test_get_method_allowed(self):
        """Test that GET method is allowed"""
        response = requests.get(f"{BASE_URL}/api/pdf/rule-of-72")
        assert response.status_code == 200, f"GET should return 200, got {response.status_code}"
        print("SUCCESS: GET method is allowed")
    
    def test_head_method_returns_headers(self):
        """Test that HEAD method returns proper headers"""
        response = requests.head(f"{BASE_URL}/api/pdf/rule-of-72")
        # HEAD should return 200 or 405 depending on implementation
        assert response.status_code in [200, 405], f"HEAD returned unexpected status: {response.status_code}"
        print(f"INFO: HEAD method returned status {response.status_code}")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
