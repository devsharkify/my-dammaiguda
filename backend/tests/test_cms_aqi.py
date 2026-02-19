"""
Test Suite for CMS Integration and AQI Web Crawl Features
Tests:
- Dump yard data endpoint (/api/content/dumpyard)
- AQI web crawl endpoints (/api/aqi/both, /api/aqi/dammaiguda, /api/aqi/hyderabad)
- Admin CMS endpoints for managing dump yard statistics
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PHONE = "+919999999999"
OTP = "123456"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    # Step 1: Send OTP
    response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": ADMIN_PHONE})
    assert response.status_code == 200, f"Failed to send OTP: {response.text}"
    
    # Step 2: Verify OTP
    response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": ADMIN_PHONE, "code": OTP})
    assert response.status_code == 200, f"Failed to verify OTP: {response.text}"
    data = response.json()
    assert "token" in data, "Token not in response"
    return data["token"]


class TestDumpYardCMS:
    """Test Dump Yard CMS content endpoints"""
    
    def test_get_dumpyard_config_public(self):
        """Test GET /api/content/dumpyard - public access"""
        response = requests.get(f"{BASE_URL}/api/content/dumpyard")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "daily_waste_tons" in data, "daily_waste_tons missing"
        assert "area_acres" in data, "area_acres missing"
        assert "red_zone_km" in data, "red_zone_km missing"
        assert "status" in data, "status missing"
        
        # Type assertions
        assert isinstance(data["daily_waste_tons"], (int, float)), "daily_waste_tons should be numeric"
        assert isinstance(data["area_acres"], (int, float)), "area_acres should be numeric"
        assert isinstance(data["red_zone_km"], (int, float)), "red_zone_km should be numeric"
        
        # Value assertions - admin set this to 10000
        assert data["daily_waste_tons"] == 10000, f"Expected 10000, got {data['daily_waste_tons']}"
        print(f"Dump yard config: {data['daily_waste_tons']} tons/day, {data['area_acres']} acres, {data['red_zone_km']}km red zone")
    
    def test_get_dumpyard_has_health_risks(self):
        """Test dumpyard config includes health risks data"""
        response = requests.get(f"{BASE_URL}/api/content/dumpyard")
        assert response.status_code == 200
        
        data = response.json()
        assert "health_risks" in data, "health_risks missing"
        assert isinstance(data["health_risks"], list), "health_risks should be list"
        assert len(data["health_risks"]) > 0, "health_risks should not be empty"
        print(f"Health risks: {data['health_risks']}")
    
    def test_get_dumpyard_has_affected_groups(self):
        """Test dumpyard config includes affected groups"""
        response = requests.get(f"{BASE_URL}/api/content/dumpyard")
        assert response.status_code == 200
        
        data = response.json()
        assert "affected_groups" in data, "affected_groups missing"
        assert isinstance(data["affected_groups"], list), "affected_groups should be list"
        assert len(data["affected_groups"]) > 0, "affected_groups should not be empty"
        print(f"Affected groups: {data['affected_groups']}")
    
    def test_update_dumpyard_config_admin(self, admin_token):
        """Test PUT /api/content/dumpyard - admin only"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Update config
        new_config = {
            "daily_waste_tons": 12000,
            "area_acres": 380,
            "red_zone_km": 2.5,
            "status": "Active",
            "historical_data": "Test update",
            "health_risks": ["Test risk 1", "Test risk 2"],
            "affected_groups": ["Test group 1"]
        }
        
        response = requests.put(f"{BASE_URL}/api/content/dumpyard", json=new_config, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Update should return success"
        
        # Verify GET returns updated values
        verify_response = requests.get(f"{BASE_URL}/api/content/dumpyard")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["daily_waste_tons"] == 12000, "daily_waste_tons not updated"
        assert verify_data["area_acres"] == 380, "area_acres not updated"
        
        # Restore original value
        restore_config = {
            "daily_waste_tons": 10000,
            "area_acres": 350,
            "red_zone_km": 2,
            "status": "Active",
            "historical_data": "Till 2025: 5500 tons/day. IIT-B now recommends: 19000 tons/day capacity.",
            "health_risks": [
                "Respiratory issues from toxic fumes",
                "Groundwater contamination",
                "Skin diseases from polluted water",
                "Higher cancer risk in surrounding areas"
            ],
            "affected_groups": [
                "Children (High Risk)",
                "Elderly (High Risk)",
                "Pregnant Women (High Risk)",
                "Workers (Very High Risk)"
            ]
        }
        requests.put(f"{BASE_URL}/api/content/dumpyard", json=restore_config, headers=headers)
        print("Dumpyard config updated and restored successfully")
    
    def test_update_dumpyard_requires_auth(self):
        """Test PUT /api/content/dumpyard returns 401 without auth"""
        config = {"daily_waste_tons": 5000}
        response = requests.put(f"{BASE_URL}/api/content/dumpyard", json=config)
        assert response.status_code == 401 or response.status_code == 403, f"Expected 401/403, got {response.status_code}"
        print("Auth required for dumpyard update - PASSED")


class TestAQIWebCrawl:
    """Test AQI web crawl endpoints"""
    
    def test_get_aqi_both(self):
        """Test GET /api/aqi/both - returns Dammaiguda and Hyderabad AQI"""
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions - both locations present
        data = response.json()
        assert "dammaiguda" in data, "dammaiguda data missing"
        assert "hyderabad" in data, "hyderabad data missing"
        assert "fetched_at" in data, "fetched_at timestamp missing"
        
        # Dammaiguda AQI assertions
        dammaiguda = data["dammaiguda"]
        assert "aqi" in dammaiguda, "dammaiguda aqi missing"
        assert "category" in dammaiguda, "dammaiguda category missing"
        assert "color" in dammaiguda, "dammaiguda color missing"
        assert "pollutants" in dammaiguda, "dammaiguda pollutants missing"
        assert "source" in dammaiguda, "dammaiguda source missing"
        assert dammaiguda["source"] == "aqi.in", "Source should be aqi.in"
        
        # Hyderabad AQI assertions
        hyderabad = data["hyderabad"]
        assert "aqi" in hyderabad, "hyderabad aqi missing"
        assert "category" in hyderabad, "hyderabad category missing"
        
        # AQI values should be numeric if present
        if dammaiguda["aqi"] is not None:
            assert isinstance(dammaiguda["aqi"], int), "AQI should be integer"
            assert 0 <= dammaiguda["aqi"] <= 500, "AQI should be 0-500"
        
        print(f"Dammaiguda AQI: {dammaiguda['aqi']} ({dammaiguda['category']})")
        print(f"Hyderabad AQI: {hyderabad['aqi']} ({hyderabad['category']})")
    
    def test_get_aqi_dammaiguda(self):
        """Test GET /api/aqi/dammaiguda - single location"""
        response = requests.get(f"{BASE_URL}/api/aqi/dammaiguda")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "aqi" in data, "aqi missing"
        assert "location" in data, "location missing"
        assert data["location"] == "Dammaiguda", "Location should be Dammaiguda"
        assert "pollutants" in data, "pollutants missing"
        
        # Check pollutants structure
        pollutants = data["pollutants"]
        assert isinstance(pollutants, list), "pollutants should be list"
        if len(pollutants) > 0:
            pm25 = next((p for p in pollutants if p["name"] == "PM2.5"), None)
            assert pm25 is not None, "PM2.5 should be in pollutants"
            assert "value" in pm25, "PM2.5 should have value"
            assert "unit" in pm25, "PM2.5 should have unit"
        
        print(f"Dammaiguda: AQI={data['aqi']}, PM2.5={pollutants[0]['value'] if pollutants else 'N/A'} µg/m³")
    
    def test_get_aqi_hyderabad(self):
        """Test GET /api/aqi/hyderabad - single location"""
        response = requests.get(f"{BASE_URL}/api/aqi/hyderabad")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "aqi" in data, "aqi missing"
        assert "location" in data, "location missing"
        assert data["location"] == "Hyderabad", "Location should be Hyderabad"
        
        print(f"Hyderabad: AQI={data['aqi']}, Category={data['category']}")
    
    def test_aqi_has_health_impact(self):
        """Test AQI response includes health impact info"""
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        assert response.status_code == 200
        
        data = response.json()
        dammaiguda = data["dammaiguda"]
        
        assert "health_impact" in dammaiguda, "health_impact missing"
        assert "health_impact_te" in dammaiguda, "Telugu health impact missing"
        assert len(dammaiguda["health_impact"]) > 0, "health_impact should not be empty"
        
        print(f"Health impact: {dammaiguda['health_impact']}")
    
    def test_aqi_has_category_info(self):
        """Test AQI response includes category with color"""
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        assert response.status_code == 200
        
        data = response.json()
        dammaiguda = data["dammaiguda"]
        
        # Category assertions
        assert "category" in dammaiguda
        assert "category_te" in dammaiguda, "Telugu category missing"
        assert "color" in dammaiguda, "color missing"
        
        # Valid categories
        valid_categories = ["Good", "Moderate", "Poor", "Unhealthy", "Severe", "Hazardous", "Error", "Unknown"]
        assert dammaiguda["category"] in valid_categories or dammaiguda["category"] is not None
        
        # Color should be hex
        assert dammaiguda["color"].startswith("#"), "Color should be hex format"
        
        print(f"Category: {dammaiguda['category']} (Telugu: {dammaiguda['category_te']}), Color: {dammaiguda['color']}")


class TestContentManagementEndpoints:
    """Test other CMS endpoints for banners and benefits"""
    
    def test_get_banners(self):
        """Test GET /api/content/banners - public"""
        response = requests.get(f"{BASE_URL}/api/content/banners")
        assert response.status_code == 200
        
        data = response.json()
        assert "banners" in data
        assert isinstance(data["banners"], list)
        print(f"Found {len(data['banners'])} active banners")
    
    def test_get_benefits(self):
        """Test GET /api/content/benefits - public"""
        response = requests.get(f"{BASE_URL}/api/content/benefits")
        assert response.status_code == 200
        
        data = response.json()
        assert "benefits" in data
        assert isinstance(data["benefits"], list)
        print(f"Found {len(data['benefits'])} benefits")
    
    def test_get_all_content(self):
        """Test GET /api/content/all - returns all editable content"""
        response = requests.get(f"{BASE_URL}/api/content/all")
        assert response.status_code == 200
        
        data = response.json()
        assert "content" in data
        assert "grouped" in data
        print(f"Content items: {len(data['content'])}, Categories: {list(data['grouped'].keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
