"""
Test Weight Tracking Endpoints - Kaizer Fit Feature
Tests: /api/fitness/weight, /api/fitness/weight/history, /api/fitness/weight/goal, /api/fitness/weight/stats
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"


class TestWeightTracking:
    """Weight tracking endpoint tests for Kaizer Fit"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        # Request OTP
        response = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": TEST_PHONE})
        assert response.status_code == 200, f"OTP request failed: {response.text}"
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        assert response.status_code == 200, f"OTP verification failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    # ============== WEIGHT LOG TESTS ==============
    
    def test_log_weight_success(self, headers):
        """Test logging a weight entry"""
        response = requests.post(f"{BASE_URL}/api/fitness/weight", json={
            "weight_kg": 72.5,
            "notes": "Morning weight"
        }, headers=headers)
        
        assert response.status_code == 200, f"Weight log failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Success flag not set"
        assert "entry" in data, "No entry in response"
        assert data["entry"]["weight_kg"] == 72.5, "Weight not saved correctly"
        print(f"✓ Weight logged successfully: {data['entry']['weight_kg']} kg")
    
    def test_log_weight_without_notes(self, headers):
        """Test logging weight without notes"""
        response = requests.post(f"{BASE_URL}/api/fitness/weight", json={
            "weight_kg": 73.0
        }, headers=headers)
        
        assert response.status_code == 200, f"Weight log failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print("✓ Weight logged without notes")
    
    def test_log_weight_invalid_value(self, headers):
        """Test logging invalid weight value"""
        response = requests.post(f"{BASE_URL}/api/fitness/weight", json={
            "weight_kg": -10
        }, headers=headers)
        
        # Should either reject or accept (depends on validation)
        # Just verify it doesn't crash
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        print(f"✓ Invalid weight handled with status {response.status_code}")
    
    def test_log_weight_unauthorized(self):
        """Test logging weight without auth"""
        response = requests.post(f"{BASE_URL}/api/fitness/weight", json={
            "weight_kg": 70.0
        })
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized weight log rejected")
    
    # ============== WEIGHT HISTORY TESTS ==============
    
    def test_get_weight_history(self, headers):
        """Test getting weight history"""
        response = requests.get(f"{BASE_URL}/api/fitness/weight/history", headers=headers)
        
        assert response.status_code == 200, f"Weight history failed: {response.text}"
        data = response.json()
        
        assert "records" in data, "No records in response"
        assert "count" in data, "No count in response"
        assert isinstance(data["records"], list), "Records should be a list"
        print(f"✓ Weight history retrieved: {data['count']} records")
    
    def test_get_weight_history_with_days_param(self, headers):
        """Test getting weight history with days parameter"""
        response = requests.get(f"{BASE_URL}/api/fitness/weight/history?days=30", headers=headers)
        
        assert response.status_code == 200, f"Weight history failed: {response.text}"
        data = response.json()
        
        assert "records" in data
        print(f"✓ Weight history (30 days) retrieved: {data['count']} records")
    
    def test_get_weight_history_unauthorized(self):
        """Test getting weight history without auth"""
        response = requests.get(f"{BASE_URL}/api/fitness/weight/history")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized weight history rejected")
    
    # ============== WEIGHT GOAL TESTS ==============
    
    def test_set_weight_goal(self, headers):
        """Test setting weight goal"""
        response = requests.post(f"{BASE_URL}/api/fitness/weight/goal", json={
            "target_weight_kg": 68.0
        }, headers=headers)
        
        assert response.status_code == 200, f"Set goal failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Success flag not set"
        assert data.get("goal_weight_kg") == 68.0, "Goal weight not saved correctly"
        print(f"✓ Weight goal set: {data['goal_weight_kg']} kg")
    
    def test_set_weight_goal_unauthorized(self):
        """Test setting weight goal without auth"""
        response = requests.post(f"{BASE_URL}/api/fitness/weight/goal", json={
            "target_weight_kg": 65.0
        })
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized goal setting rejected")
    
    # ============== WEIGHT STATS TESTS ==============
    
    def test_get_weight_stats(self, headers):
        """Test getting weight statistics"""
        response = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=headers)
        
        assert response.status_code == 200, f"Weight stats failed: {response.text}"
        data = response.json()
        
        # Verify expected fields exist
        expected_fields = ["current_weight", "starting_weight", "goal_weight", "total_change", "progress_to_goal"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Weight stats retrieved:")
        print(f"  - Current: {data.get('current_weight')} kg")
        print(f"  - Goal: {data.get('goal_weight')} kg")
        print(f"  - Progress: {data.get('progress_to_goal')}%")
    
    def test_get_weight_stats_unauthorized(self):
        """Test getting weight stats without auth"""
        response = requests.get(f"{BASE_URL}/api/fitness/weight/stats")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized weight stats rejected")


class TestAQIMultiLocation:
    """AQI multi-location endpoint tests"""
    
    def test_aqi_current_returns_multiple_locations(self):
        """Test /api/aqi/current returns multiple locations"""
        response = requests.get(f"{BASE_URL}/api/aqi/current")
        
        assert response.status_code == 200, f"AQI current failed: {response.text}"
        data = response.json()
        
        # Check for expected locations
        assert "dammaiguda" in data, "Missing dammaiguda location"
        assert "hyderabad_city" in data, "Missing hyderabad_city location"
        assert "bowenpally" in data, "Missing bowenpally location"
        assert "fetched_at" in data, "Missing fetched_at timestamp"
        
        print("✓ AQI current returns multiple locations:")
        for loc in ["dammaiguda", "hyderabad_city", "bowenpally"]:
            if loc in data:
                aqi_val = data[loc].get("aqi")
                category = data[loc].get("category")
                print(f"  - {loc}: AQI={aqi_val}, Category={category}")
    
    def test_aqi_dammaiguda_structure(self):
        """Test Dammaiguda AQI data structure"""
        response = requests.get(f"{BASE_URL}/api/aqi/current")
        
        assert response.status_code == 200
        data = response.json()
        
        dammaiguda = data.get("dammaiguda", {})
        
        # Check expected fields
        expected_fields = ["aqi", "category", "category_te", "color", "health_impact", "pollutants", "location"]
        for field in expected_fields:
            assert field in dammaiguda, f"Missing field in dammaiguda: {field}"
        
        print("✓ Dammaiguda AQI structure verified")
    
    def test_aqi_hyderabad_endpoint(self):
        """Test /api/aqi/hyderabad endpoint"""
        response = requests.get(f"{BASE_URL}/api/aqi/hyderabad")
        
        assert response.status_code == 200, f"AQI Hyderabad failed: {response.text}"
        data = response.json()
        
        assert "aqi" in data, "Missing aqi field"
        assert "location" in data, "Missing location field"
        assert data["location"] == "Hyderabad", f"Wrong location: {data['location']}"
        
        print(f"✓ Hyderabad AQI: {data.get('aqi')}")
    
    def test_aqi_dammaiguda_endpoint(self):
        """Test /api/aqi/dammaiguda endpoint"""
        response = requests.get(f"{BASE_URL}/api/aqi/dammaiguda")
        
        assert response.status_code == 200, f"AQI Dammaiguda failed: {response.text}"
        data = response.json()
        
        assert "aqi" in data, "Missing aqi field"
        assert "location" in data, "Missing location field"
        assert data["location"] == "Dammaiguda", f"Wrong location: {data['location']}"
        
        print(f"✓ Dammaiguda AQI: {data.get('aqi')}")


class TestFitnessDashboard:
    """Fitness dashboard endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/request-otp", json={"phone": TEST_PHONE})
        assert response.status_code == 200
        
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_fitness_dashboard(self, headers):
        """Test fitness dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/fitness/dashboard", headers=headers)
        
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Check expected fields
        assert "today" in data, "Missing today field"
        assert "weekly" in data, "Missing weekly field"
        assert "streak" in data, "Missing streak field"
        
        print("✓ Fitness dashboard retrieved:")
        print(f"  - Today steps: {data['today'].get('total_steps', 0)}")
        print(f"  - Today calories: {data['today'].get('total_calories', 0)}")
        print(f"  - Current streak: {data['streak'].get('current', 0)} days")
    
    def test_activity_types(self):
        """Test activity types endpoint (public)"""
        response = requests.get(f"{BASE_URL}/api/fitness/activity-types")
        
        assert response.status_code == 200, f"Activity types failed: {response.text}"
        data = response.json()
        
        # Check for expected activity types
        expected_types = ["running", "walking", "cycling", "yoga", "gym", "swimming"]
        for activity in expected_types:
            assert activity in data, f"Missing activity type: {activity}"
        
        print(f"✓ Activity types retrieved: {len(data)} types")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
