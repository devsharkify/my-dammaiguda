"""
Test suite for Astrology Module - Kundali, Compatibility, and Zodiac Horoscope APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAstrologyKundaliAPI:
    """Tests for Kundali (Birth Chart) generation API"""
    
    def test_kundali_with_valid_data(self):
        """Test kundali generation with all valid inputs"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Test User",
            "gender": "male",
            "date_of_birth": "1990-05-15",
            "time_of_birth": "10:30",
            "place_of_birth": "Hyderabad"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify success
        assert data["success"] == True
        
        # Verify kundali structure
        kundali = data["kundali"]
        assert kundali["name"] == "Test User"
        assert kundali["gender"] == "male"
        assert kundali["date_of_birth"] == "1990-05-15"
        assert kundali["time_of_birth"] == "10:30"
        
        # Verify required fields exist
        assert "lagna" in kundali
        assert "moon_sign" in kundali
        assert "sun_sign" in kundali
        assert "nakshatra" in kundali
        assert "planets" in kundali
        assert "houses" in kundali
        assert "vimshottari_dasha" in kundali
        
        print("PASS: Kundali generated successfully with all required fields")
    
    def test_kundali_with_free_text_city(self):
        """Test kundali generation with free-text city input (not from dropdown)"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Free Text City Test",
            "gender": "female",
            "date_of_birth": "1995-08-20",
            "time_of_birth": "14:00",
            "place_of_birth": "Mumbai"  # Known city
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["kundali"]["place_of_birth"] == "Mumbai"
        print("PASS: Kundali works with free-text city input (known city)")
    
    def test_kundali_with_unknown_city_defaults_to_hyderabad(self):
        """Test that unknown city defaults to Hyderabad coordinates"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Unknown City Test",
            "gender": "male",
            "date_of_birth": "2000-01-01",
            "time_of_birth": "06:00",
            "place_of_birth": "Unknown Random City XYZ"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # Should default to Hyderabad coordinates
        assert data["kundali"]["coordinates"]["lat"] == 17.385
        assert data["kundali"]["coordinates"]["lon"] == 78.4867
        print("PASS: Unknown city defaults to Hyderabad coordinates")
    
    def test_kundali_dammaiguda_city(self):
        """Test kundali with Dammaiguda (local city) input"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Dammaiguda Resident",
            "gender": "male",
            "date_of_birth": "1985-12-31",
            "time_of_birth": "23:59",
            "place_of_birth": "dammaiguda"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["kundali"]["coordinates"]["lat"] == 17.4844
        print("PASS: Dammaiguda city coordinates resolved correctly")
    
    def test_kundali_planetary_positions(self):
        """Verify planetary positions are returned correctly"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Planet Test",
            "gender": "male",
            "date_of_birth": "1990-01-15",
            "time_of_birth": "10:30",
            "place_of_birth": "Hyderabad"
        })
        
        assert response.status_code == 200
        data = response.json()
        planets = data["kundali"]["planets"]
        
        # Should have 9 planets (Surya, Chandra, Mangal, Budha, Guru, Shukra, Shani, Rahu, Ketu)
        assert len(planets) == 9
        
        # Verify each planet has required fields
        for planet in planets:
            assert "planet" in planet
            assert "longitude" in planet
            assert "rashi" in planet
            assert planet["planet"]["name"] is not None
            assert planet["planet"]["symbol"] is not None
        
        print("PASS: All 9 planetary positions returned correctly")
    
    def test_kundali_houses_chart(self):
        """Verify 12 houses are returned for South Indian chart"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "House Test",
            "gender": "female",
            "date_of_birth": "1992-06-15",
            "time_of_birth": "08:00",
            "place_of_birth": "Chennai"
        })
        
        assert response.status_code == 200
        data = response.json()
        houses = data["kundali"]["houses"]
        
        # Should have exactly 12 houses
        assert len(houses) == 12
        
        # Verify each house has required structure
        for house in houses:
            assert "house_number" in house
            assert "rashi" in house
            assert house["house_number"] >= 1 and house["house_number"] <= 12
        
        print("PASS: 12 houses returned for South Indian chart")
    
    def test_kundali_dasha_periods(self):
        """Verify Vimshottari Dasha periods are calculated"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Dasha Test",
            "gender": "male",
            "date_of_birth": "1988-03-21",
            "time_of_birth": "12:00",
            "place_of_birth": "Bangalore"
        })
        
        assert response.status_code == 200
        data = response.json()
        dashas = data["kundali"]["vimshottari_dasha"]
        
        # Should have 9 dasha periods
        assert len(dashas) == 9
        
        # Verify each dasha has required fields
        for dasha in dashas:
            assert "lord" in dasha
            assert "years" in dasha
            assert "start" in dasha
            assert "end" in dasha
        
        print("PASS: Vimshottari Dasha periods calculated correctly")
    
    def test_kundali_nakshatra_and_moon_sign(self):
        """Verify Nakshatra and Moon sign are calculated"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Nakshatra Test",
            "gender": "female",
            "date_of_birth": "1997-11-11",
            "time_of_birth": "17:30",
            "place_of_birth": "Vijayawada"
        })
        
        assert response.status_code == 200
        data = response.json()
        kundali = data["kundali"]
        
        # Verify nakshatra structure
        assert "nakshatra" in kundali
        assert "name" in kundali["nakshatra"]
        assert "name_te" in kundali["nakshatra"]
        assert "lord" in kundali["nakshatra"]
        
        # Verify moon sign structure
        assert "moon_sign" in kundali
        assert "name" in kundali["moon_sign"]
        assert "symbol" in kundali["moon_sign"]
        assert "english" in kundali["moon_sign"]
        
        print("PASS: Nakshatra and Moon sign calculated correctly")


class TestAstrologyHelperEndpoints:
    """Tests for helper endpoints - cities, rashis, nakshatras"""
    
    def test_get_cities_list(self):
        """Test cities list endpoint"""
        response = requests.get(f"{BASE_URL}/api/astrology/cities")
        
        assert response.status_code == 200
        data = response.json()
        assert "cities" in data
        assert len(data["cities"]) > 0
        
        # Verify Dammaiguda is in the list
        city_names = [c["name"].lower() for c in data["cities"]]
        assert "dammaiguda" in city_names
        print(f"PASS: Cities endpoint returns {len(data['cities'])} cities including Dammaiguda")
    
    def test_get_rashis_list(self):
        """Test Rashis (zodiac signs) list endpoint"""
        response = requests.get(f"{BASE_URL}/api/astrology/rashis")
        
        assert response.status_code == 200
        data = response.json()
        assert "rashis" in data
        assert len(data["rashis"]) == 12  # 12 zodiac signs
        
        # Verify first rashi (Mesha/Aries)
        assert data["rashis"][0]["name"] == "Mesha"
        assert data["rashis"][0]["english"] == "Aries"
        print("PASS: Rashis endpoint returns all 12 zodiac signs")
    
    def test_get_nakshatras_list(self):
        """Test Nakshatras (birth stars) list endpoint"""
        response = requests.get(f"{BASE_URL}/api/astrology/nakshatras")
        
        assert response.status_code == 200
        data = response.json()
        assert "nakshatras" in data
        assert len(data["nakshatras"]) == 27  # 27 nakshatras
        
        # Verify first nakshatra (Ashwini)
        assert data["nakshatras"][0]["name"] == "Ashwini"
        print("PASS: Nakshatras endpoint returns all 27 birth stars")


class TestMarriageCompatibility:
    """Tests for Marriage Compatibility feature (Kundali Milan/Guna Matching)"""
    
    def test_kundali_for_boy_and_girl(self):
        """Test generating kundali for both boy and girl for compatibility"""
        # Generate kundali for boy
        boy_response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Rahul Kumar",
            "gender": "male",
            "date_of_birth": "1992-03-15",
            "time_of_birth": "09:30",
            "place_of_birth": "Hyderabad"
        })
        
        # Generate kundali for girl
        girl_response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Priya Sharma",
            "gender": "female",
            "date_of_birth": "1994-06-20",
            "time_of_birth": "14:00",
            "place_of_birth": "Bangalore"
        })
        
        assert boy_response.status_code == 200
        assert girl_response.status_code == 200
        
        boy_kundali = boy_response.json()["kundali"]
        girl_kundali = girl_response.json()["kundali"]
        
        # Both should have moon sign and nakshatra for compatibility calculation
        assert "moon_sign" in boy_kundali
        assert "moon_sign" in girl_kundali
        assert "nakshatra" in boy_kundali
        assert "nakshatra" in girl_kundali
        
        print(f"PASS: Boy ({boy_kundali['moon_sign']['english']}) and Girl ({girl_kundali['moon_sign']['english']}) kundalis generated for compatibility")


class TestKundaliEdgeCases:
    """Edge case tests for Kundali API"""
    
    def test_kundali_with_midnight_birth(self):
        """Test kundali with midnight birth time"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Midnight Birth",
            "gender": "male",
            "date_of_birth": "1990-01-01",
            "time_of_birth": "00:00",
            "place_of_birth": "Delhi"
        })
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        print("PASS: Midnight birth time handled correctly")
    
    def test_kundali_with_late_night_birth(self):
        """Test kundali with 11:59 PM birth time"""
        response = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Late Night Birth",
            "gender": "female",
            "date_of_birth": "1995-12-31",
            "time_of_birth": "23:59",
            "place_of_birth": "Mumbai"
        })
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        print("PASS: 11:59 PM birth time handled correctly")
    
    def test_kundali_case_insensitive_city(self):
        """Test city name is case insensitive"""
        response1 = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Upper Case City",
            "gender": "male",
            "date_of_birth": "1990-01-01",
            "time_of_birth": "12:00",
            "place_of_birth": "HYDERABAD"
        })
        
        response2 = requests.post(f"{BASE_URL}/api/astrology/kundali", json={
            "name": "Lower Case City",
            "gender": "male",
            "date_of_birth": "1990-01-01",
            "time_of_birth": "12:00",
            "place_of_birth": "hyderabad"
        })
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Both should use same Hyderabad coordinates
        assert response1.json()["kundali"]["coordinates"]["lat"] == response2.json()["kundali"]["coordinates"]["lat"]
        print("PASS: City name is case insensitive")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
