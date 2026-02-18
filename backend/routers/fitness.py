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

@router.post("/activity")
async def log_activity(activity: ActivityLog, user: dict = Depends(get_current_user)):
    """Log physical activity"""
    valid_types = ["walking", "running", "cycling", "yoga", "gym", "swimming", "sports", "dancing", "hiking"]
    if activity.activity_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid activity type")
    
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
