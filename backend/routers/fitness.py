"""Kaizer Fit Router - Fitness tracking, activities, challenges"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user, calculate_calories, estimate_steps

router = APIRouter(prefix="/fitness", tags=["Kaizer Fit"])

# ============== MODELS ==============

class ActivityLog(BaseModel):
    activity_type: str
    duration_minutes: int
    distance_km: Optional[float] = None
    steps: Optional[int] = None
    calories_burned: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    notes: Optional[str] = None
    source: str = "manual"

class WearableSync(BaseModel):
    device_type: str
    activities: List[dict]
    sync_date: str

class CreateChallenge(BaseModel):
    title: str
    description: str
    challenge_type: str
    target_value: int
    start_date: str
    end_date: str

class LiveActivityStart(BaseModel):
    activity_type: str  # running, walking, cycling, yoga, gym, swimming, hiking, sports, dancing
    target_duration: Optional[int] = None  # minutes
    target_distance: Optional[float] = None  # km
    target_calories: Optional[int] = None

class LiveActivityUpdate(BaseModel):
    session_id: str
    current_duration_seconds: int
    current_distance_meters: Optional[float] = None
    current_calories: Optional[int] = None
    current_steps: Optional[int] = None
    heart_rate: Optional[int] = None
    gps_points: Optional[List[dict]] = None  # [{lat, lng, timestamp}]
    speed_kmh: Optional[float] = None
    pace_min_per_km: Optional[float] = None

class LiveActivityEnd(BaseModel):
    session_id: str
    total_duration_seconds: int
    total_distance_meters: Optional[float] = None
    total_calories: Optional[int] = None
    total_steps: Optional[int] = None
    avg_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    avg_speed_kmh: Optional[float] = None
    avg_pace_min_per_km: Optional[float] = None
    route_polyline: Optional[str] = None
    gps_points: Optional[List[dict]] = None

# ============== HELPER ==============

async def update_daily_fitness_summary(user_id: str, date: str):
    """Update daily fitness summary"""
    activities = await db.activities.find({"user_id": user_id, "date": date}, {"_id": 0}).to_list(100)
    
    total_steps = sum(a.get("steps", 0) or 0 for a in activities)
    total_calories = sum(a.get("calories_burned", 0) for a in activities)
    total_duration = sum(a.get("duration_minutes", 0) for a in activities)
    total_distance = sum(a.get("distance_km", 0) or 0 for a in activities)
    
    step_score = min(50, (total_steps / 10000) * 50)
    calorie_score = min(30, (total_calories / 500) * 30)
    duration_score = min(20, (total_duration / 60) * 20)
    fitness_score = round(step_score + calorie_score + duration_score)
    
    summary = {
        "user_id": user_id,
        "date": date,
        "total_steps": total_steps,
        "total_calories": total_calories,
        "total_duration_minutes": total_duration,
        "total_distance_km": round(total_distance, 2),
        "activity_count": len(activities),
        "fitness_score": fitness_score,
        "updated_at": now_iso()
    }
    
    await db.fitness_daily.update_one(
        {"user_id": user_id, "date": date},
        {"$set": summary},
        upsert=True
    )
    
    return summary

# ============== ROUTES ==============

# Activity type configurations with MET values and icons
ACTIVITY_TYPES = {
    "running": {"name_en": "Running", "name_te": "పరుగు", "met": 9.8, "icon": "running", "tracks_gps": True},
    "walking": {"name_en": "Walking", "name_te": "నడక", "met": 3.5, "icon": "walking", "tracks_gps": True},
    "cycling": {"name_en": "Cycling", "name_te": "సైక్లింగ్", "met": 7.5, "icon": "bike", "tracks_gps": True},
    "yoga": {"name_en": "Yoga", "name_te": "యోగా", "met": 2.5, "icon": "yoga", "tracks_gps": False},
    "gym": {"name_en": "Gym Workout", "name_te": "జిమ్", "met": 6.0, "icon": "gym", "tracks_gps": False},
    "swimming": {"name_en": "Swimming", "name_te": "ఈత", "met": 8.0, "icon": "swimming", "tracks_gps": False},
    "hiking": {"name_en": "Hiking", "name_te": "హైకింగ్", "met": 6.0, "icon": "hiking", "tracks_gps": True},
    "sports": {"name_en": "Sports", "name_te": "క్రీడలు", "met": 7.0, "icon": "sports", "tracks_gps": False},
    "dancing": {"name_en": "Dancing", "name_te": "నృత్యం", "met": 5.0, "icon": "dancing", "tracks_gps": False},
    "hiit": {"name_en": "HIIT", "name_te": "HIIT", "met": 8.0, "icon": "hiit", "tracks_gps": False},
    "pilates": {"name_en": "Pilates", "name_te": "పిలేట్స్", "met": 3.0, "icon": "pilates", "tracks_gps": False},
    "badminton": {"name_en": "Badminton", "name_te": "బ్యాడ్మింటన్", "met": 5.5, "icon": "badminton", "tracks_gps": False},
    "cricket": {"name_en": "Cricket", "name_te": "క్రికెట్", "met": 5.0, "icon": "cricket", "tracks_gps": False},
    "football": {"name_en": "Football", "name_te": "ఫుట్‌బాల్", "met": 7.0, "icon": "football", "tracks_gps": True},
    "tennis": {"name_en": "Tennis", "name_te": "టెన్నిస్", "met": 7.0, "icon": "tennis", "tracks_gps": False},
    "skipping": {"name_en": "Skipping", "name_te": "తాడు దూకడం", "met": 12.0, "icon": "skipping", "tracks_gps": False},
    "meditation": {"name_en": "Meditation", "name_te": "ధ్యానం", "met": 1.0, "icon": "meditation", "tracks_gps": False}
}

@router.get("/activity-types")
async def get_activity_types():
    """Get all supported activity types"""
    return ACTIVITY_TYPES

# ============== LIVE ACTIVITY TRACKING ==============

@router.post("/live/start")
async def start_live_activity(data: LiveActivityStart, user: dict = Depends(get_current_user)):
    """Start a live activity tracking session"""
    if data.activity_type not in ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid activity type")
    
    activity_config = ACTIVITY_TYPES[data.activity_type]
    
    session = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": data.activity_type,
        "activity_name": activity_config["name_en"],
        "activity_name_te": activity_config["name_te"],
        "met_value": activity_config["met"],
        "tracks_gps": activity_config["tracks_gps"],
        "target_duration": data.target_duration,
        "target_distance": data.target_distance,
        "target_calories": data.target_calories,
        "status": "active",
        "started_at": now_iso(),
        "gps_points": [],
        "last_update": now_iso()
    }
    
    await db.live_activities.insert_one(session)
    session.pop("_id", None)
    
    return {"success": True, "session": session}

@router.post("/live/update")
async def update_live_activity(data: LiveActivityUpdate, user: dict = Depends(get_current_user)):
    """Update live activity with current stats"""
    session = await db.live_activities.find_one({
        "id": data.session_id,
        "user_id": user["id"],
        "status": "active"
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    # Calculate calories if not provided
    if not data.current_calories:
        weight = user.get("health_profile", {}).get("weight_kg", 70)
        met = session.get("met_value", 5.0)
        hours = data.current_duration_seconds / 3600
        data.current_calories = int(met * weight * hours)
    
    update_data = {
        "current_duration_seconds": data.current_duration_seconds,
        "current_distance_meters": data.current_distance_meters,
        "current_calories": data.current_calories,
        "current_steps": data.current_steps,
        "current_heart_rate": data.heart_rate,
        "current_speed_kmh": data.speed_kmh,
        "current_pace": data.pace_min_per_km,
        "last_update": now_iso()
    }
    
    # Append GPS points if provided
    if data.gps_points:
        update_data["$push"] = {"gps_points": {"$each": data.gps_points}}
    
    await db.live_activities.update_one(
        {"id": data.session_id},
        {"$set": {k: v for k, v in update_data.items() if not k.startswith("$")}}
    )
    
    if data.gps_points:
        await db.live_activities.update_one(
            {"id": data.session_id},
            {"$push": {"gps_points": {"$each": data.gps_points}}}
        )
    
    return {"success": True, "updated": True}

@router.post("/live/end")
async def end_live_activity(data: LiveActivityEnd, user: dict = Depends(get_current_user)):
    """End live activity and save to history"""
    session = await db.live_activities.find_one({
        "id": data.session_id,
        "user_id": user["id"]
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate final stats
    weight = user.get("health_profile", {}).get("weight_kg", 70)
    met = session.get("met_value", 5.0)
    duration_minutes = data.total_duration_seconds // 60
    hours = data.total_duration_seconds / 3600
    
    calories = data.total_calories or int(met * weight * hours)
    distance_km = (data.total_distance_meters or 0) / 1000
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Save to activities collection
    activity = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": session["activity_type"],
        "duration_minutes": duration_minutes,
        "distance_km": round(distance_km, 2),
        "calories_burned": calories,
        "steps": data.total_steps,
        "heart_rate_avg": data.avg_heart_rate,
        "heart_rate_max": data.max_heart_rate,
        "avg_speed_kmh": data.avg_speed_kmh,
        "avg_pace_min_per_km": data.avg_pace_min_per_km,
        "route_polyline": data.route_polyline,
        "gps_points": data.gps_points or session.get("gps_points", []),
        "source": "live_tracking",
        "live_session_id": data.session_id,
        "date": today,
        "started_at": session["started_at"],
        "ended_at": now_iso(),
        "created_at": now_iso()
    }
    
    await db.activities.insert_one(activity)
    activity.pop("_id", None)
    
    # Mark session as completed
    await db.live_activities.update_one(
        {"id": data.session_id},
        {"$set": {
            "status": "completed",
            "ended_at": now_iso(),
            "final_stats": {
                "duration_seconds": data.total_duration_seconds,
                "distance_meters": data.total_distance_meters,
                "calories": calories,
                "steps": data.total_steps
            }
        }}
    )
    
    # Update daily summary
    await update_daily_fitness_summary(user["id"], today)
    
    return {"success": True, "activity": activity}

@router.get("/live/active")
async def get_active_session(user: dict = Depends(get_current_user)):
    """Get user's active live session if any"""
    session = await db.live_activities.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    
    return {"active_session": session}

