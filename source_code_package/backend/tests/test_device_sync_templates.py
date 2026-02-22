"""
Backend Tests for Device Sync & Status Templates Features
- Tests fitness endpoints: today-stats, weekly-summary, devices CRUD, sync-all
- Tests templates endpoints: list, generate status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "+919999999999"
TEST_OTP = "123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    # Send OTP
    response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
    assert response.status_code == 200, f"Failed to send OTP: {response.text}"
    
    # Verify OTP
    response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": TEST_PHONE, "otp": TEST_OTP})
    assert response.status_code == 200, f"Failed to verify OTP: {response.text}"
    
    token = response.json().get("token")
    assert token, "No token received"
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestFitnessTodayStats:
    """Test /api/fitness/today-stats endpoint"""
    
    def test_today_stats_returns_200(self, auth_headers):
        """GET /api/fitness/today-stats - returns 200 with authenticated user"""
        response = requests.get(f"{BASE_URL}/api/fitness/today-stats", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/fitness/today-stats returned 200")
    
    def test_today_stats_returns_expected_fields(self, auth_headers):
        """GET /api/fitness/today-stats - returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/fitness/today-stats", headers=auth_headers)
        data = response.json()
        
        # Check all expected fields exist
        expected_fields = ["steps", "calories", "distance", "activeMinutes", "sleepHours", "heartRateAvg"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        # Validate field types
        assert isinstance(data["steps"], int), "steps should be int"
        assert isinstance(data["calories"], int), "calories should be int"
        assert isinstance(data["activeMinutes"], int), "activeMinutes should be int"
        assert isinstance(data["heartRateAvg"], int), "heartRateAvg should be int"
        assert isinstance(data["distance"], (int, float)), "distance should be number"
        assert isinstance(data["sleepHours"], (int, float)), "sleepHours should be number"
        
        print(f"✓ today-stats returns all expected fields: {data}")


class TestFitnessWeeklySummary:
    """Test /api/fitness/weekly-summary endpoint"""
    
    def test_weekly_summary_returns_200(self, auth_headers):
        """GET /api/fitness/weekly-summary - returns 200 with authenticated user"""
        response = requests.get(f"{BASE_URL}/api/fitness/weekly-summary", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/fitness/weekly-summary returned 200")
    
    def test_weekly_summary_returns_7_days(self, auth_headers):
        """GET /api/fitness/weekly-summary - returns array of 7 days"""
        response = requests.get(f"{BASE_URL}/api/fitness/weekly-summary", headers=auth_headers)
        data = response.json()
        
        assert "days" in data, "Response should have 'days' field"
        assert isinstance(data["days"], list), "days should be a list"
        assert len(data["days"]) == 7, f"Expected 7 days, got {len(data['days'])}"
        
        # Check each day has expected fields
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        for i, day in enumerate(data["days"]):
            assert "day" in day, f"Day {i} missing 'day' field"
            assert "steps" in day, f"Day {i} missing 'steps' field"
            assert "active" in day, f"Day {i} missing 'active' field"
            assert day["day"] == day_names[i], f"Expected day {day_names[i]}, got {day['day']}"
        
        print(f"✓ weekly-summary returns 7 days: {[d['day'] for d in data['days']]}")


class TestFitnessDevices:
    """Test /api/fitness/devices endpoints"""
    
    def test_get_devices_returns_200(self, auth_headers):
        """GET /api/fitness/devices - returns 200"""
        response = requests.get(f"{BASE_URL}/api/fitness/devices", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/fitness/devices returned 200")
    
    def test_get_devices_returns_expected_structure(self, auth_headers):
        """GET /api/fitness/devices - returns devices list"""
        response = requests.get(f"{BASE_URL}/api/fitness/devices", headers=auth_headers)
        data = response.json()
        
        assert "devices" in data, "Response should have 'devices' field"
        assert isinstance(data["devices"], list), "devices should be a list"
        assert "count" in data, "Response should have 'count' field"
        
        print(f"✓ devices endpoint returns {data['count']} connected devices")
    
    def test_connect_device_success(self, auth_headers):
        """POST /api/fitness/devices/connect - connects a device"""
        payload = {
            "device_type": "smartwatch",
            "device_brand": "apple",
            "device_name": "Apple Watch Series 9"
        }
        response = requests.post(f"{BASE_URL}/api/fitness/devices/connect", headers=auth_headers, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        
        print(f"✓ POST /api/fitness/devices/connect connected device")
        return data  # Return for use in disconnect test
    
    def test_connect_fitbit_device(self, auth_headers):
        """POST /api/fitness/devices/connect - connect Fitbit device"""
        payload = {
            "device_type": "fitbit",
            "device_name": "Fitbit Charge 5"
        }
        response = requests.post(f"{BASE_URL}/api/fitness/devices/connect", headers=auth_headers, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Connected Fitbit device")
    
    def test_connect_mi_band_device(self, auth_headers):
        """POST /api/fitness/devices/connect - connect Mi Band device"""
        payload = {
            "device_type": "mi_band",
            "device_name": "Mi Band 8"
        }
        response = requests.post(f"{BASE_URL}/api/fitness/devices/connect", headers=auth_headers, json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Connected Mi Band device")
    
    def test_disconnect_device(self, auth_headers):
        """DELETE /api/fitness/devices/{device_id} - disconnects a device"""
        # First get connected devices
        response = requests.get(f"{BASE_URL}/api/fitness/devices", headers=auth_headers)
        devices = response.json().get("devices", [])
        
        if devices:
            device_id = devices[0]["id"]
            response = requests.delete(f"{BASE_URL}/api/fitness/devices/{device_id}", headers=auth_headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            data = response.json()
            assert data.get("success") == True, "Expected success: true"
            print(f"✓ DELETE /api/fitness/devices/{device_id} disconnected device")
        else:
            print("⚠ No devices to disconnect - skipping")


class TestFitnessSyncAll:
    """Test /api/fitness/sync-all endpoint"""
    
    def test_sync_all_returns_200(self, auth_headers):
        """POST /api/fitness/sync-all - returns 200"""
        response = requests.post(f"{BASE_URL}/api/fitness/sync-all", headers=auth_headers, json={})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "synced_count" in data, "Response should have 'synced_count' field"
        
        print(f"✓ POST /api/fitness/sync-all returned 200, synced {data['synced_count']} devices")


class TestTemplates:
    """Test /api/templates endpoints"""
    
    def test_get_templates_returns_200(self):
        """GET /api/templates - returns 200 (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/templates returned 200")
    
    def test_get_templates_returns_array(self):
        """GET /api/templates - returns templates array"""
        response = requests.get(f"{BASE_URL}/api/templates")
        data = response.json()
        
        assert "templates" in data, "Response should have 'templates' field"
        assert isinstance(data["templates"], list), "templates should be a list"
        
        print(f"✓ templates endpoint returns {len(data['templates'])} templates")
    
    def test_get_templates_with_category_filter(self):
        """GET /api/templates?category=festival - filters by category"""
        response = requests.get(f"{BASE_URL}/api/templates?category=festival")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        templates = data.get("templates", [])
        
        # All templates should be of the filtered category
        for t in templates:
            if t.get("category"):
                assert t["category"] == "festival", f"Expected category 'festival', got '{t['category']}'"
        
        print(f"✓ templates filter by category returns {len(templates)} templates")
    
    def test_template_has_expected_fields(self):
        """GET /api/templates - templates have expected fields"""
        response = requests.get(f"{BASE_URL}/api/templates")
        data = response.json()
        templates = data.get("templates", [])
        
        if templates:
            template = templates[0]
            # Check common fields
            expected_fields = ["id", "title", "category"]
            for field in expected_fields:
                assert field in template, f"Template missing field: {field}"
            print(f"✓ Template has required fields: {list(template.keys())}")
        else:
            print("⚠ No templates to verify fields")


class TestUnauthenticatedAccess:
    """Test that fitness endpoints require authentication"""
    
    def test_today_stats_requires_auth(self):
        """GET /api/fitness/today-stats - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/fitness/today-stats")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ today-stats requires authentication (returned {response.status_code})")
    
    def test_weekly_summary_requires_auth(self):
        """GET /api/fitness/weekly-summary - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/fitness/weekly-summary")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ weekly-summary requires authentication (returned {response.status_code})")
    
    def test_devices_requires_auth(self):
        """GET /api/fitness/devices - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/fitness/devices")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ devices requires authentication (returned {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
