"""Issues Router - Issue reporting and tracking"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/issues", tags=["Issues"])

# ============== MODELS ==============

class CreateIssue(BaseModel):
    category: str
    title: str
    description: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_address: Optional[str] = None
    media_urls: List[str] = []

class UpdateIssueStatus(BaseModel):
    status: str
    notes: Optional[str] = None

# ============== ISSUE CATEGORIES ==============

ISSUE_CATEGORIES = {
    "dump_yard": {"en": "Dump Yard", "te": "డంప్ యార్డ్"},
    "garbage": {"en": "Garbage", "te": "చెత్త"},
    "drainage": {"en": "Drainage", "te": "డ్రైనేజీ"},
    "water": {"en": "Water Supply", "te": "నీటి సరఫరా"},
    "roads": {"en": "Roads", "te": "రోడ్లు"},
    "streetlights": {"en": "Street Lights", "te": "వీధి దీపాలు"},
    "parks": {"en": "Parks", "te": "పార్కులు"},
    "other": {"en": "Other", "te": "ఇతర"}
}

# ============== ROUTES ==============

@router.get("/categories")
async def get_categories():
    """Get issue categories"""
    return ISSUE_CATEGORIES

@router.post("")
async def create_issue(issue: CreateIssue, user: dict = Depends(get_current_user)):
    """Create a new issue report"""
    if issue.category not in ISSUE_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    new_issue = {
        "id": generate_id(),
        "category": issue.category,
        "category_label": ISSUE_CATEGORIES[issue.category]["en"],
        "category_label_te": ISSUE_CATEGORIES[issue.category]["te"],
        "title": issue.title,
        "description": issue.description,
        "location": {
            "lat": issue.location_lat,
            "lng": issue.location_lng,
            "address": issue.location_address
        },
        "media_urls": issue.media_urls,
        "status": "reported",
        "reported_by": user["id"],
        "reporter_name": user.get("name"),
        "reporter_colony": user.get("colony"),
        "created_at": now_iso(),
        "history": [{
            "status": "reported",
            "timestamp": now_iso(),
            "by": user["id"]
        }]
    }
    
    await db.issues.insert_one(new_issue)
    new_issue.pop("_id", None)
    
    return new_issue

@router.get("")
async def get_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    colony: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get issues with filters"""
    query = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if colony:
        query["reporter_colony"] = colony
    
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.issues.count_documents(query)
    
    return {"issues": issues, "total": total, "skip": skip, "limit": limit}

@router.get("/my")
async def get_my_issues(user: dict = Depends(get_current_user)):
    """Get issues reported by current user"""
    issues = await db.issues.find(
        {"reported_by": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return issues

@router.get("/{issue_id}")
async def get_issue(issue_id: str):
    """Get issue details"""
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.put("/{issue_id}/status")
async def update_issue_status(issue_id: str, update: UpdateIssueStatus, user: dict = Depends(get_current_user)):
    """Update issue status (volunteer/admin only)"""
    if user.get("role") not in ["volunteer", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    valid_statuses = ["reported", "verified", "in_progress", "escalated", "resolved", "closed"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    history_entry = {
        "status": update.status,
        "notes": update.notes,
        "timestamp": now_iso(),
        "by": user["id"],
        "by_name": user.get("name")
    }
    
    result = await db.issues.update_one(
        {"id": issue_id},
        {
            "$set": {"status": update.status, "updated_at": now_iso()},
            "$push": {"history": history_entry}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    return {"success": True, "status": update.status}

@router.get("/stats/summary")
async def get_issue_stats():
    """Get issue statistics"""
    pipeline = [
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    status_stats = await db.issues.aggregate(pipeline).to_list(10)
    
    category_pipeline = [
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1}
        }}
    ]
    
    category_stats = await db.issues.aggregate(category_pipeline).to_list(10)
    
    total = await db.issues.count_documents({})
    
    return {
        "total": total,
        "by_status": {s["_id"]: s["count"] for s in status_stats},
        "by_category": {c["_id"]: c["count"] for c in category_stats}
    }
