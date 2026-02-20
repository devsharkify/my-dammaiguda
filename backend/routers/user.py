"""User Router - Account management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/user", tags=["User"])


class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = None
    phone: str


@router.delete("/delete-account")
async def delete_account(request: DeleteAccountRequest, user: dict = Depends(get_current_user)):
    """
    Request account deletion.
    Marks account for deletion and removes data.
    """
    # Verify phone matches
    if request.phone != user.get("phone"):
        raise HTTPException(status_code=400, detail="Phone number doesn't match")
    
    # Log deletion request
    deletion_record = {
        "id": generate_id(),
        "user_id": user["id"],
        "phone": user.get("phone"),
        "name": user.get("name"),
        "reason": request.reason,
        "requested_at": now_iso(),
        "status": "completed"
    }
    
    await db.account_deletions.insert_one(deletion_record)
    
    # Delete user data from all collections
    user_id = user["id"]
    
    # Delete from users collection (hard delete)
    await db.users.delete_one({"id": user_id})
    
    # Delete related data
    await db.fitness_logs.delete_many({"user_id": user_id})
    await db.user_analytics.delete_many({"user_id": user_id})
    await db.water_logs.delete_many({"user_id": user_id})
    await db.issues.delete_many({"user_id": user_id})
    await db.sos_alerts.delete_many({"user_id": user_id})
    
    return {
        "success": True,
        "message": "Account and all associated data have been deleted.",
        "deletion_id": deletion_record["id"]
    }


@router.get("/data-export")
async def export_user_data(user: dict = Depends(get_current_user)):
    """
    Export all user data (GDPR compliance)
    """
    user_id = user["id"]
    
    # Gather all user data
    fitness_logs = await db.fitness_logs.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    issues = await db.issues.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    analytics = await db.user_analytics.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Remove sensitive fields
    user_data = {k: v for k, v in user.items() if k not in ["_id", "otp"]}
    
    return {
        "profile": user_data,
        "fitness_logs": fitness_logs,
        "issues_reported": issues,
        "activity_logs": analytics,
        "exported_at": now_iso()
    }
