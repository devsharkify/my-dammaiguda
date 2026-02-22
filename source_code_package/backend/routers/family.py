"""Family Router - Family tracking, location sharing"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/family", tags=["Family"])

# ============== MODELS ==============

class FamilyMemberRequest(BaseModel):
    phone: str
    relationship: str

class FamilyRequestResponse(BaseModel):
    request_id: str
    action: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    battery_level: Optional[int] = None

# ============== ROUTES ==============

@router.post("/send-request")
async def send_family_request(request: FamilyMemberRequest, user: dict = Depends(get_current_user)):
    """Send a family tracking request to another user"""
    target_user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found. They need to register first.")
    
    if target_user["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself as family member")
    
    existing = await db.family_requests.find_one({
        "$or": [
            {"from_user_id": user["id"], "to_user_id": target_user["id"]},
            {"from_user_id": target_user["id"], "to_user_id": user["id"]}
        ],
        "status": {"$in": ["pending", "accepted"]}
    })
    
    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(status_code=400, detail="Already family members")
        raise HTTPException(status_code=400, detail="Request already pending")
    
    new_request = {
        "id": generate_id(),
        "from_user_id": user["id"],
        "from_user_name": user.get("name"),
        "from_user_phone": user.get("phone"),
        "to_user_id": target_user["id"],
        "to_user_name": target_user.get("name"),
        "to_user_phone": target_user.get("phone"),
        "relationship": request.relationship,
        "status": "pending",
        "created_at": now_iso()
    }
    
    await db.family_requests.insert_one(new_request)
    new_request.pop("_id", None)
    
    return {"success": True, "message": "Request sent successfully", "request": new_request}

@router.post("/respond")
async def respond_to_family_request(response: FamilyRequestResponse, user: dict = Depends(get_current_user)):
    """Accept or decline a family request"""
    request = await db.family_requests.find_one({
        "id": response.request_id,
        "to_user_id": user["id"],
        "status": "pending"
    })
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    
    if response.action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    new_status = "accepted" if response.action == "accept" else "declined"
    
    await db.family_requests.update_one(
        {"id": response.request_id},
        {"$set": {"status": new_status, "responded_at": now_iso()}}
    )
    
    if response.action == "accept":
        family_link = {
            "id": generate_id(),
            "user_id": request["from_user_id"],
            "family_member_id": request["to_user_id"],
            "family_member_name": request["to_user_name"],
            "family_member_phone": request["to_user_phone"],
            "relationship": request["relationship"],
            "created_at": now_iso()
        }
        await db.family_members.insert_one(family_link)
        
        reverse_relationship = {
            "spouse": "spouse", "child": "parent", "parent": "child",
            "sibling": "sibling", "other": "other"
        }.get(request["relationship"], "other")
        
        reverse_link = {
            "id": generate_id(),
            "user_id": request["to_user_id"],
            "family_member_id": request["from_user_id"],
            "family_member_name": request["from_user_name"],
            "family_member_phone": request["from_user_phone"],
            "relationship": reverse_relationship,
            "created_at": now_iso()
        }
        await db.family_members.insert_one(reverse_link)
    
    return {"success": True, "message": f"Request {new_status}"}

@router.get("/requests")
async def get_family_requests(user: dict = Depends(get_current_user)):
    """Get pending family requests"""
    incoming = await db.family_requests.find(
        {"to_user_id": user["id"], "status": "pending"}, {"_id": 0}
    ).to_list(50)
    
    outgoing = await db.family_requests.find(
        {"from_user_id": user["id"], "status": "pending"}, {"_id": 0}
    ).to_list(50)
    
    return {"incoming": incoming, "outgoing": outgoing}

@router.get("/members")
async def get_family_members(user: dict = Depends(get_current_user)):
    """Get list of family members with location and course progress summary"""
    members = await db.family_members.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    
    for member in members:
        # Get location
        location = await db.family_locations.find_one(
            {"user_id": member["family_member_id"]}, {"_id": 0},
            sort=[("updated_at", -1)]
        )
        member["last_location"] = location
        
        # Get course progress summary (for children especially)
        enrollments = await db.enrollments.find(
            {"user_id": member["family_member_id"]}, {"_id": 0}
        ).to_list(20)
        
        total_courses = len(enrollments)
        completed_courses = len([e for e in enrollments if e.get("status") == "completed"])
        in_progress = len([e for e in enrollments if e.get("status") != "completed"])
        
        # Count certificates
        cert_count = await db.certificates.count_documents({"user_id": member["family_member_id"]})
        
        member["course_summary"] = {
            "total_courses": total_courses,
            "completed": completed_courses,
            "in_progress": in_progress,
            "certificates": cert_count
        }
    
    return members

@router.post("/update-location")
async def update_my_location(location: LocationUpdate, user: dict = Depends(get_current_user)):
    """Update current user's location"""
    location_entry = {
        "user_id": user["id"],
        "latitude": location.latitude,
        "longitude": location.longitude,
        "accuracy": location.accuracy,
        "battery_level": location.battery_level,
        "updated_at": now_iso()
    }
    
    await db.family_locations.update_one(
        {"user_id": user["id"]},
        {"$set": location_entry},
        upsert=True
    )
    
    history_entry = {"id": generate_id(), **location_entry}
    await db.family_location_history.insert_one(history_entry)
    
    return {"success": True, "message": "Location updated"}

