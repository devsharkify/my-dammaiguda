"""
Session Features Tests - News Scraper, Smart Device Integration, Psychologist AI, Push Notifications
Tests for P1-P2 features:
- News endpoints with multi-source scraping and AI rephrasing
- Phone sensor sync (pedometer)
- Smartwatch sync
- Connected devices management
- Psychologist AI chat
- Mental health assessment
- Push notification subscription
- Notification preferences
"""
import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    # Send OTP
    requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
    
    # Verify OTP
    response = requests.post(f"{BASE_URL}/api/auth/verify", json={
        "phone": TEST_PHONE,
        "otp": TEST_OTP
    })
    
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ============== NEWS ENDPOINTS ==============

class TestNewsEndpoints:
    """News scraper and feed tests"""
    
    def test_get_news_categories(self):
        """Test getting news categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        assert response.status_code == 200
        data = response.json()
        assert "local" in data
        assert "city" in data
        assert "national" in data
        print(f"✓ News categories retrieved: {list(data.keys())}")
    
    def test_get_local_news(self):
        """Test GET /api/news/local - Local news feed"""
        response = requests.get(f"{BASE_URL}/api/news/local")
        assert response.status_code == 200
        data = response.json()
        assert "category" in data
        assert data["category"] == "local"
        assert "news" in data
        assert isinstance(data["news"], list)
        print(f"✓ Local news retrieved: {data.get('count', len(data['news']))} articles")
    
    def test_get_news_feed_all_without_ai(self):
        """Test GET /api/news/feed/all with use_ai=false"""
        response = requests.get(f"{BASE_URL}/api/news/feed/all", params={"use_ai": "false"})
        assert response.status_code == 200
        data = response.json()
        assert "news" in data
        assert isinstance(data["news"], list)
        assert "categories" in data
        print(f"✓ All news feed retrieved (no AI): {len(data['news'])} articles")
    
    def test_get_city_news(self):
        """Test GET /api/news/city - City news feed"""
        response = requests.get(f"{BASE_URL}/api/news/city")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "city"
        print(f"✓ City news retrieved: {data.get('count', 0)} articles")
    
    def test_get_national_news(self):
        """Test GET /api/news/national - National news feed"""
        response = requests.get(f"{BASE_URL}/api/news/national")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "national"
        print(f"✓ National news retrieved: {data.get('count', 0)} articles")
    
    def test_get_sports_news(self):
        """Test GET /api/news/sports - Sports news feed"""
        response = requests.get(f"{BASE_URL}/api/news/sports")
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "sports"
        print(f"✓ Sports news retrieved: {data.get('count', 0)} articles")
    
    def test_invalid_category(self):
        """Test invalid news category returns 400"""
        response = requests.get(f"{BASE_URL}/api/news/invalid_category_xyz")
        assert response.status_code == 400
        print("✓ Invalid category correctly rejected with 400")


# ============== SMART DEVICE INTEGRATION ==============

class TestPhoneSensorSync:
    """Phone sensor (pedometer) sync tests"""
    
    def test_sync_phone_sensors(self, auth_headers):
        """Test POST /api/fitness/sync/phone-sensors"""
        payload = {
            "steps": 5000,
            "distance_meters": 3750.0,
            "calories": 200,
            "active_minutes": 45,
            "floors_climbed": 5,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "phone_pedometer"
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/sync/phone-sensors",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "activity" in data
        assert data["activity"]["steps"] == 5000
        assert "daily_summary" in data
        print(f"✓ Phone sensor sync successful: {data['activity']['steps']} steps")
    
    def test_sync_phone_sensors_update_existing(self, auth_headers):
        """Test updating existing phone sensor data for same day"""
        payload = {
            "steps": 7500,
            "distance_meters": 5625.0,
            "calories": 300,
            "active_minutes": 60,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "phone_pedometer"
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/sync/phone-sensors",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # Should update existing record
        assert data["activity"]["steps"] == 7500
        print(f"✓ Phone sensor update successful: {data['activity']['steps']} steps")
    
    def test_sync_phone_sensors_requires_auth(self):
        """Test phone sensor sync requires authentication"""
        payload = {
            "steps": 1000,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/sync/phone-sensors",
            json=payload
        )
        assert response.status_code in [401, 403]
        print("✓ Phone sensor sync correctly requires authentication")


class TestSmartwatchSync:
    """Smartwatch sync tests"""
    
    def test_sync_smartwatch_data(self, auth_headers):
        """Test POST /api/fitness/sync/smartwatch"""
        payload = {
            "device_brand": "samsung",
            "device_model": "Galaxy Watch 5",
            "steps": 8000,
            "heart_rate_current": 72,
            "heart_rate_resting": 65,
            "heart_rate_min": 58,
            "heart_rate_max": 145,
            "calories_total": 350,
            "calories_active": 200,
            "distance_meters": 6000.0,
            "active_minutes": 75,
            "blood_oxygen": 98.5,
            "stress_level": 35,
            "sleep_data": {
                "duration_hours": 7.5,
                "deep_sleep_mins": 90,
                "light_sleep_mins": 180,
                "rem_sleep_mins": 120,
                "awake_mins": 15,
                "score": 85
            },
            "sync_timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/sync/smartwatch",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # API returns synced_data instead of activity/health_data
        assert "synced_data" in data or "daily_summary" in data
        print(f"✓ Smartwatch sync successful: steps={payload['steps']}, HR: {payload['heart_rate_current']}")
    
    def test_sync_smartwatch_minimal_data(self, auth_headers):
        """Test smartwatch sync with minimal required data"""
        payload = {
            "device_brand": "fitbit",
            "steps": 3000,
            "sync_timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/sync/smartwatch",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Smartwatch minimal sync successful: steps={payload['steps']}")
    
    def test_sync_smartwatch_requires_auth(self):
        """Test smartwatch sync requires authentication"""
        payload = {
            "device_brand": "apple",
            "steps": 1000,
            "sync_timestamp": datetime.now(timezone.utc).isoformat()
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/sync/smartwatch",
            json=payload
        )
        assert response.status_code in [401, 403]
        print("✓ Smartwatch sync correctly requires authentication")


class TestConnectedDevices:
    """Connected devices management tests"""
    
    def test_connect_device(self, auth_headers):
        """Test POST /api/fitness/devices/connect"""
        payload = {
            "device_type": "smartwatch",
            "device_brand": "garmin",
            "device_id": "TEST_GARMIN_001",
            "device_name": "Garmin Venu 3",
            "permissions": ["steps", "heart_rate", "sleep", "stress"]
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/devices/connect",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # API returns device_id directly, not nested device object
        assert "device_id" in data or "device" in data
        print(f"✓ Device connected: {payload['device_name']}")
    
    def test_connect_phone_device(self, auth_headers):
        """Test connecting phone as device"""
        payload = {
            "device_type": "phone",
            "device_brand": "samsung",
            "device_name": "Samsung Galaxy S24",
            "permissions": ["steps", "activity"]
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/devices/connect",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Phone device connected: {payload['device_name']}")
    
    def test_get_connected_devices(self, auth_headers):
        """Test GET /api/fitness/devices"""
        response = requests.get(
            f"{BASE_URL}/api/fitness/devices",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # API returns {devices: [...], count: N} structure
        if isinstance(data, dict):
            assert "devices" in data
            devices = data["devices"]
            count = data.get("count", len(devices))
        else:
            devices = data
            count = len(devices)
        assert isinstance(devices, list)
        print(f"✓ Connected devices retrieved: {count} device(s)")
    
    def test_get_devices_requires_auth(self):
        """Test getting devices requires authentication"""
        response = requests.get(f"{BASE_URL}/api/fitness/devices")
        assert response.status_code in [401, 403]
        print("✓ Get devices correctly requires authentication")


class TestFitnessDashboard:
    """Fitness dashboard tests"""
    
    def test_get_fitness_dashboard(self, auth_headers):
        """Test GET /api/fitness/dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/fitness/dashboard",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "today" in data
        assert "weekly" in data
        assert "streak" in data
        assert "goals" in data
        print(f"✓ Fitness dashboard retrieved: Today steps={data['today'].get('total_steps', 0)}")
    
    def test_dashboard_requires_auth(self):
        """Test dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/fitness/dashboard")
        assert response.status_code in [401, 403]
        print("✓ Dashboard correctly requires authentication")


# ============== PSYCHOLOGIST AI ==============

class TestPsychologistAI:
    """Psychologist AI chat tests"""
    
    def test_psychologist_chat(self, auth_headers):
        """Test POST /api/doctor/psychologist/chat"""
        payload = {
            "message": "I've been feeling stressed lately with work pressure. Can you help?",
            "include_assessment": False
        }
        response = requests.post(
            f"{BASE_URL}/api/doctor/psychologist/chat",
            json=payload,
            headers=auth_headers,
            timeout=30  # AI responses may take time
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        print(f"✓ Psychologist chat response received: {data['response'][:100]}...")
    
    def test_psychologist_chat_with_assessment(self, auth_headers):
        """Test psychologist chat with assessment flag"""
        payload = {
            "message": "I'm having trouble sleeping and feel anxious about upcoming deadlines.",
            "include_assessment": True
        }
        response = requests.post(
            f"{BASE_URL}/api/doctor/psychologist/chat",
            json=payload,
            headers=auth_headers,
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "assessment" in data
        print(f"✓ Psychologist chat with assessment: {data.get('assessment', {})}")
    
    def test_psychologist_chat_requires_auth(self):
        """Test psychologist chat requires authentication"""
        payload = {"message": "Hello"}
        response = requests.post(
            f"{BASE_URL}/api/doctor/psychologist/chat",
            json=payload
        )
        assert response.status_code in [401, 403]
        print("✓ Psychologist chat correctly requires authentication")


class TestMentalHealthAssessment:
    """Mental health assessment tests"""
    
    def test_submit_assessment(self, auth_headers):
        """Test POST /api/doctor/psychologist/assessment"""
        payload = {
            "stress_level": 6,
            "sleep_quality": 3,
            "energy_level": 5,
            "anxiety_symptoms": ["racing_thoughts", "difficulty_concentrating"],
            "mood_description": "Feeling overwhelmed but managing",
            "recent_challenges": "Work deadlines and family responsibilities"
        }
        response = requests.post(
            f"{BASE_URL}/api/doctor/psychologist/assessment",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "assessment_id" in data
        assert "wellness_score" in data
        assert "risk_level" in data
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        print(f"✓ Assessment submitted: wellness_score={data['wellness_score']}, risk={data['risk_level']}")
    
    def test_submit_assessment_high_stress(self, auth_headers):
        """Test assessment with high stress indicators"""
        payload = {
            "stress_level": 9,
            "sleep_quality": 1,
            "energy_level": 2,
            "anxiety_symptoms": ["racing_thoughts", "difficulty_concentrating", "restlessness", "irritability"],
            "mood_description": "Very anxious and overwhelmed",
            "recent_challenges": "Multiple stressors"
        }
        response = requests.post(
            f"{BASE_URL}/api/doctor/psychologist/assessment",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # High stress should result in recommendations
        assert len(data["recommendations"]) > 0
        print(f"✓ High stress assessment: risk_level={data['risk_level']}, recommendations={len(data['recommendations'])}")
    
    def test_assessment_requires_auth(self):
        """Test assessment requires authentication"""
        payload = {
            "stress_level": 5,
            "sleep_quality": 3,
            "energy_level": 5,
            "mood_description": "Test"
        }
        response = requests.post(
            f"{BASE_URL}/api/doctor/psychologist/assessment",
            json=payload
        )
        assert response.status_code in [401, 403]
        print("✓ Assessment correctly requires authentication")


# ============== PUSH NOTIFICATIONS ==============

class TestPushNotifications:
    """Push notification subscription tests"""
    
    def test_subscribe_push(self, auth_headers):
        """Test POST /api/notifications/subscribe"""
        payload = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/TEST_ENDPOINT_123",
            "keys": {
                "p256dh": "TEST_P256DH_KEY_BASE64",
                "auth": "TEST_AUTH_KEY_BASE64"
            },
            "user_agent": "Mozilla/5.0 Test Browser"
        }
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "subscription_id" in data
        print(f"✓ Push subscription created: {data['subscription_id']}")
    
    def test_subscribe_push_update_existing(self, auth_headers):
        """Test updating existing push subscription"""
        payload = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/TEST_ENDPOINT_123",
            "keys": {
                "p256dh": "UPDATED_P256DH_KEY",
                "auth": "UPDATED_AUTH_KEY"
            }
        }
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "updated" in data["message"].lower() or "subscription" in data["message"].lower()
        print(f"✓ Push subscription updated: {data['message']}")
    
    def test_subscribe_requires_auth(self):
        """Test push subscription requires authentication"""
        payload = {
            "endpoint": "https://test.endpoint",
            "keys": {"p256dh": "test", "auth": "test"}
        }
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json=payload
        )
        assert response.status_code in [401, 403]
        print("✓ Push subscription correctly requires authentication")


class TestNotificationPreferences:
    """Notification preferences tests"""
    
    def test_get_preferences(self, auth_headers):
        """Test GET /api/notifications/preferences"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Should have default preferences
        assert "sos_alerts" in data
        assert "news_updates" in data
        assert "community_updates" in data
        print(f"✓ Notification preferences retrieved: {data}")
    
    def test_update_preferences(self, auth_headers):
        """Test PUT /api/notifications/preferences"""
        payload = {
            "sos_alerts": True,
            "geofence_alerts": True,
            "news_updates": False,
            "community_updates": True,
            "health_reminders": True,
            "challenge_updates": False
        }
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Notification preferences updated successfully")
    
    def test_verify_preferences_updated(self, auth_headers):
        """Verify preferences were actually updated"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Verify the update persisted
        assert data.get("news_updates") == False
        assert data.get("challenge_updates") == False
        print("✓ Preferences update verified via GET")
    
    def test_preferences_requires_auth(self):
        """Test preferences requires authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/preferences")
        assert response.status_code in [401, 403]
        print("✓ Preferences correctly requires authentication")


