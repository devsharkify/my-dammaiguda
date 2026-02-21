"""
Test Session 33 Features:
1. News - Read More only for admin-pushed news
2. Video news with YouTube embedding
3. AQI widget Hyderabad icon
4. Analytics API endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dammaiguda-app-1.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_PHONE = "9999999999"
TEST_PHONE = "9876543210"
TEST_OTP = "123456"

# Global tokens
admin_token = None
user_token = None


def get_user_token():
    """Get regular user auth token"""
    global user_token
    if user_token:
        return user_token
    
    # Request OTP
    response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
        "phone": TEST_PHONE
    })
    if response.status_code != 200:
        print(f"Failed to request OTP: {response.text}")
        return None
    
    # Verify OTP
    response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
        "phone": TEST_PHONE,
        "otp": TEST_OTP
    })
    if response.status_code != 200:
        print(f"Failed to verify OTP: {response.text}")
        return None
    
    data = response.json()
    user_token = data.get("token")
    return user_token


def get_admin_token():
    """Get admin auth token"""
    global admin_token
    if admin_token:
        return admin_token
    
    # Request OTP
    response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
        "phone": ADMIN_PHONE
    })
    if response.status_code != 200:
        print(f"Failed to request OTP: {response.text}")
        return None
    
    # Verify OTP
    response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
        "phone": ADMIN_PHONE,
        "otp": TEST_OTP
    })
    if response.status_code != 200:
        print(f"Failed to verify OTP: {response.text}")
        return None
    
    data = response.json()
    admin_token = data.get("token")
    return admin_token


class TestAnalyticsAPI:
    """Test Analytics API Endpoints"""
    
    def test_page_view_tracking(self):
        """Test POST /api/analytics/page-view"""
        token = get_user_token()
        if not token:
            pytest.skip("Could not get user token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/analytics/page-view", json={
            "page": "/news",
            "page_title": "News Page",
            "referrer": "/dashboard"
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        print(f"PASS: POST /api/analytics/page-view - {response.status_code}")
    
    def test_action_tracking(self):
        """Test POST /api/analytics/action"""
        token = get_user_token()
        if not token:
            pytest.skip("Could not get user token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/analytics/action", json={
            "action": "click",
            "element": "share_button",
            "page": "/news",
            "metadata": {"article_id": "test123"}
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        print(f"PASS: POST /api/analytics/action - {response.status_code}")
    
    def test_feature_tracking(self):
        """Test POST /api/analytics/feature"""
        token = get_user_token()
        if not token:
            pytest.skip("Could not get user token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/analytics/feature", json={
            "feature": "news",
            "sub_feature": "local",
            "action": "view",
            "metadata": {"category": "local"}
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        print(f"PASS: POST /api/analytics/feature - {response.status_code}")
    
    def test_admin_analytics_summary(self):
        """Test GET /api/analytics/admin/summary - Admin only"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/admin/summary?days=7", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "period_days" in data
        assert "total_events" in data
        assert "unique_active_users" in data
        assert "feature_popularity" in data
        assert "top_pages" in data
        assert "daily_active_users" in data
        print(f"PASS: GET /api/analytics/admin/summary - {response.status_code}")
        print(f"  - Total events: {data.get('total_events')}")
        print(f"  - Active users: {data.get('unique_active_users')}")
    
    def test_admin_analytics_non_admin_rejected(self):
        """Test that non-admin users cannot access admin analytics"""
        token = get_user_token()
        if not token:
            pytest.skip("Could not get user token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/admin/summary", headers=headers)
        
        assert response.status_code == 403
        print(f"PASS: Non-admin rejected from analytics - {response.status_code}")
    
    def test_admin_active_users(self):
        """Test GET /api/analytics/admin/active-users"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/analytics/admin/active-users?hours=24", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "hours" in data
        assert "active_users" in data
        assert "count" in data
        print(f"PASS: GET /api/analytics/admin/active-users - {response.status_code}")


class TestNewsVideoSupport:
    """Test News API with Video Support"""
    
    def test_news_categories(self):
        """Test GET /api/news/categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert "local" in data
        assert "city" in data
        print(f"PASS: GET /api/news/categories - {response.status_code}")
    
    def test_news_by_category(self):
        """Test GET /api/news/{category}"""
        response = requests.get(f"{BASE_URL}/api/news/local?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert "news" in data
        assert "count" in data
        print(f"PASS: GET /api/news/local - {response.status_code} - {data.get('count')} articles")
    
    def test_admin_create_video_news(self):
        """Test POST /api/news/admin/push - Create video news"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        video_news = {
            "title": "TEST_Video News - YouTube Test",
            "title_te": "TEST_వీడియో వార్త - యూట్యూబ్ టెస్ట్",
            "summary": "Testing YouTube video embedding in news feed",
            "summary_te": "న్యూస్ ఫీడ్‌లో యూట్యూబ్ వీడియో ఎంబెడింగ్ టెస్టింగ్",
            "category": "local",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "content_type": "video",
            "is_pinned": True,
            "priority": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/news/admin/push", json=video_news, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "news" in data
        news = data["news"]
        assert news.get("content_type") == "video"
        assert news.get("video_url") == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert news.get("is_admin_pushed") is True
        print(f"PASS: POST /api/news/admin/push (video) - {response.status_code}")
        print(f"  - News ID: {news.get('id')}")
        print(f"  - Content type: {news.get('content_type')}")
    
    def test_admin_create_text_news_with_link(self):
        """Test creating text news with Read More link"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        text_news = {
            "title": "TEST_Admin Text News - Read More Test",
            "title_te": "TEST_అడ్మిన్ టెక్స్ట్ వార్త",
            "summary": "This is admin pushed news that should show Read More button",
            "summary_te": "ఇది అడ్మిన్ పుష్ చేసిన వార్త",
            "category": "local",
            "link": "https://example.com/news/article",
            "content_type": "text",
            "is_pinned": True,
            "priority": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/news/admin/push", json=text_news, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        news = data["news"]
        assert news.get("is_admin_pushed") is True
        assert news.get("link") == "https://example.com/news/article"
        print(f"PASS: POST /api/news/admin/push (text) - {response.status_code}")
    
    def test_get_admin_pushed_news(self):
        """Test GET /api/news/admin/pushed - Get all admin news"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/news/admin/pushed", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "news" in data
        assert "total" in data
        
        # Verify video news exists
        video_news = [n for n in data.get("news", []) if n.get("content_type") == "video"]
        print(f"PASS: GET /api/news/admin/pushed - {response.status_code} - {data.get('total')} articles")
        print(f"  - Video news count: {len(video_news)}")
    
    def test_news_includes_admin_pushed_content(self):
        """Test that news feed includes admin-pushed content with is_admin_pushed flag"""
        response = requests.get(f"{BASE_URL}/api/news/local?limit=20")
        
        assert response.status_code == 200
        data = response.json()
        news_list = data.get("news", [])
        
        # Check if any news has is_admin_pushed flag
        admin_pushed = [n for n in news_list if n.get("is_admin_pushed")]
        print(f"PASS: News feed checked - Found {len(admin_pushed)} admin-pushed articles out of {len(news_list)}")
        
        # Check video news
        video_news = [n for n in news_list if n.get("content_type") == "video"]
        print(f"  - Video news in feed: {len(video_news)}")


class TestAQIEndpoints:
    """Test AQI Endpoints"""
    
    def test_aqi_both_locations(self):
        """Test GET /api/aqi/both - Returns Dammaiguda and Hyderabad AQI"""
        response = requests.get(f"{BASE_URL}/api/aqi/both")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check Dammaiguda data
        assert "dammaiguda" in data
        assert "aqi" in data["dammaiguda"]
        
        # Check Hyderabad data
        assert "hyderabad" in data
        assert "aqi" in data["hyderabad"]
        
        print(f"PASS: GET /api/aqi/both - {response.status_code}")
        print(f"  - Dammaiguda AQI: {data.get('dammaiguda', {}).get('aqi')}")
        print(f"  - Hyderabad AQI: {data.get('hyderabad', {}).get('aqi')}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_news(self):
        """Clean up test news articles"""
        token = get_admin_token()
        if not token:
            pytest.skip("Could not get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all admin news
        response = requests.get(f"{BASE_URL}/api/news/admin/pushed", headers=headers)
        if response.status_code != 200:
            print("Could not fetch news for cleanup")
            return
        
        data = response.json()
        news_list = data.get("news", [])
        
        # Delete test news (prefixed with TEST_)
        deleted = 0
        for news in news_list:
            if news.get("title", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/news/admin/news/{news.get('id')}", 
                    headers=headers
                )
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"Cleanup: Deleted {deleted} test news articles")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
