"""
Test Live Activity Tracking Feature
- POST /api/fitness/live/start - Start a live activity session
- POST /api/fitness/live/update - Update session stats
- POST /api/fitness/live/end - End and save activity
- GET /api/fitness/live/active - Get active session
- DELETE /api/fitness/live/{session_id} - Cancel session
- GET /api/fitness/live/history - Get live activity history
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication for testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token using test credentials"""
        # Request OTP
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "9876543210"
        })
        assert response.status_code == 200, f"Failed to request OTP: {response.text}"
        
        # Verify OTP (mocked - uses 123456)
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        assert response.status_code == 200, f"Failed to verify OTP: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_auth_works(self, auth_token):
        """Verify authentication works"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Authentication successful, token obtained")


class TestLiveActivityStart:
    """Test POST /api/fitness/live/start"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
        return response.json().get("token")
    
    def test_start_running_activity(self, auth_token):
        """Test starting a running activity"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "running"
        }, headers=headers)
        
        assert response.status_code == 200, f"Failed to start activity: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "session" in data
        session = data["session"]
        assert "id" in session
        assert session["activity_type"] == "running"
        assert session["status"] == "active"
        assert session["tracks_gps"] == True
        assert "started_at" in session
        print(f"✓ Started running activity, session_id: {session['id']}")
        
        # Cleanup - cancel the session
        requests.delete(f"{BASE_URL}/api/fitness/live/{session['id']}", headers=headers)
    
    def test_start_walking_activity(self, auth_token):
        """Test starting a walking activity"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "walking"
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["session"]["activity_type"] == "walking"
        assert data["session"]["tracks_gps"] == True
        print(f"✓ Started walking activity")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{data['session']['id']}", headers=headers)
    
    def test_start_yoga_activity(self, auth_token):
        """Test starting a yoga activity (no GPS)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "yoga"
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["session"]["activity_type"] == "yoga"
        assert data["session"]["tracks_gps"] == False  # Yoga doesn't track GPS
        print(f"✓ Started yoga activity (no GPS tracking)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{data['session']['id']}", headers=headers)
    
    def test_start_cycling_activity(self, auth_token):
        """Test starting a cycling activity"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "cycling"
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["session"]["activity_type"] == "cycling"
        assert data["session"]["tracks_gps"] == True
        print(f"✓ Started cycling activity")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{data['session']['id']}", headers=headers)
    
    def test_start_invalid_activity_type(self, auth_token):
        """Test starting with invalid activity type"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "invalid_activity"
        }, headers=headers)
        
        assert response.status_code == 400
        print(f"✓ Invalid activity type correctly rejected")
    
    def test_start_activity_with_targets(self, auth_token):
        """Test starting activity with target goals"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "running",
            "target_duration": 30,
            "target_distance": 5.0,
            "target_calories": 300
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        session = data["session"]
        assert session["target_duration"] == 30
        assert session["target_distance"] == 5.0
        assert session["target_calories"] == 300
        print(f"✓ Started activity with targets")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{session['id']}", headers=headers)


