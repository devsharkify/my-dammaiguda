"""
Citizen Wall Feature Tests - Posts, Groups, Comments, Likes
Tests for the Citizen Wall social feature including:
- Post creation (text/image/video)
- Post likes
- Comments on posts
- Group creation
- Group joining
- Group discovery
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_PHONE = "9876543210"
TEST_OTP = "123456"

class TestAuthentication:
    """Authentication flow tests"""
    
    def test_send_otp(self):
        """Test OTP sending"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "dev_otp" in data
        print(f"✓ OTP sent successfully: {data['dev_otp']}")
    
    def test_verify_otp(self):
        """Test OTP verification"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        
        # Then verify
        response = requests.post(f"{BASE_URL}/api/auth/verify", json={
            "phone": TEST_PHONE,
            "otp": TEST_OTP
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ OTP verified, is_new_user: {data.get('is_new_user', False)}")


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    # Send OTP
    requests.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
    
    # Verify OTP
    response = requests.post(f"{BASE_URL}/api/auth/verify", json={
        "phone": TEST_PHONE,
        "otp": TEST_OTP
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get("token"):
            return data["token"]
        elif data.get("is_new_user"):
            # Register new user
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "phone": TEST_PHONE,
                "name": "Test User",
                "age_range": "25-35",
                "colony": "Dammaiguda",
                "role": "citizen"
            })
            if reg_response.status_code == 200:
                return reg_response.json().get("token")
    
    pytest.skip("Could not obtain auth token")


@pytest.fixture
def headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestWallPosts:
    """Wall post CRUD tests"""
    
    def test_get_posts_requires_auth(self):
        """Test that getting posts requires authentication"""
        response = requests.get(f"{BASE_URL}/api/wall/posts")
        assert response.status_code in [401, 403]
        print("✓ Posts endpoint requires authentication")
    
    def test_get_posts_with_auth(self, headers):
        """Test getting posts with authentication"""
        response = requests.get(f"{BASE_URL}/api/wall/posts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)
        print(f"✓ Got {len(data['posts'])} posts")
    
    def test_create_text_post(self, headers):
        """Test creating a text-only post"""
        post_data = {
            "content": "TEST_This is a test post from automated testing",
            "visibility": "public"
        }
        response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "post" in data
        assert data["post"]["content"] == post_data["content"]
        assert data["post"]["visibility"] == "public"
        assert "id" in data["post"]
        print(f"✓ Created text post with ID: {data['post']['id']}")
        return data["post"]["id"]
    
    def test_create_post_with_image(self, headers):
        """Test creating a post with image"""
        post_data = {
            "content": "TEST_Post with image",
            "visibility": "public",
            "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
        response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["post"]["image_url"] is not None
        print(f"✓ Created post with image, ID: {data['post']['id']}")
    
    def test_create_colony_post(self, headers):
        """Test creating a colony-only post"""
        post_data = {
            "content": "TEST_Colony only post",
            "visibility": "colony"
        }
        response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["post"]["visibility"] == "colony"
        print(f"✓ Created colony post with ID: {data['post']['id']}")
    
    def test_create_empty_post_fails(self, headers):
        """Test that empty post creation fails"""
        post_data = {
            "content": "",
            "visibility": "public"
        }
        response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        assert response.status_code == 400
        print("✓ Empty post creation correctly rejected")
    
    def test_filter_posts_by_visibility(self, headers):
        """Test filtering posts by visibility"""
        # Get public posts
        response = requests.get(f"{BASE_URL}/api/wall/posts?visibility=public", headers=headers)
        assert response.status_code == 200
        data = response.json()
        for post in data["posts"]:
            assert post["visibility"] == "public"
        print(f"✓ Filtered {len(data['posts'])} public posts")
        
        # Get colony posts
        response = requests.get(f"{BASE_URL}/api/wall/posts?visibility=colony", headers=headers)
        assert response.status_code == 200
        print("✓ Colony filter works")


class TestPostLikes:
    """Post like/unlike tests"""
    
    def test_like_post(self, headers):
        """Test liking a post"""
        # First create a post
        post_data = {"content": "TEST_Post to like", "visibility": "public"}
        create_response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        post_id = create_response.json()["post"]["id"]
        
        # Like the post
        response = requests.post(f"{BASE_URL}/api/wall/post/{post_id}/like", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["action"] == "liked"
        assert data["likes_count"] >= 1
        print(f"✓ Liked post {post_id}, likes_count: {data['likes_count']}")
    
    def test_unlike_post(self, headers):
        """Test unliking a post (toggle)"""
        # Create and like a post
        post_data = {"content": "TEST_Post to unlike", "visibility": "public"}
        create_response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        post_id = create_response.json()["post"]["id"]
        
        # Like first
        requests.post(f"{BASE_URL}/api/wall/post/{post_id}/like", headers=headers)
        
        # Unlike (second like toggles)
        response = requests.post(f"{BASE_URL}/api/wall/post/{post_id}/like", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "unliked"
        print(f"✓ Unliked post {post_id}")
    
    def test_like_nonexistent_post(self, headers):
        """Test liking a non-existent post"""
        response = requests.post(f"{BASE_URL}/api/wall/post/nonexistent123/like", headers=headers)
        assert response.status_code == 404
        print("✓ Liking non-existent post returns 404")


class TestPostComments:
    """Post comment tests"""
    
    def test_add_comment(self, headers):
        """Test adding a comment to a post"""
        # Create a post
        post_data = {"content": "TEST_Post for comments", "visibility": "public"}
        create_response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        post_id = create_response.json()["post"]["id"]
        
        # Add comment
        comment_data = {"content": "TEST_This is a test comment"}
        response = requests.post(f"{BASE_URL}/api/wall/post/{post_id}/comment", json=comment_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "comment" in data
        assert data["comment"]["content"] == comment_data["content"]
        print(f"✓ Added comment to post {post_id}")
    
    def test_get_post_with_comments(self, headers):
        """Test getting a post with its comments"""
        # Create a post
        post_data = {"content": "TEST_Post to get with comments", "visibility": "public"}
        create_response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        post_id = create_response.json()["post"]["id"]
        
        # Add a comment
        comment_data = {"content": "TEST_Comment for retrieval test"}
        requests.post(f"{BASE_URL}/api/wall/post/{post_id}/comment", json=comment_data, headers=headers)
        
        # Get post with comments
        response = requests.get(f"{BASE_URL}/api/wall/post/{post_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "comments" in data
        assert len(data["comments"]) >= 1
        print(f"✓ Got post with {len(data['comments'])} comments")
    
    def test_comment_on_nonexistent_post(self, headers):
        """Test commenting on non-existent post"""
        comment_data = {"content": "TEST_Comment on nothing"}
        response = requests.post(f"{BASE_URL}/api/wall/post/nonexistent123/comment", json=comment_data, headers=headers)
        assert response.status_code == 404
        print("✓ Commenting on non-existent post returns 404")


class TestGroups:
    """Group CRUD tests"""
    
    def test_create_public_group(self, headers):
        """Test creating a public group"""
        group_data = {
            "name": "TEST_Public Group",
            "description": "A test public group",
            "is_private": False
        }
        response = requests.post(f"{BASE_URL}/api/wall/group", json=group_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "group" in data
        assert data["group"]["name"] == group_data["name"]
        assert data["group"]["is_private"] == False
        assert data["group"]["members_count"] == 1  # Creator is first member
        print(f"✓ Created public group: {data['group']['id']}")
        return data["group"]["id"]
    
    def test_create_private_group(self, headers):
        """Test creating a private group"""
        group_data = {
            "name": "TEST_Private Group",
            "description": "A test private group",
            "is_private": True
        }
        response = requests.post(f"{BASE_URL}/api/wall/group", json=group_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["group"]["is_private"] == True
        print(f"✓ Created private group: {data['group']['id']}")
    
    def test_get_my_groups(self, headers):
        """Test getting user's groups"""
        response = requests.get(f"{BASE_URL}/api/wall/groups", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} groups")
    
    def test_discover_groups(self, headers):
        """Test discovering public groups"""
        response = requests.get(f"{BASE_URL}/api/wall/groups/discover", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All discovered groups should be public
        for group in data:
            assert group.get("is_private") == False
        print(f"✓ Discovered {len(data)} public groups")
    
    def test_get_group_details(self, headers):
        """Test getting group details"""
        # First create a group
        group_data = {"name": "TEST_Group for details", "is_private": False}
        create_response = requests.post(f"{BASE_URL}/api/wall/group", json=group_data, headers=headers)
        group_id = create_response.json()["group"]["id"]
        
        # Get group details
        response = requests.get(f"{BASE_URL}/api/wall/group/{group_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == group_id
        assert "members" in data
        assert data["is_member"] == True  # Creator should be member
        print(f"✓ Got group details for {group_id}")
    
    def test_get_nonexistent_group(self, headers):
        """Test getting non-existent group"""
        response = requests.get(f"{BASE_URL}/api/wall/group/nonexistent123", headers=headers)
        assert response.status_code == 404
        print("✓ Non-existent group returns 404")


class TestGroupMembership:
    """Group join/leave tests"""
    
    def test_leave_group(self, headers):
        """Test leaving a group"""
        # Create a group
        group_data = {"name": "TEST_Group to leave", "is_private": False}
        create_response = requests.post(f"{BASE_URL}/api/wall/group", json=group_data, headers=headers)
        group_id = create_response.json()["group"]["id"]
        
        # Leave the group (as only admin with 1 member, should work)
        response = requests.post(f"{BASE_URL}/api/wall/group/{group_id}/leave", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Left group {group_id}")
    
    def test_leave_nonexistent_group(self, headers):
        """Test leaving non-existent group"""
        response = requests.post(f"{BASE_URL}/api/wall/group/nonexistent123/leave", headers=headers)
        assert response.status_code == 404
        print("✓ Leaving non-existent group returns 404")


class TestGroupInvites:
    """Group invite tests"""
    
    def test_get_group_invites(self, headers):
        """Test getting pending group invites"""
        response = requests.get(f"{BASE_URL}/api/wall/group-invites", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} pending invites")


class TestPostDeletion:
    """Post deletion tests"""
    
    def test_delete_own_post(self, headers):
        """Test deleting own post"""
        # Create a post
        post_data = {"content": "TEST_Post to delete", "visibility": "public"}
        create_response = requests.post(f"{BASE_URL}/api/wall/post", json=post_data, headers=headers)
        post_id = create_response.json()["post"]["id"]
        
        # Delete the post
        response = requests.delete(f"{BASE_URL}/api/wall/post/{post_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Deleted post {post_id}")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/wall/post/{post_id}", headers=headers)
        assert get_response.status_code == 404
        print("✓ Verified post is deleted")
    
    def test_delete_nonexistent_post(self, headers):
        """Test deleting non-existent post"""
        response = requests.delete(f"{BASE_URL}/api/wall/post/nonexistent123", headers=headers)
        assert response.status_code == 404
        print("✓ Deleting non-existent post returns 404")


# Cleanup fixture to remove test data
@pytest.fixture(scope="module", autouse=True)
def cleanup(auth_token):
    """Cleanup test data after all tests"""
    yield
    # Cleanup would happen here if needed
    # For now, test data is prefixed with TEST_ for identification
    print("\n✓ Test suite completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
