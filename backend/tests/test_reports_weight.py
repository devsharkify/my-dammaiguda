"""
Test suite for Reports and Weight Stats (BMI) Features
Tests: Reports endpoints for Admin/Manager + Enhanced Weight Stats with BMI
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PHONE = "+919999999999"
MANAGER_PHONE = "+919876543211"
TEST_PHONE = "+919876543210"
OTP = "123456"


class TestAuthHelpers:
    """Helper methods for authentication"""
    
    @staticmethod
    def get_admin_token():
        """Get admin token"""
        # Send OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": ADMIN_PHONE})
        # Verify OTP
        res = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": ADMIN_PHONE,
            "otp": OTP
        })
        if res.status_code == 200:
            return res.json().get("access_token")
        return None
    
    @staticmethod
    def get_manager_token():
        """Get manager token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": MANAGER_PHONE})
        res = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": MANAGER_PHONE,
            "otp": OTP
        })
        if res.status_code == 200:
            return res.json().get("access_token")
        return None
    
    @staticmethod
    def get_user_token():
        """Get regular user token"""
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        res = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TEST_PHONE,
            "otp": OTP
        })
        if res.status_code == 200:
            return res.json().get("access_token")
        return None


# ============== WEIGHT STATS TESTS ==============

class TestWeightStats:
    """Tests for enhanced weight stats with BMI endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestAuthHelpers.get_user_token()
        self.headers = {"Authorization": f"Bearer {self.token}"}
        if not self.token:
            pytest.skip("Failed to get user token")
    
    def test_weight_stats_endpoint_exists(self):
        """GET /api/fitness/weight/stats - Endpoint should exist and return 200"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print("✓ Weight stats endpoint exists and returns 200")
    
    def test_weight_stats_returns_bmi(self):
        """GET /api/fitness/weight/stats - Should return BMI field"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        
        # Check BMI fields exist
        assert "bmi" in data, "Response should contain 'bmi' field"
        assert "bmi_category" in data, "Response should contain 'bmi_category' field"
        print(f"✓ BMI: {data.get('bmi')}, Category: {data.get('bmi_category')}")
    
    def test_weight_stats_returns_weekly_avg(self):
        """GET /api/fitness/weight/stats - Should return weekly_avg field"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        
        assert "weekly_avg" in data, "Response should contain 'weekly_avg' field"
        print(f"✓ Weekly average: {data.get('weekly_avg')}")
    
    def test_weight_stats_returns_monthly_avg(self):
        """GET /api/fitness/weight/stats - Should return monthly_avg field"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        
        assert "monthly_avg" in data, "Response should contain 'monthly_avg' field"
        print(f"✓ Monthly average: {data.get('monthly_avg')}")
    
    def test_weight_stats_returns_weekly_change(self):
        """GET /api/fitness/weight/stats - Should return weekly_change field"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        
        assert "weekly_change" in data, "Response should contain 'weekly_change' field"
        print(f"✓ Weekly change: {data.get('weekly_change')}")
    
    def test_weight_stats_returns_trend(self):
        """GET /api/fitness/weight/stats - Should return trend field (losing/gaining/stable)"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        
        assert "trend" in data, "Response should contain 'trend' field"
        if data.get("trend"):
            assert data["trend"] in ["losing", "gaining", "stable"], f"Trend should be one of: losing, gaining, stable. Got: {data['trend']}"
        print(f"✓ Trend: {data.get('trend')}")
    
    def test_weight_stats_full_response_structure(self):
        """GET /api/fitness/weight/stats - Should return all required fields"""
        res = requests.get(f"{BASE_URL}/api/fitness/weight/stats", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        
        required_fields = [
            "current_weight", "starting_weight", "lowest_weight", "highest_weight",
            "total_change", "goal_weight", "progress_to_goal",
            "bmi", "bmi_category", "weekly_avg", "monthly_avg", 
            "weekly_change", "trend", "total_entries"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✓ All {len(required_fields)} required fields present")
        print(f"  Response: BMI={data.get('bmi')}, Category={data.get('bmi_category')}")
        print(f"  Weekly: avg={data.get('weekly_avg')}, change={data.get('weekly_change')}")
        print(f"  Monthly: avg={data.get('monthly_avg')}, Trend={data.get('trend')}")


# ============== REPORTS AVAILABLE TESTS ==============

class TestReportsAvailable:
    """Tests for /api/reports/available endpoint"""
    
    def test_reports_available_admin(self):
        """GET /api/reports/available - Admin should see all reports"""
        token = TestAuthHelpers.get_admin_token()
        if not token:
            pytest.skip("Failed to get admin token")
        
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/api/reports/available", headers=headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "reports" in data, "Response should contain 'reports' field"
        assert "role" in data, "Response should contain 'role' field"
        assert data["role"] == "admin", f"Expected role 'admin', got {data['role']}"
        
        # Admin should have access to 4+ reports
        assert len(data["reports"]) >= 4, f"Admin should see at least 4 reports, got {len(data['reports'])}"
        
        report_ids = [r["id"] for r in data["reports"]]
        print(f"✓ Admin sees {len(data['reports'])} reports: {report_ids}")
    
    def test_reports_available_manager(self):
        """GET /api/reports/available - Manager should see limited reports"""
        token = TestAuthHelpers.get_manager_token()
        if not token:
            pytest.skip("Failed to get manager token")
        
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/api/reports/available", headers=headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "reports" in data, "Response should contain 'reports' field"
        assert data["role"] == "manager", f"Expected role 'manager', got {data['role']}"
        
        # Manager should have at least 2 reports
        assert len(data["reports"]) >= 2, f"Manager should see at least 2 reports"
        
        report_ids = [r["id"] for r in data["reports"]]
        print(f"✓ Manager sees {len(data['reports'])} reports: {report_ids}")


# ============== ADMIN REPORTS TESTS ==============

class TestAdminReports:
    """Tests for admin report endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestAuthHelpers.get_admin_token()
        self.headers = {"Authorization": f"Bearer {self.token}"}
        if not self.token:
            pytest.skip("Failed to get admin token")
    
    def test_admin_users_report_json(self):
        """GET /api/reports/admin/users?format=json - Returns users JSON"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/users?format=json", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "users" in data, "Response should contain 'users' field"
        assert "total" in data, "Response should contain 'total' field"
        assert "period" in data, "Response should contain 'period' field"
        
        print(f"✓ Admin users report (JSON): {data['total']} users")
    
    def test_admin_users_report_csv(self):
        """GET /api/reports/admin/users?format=csv - Downloads users CSV"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/users?format=csv", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/csv" in res.headers.get("content-type", ""), "Should return CSV content-type"
        assert "Content-Disposition" in res.headers, "Should have Content-Disposition header"
        
        # Check CSV has headers
        content = res.text
        assert "id" in content.lower() and "name" in content.lower(), "CSV should have expected headers"
        
        print(f"✓ Admin users report (CSV): {len(content)} bytes")
    
    def test_admin_grievances_report_json(self):
        """GET /api/reports/admin/grievances?format=json - Returns grievances JSON"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/grievances?format=json", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "grievances" in data, "Response should contain 'grievances' field"
        assert "total" in data, "Response should contain 'total' field"
        
        print(f"✓ Admin grievances report (JSON): {data['total']} grievances")
    
    def test_admin_grievances_report_with_status_filter(self):
        """GET /api/reports/admin/grievances?status=pending - Filters by status"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/grievances?format=json&status=pending", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        
        # All returned grievances should be pending (if any)
        for grievance in data.get("grievances", []):
            if grievance.get("status"):
                assert grievance["status"] == "pending", f"Expected status 'pending', got {grievance['status']}"
        
        print(f"✓ Admin grievances filtered by status: {data.get('total', 0)} pending")
    
    def test_admin_grievances_report_csv(self):
        """GET /api/reports/admin/grievances?format=csv - Downloads grievances CSV"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/grievances?format=csv", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/csv" in res.headers.get("content-type", "")
        
        print(f"✓ Admin grievances report (CSV): {len(res.text)} bytes")
    
    def test_admin_analytics_report_json(self):
        """GET /api/reports/admin/analytics?format=json - Returns analytics JSON"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/analytics?format=json", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "analytics" in data, "Response should contain 'analytics' field"
        assert "period" in data, "Response should contain 'period' field"
        
        print(f"✓ Admin analytics report (JSON): {data.get('total_days', 0)} days")
    
    def test_admin_analytics_report_csv(self):
        """GET /api/reports/admin/analytics?format=csv - Downloads analytics CSV"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/analytics?format=csv", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/csv" in res.headers.get("content-type", "")
        
        print(f"✓ Admin analytics report (CSV): {len(res.text)} bytes")
    
    def test_admin_health_summary_json(self):
        """GET /api/reports/admin/health-summary?format=json - Returns health summary JSON"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/health-summary?format=json", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "health_summary" in data, "Response should contain 'health_summary' field"
        assert "period" in data, "Response should contain 'period' field"
        
        print(f"✓ Admin health summary (JSON): {len(data.get('health_summary', []))} entries")
    
    def test_admin_health_summary_csv(self):
        """GET /api/reports/admin/health-summary?format=csv - Downloads health summary CSV"""
        res = requests.get(f"{BASE_URL}/api/reports/admin/health-summary?format=csv", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/csv" in res.headers.get("content-type", "")
        
        print(f"✓ Admin health summary (CSV): {len(res.text)} bytes")


# ============== MANAGER REPORTS TESTS ==============

class TestManagerReports:
    """Tests for manager report endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = TestAuthHelpers.get_manager_token()
        self.headers = {"Authorization": f"Bearer {self.token}"}
        if not self.token:
            pytest.skip("Failed to get manager token")
    
    def test_manager_grievances_report_json(self):
        """GET /api/reports/manager/grievances?format=json - Returns manager's area grievances"""
        res = requests.get(f"{BASE_URL}/api/reports/manager/grievances?format=json", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "grievances" in data, "Response should contain 'grievances' field"
        assert "total" in data, "Response should contain 'total' field"
        
        print(f"✓ Manager grievances report (JSON): {data['total']} grievances")
    
    def test_manager_grievances_report_csv(self):
        """GET /api/reports/manager/grievances?format=csv - Downloads grievances CSV"""
        res = requests.get(f"{BASE_URL}/api/reports/manager/grievances?format=csv", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/csv" in res.headers.get("content-type", "")
        
        print(f"✓ Manager grievances report (CSV): {len(res.text)} bytes")
    
    def test_manager_users_report_json(self):
        """GET /api/reports/manager/users?format=json - Returns manager's area users"""
        res = requests.get(f"{BASE_URL}/api/reports/manager/users?format=json", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "users" in data, "Response should contain 'users' field"
        assert "total" in data, "Response should contain 'total' field"
        
        print(f"✓ Manager users report (JSON): {data['total']} users")
    
    def test_manager_users_report_csv(self):
        """GET /api/reports/manager/users?format=csv - Downloads users CSV"""
        res = requests.get(f"{BASE_URL}/api/reports/manager/users?format=csv", headers=self.headers)
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/csv" in res.headers.get("content-type", "")
        
        print(f"✓ Manager users report (CSV): {len(res.text)} bytes")


# ============== ACCESS CONTROL TESTS ==============

class TestReportAccessControl:
    """Tests for report access control"""
    
    def test_admin_reports_denied_for_regular_user(self):
        """Regular user should not access admin reports"""
        token = TestAuthHelpers.get_user_token()
        if not token:
            pytest.skip("Failed to get user token")
        
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/api/reports/admin/users?format=json", headers=headers)
        
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print("✓ Admin reports denied for regular user (403)")
    
    def test_manager_reports_denied_for_regular_user(self):
        """Regular user should not access manager reports"""
        token = TestAuthHelpers.get_user_token()
        if not token:
            pytest.skip("Failed to get user token")
        
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/api/reports/manager/grievances?format=json", headers=headers)
        
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print("✓ Manager reports denied for regular user (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
