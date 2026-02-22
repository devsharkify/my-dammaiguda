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

class WeightEntry(BaseModel):
    weight_kg: float
    notes: Optional[str] = None

class GoalWeight(BaseModel):
    target_weight_kg: float
    avg_speed_kmh: Optional[float] = None
    avg_pace_min_per_km: Optional[float] = None
    route_polyline: Optional[str] = None
    gps_points: Optional[List[dict]] = None

class FitnessProfile(BaseModel):
    """Required profile for first-time fitness users"""
    height_cm: float
    weight_kg: float
    gender: str  # male, female, other
    age: int
    fitness_goal: Optional[str] = None  # weight_loss, muscle_gain, maintain, general_fitness

class ManualActivityRecord(BaseModel):
    """Manual activity recording with editable dates"""
    activity_type: str
    duration_minutes: int
    date: str  # YYYY-MM-DD format
    distance_km: Optional[float] = None
    calories_burned: Optional[int] = None
    steps: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    notes: Optional[str] = None

class SleepEntry(BaseModel):
    """Sleep tracking entry"""
    date: str  # YYYY-MM-DD - the date you woke up
    sleep_start: str  # HH:MM - time went to bed (previous day if after midnight)
    sleep_end: str  # HH:MM - time woke up
    quality: Optional[str] = "good"  # poor, fair, good, excellent
    deep_sleep_minutes: Optional[int] = None
    light_sleep_minutes: Optional[int] = None
    rem_sleep_minutes: Optional[int] = None
    awakenings: Optional[int] = 0
    notes: Optional[str] = None

# ============== HELPER ==============

# Fitness Points Configuration
FITNESS_POINTS_CONFIG = {
    "enabled": True,
    "points_per_1000_steps": 10,
    "points_per_10_min_activity": 5,
    "points_per_100_calories": 2,
    "daily_bonus_threshold_steps": 10000,
    "daily_bonus_points": 50,
    "max_daily_points": 200
}

