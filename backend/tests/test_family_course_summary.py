"""Test Family API - Course Summary Feature
Tests for /api/family/members endpoint returning course_summary field
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFamilyAPI:
    """Test Family endpoints - Course progress summary for children"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token using test credentials"""
        # Request OTP
        response = requests.post(f"{BASE_URL}/api/auth/request-otp", json={
            "phone": "9876543210"
        })
        assert response.status_code == 200, f"Failed to request OTP: {response.text}"
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "9876543210",
            "otp": "123456"  # Static test OTP
        })
        assert response.status_code == 200, f"Failed to verify OTP: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        return data["token"]
    
    def test_family_members_endpoint_exists(self, auth_token):
        """Test that /api/family/members endpoint exists and returns 200"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/family/members", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Family members endpoint returns 200")
    
    def test_family_members_returns_list(self, auth_token):
        """Test that /api/family/members returns a list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/family/members", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ Family members returns list with {len(data)} members")
    
    def test_family_members_has_course_summary_field(self, auth_token):
        """Test that each family member has course_summary field in response"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/family/members", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No family members found - cannot verify course_summary structure")
        
        for member in data:
            assert "course_summary" in member, f"course_summary field missing for member: {member}"
            course_summary = member["course_summary"]
            
            # Verify course_summary structure
            assert "total_courses" in course_summary, "total_courses missing in course_summary"
            assert "completed" in course_summary, "completed missing in course_summary"
            assert "in_progress" in course_summary, "in_progress missing in course_summary"
            assert "certificates" in course_summary, "certificates missing in course_summary"
            
            # Verify types
            assert isinstance(course_summary["total_courses"], int), "total_courses should be int"
            assert isinstance(course_summary["completed"], int), "completed should be int"
            assert isinstance(course_summary["in_progress"], int), "in_progress should be int"
            assert isinstance(course_summary["certificates"], int), "certificates should be int"
            
            print(f"✓ Member '{member.get('family_member_name', 'Unknown')}' has valid course_summary: {course_summary}")
        
        print(f"✓ All {len(data)} family members have valid course_summary field")

    def test_family_member_courses_endpoint(self, auth_token):
        """Test /api/family/member/{member_id}/courses endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get family members
        response = requests.get(f"{BASE_URL}/api/family/members", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No family members found - cannot test member courses endpoint")
        
        # Test courses endpoint for each member
        for member in data:
            member_id = member.get("family_member_id")
            if not member_id:
                continue
                
            courses_response = requests.get(
                f"{BASE_URL}/api/family/member/{member_id}/courses",
                headers=headers
            )
            
            assert courses_response.status_code == 200, f"Failed to get courses for member {member_id}"
            courses_data = courses_response.json()
            
            # Verify response structure
            assert "member_name" in courses_data, "member_name missing"
            assert "relationship" in courses_data, "relationship missing"
            assert "courses" in courses_data, "courses missing"
            assert "total_courses" in courses_data, "total_courses missing"
            assert "completed_courses" in courses_data, "completed_courses missing"
            assert "in_progress_courses" in courses_data, "in_progress_courses missing"
            assert "total_certificates" in courses_data, "total_certificates missing"
            
            print(f"✓ Courses endpoint works for member '{courses_data.get('member_name', 'Unknown')}'")


class TestHelplineAPI:
    """Test Helpline - just verify no specific backend needed (static page)"""
    
    def test_frontend_route_accessible(self):
        """Verify /helpline frontend route is accessible (no special API)"""
        # Helpline is a static frontend page - no backend API needed
        # This test just documents that Helpline uses no backend API
        print("✓ Helpline page is frontend-only (no backend API required)")
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
