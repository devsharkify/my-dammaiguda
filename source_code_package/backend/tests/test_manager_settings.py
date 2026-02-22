"""
Test Manager Portal APIs and Settings APIs
Tests for:
1. Manager Login Flow
2. Manager Wall Posts CRUD
3. Manager Banner Update  
4. Admin Settings API (Branding)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://course-learn-1.preview.emergentagent.com')

# Test credentials
MANAGER_PHONE = "+919876543211"
ADMIN_PHONE = "+919999999999"
TEST_OTP = "123456"

class TestAuthAndManager:
    """Test authentication and manager flows"""
    
    manager_token = None
    admin_token = None
    test_post_id = None
    
    def test_01_manager_send_otp(self):
        """Test sending OTP to manager phone"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": MANAGER_PHONE}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"OTP sent to manager: {MANAGER_PHONE}")
    
    def test_02_manager_verify_otp_and_login(self):
        """Test manager OTP verification and login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"phone": MANAGER_PHONE, "otp": TEST_OTP}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("user", {}).get("role") == "manager"
        TestAuthAndManager.manager_token = data.get("access_token")
        print(f"Manager logged in: {data.get('user', {}).get('name')}")
    
    def test_03_manager_get_stats(self):
        """Test manager stats API"""
        headers = {"Authorization": f"Bearer {TestAuthAndManager.manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_members" in data
        assert "pending_grievances" in data
        assert "wall_posts" in data
        print(f"Manager stats: Total members={data['total_members']}, Wall posts={data['wall_posts']}")
    
    def test_04_manager_get_wall(self):
        """Test getting wall posts"""
        headers = {"Authorization": f"Bearer {TestAuthAndManager.manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/wall", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        print(f"Wall posts count: {len(data['posts'])}")
    
    def test_05_manager_create_wall_post(self):
        """Test creating a wall post"""
        headers = {"Authorization": f"Bearer {TestAuthAndManager.manager_token}"}
        post_content = "TEST_automated_post_for_testing"
        response = requests.post(
            f"{BASE_URL}/api/manager/wall",
            json={"content": post_content},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "post" in data
        TestAuthAndManager.test_post_id = data["post"]["id"]
        print(f"Created wall post with ID: {TestAuthAndManager.test_post_id}")
    
    def test_06_manager_delete_wall_post(self):
        """Test deleting a wall post"""
        if not TestAuthAndManager.test_post_id:
            pytest.skip("No test post to delete")
        
        headers = {"Authorization": f"Bearer {TestAuthAndManager.manager_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/manager/wall/{TestAuthAndManager.test_post_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted wall post: {TestAuthAndManager.test_post_id}")
    
    def test_07_manager_get_banner(self):
        """Test getting area banner"""
        headers = {"Authorization": f"Bearer {TestAuthAndManager.manager_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/banner", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "banner_url" in data
        print(f"Current banner URL: {data['banner_url'][:50]}...")
    
    def test_08_manager_update_banner(self):
        """Test updating area banner"""
        headers = {"Authorization": f"Bearer {TestAuthAndManager.manager_token}"}
        new_banner = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=600&fit=crop"
        response = requests.put(
            f"{BASE_URL}/api/manager/banner",
            json={"banner_url": new_banner},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("Banner updated successfully")


class TestAdminSettings:
    """Test admin settings APIs"""
    
    admin_token = None
    
    def test_01_admin_send_otp(self):
        """Test sending OTP to admin phone"""
        response = requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": ADMIN_PHONE}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"OTP sent to admin: {ADMIN_PHONE}")
    
    def test_02_admin_verify_otp_and_login(self):
        """Test admin OTP verification and login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"phone": ADMIN_PHONE, "otp": TEST_OTP}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("user", {}).get("role") == "admin"
        TestAdminSettings.admin_token = data.get("access_token")
        print(f"Admin logged in: {data.get('user', {}).get('name')}")
    
    def test_03_get_branding_settings_public(self):
        """Test public branding settings API"""
        response = requests.get(f"{BASE_URL}/api/settings/branding?area_id=dammaiguda")
        assert response.status_code == 200
        data = response.json()
        assert "branding" in data or "area_id" in data
        print(f"Got branding settings for dammaiguda")
    
    def test_04_update_branding_settings(self):
        """Test updating branding settings (admin only)"""
        headers = {"Authorization": f"Bearer {TestAdminSettings.admin_token}"}
        response = requests.put(
            f"{BASE_URL}/api/settings/branding",
            json={
                "area_id": "dammaiguda",
                "branding": {
                    "app_name": "My Dammaiguda",
                    "app_name_short": "My Dammaiguda",
                    "tagline": "Track Issues. Protect Health. Claim Benefits.",
                    "primary_color": "#0F766E",
                    "company_name": "Sharkify Technology Pvt. Ltd."
                },
                "stats": {
                    "benefits_amount": "₹15Cr+",
                    "problems_solved": "150+",
                    "people_benefited": "60K+"
                }
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("Branding settings updated successfully")
    
    def test_05_get_all_branding_settings_admin(self):
        """Test getting all branding settings (admin only)"""
        headers = {"Authorization": f"Bearer {TestAdminSettings.admin_token}"}
        response = requests.get(f"{BASE_URL}/api/settings/branding/all", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        print(f"Got all branding settings, count: {len(data['settings'])}")
    
    def test_06_get_area_config(self):
        """Test public area config API"""
        response = requests.get(f"{BASE_URL}/api/settings/config/dammaiguda")
        assert response.status_code == 200
        data = response.json()
        assert "area_id" in data
        assert "branding" in data
        print(f"Got config for dammaiguda area")
    
    def test_07_get_area_banner(self):
        """Test public area banner API"""
        response = requests.get(f"{BASE_URL}/api/settings/banner/dammaiguda")
        assert response.status_code == 200
        data = response.json()
        assert "banner_url" in data
        print(f"Got banner for dammaiguda")


class TestManagerList:
    """Test manager list API (admin only)"""
    
    def test_01_list_managers(self):
        """Test listing all managers"""
        # First send OTP to admin
        requests.post(
            f"{BASE_URL}/api/auth/send-otp",
            json={"phone": ADMIN_PHONE}
        )
        
        # Then verify OTP
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-otp",
            json={"phone": ADMIN_PHONE, "otp": TEST_OTP}
        )
        assert response.status_code == 200
        token = response.json().get("access_token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/manager/list", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "managers" in data
        print(f"Found {len(data['managers'])} managers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