async def award_fitness_points(user_id: str, activity_data: dict):
    """Award points based on fitness activity"""
    if not FITNESS_POINTS_CONFIG["enabled"]:
        return 0
    
    points = 0
    
    # Points for steps
    steps = activity_data.get("steps", 0) or 0
    if steps > 0:
        points += (steps // 1000) * FITNESS_POINTS_CONFIG["points_per_1000_steps"]
    
    # Points for duration
    duration = activity_data.get("duration_minutes", 0) or 0
    if duration > 0:
        points += (duration // 10) * FITNESS_POINTS_CONFIG["points_per_10_min_activity"]
    
    # Points for calories
    calories = activity_data.get("calories_burned", 0) or 0
    if calories > 0:
        points += (calories // 100) * FITNESS_POINTS_CONFIG["points_per_100_calories"]
    
    # Check daily limit
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    daily_points = await db.fitness_points_log.aggregate([
        {"$match": {"user_id": user_id, "date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]).to_list(1)
    
    current_daily = daily_points[0]["total"] if daily_points else 0
    remaining_daily = FITNESS_POINTS_CONFIG["max_daily_points"] - current_daily
    points = min(points, remaining_daily)
    
    if points > 0:
        # Log the fitness points
        await db.fitness_points_log.insert_one({
            "id": generate_id(),
            "user_id": user_id,
            "points": points,
            "activity_type": activity_data.get("activity_type"),
            "date": today,
            "created_at": now_iso()
        })
        
        # Add to user's wallet (normal points)
        wallet = await db.wallets.find_one({"user_id": user_id})
        if wallet:
            await db.wallets.update_one(
                {"user_id": user_id},
                {"$inc": {"balance": points, "total_earned": points}}
            )
        else:
            await db.wallets.insert_one({
                "id": generate_id(),
                "user_id": user_id,
                "balance": points,
                "privilege_balance": 0,
                "total_earned": points,
                "total_privilege_earned": 0,
                "total_spent": 0,
                "created_at": now_iso()
            })
        
        # Add points transaction
        await db.points_transactions.insert_one({
            "id": generate_id(),
            "user_id": user_id,
            "points": points,
            "point_type": "normal",
            "transaction_type": "earned",
            "description": f"Fitness: {activity_data.get('activity_type', 'activity')} ({duration}min, {steps} steps)",
            "created_at": now_iso()
        })
    
    return points

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

@router.get("/points-config")
async def get_fitness_points_config():
    """Get fitness points configuration"""
    return FITNESS_POINTS_CONFIG

@router.get("/my-points")
async def get_my_fitness_points(user: dict = Depends(get_current_user)):
    """Get user's fitness points summary"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Today's points
    today_log = await db.fitness_points_log.aggregate([
        {"$match": {"user_id": user["id"], "date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]).to_list(1)
    today_points = today_log[0]["total"] if today_log else 0
    
    # This week's points
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    week_log = await db.fitness_points_log.aggregate([
        {"$match": {"user_id": user["id"], "date": {"$gte": week_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]).to_list(1)
    week_points = week_log[0]["total"] if week_log else 0
    
    # All time points from fitness
    all_time_log = await db.fitness_points_log.aggregate([
        {"$match": {"user_id": user["id"]}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]).to_list(1)
    all_time_points = all_time_log[0]["total"] if all_time_log else 0
    
    return {
        "today": today_points,
        "today_remaining": FITNESS_POINTS_CONFIG["max_daily_points"] - today_points,
        "this_week": week_points,
        "all_time": all_time_points,
        "config": FITNESS_POINTS_CONFIG
    }


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
    
    # Award fitness points
    points_awarded = await award_fitness_points(user["id"], activity)
    
    return {"success": True, "activity": activity, "points_awarded": points_awarded}

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
    
    # Award fitness points
    points_awarded = await award_fitness_points(user["id"], new_activity)
    
    return {**new_activity, "points_awarded": points_awarded}

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

@router.get("/health-data/heart-rate")
async def get_heart_rate_history(days: int = 7, user: dict = Depends(get_current_user)):
    """Get heart rate history from smart devices"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    records = await db.heart_rate_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"records": records, "count": len(records)}

# ============== SLEEP TRACKING ==============

@router.post("/sleep")
async def log_sleep(entry: SleepEntry, user: dict = Depends(get_current_user)):
    """Log a sleep entry"""
    
    # Calculate total sleep duration
    try:
        sleep_start = datetime.strptime(entry.sleep_start, "%H:%M")
        sleep_end = datetime.strptime(entry.sleep_end, "%H:%M")
        
        # Handle overnight sleep (e.g., 23:00 to 07:00)
        if sleep_end < sleep_start:
            # Sleep crosses midnight
            total_minutes = (24 * 60 - (sleep_start.hour * 60 + sleep_start.minute)) + (sleep_end.hour * 60 + sleep_end.minute)
        else:
            total_minutes = (sleep_end.hour * 60 + sleep_end.minute) - (sleep_start.hour * 60 + sleep_start.minute)
        
        total_hours = round(total_minutes / 60, 1)
    except:
        total_hours = 0
        total_minutes = 0
    
    # Calculate sleep score (0-100)
    sleep_score = calculate_sleep_score(total_hours, entry.quality, entry.awakenings or 0)
    
    sleep_record = {
        "id": generate_id(),
        "user_id": user["id"],
        "date": entry.date,
        "sleep_start": entry.sleep_start,
        "sleep_end": entry.sleep_end,
        "total_hours": total_hours,
        "total_minutes": total_minutes,
        "quality": entry.quality,
        "deep_sleep_minutes": entry.deep_sleep_minutes,
        "light_sleep_minutes": entry.light_sleep_minutes,
        "rem_sleep_minutes": entry.rem_sleep_minutes,
        "awakenings": entry.awakenings or 0,
        "sleep_score": sleep_score,
        "notes": entry.notes,
        "source": "manual",
        "created_at": now_iso()
    }
    
    # Check if entry exists for this date, update if so
    existing = await db.sleep_logs.find_one({"user_id": user["id"], "date": entry.date})
    if existing:
        await db.sleep_logs.update_one(
            {"id": existing["id"]},
            {"$set": sleep_record}
        )
        sleep_record["id"] = existing["id"]
    else:
        await db.sleep_logs.insert_one(sleep_record)
    
    sleep_record.pop("_id", None)
    
    return {"success": True, "entry": sleep_record}

def calculate_sleep_score(hours: float, quality: str, awakenings: int) -> int:
    """Calculate sleep score from 0-100"""
    score = 50  # Base score
    
    # Hours component (ideal is 7-9 hours)
    if 7 <= hours <= 9:
        score += 30
    elif 6 <= hours < 7 or 9 < hours <= 10:
        score += 20
    elif 5 <= hours < 6 or 10 < hours <= 11:
        score += 10
    elif hours < 5:
        score -= 10
    
    # Quality component
    quality_scores = {"excellent": 20, "good": 15, "fair": 5, "poor": -10}
    score += quality_scores.get(quality, 0)
    
    # Awakenings penalty
    score -= min(awakenings * 5, 20)
    
    return max(0, min(100, score))

@router.get("/health-data/sleep")
async def get_sleep_history(days: int = 7, user: dict = Depends(get_current_user)):
    """Get sleep history from smart devices"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    records = await db.sleep_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    return {"records": records, "count": len(records)}


# ============== WEIGHT TRACKING ==============

@router.post("/weight")
async def log_weight(entry: WeightEntry, user: dict = Depends(get_current_user)):
    """Log a weight entry"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    weight_record = {
        "id": generate_id(),
        "user_id": user["id"],
        "weight_kg": entry.weight_kg,
        "notes": entry.notes,
        "date": today,
        "created_at": now_iso()
    }
    
    await db.weight_logs.insert_one(weight_record)
    weight_record.pop("_id", None)
    
    # Update user's current weight in health profile
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"health_profile.weight_kg": entry.weight_kg}}
    )
    
    return {"success": True, "entry": weight_record}

@router.get("/weight/history")
async def get_weight_history(days: int = 90, user: dict = Depends(get_current_user)):
    """Get weight history for the past N days"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    records = await db.weight_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("date", 1).to_list(365)
    
    # Get goal weight from user profile
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0, "health_profile": 1})
    goal_weight = user_data.get("health_profile", {}).get("goal_weight_kg")
    current_weight = user_data.get("health_profile", {}).get("weight_kg")
    
    return {
        "records": records,
        "count": len(records),
        "current_weight": current_weight,
        "goal_weight": goal_weight
    }

@router.post("/weight/goal")
async def set_goal_weight(goal: GoalWeight, user: dict = Depends(get_current_user)):
    """Set weight goal"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"health_profile.goal_weight_kg": goal.target_weight_kg}}
    )
    
    return {"success": True, "goal_weight_kg": goal.target_weight_kg}

@router.get("/weight/stats")
async def get_weight_stats(user: dict = Depends(get_current_user)):
    """Get comprehensive weight statistics with BMI and trends"""
    # Get all weight logs
    records = await db.weight_logs.find(
        {"user_id": user["id"]},
        {"_id": 0, "weight_kg": 1, "date": 1, "notes": 1}
    ).sort("date", 1).to_list(365)
    
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0, "health_profile": 1})
    health_profile = user_data.get("health_profile", {}) if user_data else {}
    goal_weight = health_profile.get("goal_weight_kg")
    height_cm = health_profile.get("height_cm")
    
    if not records:
        return {
            "current_weight": health_profile.get("weight_kg"),
            "starting_weight": None,
            "lowest_weight": None,
            "highest_weight": None,
            "total_change": None,
            "goal_weight": goal_weight,
            "progress_to_goal": None,
            "bmi": None,
            "bmi_category": None,
            "weekly_avg": None,
            "monthly_avg": None,
            "trend": None,
            "total_entries": 0
        }
    
    weights = [r["weight_kg"] for r in records]
    current = weights[-1] if weights else None
    starting = weights[0] if weights else None
    
    # Calculate BMI
    bmi = None
    bmi_category = None
    if current and height_cm:
        height_m = height_cm / 100
        bmi = round(current / (height_m * height_m), 1)
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25:
            bmi_category = "Normal"
        elif bmi < 30:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"
    
    # Progress to goal
    progress = None
    if goal_weight and starting and current:
        total_to_lose = abs(starting - goal_weight)
        lost_so_far = abs(starting - current)
        if total_to_lose > 0:
            progress = min(100, int((lost_so_far / total_to_lose) * 100))
    
    # Calculate weekly and monthly averages
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    weekly_weights = [r["weight_kg"] for r in records if r.get("date", "") >= week_ago]
    monthly_weights = [r["weight_kg"] for r in records if r.get("date", "") >= month_ago]
    
    weekly_avg = round(sum(weekly_weights) / len(weekly_weights), 1) if weekly_weights else None
    monthly_avg = round(sum(monthly_weights) / len(monthly_weights), 1) if monthly_weights else None
    
    # Calculate trend (last 7 entries)
    trend = None
    if len(weights) >= 2:
        recent = weights[-7:] if len(weights) >= 7 else weights
        if recent[-1] < recent[0]:
            trend = "losing"
        elif recent[-1] > recent[0]:
            trend = "gaining"
        else:
            trend = "stable"
    
    # Weekly change
    weekly_change = None
    if weekly_weights and len(weekly_weights) >= 2:
        weekly_change = round(weekly_weights[-1] - weekly_weights[0], 1)
    
    return {
        "current_weight": current,
        "starting_weight": starting,
        "lowest_weight": min(weights) if weights else None,
        "highest_weight": max(weights) if weights else None,
        "total_change": round(current - starting, 1) if current and starting else None,
        "goal_weight": goal_weight,
        "progress_to_goal": progress,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "weekly_avg": weekly_avg,
        "monthly_avg": monthly_avg,
        "weekly_change": weekly_change,
        "trend": trend,
        "total_entries": len(records),
        "height_cm": height_cm
    }