@router.get("/member/{member_id}/location")
async def get_member_location(member_id: str, user: dict = Depends(get_current_user)):
    """Get a family member's current location"""
    link = await db.family_members.find_one({
        "user_id": user["id"], "family_member_id": member_id
    })
    
    if not link:
        raise HTTPException(status_code=403, detail="Not a family member")
    
    location = await db.family_locations.find_one({"user_id": member_id}, {"_id": 0})
    
    if not location:
        return {"location": None, "message": "Location not available"}
    
    return {"location": location, "member_name": link.get("family_member_name")}

@router.get("/member/{member_id}/history")
async def get_member_location_history(member_id: str, hours: int = 24, user: dict = Depends(get_current_user)):
    """Get a family member's location history"""
    link = await db.family_members.find_one({
        "user_id": user["id"], "family_member_id": member_id
    })
    
    if not link:
        raise HTTPException(status_code=403, detail="Not a family member")
    
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    
    history = await db.family_location_history.find(
        {"user_id": member_id, "updated_at": {"$gte": cutoff}}, {"_id": 0}
    ).sort("updated_at", -1).to_list(500)
    
    return {"history": history, "member_name": link.get("family_member_name")}

@router.delete("/member/{member_id}")
async def remove_family_member(member_id: str, user: dict = Depends(get_current_user)):
    """Remove a family member"""
    await db.family_members.delete_many({
        "$or": [
            {"user_id": user["id"], "family_member_id": member_id},
            {"user_id": member_id, "family_member_id": user["id"]}
        ]
    })
    
    await db.family_requests.update_many(
        {
            "$or": [
                {"from_user_id": user["id"], "to_user_id": member_id},
                {"from_user_id": member_id, "to_user_id": user["id"]}
            ]
        },
        {"$set": {"status": "removed", "removed_at": now_iso()}}
    )
    
    return {"success": True, "message": "Family member removed"}


@router.get("/member/{member_id}/courses")
async def get_member_course_progress(member_id: str, user: dict = Depends(get_current_user)):
    """Get a family member's course progress (for parent tracking children's education)"""
    # Verify family relationship
    link = await db.family_members.find_one({
        "user_id": user["id"], "family_member_id": member_id
    })
    
    if not link:
        raise HTTPException(status_code=403, detail="Not a family member")
    
    # Get enrollments for the family member
    enrollments = await db.enrollments.find(
        {"user_id": member_id}, {"_id": 0}
    ).to_list(50)
    
    # Enrich with course details
    course_progress = []
    for enrollment in enrollments:
        course = await db.courses.find_one(
            {"id": enrollment.get("course_id")}, {"_id": 0, "title": 1, "category": 1, "total_lessons": 1}
        )
        if course:
            total_lessons = course.get("total_lessons", 0) or len(enrollment.get("completed_lessons", []))
            completed = len(enrollment.get("completed_lessons", []))
            progress_pct = round((completed / total_lessons * 100) if total_lessons > 0 else 0)
            
            course_progress.append({
                "course_id": enrollment.get("course_id"),
                "course_title": course.get("title"),
                "category": course.get("category"),
                "completed_lessons": completed,
                "total_lessons": total_lessons,
                "progress_percent": progress_pct,
                "status": enrollment.get("status", "in_progress"),
                "certificate_id": enrollment.get("certificate_id"),
                "enrolled_at": enrollment.get("enrolled_at"),
                "completed_at": enrollment.get("completed_at")
            })
    
    # Get certificates
    certificates = await db.certificates.find(
        {"user_id": member_id}, {"_id": 0}
    ).to_list(50)
    
    return {
        "member_name": link.get("family_member_name"),
        "relationship": link.get("relationship"),
        "courses": course_progress,
        "total_courses": len(course_progress),
        "completed_courses": len([c for c in course_progress if c["status"] == "completed"]),
        "in_progress_courses": len([c for c in course_progress if c["status"] == "in_progress"]),
        "total_certificates": len(certificates)
    }
