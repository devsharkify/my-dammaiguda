"""
Test Panchangam API and related Astrology features
Tests: Panchangam with Telugu translations, Rahu Kalam, Yamagandam, Gulika, Abhijit Muhurtam
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPanchangamAPI:
    """Test Panchangam API endpoints"""
    
    def test_panchangam_today_endpoint_exists(self):
        """Test GET /api/panchangam/today returns 200"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: /api/panchangam/today endpoint returns 200")
    
    def test_panchangam_has_tithi(self):
        """Test that Panchangam contains Tithi with Telugu translation"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "tithi" in data, "tithi field missing"
        tithi = data["tithi"]
        assert "name" in tithi, "tithi.name missing"
        assert "name_te" in tithi, "tithi.name_te (Telugu) missing"
        assert "paksha" in tithi, "tithi.paksha missing"
        print(f"SUCCESS: Tithi found - {tithi['name']} ({tithi['name_te']}), {tithi['paksha']} paksha")
    
    def test_panchangam_has_nakshatra(self):
        """Test that Panchangam contains Nakshatra with Telugu translation"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "nakshatra" in data, "nakshatra field missing"
        nakshatra = data["nakshatra"]
        assert "name" in nakshatra, "nakshatra.name missing"
        assert "name_te" in nakshatra, "nakshatra.name_te (Telugu) missing"
        print(f"SUCCESS: Nakshatra found - {nakshatra['name']} ({nakshatra['name_te']})")
    
    def test_panchangam_has_yoga(self):
        """Test that Panchangam contains Yoga with Telugu translation"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "yoga" in data, "yoga field missing"
        yoga = data["yoga"]
        assert "name" in yoga, "yoga.name missing"
        assert "name_te" in yoga, "yoga.name_te (Telugu) missing"
        print(f"SUCCESS: Yoga found - {yoga['name']} ({yoga['name_te']})")
    
    def test_panchangam_has_karana(self):
        """Test that Panchangam contains Karana with Telugu translation"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "karana" in data, "karana field missing"
        karana = data["karana"]
        assert "name" in karana, "karana.name missing"
        assert "name_te" in karana, "karana.name_te (Telugu) missing"
        print(f"SUCCESS: Karana found - {karana['name']} ({karana['name_te']})")
    
    def test_panchangam_has_rahu_kalam(self):
        """Test that Panchangam contains Rahu Kalam"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "rahu_kalam" in data, "rahu_kalam field missing"
        rahu = data["rahu_kalam"]
        assert "time" in rahu, "rahu_kalam.time missing"
        assert "name_te" in rahu, "rahu_kalam.name_te (Telugu) missing"
        assert rahu["name_te"] == "రాహు కాలం", f"Expected 'రాహు కాలం', got '{rahu['name_te']}'"
        print(f"SUCCESS: Rahu Kalam found - {rahu['time']} ({rahu['name_te']})")
    
    def test_panchangam_has_yamagandam(self):
        """Test that Panchangam contains Yamagandam"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "yamagandam" in data, "yamagandam field missing"
        yama = data["yamagandam"]
        assert "time" in yama, "yamagandam.time missing"
        assert "name_te" in yama, "yamagandam.name_te (Telugu) missing"
        assert yama["name_te"] == "యమగండం", f"Expected 'యమగండం', got '{yama['name_te']}'"
        print(f"SUCCESS: Yamagandam found - {yama['time']} ({yama['name_te']})")
    
    def test_panchangam_has_gulika(self):
        """Test that Panchangam contains Gulika Kalam"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "gulika" in data, "gulika field missing"
        gulika = data["gulika"]
        assert "time" in gulika, "gulika.time missing"
        assert "name_te" in gulika, "gulika.name_te (Telugu) missing"
        assert gulika["name_te"] == "గుళిక కాలం", f"Expected 'గుళిక కాలం', got '{gulika['name_te']}'"
        print(f"SUCCESS: Gulika Kalam found - {gulika['time']} ({gulika['name_te']})")
    
    def test_panchangam_has_abhijit_muhurtam(self):
        """Test that Panchangam contains Abhijit Muhurtam"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "abhijit_muhurtam" in data, "abhijit_muhurtam field missing"
        abhijit = data["abhijit_muhurtam"]
        assert "time" in abhijit, "abhijit_muhurtam.time missing"
        assert "name_te" in abhijit, "abhijit_muhurtam.name_te (Telugu) missing"
        assert abhijit["name_te"] == "అభిజిత్ ముహూర్తం", f"Expected 'అభిజిత్ ముహూర్తం', got '{abhijit['name_te']}'"
        print(f"SUCCESS: Abhijit Muhurtam found - {abhijit['time']} ({abhijit['name_te']})")
    
    def test_panchangam_has_amrit_kalam(self):
        """Test that Panchangam contains Amrit Kalam"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "amrit_kalam" in data, "amrit_kalam field missing"
        amrit = data["amrit_kalam"]
        assert "time" in amrit, "amrit_kalam.time missing"
        assert "name_te" in amrit, "amrit_kalam.name_te (Telugu) missing"
        assert amrit["name_te"] == "అమృత కాలం", f"Expected 'అమృత కాలం', got '{amrit['name_te']}'"
        print(f"SUCCESS: Amrit Kalam found - {amrit['time']} ({amrit['name_te']})")
    
    def test_panchangam_has_durmuhurtam(self):
        """Test that Panchangam contains Durmuhurtam"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "durmuhurtam" in data, "durmuhurtam field missing"
        dur = data["durmuhurtam"]
        assert "time" in dur, "durmuhurtam.time missing"
        assert "name_te" in dur, "durmuhurtam.name_te (Telugu) missing"
        print(f"SUCCESS: Durmuhurtam found - {dur['time']} ({dur['name_te']})")
    
    def test_panchangam_has_sunrise_sunset(self):
        """Test that Panchangam contains sunrise and sunset times"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "sunrise" in data, "sunrise field missing"
        assert "sunset" in data, "sunset field missing"
        print(f"SUCCESS: Sunrise: {data['sunrise']}, Sunset: {data['sunset']}")
    
    def test_panchangam_has_telugu_day(self):
        """Test that Panchangam contains Telugu day name"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "day" in data, "day field missing"
        day = data["day"]
        assert "telugu" in day, "day.telugu missing"
        assert "english" in day, "day.english missing"
        print(f"SUCCESS: Day - {day['english']} ({day['telugu']})")
    
    def test_panchangam_has_telugu_month(self):
        """Test that Panchangam contains Telugu month"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        assert "telugu_month" in data, "telugu_month field missing"
        month = data["telugu_month"]
        assert "name_te" in month, "telugu_month.name_te missing"
        assert "name" in month, "telugu_month.name missing"
        print(f"SUCCESS: Month - {month['name']} ({month['name_te']})")
    
    def test_panchangam_date_endpoint(self):
        """Test GET /api/panchangam/date/{date} endpoint"""
        response = requests.get(f"{BASE_URL}/api/panchangam/date/2026-02-21")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["date"] == "2026-02-21"
        print("SUCCESS: /api/panchangam/date/{date} endpoint working")
    
    def test_panchangam_invalid_date_format(self):
        """Test GET /api/panchangam/date/{date} with invalid format"""
        response = requests.get(f"{BASE_URL}/api/panchangam/date/invalid-date")
        data = response.json()
        assert "error" in data, "Expected error message for invalid date"
        print("SUCCESS: Invalid date format properly handled")
    
    def test_complete_panchangam_structure(self):
        """Test that complete Panchangam has all required fields"""
        response = requests.get(f"{BASE_URL}/api/panchangam/today")
        data = response.json()
        
        required_fields = [
            "date", "date_formatted", "day", "telugu_month", "tithi", 
            "nakshatra", "yoga", "karana", "sunrise", "sunset",
            "rahu_kalam", "yamagandam", "gulika", "abhijit_muhurtam",
            "durmuhurtam", "amrit_kalam", "generated_at"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"SUCCESS: All {len(required_fields)} required Panchangam fields present")


class TestAQIWidget:
    """Test AQI API endpoints"""
    
    def test_aqi_both_endpoint(self):
        """Test GET /api/aqi/both returns both location data"""
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "dammaiguda" in data, "dammaiguda location missing"
        assert "hyderabad" in data, "hyderabad location missing"
        print(f"SUCCESS: AQI data for both locations - Dammaiguda: {data['dammaiguda'].get('aqi')}, Hyderabad: {data['hyderabad'].get('aqi')}")


class TestAstrologyKundali:
    """Test Kundali API endpoint"""
    
    def test_kundali_generation(self):
        """Test POST /api/astrology/kundali generates kundali"""
        payload = {
            "name": "TEST_User",
            "gender": "male",
            "date_of_birth": "1990-05-15",
            "time_of_birth": "10:30",
            "place_of_birth": "Hyderabad"
        }
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Kundali generation failed"
        assert "kundali" in data, "kundali data missing"
        
        kundali = data["kundali"]
        assert "moon_sign" in kundali, "moon_sign missing"
        assert "sun_sign" in kundali, "sun_sign missing"
        assert "nakshatra" in kundali, "nakshatra missing"
        print(f"SUCCESS: Kundali generated - Moon: {kundali['moon_sign']['name']}, Sun: {kundali['sun_sign']['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
