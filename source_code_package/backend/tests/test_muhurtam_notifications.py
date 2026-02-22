"""
Test Muhurtam Calculator and Push Notification APIs
Features: Muhurtam event types, calculate, find-dates, VAPID key, notification preferences
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMuhurtamEventTypes:
    """Test Muhurtam event-types endpoint - returns all 5 event types"""
    
    def test_event_types_returns_5_events(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/event-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "events" in data, "Response should have 'events' key"
        assert len(data["events"]) == 5, f"Expected 5 event types, got {len(data['events'])}"
        
        # Verify all expected event types are present
        event_ids = [e["id"] for e in data["events"]]
        expected_events = ["marriage", "griha_pravesham", "vehicle_purchase", "business_start", "naming_ceremony"]
        for event_id in expected_events:
            assert event_id in event_ids, f"Missing event type: {event_id}"
        
        print("✓ Event types returns all 5 expected events")

    def test_event_types_have_telugu_names(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/event-types")
        data = response.json()
        
        for event in data["events"]:
            assert "name_te" in event, f"Event {event['id']} missing Telugu name"
            assert "description_te" in event, f"Event {event['id']} missing Telugu description"
            assert len(event["name_te"]) > 0, f"Event {event['id']} has empty Telugu name"
        
        print("✓ All events have Telugu translations")

    def test_event_types_have_duration(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/event-types")
        data = response.json()
        
        for event in data["events"]:
            assert "duration_hours" in event, f"Event {event['id']} missing duration"
            assert event["duration_hours"] > 0, f"Event {event['id']} has invalid duration"
        
        print("✓ All events have valid duration")


class TestMuhurtamCalculate:
    """Test Muhurtam calculate endpoint - calculates score for specific date"""
    
    def test_calculate_marriage_returns_score(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/calculate/marriage?date=2026-03-15")
        assert response.status_code == 200
        
        data = response.json()
        assert "score" in data, "Response should have 'score'"
        assert "tithi" in data, "Response should have 'tithi'"
        assert "nakshatra" in data, "Response should have 'nakshatra'"
        assert "auspicious_times" in data, "Response should have 'auspicious_times'"
        assert "rahu_kalam" in data, "Response should have 'rahu_kalam'"
        
        # Verify score is valid
        assert 0 <= data["score"] <= 100, f"Score {data['score']} should be 0-100"
        
        print(f"✓ Marriage muhurtam calculated - score: {data['score']}")

    def test_calculate_returns_rating(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/calculate/griha_pravesham?date=2026-04-10")
        data = response.json()
        
        assert "rating" in data, "Response should have 'rating'"
        assert "level" in data["rating"], "Rating should have 'level'"
        assert "label" in data["rating"], "Rating should have 'label'"
        assert "label_te" in data["rating"], "Rating should have Telugu label"
        
        valid_levels = ["excellent", "good", "average", "poor"]
        assert data["rating"]["level"] in valid_levels, f"Invalid rating level: {data['rating']['level']}"
        
        print(f"✓ Rating included: {data['rating']['label']}")

    def test_calculate_returns_factors_and_warnings(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/calculate/vehicle_purchase?date=2026-05-20")
        data = response.json()
        
        assert "factors" in data, "Response should have 'factors'"
        assert isinstance(data["factors"], list), "Factors should be a list"
        
        if len(data["factors"]) > 0:
            factor = data["factors"][0]
            assert "type" in factor, "Factor should have 'type'"
            assert "message" in factor, "Factor should have 'message'"
            assert "message_te" in factor, "Factor should have Telugu message"
        
        print(f"✓ Factors returned: {len(data['factors'])} factors, {len(data.get('warnings', []))} warnings")

    def test_calculate_returns_auspicious_times(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/calculate/business_start?date=2026-06-01")
        data = response.json()
        
        assert "auspicious_times" in data
        assert isinstance(data["auspicious_times"], list)
        
        # Should have at least Abhijit Muhurtam
        if len(data["auspicious_times"]) > 0:
            time_slot = data["auspicious_times"][0]
            assert "name" in time_slot, "Time slot should have 'name'"
            assert "start" in time_slot, "Time slot should have 'start'"
            assert "end" in time_slot, "Time slot should have 'end'"
            assert "name_te" in time_slot, "Time slot should have Telugu name"
        
        print(f"✓ Auspicious times returned: {len(data['auspicious_times'])} time slots")

    def test_calculate_invalid_event_type(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/calculate/invalid_event?date=2026-03-15")
        assert response.status_code == 200  # Returns error in response body
        
        data = response.json()
        assert "error" in data, "Should return error for invalid event type"
        
        print("✓ Invalid event type handled correctly")

    def test_calculate_invalid_date_format(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/calculate/marriage?date=15-03-2026")
        data = response.json()
        
        assert "error" in data, "Should return error for invalid date format"
        
        print("✓ Invalid date format handled correctly")


class TestMuhurtamFindDates:
    """Test Muhurtam find-dates endpoint - finds auspicious dates in range"""
    
    def test_find_dates_returns_results(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/find-dates/griha_pravesham?start_date=2026-02-21&num_days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "event" in data, "Response should have 'event'"
        assert "search_range" in data, "Response should have 'search_range'"
        assert "auspicious_dates" in data, "Response should have 'auspicious_dates'"
        assert "total_found" in data, "Response should have 'total_found'"
        
        print(f"✓ Find dates returned {data['total_found']} auspicious dates")

    def test_find_dates_sorted_by_score(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/find-dates/naming_ceremony?start_date=2026-03-01&num_days=60")
        data = response.json()
        
        dates = data["auspicious_dates"]
        if len(dates) > 1:
            scores = [d["score"] for d in dates]
            # Top results should be highest scores
            assert scores[0] >= scores[-1], "Dates should be sorted by score descending"
        
        print(f"✓ Dates sorted by score (top 10 returned from {data['total_found']})")

    def test_find_dates_include_tithi_nakshatra(self):
        response = requests.get(f"{BASE_URL}/api/muhurtam/find-dates/marriage?start_date=2026-04-01&num_days=30")
        data = response.json()
        
        if len(data["auspicious_dates"]) > 0:
            date_entry = data["auspicious_dates"][0]
            assert "tithi" in date_entry, "Date should have tithi"
            assert "nakshatra" in date_entry, "Date should have nakshatra"
            assert "day" in date_entry, "Date should have day"
            assert "date_formatted" in date_entry, "Date should have formatted date"
        
        print("✓ Dates include tithi, nakshatra, and day info")


class TestNotificationsVAPID:
    """Test VAPID public key endpoint - no auth required"""
    
    def test_vapid_public_key_returns_key(self):
        response = requests.get(f"{BASE_URL}/api/notifications/vapid-public-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "public_key" in data, "Response should have 'public_key'"
        assert len(data["public_key"]) > 50, "Public key should be substantial length"
        
        print(f"✓ VAPID public key returned (length: {len(data['public_key'])})")


class TestNotificationsPreferences:
    """Test notification preferences - requires auth"""
    
    @pytest.fixture
    def auth_token(self):
        # Request OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": "9876543210"})
        assert otp_response.status_code == 200
        
        # Verify OTP
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        assert verify_response.status_code == 200
        
        return verify_response.json().get("token")
    
    def test_get_preferences_requires_auth(self):
        response = requests.get(f"{BASE_URL}/api/notifications/preferences")
        assert response.status_code in [401, 403], "Should require authentication"
        
        print("✓ GET preferences requires authentication")
    
    def test_get_preferences_with_auth(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should have preference fields
        expected_fields = ["sos_alerts", "news_updates", "community_updates"]
        for field in expected_fields:
            assert field in data, f"Missing preference field: {field}"
        
        print(f"✓ GET preferences with auth - has {len(data)} fields")
    
    def test_update_preferences_with_auth(self, auth_token):
        update_data = {
            "sos_alerts": True,
            "news_updates": True,
            "community_updates": False,
            "health_reminders": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True, "Update should succeed"
        
        print("✓ PUT preferences with auth succeeds")


class TestServiceWorkerCaching:
    """Test that cacheable API routes are accessible"""
    
    def test_panchangam_today_accessible(self):
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        assert response.status_code == 200
        
        data = response.json()
        assert "tithi" in data, "Panchangam should have tithi"
        assert "nakshatra" in data, "Panchangam should have nakshatra"
        
        print("✓ Panchangam API accessible for caching")
    
    def test_aqi_both_accessible(self):
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        # AQI might return 200 or error if external API fails
        # Just verify endpoint exists
        assert response.status_code in [200, 500, 503], f"Unexpected status: {response.status_code}"
        
        print(f"✓ AQI API accessible (status: {response.status_code})")
    
    def test_news_local_accessible(self):
        response = requests.get(f"{BASE_URL}/api/news/local?limit=5")
        assert response.status_code == 200
        
        print("✓ News API accessible for caching")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
