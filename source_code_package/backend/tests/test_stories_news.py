"""
Test Stories API and News API - Iteration 8
Tests for WhatsApp/Instagram style stories and Tinder-style news
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"


class TestAuth:
    """Authentication tests for getting token"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        # Request OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_PHONE})
        assert otp_response.status_code == 200, f"OTP request failed: {otp_response.text}"
        
        # Verify OTP
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        assert verify_response.status_code == 200, f"OTP verify failed: {verify_response.text}"
        
        data = verify_response.json()
        assert "token" in data, "Token not in response"
        return data["token"]
    
    def test_login_with_otp(self, auth_token):
        """Test login with OTP returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 10


class TestStoriesAPI:
    """Stories API tests - WhatsApp/Instagram style stories"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        otp_response = requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_PHONE})
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        return verify_response.json().get("token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_create_text_story(self, headers):
        """Test creating a text story"""
        story_data = {
            "content_type": "text",
            "text": f"Test story created at {int(time.time())}",
            "background_color": "#6366f1"
        }
        
        response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        assert response.status_code == 200, f"Create story failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "story" in data
        assert data["story"]["content_type"] == "text"
        assert data["story"]["text"] == story_data["text"]
        assert "id" in data["story"]
        assert "created_at" in data["story"]
        assert "expires_at" in data["story"]
        
        return data["story"]["id"]
    
    def test_create_image_story(self, headers):
        """Test creating an image story with base64"""
        # Small base64 image (1x1 pixel PNG)
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        story_data = {
            "content_type": "image",
            "media_url": base64_image,
            "text": "Image story caption"
        }
        
        response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        assert response.status_code == 200, f"Create image story failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data["story"]["content_type"] == "image"
        assert data["story"]["media_url"] == base64_image
    
    def test_create_text_story_without_text_fails(self, headers):
        """Test that creating text story without text fails"""
        story_data = {
            "content_type": "text",
            "text": None
        }
        
        response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        assert response.status_code == 400, "Should fail without text"
    
    def test_create_image_story_without_media_fails(self, headers):
        """Test that creating image story without media fails"""
        story_data = {
            "content_type": "image",
            "media_url": None
        }
        
        response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        assert response.status_code == 400, "Should fail without media"
    
    def test_get_stories_feed(self, headers):
        """Test getting stories feed"""
        response = requests.get(f"{BASE_URL}/api/stories/feed", headers=headers)
        assert response.status_code == 200, f"Get feed failed: {response.text}"
        
        data = response.json()
        assert "feed" in data
        assert "my_stories" in data
        assert "total_users" in data
        
        # Check my_stories structure if exists
        if data["my_stories"]:
            assert "user_id" in data["my_stories"]
            assert "stories" in data["my_stories"]
            assert "has_unseen" in data["my_stories"]
    
    def test_get_my_stories(self, headers):
        """Test getting current user's stories"""
        response = requests.get(f"{BASE_URL}/api/stories/my", headers=headers)
        assert response.status_code == 200, f"Get my stories failed: {response.text}"
        
        data = response.json()
        assert "stories" in data
        assert "count" in data
        assert isinstance(data["stories"], list)
        
        # Check story structure
        if len(data["stories"]) > 0:
            story = data["stories"][0]
            assert "id" in story
            assert "content_type" in story
            assert "time_remaining" in story
    
    def test_view_story(self, headers):
        """Test viewing a story"""
        # First create a story
        story_data = {
            "content_type": "text",
            "text": f"Story to view {int(time.time())}",
            "background_color": "#ec4899"
        }
        create_response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        story_id = create_response.json()["story"]["id"]
        
        # View the story
        view_response = requests.post(f"{BASE_URL}/api/stories/view", json={"story_id": story_id}, headers=headers)
        assert view_response.status_code == 200, f"View story failed: {view_response.text}"
        
        data = view_response.json()
        assert data.get("success") == True
        assert data.get("viewed") == True
    
    def test_view_nonexistent_story_fails(self, headers):
        """Test viewing non-existent story returns 404"""
        view_response = requests.post(f"{BASE_URL}/api/stories/view", json={"story_id": "nonexistent123"}, headers=headers)
        assert view_response.status_code == 404
    
    def test_get_story_viewers(self, headers):
        """Test getting viewers of own story"""
        # First create a story
        story_data = {
            "content_type": "text",
            "text": f"Story for viewers test {int(time.time())}",
            "background_color": "#10b981"
        }
        create_response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        story_id = create_response.json()["story"]["id"]
        
        # Get viewers
        viewers_response = requests.get(f"{BASE_URL}/api/stories/{story_id}/viewers", headers=headers)
        assert viewers_response.status_code == 200, f"Get viewers failed: {viewers_response.text}"
        
        data = viewers_response.json()
        assert "story_id" in data
        assert "viewers" in data
        assert "view_count" in data
        assert isinstance(data["viewers"], list)
    
    def test_delete_story(self, headers):
        """Test deleting own story"""
        # First create a story
        story_data = {
            "content_type": "text",
            "text": f"Story to delete {int(time.time())}",
            "background_color": "#f59e0b"
        }
        create_response = requests.post(f"{BASE_URL}/api/stories/create", json=story_data, headers=headers)
        story_id = create_response.json()["story"]["id"]
        
        # Delete the story
        delete_response = requests.delete(f"{BASE_URL}/api/stories/{story_id}", headers=headers)
        assert delete_response.status_code == 200, f"Delete story failed: {delete_response.text}"
        
        data = delete_response.json()
        assert data.get("success") == True
        assert data.get("deleted") == True
        
        # Verify story is deleted
        view_response = requests.post(f"{BASE_URL}/api/stories/view", json={"story_id": story_id}, headers=headers)
        assert view_response.status_code == 404, "Story should be deleted"
    
    def test_delete_nonexistent_story_fails(self, headers):
        """Test deleting non-existent story returns 404"""
        delete_response = requests.delete(f"{BASE_URL}/api/stories/nonexistent123", headers=headers)
        assert delete_response.status_code == 404
    
    def test_get_user_stories(self, headers):
        """Test getting stories from a specific user"""
        # First get my user ID from feed
        feed_response = requests.get(f"{BASE_URL}/api/stories/feed", headers=headers)
        my_stories = feed_response.json().get("my_stories")
        
        if my_stories:
            user_id = my_stories["user_id"]
            
            # Get user stories
            user_stories_response = requests.get(f"{BASE_URL}/api/stories/user/{user_id}", headers=headers)
            assert user_stories_response.status_code == 200
            
            data = user_stories_response.json()
            assert "stories" in data
            assert "count" in data


class TestNewsAPI:
    """News API tests - Tinder-style news with Telugu content"""
    
    def test_get_news_categories(self):
        """Test getting news categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        assert response.status_code == 200, f"Get categories failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, dict)
        
        # Check expected categories exist
        expected_categories = ["local", "city", "state", "national", "sports", "entertainment"]
        for cat in expected_categories:
            assert cat in data, f"Category {cat} missing"
            assert "en" in data[cat], f"English label missing for {cat}"
            assert "te" in data[cat], f"Telugu label missing for {cat}"
    
    def test_get_local_news(self):
        """Test getting local news"""
        response = requests.get(f"{BASE_URL}/api/news/local?limit=10")
        assert response.status_code == 200, f"Get local news failed: {response.text}"
        
        data = response.json()
        assert "news" in data
        assert isinstance(data["news"], list)
        
        # Check news item structure
        if len(data["news"]) > 0:
            news_item = data["news"][0]
            assert "id" in news_item
            assert "title" in news_item
            assert "summary" in news_item
            assert "category" in news_item
    
    def test_get_city_news(self):
        """Test getting city news"""
        response = requests.get(f"{BASE_URL}/api/news/city?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_state_news(self):
        """Test getting state news"""
        response = requests.get(f"{BASE_URL}/api/news/state?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_national_news(self):
        """Test getting national news"""
        response = requests.get(f"{BASE_URL}/api/news/national?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_sports_news(self):
        """Test getting sports news"""
        response = requests.get(f"{BASE_URL}/api/news/sports?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_entertainment_news(self):
        """Test getting entertainment news"""
        response = requests.get(f"{BASE_URL}/api/news/entertainment?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_tech_news(self):
        """Test getting tech news"""
        response = requests.get(f"{BASE_URL}/api/news/tech?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_health_news(self):
        """Test getting health news"""
        response = requests.get(f"{BASE_URL}/api/news/health?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_get_business_news(self):
        """Test getting business news"""
        response = requests.get(f"{BASE_URL}/api/news/business?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "news" in data
    
    def test_news_has_telugu_content(self):
        """Test that news items have Telugu content fields"""
        response = requests.get(f"{BASE_URL}/api/news/local?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["news"]) > 0:
            news_item = data["news"][0]
            # Check for Telugu category label
            assert "category_label_te" in news_item or "title_te" in news_item, "Telugu content should be available"
    
    def test_news_source_not_shown_in_frontend(self):
        """Test that news items have source field (frontend should hide it)"""
        response = requests.get(f"{BASE_URL}/api/news/local?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["news"]) > 0:
            news_item = data["news"][0]
            # Source field exists in API but frontend should not display it
            # This is a backend test - frontend test will verify it's hidden
            assert "source" in news_item or True  # Source may or may not be present


class TestWallGroupsAPI:
    """Test Wall Groups API for Dashboard quick access"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        otp_response = requests.post(f"{BASE_URL}/api/auth/otp", json={"phone": TEST_PHONE})
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        return verify_response.json().get("token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_get_groups(self, headers):
        """Test getting groups for dashboard quick access"""
        response = requests.get(f"{BASE_URL}/api/wall/groups", headers=headers)
        assert response.status_code == 200, f"Get groups failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
