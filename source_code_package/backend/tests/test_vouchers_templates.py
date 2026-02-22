"""
Test Vouchers and Templates API endpoints
P1 Features: Discount Vouchers System and Status Templates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVouchersAPI:
    """Test voucher CRUD and user endpoints"""
    
    def test_get_vouchers_list(self):
        """GET /api/vouchers returns list of active vouchers"""
        response = requests.get(f"{BASE_URL}/api/vouchers")
        assert response.status_code == 200
        
        data = response.json()
        assert "vouchers" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["vouchers"], list)
        
    def test_vouchers_have_required_fields(self):
        """Each voucher has required fields: id, title, code, partner_name, discount_type, discount_value, category"""
        response = requests.get(f"{BASE_URL}/api/vouchers")
        assert response.status_code == 200
        
        vouchers = response.json().get("vouchers", [])
        assert len(vouchers) > 0, "Should have at least one voucher"
        
        required_fields = ["id", "title", "code", "partner_name", "discount_type", "discount_value", "category"]
        for voucher in vouchers:
            for field in required_fields:
                assert field in voucher, f"Voucher missing required field: {field}"
                
    def test_voucher_categories(self):
        """Verify vouchers have valid categories"""
        response = requests.get(f"{BASE_URL}/api/vouchers")
        assert response.status_code == 200
        
        vouchers = response.json().get("vouchers", [])
        valid_categories = ["food", "shopping", "health", "education", "entertainment", "other"]
        
        for voucher in vouchers:
            assert voucher.get("category") in valid_categories, f"Invalid category: {voucher.get('category')}"
            
    def test_get_voucher_details(self):
        """GET /api/vouchers/{id} returns full voucher details with CODE"""
        # First get list to get a voucher ID
        list_response = requests.get(f"{BASE_URL}/api/vouchers")
        vouchers = list_response.json().get("vouchers", [])
        
        if len(vouchers) == 0:
            pytest.skip("No vouchers available for testing")
            
        voucher_id = vouchers[0]["id"]
        
        # Get voucher details
        response = requests.get(f"{BASE_URL}/api/vouchers/{voucher_id}")
        assert response.status_code == 200
        
        voucher = response.json()
        assert "code" in voucher, "Voucher details must include code"
        assert voucher["code"] is not None, "Voucher code should not be null"
        assert len(voucher["code"]) > 0, "Voucher code should not be empty"
        
    def test_voucher_not_found(self):
        """GET /api/vouchers/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/vouchers/invalid-id-12345")
        assert response.status_code == 404
        
    def test_dominos_voucher_exists(self):
        """Verify Dominos voucher with specific code DAMM20"""
        response = requests.get(f"{BASE_URL}/api/vouchers")
        vouchers = response.json().get("vouchers", [])
        
        dominos_voucher = next((v for v in vouchers if v.get("partner_name") == "Dominos"), None)
        assert dominos_voucher is not None, "Dominos voucher should exist"
        assert dominos_voucher.get("code") == "DAMM20", "Dominos voucher code should be DAMM20"
        assert dominos_voucher.get("discount_type") == "percentage"
        assert dominos_voucher.get("discount_value") == 20
        
    def test_apollo_voucher_exists(self):
        """Verify Apollo Pharmacy voucher with random code"""
        response = requests.get(f"{BASE_URL}/api/vouchers")
        vouchers = response.json().get("vouchers", [])
        
        apollo_voucher = next((v for v in vouchers if v.get("partner_name") == "Apollo Pharmacy"), None)
        assert apollo_voucher is not None, "Apollo Pharmacy voucher should exist"
        assert apollo_voucher.get("code_type") == "random", "Apollo voucher should have random code type"
        assert apollo_voucher.get("discount_type") == "flat"
        assert apollo_voucher.get("discount_value") == 100
        
    def test_emeritus_voucher_exists(self):
        """Verify Emeritus education voucher with code LEARN50"""
        response = requests.get(f"{BASE_URL}/api/vouchers")
        vouchers = response.json().get("vouchers", [])
        
        emeritus_voucher = next((v for v in vouchers if v.get("partner_name") == "Emeritus"), None)
        assert emeritus_voucher is not None, "Emeritus voucher should exist"
        assert emeritus_voucher.get("code") == "LEARN50", "Emeritus voucher code should be LEARN50"
        assert emeritus_voucher.get("category") == "education"
        assert emeritus_voucher.get("discount_value") == 50


class TestTemplatesAPI:
    """Test templates CRUD and user endpoints"""
    
    def test_get_templates_list(self):
        """GET /api/templates returns list of templates"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert "templates" in data
        assert "total" in data
        assert isinstance(data["templates"], list)
        
    def test_get_template_categories(self):
        """GET /api/templates/categories returns category list"""
        response = requests.get(f"{BASE_URL}/api/templates/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
    def test_template_not_found(self):
        """GET /api/templates/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/templates/invalid-template-id")
        assert response.status_code == 404
        
        
class TestVoucherClaimRequiresAuth:
    """Test that claim endpoint requires authentication"""
    
    def test_claim_voucher_requires_auth(self):
        """POST /api/vouchers/{id}/claim requires authentication"""
        # Get a voucher ID first
        list_response = requests.get(f"{BASE_URL}/api/vouchers")
        vouchers = list_response.json().get("vouchers", [])
        
        if len(vouchers) == 0:
            pytest.skip("No vouchers available for testing")
            
        voucher_id = vouchers[0]["id"]
        
        # Try to claim without auth
        response = requests.post(f"{BASE_URL}/api/vouchers/{voucher_id}/claim")
        assert response.status_code in [401, 403], "Claim should require authentication"
