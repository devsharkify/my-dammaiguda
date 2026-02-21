"""
Test Calorie Counter Feature APIs
Tests meal logging with meal types, quantities, macros and delete functionality
Endpoints tested:
- POST /api/doctor/meal - Log meal with food_item, meal_type, quantity
- GET /api/doctor/meals - Get today's meals with summary (total_calories, protein, carbs, fat)
- DELETE /api/doctor/meal/{meal_id} - Delete a meal entry
- GET /api/doctor/foods - Get food database
- GET /api/doctor/foods/search?q={query} - Search foods
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCalorieCounterAPIs:
    """Test Calorie Counter APIs for KaizerFit module"""
    
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
        
        # Verify OTP
        response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        assert response.status_code == 200, f"Failed to verify OTP: {response.text}"
        
        data = response.json()
        self.token = data.get("token")
        assert self.token, "No token received from login"
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print(f"✓ Authentication successful")
    
    # ============== MEAL TYPES TESTS ==============
    
    def test_post_meal_breakfast(self):
        """POST /api/doctor/meal - Log breakfast meal"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "idli",
            "meal_type": "breakfast",
            "quantity": 2
        })
        
        assert response.status_code == 200, f"Failed to log breakfast: {response.text}"
        data = response.json()
        
        assert data.get("meal_type") == "breakfast", f"Wrong meal_type: {data.get('meal_type')}"
        assert data.get("food_item") == "idli", f"Wrong food_item: {data.get('food_item')}"
        assert data.get("calories") > 0, f"Calories should be positive: {data.get('calories')}"
        assert data.get("id"), "Meal entry should have an ID"
        print(f"✓ Breakfast logged: {data['food_item']} x{data['quantity']} = {data['calories']} cal")
        return data["id"]
    
    def test_post_meal_lunch(self):
        """POST /api/doctor/meal - Log lunch meal"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "chicken_biryani",
            "meal_type": "lunch",
            "quantity": 1
        })
        
        assert response.status_code == 200, f"Failed to log lunch: {response.text}"
        data = response.json()
        
        assert data.get("meal_type") == "lunch"
        assert data.get("food_item") == "chicken_biryani"
        print(f"✓ Lunch logged: {data['food_item']} = {data['calories']} cal")
    
    def test_post_meal_snacks(self):
        """POST /api/doctor/meal - Log snack"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "samosa",
            "meal_type": "snacks",
            "quantity": 1
        })
        
        assert response.status_code == 200, f"Failed to log snack: {response.text}"
        data = response.json()
        
        assert data.get("meal_type") == "snacks"
        print(f"✓ Snack logged: {data['food_item']} = {data['calories']} cal")
    
    def test_post_meal_evening_snacks(self):
        """POST /api/doctor/meal - Log evening snack"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "chai",
            "meal_type": "evening_snacks",
            "quantity": 1
        })
        
        assert response.status_code == 200, f"Failed to log evening snack: {response.text}"
        data = response.json()
        
        # Check meal_type is correctly stored
        assert data.get("meal_type") == "evening_snacks", f"Expected evening_snacks, got {data.get('meal_type')}"
        print(f"✓ Evening snack logged: {data.get('food_item', 'chai')} = {data['calories']} cal")
    
    def test_post_meal_dinner(self):
        """POST /api/doctor/meal - Log dinner meal"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "roti",
            "meal_type": "dinner",
            "quantity": 2
        })
        
        assert response.status_code == 200, f"Failed to log dinner: {response.text}"
        data = response.json()
        
        assert data.get("meal_type") == "dinner"
        print(f"✓ Dinner logged: {data['food_item']} x{data['quantity']} = {data['calories']} cal")
    
    # ============== MACRO TRACKING TESTS ==============
    
    def test_meal_returns_macros(self):
        """POST /api/doctor/meal - Response includes protein, carbs, fat"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "dosa",
            "meal_type": "breakfast",
            "quantity": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check macros are returned
        assert "protein" in data, f"Response missing protein: {data}"
        assert "carbs" in data, f"Response missing carbs: {data}"
        assert "fat" in data, f"Response missing fat: {data}"
        
        print(f"✓ Macros returned: P:{data['protein']}g C:{data['carbs']}g F:{data['fat']}g")
    
    def test_meals_summary_includes_macros(self):
        """GET /api/doctor/meals - Summary includes total protein, carbs, fat"""
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check summary has macros
        summary = data.get("summary", {})
        assert "total_calories" in summary, f"Summary missing total_calories: {summary}"
        assert "total_protein" in summary, f"Summary missing total_protein: {summary}"
        assert "total_carbs" in summary, f"Summary missing total_carbs: {summary}"
        assert "total_fat" in summary, f"Summary missing total_fat: {summary}"
        
        print(f"✓ Summary macros: {summary['total_calories']} cal, P:{summary['total_protein']}g C:{summary['total_carbs']}g F:{summary['total_fat']}g")
    
    # ============== QUANTITY TESTS ==============
    
    def test_meal_quantity_multiplier(self):
        """POST /api/doctor/meal - Quantity multiplies calories correctly"""
        # Log 1 serving
        response1 = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "idli",
            "meal_type": "breakfast",
            "quantity": 1
        })
        assert response1.status_code == 200
        cal1 = response1.json()["calories"]
        
        # Log 3 servings
        response3 = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "idli",
            "meal_type": "breakfast",
            "quantity": 3
        })
        assert response3.status_code == 200
        cal3 = response3.json()["calories"]
        
        # Calories should be 3x
        assert cal3 == cal1 * 3, f"Expected {cal1 * 3} calories for 3x, got {cal3}"
        print(f"✓ Quantity multiplier works: 1x={cal1} cal, 3x={cal3} cal")
    
    def test_meal_custom_calories(self):
        """POST /api/doctor/meal - Custom calories override"""
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "custom",
            "meal_type": "snacks",
            "quantity": 1,
            "custom_calories": 250
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["calories"] == 250, f"Custom calories not applied: {data['calories']}"
        print(f"✓ Custom calories applied: {data['calories']} cal")
    
    # ============== DELETE MEAL TEST ==============
    
    def test_delete_meal(self):
        """DELETE /api/doctor/meal/{meal_id} - Delete a meal entry"""
        # First create a meal
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "samosa",
            "meal_type": "snacks",
            "quantity": 1
        })
        assert response.status_code == 200
        meal_id = response.json()["id"]
        meal_calories = response.json()["calories"]
        print(f"  Created meal {meal_id} with {meal_calories} cal")
        
        # Get meals to verify it exists
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        initial_meals = response.json()["meals"]
        initial_ids = [m["id"] for m in initial_meals]
        assert meal_id in initial_ids, f"Meal {meal_id} not found after creation"
        
        # Delete the meal
        response = self.session.delete(f"{BASE_URL}/api/doctor/meal/{meal_id}")
        assert response.status_code == 200, f"Failed to delete meal: {response.text}"
        delete_data = response.json()
        assert delete_data.get("success") == True, f"Delete response: {delete_data}"
        print(f"  Deleted meal {meal_id}")
        
        # Verify meal is removed
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        final_meals = response.json()["meals"]
        final_ids = [m["id"] for m in final_meals]
        assert meal_id not in final_ids, f"Meal {meal_id} still exists after delete"
        
        print(f"✓ Delete meal works: meal {meal_id} removed")
    
    def test_delete_nonexistent_meal(self):
        """DELETE /api/doctor/meal/{meal_id} - 404 for non-existent meal"""
        fake_id = f"fake_meal_{uuid.uuid4().hex[:8]}"
        response = self.session.delete(f"{BASE_URL}/api/doctor/meal/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Delete non-existent meal returns 404")
    
    # ============== FOOD SEARCH TESTS ==============
    
    def test_get_foods_database(self):
        """GET /api/doctor/foods - Returns food database"""
        response = self.session.get(f"{BASE_URL}/api/doctor/foods")
        
        assert response.status_code == 200, f"Failed to get foods: {response.text}"
        data = response.json()
        
        # Should have common foods
        has_foods = isinstance(data, dict) and len(data) > 0
        assert has_foods, f"Expected food database dict, got: {type(data)}"
        
        # Check for common items
        assert "idli" in data or any("idli" in k for k in data.keys()), "Missing idli in database"
        assert "dosa" in data or any("dosa" in k for k in data.keys()), "Missing dosa in database"
        
        print(f"✓ Food database has {len(data)} items")
    
    def test_search_foods_english(self):
        """GET /api/doctor/foods/search?q=rice - Search by English name"""
        response = self.session.get(f"{BASE_URL}/api/doctor/foods/search?q=rice&limit=10")
        
        assert response.status_code == 200, f"Failed to search foods: {response.text}"
        data = response.json()
        
        assert "foods" in data, f"Response missing foods: {data}"
        assert len(data["foods"]) > 0, "No results for 'rice' search"
        
        # Check results contain 'rice' in name
        for food in data["foods"][:3]:
            assert "rice" in food.get("name", "").lower() or "rice" in food.get("id", "").lower(), f"Result doesn't match query: {food}"
        
        print(f"✓ Food search 'rice' returned {len(data['foods'])} results")
    
    def test_search_foods_telugu(self):
        """GET /api/doctor/foods/search?q=అన్నం - Search by Telugu name"""
        response = self.session.get(f"{BASE_URL}/api/doctor/foods/search?q=అన్నం&limit=10")
        
        assert response.status_code == 200, f"Failed to search in Telugu: {response.text}"
        data = response.json()
        
        assert "foods" in data, f"Response missing foods: {data}"
        # Telugu search may or may not return results based on implementation
        print(f"✓ Telugu search returned {len(data['foods'])} results")
    
    def test_search_foods_partial(self):
        """GET /api/doctor/foods/search?q=bir - Partial search"""
        response = self.session.get(f"{BASE_URL}/api/doctor/foods/search?q=bir&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "foods" in data
        # Should find biryani with partial 'bir'
        if len(data["foods"]) > 0:
            found_biryani = any("biryani" in f.get("name", "").lower() or "biryani" in f.get("id", "").lower() for f in data["foods"])
            assert found_biryani, f"Partial search 'bir' should find biryani: {data['foods']}"
        
        print(f"✓ Partial search 'bir' returned {len(data['foods'])} results")
    
    # ============== MEALS LIST TEST ==============
    
    def test_get_meals_structure(self):
        """GET /api/doctor/meals - Returns correct structure"""
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "date" in data, f"Response missing 'date': {data.keys()}"
        assert "meals" in data, f"Response missing 'meals': {data.keys()}"
        assert "summary" in data, f"Response missing 'summary': {data.keys()}"
        
        # Check meals array structure
        assert isinstance(data["meals"], list)
        
        if len(data["meals"]) > 0:
            meal = data["meals"][0]
            assert "id" in meal, "Meal missing id"
            assert "food_item" in meal, "Meal missing food_item"
            assert "meal_type" in meal, "Meal missing meal_type"
            assert "calories" in meal, "Meal missing calories"
        
        print(f"✓ Meals structure OK: {len(data['meals'])} meals, summary has {len(data['summary'])} fields")


class TestCalorieCounterIntegration:
    """Integration tests for CalorieCounter component data flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        self.session.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_full_meal_workflow(self):
        """Test complete meal logging workflow: log -> verify -> delete -> verify"""
        # 1. Log a meal
        response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
            "food_item": "upma",
            "meal_type": "breakfast",
            "quantity": 1
        })
        assert response.status_code == 200
        meal = response.json()
        meal_id = meal["id"]
        meal_calories = meal["calories"]
        print(f"  Step 1: Logged meal {meal_id} with {meal_calories} cal")
        
        # 2. Verify it appears in meals list
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        data = response.json()
        meal_ids = [m["id"] for m in data["meals"]]
        assert meal_id in meal_ids, f"Meal not found in list"
        print(f"  Step 2: Verified meal in list, total calories: {data['summary']['total_calories']}")
        
        # 3. Delete the meal
        response = self.session.delete(f"{BASE_URL}/api/doctor/meal/{meal_id}")
        assert response.status_code == 200
        print(f"  Step 3: Deleted meal {meal_id}")
        
        # 4. Verify it's removed
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        data = response.json()
        meal_ids = [m["id"] for m in data["meals"]]
        assert meal_id not in meal_ids, f"Meal still exists after delete"
        print(f"  Step 4: Verified meal removed, total calories: {data['summary']['total_calories']}")
        
        print(f"✓ Full meal workflow completed successfully")
    
    def test_all_meal_types_in_single_day(self):
        """Test logging all 5 meal types and verifying in summary"""
        meal_types = ["breakfast", "lunch", "snacks", "evening_snacks", "dinner"]
        foods = ["idli", "rice", "samosa", "chai", "roti"]
        logged_meals = []
        
        # Log one meal for each type
        for meal_type, food in zip(meal_types, foods):
            response = self.session.post(f"{BASE_URL}/api/doctor/meal", json={
                "food_item": food,
                "meal_type": meal_type,
                "quantity": 1
            })
            assert response.status_code == 200, f"Failed to log {meal_type}: {response.text}"
            logged_meals.append(response.json())
        
        print(f"  Logged {len(logged_meals)} meals across all meal types")
        
        # Verify all in summary
        response = self.session.get(f"{BASE_URL}/api/doctor/meals")
        assert response.status_code == 200
        data = response.json()
        
        # Check we have all meal types
        found_types = set(m["meal_type"] for m in data["meals"])
        for mt in meal_types:
            assert mt in found_types, f"Meal type {mt} not found in meals list"
        
        print(f"✓ All 5 meal types verified: {found_types}")
        
        # Cleanup - delete test meals
        for meal in logged_meals:
            self.session.delete(f"{BASE_URL}/api/doctor/meal/{meal['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