class TestLiveActivityUpdate:
    """Test POST /api/fitness/live/update"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
        return response.json().get("token")
    
    def test_update_activity_stats(self, auth_token):
        """Test updating activity with current stats"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Start a session first
        start_response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "running"
        }, headers=headers)
        session_id = start_response.json()["session"]["id"]
        
        # Update with stats
        response = requests.post(f"{BASE_URL}/api/fitness/live/update", json={
            "session_id": session_id,
            "current_duration_seconds": 300,
            "current_distance_meters": 500,
            "current_calories": 50,
            "current_steps": 600
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("updated") == True
        print(f"✓ Updated activity stats successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{session_id}", headers=headers)
    
    def test_update_with_gps_points(self, auth_token):
        """Test updating activity with GPS points"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Start a session
        start_response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "running"
        }, headers=headers)
        session_id = start_response.json()["session"]["id"]
        
        # Update with GPS points
        response = requests.post(f"{BASE_URL}/api/fitness/live/update", json={
            "session_id": session_id,
            "current_duration_seconds": 120,
            "gps_points": [
                {"lat": 17.5449, "lng": 78.5718, "timestamp": "2024-01-15T10:00:00Z"},
                {"lat": 17.5450, "lng": 78.5720, "timestamp": "2024-01-15T10:01:00Z"}
            ]
        }, headers=headers)
        
        assert response.status_code == 200
        print(f"✓ Updated activity with GPS points")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{session_id}", headers=headers)
    
    def test_update_invalid_session(self, auth_token):
        """Test updating non-existent session"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/fitness/live/update", json={
            "session_id": "invalid_session_id",
            "current_duration_seconds": 100
        }, headers=headers)
        
        assert response.status_code == 404
        print(f"✓ Invalid session correctly rejected")


class TestLiveActivityEnd:
    """Test POST /api/fitness/live/end"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
        return response.json().get("token")
    
    def test_end_activity_and_save(self, auth_token):
        """Test ending activity and saving to history"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Start a session
        start_response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "running"
        }, headers=headers)
        session_id = start_response.json()["session"]["id"]
        
        # End the activity
        response = requests.post(f"{BASE_URL}/api/fitness/live/end", json={
            "session_id": session_id,
            "total_duration_seconds": 1800,  # 30 minutes
            "total_distance_meters": 5000,   # 5 km
            "total_calories": 350,
            "total_steps": 6000,
            "avg_pace_min_per_km": 6.0
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "activity" in data
        
        activity = data["activity"]
        assert activity["activity_type"] == "running"
        assert activity["duration_minutes"] == 30
        assert activity["distance_km"] == 5.0
        assert activity["calories_burned"] == 350
        assert activity["steps"] == 6000
        assert activity["source"] == "live_tracking"
        assert "id" in activity
        print(f"✓ Ended activity and saved to history, activity_id: {activity['id']}")
    
    def test_end_activity_with_gps_route(self, auth_token):
        """Test ending activity with GPS route data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Start a session
        start_response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "cycling"
        }, headers=headers)
        session_id = start_response.json()["session"]["id"]
        
        # End with GPS data
        response = requests.post(f"{BASE_URL}/api/fitness/live/end", json={
            "session_id": session_id,
            "total_duration_seconds": 3600,
            "total_distance_meters": 15000,
            "total_calories": 500,
            "gps_points": [
                {"lat": 17.5449, "lng": 78.5718, "timestamp": "2024-01-15T10:00:00Z"},
                {"lat": 17.5460, "lng": 78.5730, "timestamp": "2024-01-15T10:30:00Z"},
                {"lat": 17.5470, "lng": 78.5740, "timestamp": "2024-01-15T11:00:00Z"}
            ]
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["activity"]["gps_points"] is not None
        print(f"✓ Ended activity with GPS route data")
    
    def test_end_invalid_session(self, auth_token):
        """Test ending non-existent session"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/fitness/live/end", json={
            "session_id": "invalid_session_id",
            "total_duration_seconds": 100
        }, headers=headers)
        
        assert response.status_code == 404
        print(f"✓ Invalid session correctly rejected")


class TestLiveActivityActive:
    """Test GET /api/fitness/live/active"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
        return response.json().get("token")
    
    def test_get_active_session(self, auth_token):
        """Test getting active session"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Start a session
        start_response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "walking"
        }, headers=headers)
        session_id = start_response.json()["session"]["id"]
        
        # Get active session
        response = requests.get(f"{BASE_URL}/api/fitness/live/active", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "active_session" in data
        assert data["active_session"] is not None
        assert data["active_session"]["id"] == session_id
        assert data["active_session"]["status"] == "active"
        print(f"✓ Got active session correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/fitness/live/{session_id}", headers=headers)
    
    def test_no_active_session(self, auth_token):
        """Test when no active session exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Make sure no active session
        response = requests.get(f"{BASE_URL}/api/fitness/live/active", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "active_session" in data
        # Could be None or an existing session
        print(f"✓ Active session endpoint works")


class TestLiveActivityCancel:
    """Test DELETE /api/fitness/live/{session_id}"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
        return response.json().get("token")
    
    def test_cancel_activity(self, auth_token):
        """Test canceling/discarding an activity"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Start a session
        start_response = requests.post(f"{BASE_URL}/api/fitness/live/start", json={
            "activity_type": "gym"
        }, headers=headers)
        session_id = start_response.json()["session"]["id"]
        
        # Cancel the session
        response = requests.delete(f"{BASE_URL}/api/fitness/live/{session_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("deleted") == True
        print(f"✓ Canceled activity successfully")
        
        # Verify it's gone
        active_response = requests.get(f"{BASE_URL}/api/fitness/live/active", headers=headers)
        active_data = active_response.json()
        if active_data.get("active_session"):
            assert active_data["active_session"]["id"] != session_id


class TestLiveActivityHistory:
    """Test GET /api/fitness/live/history"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
        return response.json().get("token")
    
    def test_get_live_activity_history(self, auth_token):
        """Test getting history of live tracked activities"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/fitness/live/history", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert "count" in data
        assert isinstance(data["activities"], list)
        
        # Check that activities have source = "live_tracking"
        for activity in data["activities"]:
            assert activity.get("source") == "live_tracking"
        
        print(f"✓ Got live activity history, count: {data['count']}")


class TestActivityTypes:
    """Test GET /api/fitness/activity-types"""
    
    def test_get_activity_types(self):
        """Test getting all supported activity types"""
        response = requests.get(f"{BASE_URL}/api/fitness/activity-types")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check expected activity types exist
        expected_types = ["running", "walking", "cycling", "yoga", "gym", "swimming", "hiking"]
        for activity_type in expected_types:
            assert activity_type in data, f"Missing activity type: {activity_type}"
            assert "name_en" in data[activity_type]
            assert "name_te" in data[activity_type]
            assert "met" in data[activity_type]
            assert "tracks_gps" in data[activity_type]
        
        print(f"✓ Got all activity types, count: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