# ============== STREAKS & BADGES ==============

# Badge definitions
BADGES = {
    "first_workout": {
        "id": "first_workout",
        "name": "First Step",
        "name_te": "మొదటి అడుగు",
        "description": "Complete your first workout",
        "description_te": "మీ మొదటి వ్యాయామం పూర్తి చేయండి",
        "icon": "🎯",
        "color": "from-blue-500 to-cyan-500"
    },
    "streak_3": {
        "id": "streak_3",
        "name": "3-Day Streak",
        "name_te": "3 రోజుల స్ట్రీక్",
        "description": "Work out 3 days in a row",
        "description_te": "వరుసగా 3 రోజులు వ్యాయామం చేయండి",
        "icon": "🔥",
        "color": "from-orange-500 to-red-500"
    },
    "streak_7": {
        "id": "streak_7",
        "name": "Week Warrior",
        "name_te": "వారపు యోధుడు",
        "description": "Work out 7 days in a row",
        "description_te": "వరుసగా 7 రోజులు వ్యాయామం చేయండి",
        "icon": "⚡",
        "color": "from-yellow-500 to-orange-500"
    },
    "streak_30": {
        "id": "streak_30",
        "name": "Monthly Master",
        "name_te": "నెలవారీ మాస్టర్",
        "description": "Work out 30 days in a row",
        "description_te": "వరుసగా 30 రోజులు వ్యాయామం చేయండి",
        "icon": "👑",
        "color": "from-purple-500 to-pink-500"
    },
    "steps_10k": {
        "id": "steps_10k",
        "name": "10K Club",
        "name_te": "10K క్లబ్",
        "description": "Walk 10,000 steps in a day",
        "description_te": "ఒక రోజులో 10,000 అడుగులు నడవండి",
        "icon": "👟",
        "color": "from-green-500 to-emerald-500"
    },
    "calories_500": {
        "id": "calories_500",
        "name": "Calorie Crusher",
        "name_te": "కేలరీ క్రషర్",
        "description": "Burn 500 calories in a day",
        "description_te": "ఒక రోజులో 500 కేలరీలు బర్న్ చేయండి",
        "icon": "🔥",
        "color": "from-red-500 to-rose-500"
    },
    "weight_loss_1": {
        "id": "weight_loss_1",
        "name": "First Kilo Down",
        "name_te": "మొదటి కిలో తగ్గింది",
        "description": "Lose your first kilogram",
        "description_te": "మీ మొదటి కిలోగ్రాము తగ్గించండి",
        "icon": "⚖️",
        "color": "from-teal-500 to-cyan-500"
    },
    "weight_loss_5": {
        "id": "weight_loss_5",
        "name": "5 Kilos Champion",
        "name_te": "5 కిలోల ఛాంపియన్",
        "description": "Lose 5 kilograms total",
        "description_te": "మొత్తం 5 కిలోగ్రాములు తగ్గించండి",
        "icon": "🏆",
        "color": "from-amber-500 to-yellow-500"
    },
    "early_bird": {
        "id": "early_bird",
        "name": "Early Bird",
        "name_te": "ఎర్లీ బర్డ్",
        "description": "Complete a workout before 7 AM",
        "description_te": "ఉదయం 7 గంటల ముందు వ్యాయామం పూర్తి చేయండి",
        "icon": "🌅",
        "color": "from-pink-500 to-orange-500"
    },
    "variety_master": {
        "id": "variety_master",
        "name": "Variety Master",
        "name_te": "వెరైటీ మాస్టర్",
        "description": "Try 5 different activity types",
        "description_te": "5 వివిధ రకాల వ్యాయామాలు ప్రయత్నించండి",
        "icon": "🎯",
        "color": "from-indigo-500 to-purple-500"
    }
}

