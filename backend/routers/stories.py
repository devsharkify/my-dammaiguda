"""Stories/Status Router - WhatsApp/Instagram style stories"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/stories", tags=["Stories"])

# Story duration in hours
STORY_DURATION_HOURS = 24

# ============== MODELS ==============

class CreateStory(BaseModel):
    content_type: str  # text, image, video
    text: Optional[str] = None
    media_url: Optional[str] = None
    background_color: Optional[str] = "#6366f1"  # For text stories

class StoryView(BaseModel):
    story_id: str

# ============== HELPER FUNCTIONS ==============

def is_story_active(story: dict) -> bool:
    """Check if story is still within 24 hours"""
    created_at = story.get("created_at", "")
    if not created_at:
        return False
    
    try:
        created_time = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        expiry_time = created_time + timedelta(hours=STORY_DURATION_HOURS)
        return datetime.now(timezone.utc) < expiry_time
    except:
        return False

def get_time_remaining(story: dict) -> str:
    """Get human-readable time remaining"""
    created_at = story.get("created_at", "")
    if not created_at:
        return "0h"
    
    try:
        created_time = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        expiry_time = created_time + timedelta(hours=STORY_DURATION_HOURS)
        remaining = expiry_time - datetime.now(timezone.utc)
        
        if remaining.total_seconds() <= 0:
            return "Expired"
        
        hours = int(remaining.total_seconds() // 3600)
        minutes = int((remaining.total_seconds() % 3600) // 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"
    except:
        return "0h"

# ============== ROUTES ==============

@router.post("/create")
async def create_story(story: CreateStory, user: dict = Depends(get_current_user)):
    """Create a new story (24-hour duration)"""
    if story.content_type == "text" and not story.text:
        raise HTTPException(status_code=400, detail="Text content required for text stories")
    
    if story.content_type in ["image", "video"] and not story.media_url:
        raise HTTPException(status_code=400, detail="Media URL required for image/video stories")
    
    new_story = {
        "id": generate_id(),
        "user_id": user["id"],
        "user_name": user.get("name", "Anonymous"),
        "user_avatar": user.get("avatar"),
        "content_type": story.content_type,
        "text": story.text,
        "media_url": story.media_url,
        "background_color": story.background_color,
        "viewers": [],
        "view_count": 0,
        "created_at": now_iso(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=STORY_DURATION_HOURS)).isoformat()
    }
    
    await db.stories.insert_one(new_story)
    new_story.pop("_id", None)
    
    return {"success": True, "story": new_story}

@router.get("/feed")
async def get_stories_feed(user: dict = Depends(get_current_user)):
    """Get stories feed - grouped by user"""
    # Get all stories from last 24 hours
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=STORY_DURATION_HOURS)).isoformat()
    
    stories = await db.stories.find(
        {"created_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Filter active stories
    active_stories = [s for s in stories if is_story_active(s)]
    
    # Group by user
    users_with_stories = {}
    for story in active_stories:
        uid = story["user_id"]
        if uid not in users_with_stories:
            users_with_stories[uid] = {
                "user_id": uid,
                "user_name": story["user_name"],
                "user_avatar": story.get("user_avatar"),
                "stories": [],
                "has_unseen": False,
                "latest_at": story["created_at"]
            }
        
        # Check if current user has viewed this story
        story["viewed_by_me"] = user["id"] in story.get("viewers", [])
        story["time_remaining"] = get_time_remaining(story)
        
        if not story["viewed_by_me"]:
            users_with_stories[uid]["has_unseen"] = True
        
        users_with_stories[uid]["stories"].append(story)
    
    # Convert to list and sort (unseen first, then by latest)
    feed = list(users_with_stories.values())
    feed.sort(key=lambda x: (not x["has_unseen"], x["latest_at"]), reverse=True)
    
    # Put current user's stories first if they have any
    my_stories = [u for u in feed if u["user_id"] == user["id"]]
    other_stories = [u for u in feed if u["user_id"] != user["id"]]
    
    return {
        "my_stories": my_stories[0] if my_stories else None,
        "feed": other_stories,
        "total_users": len(feed)
    }

@router.get("/my")
async def get_my_stories(user: dict = Depends(get_current_user)):
    """Get current user's active stories with viewer details"""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=STORY_DURATION_HOURS)).isoformat()
    
    stories = await db.stories.find(
        {"user_id": user["id"], "created_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Add time remaining and filter active
    active = []
    for story in stories:
        if is_story_active(story):
            story["time_remaining"] = get_time_remaining(story)
            active.append(story)
    
    return {"stories": active, "count": len(active)}

@router.post("/view")
async def view_story(view: StoryView, user: dict = Depends(get_current_user)):
    """Mark a story as viewed"""
    story = await db.stories.find_one({"id": view.story_id})
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Don't count self-views for view count, but track for "seen" status
    viewers = story.get("viewers", [])
    
    if user["id"] not in viewers:
        viewers.append(user["id"])
        
        update_data = {"viewers": viewers}
        
        # Only increment view_count for non-self views
        if story["user_id"] != user["id"]:
            update_data["view_count"] = story.get("view_count", 0) + 1
        
        await db.stories.update_one(
            {"id": view.story_id},
            {"$set": update_data}
        )
    
    return {"success": True, "viewed": True}

@router.get("/{story_id}/viewers")
async def get_story_viewers(story_id: str, user: dict = Depends(get_current_user)):
    """Get list of users who viewed a story (only for story owner)"""
    story = await db.stories.find_one({"id": story_id})
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    if story["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only view viewers of your own stories")
    
    viewer_ids = story.get("viewers", [])
    
    # Get viewer details
    viewers = []
    for vid in viewer_ids:
        viewer = await db.users.find_one({"id": vid}, {"_id": 0, "id": 1, "name": 1, "avatar": 1})
        if viewer:
            viewers.append(viewer)
    
    return {
        "story_id": story_id,
        "viewers": viewers,
        "view_count": len(viewers)
    }

@router.delete("/{story_id}")
async def delete_story(story_id: str, user: dict = Depends(get_current_user)):
    """Delete a story"""
    story = await db.stories.find_one({"id": story_id})
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    if story["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own stories")
    
    await db.stories.delete_one({"id": story_id})
    
    return {"success": True, "deleted": True}

@router.get("/user/{user_id}")
async def get_user_stories(user_id: str, user: dict = Depends(get_current_user)):
    """Get all active stories from a specific user"""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=STORY_DURATION_HOURS)).isoformat()
    
    stories = await db.stories.find(
        {"user_id": user_id, "created_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    
    # Filter active and add metadata
    active = []
    for story in stories:
        if is_story_active(story):
            story["viewed_by_me"] = user["id"] in story.get("viewers", [])
            story["time_remaining"] = get_time_remaining(story)
            active.append(story)
    
    return {"stories": active, "count": len(active)}
