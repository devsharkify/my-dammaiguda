"""Admin User Management Router"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from .utils import db, now_iso, get_current_user

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

class RoleUpdate(BaseModel):
    role: str  # citizen, manager, admin

# ============== ROUTES ==============

@router.get("/stats")
async def get_user_stats(user: dict = Depends(get_current_user)):
    """Get user statistics"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total = await db.users.count_documents({})
    admins = await db.users.count_documents({"role": "admin"})
    managers = await db.users.count_documents({"role": "manager"})
    citizens = await db.users.count_documents({"role": "citizen"})
    
    return {
        "total": total,
        "admins": admins,
        "managers": managers,
        "citizens": citizens
    }

@router.get("")
async def get_users(
    limit: int = 20,
    skip: int = 0,
    role: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get users list (admin only)"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {
        "users": users,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.get("/search")
async def search_users(
    phone: Optional[str] = None,
    name: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Search users by phone or name (admin only)"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not phone and not name:
        raise HTTPException(status_code=400, detail="Provide phone or name to search")
    
    query = {"$or": []}
    
    if phone:
        # Search with and without +91 prefix (escape special chars for regex)
        import re
        clean_phone = phone.replace("+91", "").replace("+", "").replace(" ", "")
        escaped_phone = re.escape(clean_phone)
        query["$or"].extend([
            {"phone": {"$regex": escaped_phone, "$options": "i"}},
            {"phone": f"+91{clean_phone}"},
            {"phone": clean_phone}
        ])
    
    if name:
        query["$or"].append({"name": {"$regex": name, "$options": "i"}})
    
    if not query["$or"]:
        query = {}
    
    users = await db.users.find(query, {"_id": 0}).limit(20).to_list(20)
    
    return {"users": users}

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: RoleUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a user's role (admin only)"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if role_update.role not in ["citizen", "manager", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be: citizen, manager, or admin")
    
    # Find the user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion (optional safety)
    if target_user["id"] == user["id"] and role_update.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot demote yourself")
    
    # Update the role
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role_update.role, "role_updated_at": now_iso(), "role_updated_by": user["id"]}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update role")
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    return {
        "success": True,
        "message": f"Role updated to {role_update.role}",
        "user": updated_user
    }

@router.get("/{user_id}")
async def get_user_details(user_id: str, user: dict = Depends(get_current_user)):
    """Get user details (admin only)"""
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin/Manager access required")
    
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return target_user