# ============== SYNC ALL DEVICES ==============

class DeviceConnection(BaseModel):
    """Connect a wearable device"""
    device_type: str  # google_fit, apple_health, fitbit, samsung_health, mi_band, amazfit
    device_name: Optional[str] = None
    access_token: Optional[str] = None  # OAuth token if applicable

@router.post("/devices/connect")
async def connect_device(device: DeviceConnection, user: dict = Depends(get_current_user)):
    """Connect a wearable/fitness device"""
    
    device_record = {
        "id": generate_id(),
        "user_id": user["id"],
        "device_type": device.device_type,
        "device_name": device.device_name or device.device_type.replace("_", " ").title(),
        "status": "connected",
        "access_token": device.access_token,
        "connected_at": now_iso(),
        "last_synced_at": None
    }
    
    # Check if device already connected
    existing = await db.fitness_devices.find_one({
        "user_id": user["id"],
        "device_type": device.device_type
    })
    
    if existing:
        await db.fitness_devices.update_one(
            {"id": existing["id"]},
            {"$set": {
                "status": "connected",
                "access_token": device.access_token,
                "connected_at": now_iso()
            }}
        )
        return {"success": True, "message": "Device reconnected", "device_id": existing["id"]}
    
    await db.fitness_devices.insert_one(device_record)
    device_record.pop("_id", None)
    
    return {"success": True, "message": "Device connected", "device": device_record}

@router.get("/devices")
async def get_connected_devices(user: dict = Depends(get_current_user)):
    """Get all connected fitness devices"""
    devices = await db.fitness_devices.find(
        {"user_id": user["id"]},
        {"_id": 0, "access_token": 0}  # Don't expose tokens
    ).to_list(20)
    
    return {"devices": devices, "count": len(devices)}

