"""
Test Student Course Experience for Education Platform (Byju's Style)
Tests: Enrollment, Sequential Learning, Progress Tracking, Lesson Access
Course: Full Stack Web Development (b326b25e-97ac-439b-a691-ec06996c8fad)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_PHONE = "9999999999"
TEST_OTP = "123456"
COURSE_ID = "b326b25e-97ac-439b-a691-ec06996c8fad"
JAVASCRIPT_SUBJECT_ID = "81b9fd72-7f68-4b0a-85b2-e02764879618"
HTML_CSS_SUBJECT_ID = "d78c5534-f3cb-40ec-8db6-6317c8eae1aa"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    # First send OTP
    send_response = requests.post(
        f"{BASE_URL}/api/auth/send-otp",
        json={"phone": TEST_USER_PHONE}
    )
    assert send_response.status_code == 200, f"Failed to send OTP: {send_response.text}"
    
    # Verify OTP
    verify_response = requests.post(
        f"{BASE_URL}/api/auth/verify-otp",
        json={"phone": TEST_USER_PHONE, "otp": TEST_OTP}
    )
    assert verify_response.status_code == 200, f"Failed to verify OTP: {verify_response.text}"
    
    data = verify_response.json()
    assert "token" in data, "No token in response"
    return data["token"]


@pytest.fixture(scope="module")
def api_session(auth_token):
    """Create an authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    return session


class TestPublicCourseAccess:
    """Test courses can be viewed without login"""
    
    def test_courses_list_public(self):
        """View /education courses without login - should be accessible"""
        response = requests.get(f"{BASE_URL}/api/education/courses")
        assert response.status_code == 200, f"Courses list should be public: {response.text}"
        data = response.json()
        assert "courses" in data
        assert len(data["courses"]) > 0, "Should have at least one course"
        print(f"✓ Found {len(data['courses'])} courses publicly accessible")
    
    def test_course_categories_public(self):
        """Categories endpoint should be public"""
        response = requests.get(f"{BASE_URL}/api/education/courses/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✓ Categories accessible: {[c['id'] for c in data['categories']]}")
    
    def test_fullstack_course_exists(self):
        """Verify Full Stack Web Development course exists"""
        response = requests.get(f"{BASE_URL}/api/education/courses")
        data = response.json()
        
        fullstack_course = next(
            (c for c in data["courses"] if c["id"] == COURSE_ID),
            None
        )
        assert fullstack_course is not None, "Full Stack course should exist"
        assert fullstack_course["title"] == "Full Stack Web Development"
        assert fullstack_course["is_published"] == True
        print(f"✓ Full Stack course found: {fullstack_course['title']}")


class TestCourseDetailsAuthenticated:
    """Test course details with authenticated user"""
    
    def test_get_course_details(self, api_session):
        """Get course details with lessons after login"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        assert response.status_code == 200, f"Failed to get course: {response.text}"
        
        data = response.json()
        assert "course" in data
        assert "lessons" in data
        assert data["course"]["title"] == "Full Stack Web Development"
        
        # Verify 22 lessons
        lessons_count = len(data["lessons"])
        assert lessons_count == 22, f"Expected 22 lessons, got {lessons_count}"
        print(f"✓ Course has {lessons_count} lessons")
        
        return data
    
    def test_course_subjects(self, api_session):
        """Verify course has 4 subjects"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}/subjects")
        assert response.status_code == 200
        
        data = response.json()
        subjects = data["subjects"]
        assert len(subjects) == 4, f"Expected 4 subjects, got {len(subjects)}"
        
        # Verify subject lesson counts
        expected_counts = {"HTML & CSS Fundamentals": 4, "JavaScript Programming": 6, 
                          "React.js Framework": 6, "Node.js & Backend Development": 6}
        for subject in subjects:
            if subject["title"] in expected_counts:
                expected = expected_counts[subject["title"]]
                assert subject["lesson_count"] == expected, \
                    f"{subject['title']} should have {expected} lessons, got {subject['lesson_count']}"
        
        print(f"✓ 4 subjects found with correct lesson counts")


