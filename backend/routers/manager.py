"""Manager Router - Manager-specific APIs for area management"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from .utils import db, generate_id, now_iso, get_current_user
from datetime import datetime

router = APIRouter(prefix="/manager", tags=["Manager"])

# ============== MODELS ==============

class ManagerCreate(BaseModel):
    phone: str
    name: str
    assigned_area: str

class GrievanceAction(BaseModel):
    action: str  # approved, rejected, resolved
    notes: Optional[str] = None

class WallPostCreate(BaseModel):
    content: str
    
class BannerUpdate(BaseModel):
    banner_url: str

# ============== HELPER FUNCTIONS ==============

async def get_current_manager(user: dict = Depends(get_current_user)):
    """Ensure user is a manager"""
    if user.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")
    return user

# ============== ROUTES ==============

@router.get("/stats")
async def get_manager_stats(manager: dict = Depends(get_current_manager)):
    """Get statistics for manager's assigned area"""
    area = manager.get("assigned_area", "")
    
    # Get counts for the area
    total_members = await db.users.count_documents({"colony": {"$regex": area, "$options": "i"}})
    active_members = await db.users.count_documents({
        "colony": {"$regex": area, "$options": "i"},
        "last_active": {"$gte": (datetime.utcnow().replace(day=1)).isoformat()}
    })
    pending_grievances = await db.issues.count_documents({
        "area": area,
        "status": "pending"
    })
    course_enrollments = await db.enrollments.count_documents({
        "area": area
    })
    wall_posts = await db.wall_posts.count_documents({
        "area": area
    })
    
    return {
        "area": area,
        "total_members": total_members,
        "active_members": active_members,
        "pending_grievances": pending_grievances,
        "course_enrollments": course_enrollments,
        "wall_posts": wall_posts
    }

@router.get("/grievances")
async def get_grievances(manager: dict = Depends(get_current_manager)):
    """Get grievances for manager's assigned area"""
    area = manager.get("assigned_area", "")
    
    grievances = await db.issues.find(
        {"area": area},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Enrich with user details
    for g in grievances:
        user = await db.users.find_one({"id": g.get("user_id")}, {"_id": 0, "name": 1, "phone": 1})
        g["user_name"] = user.get("name", "Unknown") if user else "Unknown"
    
    return {"grievances": grievances}

@router.put("/grievances/{grievance_id}")
async def update_grievance(
    grievance_id: str, 
    action: GrievanceAction, 
    manager: dict = Depends(get_current_manager)
):
    """Update grievance status (approve/reject/resolve)"""
    area = manager.get("assigned_area", "")
    
    # Find grievance
    grievance = await db.issues.find_one({"id": grievance_id, "area": area})
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    # Update status
    await db.issues.update_one(
        {"id": grievance_id},
        {
            "$set": {
                "status": action.action,
                "manager_notes": action.notes,
                "updated_at": now_iso(),
                "updated_by": manager.get("id")
            }
        }
    )
    
    return {"success": True, "message": f"Grievance {action.action}"}

@router.get("/enrollments")
async def get_enrollments(manager: dict = Depends(get_current_manager)):
    """Get course enrollments for manager's area"""
    area = manager.get("assigned_area", "")
    
    enrollments = await db.enrollments.find(
        {"area": area},
        {"_id": 0}
    ).sort("enrolled_at", -1).limit(100).to_list(100)
    
    # Enrich with user and course details
    for e in enrollments:
        user = await db.users.find_one({"id": e.get("user_id")}, {"_id": 0, "name": 1})
        course = await db.courses.find_one({"id": e.get("course_id")}, {"_id": 0, "title": 1})
        e["user_name"] = user.get("name", "Unknown") if user else "Unknown"
        e["course_title"] = course.get("title", "Unknown") if course else "Unknown"
    
    return {"enrollments": enrollments}

@router.get("/members")
async def get_members(manager: dict = Depends(get_current_manager)):
    """Get registered members in manager's area"""
    area = manager.get("assigned_area", "")
    
    members = await db.users.find(
        {"colony": {"$regex": area, "$options": "i"}, "role": "citizen"},
        {"_id": 0, "id": 1, "name": 1, "phone": 1, "colony": 1, "created_at": 1, "last_active": 1}
    ).sort("created_at", -1).limit(200).to_list(200)
    
    # Add status based on last_active
    for m in members:
        last_active = m.get("last_active", m.get("created_at", ""))
        if last_active:
            try:
                active_date = datetime.fromisoformat(last_active.replace("Z", "+00:00"))
                days_inactive = (datetime.utcnow().replace(tzinfo=active_date.tzinfo) - active_date).days
                m["status"] = "active" if days_inactive < 30 else "inactive"
            except (ValueError, TypeError):
                m["status"] = "unknown"
        else:
            m["status"] = "unknown"
    
    return {"members": members}

@router.get("/wall")
async def get_wall_posts(manager: dict = Depends(get_current_manager)):
    """Get wall posts for manager's area"""
    area = manager.get("assigned_area", "")
    
    posts = await db.wall_posts.find(
        {"area": area},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"posts": posts}

@router.post("/wall")
async def create_wall_post(
    post: WallPostCreate, 
    manager: dict = Depends(get_current_manager)
):
    """Create a wall post for manager's area"""
    area = manager.get("assigned_area", "")
    
    new_post = {
        "id": generate_id(),
        "content": post.content,
        "area": area,
        "author_id": manager.get("id"),
        "author_name": manager.get("name", "Manager"),
        "author_role": "manager",
        "created_at": now_iso(),
        "likes": 0,
        "comments": []
    }
    
    await db.wall_posts.insert_one(new_post)
    new_post.pop("_id", None)
    
    return {"success": True, "post": new_post}

@router.delete("/wall/{post_id}")
async def delete_wall_post(
    post_id: str, 
    manager: dict = Depends(get_current_manager)
):
    """Delete a wall post"""
    area = manager.get("assigned_area", "")
    
    result = await db.wall_posts.delete_one({"id": post_id, "area": area})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "message": "Post deleted"}

