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

    def test_verify_otp_new_user(self, phone="9876543210", otp="123456"):
        """Test OTP verification for new user"""
        data = {"phone": phone, "otp": otp}
        result = self.run_test("Verify OTP (New User)", "POST", "auth/verify-otp", 200, data)
        
        if result and result.get("is_new"):
            return True
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

    def test_fitness_log(self):
        """Test fitness logging"""
        data = {
            "steps": 8500,
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        result = self.run_test("Log Fitness", "POST", "fitness/log", 200, data)
        return result is not None

    def test_fitness_stats(self):
        """Test fitness stats"""
        result = self.run_test("Get Fitness Stats", "GET", "fitness/my-stats", 200)
        return result is not None

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

        if not self.test_verify_otp_new_user():
            print("❌ OTP verification failed")
            return False

        if not self.test_register_user():
            print("❌ User registration failed")
            return False

        # Test authenticated endpoints
        print("\n👤 Testing User Profile...")
        self.test_get_profile()

        print("\n🚨 Testing Issue Management...")
        issue_id = self.test_create_issue()
        self.test_get_issues()

        print("\n🏭 Testing Dump Yard Module...")
        self.test_get_dumpyard_info()

        print("\n💪 Testing Fitness Module...")
        self.test_fitness_log()
        self.test_fitness_stats()

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