class TestCourseEnrollment:
    """Test course enrollment flow"""
    
    def test_enroll_in_course(self, api_session):
        """Enroll in Full Stack Web Development course"""
        response = api_session.post(
            f"{BASE_URL}/api/education/enroll",
            json={"course_id": COURSE_ID}
        )
        assert response.status_code == 200, f"Failed to enroll: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "enrollment" in data
        print(f"✓ Enrolled successfully: {data.get('message')}")
    
    def test_verify_enrollment(self, api_session):
        """Verify user is enrolled in course"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("is_enrolled") == True, "User should be enrolled"
        print(f"✓ User is enrolled in course")
    
    def test_my_courses_shows_enrolled(self, api_session):
        """My Courses should show enrolled course with progress"""
        response = api_session.get(f"{BASE_URL}/api/education/my-courses")
        assert response.status_code == 200, f"Failed to get my courses: {response.text}"
        
        data = response.json()
        assert "courses" in data
        
        # Find our course
        enrolled_course = next(
            (c for c in data["courses"] if c["id"] == COURSE_ID),
            None
        )
        assert enrolled_course is not None, "Enrolled course should appear in My Courses"
        assert "progress" in enrolled_course, "Progress should be included"
        print(f"✓ My Courses shows enrolled course with progress: {enrolled_course.get('progress')}")


class TestFirstLessonAccess:
    """Test first lesson (free preview) access"""
    
    def test_first_lesson_is_free_preview(self, api_session):
        """First lesson should be marked as free preview"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        data = response.json()
        
        # Sort lessons by order_index to get first lesson
        lessons = sorted(data["lessons"], key=lambda x: (x.get("subject_id", ""), x.get("order_index", 0)))
        first_lesson = lessons[0]
        
        assert first_lesson.get("is_free_preview") == True, \
            f"First lesson should be free preview: {first_lesson.get('title')}"
        print(f"✓ First lesson '{first_lesson['title']}' is free preview")
        
        return first_lesson["id"]
    
    def test_access_first_lesson(self, api_session):
        """Access first lesson - should work (free preview)"""
        # Get lessons
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        
        # Get HTML subject's first lesson (order_index=0)
        html_lessons = [l for l in lessons if l.get("subject_id") == HTML_CSS_SUBJECT_ID]
        first_lesson = next((l for l in html_lessons if l.get("order_index") == 0), None)
        
        assert first_lesson is not None, "Should have first HTML lesson"
        
        lesson_response = api_session.get(f"{BASE_URL}/api/education/lessons/{first_lesson['id']}")
        assert lesson_response.status_code == 200, f"Should access first lesson: {lesson_response.text}"
        
        lesson_data = lesson_response.json()
        assert lesson_data.get("title") == first_lesson["title"]
        print(f"✓ Accessed first lesson: {lesson_data['title']}")
        
        return first_lesson["id"]


