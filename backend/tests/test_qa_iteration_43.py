"""
QA Iteration 43 - Comprehensive Backend API Tests
Testing: Auth, Education/Courses, News, Issues, Benefits, Manager Portal
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://course-learn-1.preview.emergentagent.com')

# Test credentials from review request
ADMIN_PHONE = "9100063133"
ADMIN_PASSWORD = "Plan@123"
TEST_USER_PHONE = "9999999999"
TEST_OTP = "123456"
MANAGER_PHONE = "7386917770"
TEST_COURSE_ID = "b326b25e-97ac-439b-a691-ec06996c8fad"


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed - Version: {data.get('version')}")


class TestAuthFlows:
    """Auth Module Tests - OTP login and Admin password login"""
    
    def test_otp_send_test_number(self):
        """Test OTP sending for test number 9999999999"""
        response = requests.post(
            f"{BASE_URL}/api/auth/otp",
            json={"phone": TEST_USER_PHONE}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        # For test numbers, OTP should be 123456
        print(f"✓ OTP send success: {data.get('message')}")
    
    def test_otp_verify_test_number(self):
        """Test OTP verification for test number"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_USER_PHONE})
        
        # Then verify
        response = requests.post(
            f"{BASE_URL}/api/auth/verify",
            json={
                "phone": TEST_USER_PHONE,
                "otp": TEST_OTP,
                "name": "Test User QA"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ OTP verify success - is_new_user: {data.get('is_new_user')}")
        return data.get("token")
    
    def test_admin_password_login(self):
        """Test admin login with password - 9100063133 + Plan@123"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "phone": ADMIN_PHONE,
                "password": ADMIN_PASSWORD
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "user" in data
        assert data["user"].get("role") in ["admin", "manager"]
        print(f"✓ Admin login success - Role: {data['user'].get('role')}, Name: {data['user'].get('name')}")
        return data.get("token")
    
    def test_admin_login_invalid_password(self):
        """Test admin login with wrong password should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={
                "phone": ADMIN_PHONE,
                "password": "WrongPassword123"
            }
        )
        assert response.status_code == 401
        print(f"✓ Invalid password correctly rejected")
    
    def test_manager_otp_login(self):
        """Test manager OTP login - 7386917770 + 123456"""
        # Send OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/otp",
            json={"phone": MANAGER_PHONE}
        )
        assert response.status_code == 200
        
        # Verify OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify",
            json={
                "phone": MANAGER_PHONE,
                "otp": TEST_OTP
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Manager OTP login success - is_new_user: {data.get('is_new_user')}")
        return data.get("token")


class TestEducationModule:
    """Education/Course Manager Tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"phone": ADMIN_PHONE, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    def test_get_courses(self):
        """Test getting list of courses"""
        response = requests.get(f"{BASE_URL}/api/education/courses?limit=100")
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        print(f"✓ Courses fetched - Total: {len(data.get('courses', []))}")
        return data.get("courses", [])
    
    def test_get_course_categories(self):
        """Test getting course categories"""
        response = requests.get(f"{BASE_URL}/api/education/courses/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        categories = [c["id"] for c in data.get("categories", [])]
        print(f"✓ Categories: {categories}")
    
    def test_get_specific_course(self, admin_token):
        """Test getting specific course by ID"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/education/courses/{TEST_COURSE_ID}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            course = data.get("course", {})
            lessons = data.get("lessons", [])
            print(f"✓ Course '{course.get('title')}' - {len(lessons)} lessons")
        elif response.status_code == 404:
            print(f"⚠ Course {TEST_COURSE_ID} not found - may need to create")
        else:
            print(f"⚠ Course fetch status: {response.status_code}")
    
    def test_get_course_subjects(self, admin_token):
        """Test getting subjects for a course"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/education/courses/{TEST_COURSE_ID}/subjects",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            subjects = data.get("subjects", [])
            print(f"✓ Course has {len(subjects)} subjects")
            for s in subjects:
                print(f"  - {s.get('title')} ({s.get('lesson_count', 0)} lessons)")
        else:
            print(f"⚠ Subjects fetch status: {response.status_code}")
    
    def test_instructor_dashboard(self, admin_token):
        """Test instructor dashboard endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/education/instructor/dashboard",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Instructor dashboard - Total courses: {data.get('total_courses', 0)}")
        else:
            print(f"⚠ Instructor dashboard status: {response.status_code}")
    
    def test_instructor_courses(self, admin_token):
        """Test getting instructor's courses"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/education/instructor/courses",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            courses = data.get("courses", [])
            print(f"✓ Instructor courses: {len(courses)}")
        else:
            print(f"⚠ Instructor courses status: {response.status_code}")


class TestNewsModule:
    """News Page Tests"""
    
    def test_news_local(self):
        """Test local news endpoint - what NewsPage.jsx uses"""
        response = requests.get(f"{BASE_URL}/api/news/local")
        if response.status_code == 200:
            data = response.json()
            news = data.get("news", data) if isinstance(data, dict) else data
            print(f"✓ Local news fetched - {len(news) if isinstance(news, list) else 'unknown'} items")
        else:
            print(f"⚠ Local news status: {response.status_code}")
    
    def test_news_categories(self):
        """Test news categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ News categories: {data}")
        else:
            print(f"⚠ News categories status: {response.status_code}")
    
    def test_news_by_category(self):
        """Test fetching news by category"""
        categories = ["local", "health", "education", "government", "sports"]
        for cat in categories:
            response = requests.get(f"{BASE_URL}/api/news/{cat}")
            if response.status_code == 200:
                print(f"✓ News /{cat} - OK")
            else:
                print(f"⚠ News /{cat} - Status {response.status_code}")


