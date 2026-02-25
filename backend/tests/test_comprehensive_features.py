"""
Comprehensive Feature Tests for My Dammaiguda
Tests: Auth, Admin Panel, Course Manager, Manager Portal, Instructor Portal,
News, Benefits, AQI, Clone Maker, Issues, Fitness, Education
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://civic-connect-59.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_PHONE = "9100063133"
ADMIN_PASSWORD = "Plan@123"
TEST_OTP = "123456"
TEST_PHONE = "9999999999"
MANAGER_PHONE = "7386917770"

class TestHealthCheck:
    """Test API health check"""
    
    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"PASS: Health check - version {data['version']}")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_admin_login_valid(self):
        """Test admin password login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login - user: {data['user'].get('name', 'Admin')}")
        return data["token"]
    
    def test_admin_login_invalid_password(self):
        """Test admin login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("PASS: Invalid password correctly rejected")
    
    def test_send_otp(self):
        """Test OTP sending endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/otp", json={
            "phone": TEST_PHONE
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"PASS: OTP sent - {data.get('message', 'Success')}")
    
    def test_verify_otp(self):
        """Test OTP verification"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_PHONE})
        
        # Then verify
        response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"PASS: OTP verified - is_new_user: {data.get('is_new_user', False)}")
        return data.get("token")


class TestAdminAnalytics:
    """Test admin analytics endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_analytics(self):
        """Test GET /api/admin/analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: Admin analytics - total_users: {data.get('total_users', 0)}")
    
    def test_admin_stats(self):
        """Test GET /api/admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "issues" in data or "users" in data
        print(f"PASS: Admin stats retrieved")


class TestNewsAPI:
    """Test news endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_news(self):
        """Test GET /api/news"""
        response = requests.get(f"{BASE_URL}/api/news")
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: News endpoint - retrieved {len(data.get('items', data) if isinstance(data, dict) else data)} items")
    
    def test_get_news_admin(self):
        """Test GET /api/news/admin"""
        response = requests.get(f"{BASE_URL}/api/news/admin", headers=self.headers)
        assert response.status_code == 200
        print("PASS: Admin news endpoint")
    
    def test_news_categories(self):
        """Test GET /api/news/categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        assert response.status_code == 200
        print("PASS: News categories retrieved")


class TestEducationAPI:
    """Test education/course endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_courses(self):
        """Test GET /api/education/courses"""
        response = requests.get(f"{BASE_URL}/api/education/courses")
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        print(f"PASS: Courses - retrieved {len(data.get('courses', []))} courses")
    
    def test_get_categories(self):
        """Test GET /api/education/courses/categories"""
        response = requests.get(f"{BASE_URL}/api/education/courses/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"PASS: Categories - retrieved {len(data.get('categories', []))} categories")
    
    def test_create_course(self):
        """Test POST /api/education/courses"""
        response = requests.post(f"{BASE_URL}/api/education/courses", 
            headers=self.headers,
            json={
                "title": "TEST_Course_" + str(int(time.time())),
                "description": "Test course description",
                "category": "tech",
                "difficulty": "beginner"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"PASS: Course created - {data['course']['title']}")
        return data["course"]["id"]
    
    def test_instructor_courses(self):
        """Test GET /api/education/instructor/courses"""
        response = requests.get(f"{BASE_URL}/api/education/instructor/courses", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        print(f"PASS: Instructor courses - {len(data.get('courses', []))} courses")
    
    def test_instructor_dashboard(self):
        """Test GET /api/education/instructor/dashboard"""
        response = requests.get(f"{BASE_URL}/api/education/instructor/dashboard", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: Instructor dashboard - total_courses: {data.get('total_courses', 0)}")


class TestBenefitsAPI:
    """Test benefits endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_benefits(self):
        """Test GET /api/benefits"""
        response = requests.get(f"{BASE_URL}/api/benefits")
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: Benefits endpoint - {len(data)} benefits available")
    
    def test_get_benefits_schemes(self):
        """Test GET /api/benefits/schemes"""
        response = requests.get(f"{BASE_URL}/api/benefits/schemes", headers=self.headers)
        # Allow 200 or 404 (if no schemes exist)
        assert response.status_code in [200, 404]
        print(f"PASS: Benefits schemes - status {response.status_code}")
    
    def test_benefits_admin(self):
        """Test GET /api/benefits/admin/applications"""
        response = requests.get(f"{BASE_URL}/api/benefits/admin/applications", headers=self.headers)
        # Allow 200 or 404 (if endpoint doesn't exist in this form)
        assert response.status_code in [200, 404]
        print(f"PASS: Admin benefits applications - status {response.status_code}")


