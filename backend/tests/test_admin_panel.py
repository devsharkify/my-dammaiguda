"""
Admin Panel Backend Tests - Testing Admin Dashboard APIs
Tests for: Overview stats, Users, Issues, Shop, News, Vouchers, Templates
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://multi-tenant-12.preview.emergentagent.com').rstrip('/')

class TestAdminPanelAPIs:
    """Test Admin Panel Backend APIs"""
    
    admin_token = None
    test_product_id = None
    test_news_id = None
    test_voucher_id = None
    test_template_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin authentication before each test"""
        if not TestAdminPanelAPIs.admin_token:
            # Send OTP
            send_resp = requests.post(f"{BASE_URL}/api/auth/send-otp", 
                json={"phone": "+919999999999"})
            assert send_resp.status_code == 200, f"Failed to send OTP: {send_resp.text}"
            
            # Verify OTP (static 123456)
            verify_resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", 
                json={"phone": "+919999999999", "otp": "123456"})
            assert verify_resp.status_code == 200, f"Failed to verify OTP: {verify_resp.text}"
            TestAdminPanelAPIs.admin_token = verify_resp.json().get("token")
        
        self.headers = {"Authorization": f"Bearer {TestAdminPanelAPIs.admin_token}"}
    
    # ============== OVERVIEW TAB TESTS ==============
    
    def test_admin_stats_returns_user_count(self):
        """Test /api/admin/stats returns user count"""
        resp = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "users" in data
        assert "total" in data["users"]
        assert isinstance(data["users"]["total"], int)
        assert data["users"]["total"] >= 0
        print(f"✓ Admin stats - Total users: {data['users']['total']}")
    
    def test_admin_stats_returns_issues_count(self):
        """Test /api/admin/stats returns issues count"""
        resp = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "issues" in data
        assert "total" in data["issues"]
        assert "pending" in data["issues"]
        assert "closed" in data["issues"]
        assert "by_category" in data["issues"]
        print(f"✓ Admin stats - Issues: total={data['issues']['total']}, pending={data['issues']['pending']}")
    
    def test_admin_stats_returns_fitness_participants(self):
        """Test /api/admin/stats returns fitness participants"""
        resp = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "fitness" in data
        assert "participants" in data["fitness"]
        assert isinstance(data["fitness"]["participants"], int)
        print(f"✓ Admin stats - Fitness participants: {data['fitness']['participants']}")
    
    def test_issues_heatmap_endpoint(self):
        """Test /api/admin/issues-heatmap returns array"""
        resp = requests.get(f"{BASE_URL}/api/admin/issues-heatmap", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert isinstance(data, list)
        print(f"✓ Issues heatmap - {len(data)} areas with issues")
    
    def test_admin_users_list(self):
        """Test /api/admin/users returns user list"""
        resp = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "phone" in user
            print(f"✓ Admin users - {len(data)} users found")
    
    # ============== ISSUES TAB TESTS ==============
    
    def test_get_issues_list(self):
        """Test GET /api/issues returns issues"""
        resp = requests.get(f"{BASE_URL}/api/issues?limit=100", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "issues" in data
        assert isinstance(data["issues"], list)
        print(f"✓ Issues list - {len(data['issues'])} issues found")
        
        if len(data["issues"]) > 0:
            issue = data["issues"][0]
            assert "id" in issue
            assert "category" in issue
            assert "status" in issue
            assert "description" in issue
    
    # ============== SHOP TAB TESTS ==============
    
    def test_shop_admin_products_endpoint(self):
        """Test /api/shop/admin/products returns products with point_type and privilege_points"""
        resp = requests.get(f"{BASE_URL}/api/shop/admin/products?include_inactive=true", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "products" in data
        assert "total" in data
        print(f"✓ Shop admin products - {data['total']} products found")
        
        if len(data["products"]) > 0:
            product = data["products"][0]
            assert "id" in product
            assert "name" in product
            assert "points_required" in product
            # Check for new fields
            print(f"  Product: {product['name']}, points_required={product.get('points_required')}, point_type={product.get('point_type')}")
    
    def test_shop_create_product(self):
        """Test POST /api/shop/admin/products creates a product"""
        product_data = {
            "name": f"TEST_Admin_Product_{int(time.time())}",
            "description": "Test product from admin panel testing",
            "category": "Fitness",
            "image_url": "https://via.placeholder.com/400",
            "mrp": 999.0,
            "points_required": 200,
            "privilege_points_required": 50,
            "point_type": "both",
            "delivery_fee": 50.0,
            "stock_quantity": 10,
            "is_active": True
        }
        
        resp = requests.post(f"{BASE_URL}/api/shop/admin/products", json=product_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "product" in data
        assert data["product"]["name"] == product_data["name"]
        assert data["product"]["point_type"] == "both"
        assert data["product"]["privilege_points_required"] == 50
        
        TestAdminPanelAPIs.test_product_id = data["product"]["id"]
        print(f"✓ Created product: {data['product']['name']}")
    
    def test_shop_update_product(self):
        """Test PUT /api/shop/admin/products/{id} updates a product"""
        if not TestAdminPanelAPIs.test_product_id:
            pytest.skip("No test product created")
        
        update_data = {"name": f"TEST_Updated_Product_{int(time.time())}", "stock_quantity": 5}
        resp = requests.put(f"{BASE_URL}/api/shop/admin/products/{TestAdminPanelAPIs.test_product_id}", 
            json=update_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["product"]["stock_quantity"] == 5
        print(f"✓ Updated product: {data['product']['name']}")
    
    def test_shop_delete_product(self):
        """Test DELETE /api/shop/admin/products/{id} deletes a product"""
        if not TestAdminPanelAPIs.test_product_id:
            pytest.skip("No test product created")
        
        resp = requests.delete(f"{BASE_URL}/api/shop/admin/products/{TestAdminPanelAPIs.test_product_id}", 
            headers=self.headers)
        assert resp.status_code == 200
        print(f"✓ Deleted product: {TestAdminPanelAPIs.test_product_id}")
    
    def test_shop_admin_orders(self):
        """Test /api/shop/admin/orders returns orders list"""
        resp = requests.get(f"{BASE_URL}/api/shop/admin/orders", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "orders" in data
        assert "stats" in data
        assert "pending" in data["stats"]
        print(f"✓ Shop admin orders - pending={data['stats']['pending']}, total={data.get('total', 0)}")
    
    def test_shop_points_adjustment(self):
        """Test /api/shop/admin/points/adjust adjusts user points"""
        # Get a user first
        users_resp = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = users_resp.json()
        if not users:
            pytest.skip("No users available")
        
        user_id = users[0]["id"]
        
        adjust_data = {
            "user_id": user_id,
            "points": 10,
            "reason": "TEST_Admin panel testing",
            "point_type": "normal"
        }
        
        resp = requests.post(f"{BASE_URL}/api/shop/admin/points/adjust", json=adjust_data, headers=self.headers)
        assert resp.status_code == 200
        print(f"✓ Points adjusted for user {user_id}")
    
    # ============== NEWS TAB TESTS ==============
    
    def test_news_admin_all_endpoint(self):
        """Test /api/news/admin/all returns admin-pushed news"""
        resp = requests.get(f"{BASE_URL}/api/news/admin/all", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "news" in data
        assert "total" in data
        print(f"✓ News admin all - {data['total']} news articles")
    
    def test_news_create_article(self):
        """Test POST /api/news/admin/create creates a news article"""
        news_data = {
            "title": f"TEST_Admin_News_{int(time.time())}",
            "title_te": "టెస్ట్ న్యూస్",
            "summary": "Test news content for admin panel testing",
            "summary_te": "టెస్ట్ న్యూస్ కంటెంట్",
            "category": "local",
            "image_url": "https://via.placeholder.com/400",
            "is_pinned": False,
            "priority": 2
        }
        
        resp = requests.post(f"{BASE_URL}/api/news/admin/create", json=news_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "news" in data
        assert data["news"]["title"] == news_data["title"]
        assert data["news"]["is_admin_pushed"] == True
        
        TestAdminPanelAPIs.test_news_id = data["news"]["id"]
        print(f"✓ Created news: {data['news']['title']}")
    
    def test_news_update_article(self):
        """Test PUT /api/news/admin/news/{id} updates a news article"""
        if not TestAdminPanelAPIs.test_news_id:
            pytest.skip("No test news created")
        
        update_data = {"title": f"TEST_Updated_News_{int(time.time())}", "is_pinned": True}
        resp = requests.put(f"{BASE_URL}/api/news/admin/news/{TestAdminPanelAPIs.test_news_id}", 
            json=update_data, headers=self.headers)
        assert resp.status_code == 200
        print(f"✓ Updated news article")
    
    def test_news_delete_article(self):
        """Test DELETE /api/news/admin/news/{id} deletes a news article"""
        if not TestAdminPanelAPIs.test_news_id:
            pytest.skip("No test news created")
        
        resp = requests.delete(f"{BASE_URL}/api/news/admin/news/{TestAdminPanelAPIs.test_news_id}", 
            headers=self.headers)
        assert resp.status_code == 200
        print(f"✓ Deleted news: {TestAdminPanelAPIs.test_news_id}")
    
    # ============== VOUCHERS TAB TESTS ==============
    
    def test_vouchers_admin_all_endpoint(self):
        """Test /api/vouchers/admin/all returns all vouchers"""
        resp = requests.get(f"{BASE_URL}/api/vouchers/admin/all", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "vouchers" in data
        assert "total" in data
        print(f"✓ Vouchers admin all - {data['total']} vouchers")
        
        if len(data["vouchers"]) > 0:
            voucher = data["vouchers"][0]
            assert "id" in voucher
            assert "title" in voucher
            assert "code" in voucher
            assert "discount_type" in voucher
    
    def test_voucher_create(self):
        """Test POST /api/vouchers/admin/create creates a voucher"""
        voucher_data = {
            "title": f"TEST_Voucher_{int(time.time())}",
            "title_te": "టెస్ట్ వౌచర్",
            "description": "Test voucher from admin panel testing",
            "description_te": "టెస్ట్ వౌచర్ వివరణ",
            "discount_type": "percentage",
            "discount_value": 25,
            "code_type": "random",
            "partner_name": "Test Partner",
            "category": "food",
            "terms_conditions": "Test terms",
            "min_order_value": 100,
            "max_uses_per_user": 1
        }
        
        resp = requests.post(f"{BASE_URL}/api/vouchers/admin/create", json=voucher_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "voucher" in data
        assert data["voucher"]["title"] == voucher_data["title"]
        assert "code" in data["voucher"]  # Should have auto-generated code
        
        TestAdminPanelAPIs.test_voucher_id = data["voucher"]["id"]
        print(f"✓ Created voucher: {data['voucher']['title']} with code {data['voucher']['code']}")
    
    def test_voucher_update(self):
        """Test PUT /api/vouchers/admin/{id} updates a voucher"""
        if not TestAdminPanelAPIs.test_voucher_id:
            pytest.skip("No test voucher created")
        
        update_data = {"discount_value": 30, "is_active": True}
        resp = requests.put(f"{BASE_URL}/api/vouchers/admin/{TestAdminPanelAPIs.test_voucher_id}", 
            json=update_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["voucher"]["discount_value"] == 30
        print(f"✓ Updated voucher discount to 30%")
    
    def test_voucher_delete(self):
        """Test DELETE /api/vouchers/admin/{id} deletes a voucher"""
        if not TestAdminPanelAPIs.test_voucher_id:
            pytest.skip("No test voucher created")
        
        resp = requests.delete(f"{BASE_URL}/api/vouchers/admin/{TestAdminPanelAPIs.test_voucher_id}", 
            headers=self.headers)
        assert resp.status_code == 200
        print(f"✓ Deleted voucher: {TestAdminPanelAPIs.test_voucher_id}")
    
    # ============== TEMPLATES TAB TESTS ==============
    
    def test_templates_admin_all_endpoint(self):
        """Test /api/templates/admin/all returns all templates"""
        resp = requests.get(f"{BASE_URL}/api/templates/admin/all", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "templates" in data
        assert "total" in data
        print(f"✓ Templates admin all - {data['total']} templates")
    
    def test_template_create(self):
        """Test POST /api/templates/admin/create creates a template"""
        template_data = {
            "title": f"TEST_Template_{int(time.time())}",
            "title_te": "టెస్ట్ టెంప్లేట్",
            "category": "festival",
            "background_url": "https://via.placeholder.com/400x600",
            "photo_position": {"x": 150, "y": 100, "width": 120, "height": 120},
            "name_position": {"x": 210, "y": 280, "fontSize": 24, "color": "#ffffff"},
            "is_active": True
        }
        
        resp = requests.post(f"{BASE_URL}/api/templates/admin/create", json=template_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert "template" in data
        assert data["template"]["title"] == template_data["title"]
        
        TestAdminPanelAPIs.test_template_id = data["template"]["id"]
        print(f"✓ Created template: {data['template']['title']}")
    
    def test_template_delete(self):
        """Test DELETE /api/templates/admin/{id} deletes a template"""
        if not TestAdminPanelAPIs.test_template_id:
            pytest.skip("No test template created")
        
        resp = requests.delete(f"{BASE_URL}/api/templates/admin/{TestAdminPanelAPIs.test_template_id}", 
            headers=self.headers)
        assert resp.status_code == 200
        print(f"✓ Deleted template: {TestAdminPanelAPIs.test_template_id}")


class TestAdminAccessControl:
    """Test admin access control - non-admin users should be blocked"""
    
    def test_non_admin_cannot_access_shop_admin(self):
        """Test that non-admin user cannot access shop admin endpoints"""
        # Create regular user session
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "+919876543210"})
        verify_resp = requests.post(f"{BASE_URL}/api/auth/verify-otp", 
            json={"phone": "+919876543210", "otp": "123456"})
        
        if verify_resp.status_code != 200:
            pytest.skip("Could not create regular user session")
        
        user_token = verify_resp.json().get("token")
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to access admin endpoints
        resp = requests.get(f"{BASE_URL}/api/shop/admin/products", headers=headers)
        # Should be 403 Forbidden
        assert resp.status_code == 403, f"Non-admin should get 403, got {resp.status_code}"
        print(f"✓ Non-admin correctly blocked from shop admin (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