@router.delete("/live/{session_id}")
async def cancel_live_activity(session_id: str, user: dict = Depends(get_current_user)):
    """Cancel/discard a live activity session"""
    result = await db.live_activities.delete_one({
        "id": session_id,
        "user_id": user["id"]
    })
    
    return {"success": True, "deleted": result.deleted_count > 0}

@router.get("/live/history")
async def get_live_activity_history(limit: int = 10, user: dict = Depends(get_current_user)):
    """Get history of live tracked activities"""
    activities = await db.activities.find(
        {"user_id": user["id"], "source": "live_tracking"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"activities": activities, "count": len(activities)}

# ============== MANUAL ACTIVITY LOGGING ==============

@router.post("/activity")
async def log_activity(activity: ActivityLog, user: dict = Depends(get_current_user)):
    """Log physical activity"""
    valid_types = list(ACTIVITY_TYPES.keys())
    if activity.activity_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid activity type")
    
    health_profile = user.get("health_profile", {})
    weight = health_profile.get("weight_kg", 70)
    
    calories = activity.calories_burned or calculate_calories(activity.activity_type, activity.duration_minutes, weight)
    steps = activity.steps or estimate_steps(activity.activity_type, activity.duration_minutes, activity.distance_km)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    new_activity = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": activity.activity_type,
        "duration_minutes": activity.duration_minutes,
        "distance_km": activity.distance_km,
        "calories_burned": calories,
        "steps": steps,
        "heart_rate_avg": activity.heart_rate_avg,
        "heart_rate_max": activity.heart_rate_max,
        "notes": activity.notes,
        "source": activity.source,
        "date": today,
        "created_at": now_iso()
    }
    
    await db.activities.insert_one(new_activity)
    new_activity.pop("_id", None)
    
    await update_daily_fitness_summary(user["id"], today)
    
    return new_activity