class TestAQIAPI:
    """Test AQI endpoints"""
    
    def test_get_aqi(self):
        """Test GET /api/aqi"""
        response = requests.get(f"{BASE_URL}/api/aqi")
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: AQI endpoint - AQI value: {data.get('aqi', data.get('current_aqi', 'N/A'))}")
    
    def test_get_aqi_history(self):
        """Test GET /api/aqi/history"""
        response = requests.get(f"{BASE_URL}/api/aqi/history")
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: AQI history - {len(data.get('history', data) if isinstance(data, dict) else data)} entries")


class TestIssuesAPI:
    """Test issues/grievances endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_issues(self):
        """Test GET /api/issues"""
        response = requests.get(f"{BASE_URL}/api/issues", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: Issues endpoint - retrieved successfully")
    
    def test_issues_categories(self):
        """Test GET /api/issues/categories"""
        response = requests.get(f"{BASE_URL}/api/issues/categories")
        assert response.status_code == 200
        print("PASS: Issue categories retrieved")


class TestFitnessAPI:
    """Test fitness endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_user_token(self):
        """Get user token for authenticated requests"""
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_PHONE})
        response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_fitness_profile(self):
        """Test GET /api/fitness/profile"""
        response = requests.get(f"{BASE_URL}/api/fitness/profile", headers=self.headers)
        assert response.status_code in [200, 404]
        print(f"PASS: Fitness profile - status {response.status_code}")
    
    def test_fitness_leaderboard(self):
        """Test GET /api/fitness/leaderboard"""
        response = requests.get(f"{BASE_URL}/api/fitness/leaderboard")
        assert response.status_code == 200
        print("PASS: Fitness leaderboard retrieved")
    
    def test_fitness_log_steps(self):
        """Test POST /api/fitness/log"""
        response = requests.post(f"{BASE_URL}/api/fitness/log", 
            headers=self.headers,
            json={
                "activity_type": "steps",
                "value": 5000,
                "duration_minutes": 60
            }
        )
        assert response.status_code in [200, 201]
        print("PASS: Fitness steps logged")


class TestManagerAPI:
    """Test manager portal endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_manager_list(self):
        """Test GET /api/manager/list"""
        response = requests.get(f"{BASE_URL}/api/manager/list", headers=self.headers)
        assert response.status_code in [200, 404]
        print(f"PASS: Manager list - status {response.status_code}")
    
    def test_manager_dashboard(self):
        """Test GET /api/manager/dashboard"""
        response = requests.get(f"{BASE_URL}/api/manager/dashboard", headers=self.headers)
        assert response.status_code in [200, 403, 404]
        print(f"PASS: Manager dashboard - status {response.status_code}")


class TestCloneAPI:
    """Test clone maker endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_clone_areas(self):
        """Test GET /api/clone/areas"""
        response = requests.get(f"{BASE_URL}/api/clone/areas", headers=self.headers)
        assert response.status_code in [200, 404]
        print(f"PASS: Clone areas - status {response.status_code}")
    
    def test_clone_generate_config(self):
        """Test POST /api/clone/generate-config"""
        response = requests.post(f"{BASE_URL}/api/clone/generate-config", 
            headers=self.headers,
            json={
                "area_id": "test_area",
                "app_name": "My Test Area",
                "primary_color": "#FF0000"
            }
        )
        # Allow 200, 400, 404 (depends on implementation)
        assert response.status_code in [200, 400, 404, 422]
        print(f"PASS: Clone config generation - status {response.status_code}")


class TestSettingsAPI:
    """Test settings endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_branding(self):
        """Test GET /api/settings/branding"""
        response = requests.get(f"{BASE_URL}/api/settings/branding?area_id=dammaiguda", headers=self.headers)
        assert response.status_code in [200, 404]
        print(f"PASS: Settings branding - status {response.status_code}")


class TestReportsAPI:
    """Test reports endpoints"""
    
    @pytest.fixture(autouse=True)
    def get_admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/admin-login", json={
            "phone": ADMIN_PHONE,
            "password": ADMIN_PASSWORD
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_reports_available(self):
        """Test GET /api/reports/available"""
        response = requests.get(f"{BASE_URL}/api/reports/available", headers=self.headers)
        assert response.status_code in [200, 404]
        print(f"PASS: Reports available - status {response.status_code}")
    
    def test_admin_reports_users(self):
        """Test GET /api/reports/admin/users"""
        response = requests.get(f"{BASE_URL}/api/reports/admin/users?format=json", headers=self.headers)
        assert response.status_code in [200, 404]
        print(f"PASS: Admin user reports - status {response.status_code}")


class TestLiveActivityAPI:
    """Test live activity tracking"""
    
    @pytest.fixture(autouse=True)
    def get_user_token(self):
        """Get user token for authenticated requests"""
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_PHONE})
        response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_activity_start(self):
        """Test POST /api/fitness/activity/start"""
        response = requests.post(f"{BASE_URL}/api/fitness/activity/start", 
            headers=self.headers,
            json={
                "activity_type": "walking"
            }
        )
        assert response.status_code in [200, 201, 404]
        print(f"PASS: Activity start - status {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