class TestPendingNotifications:
    """Pending notifications polling tests"""
    
    def test_get_pending_notifications(self, auth_headers):
        """Test GET /api/notifications/pending"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/pending",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "count" in data
        print(f"✓ Pending notifications retrieved: {data['count']} notification(s)")
    
    def test_get_notification_history(self, auth_headers):
        """Test GET /api/notifications/history"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/history",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "count" in data
        print(f"✓ Notification history retrieved: {data['count']} notification(s)")


# ============== ADDITIONAL FITNESS TESTS ==============

class TestFitnessActivities:
    """Additional fitness activity tests"""
    
    def test_log_manual_activity(self, auth_headers):
        """Test POST /api/fitness/activity - Manual activity logging"""
        payload = {
            "activity_type": "running",
            "duration_minutes": 30,
            "distance_km": 5.0,
            "calories_burned": 350,
            "heart_rate_avg": 145,
            "notes": "TEST_Morning run in the park",
            "source": "manual"
        }
        response = requests.post(
            f"{BASE_URL}/api/fitness/activity",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["activity_type"] == "running"
        assert data["duration_minutes"] == 30
        print(f"✓ Manual activity logged: {data['activity_type']} for {data['duration_minutes']} mins")
    
    def test_get_activities(self, auth_headers):
        """Test GET /api/fitness/activities"""
        response = requests.get(
            f"{BASE_URL}/api/fitness/activities",
            headers=auth_headers,
            params={"days": 7}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Activities retrieved: {len(data)} activities in last 7 days")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