@router.get("/activities")
async def get_activities(days: int = 7, activity_type: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get activities for the past N days"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    query = {"user_id": user["id"], "date": {"$gte": cutoff}}
    if activity_type:
        query["activity_type"] = activity_type
    
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    return activities

@router.get("/dashboard")
async def get_fitness_dashboard(user: dict = Depends(get_current_user)):
    """Get fitness dashboard data"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    
    today_summary = await db.fitness_daily.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    
    weekly = await db.fitness_daily.find(
        {"user_id": user["id"], "date": {"$gte": week_start}}, {"_id": 0}
    ).sort("date", 1).to_list(7)
    
    # Calculate streak
    streak = 0
    check_date = datetime.now(timezone.utc) - timedelta(days=1)
    while True:
        date_str = check_date.strftime("%Y-%m-%d")
        day_data = await db.fitness_daily.find_one({"user_id": user["id"], "date": date_str})
        if day_data and day_data.get("activity_count", 0) > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
        if streak > 365:
            break
    
    return {
        "today": today_summary or {"total_steps": 0, "total_calories": 0, "fitness_score": 0},
        "weekly": weekly,
        "streak": {"current": streak, "best": max(streak, user.get("best_streak", 0))},
        "goals": user.get("fitness_profile", {"daily_step_goal": 10000})
    }

@router.get("/leaderboard")
async def get_leaderboard(period: str = "week", limit: int = 10):
    """Get anonymized leaderboard"""
    if period == "week":
        start_date = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        start_date = datetime.now(timezone.utc).replace(day=1).strftime("%Y-%m-%d")
    
    pipeline = [
        {"$match": {"date": {"$gte": start_date}}},
        {"$group": {
            "_id": "$user_id",
            "total_steps": {"$sum": "$total_steps"},
            "total_calories": {"$sum": "$total_calories"},
            "avg_score": {"$avg": "$fitness_score"}
        }},
        {"$sort": {"total_steps": -1}},
        {"$limit": limit}
    ]
    
    results = await db.fitness_daily.aggregate(pipeline).to_list(limit)
    
    leaderboard = []
    for i, r in enumerate(results):
        user = await db.users.find_one({"id": r["_id"]}, {"_id": 0, "name": 1, "colony": 1})
        leaderboard.append({
            "rank": i + 1,
            "name": user.get("name", "Anonymous")[:2] + "***" if user else "Anonymous",
            "colony": user.get("colony") if user else None,
            "total_steps": r["total_steps"],
            "total_calories": r["total_calories"],
            "avg_score": round(r["avg_score"], 1)
        })
    
    return leaderboard

@router.get("/challenges")
async def get_challenges(status: str = "active"):
    """Get fitness challenges"""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    if status == "active":
        query = {"start_date": {"$lte": now}, "end_date": {"$gte": now}}
    elif status == "upcoming":
        query = {"start_date": {"$gt": now}}
    else:
        query = {"end_date": {"$lt": now}}
    
    challenges = await db.challenges.find(query, {"_id": 0}).sort("start_date", 1).to_list(20)
    
    return challenges

@router.post("/challenges")
async def create_challenge(challenge: CreateChallenge, user: dict = Depends(get_current_user)):
    """Create a fitness challenge"""
    if user.get("role") not in ["admin", "volunteer"]:
        raise HTTPException(status_code=403, detail="Only admins can create challenges")
    
    new_challenge = {
        "id": generate_id(),
        "title": challenge.title,
        "description": challenge.description,
        "challenge_type": challenge.challenge_type,
        "target_value": challenge.target_value,
        "start_date": challenge.start_date,
        "end_date": challenge.end_date,
        "participants": [],
        "created_by": user["id"],
        "created_at": now_iso()
    }
    
    await db.challenges.insert_one(new_challenge)
    new_challenge.pop("_id", None)
    
    return new_challenge

@router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, user: dict = Depends(get_current_user)):
    """Join a challenge"""
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if user["id"] in [p.get("user_id") for p in challenge.get("participants", [])]:
        raise HTTPException(status_code=400, detail="Already joined")
    
    participant = {
        "user_id": user["id"],
        "user_name": user.get("name"),
        "joined_at": now_iso(),
        "progress": 0
    }
    
    await db.challenges.update_one(
        {"id": challenge_id},
        {"$push": {"participants": participant}}
    )
    
    return {"success": True, "message": "Joined challenge"}

@router.get("/stats/ward")
async def get_ward_stats():
    """Get ward-level fitness statistics"""
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    
    pipeline = [
        {"$match": {"date": {"$gte": week_start}}},
        {"$group": {
            "_id": None,
            "total_steps": {"$sum": "$total_steps"},
            "total_calories": {"$sum": "$total_calories"},
            "active_users": {"$addToSet": "$user_id"},
            "total_activities": {"$sum": "$activity_count"}
        }}
    ]
    
    result = await db.fitness_daily.aggregate(pipeline).to_list(1)
    
    if result:
        return {
            "total_steps": result[0]["total_steps"],
            "total_calories": result[0]["total_calories"],
            "active_users": len(result[0]["active_users"]),
            "total_activities": result[0]["total_activities"]
        }
    
    return {"total_steps": 0, "total_calories": 0, "active_users": 0, "total_activities": 0}

@router.post("/sync/wearable")
async def sync_wearable_data(sync_data: WearableSync, user: dict = Depends(get_current_user)):
    """Sync data from wearable devices"""
    synced_count = 0
    
    for activity in sync_data.activities:
        new_activity = {
            "id": generate_id(),
            "user_id": user["id"],
            "activity_type": activity.get("type", "walking"),
            "duration_minutes": activity.get("duration", 0),
            "distance_km": activity.get("distance"),
            "calories_burned": activity.get("calories"),
            "steps": activity.get("steps"),
            "heart_rate_avg": activity.get("heart_rate_avg"),
            "heart_rate_max": activity.get("heart_rate_max"),
            "source": sync_data.device_type,
            "date": sync_data.sync_date,
            "created_at": now_iso()
        }
        await db.activities.insert_one(new_activity)
        synced_count += 1
    
    await update_daily_fitness_summary(user["id"], sync_data.sync_date)
    
    return {"success": True, "synced_activities": synced_count}

# ============== SMART DEVICE INTEGRATION ==============

class PhoneSensorData(BaseModel):
    steps: int
    distance_meters: Optional[float] = None
    calories: Optional[int] = None
    active_minutes: Optional[int] = None
    floors_climbed: Optional[int] = None
    timestamp: str
    source: str = "phone_pedometer"  # phone_pedometer, health_kit, google_fit

class SmartWatchData(BaseModel):
    device_brand: str  # apple, samsung, fitbit, garmin, mi, amazfit
    device_model: Optional[str] = None
    steps: int
    heart_rate_current: Optional[int] = None
    heart_rate_resting: Optional[int] = None
    heart_rate_min: Optional[int] = None
    heart_rate_max: Optional[int] = None
    calories_total: Optional[int] = None
    calories_active: Optional[int] = None
    distance_meters: Optional[float] = None
    active_minutes: Optional[int] = None
    sleep_data: Optional[dict] = None
    blood_oxygen: Optional[float] = None
    stress_level: Optional[int] = None
    sync_timestamp: str

class DeviceConnection(BaseModel):
    device_type: str  # phone, smartwatch
    device_brand: Optional[str] = None
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    permissions: List[str] = []  # steps, heart_rate, sleep, etc.

@router.post("/sync/phone-sensors")
async def sync_phone_sensor_data(data: PhoneSensorData, user: dict = Depends(get_current_user)):
    """Sync step data from phone's built-in sensors (pedometer, accelerometer)"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Calculate estimated calories if not provided
    weight = user.get("health_profile", {}).get("weight_kg", 70)
    estimated_calories = data.calories or int(data.steps * 0.04 * (weight / 70))
    
    # Log as walking activity
    activity = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": "walking",
        "duration_minutes": data.active_minutes or int(data.steps / 100),  # Estimate ~100 steps/min
        "distance_km": (data.distance_meters or data.steps * 0.75) / 1000,  # ~0.75m per step
        "calories_burned": estimated_calories,
        "steps": data.steps,
        "floors_climbed": data.floors_climbed,
        "source": data.source,
        "date": today,
        "synced_at": data.timestamp,
        "created_at": now_iso()
    }
    
    # Check for duplicate sync (same source, same day)
    existing = await db.activities.find_one({
        "user_id": user["id"],
        "date": today,
        "source": data.source
    })
    
    if existing:
        # Update existing record
        await db.activities.update_one(
            {"id": existing["id"]},
            {"$set": {
                "steps": data.steps,
                "distance_km": activity["distance_km"],
                "calories_burned": estimated_calories,
                "floors_climbed": data.floors_climbed,
                "synced_at": data.timestamp,
                "updated_at": now_iso()
            }}
        )
        activity["id"] = existing["id"]
        activity["action"] = "updated"
    else:
        await db.activities.insert_one(activity)
        activity.pop("_id", None)
        activity["action"] = "created"
    
    # Update daily summary
    summary = await update_daily_fitness_summary(user["id"], today)
    
    return {
        "success": True,
        "activity": activity,
        "daily_summary": summary
    }