@router.put("/banner")
async def update_banner(
    banner: BannerUpdate, 
    manager: dict = Depends(get_current_manager)
):
    """Update area banner"""
    area = manager.get("assigned_area", "")
    
    await db.area_settings.update_one(
        {"area": area},
        {
            "$set": {
                "banner_url": banner.banner_url,
                "updated_at": now_iso(),
                "updated_by": manager.get("id")
            }
        },
        upsert=True
    )
    
    return {"success": True, "message": "Banner updated"}

@router.get("/banner")
async def get_banner(manager: dict = Depends(get_current_manager)):
    """Get area banner"""
    area = manager.get("assigned_area", "")
    
    settings = await db.area_settings.find_one({"area": area}, {"_id": 0})
    
    return {"banner_url": settings.get("banner_url", "") if settings else ""}

# ============== ADMIN ROUTES FOR MANAGER MANAGEMENT ==============

@router.post("/create", tags=["Admin"])
async def create_manager(
    manager_data: ManagerCreate, 
    admin: dict = Depends(get_current_user)
):
    """Create a new manager (admin only)"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user already exists
    existing = await db.users.find_one({"phone": manager_data.phone})
    
    if existing:
        # Update existing user to manager role
        await db.users.update_one(
            {"phone": manager_data.phone},
            {
                "$set": {
                    "role": "manager",
                    "name": manager_data.name,
                    "assigned_area": manager_data.assigned_area,
                    "updated_at": now_iso()
                }
            }
        )
        return {"success": True, "message": "User upgraded to manager"}
    else:
        # Create new manager
        new_manager = {
            "id": generate_id(),
            "phone": manager_data.phone,
            "name": manager_data.name,
            "role": "manager",
            "assigned_area": manager_data.assigned_area,
            "created_at": now_iso()
        }
        
        await db.users.insert_one(new_manager)
        new_manager.pop("_id", None)
        
        return {"success": True, "manager": new_manager}

@router.get("/list", tags=["Admin"])
async def list_managers(admin: dict = Depends(get_current_user)):
    """List all managers (admin only)"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    managers = await db.users.find(
        {"role": "manager"},
        {"_id": 0}
    ).to_list(100)
    
    return {"managers": managers}

@router.delete("/{manager_id}", tags=["Admin"])
async def remove_manager(manager_id: str, admin: dict = Depends(get_current_user)):
    """Remove manager role (admin only)"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Downgrade to citizen instead of deleting
    await db.users.update_one(
        {"id": manager_id},
        {
            "$set": {"role": "citizen"},
            "$unset": {"assigned_area": ""}
        }
    )
    
    return {"success": True, "message": "Manager role removed"}
