"""SOS Router - Emergency alerts and geo-fencing"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from .utils import db, generate_id, now_iso, get_current_user, haversine_distance, is_inside_geofence
from .notifications import trigger_sos_notification, send_sms_notification
import logging

router = APIRouter(prefix="/sos", tags=["SOS & Safety"])

# ============== MODELS ==============

class SOSContact(BaseModel):
    name: str
    phone: str
    relationship: str

class SOSTrigger(BaseModel):
    message: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class GeoFence(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius_meters: int = 500
    member_id: str

# ============== SOS ROUTES ==============

@router.post("/contacts")
async def set_sos_contacts(contacts: List[SOSContact], user: dict = Depends(get_current_user)):
    """Set emergency contacts (max 3)"""
    if len(contacts) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 emergency contacts allowed")
    
    for contact in contacts:
        if not contact.phone or len(contact.phone) < 10:
            raise HTTPException(status_code=400, detail="Invalid phone number")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "emergency_contacts": [c.dict() for c in contacts],
            "emergency_contacts_updated": now_iso()
        }}
    )
    
    return {"success": True, "message": "Emergency contacts saved", "count": len(contacts)}

@router.get("/contacts")
async def get_sos_contacts(user: dict = Depends(get_current_user)):
    """Get user's emergency contacts"""
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return user_data.get("emergency_contacts", [])

@router.post("/trigger")
async def trigger_sos(sos: SOSTrigger, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Trigger SOS alert to all emergency contacts via Push + SMS"""
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    emergency_contacts = user_data.get("emergency_contacts", [])
    
    if not emergency_contacts:
        raise HTTPException(status_code=400, detail="No emergency contacts configured")
    
    lat, lng = sos.latitude, sos.longitude
    if not lat or not lng:
        location = await db.family_locations.find_one({"user_id": user["id"]}, {"_id": 0})
        if location:
            lat, lng = location["latitude"], location["longitude"]
    
    map_link = f"https://www.google.com/maps?q={lat},{lng}" if lat and lng else None
    
    sos_record = {
        "id": generate_id(),
        "user_id": user["id"],
        "user_name": user_data.get("name"),
        "user_phone": user_data.get("phone"),
        "message": sos.message or "EMERGENCY! I need help!",
        "latitude": lat,
        "longitude": lng,
        "map_link": map_link,
        "contacts_notified": [c["phone"] for c in emergency_contacts],
        "status": "triggered",
        "triggered_at": now_iso()
    }
    
    await db.sos_alerts.insert_one(sos_record)
    sos_record.pop("_id", None)
    
    # Get user IDs of emergency contacts (if they have accounts)
    contact_phones = [c["phone"] for c in emergency_contacts]
    contact_users = await db.users.find(
        {"phone": {"$in": contact_phones}},
        {"_id": 0, "id": 1, "phone": 1, "name": 1}
    ).to_list(10)
    
    # Send push notifications to contacts who have accounts
    if contact_users:
        await trigger_sos_notification(
            sos_alert=sos_record,
            triggered_by_name=user_data.get("name", "Someone"),
            emergency_contacts=contact_users
        )
    
    # Send SMS to ALL emergency contacts (regardless of whether they have accounts)
    sms_message = f"🚨 SOS ALERT from {user_data.get('name', 'Your family member')}! {sos.message or 'Emergency - needs help!'}"
    if map_link:
        sms_message += f" Location: {map_link}"
    
    sms_sent = 0
    for contact in emergency_contacts:
        phone = contact.get("phone")
        if phone:
            background_tasks.add_task(send_sms_notification, phone, sms_message)
            sms_sent += 1
            logging.info(f"SOS SMS queued for {contact.get('name')} at {phone}")
    
    return {
        "success": True,
        "message": f"SOS alert sent to {len(emergency_contacts)} contacts",
        "push_sent": len(contact_users),
        "sms_queued": sms_sent,
        "alert": sos_record,
        "contacts_notified": emergency_contacts
    }

@router.get("/history")
async def get_sos_history(user: dict = Depends(get_current_user)):
    """Get SOS alert history"""
    alerts = await db.sos_alerts.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("triggered_at", -1).to_list(50)
    
    return alerts

@router.post("/resolve/{alert_id}")
async def resolve_sos(alert_id: str, user: dict = Depends(get_current_user)):
    """Mark SOS alert as resolved"""
    result = await db.sos_alerts.update_one(
        {"id": alert_id, "user_id": user["id"]},
        {"$set": {"status": "resolved", "resolved_at": now_iso()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "SOS alert resolved"}

# ============== GEO-FENCING ROUTES ==============

@router.post("/geofence")
async def add_geofence(fence: GeoFence, user: dict = Depends(get_current_user)):
    """Add a geofence for a family member"""
    link = await db.family_members.find_one({
        "user_id": user["id"], "family_member_id": fence.member_id
    })
    
    if not link:
        raise HTTPException(status_code=403, detail="Not a family member")
    
    geofence = {
        "id": generate_id(),
        "created_by": user["id"],
        "member_id": fence.member_id,
        "name": fence.name,
        "latitude": fence.latitude,
        "longitude": fence.longitude,
        "radius_meters": fence.radius_meters,
        "is_active": True,
        "created_at": now_iso()
    }
    
    await db.geofences.insert_one(geofence)
    geofence.pop("_id", None)
    
    return {"success": True, "geofence": geofence}

@router.get("/geofences/{member_id}")
async def get_member_geofences(member_id: str, user: dict = Depends(get_current_user)):
    """Get geofences for a family member"""
    if member_id != user["id"]:
        link = await db.family_members.find_one({
            "user_id": user["id"], "family_member_id": member_id
        })
        if not link:
            raise HTTPException(status_code=403, detail="Not a family member")
    
    geofences = await db.geofences.find(
        {"member_id": member_id, "is_active": True}, {"_id": 0}
    ).to_list(50)
    
    return geofences

@router.delete("/geofence/{fence_id}")
async def delete_geofence(fence_id: str, user: dict = Depends(get_current_user)):
    """Delete a geofence"""
    result = await db.geofences.delete_one({
        "id": fence_id, "created_by": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Geofence not found")
    
    return {"success": True, "message": "Geofence deleted"}

@router.get("/check-geofences/{member_id}")
async def check_geofence_status(member_id: str, user: dict = Depends(get_current_user)):
    """Check if family member is inside/outside geofences"""
    link = await db.family_members.find_one({
        "user_id": user["id"], "family_member_id": member_id
    })
    
    if not link:
        raise HTTPException(status_code=403, detail="Not a family member")
    
    location = await db.family_locations.find_one({"user_id": member_id}, {"_id": 0})
    
    if not location:
        return {"status": "unknown", "message": "No location data available"}
    
    geofences = await db.geofences.find(
        {"member_id": member_id, "is_active": True}, {"_id": 0}
    ).to_list(50)
    
    results = []
    for fence in geofences:
        inside = is_inside_geofence(
            location["latitude"], location["longitude"],
            fence["latitude"], fence["longitude"], fence["radius_meters"]
        )
        distance = haversine_distance(
            location["latitude"], location["longitude"],
            fence["latitude"], fence["longitude"]
        )
        results.append({
            "fence_id": fence["id"],
            "fence_name": fence["name"],
            "is_inside": inside,
            "distance_meters": round(distance, 2)
        })
    
    all_outside = all(not r["is_inside"] for r in results) if results else False
    
    return {
        "member_location": location,
        "geofences": results,
        "alert": all_outside and len(results) > 0,
        "alert_message": "Family member is outside all safe zones!" if all_outside else None
    }
