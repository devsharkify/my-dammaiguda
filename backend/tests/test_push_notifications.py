"""
Test Push Notifications and AQI endpoints
Tests VAPID key endpoint, notification preferences, and AQI both endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVAPIDEndpoint:
    """Test VAPID public key endpoint"""
    
    def test_vapid_public_key_returns_key(self):
        """Test that VAPID public key endpoint returns a valid key"""
        response = requests.get(f"{BASE_URL}/api/notifications/vapid-public-key")
        assert response.status_code == 200
        
        data = response.json()
        assert "public_key" in data
        assert len(data["public_key"]) > 50  # VAPID keys are typically 87 chars
        print(f"VAPID public key returned: {data['public_key'][:30]}...")


class TestAQIEndpoints:
    """Test AQI endpoints"""
    
    def test_aqi_both_returns_two_locations(self):
        """Test that /api/aqi/both returns both Hyderabad and Dammaiguda"""
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check Hyderabad data
        assert "hyderabad" in data
        assert "aqi" in data["hyderabad"]
        assert "category" in data["hyderabad"]
        assert "location" in data["hyderabad"]
        assert data["hyderabad"]["location"] == "Hyderabad"
        print(f"Hyderabad AQI: {data['hyderabad']['aqi']} - {data['hyderabad']['category']}")
        
        # Check Dammaiguda data
        assert "dammaiguda" in data
        assert "aqi" in data["dammaiguda"]
        assert "category" in data["dammaiguda"]
        assert "location" in data["dammaiguda"]
        assert data["dammaiguda"]["location"] == "Dammaiguda"
        print(f"Dammaiguda AQI: {data['dammaiguda']['aqi']} - {data['dammaiguda']['category']}")
        
        # Check fetched_at timestamp
        assert "fetched_at" in data


class TestAuthAndNotifications:
    """Test authentication and notification endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        # Send OTP
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "9876543210"
        })
        assert response.status_code == 200
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_login_flow(self, auth_token):
        """Test login flow with OTP"""
        assert auth_token is not None
        assert len(auth_token) > 50
        print("Login flow successful")
    
    def test_notification_preferences_get(self, auth_token):
        """Test getting notification preferences"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications/preferences", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        # Check default preference fields exist
        assert "sos_alerts" in data
        assert "geofence_alerts" in data
        assert "news_updates" in data
        assert "community_updates" in data
        assert "health_reminders" in data
        assert "challenge_updates" in data
        print(f"Notification preferences: {data}")
    
    def test_notification_test_endpoint(self, auth_token):
        """Test the test notification endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/notifications/test", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        # Should return success or message about no subscriptions
        assert "success" in data or "message" in data
        print(f"Test notification response: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
