"""
Test Instructor Portal and Student Progress Leaderboard APIs
Features: Dashboard stats, Course management, Analytics, Students, Leaderboard, My Stats
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://civic-engagement-7.preview.emergentagent.com')


class TestInstructorPortal:
    """Instructor Portal API tests - requires admin/instructor role"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token"""
        # Send OTP for admin
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "+919999999999"})
        # Verify OTP with static code
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "+919999999999",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.user = response.json().get("user", {})
        assert self.token is not None, "Failed to get admin token"
        assert self.user.get("role") == "admin", "User is not admin"
    
    def test_instructor_dashboard_stats(self):
        """Test GET /api/education/instructor/dashboard - returns dashboard with stats"""
        response = requests.get(f"{BASE_URL}/api/education/instructor/dashboard", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        # Verify required stats fields
        assert "total_courses" in data
        assert "total_students" in data
        assert "total_revenue" in data
        assert "avg_completion_rate" in data
        assert "courses" in data
        
        # Verify data types
        assert isinstance(data["total_courses"], int)
        assert isinstance(data["total_students"], int)
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["avg_completion_rate"], (int, float))
        assert isinstance(data["courses"], list)
        
        print(f"✓ Dashboard: {data['total_courses']} courses, {data['total_students']} students, ₹{data['total_revenue']} revenue, {data['avg_completion_rate']}% completion")
    
    def test_instructor_courses_list(self):
        """Test GET /api/education/instructor/courses - returns instructor's courses"""
        response = requests.get(f"{BASE_URL}/api/education/instructor/courses", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "courses" in data
        courses = data["courses"]
        
        # Admin sees all courses (5 seeded courses exist)
        assert len(courses) >= 5, f"Expected at least 5 courses, got {len(courses)}"
        
        # Verify course structure with required fields
        for course in courses:
            assert "id" in course
            assert "title" in course
            assert "is_published" in course
            assert "enrollments" in course
            assert "lessons_count" in course
            assert "quizzes_count" in course
            print(f"  - {course['title']}: {course['enrollments']} students, {course['lessons_count']} lessons, {course['quizzes_count']} quizzes, status={'Live' if course['is_published'] else 'Draft'}")
        
        print(f"✓ Found {len(courses)} courses")
    
    def test_course_students_list(self):
        """Test GET /api/education/instructor/course/{id}/students - returns enrolled students"""
        # Get a course with enrollments
        courses_response = requests.get(f"{BASE_URL}/api/education/instructor/courses", headers=self.headers)
        courses = courses_response.json()["courses"]
        
        # Find course with enrollments
        course_with_students = next((c for c in courses if c.get("enrollments", 0) > 0), None)
        if not course_with_students:
            pytest.skip("No course with enrollments found")
        
        course_id = course_with_students["id"]
        response = requests.get(f"{BASE_URL}/api/education/instructor/course/{course_id}/students", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "students" in data
        assert "total" in data
        
        students = data["students"]
        assert len(students) > 0, "Expected at least one student"
        
        # Verify student structure
        for student in students:
            assert "user_id" in student
            assert "name" in student
            assert "enrolled_at" in student
            assert "status" in student
            assert "progress" in student
            print(f"  - {student['name']}: {student['progress']}% progress, status={student['status']}")
        
        print(f"✓ Course '{course_with_students['title']}' has {len(students)} students")
    
    def test_course_analytics(self):
        """Test GET /api/education/instructor/course/{id}/analytics - returns detailed analytics"""
        # Get a course
        courses_response = requests.get(f"{BASE_URL}/api/education/instructor/courses", headers=self.headers)
        courses = courses_response.json()["courses"]
        course = courses[0]
        
        response = requests.get(f"{BASE_URL}/api/education/instructor/course/{course['id']}/analytics", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify analytics structure
        assert "course" in data
        assert "summary" in data
        assert "lessons" in data
        assert "quizzes" in data
        assert "enrollment_trend" in data
        
        # Verify summary fields
        summary = data["summary"]
        assert "total_enrollments" in summary
        assert "completions" in summary
        assert "completion_rate" in summary
        assert "total_lessons" in summary
        assert "total_quizzes" in summary
        
        # Verify lesson stats
        for lesson in data["lessons"]:
            assert "id" in lesson
            assert "title" in lesson
            assert "views" in lesson
            assert "completions" in lesson
            assert "completion_rate" in lesson
        
        # Verify enrollment trend (30 days)
        assert len(data["enrollment_trend"]) == 30
        
        print(f"✓ Analytics for '{course['title']}': {summary['total_enrollments']} enrollments, {summary['completion_rate']}% completion")
    
    def test_create_course(self):
        """Test POST /api/education/courses - create new course"""
        course_data = {
            "title": "TEST_Instructor_Course",
            "description": "Test course for instructor portal testing",
            "category": "tech",
            "difficulty": "beginner",
            "price": 999,
            "duration_hours": 10,
            "is_featured": False
        }
        
        response = requests.post(f"{BASE_URL}/api/education/courses", json=course_data, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "course" in data
        
        created_course = data["course"]
        assert created_course["title"] == "TEST_Instructor_Course"
        assert created_course["price"] == 999
        assert created_course["is_published"] == False  # New courses start as draft
        
        # Store course ID for cleanup
        self.test_course_id = created_course["id"]
        print(f"✓ Created course: {created_course['title']} (ID: {created_course['id']})")
        
        # Cleanup - delete the test course
        delete_response = requests.delete(f"{BASE_URL}/api/education/instructor/courses/{self.test_course_id}", headers=self.headers)
        assert delete_response.status_code == 200
        print(f"✓ Cleaned up test course")
    
    def test_non_admin_access_blocked(self):
        """Test that non-admin users cannot access instructor portal"""
        # Get regular user token
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "9876543210"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"
        })
        user_token = response.json().get("token")
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to access instructor dashboard
        response = requests.get(f"{BASE_URL}/api/education/instructor/dashboard", headers=user_headers)
        assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
        print("✓ Non-admin access to instructor dashboard correctly blocked")


class TestLeaderboard:
    """Leaderboard API tests - public endpoint"""
    
    def test_get_leaderboard_public(self):
        """Test GET /api/education/leaderboard - returns public leaderboard"""
        response = requests.get(f"{BASE_URL}/api/education/leaderboard?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        
        leaderboard = data["leaderboard"]
        
        # Verify leaderboard entry structure
        for entry in leaderboard:
            assert "rank" in entry
            assert "user_id" in entry
            assert "user_name" in entry
            assert "xp" in entry
            assert "badge" in entry
            assert "courses_completed" in entry
            assert "quizzes_passed" in entry
            
            # Verify badge values
            assert entry["badge"] in ["Beginner", "Intermediate", "Advanced", "Expert"]
            
            print(f"  #{entry['rank']} {entry['user_name']}: {entry['xp']} XP, {entry['badge']} badge, {entry['courses_completed']} courses")
        
        print(f"✓ Leaderboard has {len(leaderboard)} entries")
    
    def test_leaderboard_ranking_order(self):
        """Test that leaderboard is sorted by XP correctly"""
        response = requests.get(f"{BASE_URL}/api/education/leaderboard?limit=50")
        assert response.status_code == 200
        
        leaderboard = response.json()["leaderboard"]
        
        # Verify ranking is sequential
        for i, entry in enumerate(leaderboard):
            assert entry["rank"] == i + 1, f"Expected rank {i+1}, got {entry['rank']}"
        
        # Verify XP is descending (ties allowed)
        for i in range(len(leaderboard) - 1):
            assert leaderboard[i]["xp"] >= leaderboard[i+1]["xp"], "Leaderboard not sorted by XP"
        
        print("✓ Leaderboard correctly sorted by XP")


class TestMyStats:
    """My Stats API tests - requires authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get user token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "+919999999999"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "+919999999999",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_my_stats(self):
        """Test GET /api/education/my-stats - returns user's learning stats"""
        response = requests.get(f"{BASE_URL}/api/education/my-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify required fields for My Status card
        assert "level" in data
        assert "badge" in data
        assert "rank" in data
        assert "total_xp" in data
        assert "xp_progress" in data
        assert "next_level_xp" in data
        
        # Verify quick stats fields
        assert "courses_completed" in data
        assert "quizzes_passed" in data
        assert "certificates_earned" in data
        assert "total_watch_time_hours" in data
        
        # Verify badge value
        assert data["badge"] in ["Beginner", "Intermediate", "Advanced", "Expert"]
        
        # Verify data types
        assert isinstance(data["level"], int) and data["level"] >= 1
        assert isinstance(data["rank"], int) and data["rank"] >= 1
        assert isinstance(data["total_xp"], int) and data["total_xp"] >= 0
        
        print(f"✓ My Stats: Level {data['level']}, {data['badge']} badge, Rank #{data['rank']}, {data['total_xp']} XP")
        print(f"  Progress: {data['xp_progress']}/{data['next_level_xp']} XP to next level")
        print(f"  Quick Stats: {data['courses_completed']} courses, {data['quizzes_passed']} quizzes, {data['certificates_earned']} certs, {data['total_watch_time_hours']}h watch time")
    
    def test_my_stats_requires_auth(self):
        """Test that my-stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/education/my-stats")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ My stats correctly requires authentication")
    
    def test_xp_calculation(self):
        """Test XP calculation formula matches expected values"""
        response = requests.get(f"{BASE_URL}/api/education/my-stats", headers=self.headers)
        data = response.json()
        
        # XP formula: (courses_completed * 100) + (quizzes_passed * 20) + (certificates * 50)
        expected_xp = (data["courses_completed"] * 100) + (data["quizzes_passed"] * 20) + (data["certificates_earned"] * 50)
        
        assert data["total_xp"] == expected_xp, f"XP mismatch: expected {expected_xp}, got {data['total_xp']}"
        print(f"✓ XP calculation correct: {data['courses_completed']}×100 + {data['quizzes_passed']}×20 + {data['certificates_earned']}×50 = {expected_xp}")
    
    def test_badge_levels(self):
        """Test badge assignment based on XP thresholds"""
        response = requests.get(f"{BASE_URL}/api/education/my-stats", headers=self.headers)
        data = response.json()
        
        xp = data["total_xp"]
        badge = data["badge"]
        
        # Badge thresholds: Expert (1000+), Advanced (500-999), Intermediate (200-499), Beginner (0-199)
        if xp >= 1000:
            expected_badge = "Expert"
        elif xp >= 500:
            expected_badge = "Advanced"
        elif xp >= 200:
            expected_badge = "Intermediate"
        else:
            expected_badge = "Beginner"
        
        assert badge == expected_badge, f"Badge mismatch for {xp} XP: expected {expected_badge}, got {badge}"
        print(f"✓ Badge '{badge}' correct for {xp} XP")


class TestInstructorCRUD:
    """Test Instructor CRUD operations for lessons and quizzes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get admin token and create test course"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "+919999999999"})
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "+919999999999",
            "otp": "123456"
        })
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create test course
        course_data = {
            "title": "TEST_CRUD_Course",
            "description": "Test course for CRUD operations",
            "category": "tech",
            "difficulty": "beginner",
            "price": 0,
            "duration_hours": 5
        }
        course_response = requests.post(f"{BASE_URL}/api/education/courses", json=course_data, headers=self.headers)
        self.course_id = course_response.json()["course"]["id"]
    
    def teardown_method(self, method):
        """Cleanup - delete test course"""
        if hasattr(self, 'course_id'):
            requests.delete(f"{BASE_URL}/api/education/instructor/courses/{self.course_id}", headers=self.headers)
    
    def test_create_lesson(self):
        """Test POST /api/education/lessons - create lesson for course"""
        lesson_data = {
            "course_id": self.course_id,
            "title": "TEST_Lesson",
            "description": "Test lesson description",
            "video_url": "https://youtube.com/watch?v=test123",
            "order_index": 1,
            "duration_minutes": 15,
            "is_free_preview": True
        }
        
        response = requests.post(f"{BASE_URL}/api/education/lessons", json=lesson_data, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "lesson" in data
        
        lesson = data["lesson"]
        assert lesson["title"] == "TEST_Lesson"
        assert lesson["is_free_preview"] == True
        assert lesson["duration_minutes"] == 15
        
        print(f"✓ Created lesson: {lesson['title']}")
    
    def test_create_quiz(self):
        """Test POST /api/education/quizzes - create quiz for course"""
        quiz_data = {
            "course_id": self.course_id,
            "title": "TEST_Quiz",
            "passing_score": 70,
            "time_limit_minutes": 30,
            "questions": []
        }
        
        response = requests.post(f"{BASE_URL}/api/education/quizzes", json=quiz_data, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "quiz" in data
        
        quiz = data["quiz"]
        assert quiz["title"] == "TEST_Quiz"
        assert quiz["passing_score"] == 70
        assert quiz["time_limit_minutes"] == 30
        
        print(f"✓ Created quiz: {quiz['title']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