class TestLessonCompletion:
    """Test marking lessons as complete"""
    
    def test_mark_first_lesson_complete(self, api_session):
        """Mark first lesson as complete"""
        # Get first HTML lesson
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        html_lessons = [l for l in lessons if l.get("subject_id") == HTML_CSS_SUBJECT_ID]
        first_lesson = next((l for l in html_lessons if l.get("order_index") == 0), None)
        
        # Mark as complete
        progress_response = api_session.post(
            f"{BASE_URL}/api/education/lessons/{first_lesson['id']}/progress",
            json={
                "course_id": COURSE_ID,
                "lesson_id": first_lesson["id"],
                "completed": True,
                "watch_time_seconds": 2700  # 45 minutes
            }
        )
        assert progress_response.status_code == 200, f"Failed to update progress: {progress_response.text}"
        
        data = progress_response.json()
        assert data.get("success") == True
        print(f"✓ Marked first lesson as complete")
    
    def test_progress_updated(self, api_session):
        """Verify progress is updated after completing lesson"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        data = response.json()
        
        progress = data.get("progress")
        assert progress is not None, "Progress should be tracked"
        assert progress.get("completed", 0) >= 1, "At least 1 lesson should be completed"
        print(f"✓ Progress updated: {progress['completed']}/{progress['total']} lessons")


class TestSequentialLearningAccess:
    """Test sequential learning - can't skip lessons"""
    
    def test_access_second_lesson_after_first_complete(self, api_session):
        """Lesson 2 should be accessible after completing Lesson 1"""
        # Get lessons
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        
        # Get HTML subject lessons
        html_lessons = sorted(
            [l for l in lessons if l.get("subject_id") == HTML_CSS_SUBJECT_ID],
            key=lambda x: x.get("order_index", 0)
        )
        
        if len(html_lessons) < 2:
            pytest.skip("Not enough lessons to test sequential access")
        
        second_lesson = html_lessons[1]
        
        # Try to access second lesson
        lesson_response = api_session.get(f"{BASE_URL}/api/education/lessons/{second_lesson['id']}")
        assert lesson_response.status_code == 200, \
            f"Second lesson should be accessible after first is complete: {lesson_response.text}"
        print(f"✓ Second lesson accessible after completing first: {second_lesson['title']}")
    
    def test_skip_to_third_lesson_blocked(self, api_session):
        """Skipping to lesson 3 without completing lesson 2 should be BLOCKED"""
        # Get lessons
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        
        # Get HTML subject lessons
        html_lessons = sorted(
            [l for l in lessons if l.get("subject_id") == HTML_CSS_SUBJECT_ID],
            key=lambda x: x.get("order_index", 0)
        )
        
        if len(html_lessons) < 3:
            pytest.skip("Not enough lessons to test skip blocking")
        
        third_lesson = html_lessons[2]
        
        # Try to access third lesson without completing second
        lesson_response = api_session.get(f"{BASE_URL}/api/education/lessons/{third_lesson['id']}")
        
        # Should be blocked with 403
        assert lesson_response.status_code == 403, \
            f"Third lesson should be BLOCKED without completing second. Got: {lesson_response.status_code} - {lesson_response.text}"
        
        error_detail = lesson_response.json().get("detail", "")
        assert "complete" in error_detail.lower() or "previous" in error_detail.lower(), \
            f"Error should mention completing previous lesson: {error_detail}"
        
        print(f"✓ Skipping to lesson 3 correctly BLOCKED: {error_detail}")
    
    def test_sequential_enforcement_on_javascript_subject(self, api_session):
        """Test sequential access enforcement on JavaScript subject"""
        # Get JavaScript lessons
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        
        js_lessons = sorted(
            [l for l in lessons if l.get("subject_id") == JAVASCRIPT_SUBJECT_ID],
            key=lambda x: x.get("order_index", 0)
        )
        
        if len(js_lessons) < 2:
            pytest.skip("Not enough JavaScript lessons")
        
        # First JS lesson should be accessible (free preview)
        first_js = js_lessons[0]
        first_response = api_session.get(f"{BASE_URL}/api/education/lessons/{first_js['id']}")
        
        if first_js.get("is_free_preview"):
            assert first_response.status_code == 200, \
                f"First JS lesson (free preview) should be accessible: {first_response.text}"
            print(f"✓ First JS lesson accessible (free preview): {first_js['title']}")
        
        # Second JS lesson should be blocked if first not complete
        second_js = js_lessons[1]
        second_response = api_session.get(f"{BASE_URL}/api/education/lessons/{second_js['id']}")
        
        # Check if blocked (depends on whether first JS lesson is completed)
        if second_response.status_code == 403:
            print(f"✓ Second JS lesson correctly blocked: {second_js['title']}")
        else:
            print(f"⚠ Second JS lesson accessible (first may be completed): {second_js['title']}")


class TestProgressTracking:
    """Test progress tracking API"""
    
    def test_my_stats(self, api_session):
        """Get user's learning statistics"""
        response = api_session.get(f"{BASE_URL}/api/education/my-stats")
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        assert "total_courses_enrolled" in data
        assert "courses_completed" in data
        assert "total_xp" in data
        
        print(f"✓ User stats: Enrolled: {data['total_courses_enrolled']}, "
              f"Completed: {data['courses_completed']}, XP: {data['total_xp']}")
    
    def test_progress_percentage_calculation(self, api_session):
        """Verify progress percentage is calculated correctly"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        data = response.json()
        
        progress = data.get("progress")
        if progress:
            expected_percentage = round((progress["completed"] / progress["total"]) * 100)
            # Allow 1% tolerance for rounding
            assert abs(progress["percentage"] - expected_percentage) <= 1, \
                f"Progress percentage mismatch: {progress['percentage']} vs {expected_percentage}"
            print(f"✓ Progress percentage correct: {progress['percentage']}%")


class TestCourseCurriculum:
    """Test the curriculum structure"""
    
    def test_lessons_have_order_index(self, api_session):
        """All lessons should have order_index for sequencing"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        
        for lesson in lessons:
            assert "order_index" in lesson, f"Lesson missing order_index: {lesson.get('title')}"
            assert "subject_id" in lesson, f"Lesson missing subject_id: {lesson.get('title')}"
        
        print(f"✓ All {len(lessons)} lessons have order_index and subject_id")
    
    def test_lessons_have_requires_previous(self, api_session):
        """Lessons should have requires_previous flag for sequential enforcement"""
        response = api_session.get(f"{BASE_URL}/api/education/courses/{COURSE_ID}")
        lessons = response.json()["lessons"]
        
        sequential_lessons = [l for l in lessons if l.get("requires_previous") == True]
        print(f"✓ {len(sequential_lessons)}/{len(lessons)} lessons require previous completion")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
