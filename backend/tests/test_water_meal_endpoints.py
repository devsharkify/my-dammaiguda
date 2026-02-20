"""
Test Water and Meal Logging APIs in Kaizer Doctor module
Tests persistence of water/meal data via /api/doctor/water and /api/doctor/meal endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestWaterMealEndpoints:
    """Test water and meal logging endpoints - Kaizer Doctor module"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - authenticate and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Authenticate with test credentials
        response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "9876543210"
        })
        assert response.status_code == 200, f"Failed to send OTP: {response.text}"
        
        # Verify OTP (mocked - static 123456)
        response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        assert response.status_code == 200, f"Failed to verify OTP: {response.text}"
        
        data = response.json()
        self.token = data.get("token")
        assert self.token, "No token received from login"
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print(f"Authentication successful, token received")
    
    # ============== WATER LOGGING TESTS ==============
    
    def test_get_water_initial(self):
        """GET /api/doctor/water - should return today's water intake (0 if none logged)"""
        response = self.session.get(f"{BASE_URL}/api/doctor/water")
        
        assert response.status_code == 200, f"Failed to get water: {response.text}"
        data = response.json()
        
        # Should return object with glasses count
        assert "glasses" in data, f"Response missing 'glasses' field: {data}"
        assert isinstance(data["glasses"], int), f"Glasses should be int: {data}"
        print(f"GET water - current glasses: {data['glasses']}")
    
    def test_post_water_log_glasses(self):
        """POST /api/doctor/water - should increment water glasses"""
        # Get initial water count
        response = self.session.get(f"{BASE_URL}/api/doctor/water")
        assert response.status_code == 200
        initial_glasses = response.json().get("glasses", 0)
        
        # Log 1 glass
        response = self.session.post(f"{BASE_URL}/api/doctor/water", json={
            "glasses": 1
        })
        
        assert response.status_code == 200, f"Failed to log water: {response.text}"
        data = response.json()
        
        # Should return updated glasses count
        assert "glasses" in data, f"Response missing 'glasses': {data}"
        assert data["glasses"] == initial_glasses + 1, f"Expected {initial_glasses + 1} glasses, got {data['glasses']}"
        print(f"POST water - glasses after logging 1: {data['glasses']}")
    
    def test_water_persistence_verify(self):
        """Verify water data persists after logging"""
        # Log 2 glasses
        response = self.session.post(f"{BASE_URL}/api/doctor/water", json={
            "glasses": 2
        })
        assert response.status_code == 200
        logged_glasses = response.json().get("glasses")
        
        # GET to verify persistence
        response = self.session.get(f"{BASE_URL}/api/doctor/water")
        assert response.status_code == 200
        fetched_glasses = response.json().get("glasses")
        
        assert fetched_glasses == logged_glasses, f"Water data not persisted. Logged: {logged_glasses}, Fetched: {fetched_glasses}"
        print(f"Water persistence verified: {fetched_glasses} glasses")
    
    # ============== MEAL LOGGING TESTS ==============
    
    def test_get_meals_initial(self):
        """GET /api/doctor/meals - should return today's meals with summary"""
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        
        assert response.status_code == 200, f"Failed to get meals: {response.text}"
        data = response.json()
        
        # Should have meals array and summary
        assert "meals" in data, f"Response missing 'meals' field: {data}"
        assert "summary" in data, f"Response missing 'summary' field: {data}"
        assert isinstance(data["meals"], list), f"Meals should be list: {data}"
        
        # Summary should have total_calories
        assert "total_calories" in data["summary"], f"Summary missing total_calories: {data}"
        print(f"GET meals - {len(data['meals'])} meals, {data['summary']['total_calories']} total calories")
    
    def test_post_meal_with_known_food(self):
        """POST /api/doctor/meal - log meal with known food item (idli)"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "idli",
            "meal_type": "breakfast",
            "quantity": 2
        })
        
        assert response.status_code == 200, f"Failed to log meal: {response.text}"
        data = response.json()
        
        # Should return meal entry with calories calculated
        assert "calories" in data, f"Response missing 'calories': {data}"
        assert "food_item" in data, f"Response missing 'food_item': {data}"
        assert data["food_item"] == "idli", f"Unexpected food_item: {data['food_item']}"
        assert data["calories"] > 0, f"Calories should be positive: {data['calories']}"
        print(f"POST meal (idli x2) - calories: {data['calories']}")
    
    def test_post_meal_with_custom_calories(self):
        """POST /api/doctor/meal - log meal with custom calories"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "custom",
            "meal_type": "lunch",
            "quantity": 1,
            "custom_calories": 500
        })
        
        assert response.status_code == 200, f"Failed to log custom meal: {response.text}"
        data = response.json()
        
        assert data["calories"] == 500, f"Custom calories not applied: {data['calories']}"
        print(f"POST meal (custom) - calories: {data['calories']}")
    
    def test_meal_persistence_verify(self):
        """Verify meal data persists - Create then GET"""
        # Log a meal
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "dosa",
            "meal_type": "breakfast",
            "quantity": 1
        })
        assert response.status_code == 200
        logged_meal = response.json()
        logged_id = logged_meal.get("id")
        logged_calories = logged_meal.get("calories")
        
        # GET meals to verify persistence
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        data = response.json()
        
        # Find the logged meal in the list
        meal_ids = [m.get("id") for m in data["meals"]]
        assert logged_id in meal_ids, f"Logged meal ID {logged_id} not found in meals list: {meal_ids}"
        
        # Verify summary includes logged calories
        assert data["summary"]["total_calories"] >= logged_calories, f"Summary calories don't include logged meal"
        print(f"Meal persistence verified: meal {logged_id} with {logged_calories} calories found")
    
    def test_meal_summary_totals(self):
        """Verify meal summary correctly totals all meals"""
        # Get initial meals
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        data = response.json()
        
        # Calculate expected total from meals
        calculated_total = sum(m.get("calories", 0) for m in data["meals"])
        summary_total = data["summary"]["total_calories"]
        
        assert calculated_total == summary_total, f"Summary mismatch: calculated {calculated_total}, summary {summary_total}"
        print(f"Meal summary verified: {summary_total} total calories from {len(data['meals'])} meals")
    
    # ============== FOOD DATABASE TESTS ==============
    
    def test_get_foods_database(self):
        """GET /api/doctor/foods - should return South Indian food database"""
        response = self.session.get(f"{BASE_URL}/api/doctor/foods")
        
        assert response.status_code == 200, f"Failed to get foods: {response.text}"
        data = response.json()
        
        # Should have common foods
        assert "idli" in data, "Food database missing 'idli'"
        assert "dosa" in data, "Food database missing 'dosa'"
        assert "biryani" in data, "Food database missing 'biryani'"
        
        # Each food should have nutrition info
        idli = data["idli"]
        assert "calories" in idli, "Idli missing calories"
        assert "name_te" in idli, "Idli missing Telugu name"
        print(f"Food database verified: {len(data)} items")


class TestKaizerFitDataIntegration:
    """Test that Kaizer Fit page correctly loads water/meal data from backend"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Authenticate
        self.session.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_water_endpoint_returns_correct_structure(self):
        """Verify /api/doctor/water returns structure expected by frontend"""
        response = self.session.get(f"{BASE_URL}/api/doctor/water")
        assert response.status_code == 200
        data = response.json()
        
        # Frontend expects: { glasses: number, date?: string }
        assert isinstance(data.get("glasses"), int), f"glasses should be int: {data}"
        print(f"Water structure OK: glasses={data['glasses']}")
    
    def test_meals_endpoint_returns_correct_structure(self):
        """Verify /api/doctor/meals returns structure expected by frontend"""
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        data = response.json()
        
        # Frontend expects: { meals: array, summary: { total_calories: number } }
        assert isinstance(data.get("meals"), list), f"meals should be list: {data}"
        assert "summary" in data, f"missing summary: {data}"
        assert "total_calories" in data["summary"], f"summary missing total_calories: {data}"
        print(f"Meals structure OK: {len(data['meals'])} meals, {data['summary']['total_calories']} calories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
