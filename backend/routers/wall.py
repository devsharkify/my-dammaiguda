"""Citizen Wall Router - Social posts, groups, community engagement"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/wall", tags=["Citizen Wall"])

# ============== MODELS ==============

class CreatePost(BaseModel):
    content: str
    image_url: Optional[str] = None
    visibility: str = "public"  # public, colony
    colony: Optional[str] = None

class CreateComment(BaseModel):
    content: str

class CreateGroup(BaseModel):
    name: str
    description: Optional[str] = None
    is_private: bool = False

class GroupInvite(BaseModel):
    user_phone: str

# ============== POST ROUTES ==============

@router.post("/post")
async def create_post(post: CreatePost, user: dict = Depends(get_current_user)):
    """Create a new wall post"""
    new_post = {
        "id": generate_id(),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_colony": user.get("colony"),
        "content": post.content,
        "image_url": post.image_url,
        "visibility": post.visibility,
        "colony": post.colony or user.get("colony"),
        "likes": [],
        "comments_count": 0,
        "created_at": now_iso()
    }
    
    await db.wall_posts.insert_one(new_post)
    new_post.pop("_id", None)
    
    return {"success": True, "post": new_post}

@router.get("/posts")
async def get_posts(
    visibility: str = "all",
    colony: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(get_current_user)
):
    """Get wall posts (public or colony-specific)"""
    query = {}
    
    if visibility == "public":
        query["visibility"] = "public"
    elif visibility == "colony":
        query["visibility"] = "colony"
        query["colony"] = colony or user.get("colony")
    else:
        # Show all posts user can see
        query["$or"] = [
            {"visibility": "public"},
            {"visibility": "colony", "colony": user.get("colony")}
        ]
    
    posts = await db.wall_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Add like status for current user
    for post in posts:
        post["liked_by_me"] = user["id"] in post.get("likes", [])
        post["likes_count"] = len(post.get("likes", []))
    
    return {"posts": posts, "count": len(posts)}

@router.get("/post/{post_id}")
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    """Get a specific post with comments"""
    post = await db.wall_posts.find_one({"id": post_id}, {"_id": 0})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments = await db.wall_comments.find(
        {"post_id": post_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    post["liked_by_me"] = user["id"] in post.get("likes", [])
    post["likes_count"] = len(post.get("likes", []))
    post["comments"] = comments
    
    return post

@router.post("/post/{post_id}/like")
async def like_post(post_id: str, user: dict = Depends(get_current_user)):
    """Like or unlike a post"""
    post = await db.wall_posts.find_one({"id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    likes = post.get("likes", [])
    
    if user["id"] in likes:
        likes.remove(user["id"])
        action = "unliked"
    else:
        likes.append(user["id"])
        action = "liked"
    
    await db.wall_posts.update_one(
        {"id": post_id},
        {"$set": {"likes": likes}}
    )
    
    return {"success": True, "action": action, "likes_count": len(likes)}

@router.post("/post/{post_id}/comment")
async def add_comment(post_id: str, comment: CreateComment, user: dict = Depends(get_current_user)):
    """Add a comment to a post"""
    post = await db.wall_posts.find_one({"id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = {
        "id": generate_id(),
        "post_id": post_id,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "content": comment.content,
        "created_at": now_iso()
    }
    
    await db.wall_comments.insert_one(new_comment)
    new_comment.pop("_id", None)
    
    await db.wall_posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return {"success": True, "comment": new_comment}

@router.delete("/post/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete a post (only by author or admin)"""
    post = await db.wall_posts.find_one({"id": post_id})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.wall_posts.delete_one({"id": post_id})
    await db.wall_comments.delete_many({"post_id": post_id})
    
    return {"success": True, "message": "Post deleted"}

# ============== GROUP ROUTES ==============

@router.post("/group")
async def create_group(group: CreateGroup, user: dict = Depends(get_current_user)):
    """Create a new group"""
    new_group = {
        "id": generate_id(),
        "name": group.name,
        "description": group.description,
        "is_private": group.is_private,
        "created_by": user["id"],
        "created_by_name": user.get("name"),
        "members": [{
            "user_id": user["id"],
            "user_name": user.get("name"),
            "role": "admin",
            "joined_at": now_iso()
        }],
        "members_count": 1,
        "created_at": now_iso()
    }
    
    await db.groups.insert_one(new_group)
    new_group.pop("_id", None)
    
    return {"success": True, "group": new_group}

@router.get("/groups")
async def get_my_groups(user: dict = Depends(get_current_user)):
    """Get groups user is a member of"""
    groups = await db.groups.find(
        {"members.user_id": user["id"]}, {"_id": 0}
    ).to_list(50)
    
    return groups

