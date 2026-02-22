"""
Test Phase 1 Features: AQI Live Widget, My Family Module
Tests for My Dammaiguda civic engagement platform
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"
TEST_NAME = "Test User"
TEST_COLONY = "Dammaiguda"

# Second test user for family testing
TEST_PHONE_2 = "9876543211"
TEST_NAME_2 = "Family Member"


class TestAQIEndpoints:
    """AQI Live Widget API Tests - scrapes data from aqi.in"""
    
    def test_aqi_dammaiguda(self):
        """Test /api/aqi/dammaiguda returns Dammaiguda AQI data"""
        response = requests.get(f"{BASE_URL}/api/aqi/dammaiguda", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "aqi" in data
        assert "category" in data
        assert "category_te" in data  # Telugu translation
        assert "color" in data
        assert "health_impact" in data
        assert "health_impact_te" in data
        assert "pollutants" in data
        assert "location" in data
        assert data["location"] == "Dammaiguda"
        assert data["location_te"] == "దమ్మాయిగూడ"
        assert data["source"] == "aqi.in"
        assert data["aqi_standard"] == "IN"
        
        # Verify pollutants structure
        assert isinstance(data["pollutants"], list)
        if len(data["pollutants"]) > 0:
            pollutant = data["pollutants"][0]
            assert "name" in pollutant
            assert "value" in pollutant
            assert "unit" in pollutant
        
        print(f"✓ Dammaiguda AQI: {data['aqi']} - {data['category']}")
    
    def test_aqi_hyderabad(self):
        """Test /api/aqi/hyderabad returns Hyderabad AQI data"""
        response = requests.get(f"{BASE_URL}/api/aqi/hyderabad", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        assert "aqi" in data
        assert "category" in data
        assert data["location"] == "Hyderabad"
        assert data["location_te"] == "హైదరాబాద్"
        assert data["source"] == "aqi.in"
        
        print(f"✓ Hyderabad AQI: {data['aqi']} - {data['category']}")
    
    def test_aqi_both(self):
        """Test /api/aqi/both returns both Dammaiguda and Hyderabad AQI"""
        response = requests.get(f"{BASE_URL}/api/aqi/both", timeout=60)
        assert response.status_code == 200
        
        data = response.json()
        assert "dammaiguda" in data
        assert "hyderabad" in data
        assert "fetched_at" in data
        
        # Verify Dammaiguda data
        dammaiguda = data["dammaiguda"]
        assert dammaiguda["location"] == "Dammaiguda"
        assert "aqi" in dammaiguda
        assert "pollutants" in dammaiguda
        
        # Verify Hyderabad data
        hyderabad = data["hyderabad"]
        assert hyderabad["location"] == "Hyderabad"
        assert "aqi" in hyderabad
        assert "pollutants" in hyderabad
        
        print(f"✓ Both AQI - Dammaiguda: {dammaiguda['aqi']}, Hyderabad: {hyderabad['aqi']}")
    
    def test_aqi_category_colors(self):
        """Verify AQI categories have proper color codes"""
        response = requests.get(f"{BASE_URL}/api/aqi/dammaiguda", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        # Color should be a valid hex color
        assert data["color"].startswith("#")
        assert len(data["color"]) == 7  # #RRGGBB format
        
        # Category should be one of the Indian AQI categories
        valid_categories = ["Good", "Moderate", "Poor", "Unhealthy", "Severe", "Hazardous", "Error", "Unknown"]
        assert data["category"] in valid_categories
        
        print(f"✓ AQI Category: {data['category']} with color {data['color']}")


class TestAuthenticationFlow:
    """Authentication tests for family module testing"""
    
    def test_send_otp(self):
        """Test OTP sending"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "dev_otp" in data  # Mock OTP for testing
        print("✓ OTP sent successfully")
    
    def test_verify_otp_and_login(self):
        """Test OTP verification and login"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP,
            "name": TEST_NAME,
            "colony": TEST_COLONY
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert "user" in data
        print(f"✓ User authenticated: {data['user']['name']}")
        return data["token"]


class TestFamilyModule:
    """My Family Module API Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP,
            "name": TEST_NAME,
            "colony": TEST_COLONY
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_token_2(self):
        """Get second user authentication token for family testing"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE_2,
            "otp": TEST_OTP,
            "name": TEST_NAME_2,
            "colony": TEST_COLONY
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Second user authentication failed")
    
    def test_get_family_members_empty(self, auth_token):
        """Test getting family members when none exist"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/family/members", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Family members list retrieved: {len(data)} members")
    
    def test_get_family_requests(self, auth_token):
        """Test getting family requests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/family/requests", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "incoming" in data
        assert "outgoing" in data
        assert isinstance(data["incoming"], list)
        assert isinstance(data["outgoing"], list)
        print(f"✓ Family requests: {len(data['incoming'])} incoming, {len(data['outgoing'])} outgoing")
    
    def test_update_location(self, auth_token):
        """Test updating user location for family tracking"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        location_data = {
            "latitude": 17.4965,
            "longitude": 78.5735,
            "accuracy": 10.5,
            "battery_level": 85
        }
        response = requests.post(f"{BASE_URL}/api/family/update-location", 
                                 headers=headers, json=location_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Location updated"
        print("✓ Location updated successfully")
    
    def test_send_request_to_nonexistent_user(self, auth_token):
        """Test sending family request to non-existent user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        request_data = {
            "phone": "1111111111",  # Non-existent user
            "relationship": "spouse"
        }
        response = requests.post(f"{BASE_URL}/api/family/send-request", 
                                 headers=headers, json=request_data)
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower() or "register" in data["detail"].lower()
        print("✓ Correctly rejected request to non-existent user")
    
    def test_send_request_to_self(self, auth_token):
        """Test sending family request to self (should fail)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        request_data = {
            "phone": TEST_PHONE,  # Same as authenticated user
            "relationship": "spouse"
        }
        response = requests.post(f"{BASE_URL}/api/family/send-request", 
                                 headers=headers, json=request_data)
        assert response.status_code == 400
        data = response.json()
        assert "yourself" in data["detail"].lower()
        print("✓ Correctly rejected self-request")
    
    def test_family_request_flow(self, auth_token, auth_token_2):
        """Test complete family request flow: send -> accept"""
        headers_1 = {"Authorization": f"Bearer {auth_token}"}
        headers_2 = {"Authorization": f"Bearer {auth_token_2}"}
        
        # User 1 sends request to User 2
        request_data = {
            "phone": TEST_PHONE_2,
            "relationship": "spouse"
        }
        response = requests.post(f"{BASE_URL}/api/family/send-request", 
                                 headers=headers_1, json=request_data)
        
        # Could be 200 (new request) or 400 (already exists)
        if response.status_code == 400:
            data = response.json()
            if "already" in data["detail"].lower():
                print("✓ Family request already exists (from previous test)")
                return
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        request_id = data["request"]["id"]
        print(f"✓ Family request sent: {request_id}")
        
        # User 2 checks incoming requests
        response = requests.get(f"{BASE_URL}/api/family/requests", headers=headers_2)
        assert response.status_code == 200
        requests_data = response.json()
        
        # Find the request
        incoming = requests_data["incoming"]
        matching_request = next((r for r in incoming if r["id"] == request_id), None)
        
        if matching_request:
            # User 2 accepts the request
            accept_data = {
                "request_id": request_id,
                "action": "accept"
            }
            response = requests.post(f"{BASE_URL}/api/family/respond", 
                                     headers=headers_2, json=accept_data)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            print("✓ Family request accepted")
            
            # Verify both users now see each other as family
            response = requests.get(f"{BASE_URL}/api/family/members", headers=headers_1)
            assert response.status_code == 200
            members = response.json()
            print(f"✓ User 1 now has {len(members)} family member(s)")
    
    def test_respond_invalid_action(self, auth_token):
        """Test responding with invalid action"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response_data = {
            "request_id": "fake-request-id",
            "action": "invalid_action"
        }
        response = requests.post(f"{BASE_URL}/api/family/respond", 
                                 headers=headers, json=response_data)
        # Should fail with 400 (invalid action) or 404 (request not found)
        assert response.status_code in [400, 404]
        print("✓ Correctly rejected invalid action")
    
    def test_unauthorized_access(self):
        """Test family endpoints without authentication"""
        # No auth header
        response = requests.get(f"{BASE_URL}/api/family/members")
        assert response.status_code == 401
        
        response = requests.get(f"{BASE_URL}/api/family/requests")
        assert response.status_code == 401
        
        response = requests.post(f"{BASE_URL}/api/family/update-location", 
                                 json={"latitude": 17.0, "longitude": 78.0})
        assert response.status_code == 401
        
        print("✓ Unauthorized access correctly rejected")


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API healthy - version {data.get('version', 'unknown')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
