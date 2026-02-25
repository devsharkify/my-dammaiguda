"""
Backend tests for new features: Gift Shop, Fitness Profile, Manual Recording
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://civic-connect-59.preview.emergentagent.com')

class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        # Send OTP
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "9876543210"
        })
        assert response.status_code == 200
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"  # Static OTP for testing
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_otp_login_works(self, auth_token):
        """Test OTP login flow works"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"AUTH TOKEN ACQUIRED: {auth_token[:50]}...")


class TestGiftShop:
    """Gift Shop module tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        return response.json()["token"]
    
    def test_wallet_endpoint(self, auth_token):
        """Test wallet balance endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/shop/wallet", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert "total_earned" in data
        assert "total_spent" in data
        assert isinstance(data["balance"], int)
        print(f"WALLET BALANCE: {data['balance']} points")
    
    def test_products_endpoint(self, auth_token):
        """Test products listing endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/shop/products", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert "user_balance" in data
        print(f"PRODUCTS: {data['total']} available")
    
    def test_orders_endpoint(self, auth_token):
        """Test orders listing endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert isinstance(data["orders"], list)
        print(f"ORDERS: {len(data['orders'])} orders")
    
    def test_categories_endpoint(self, auth_token):
        """Test categories endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/shop/categories", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"CATEGORIES: {len(data['categories'])} categories")


class TestFitness:
    """Fitness module tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        return response.json()["token"]
    
    def test_activity_types_endpoint(self):
        """Test activity types endpoint (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/fitness/activity-types")
        assert response.status_code == 200
        data = response.json()
        assert "running" in data
        assert "walking" in data
        assert "yoga" in data
        assert data["running"]["name_en"] == "Running"
        assert data["walking"]["name_te"] == "నడక"
        print(f"ACTIVITY TYPES: {len(data)} types available")
    
    def test_profile_check_endpoint(self, auth_token):
        """Test fitness profile check endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/fitness/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "has_profile" in data
        print(f"HAS PROFILE: {data['has_profile']}")
    
    def test_profile_create_endpoint(self, auth_token):
        """Test fitness profile creation"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        profile_data = {
            "height_cm": 175.0,
            "weight_kg": 70.0,
            "gender": "male",
            "age": 30,
            "fitness_goal": "general_fitness"
        }
        response = requests.post(f"{BASE_URL}/api/fitness/profile", json=profile_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "profile" in data
        profile = data["profile"]
        assert profile["height_cm"] == 175.0
        assert profile["weight_kg"] == 70.0
        assert profile["gender"] == "male"
        assert profile["age"] == 30
        assert "bmi" in profile
        print(f"PROFILE CREATED: BMI={profile['bmi']}")
    
    def test_manual_record_with_custom_date(self, auth_token):
        """Test manual activity recording with editable date"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Record activity for a past date
        record_data = {
            "activity_type": "walking",
            "duration_minutes": 30,
            "date": "2026-02-10",  # Past date
            "distance_km": 2.5,
            "calories_burned": 150,
            "notes": "TEST_Morning walk"
        }
        response = requests.post(f"{BASE_URL}/api/fitness/record", json=record_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "activity" in data
        activity = data["activity"]
        assert activity["date"] == "2026-02-10"
        assert activity["activity_type"] == "walking"
        assert activity["duration_minutes"] == 30
        print(f"ACTIVITY RECORDED: {activity['activity_type']} on {activity['date']}")
    
    def test_cannot_record_future_date(self, auth_token):
        """Test that future dates are rejected"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Try to record activity for a future date
        record_data = {
            "activity_type": "walking",
            "duration_minutes": 30,
            "date": "2027-12-31",  # Future date
        }
        response = requests.post(f"{BASE_URL}/api/fitness/record", json=record_data, headers=headers)
        assert response.status_code == 400
        print("FUTURE DATE REJECTED: As expected")
    
    def test_dashboard_endpoint(self, auth_token):
        """Test fitness dashboard endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/fitness/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "today" in data
        assert "weekly" in data
        assert "streak" in data
        print(f"DASHBOARD: Today steps={data['today'].get('total_steps', 0)}, Streak={data['streak'].get('current', 0)}")
    
    def test_streaks_endpoint(self, auth_token):
        """Test streaks endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/fitness/streaks", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "current_streak" in data
        assert "longest_streak" in data
        print(f"STREAKS: Current={data['current_streak']}, Longest={data['longest_streak']}")
    
    def test_badges_endpoint(self, auth_token):
        """Test badges endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/fitness/badges", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "badges" in data
        assert "earned_count" in data
        assert "total_count" in data
        print(f"BADGES: {data['earned_count']}/{data['total_count']} earned")


class TestLanguageDefault:
    """Test language defaults to English"""
    
    @pytest.fixture(scope="class")
    def new_user_response(self):
        """Test with a new phone number to check defaults"""
        # Note: This just verifies the API structure, actual language default is frontend-controlled
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "9876543210"
        })
        return response.json()
    
    def test_otp_sent_successfully(self, new_user_response):
        """Verify OTP can be sent"""
        assert new_user_response.get("success") == True
        print("OTP SENT: Success")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