@router.post("/sync/smartwatch")
async def sync_smartwatch_data(data: SmartWatchData, user: dict = Depends(get_current_user)):
    """Sync comprehensive health data from smartwatch"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Store heart rate data
    if data.heart_rate_current:
        heart_rate_record = {
            "id": generate_id(),
            "user_id": user["id"],
            "date": today,
            "device_brand": data.device_brand,
            "current": data.heart_rate_current,
            "resting": data.heart_rate_resting,
            "min": data.heart_rate_min,
            "max": data.heart_rate_max,
            "recorded_at": data.sync_timestamp,
            "created_at": now_iso()
        }
        await db.heart_rate_logs.insert_one(heart_rate_record)
    
    # Store blood oxygen if available
    if data.blood_oxygen:
        spo2_record = {
            "id": generate_id(),
            "user_id": user["id"],
            "date": today,
            "spo2": data.blood_oxygen,
            "device_brand": data.device_brand,
            "recorded_at": data.sync_timestamp,
            "created_at": now_iso()
        }
        await db.spo2_logs.insert_one(spo2_record)
    
    # Store stress level if available
    if data.stress_level:
        stress_record = {
            "id": generate_id(),
            "user_id": user["id"],
            "date": today,
            "stress_level": data.stress_level,
            "device_brand": data.device_brand,
            "recorded_at": data.sync_timestamp,
            "created_at": now_iso()
        }
        await db.stress_logs.insert_one(stress_record)
    
    # Store sleep data if available
    if data.sleep_data:
        sleep_record = {
            "id": generate_id(),
            "user_id": user["id"],
            "date": today,
            "device_brand": data.device_brand,
            "duration_hours": data.sleep_data.get("duration_hours"),
            "deep_sleep_mins": data.sleep_data.get("deep_sleep_mins"),
            "light_sleep_mins": data.sleep_data.get("light_sleep_mins"),
            "rem_sleep_mins": data.sleep_data.get("rem_sleep_mins"),
            "awake_mins": data.sleep_data.get("awake_mins"),
            "sleep_score": data.sleep_data.get("score"),
            "recorded_at": data.sync_timestamp,
            "created_at": now_iso()
        }
        await db.sleep_logs.insert_one(sleep_record)
    
    # Log activity from smartwatch
    weight = user.get("health_profile", {}).get("weight_kg", 70)
    estimated_calories = data.calories_total or int(data.steps * 0.04 * (weight / 70))
    
    activity = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": "walking",
        "duration_minutes": data.active_minutes or int(data.steps / 100),
        "distance_km": (data.distance_meters or data.steps * 0.75) / 1000,
        "calories_burned": estimated_calories,
        "steps": data.steps,
        "heart_rate_avg": data.heart_rate_current,
        "heart_rate_max": data.heart_rate_max,
        "source": f"smartwatch_{data.device_brand}",
        "device_model": data.device_model,
        "date": today,
        "synced_at": data.sync_timestamp,
        "created_at": now_iso()
    }
    
    # Check for duplicate
    existing = await db.activities.find_one({
        "user_id": user["id"],
        "date": today,
        "source": f"smartwatch_{data.device_brand}"
    })
    
    if existing:
        await db.activities.update_one(
            {"id": existing["id"]},
            {"$set": {
                "steps": data.steps,
                "distance_km": activity["distance_km"],
                "calories_burned": estimated_calories,
                "heart_rate_avg": data.heart_rate_current,
                "heart_rate_max": data.heart_rate_max,
                "synced_at": data.sync_timestamp,
                "updated_at": now_iso()
            }}
        )
    else:
        await db.activities.insert_one(activity)
    
    # Update daily summary
    summary = await update_daily_fitness_summary(user["id"], today)
    
    return {
        "success": True,
        "synced_data": {
            "steps": data.steps,
            "heart_rate": data.heart_rate_current,
            "blood_oxygen": data.blood_oxygen,
            "stress_level": data.stress_level,
            "sleep": data.sleep_data is not None
        },
        "daily_summary": summary
    }

@router.post("/devices/connect")
async def connect_device(device: DeviceConnection, user: dict = Depends(get_current_user)):
    """Register a connected device for the user"""
    connected_device = {
        "id": generate_id(),
        "user_id": user["id"],
        "device_type": device.device_type,
        "device_brand": device.device_brand,
        "device_id": device.device_id,
        "device_name": device.device_name,
        "permissions": device.permissions,
        "connected_at": now_iso(),
        "last_sync": None,
        "is_active": True
    }
    
    # Check if already connected
    existing = await db.connected_devices.find_one({
        "user_id": user["id"],
        "device_type": device.device_type,
        "device_brand": device.device_brand
    })
    
    if existing:
        await db.connected_devices.update_one(
            {"id": existing["id"]},
            {"$set": {
                "device_id": device.device_id,
                "device_name": device.device_name,
                "permissions": device.permissions,
                "is_active": True,
                "updated_at": now_iso()
            }}
        )
        return {"success": True, "message": "Device updated", "device_id": existing["id"]}
    
    await db.connected_devices.insert_one(connected_device)
    connected_device.pop("_id", None)
    
    return {"success": True, "message": "Device connected", "device": connected_device}

@router.get("/devices")
async def get_connected_devices(user: dict = Depends(get_current_user)):
    """Get user's connected devices"""
    devices = await db.connected_devices.find(
        {"user_id": user["id"], "is_active": True},
        {"_id": 0}
    ).to_list(20)
    
    return {"devices": devices, "count": len(devices)}

@router.delete("/devices/{device_id}")
async def disconnect_device(device_id: str, user: dict = Depends(get_current_user)):
    """Disconnect a device"""
    result = await db.connected_devices.update_one(
        {"id": device_id, "user_id": user["id"]},
        {"$set": {"is_active": False, "disconnected_at": now_iso()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"success": True, "message": "Device disconnected"}

@router.get("/health-data/heart-rate")
async def get_heart_rate_history(days: int = 7, user: dict = Depends(get_current_user)):
    """Get heart rate history from smart devices"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    records = await db.heart_rate_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"records": records, "count": len(records)}

@router.get("/health-data/sleep")
async def get_sleep_history(days: int = 7, user: dict = Depends(get_current_user)):
    """Get sleep history from smart devices"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    records = await db.sleep_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    return {"records": records, "count": len(records)}

