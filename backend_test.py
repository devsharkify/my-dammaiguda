#!/usr/bin/env python3
"""
Backend API Testing for My Dammaiguda Civic Engagement Platform
Tests all API endpoints with mock OTP (123456) and validates responses
"""

import requests
import sys
import json
from datetime import datetime

class DammaigiudaAPITester:
    def __init__(self, base_url="https://citizen-hub-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return None

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return None

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_send_otp(self, phone="9876543210"):
        """Test OTP sending"""
        data = {"phone": phone}
        result = self.run_test("Send OTP", "POST", "auth/send-otp", 200, data)
        return result is not None

    def test_verify_otp_and_login(self, phone="9876543210", otp="123456"):
        """Test OTP verification and login (handles both new and existing users)"""
        data = {"phone": phone, "otp": otp}
        result = self.run_test("Verify OTP & Login", "POST", "auth/verify-otp", 200, data)
        
        if result and result.get("token"):
            self.token = result["token"]
            self.user_id = result["user"]["id"]
            return True
        elif result and result.get("needs_registration"):
            # New user needs registration
            return self.test_register_user(phone, otp, "Test User")
        return False

    def test_register_user(self, phone="9876543210", otp="123456", name="Test User"):
        """Test user registration"""
        data = {
            "phone": phone,
            "otp": otp,
            "name": name,
            "colony": "Dammaiguda",
            "age_range": "25-35"
        }
        result = self.run_test("Register User", "POST", "auth/verify-otp", 200, data)
        
        if result and result.get("token"):
            self.token = result["token"]
            self.user_id = result["user"]["id"]
            return True
        return False

    def test_get_profile(self):
        """Test get user profile"""
        result = self.run_test("Get Profile", "GET", "auth/me", 200)
        return result is not None

    def test_create_issue(self):
        """Test creating an issue"""
        data = {
            "category": "garbage",
            "description": "Garbage pile near main road needs cleaning",
            "address": "Main Road, Dammaiguda",
            "location": {"lat": 17.4823, "lng": 78.5642}
        }
        result = self.run_test("Create Issue", "POST", "issues", 200, data)
        
        if result and result.get("id"):
            return result["id"]
        return None

    def test_get_issues(self):
        """Test getting issues list"""
        result = self.run_test("Get Issues", "GET", "issues", 200)
        return result is not None

    def test_get_dumpyard_info(self):
        """Test dump yard information endpoint"""
        result = self.run_test("Get Dump Yard Info", "GET", "dumpyard/info", 200)
        
        if result:
            # Validate required fields
            required_fields = ["name", "name_te", "pollution_zones", "health_risks"]
            for field in required_fields:
                if field not in result:
                    self.log_test("Dump Yard Info Validation", False, f"Missing field: {field}")
                    return False
            self.log_test("Dump Yard Info Validation", True)
        
        return result is not None

    def test_fitness_activity_log(self):
        """Test Kaizer Fit activity logging"""
        data = {
            "activity_type": "walking",
            "duration_minutes": 30,
            "distance_km": 2.5,
            "steps": 3000,
            "source": "manual"
        }
        result = self.run_test("Log Fitness Activity", "POST", "fitness/activity", 200, data)
        return result is not None

    def test_fitness_dashboard(self):
        """Test Kaizer Fit dashboard"""
        result = self.run_test("Get Fitness Dashboard", "GET", "fitness/dashboard", 200)
        return result is not None

    def test_fitness_leaderboard(self):
        """Test Kaizer Fit leaderboard"""
        result = self.run_test("Get Fitness Leaderboard", "GET", "fitness/leaderboard", 200)
        return result is not None

    def test_doctor_health_metrics(self):
        """Test Kaizer Doctor health metrics"""
        data = {
            "weight_kg": 70.5,
            "height_cm": 175,
            "blood_sugar": 95.0
        }
        result = self.run_test("Update Health Metrics", "POST", "doctor/health-metrics", 200, data)
        return result is not None

    def test_doctor_food_database(self):
        """Test Kaizer Doctor food database"""
        result = self.run_test("Get Food Database", "GET", "doctor/food-database", 200)
        
        if result and isinstance(result, list):
            # Check for South Indian foods with Telugu names
            has_telugu_names = any(food.get("name_te") for food in result)
            if has_telugu_names:
                self.log_test("Food Database Telugu Names", True)
            else:
                self.log_test("Food Database Telugu Names", False, "No Telugu names found")
            return True
        return False

    def test_doctor_diet_plans(self):
        """Test Kaizer Doctor diet plans"""
        result = self.run_test("Get Diet Plans", "GET", "doctor/diet-plans", 200)
        
        if result and isinstance(result, list) and len(result) >= 5:
            self.log_test("Diet Plans Count (>=5)", True)
            return True
        else:
            self.log_test("Diet Plans Count (>=5)", False, f"Expected >=5 plans, got {len(result) if result else 0}")
            return False

    def test_doctor_meal_log(self):
        """Test Kaizer Doctor meal logging"""
        data = {
            "meal_type": "breakfast",
            "food_items": [
                {"name": "Idli", "calories": 120, "protein": 4, "carbs": 24, "fat": 1}
            ],
            "total_calories": 120
        }
        result = self.run_test("Log Meal", "POST", "doctor/meal", 200, data)
        return result is not None

    def test_doctor_water_log(self):
        """Test Kaizer Doctor water logging"""
        data = {"glasses": 2}
        result = self.run_test("Log Water", "POST", "doctor/water", 200, data)
        return result is not None

    def test_doctor_dashboard(self):
        """Test Kaizer Doctor dashboard"""
        result = self.run_test("Get Doctor Dashboard", "GET", "doctor/dashboard", 200)
        return result is not None

    def test_ai_chat(self):
        """Test AI Chat functionality"""
        data = {
            "message": "Hello, how are you?",
            "chat_type": "general"
        }
        result = self.run_test("Send AI Chat Message", "POST", "chat", 200, data)
        
        if result and result.get("response"):
            self.log_test("AI Chat Response Generated", True)
            return True
        else:
            self.log_test("AI Chat Response Generated", False, "No response generated")
            return False

    def test_ai_chat_types(self):
        """Test different AI chat types"""
        chat_types = ["general", "health", "fitness", "doctor", "psychologist"]
        success_count = 0
        
        for chat_type in chat_types:
            data = {
                "message": f"Test message for {chat_type}",
                "chat_type": chat_type
            }
            result = self.run_test(f"AI Chat - {chat_type.title()}", "POST", "chat", 200, data)
            if result:
                success_count += 1
        
        return success_count == len(chat_types)

    def test_health_version(self):
        """Test health endpoint returns version 2.0.0"""
        result = self.run_test("Health Version Check", "GET", "health", 200)
        
        if result and result.get("version") == "2.0.0":
            self.log_test("Version 2.0.0 Check", True)
            return True
        else:
            self.log_test("Version 2.0.0 Check", False, f"Expected version 2.0.0, got {result.get('version') if result else 'None'}")
            return False

    def test_get_polls(self):
        """Test getting polls"""
        result = self.run_test("Get Polls", "GET", "polls", 200)
        return result is not None

    def test_expenditure(self):
        """Test expenditure endpoint"""
        result = self.run_test("Get Expenditure", "GET", "expenditure", 200)
        return result is not None

    def test_benefits_apply(self):
        """Test benefit application"""
        data = {
            "benefit_type": "health_checkup",
            "applicant_name": "Test User",
            "phone": "9876543210",
            "age": 30,
            "address": "Dammaiguda"
        }
        result = self.run_test("Apply for Benefit", "POST", "benefits/apply", 200, data)
        return result is not None

    def test_get_my_benefits(self):
        """Test getting user's benefits"""
        result = self.run_test("Get My Benefits", "GET", "benefits/my-applications", 200)
        return result is not None

    def test_upload_signature(self):
        """Test upload signature endpoint"""
        result = self.run_test("Get Upload Signature", "GET", "upload/signature", 200)
        return result is not None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting My Dammaiguda API Tests")
        print("=" * 50)
        
        # Test health check first
        if not self.test_health_check():
            print("❌ Health check failed - API may be down")
            return False

        # Test authentication flow
        print("\n📱 Testing Authentication Flow...")
        if not self.test_send_otp():
            print("❌ OTP sending failed")
            return False

        if not self.test_verify_otp_and_login():
            print("❌ OTP verification and login failed")
            return False

        # Test authenticated endpoints
        print("\n👤 Testing User Profile...")
        self.test_get_profile()

        print("\n🚨 Testing Issue Management...")
        issue_id = self.test_create_issue()
        self.test_get_issues()

        print("\n🏭 Testing Dump Yard Module...")
        self.test_get_dumpyard_info()

        print("\n💪 Testing Kaizer Fit Module...")
        self.test_fitness_activity_log()
        self.test_fitness_dashboard()
        self.test_fitness_leaderboard()

        print("\n🩺 Testing Kaizer Doctor Module...")
        self.test_doctor_health_metrics()
        self.test_doctor_food_database()
        self.test_doctor_diet_plans()
        self.test_doctor_meal_log()
        self.test_doctor_water_log()
        self.test_doctor_dashboard()

        print("\n🤖 Testing AI Chat Module...")
        self.test_ai_chat()
        self.test_ai_chat_types()

        print("\n🔍 Testing Version Check...")
        self.test_health_version()

        print("\n🗳️ Testing Polls...")
        self.test_get_polls()

        print("\n💰 Testing Expenditure...")
        self.test_expenditure()

        print("\n❤️ Testing Benefits...")
        self.test_benefits_apply()
        self.test_get_my_benefits()

        print("\n📤 Testing Upload...")
        self.test_upload_signature()

        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test runner"""
    tester = DammaigiudaAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        with open("/app/test_results_backend.json", "w") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "total_tests": tester.tests_run,
                "passed_tests": tester.tests_passed,
                "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                "results": tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())