@router.get("/groups/discover")
async def discover_groups(user: dict = Depends(get_current_user)):
    """Discover public groups"""
    groups = await db.groups.find(
        {"is_private": False, "members.user_id": {"$ne": user["id"]}}, {"_id": 0}
    ).limit(20).to_list(20)
    
    return groups

@router.get("/group/{group_id}")
async def get_group(group_id: str, user: dict = Depends(get_current_user)):
    """Get group details"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is member
    is_member = any(m["user_id"] == user["id"] for m in group.get("members", []))
    group["is_member"] = is_member
    
    return group

@router.post("/group/{group_id}/join")
async def join_group(group_id: str, user: dict = Depends(get_current_user)):
    """Join a public group"""
    group = await db.groups.find_one({"id": group_id})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.get("is_private"):
        raise HTTPException(status_code=403, detail="Cannot join private group without invite")
    
    # Check if already member
    if any(m["user_id"] == user["id"] for m in group.get("members", [])):
        raise HTTPException(status_code=400, detail="Already a member")
    
    new_member = {
        "user_id": user["id"],
        "user_name": user.get("name"),
        "role": "member",
        "joined_at": now_iso()
    }
    
    await db.groups.update_one(
        {"id": group_id},
        {
            "$push": {"members": new_member},
            "$inc": {"members_count": 1}
        }
    )
    
    return {"success": True, "message": "Joined group"}

@router.post("/group/{group_id}/invite")
async def invite_to_group(group_id: str, invite: GroupInvite, user: dict = Depends(get_current_user)):
    """Invite someone to a group"""
    group = await db.groups.find_one({"id": group_id})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is admin
    user_member = next((m for m in group.get("members", []) if m["user_id"] == user["id"]), None)
    if not user_member or user_member.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite")
    
    # Find invitee
    invitee = await db.users.find_one({"phone": invite.user_phone}, {"_id": 0})
    if not invitee:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already member
    if any(m["user_id"] == invitee["id"] for m in group.get("members", [])):
        raise HTTPException(status_code=400, detail="User is already a member")
    
    # Create invite
    group_invite = {
        "id": generate_id(),
        "group_id": group_id,
        "group_name": group["name"],
        "invited_user_id": invitee["id"],
        "invited_by": user["id"],
        "invited_by_name": user.get("name"),
        "status": "pending",
        "created_at": now_iso()
    }
    
    await db.group_invites.insert_one(group_invite)
    group_invite.pop("_id", None)
    
    return {"success": True, "invite": group_invite}

@router.get("/group-invites")
async def get_group_invites(user: dict = Depends(get_current_user)):
    """Get pending group invites for user"""
    invites = await db.group_invites.find(
        {"invited_user_id": user["id"], "status": "pending"}, {"_id": 0}
    ).to_list(50)
    
    return invites

@router.post("/group-invite/{invite_id}/respond")
async def respond_to_group_invite(invite_id: str, action: str, user: dict = Depends(get_current_user)):
    """Accept or decline group invite"""
    invite = await db.group_invites.find_one({
        "id": invite_id,
        "invited_user_id": user["id"],
        "status": "pending"
    })
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    await db.group_invites.update_one(
        {"id": invite_id},
        {"$set": {"status": action + "ed", "responded_at": now_iso()}}
    )
    
    if action == "accept":
        new_member = {
            "user_id": user["id"],
            "user_name": user.get("name"),
            "role": "member",
            "joined_at": now_iso()
        }
        
        await db.groups.update_one(
            {"id": invite["group_id"]},
            {
                "$push": {"members": new_member},
                "$inc": {"members_count": 1}
            }
        )
    
    return {"success": True, "message": f"Invite {action}ed"}

@router.post("/group/{group_id}/leave")
async def leave_group(group_id: str, user: dict = Depends(get_current_user)):
    """Leave a group"""
    group = await db.groups.find_one({"id": group_id})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is member
    if not any(m["user_id"] == user["id"] for m in group.get("members", [])):
        raise HTTPException(status_code=400, detail="Not a member")
    
    # Check if user is the only admin
    admins = [m for m in group.get("members", []) if m.get("role") == "admin"]
    if len(admins) == 1 and admins[0]["user_id"] == user["id"] and group["members_count"] > 1:
        raise HTTPException(status_code=400, detail="Transfer admin role before leaving")
    
    await db.groups.update_one(
        {"id": group_id},
        {
            "$pull": {"members": {"user_id": user["id"]}},
            "$inc": {"members_count": -1}
        }
    )
    
    return {"success": True, "message": "Left group"}