@router.delete("/devices/{device_id}")
async def disconnect_device(device_id: str, user: dict = Depends(get_current_user)):
    """Disconnect a fitness device"""
    result = await db.fitness_devices.update_one(
        {"id": device_id, "user_id": user["id"]},
        {"$set": {"status": "disconnected", "disconnected_at": now_iso()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"success": True, "message": "Device disconnected"}

@router.post("/devices/{device_id}/sync")
async def sync_single_device(device_id: str, user: dict = Depends(get_current_user)):
    """Sync data from a specific device"""
    device = await db.fitness_devices.find_one(
        {"id": device_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if device.get("status") != "connected":
        raise HTTPException(status_code=400, detail="Device is not connected")
    
    # Perform sync based on device type
    sync_result = await perform_device_sync(user["id"], device)
    
    # Update last sync time
    await db.fitness_devices.update_one(
        {"id": device_id},
        {"$set": {"last_synced_at": now_iso()}}
    )
    
    return {
        "success": True,
        "message": f"Synced {sync_result['activities_imported']} activities",
        "sync_result": sync_result
    }

async def perform_device_sync(user_id: str, device: dict) -> dict:
    """Perform actual sync with device API"""
    device_type = device.get("device_type")
    activities_imported = 0
    
    # Google Fit sync (if connected via OAuth)
    if device_type == "google_fit" and device.get("access_token"):
        # In production, call Google Fit API
        # For now, check if there's pending sync data
        pending = await db.pending_device_data.find(
            {"user_id": user_id, "device_type": "google_fit", "processed": False}
        ).to_list(100)
        
        for data in pending:
            # Import the activity
            activity = {
                "id": generate_id(),
                "user_id": user_id,
                "activity_type": data.get("activity_type", "walking"),
                "duration_minutes": data.get("duration_minutes", 0),
                "calories_burned": data.get("calories", 0),
                "steps": data.get("steps", 0),
                "distance_km": data.get("distance_km", 0),
                "source": "google_fit",
                "date": data.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
                "created_at": now_iso()
            }
            await db.activities.insert_one(activity)
            await db.pending_device_data.update_one({"_id": data["_id"]}, {"$set": {"processed": True}})
            activities_imported += 1
    
    # Samsung Health / Mi Band / Fitbit - similar pattern
    # These would need their respective APIs integrated
    
    return {
        "device_type": device_type,
        "activities_imported": activities_imported,
        "synced_at": now_iso()
    }

@router.post("/sync-all")
async def sync_all_devices(user: dict = Depends(get_current_user)):
    """Sync data from all connected devices"""
    devices = await db.fitness_devices.find(
        {"user_id": user["id"], "status": "connected"},
        {"_id": 0}
    ).to_list(10)
    
    total_activities = 0
    sync_results = []
    
    for device in devices:
        try:
            result = await perform_device_sync(user["id"], device)
            total_activities += result["activities_imported"]
            sync_results.append({
                "device": device["device_name"],
                "status": "success",
                "activities": result["activities_imported"]
            })
            
            # Update sync timestamp
            await db.fitness_devices.update_one(
                {"id": device["id"]},
                {"$set": {"last_synced_at": now_iso()}}
            )
        except Exception as e:
            sync_results.append({
                "device": device["device_name"],
                "status": "error",
                "error": str(e)
            })
    
    # Log the sync
    await db.device_syncs.insert_one({
        "id": generate_id(),
        "user_id": user["id"],
        "synced_at": now_iso(),
        "devices_synced": len(devices),
        "activities_imported": total_activities,
        "results": sync_results
    })
    
    return {
        "message": "Sync complete",
        "synced_count": len(devices),
        "activities_imported": total_activities,
        "results": sync_results
    }


# ============== FITNESS PROFILE ONBOARDING ==============

@router.get("/profile")
async def get_fitness_profile(user: dict = Depends(get_current_user)):
    """Get user's fitness profile - required for first-time users"""
    profile = await db.fitness_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    
    return {
        "has_profile": profile is not None,
        "profile": profile
    }

@router.post("/profile")
async def create_fitness_profile(profile: FitnessProfile, user: dict = Depends(get_current_user)):
    """Create or update fitness profile - required before using fitness features"""
    # Calculate BMI
    height_m = profile.height_cm / 100
    bmi = round(profile.weight_kg / (height_m * height_m), 1)
    
    # Determine BMI category
    if bmi < 18.5:
        bmi_category = "underweight"
    elif bmi < 25:
        bmi_category = "normal"
    elif bmi < 30:
        bmi_category = "overweight"
    else:
        bmi_category = "obese"
    
    # Calculate recommended daily calories (Mifflin-St Jeor Equation)
    if profile.gender == "male":
        bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    else:
        bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161
    
    # Assume moderate activity level (multiply by 1.55)
    recommended_calories = int(bmr * 1.55)
    
    fitness_profile = {
        "id": generate_id(),
        "user_id": user["id"],
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "gender": profile.gender,
        "age": profile.age,
        "fitness_goal": profile.fitness_goal or "general_fitness",
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmr": int(bmr),
        "recommended_calories": recommended_calories,
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    # Upsert
    existing = await db.fitness_profiles.find_one({"user_id": user["id"]})
    if existing:
        await db.fitness_profiles.update_one(
            {"user_id": user["id"]},
            {"$set": {**fitness_profile, "id": existing["id"]}}
        )
    else:
        await db.fitness_profiles.insert_one(fitness_profile)
    
    # Also update user's health_profile
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"health_profile": {
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "gender": profile.gender,
            "age": profile.age,
            "bmi": bmi
        }}}
    )
    
    # Log initial weight
    await db.weight_logs.insert_one({
        "id": generate_id(),
        "user_id": user["id"],
        "weight_kg": profile.weight_kg,
        "notes": "Initial weight from profile setup",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": now_iso()
    })
    
    return {
        "success": True,
        "profile": {k: v for k, v in fitness_profile.items() if k != "_id"},
        "message": "Fitness profile created successfully"
    }

# ============== MANUAL ACTIVITY RECORDING (WITH EDITABLE DATES) ==============

@router.post("/record")
async def record_manual_activity(record: ManualActivityRecord, user: dict = Depends(get_current_user)):
    """Record a manual fitness activity with a custom date"""
    # Validate activity type
    if record.activity_type not in ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid activity type")
    
    # Validate date format
    try:
        activity_date = datetime.strptime(record.date, "%Y-%m-%d")
        if activity_date > datetime.now():
            raise HTTPException(status_code=400, detail="Cannot record future activities")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get user's weight for calorie calculation
    profile = await db.fitness_profiles.find_one({"user_id": user["id"]})
    weight = profile.get("weight_kg", 70) if profile else 70
    
    # Calculate calories if not provided
    if not record.calories_burned:
        met = ACTIVITY_TYPES[record.activity_type]["met"]
        hours = record.duration_minutes / 60
        record.calories_burned = int(met * weight * hours)
    
    # Estimate steps if not provided and applicable
    if not record.steps and record.activity_type in ["walking", "running", "hiking"]:
        # Estimate ~100 steps per minute for walking, ~150 for running
        step_rate = 150 if record.activity_type == "running" else 100
        record.steps = record.duration_minutes * step_rate
    
    activity = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": record.activity_type,
        "activity_name": ACTIVITY_TYPES[record.activity_type]["name_en"],
        "duration_minutes": record.duration_minutes,
        "distance_km": record.distance_km,
        "calories_burned": record.calories_burned,
        "steps": record.steps,
        "heart_rate_avg": record.heart_rate_avg,
        "notes": record.notes,
        "source": "manual_record",
        "date": record.date,
        "created_at": now_iso()
    }
    
    await db.activities.insert_one(activity)
    activity.pop("_id", None)
    
    # Update daily summary for that date
    await update_daily_fitness_summary(user["id"], record.date)
    
    # Award fitness points (only for today's date)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    points_awarded = 0
    if record.date == today:
        points_awarded = await award_fitness_points(user["id"], activity)
    
    return {
        "success": True,
        "activity": activity,
        "points_awarded": points_awarded,
        "message": f"Activity recorded for {record.date}" + (f" (+{points_awarded} points!)" if points_awarded else "")
    }

@router.get("/records")
async def get_activity_records(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    activity_type: Optional[str] = None,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user's activity records with optional filters"""
    query = {"user_id": user["id"]}
    
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        query.setdefault("date", {})["$lte"] = end_date
    if activity_type:
        query["activity_type"] = activity_type
    
    records = await db.activities.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    
    # Calculate totals
    total_calories = sum(r.get("calories_burned", 0) for r in records)
    total_duration = sum(r.get("duration_minutes", 0) for r in records)
    total_steps = sum(r.get("steps", 0) or 0 for r in records)
    
    return {
        "records": records,
        "count": len(records),
        "totals": {
            "calories": total_calories,
            "duration_minutes": total_duration,
            "steps": total_steps
        }
    }

@router.put("/records/{activity_id}")
async def update_activity_record(activity_id: str, record: ManualActivityRecord, user: dict = Depends(get_current_user)):
    """Update an existing activity record"""
    existing = await db.activities.find_one({"id": activity_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    if existing.get("source") not in ["manual", "manual_record"]:
        raise HTTPException(status_code=400, detail="Can only edit manually recorded activities")
    
    update_data = {
        "activity_type": record.activity_type,
        "duration_minutes": record.duration_minutes,
        "date": record.date,
        "distance_km": record.distance_km,
        "calories_burned": record.calories_burned,
        "steps": record.steps,
        "heart_rate_avg": record.heart_rate_avg,
        "notes": record.notes,
        "updated_at": now_iso()
    }
    
    await db.activities.update_one({"id": activity_id}, {"$set": update_data})
    
    # Update summaries for both old and new dates
    old_date = existing.get("date")
    if old_date:
        await update_daily_fitness_summary(user["id"], old_date)
    await update_daily_fitness_summary(user["id"], record.date)
    
    return {"success": True, "message": "Activity updated"}

@router.delete("/records/{activity_id}")
async def delete_activity_record(activity_id: str, user: dict = Depends(get_current_user)):
    """Delete an activity record"""
    existing = await db.activities.find_one({"id": activity_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    await db.activities.delete_one({"id": activity_id})
    
    # Update daily summary
    if existing.get("date"):
        await update_daily_fitness_summary(user["id"], existing["date"])
    
    return {"success": True, "message": "Activity deleted"}

@router.get("/streaks")
async def get_user_streaks(user: dict = Depends(get_current_user)):
    """Get user's current streak and streak history"""
    today = datetime.now(timezone.utc).date()
    
    # Get all activity dates for the user
    activities = await db.fitness_activities.find(
        {"user_id": user["id"]},
        {"_id": 0, "date": 1}
    ).to_list(365)
    
    # Also count live activities
    live_activities = await db.fitness_live_sessions.find(
        {"user_id": user["id"], "status": "completed"},
        {"_id": 0, "ended_at": 1}
    ).to_list(365)
    
    # Get unique dates with activity
    activity_dates = set()
    for a in activities:
        if a.get("date"):
            try:
                d = datetime.strptime(a["date"], "%Y-%m-%d").date()
                activity_dates.add(d)
            except:
                pass
    
    for la in live_activities:
        if la.get("ended_at"):
            try:
                d = datetime.fromisoformat(la["ended_at"].replace("Z", "+00:00")).date()
                activity_dates.add(d)
            except:
                pass
    
    # Calculate current streak
    current_streak = 0
    check_date = today
    
    # Check if user was active today or yesterday
    if today in activity_dates:
        current_streak = 1
        check_date = today - timedelta(days=1)
    elif (today - timedelta(days=1)) in activity_dates:
        current_streak = 1
        check_date = today - timedelta(days=2)
    else:
        # Streak is broken
        current_streak = 0
        check_date = None
    
    # Count consecutive days
    if check_date:
        while check_date in activity_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
    
    # Get longest streak ever
    sorted_dates = sorted(activity_dates)
    longest_streak = 0
    temp_streak = 1
    
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
    longest_streak = max(longest_streak, temp_streak) if sorted_dates else 0
    
    # Check if streak was updated today
    active_today = today in activity_dates
    
    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "active_today": active_today,
        "total_active_days": len(activity_dates),
        "streak_status": "active" if current_streak > 0 else "broken"
    }

@router.get("/badges")
async def get_user_badges(user: dict = Depends(get_current_user)):
    """Get all badges - earned and locked"""
    # Get user's earned badges
    earned_badges = await db.user_badges.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    earned_ids = {b["badge_id"] for b in earned_badges}
    
    # Build response with all badges
    all_badges = []
    for badge_id, badge_info in BADGES.items():
        badge = {**badge_info}
        if badge_id in earned_ids:
            earned = next((b for b in earned_badges if b["badge_id"] == badge_id), None)
            badge["earned"] = True
            badge["earned_at"] = earned.get("earned_at") if earned else None
        else:
            badge["earned"] = False
            badge["earned_at"] = None
        all_badges.append(badge)
    
    # Sort: earned first, then by name
    all_badges.sort(key=lambda x: (not x["earned"], x["name"]))
    
    return {
        "badges": all_badges,
        "earned_count": len(earned_ids),
        "total_count": len(BADGES)
    }

@router.post("/badges/check")
async def check_and_award_badges(user: dict = Depends(get_current_user)):
    """Check if user has earned any new badges"""
    user_id = user["id"]
    new_badges = []
    
    # Get existing badges
    existing = await db.user_badges.find({"user_id": user_id}, {"badge_id": 1}).to_list(100)
    existing_ids = {b["badge_id"] for b in existing}
    
    # Get user stats
    activities = await db.fitness_activities.find({"user_id": user_id}).to_list(1000)
    live_sessions = await db.fitness_live_sessions.find({"user_id": user_id, "status": "completed"}).to_list(1000)
    weight_logs = await db.weight_logs.find({"user_id": user_id}).sort("date", 1).to_list(365)
    
    # Check first_workout
    if "first_workout" not in existing_ids and (len(activities) > 0 or len(live_sessions) > 0):
        new_badges.append("first_workout")
    
    # Check streaks
    today = datetime.now(timezone.utc).date()
    activity_dates = set()
    for a in activities:
        if a.get("date"):
            try:
                d = datetime.strptime(a["date"], "%Y-%m-%d").date()
                activity_dates.add(d)
            except:
                pass
    for la in live_sessions:
        if la.get("ended_at"):
            try:
                d = datetime.fromisoformat(la["ended_at"].replace("Z", "+00:00")).date()
                activity_dates.add(d)
            except:
                pass
    
    # Calculate streak
    current_streak = 0
    check_date = today
    if today in activity_dates:
        current_streak = 1
        check_date = today - timedelta(days=1)
    elif (today - timedelta(days=1)) in activity_dates:
        current_streak = 1
        check_date = today - timedelta(days=2)
    
    if check_date:
        while check_date in activity_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
    
    if "streak_3" not in existing_ids and current_streak >= 3:
        new_badges.append("streak_3")
    if "streak_7" not in existing_ids and current_streak >= 7:
        new_badges.append("streak_7")
    if "streak_30" not in existing_ids and current_streak >= 30:
        new_badges.append("streak_30")
    
    # Check steps (10k in a day)
    if "steps_10k" not in existing_ids:
        for a in activities:
            if a.get("steps", 0) >= 10000:
                new_badges.append("steps_10k")
                break
    
    # Check calories (500 in a day)
    if "calories_500" not in existing_ids:
        for a in activities:
            if a.get("calories_burned", 0) >= 500:
                new_badges.append("calories_500")
                break
        for ls in live_sessions:
            if ls.get("total_calories", 0) >= 500:
                new_badges.append("calories_500")
                break
    
    # Check weight loss
    if len(weight_logs) >= 2:
        first_weight = weight_logs[0].get("weight_kg", 0)
        current_weight = weight_logs[-1].get("weight_kg", 0)
        weight_lost = first_weight - current_weight
        
        if "weight_loss_1" not in existing_ids and weight_lost >= 1:
            new_badges.append("weight_loss_1")
        if "weight_loss_5" not in existing_ids and weight_lost >= 5:
            new_badges.append("weight_loss_5")
    
    # Check variety master (5 different activity types)
    if "variety_master" not in existing_ids:
        activity_types = set()
        for a in activities:
            if a.get("activity_type"):
                activity_types.add(a.get("activity_type"))
        for ls in live_sessions:
            if ls.get("activity_type"):
                activity_types.add(ls.get("activity_type"))
        if len(activity_types) >= 5:
            new_badges.append("variety_master")
    
    # Award new badges
    awarded = []
    for badge_id in new_badges:
        if badge_id in existing_ids:
            continue
        
        badge_doc = {
            "id": generate_id(),
            "user_id": user_id,
            "badge_id": badge_id,
            "earned_at": now_iso()
        }
        await db.user_badges.insert_one(badge_doc)
        awarded.append(BADGES[badge_id])
        existing_ids.add(badge_id)  # Prevent duplicates
    
    return {
        "new_badges": awarded,
        "new_badges_count": len(awarded)
    }



# ============== TODAY'S STATS & WEEKLY SUMMARY ==============

@router.get("/today-stats")
async def get_today_stats(user: dict = Depends(get_current_user)):
    """Get today's fitness summary for dashboard"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get today's activities
    activities = await db.activities.find(
        {"user_id": user["id"], "date": today},
        {"_id": 0}
    ).to_list(100)
    
    # Get live sessions from today
    live_sessions = await db.live_activities.find(
        {"user_id": user["id"], "status": "completed", "end_time": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(100)
    
    # Aggregate stats
    total_steps = 0
    total_calories = 0
    total_active_minutes = 0
    heart_rates = []
    total_distance = 0
    
    for a in activities:
        total_steps += a.get("steps", 0) or 0
        total_calories += a.get("calories_burned", 0) or 0
        total_active_minutes += a.get("duration_minutes", 0) or 0
        total_distance += a.get("distance_km", 0) or 0
        if a.get("heart_rate_avg"):
            heart_rates.append(a.get("heart_rate_avg"))
    
    for ls in live_sessions:
        total_steps += ls.get("total_steps", 0) or 0
        total_calories += ls.get("total_calories", 0) or 0
        if ls.get("total_duration_seconds"):
            total_active_minutes += ls.get("total_duration_seconds", 0) // 60
        if ls.get("total_distance_meters"):
            total_distance += ls.get("total_distance_meters", 0) / 1000
        if ls.get("avg_heart_rate"):
            heart_rates.append(ls.get("avg_heart_rate"))
    
    # Get sleep data from database
    sleep_record = await db.sleep_logs.find_one(
        {"user_id": user["id"], "date": today},
        {"_id": 0}
    )
    sleep_hours = sleep_record.get("total_hours", 0) if sleep_record else 0
    sleep_score = sleep_record.get("sleep_score", 0) if sleep_record else 0
    
    # Calculate average heart rate
    heart_rate_avg = round(sum(heart_rates) / len(heart_rates)) if heart_rates else 72
    
    return {
        "steps": total_steps,
        "calories": total_calories,
        "distance": round(total_distance, 1),
        "activeMinutes": total_active_minutes,
        "sleepHours": sleep_hours,
        "sleepScore": sleep_score,
        "heartRateAvg": heart_rate_avg
    }

@router.get("/weekly-summary")
async def get_weekly_summary(user: dict = Depends(get_current_user)):
    """Get weekly activity summary for charts"""
    today = datetime.now(timezone.utc)
    week_start = today - timedelta(days=today.weekday())  # Monday
    
    days = []
    day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for i in range(7):
        date = week_start + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        is_past_or_today = date <= today
        
        # Get activities for this day
        activities = await db.activities.find(
            {"user_id": user["id"], "date": date_str},
            {"_id": 0, "steps": 1}
        ).to_list(100)
        
        total_steps = sum(a.get("steps", 0) or 0 for a in activities)
        
        days.append({
            "day": day_names[i],
            "date": date_str,
            "steps": total_steps,
            "active": is_past_or_today
        })
    
    return {"days": days}