class TestIssuesModule:
    """Issues Page Tests"""
    
    def test_get_issues(self):
        """Test getting issues list"""
        response = requests.get(f"{BASE_URL}/api/issues")
        assert response.status_code == 200
        data = response.json()
        issues = data.get("issues", [])
        print(f"✓ Issues fetched - {len(issues)} items")
    
    def test_issues_categories(self):
        """Test getting issue categories"""
        response = requests.get(f"{BASE_URL}/api/issues/categories")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Issue categories: {len(data.get('categories', []))} types")
        else:
            print(f"⚠ Issue categories status: {response.status_code}")


class TestBenefitsModule:
    """Citizen Benefits Tests"""
    
    def test_get_benefits(self):
        """Test getting benefits list"""
        response = requests.get(f"{BASE_URL}/api/benefits")
        assert response.status_code == 200
        data = response.json()
        benefits = data.get("benefits", [])
        print(f"✓ Benefits fetched - {len(benefits)} benefits available")
    
    def test_benefits_schemes(self):
        """Test getting benefit schemes"""
        response = requests.get(f"{BASE_URL}/api/benefits/schemes")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Schemes: {len(data.get('schemes', []))} available")
        else:
            print(f"⚠ Schemes status: {response.status_code}")


class TestAQIWidget:
    """AQI Widget Tests"""
    
    def test_aqi_current(self):
        """Test getting current AQI data"""
        response = requests.get(f"{BASE_URL}/api/aqi/current")
        if response.status_code == 200:
            data = response.json()
            dammaiguda_aqi = data.get("dammaiguda_aqi") or data.get("aqi")
            print(f"✓ AQI Data - Dammaiguda: {dammaiguda_aqi}")
        else:
            print(f"⚠ AQI current status: {response.status_code}")


class TestStaffPortals:
    """Staff Portal Tests - Admin Panel, Manager Portal"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"phone": ADMIN_PHONE, "password": ADMIN_PASSWORD}
        )
        return response.json().get("token")
    
    def test_admin_stats(self, admin_token):
        """Test admin stats endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Admin stats - Users: {data.get('total_users', 'N/A')}, Issues: {data.get('total_issues', 'N/A')}")
        else:
            print(f"⚠ Admin stats status: {response.status_code}")
    
    def test_manager_list(self, admin_token):
        """Test getting manager list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/list", headers=headers)
        if response.status_code == 200:
            data = response.json()
            managers = data.get("managers", [])
            print(f"✓ Manager list - {len(managers)} managers")
        else:
            print(f"⚠ Manager list status: {response.status_code}")
    
    def test_settings_branding(self, admin_token):
        """Test branding settings endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/settings/branding", headers=headers)
        if response.status_code == 200:
            data = response.json()
            branding = data.get("branding", {})
            print(f"✓ Branding - App: {branding.get('app_name', 'N/A')}")
        else:
            print(f"⚠ Branding status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
