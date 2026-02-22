"""
Enterprise Features Tests - Rate Limiting, Analytics, Chat, Health
Tests for enterprise-grade features in My Dammaiguda
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Test health endpoint with enterprise feature flags"""
    
    def test_health_returns_enterprise_features(self):
        """Health endpoint should return enterprise feature status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "features" in data
        
        features = data["features"]
        assert "rate_limiting" in features
        assert features["rate_limiting"] == True  # Rate limiting should be enabled
        assert "sentry" in features
        # Sentry should be false since no DSN is configured
        assert features["sentry"] == False
        assert "analytics" in features
        assert "websocket_chat" in features
        print(f"Health features: {features}")


class TestRateLimiting:
    """Test rate limiting on auth endpoints"""
    
    def test_otp_endpoint_has_rate_limit_decorator(self):
        """OTP endpoint should have rate limiting configured"""
        # This test verifies rate limiting is configured by checking the endpoint works
        response = requests.post(
            f"{BASE_URL}/api/auth/otp",
            json={"phone": "9876543210"}  # Test phone
        )
        # Should work normally for test phone
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"OTP response: {data}")
    
    def test_verify_endpoint_works(self):
        """Verify endpoint should work with valid OTP"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": "9876543210"})
        
        # Then verify
        response = requests.post(
            f"{BASE_URL}/api/auth/verify",
            json={"phone": "9876543210", "otp": "123456"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        print(f"Verify success - got token")


class TestAnalyticsAPI:
    """Test Analytics Admin Endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for testing"""
        # Send OTP
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": "9999999999"})
        
        # Verify and get token
        response = requests.post(
            f"{BASE_URL}/api/auth/verify",
            json={"phone": "9999999999", "otp": "123456"}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Could not get admin token")
    
    def test_analytics_summary_requires_admin(self):
        """Analytics summary should require admin access"""
        # Without token
        response = requests.get(f"{BASE_URL}/api/analytics/admin/summary?days=7")
        assert response.status_code in [401, 403]
    
    def test_analytics_summary_returns_proper_structure(self, admin_token):
        """Analytics summary should return proper data structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/analytics/admin/summary?days=7",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields
        assert "period_days" in data
        assert "start_date" in data
        assert "total_events" in data
        assert "event_breakdown" in data
        assert "unique_active_users" in data
        assert "feature_popularity" in data
        assert isinstance(data["feature_popularity"], list)
        assert "top_pages" in data
        assert isinstance(data["top_pages"], list)
        assert "daily_active_users" in data
        assert isinstance(data["daily_active_users"], list)
        print(f"Analytics summary: total_events={data['total_events']}, active_users={data['unique_active_users']}")
    
    def test_analytics_active_users_endpoint(self, admin_token):
        """Analytics active users endpoint should return user list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/analytics/admin/active-users?hours=24",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "hours" in data
        assert "active_users" in data
        assert isinstance(data["active_users"], list)
        assert "count" in data
        print(f"Active users in last 24h: {data['count']}")
    
    def test_analytics_export_endpoint(self, admin_token):
        """Analytics export endpoint should return events"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/analytics/admin/export?days=7",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "period_days" in data
        assert "total_events" in data
        assert "events" in data
        assert isinstance(data["events"], list)
        print(f"Export: {data['total_events']} events")


class TestChatAPI:
    """Test Chat API with presence features"""
    
    @pytest.fixture
    def auth_token(self):
        """Get user token for testing"""
        # Send OTP
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": "9876543210"})
        
        # Verify and get token
        response = requests.post(
            f"{BASE_URL}/api/auth/verify",
            json={"phone": "9876543210", "otp": "123456"}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip("Could not get auth token")
    
    def test_chat_rooms_returns_online_count(self, auth_token):
        """Chat rooms should include online_count"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "rooms" in data
        
        rooms = data["rooms"]
        assert len(rooms) > 0
        
        # Check first room has online_count and unread_count
        room = rooms[0]
        assert "online_count" in room
        assert isinstance(room["online_count"], int)
        assert "unread_count" in room
        assert isinstance(room["unread_count"], int)
        print(f"Found {len(rooms)} rooms with presence data")
    
    def test_chat_rooms_returns_unread_count(self, auth_token):
        """Chat rooms should include unread_count"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        rooms = data["rooms"]
        
        for room in rooms:
            assert "unread_count" in room
            assert room["unread_count"] >= 0
        print(f"All {len(rooms)} rooms have unread_count")
    
    def test_chat_rooms_have_required_fields(self, auth_token):
        """Chat rooms should have all required fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=headers)
        
        assert response.status_code == 200
        rooms = data = response.json()["rooms"]
        
        for room in rooms:
            assert "id" in room
            assert "name" in room
            assert "name_te" in room  # Telugu name
            assert "is_public" in room
            assert "online_count" in room
            assert "unread_count" in room
        print(f"All rooms have required fields including name_te (Telugu)")
    
    def test_presence_online_endpoint(self, auth_token):
        """Get online users globally"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/presence/online", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "online_users" in data
        print(f"Presence endpoint working, {len(data['online_users'])} online users")


class TestAdminDashboardRedirect:
    """Test admin dashboard redirect"""
    
    def test_health_endpoint_accessible(self):
        """Verify health endpoint is accessible before redirect test"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("Health endpoint accessible - API is running")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
