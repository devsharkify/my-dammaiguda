"""
Phase 2 Features Test Suite
Tests for: News Shorts, SOS Emergency Alerts, Geo-fencing

Features tested:
- News API: categories, local/national/city news, all categories
- SOS: contacts CRUD, trigger alerts
- Geofencing: create safe zones, check geofence status
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"


class TestNewsAPI:
    """News Shorts API tests - 10 categories"""
    
    def test_get_news_categories(self):
        """Test /api/news/categories returns all 10 categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        assert response.status_code == 200
        
        categories = response.json()
        expected_categories = ["local", "city", "state", "national", "international", 
                              "sports", "entertainment", "tech", "health", "business"]
        
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
            assert "en" in categories[cat], f"Missing English label for {cat}"
            assert "te" in categories[cat], f"Missing Telugu label for {cat}"
        
        print(f"✓ All 10 news categories present with Telugu translations")
    
    def test_get_local_news(self):
        """Test /api/news/local returns Dammaiguda local news"""
        response = requests.get(f"{BASE_URL}/api/news/local")
        assert response.status_code == 200
        
        data = response.json()
        assert "category" in data
        assert data["category"] == "local"
        assert "news" in data
        assert "count" in data
        assert data["count"] > 0
        
        # Check news item structure
        if data["news"]:
            news_item = data["news"][0]
            assert "id" in news_item
            assert "title" in news_item
            assert "category" in news_item
            assert news_item["category"] == "local"
        
        print(f"✓ Local news returned {data['count']} items")
    
    def test_get_national_news(self):
        """Test /api/news/national returns national news"""
        response = requests.get(f"{BASE_URL}/api/news/national")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "national"
        assert data["count"] > 0
        
        print(f"✓ National news returned {data['count']} items")
    
    def test_get_city_news(self):
        """Test /api/news/city returns Hyderabad city news"""
        response = requests.get(f"{BASE_URL}/api/news/city")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "city"
        assert "category_info" in data
        assert "Hyderabad" in data["category_info"]["en"]
        
        print(f"✓ City (Hyderabad) news returned {data['count']} items")
    
    def test_get_state_news(self):
        """Test /api/news/state returns Telangana state news"""
        response = requests.get(f"{BASE_URL}/api/news/state")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "state"
        assert "Telangana" in data["category_info"]["en"]
        
        print(f"✓ State (Telangana) news returned {data['count']} items")
    
    def test_get_sports_news(self):
        """Test /api/news/sports returns sports news"""
        response = requests.get(f"{BASE_URL}/api/news/sports")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "sports"
        assert data["count"] > 0
        
        print(f"✓ Sports news returned {data['count']} items")
    
    def test_get_entertainment_news(self):
        """Test /api/news/entertainment returns entertainment news"""
        response = requests.get(f"{BASE_URL}/api/news/entertainment")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "entertainment"
        
        print(f"✓ Entertainment news returned {data['count']} items")
    
    def test_get_tech_news(self):
        """Test /api/news/tech returns technology news"""
        response = requests.get(f"{BASE_URL}/api/news/tech")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "tech"
        
        print(f"✓ Tech news returned {data['count']} items")
    
    def test_get_health_news(self):
        """Test /api/news/health returns health news"""
        response = requests.get(f"{BASE_URL}/api/news/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "health"
        
        print(f"✓ Health news returned {data['count']} items")
    
    def test_get_business_news(self):
        """Test /api/news/business returns business news"""
        response = requests.get(f"{BASE_URL}/api/news/business")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "business"
        
        print(f"✓ Business news returned {data['count']} items")
    
    def test_get_international_news(self):
        """Test /api/news/international returns international news"""
        response = requests.get(f"{BASE_URL}/api/news/international")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category"] == "international"
        
        print(f"✓ International news returned {data['count']} items")
    
    def test_invalid_category_returns_400(self):
        """Test invalid category returns 400 error"""
        response = requests.get(f"{BASE_URL}/api/news/invalid_category")
        assert response.status_code == 400
        
        print("✓ Invalid category correctly returns 400")


class TestSOSAPI:
    """SOS Emergency Alerts API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for SOS tests"""
        # Send OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        
        # Verify OTP and get token
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP,
            "name": "Test User"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed")
    
    def test_get_sos_contacts_empty(self):
        """Test /api/sos/contacts returns empty list initially"""
        response = requests.get(f"{BASE_URL}/api/sos/contacts", headers=self.headers)
        assert response.status_code == 200
        
        # Should return list (possibly empty)
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ SOS contacts endpoint returns list (count: {len(data)})")
    
    def test_save_sos_contacts(self):
        """Test /api/sos/contacts can save 1-3 emergency contacts"""
        contacts = [
            {"name": "Emergency Contact 1", "phone": "9876543211", "relationship": "spouse"},
            {"name": "Emergency Contact 2", "phone": "9876543212", "relationship": "parent"}
        ]
        
        response = requests.post(f"{BASE_URL}/api/sos/contacts", 
                                json=contacts, 
                                headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["count"] == 2
        
        print(f"✓ Saved {data['count']} SOS contacts successfully")
    
    def test_save_max_3_contacts(self):
        """Test /api/sos/contacts rejects more than 3 contacts"""
        contacts = [
            {"name": "Contact 1", "phone": "9876543211", "relationship": "spouse"},
            {"name": "Contact 2", "phone": "9876543212", "relationship": "parent"},
            {"name": "Contact 3", "phone": "9876543213", "relationship": "sibling"},
            {"name": "Contact 4", "phone": "9876543214", "relationship": "other"}
        ]
        
        response = requests.post(f"{BASE_URL}/api/sos/contacts", 
                                json=contacts, 
                                headers=self.headers)
        assert response.status_code == 400
        assert "Maximum 3" in response.json().get("detail", "")
        
        print("✓ Correctly rejects more than 3 contacts")
    
    def test_trigger_sos_without_contacts(self):
        """Test SOS trigger fails without contacts configured"""
        # First clear contacts
        requests.post(f"{BASE_URL}/api/sos/contacts", 
                     json=[], 
                     headers=self.headers)
        
        response = requests.post(f"{BASE_URL}/api/sos/trigger", 
                                json={"message": "Test emergency"},
                                headers=self.headers)
        
        # Should fail because no contacts
        assert response.status_code == 400
        
        print("✓ SOS trigger correctly fails without contacts")
    
    def test_trigger_sos_with_contacts(self):
        """Test /api/sos/trigger sends alert to all contacts"""
        # First save contacts
        contacts = [
            {"name": "Emergency Contact", "phone": "9876543211", "relationship": "spouse"}
        ]
        requests.post(f"{BASE_URL}/api/sos/contacts", 
                     json=contacts, 
                     headers=self.headers)
        
        # Trigger SOS
        response = requests.post(f"{BASE_URL}/api/sos/trigger", 
                                json={
                                    "message": "EMERGENCY! I need help!",
                                    "latitude": 17.4965,
                                    "longitude": 78.3996
                                },
                                headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "alert" in data
        assert "contacts_notified" in data
        assert len(data["contacts_notified"]) > 0
        
        print(f"✓ SOS triggered successfully, notified {len(data['contacts_notified'])} contacts")
    
    def test_get_sos_history(self):
        """Test /api/sos/history returns SOS alert history"""
        response = requests.get(f"{BASE_URL}/api/sos/history", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ SOS history returned {len(data)} alerts")
    
    def test_sos_requires_auth(self):
        """Test SOS endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/sos/contacts")
        assert response.status_code == 401
        
        response = requests.post(f"{BASE_URL}/api/sos/trigger", json={})
        assert response.status_code == 401
        
        print("✓ SOS endpoints correctly require authentication")


class TestGeofenceAPI:
    """Geo-fencing API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for geofence tests"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP,
            "name": "Test User"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.user_id = data.get("user", {}).get("id")
        else:
            pytest.skip("Authentication failed")
    
    def test_create_geofence_requires_family_member(self):
        """Test /api/family/geofence requires valid family member"""
        response = requests.post(f"{BASE_URL}/api/family/geofence", 
                                json={
                                    "name": "Home",
                                    "member_id": "non_existent_member",
                                    "latitude": 17.4965,
                                    "longitude": 78.3996,
                                    "radius_meters": 500
                                },
                                headers=self.headers)
        
        # Should fail - not a family member
        assert response.status_code == 403
        
        print("✓ Geofence creation correctly requires family member relationship")
    
    def test_get_geofences_for_member(self):
        """Test /api/family/geofences/{member_id} returns geofences"""
        # Get own geofences (should work)
        response = requests.get(f"{BASE_URL}/api/family/geofences/{self.user_id}", 
                               headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Geofences endpoint returns list (count: {len(data)})")
    
    def test_check_geofence_status_requires_family(self):
        """Test /api/family/check-geofences requires family relationship"""
        response = requests.get(f"{BASE_URL}/api/family/check-geofences/non_existent", 
                               headers=self.headers)
        
        # Should fail - not a family member
        assert response.status_code == 403
        
        print("✓ Check geofences correctly requires family relationship")
    
    def test_geofence_requires_auth(self):
        """Test geofence endpoints require authentication"""
        response = requests.post(f"{BASE_URL}/api/family/geofence", json={})
        assert response.status_code == 401
        
        response = requests.get(f"{BASE_URL}/api/family/geofences/test")
        assert response.status_code == 401
        
        print("✓ Geofence endpoints correctly require authentication")


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        print("✓ Health endpoint returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
