"""
Test Suite for Gift Shop Two-Tier Points System
Tests: Normal + Privilege points, point_type selection, delivery_fee, bulk privilege assignment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://civic-nexus-1.preview.emergentagent.com"

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"
ADMIN_PHONE = "+919999999999"


class TestAuth:
    """Authentication helpers"""
    
    @staticmethod
    def get_user_token(phone=TEST_PHONE):
        """Get auth token for regular user"""
        # Request OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": phone})
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": phone,
            "otp": TEST_OTP
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    @staticmethod
    def get_admin_token():
        """Get auth token for admin user"""
        # Request OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": ADMIN_PHONE})
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": ADMIN_PHONE,
            "otp": TEST_OTP
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None


class TestWalletDualBalance:
    """Tests for wallet showing both Normal and Privilege balance"""
    
    def test_wallet_returns_both_balances(self):
        """GET /api/shop/wallet returns both normal and privilege balance"""
        token = TestAuth.get_user_token()
        assert token, "Failed to get user token"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/shop/wallet", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check both balance fields exist
        assert "balance" in data, "Missing 'balance' field (normal points)"
        assert "privilege_balance" in data, "Missing 'privilege_balance' field"
        assert "total_earned" in data, "Missing 'total_earned' field"
        assert "total_privilege_earned" in data, "Missing 'total_privilege_earned' field"
        
        # Validate types
        assert isinstance(data["balance"], (int, float)), "balance should be numeric"
        assert isinstance(data["privilege_balance"], (int, float)), "privilege_balance should be numeric"
        
        print(f"✓ Wallet shows Normal: {data['balance']}, Privilege: {data['privilege_balance']}")


class TestProductPointType:
    """Tests for product point_type (normal/privilege/both) and delivery_fee"""
    
    def test_create_product_with_point_type_normal(self):
        """Admin can create product with point_type='normal'"""
        token = TestAuth.get_admin_token()
        assert token, "Failed to get admin token"
        
        headers = {"Authorization": f"Bearer {token}"}
        product_data = {
            "name": "TEST_Normal_Points_Product",
            "description": "Test product requiring only normal points",
            "category": "Fitness",
            "image_url": "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=300",
            "mrp": 500,
            "points_required": 100,
            "privilege_points_required": 0,
            "point_type": "normal",
            "delivery_fee": 0,
            "stock_quantity": 10,
            "is_active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/shop/admin/products", json=product_data, headers=headers)
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        product = data.get("product", {})
        assert product.get("point_type") == "normal", f"point_type should be 'normal', got {product.get('point_type')}"
        assert product.get("points_required") == 100
        print(f"✓ Created product with point_type='normal': {product.get('name')}")
        return product
    
    def test_create_product_with_point_type_privilege(self):
        """Admin can create product with point_type='privilege'"""
        token = TestAuth.get_admin_token()
        assert token, "Failed to get admin token"
        
        headers = {"Authorization": f"Bearer {token}"}
        product_data = {
            "name": "TEST_Privilege_Only_Product",
            "description": "Test product requiring only privilege points",
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300",
            "mrp": 1500,
            "points_required": 0,
            "privilege_points_required": 50,
            "point_type": "privilege",
            "delivery_fee": 50,
            "stock_quantity": 5,
            "is_active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/shop/admin/products", json=product_data, headers=headers)
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}"
        
        data = response.json()
        product = data.get("product", {})
        assert product.get("point_type") == "privilege", f"point_type should be 'privilege'"
        assert product.get("privilege_points_required") == 50
        assert product.get("delivery_fee") == 50
        print(f"✓ Created product with point_type='privilege': {product.get('name')}")
        return product
    
    def test_create_product_with_point_type_both(self):
        """Admin can create product with point_type='both'"""
        token = TestAuth.get_admin_token()
        assert token, "Failed to get admin token"
        
        headers = {"Authorization": f"Bearer {token}"}
        product_data = {
            "name": "TEST_Both_Points_Product",
            "description": "Test product requiring both normal and privilege points",
            "category": "Fitness",
            "image_url": "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=300",
            "mrp": 2000,
            "points_required": 200,
            "privilege_points_required": 25,
            "point_type": "both",
            "delivery_fee": 75,
            "stock_quantity": 3,
            "is_active": True
        }
        
        response = requests.post(f"{BASE_URL}/api/shop/admin/products", json=product_data, headers=headers)
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}"
        
        data = response.json()
        product = data.get("product", {})
        assert product.get("point_type") == "both"
        assert product.get("points_required") == 200
        assert product.get("privilege_points_required") == 25
        assert product.get("delivery_fee") == 75
        print(f"✓ Created product with point_type='both': {product.get('name')}")
        return product
    
    def test_products_list_shows_point_type_fields(self):
        """GET /api/shop/products returns point_type, privilege_points_required, delivery_fee"""
        token = TestAuth.get_user_token()
        assert token, "Failed to get user token"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/shop/products", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        
        # Check that products have the new fields
        for product in products:
            # These fields should be present (with defaults if not set)
            assert "point_type" in product, f"Product {product.get('name')} missing point_type"
            assert "privilege_points_required" in product, f"Product {product.get('name')} missing privilege_points_required"
            assert "delivery_fee" in product, f"Product {product.get('name')} missing delivery_fee"
        
        print(f"✓ Products list contains {len(products)} products with point_type fields")
        
        # Also verify user_privilege_balance is returned
        assert "user_privilege_balance" in data, "Missing user_privilege_balance in response"
        print(f"✓ Response includes user_privilege_balance: {data.get('user_privilege_balance')}")


class TestBulkPrivilegePoints:
    """Tests for admin bulk privilege points assignment"""
    
    def test_bulk_privilege_endpoint_exists(self):
        """POST /api/shop/admin/points/bulk-privilege endpoint exists"""
        token = TestAuth.get_admin_token()
        assert token, "Failed to get admin token"
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test with minimal valid request
        response = requests.post(f"{BASE_URL}/api/shop/admin/points/bulk-privilege", json={
            "user_ids": ["ALL"],
            "points": 10,
            "reason": "Test bulk assignment"
        }, headers=headers)
        
        # Should succeed or fail validation, not 404
        assert response.status_code != 404, "Bulk privilege endpoint not found"
        assert response.status_code in [200, 201, 400, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "success_count" in data, "Response should contain success_count"
            print(f"✓ Bulk privilege assigned to {data.get('success_count')} users")
    
    def test_bulk_privilege_rejects_zero_points(self):
        """Bulk privilege endpoint rejects 0 or negative points"""
        token = TestAuth.get_admin_token()
        assert token, "Failed to get admin token"
        
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(f"{BASE_URL}/api/shop/admin/points/bulk-privilege", json={
            "user_ids": ["ALL"],
            "points": 0,
            "reason": "Should fail"
        }, headers=headers)
        
        assert response.status_code == 400, f"Expected 400 for 0 points, got {response.status_code}"
        print("✓ Bulk privilege correctly rejects 0 points")
    
    def test_bulk_privilege_requires_admin(self):
        """Bulk privilege endpoint requires admin role"""
        token = TestAuth.get_user_token()  # Regular user, not admin
        assert token, "Failed to get user token"
        
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.post(f"{BASE_URL}/api/shop/admin/points/bulk-privilege", json={
            "user_ids": ["ALL"],
            "points": 10,
            "reason": "Should fail - not admin"
        }, headers=headers)
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("✓ Bulk privilege correctly requires admin access")


class TestAdminPointsAdjust:
    """Tests for admin individual points adjustment with point_type"""
    
    def test_adjust_normal_points(self):
        """Admin can adjust normal points"""
        admin_token = TestAuth.get_admin_token()
        user_token = TestAuth.get_user_token()
        assert admin_token, "Failed to get admin token"
        assert user_token, "Failed to get user token"
        
        # Get user ID
        user_headers = {"Authorization": f"Bearer {user_token}"}
        profile_response = requests.get(f"{BASE_URL}/api/auth/profile", headers=user_headers)
        user_id = profile_response.json().get("id")
        
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(f"{BASE_URL}/api/shop/admin/points/adjust", json={
            "user_id": user_id,
            "points": 50,
            "reason": "Test normal points adjustment",
            "point_type": "normal"
        }, headers=admin_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Admin can adjust normal points")
    
    def test_adjust_privilege_points(self):
        """Admin can adjust privilege points"""
        admin_token = TestAuth.get_admin_token()
        user_token = TestAuth.get_user_token()
        assert admin_token, "Failed to get admin token"
        assert user_token, "Failed to get user token"
        
        # Get user ID
        user_headers = {"Authorization": f"Bearer {user_token}"}
        profile_response = requests.get(f"{BASE_URL}/api/auth/profile", headers=user_headers)
        user_id = profile_response.json().get("id")
        
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(f"{BASE_URL}/api/shop/admin/points/adjust", json={
            "user_id": user_id,
            "points": 25,
            "reason": "Test privilege points adjustment",
            "point_type": "privilege"
        }, headers=admin_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Admin can adjust privilege points")


class TestDumpyardInfo:
    """Tests for enhanced Dumpyard section"""
    
    def test_dumpyard_info_returns_pollution_zones(self):
        """GET /api/dumpyard/info returns pollution_zones array"""
        response = requests.get(f"{BASE_URL}/api/dumpyard/info")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "pollution_zones" in data, "Missing pollution_zones"
        zones = data["pollution_zones"]
        assert isinstance(zones, list), "pollution_zones should be a list"
        assert len(zones) >= 1, "Should have at least one pollution zone"
        
        # Check zone structure
        for zone in zones:
            assert "zone" in zone, "Zone missing 'zone' field (red/orange/green)"
            assert "radius_km" in zone, "Zone missing 'radius_km' field"
            assert "risk" in zone, "Zone missing 'risk' field"
        
        print(f"✓ Dumpyard info contains {len(zones)} pollution zones")
    
    def test_dumpyard_info_returns_health_risks(self):
        """GET /api/dumpyard/info returns health_risks object"""
        response = requests.get(f"{BASE_URL}/api/dumpyard/info")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "health_risks" in data, "Missing health_risks"
        risks = data["health_risks"]
        assert isinstance(risks, dict), "health_risks should be an object"
        assert len(risks) >= 1, "Should have at least one health risk"
        
        # Check risk structure
        for key, risk in risks.items():
            assert "title" in risk, f"Risk {key} missing 'title'"
            assert "description" in risk, f"Risk {key} missing 'description'"
        
        print(f"✓ Dumpyard info contains {len(risks)} health risks")
    
    def test_dumpyard_info_returns_affected_groups(self):
        """GET /api/dumpyard/info returns affected_groups array"""
        response = requests.get(f"{BASE_URL}/api/dumpyard/info")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "affected_groups" in data, "Missing affected_groups"
        groups = data["affected_groups"]
        assert isinstance(groups, list), "affected_groups should be a list"
        assert len(groups) >= 1, "Should have at least one affected group"
        
        # Check group structure
        for group in groups:
            assert "group" in group, "Group missing 'group' field"
            assert "risk_level" in group, "Group missing 'risk_level' field"
            assert "advice" in group, "Group missing 'advice' field"
        
        print(f"✓ Dumpyard info contains {len(groups)} affected groups")
    
    def test_dumpyard_updates_endpoint(self):
        """GET /api/dumpyard/updates returns updates array"""
        response = requests.get(f"{BASE_URL}/api/dumpyard/updates")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Updates should be a list"
        
        if len(data) > 0:
            update = data[0]
            assert "title" in update, "Update missing 'title'"
            assert "content" in update, "Update missing 'content'"
            assert "date" in update, "Update missing 'date'"
        
        print(f"✓ Dumpyard updates endpoint returns {len(data)} updates")


class TestIssuesPage:
    """Tests for Issues page API"""
    
    def test_issues_endpoint_works(self):
        """GET /api/issues returns issues list without crashing"""
        response = requests.get(f"{BASE_URL}/api/issues?limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Should return an object with issues array
        assert "issues" in data, "Response should contain 'issues' key"
        assert isinstance(data["issues"], list), "issues should be a list"
        
        print(f"✓ Issues endpoint returns {len(data['issues'])} issues")
    
    def test_issues_with_category_filter(self):
        """Issues endpoint works with category filter"""
        response = requests.get(f"{BASE_URL}/api/issues?category=garbage&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Issues endpoint works with category filter")
    
    def test_issues_with_status_filter(self):
        """Issues endpoint works with status filter"""
        response = requests.get(f"{BASE_URL}/api/issues?status=reported&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Issues endpoint works with status filter")


class TestCleanup:
    """Cleanup test products"""
    
    def test_cleanup_test_products(self):
        """Delete TEST_ prefixed products"""
        token = TestAuth.get_admin_token()
        if not token:
            pytest.skip("No admin token for cleanup")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all products
        response = requests.get(f"{BASE_URL}/api/shop/admin/products?include_inactive=true", headers=headers)
        if response.status_code != 200:
            pytest.skip("Could not fetch products for cleanup")
        
        products = response.json().get("products", [])
        deleted = 0
        
        for product in products:
            if product.get("name", "").startswith("TEST_"):
                del_response = requests.delete(f"{BASE_URL}/api/shop/admin/products/{product['id']}", headers=headers)
                if del_response.status_code in [200, 204]:
                    deleted += 1
        
        print(f"✓ Cleaned up {deleted} test products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
