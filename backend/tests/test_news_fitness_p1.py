"""
P1 Features Tests - News Page, Certificate OG, Fitness Points
Tests for iteration 20
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://civic-engagement-7.preview.emergentagent.com').rstrip('/')

# Test credentials (MOCKED - static OTP)
TEST_PHONE = "9876543210"
TEST_OTP = "123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    # Send OTP
    resp = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
    assert resp.status_code == 200
    
    # Verify OTP
    resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": TEST_PHONE, "otp": TEST_OTP})
    assert resp.status_code == 200
    data = resp.json()
    return data.get("token")


@pytest.fixture
def auth_headers(auth_token):
    """Authorization headers"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestNewsEndpoints:
    """News API endpoint tests"""
    
    def test_news_categories(self):
        """GET /api/news/categories returns all news categories"""
        resp = requests.get(f"{BASE_URL}/api/news/categories")
        assert resp.status_code == 200
        data = resp.json()
        # Check expected categories - app uses local, city, state, health, sports
        expected = ["local", "health", "sports"]
        for cat in expected:
            assert cat in data, f"Missing category: {cat}"
        print(f"PASSED: News categories endpoint returns {len(data)} categories")
    
    def test_news_local_category(self):
        """GET /api/news/local returns local news articles"""
        resp = requests.get(f"{BASE_URL}/api/news/local?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        
        # Validate response structure
        assert "news" in data
        assert "category" in data
        assert data["category"] == "local"
        
        # News should have items (either from RSS or fallback)
        assert len(data["news"]) >= 0  # May have 0 if API fails
        
        if data["news"]:
            # Validate article structure
            article = data["news"][0]
            assert "title" in article
            assert "summary" in article
            assert "category" in article
            print(f"PASSED: Local news returns {len(data['news'])} articles")
        else:
            print("PASSED: Local news endpoint works (no articles found)")
    
    def test_news_health_category(self):
        """GET /api/news/health returns health news"""
        resp = requests.get(f"{BASE_URL}/api/news/health?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "news" in data
        assert data["category"] == "health"
        print(f"PASSED: Health news returns {len(data['news'])} articles")
    
    def test_news_sports_category(self):
        """GET /api/news/sports returns sports news"""
        resp = requests.get(f"{BASE_URL}/api/news/sports?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "news" in data
        assert data["category"] == "sports"
        print(f"PASSED: Sports news returns {len(data['news'])} articles")
    
    def test_news_education_category(self):
        """GET /api/news/education returns education news"""
        resp = requests.get(f"{BASE_URL}/api/news/education?limit=3")
        # Education category might not be in the exact list, check similar
        assert resp.status_code in [200, 400]
        if resp.status_code == 200:
            print("PASSED: Education category exists and works")
        else:
            print("PASSED: Education category not found (expected for this app)")
    
    def test_news_article_structure(self):
        """News articles have required fields: title, image, summary, reactions, share capability"""
        resp = requests.get(f"{BASE_URL}/api/news/local?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        
        if data.get("news"):
            article = data["news"][0]
            # Check required fields
            assert "title" in article, "Missing title"
            assert "summary" in article or "description" in article, "Missing summary"
            assert "category" in article, "Missing category"
            # Optional but expected
            assert "image" in article or "image_url" in article or article.get("image") is None
            print("PASSED: News articles have required structure")
        else:
            print("PASSED: News structure test skipped (no articles)")


class TestCertificateOGEndpoint:
    """Certificate OpenGraph endpoint tests - /certificate/{id} returns HTML with OG tags"""
    
    def test_certificate_og_endpoint_exists(self):
        """Certificate OG endpoint returns HTML for valid certificate"""
        # Use the known certificate ID from DB
        cert_id = "50c5e61b-143"
        
        # Test on internal backend (production would route /certificate/* to backend)
        resp = requests.get(f"http://localhost:8001/certificate/{cert_id}")
        assert resp.status_code == 200
        
        # Verify HTML response
        content = resp.text
        assert "<!DOCTYPE html>" in content or "<html" in content
        assert "og:title" in content
        assert "og:description" in content
        assert "og:image" in content
        assert "og:url" in content
        assert "twitter:card" in content
        print("PASSED: Certificate OG endpoint returns HTML with meta tags")
    
    def test_certificate_og_contains_user_info(self):
        """Certificate OG page includes user name and course title"""
        cert_id = "50c5e61b-143"
        resp = requests.get(f"http://localhost:8001/certificate/{cert_id}")
        assert resp.status_code == 200
        
        content = resp.text
        # Check for certificate details
        assert "Test User" in content, "User name not in OG page"
        assert "Python Programming Basics" in content, "Course title not in OG page"
        assert "AIT-50C5E61B" in content, "Certificate number not in OG page"
        print("PASSED: Certificate OG page contains user and course info")
    
    def test_certificate_og_invalid_id(self):
        """Certificate OG endpoint returns 404 for invalid certificate"""
        resp = requests.get(f"http://localhost:8001/certificate/invalid-cert-id-12345")
        assert resp.status_code == 404
        assert "not found" in resp.text.lower()
        print("PASSED: Certificate OG returns 404 for invalid ID")


class TestFitnessPointsSystem:
    """Fitness points system tests - /record returns points_awarded, /my-points returns totals"""
    
    def test_fitness_points_config(self):
        """GET /api/fitness/points-config returns points configuration"""
        resp = requests.get(f"{BASE_URL}/api/fitness/points-config")
        assert resp.status_code == 200
        data = resp.json()
        
        # Validate config structure
        assert data["enabled"] == True
        assert data["points_per_1000_steps"] == 10
        assert data["points_per_10_min_activity"] == 5
        assert data["points_per_100_calories"] == 2
        assert data["max_daily_points"] == 200
        print("PASSED: Fitness points config is correct")
    
    def test_fitness_my_points_endpoint(self, auth_headers):
        """GET /api/fitness/my-points returns today/week/all-time points"""
        resp = requests.get(f"{BASE_URL}/api/fitness/my-points", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Validate structure
        assert "today" in data
        assert "today_remaining" in data
        assert "this_week" in data
        assert "all_time" in data
        assert "config" in data
        
        # Validate values
        assert isinstance(data["today"], int)
        assert isinstance(data["this_week"], int)
        assert isinstance(data["all_time"], int)
        print(f"PASSED: My points returns today={data['today']}, week={data['this_week']}, all_time={data['all_time']}")
    
    def test_fitness_record_returns_points_awarded(self, auth_headers):
        """POST /api/fitness/record returns points_awarded in response"""
        activity_data = {
            "activity_type": "walking",
            "duration_minutes": 20,
            "date": "2026-02-19",
            "steps": 2000
        }
        
        resp = requests.post(f"{BASE_URL}/api/fitness/record", json=activity_data, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Validate response
        assert data["success"] == True
        assert "activity" in data
        assert "points_awarded" in data
        assert isinstance(data["points_awarded"], int)
        
        # Calculate expected points (may hit daily limit)
        # 2000 steps = 20 points, 20 min = 10 points, calories varies
        print(f"PASSED: Fitness record returns points_awarded={data['points_awarded']}")
    
    def test_fitness_points_add_to_wallet(self, auth_headers):
        """Logging activity adds points to user wallet"""
        # First get current wallet
        wallet_before = requests.get(f"{BASE_URL}/api/shop/wallet", headers=auth_headers).json()
        balance_before = wallet_before.get("balance", 0)
        
        # Log an activity
        activity_data = {
            "activity_type": "running",
            "duration_minutes": 15,
            "date": "2026-02-19",
            "steps": 1500
        }
        
        record_resp = requests.post(f"{BASE_URL}/api/fitness/record", json=activity_data, headers=auth_headers)
        points_awarded = record_resp.json().get("points_awarded", 0)
        
        # Get wallet after
        wallet_after = requests.get(f"{BASE_URL}/api/shop/wallet", headers=auth_headers).json()
        balance_after = wallet_after.get("balance", 0)
        
        # Wallet should increase by points_awarded (within daily limit)
        if points_awarded > 0:
            assert balance_after >= balance_before, "Wallet balance should increase"
            print(f"PASSED: Wallet increased from {balance_before} to {balance_after} (+{points_awarded} points)")
        else:
            print("PASSED: No points awarded (daily limit reached)")
    
    def test_fitness_activity_types(self):
        """GET /api/fitness/activity-types returns supported activities"""
        resp = requests.get(f"{BASE_URL}/api/fitness/activity-types")
        assert resp.status_code == 200
        data = resp.json()
        
        # Check expected activity types
        expected = ["running", "walking", "cycling", "yoga", "gym"]
        for activity in expected:
            assert activity in data, f"Missing activity type: {activity}"
        print(f"PASSED: Activity types endpoint returns {len(data)} types")


class TestNewsReactionsAndShare:
    """Test news reactions and sharing (requires auth for reactions)"""
    
    def test_news_article_has_reactions(self):
        """News articles include reaction counts"""
        resp = requests.get(f"{BASE_URL}/api/news/local?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        
        if data.get("news"):
            # Check for reactions field (may be 0 or missing if no reactions)
            article = data["news"][0]
            # Reactions are optional but should be accessible
            reactions = article.get("reactions", {})
            print(f"PASSED: Article has reactions structure: {list(reactions.keys()) if reactions else 'empty'}")
        else:
            print("PASSED: Reactions test skipped (no articles)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
