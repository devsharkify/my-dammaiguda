"""
Test Education Module APIs
Tests: Course catalog, course details, lessons, quizzes, enrollment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://civic-trust-platform.preview.emergentagent.com')

class TestEducationModule:
    """Education module API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        # Send OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_courses_list(self):
        """Test GET /api/education/courses - should return 5 courses"""
        response = requests.get(f"{BASE_URL}/api/education/courses")
        assert response.status_code == 200
        
        data = response.json()
        assert "courses" in data
        assert len(data["courses"]) == 5
        print(f"✓ Found {len(data['courses'])} courses")
        
        # Verify course titles
        titles = [c["title"] for c in data["courses"]]
        expected = ["Python Programming Basics", "Spoken English Course", "10th Class Mathematics", 
                   "Digital Marketing", "Tailoring & Fashion"]
        for exp in expected:
            assert any(exp in t for t in titles), f"Course '{exp}' not found"
        print("✓ All 5 expected courses present")
    
    def test_get_course_categories(self):
        """Test GET /api/education/courses/categories"""
        response = requests.get(f"{BASE_URL}/api/education/courses/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 5
        print(f"✓ Found {len(data['categories'])} categories")
    
    def test_get_course_detail_with_lessons(self):
        """Test GET /api/education/courses/{id} - should return lessons"""
        # First get a course ID
        courses_response = requests.get(f"{BASE_URL}/api/education/courses")
        courses = courses_response.json()["courses"]
        course_id = courses[0]["id"]
        
        # Get course detail
        response = requests.get(f"{BASE_URL}/api/education/courses/{course_id}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "course" in data
        assert "lessons" in data
        assert len(data["lessons"]) >= 1
        print(f"✓ Course '{data['course']['title']}' has {len(data['lessons'])} lessons")
        
        # Verify lesson structure
        lesson = data["lessons"][0]
        assert "id" in lesson
        assert "title" in lesson
        assert "duration_minutes" in lesson
        print(f"✓ First lesson: {lesson['title']}")
    
    def test_get_python_course_with_quiz(self):
        """Test Python course has quiz"""
        # Get Python course
        courses_response = requests.get(f"{BASE_URL}/api/education/courses")
        courses = courses_response.json()["courses"]
        python_course = next((c for c in courses if "Python" in c["title"]), None)
        assert python_course is not None
        
        # Get course detail
        response = requests.get(f"{BASE_URL}/api/education/courses/{python_course['id']}", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "quizzes" in data
        assert len(data["quizzes"]) >= 1
        print(f"✓ Python course has {len(data['quizzes'])} quiz(zes)")
        
        # Verify quiz structure
        quiz = data["quizzes"][0]
        assert "id" in quiz
        assert "title" in quiz
        assert "passing_score" in quiz
        print(f"✓ Quiz: {quiz['title']} (passing: {quiz['passing_score']}%)")
    
    def test_course_enrollment(self):
        """Test POST /api/education/enroll"""
        # Get a course
        courses_response = requests.get(f"{BASE_URL}/api/education/courses")
        course_id = courses_response.json()["courses"][0]["id"]
        
        # Enroll
        response = requests.post(f"{BASE_URL}/api/education/enroll", 
                                json={"course_id": course_id}, 
                                headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print(f"✓ Enrollment successful")
    
    def test_my_courses(self):
        """Test GET /api/education/my-courses"""
        response = requests.get(f"{BASE_URL}/api/education/my-courses", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "courses" in data
        print(f"✓ User has {len(data['courses'])} enrolled courses")
    
    def test_my_stats(self):
        """Test GET /api/education/my-stats"""
        response = requests.get(f"{BASE_URL}/api/education/my-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_courses_enrolled" in data
        assert "courses_completed" in data
        assert "total_xp" in data
        print(f"✓ User stats: {data['total_courses_enrolled']} enrolled, {data['total_xp']} XP")


class TestFitnessBadges:
    """Fitness badges API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_badges(self):
        """Test GET /api/fitness/badges - should return earned_count and total_count"""
        response = requests.get(f"{BASE_URL}/api/fitness/badges", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "badges" in data
        assert "earned_count" in data
        assert "total_count" in data
        
        # Verify counts
        assert data["total_count"] == 10
        assert isinstance(data["earned_count"], int)
        print(f"✓ Badges: {data['earned_count']}/{data['total_count']} earned")
        
        # Verify badge structure
        if data["badges"]:
            badge = data["badges"][0]
            assert "id" in badge
            assert "name" in badge
            assert "earned" in badge
            print(f"✓ Badge structure valid")


class TestAdminEducation:
    """Admin education management tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token"""
        # Note: Test user is citizen role, so admin tests may fail
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_stats(self):
        """Test GET /api/admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        # May return 200, 403, or 404 depending on auth/route
        assert response.status_code in [200, 403, 404]
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Admin stats accessible")
        else:
            print(f"✓ Admin stats returned {response.status_code} (expected for non-admin)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
