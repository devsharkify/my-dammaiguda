"""User Analytics Router - Track user behavior and access patterns"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user
import logging

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ============== MODELS ==============

class PageViewEvent(BaseModel):
    page: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    duration_seconds: Optional[int] = None

class ActionEvent(BaseModel):
    action: str  # click, submit, share, etc.
    element: str  # button name, form name, etc.
    page: Optional[str] = None
    metadata: Optional[Dict] = None

class FeatureUsageEvent(BaseModel):
    feature: str  # news, astrology, fitness, etc.
    sub_feature: Optional[str] = None  # kundali, compatibility, etc.
    action: str  # view, generate, submit, etc.
    metadata: Optional[Dict] = None


# ============== TRACKING ENDPOINTS ==============

@router.post("/page-view")
async def track_page_view(event: PageViewEvent, request: Request, user: dict = Depends(get_current_user)):
    """Track page view event"""
    try:
        analytics_event = {
            "id": generate_id(),
            "user_id": user["id"],
            "user_phone": user.get("phone_number"),
            "event_type": "page_view",
            "page": event.page,
            "page_title": event.page_title,
            "referrer": event.referrer,
            "duration_seconds": event.duration_seconds,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host if request.client else None,
            "timestamp": now_iso(),
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        await db.user_analytics.insert_one(analytics_event)
        
        # Update user's last active
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_active": now_iso()}}
        )
        
        return {"success": True}
    except Exception as e:
        logging.error(f"Analytics error: {str(e)}")
        return {"success": False}


@router.post("/action")
async def track_action(event: ActionEvent, user: dict = Depends(get_current_user)):
    """Track user action event (clicks, submissions, etc.)"""
    try:
        analytics_event = {
            "id": generate_id(),
            "user_id": user["id"],
            "event_type": "action",
            "action": event.action,
            "element": event.element,
            "page": event.page,
            "metadata": event.metadata,
            "timestamp": now_iso(),
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        await db.user_analytics.insert_one(analytics_event)
        return {"success": True}
    except Exception as e:
        logging.error(f"Analytics error: {str(e)}")
        return {"success": False}


@router.post("/feature")
async def track_feature_usage(event: FeatureUsageEvent, user: dict = Depends(get_current_user)):
    """Track feature usage for learning user behavior"""
    try:
        analytics_event = {
            "id": generate_id(),
            "user_id": user["id"],
            "event_type": "feature_usage",
            "feature": event.feature,
            "sub_feature": event.sub_feature,
            "action": event.action,
            "metadata": event.metadata,
            "timestamp": now_iso(),
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }
        
        await db.user_analytics.insert_one(analytics_event)
        
        # Update user's feature preferences (for personalization)
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$inc": {f"feature_usage.{event.feature}": 1},
                "$set": {"last_active": now_iso()}
            }
        )
        
        return {"success": True}
    except Exception as e:
        logging.error(f"Analytics error: {str(e)}")
        return {"success": False}


# ============== ADMIN ANALYTICS ENDPOINTS ==============

@router.get("/admin/summary")
async def get_analytics_summary(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """Admin: Get analytics summary"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    # Aggregate analytics data
    pipeline = [
        {"$match": {"date": {"$gte": start_date}}},
        {"$group": {
            "_id": "$event_type",
            "count": {"$sum": 1}
        }}
    ]
    
    event_counts = {}
    async for doc in db.user_analytics.aggregate(pipeline):
        event_counts[doc["_id"]] = doc["count"]
    
    # Get unique active users
    unique_users = await db.user_analytics.distinct("user_id", {"date": {"$gte": start_date}})
    
    # Get feature popularity
    feature_pipeline = [
        {"$match": {"date": {"$gte": start_date}, "event_type": "feature_usage"}},
        {"$group": {
            "_id": "$feature",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    feature_popularity = []
    async for doc in db.user_analytics.aggregate(feature_pipeline):
        feature_popularity.append({"feature": doc["_id"], "usage_count": doc["count"]})
    
    # Get page views
    page_pipeline = [
        {"$match": {"date": {"$gte": start_date}, "event_type": "page_view"}},
        {"$group": {
            "_id": "$page",
            "views": {"$sum": 1},
            "avg_duration": {"$avg": "$duration_seconds"}
        }},
        {"$sort": {"views": -1}},
        {"$limit": 10}
    ]
    
    page_views = []
    async for doc in db.user_analytics.aggregate(page_pipeline):
        page_views.append({
            "page": doc["_id"],
            "views": doc["views"],
            "avg_duration_seconds": round(doc["avg_duration"] or 0, 1)
        })
    
    # Daily active users
    dau_pipeline = [
        {"$match": {"date": {"$gte": start_date}}},
        {"$group": {
            "_id": {"date": "$date"},
            "unique_users": {"$addToSet": "$user_id"}
        }},
        {"$project": {
            "date": "$_id.date",
            "active_users": {"$size": "$unique_users"}
        }},
        {"$sort": {"date": 1}}
    ]
    
    daily_active = []
    async for doc in db.user_analytics.aggregate(dau_pipeline):
        daily_active.append({"date": doc["date"], "active_users": doc["active_users"]})
    
    return {
        "period_days": days,
        "start_date": start_date,
        "total_events": sum(event_counts.values()),
        "event_breakdown": event_counts,
        "unique_active_users": len(unique_users),
        "feature_popularity": feature_popularity,
        "top_pages": page_views,
        "daily_active_users": daily_active
    }


@router.get("/admin/user/{user_id}")
async def get_user_analytics(user_id: str, user: dict = Depends(get_current_user)):
    """Admin: Get analytics for specific user"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get user info
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0, "otp": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent activity
    recent_events = await db.user_analytics.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    # Get feature usage
    feature_pipeline = [
        {"$match": {"user_id": user_id, "event_type": "feature_usage"}},
        {"$group": {
            "_id": "$feature",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    
    feature_usage = []
    async for doc in db.user_analytics.aggregate(feature_pipeline):
        feature_usage.append({"feature": doc["_id"], "count": doc["count"]})
    
    # Get session count (unique dates)
    session_dates = await db.user_analytics.distinct("date", {"user_id": user_id})
    
    return {
        "user": target_user,
        "total_sessions": len(session_dates),
        "feature_usage": feature_usage,
        "recent_activity": recent_events
    }


@router.get("/admin/active-users")
async def get_active_users(
    hours: int = 24,
    user: dict = Depends(get_current_user)
):
    """Admin: Get recently active users"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    
    # Get users with recent activity
    active_users = await db.users.find(
        {"last_active": {"$gte": cutoff}},
        {"_id": 0, "otp": 0}
    ).sort("last_active", -1).to_list(100)
    
    return {
        "hours": hours,
        "active_users": active_users,
        "count": len(active_users)
    }


@router.get("/admin/export")
async def export_analytics(
    days: int = 30,
    user: dict = Depends(get_current_user)
):
    """Admin: Export raw analytics data"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    events = await db.user_analytics.find(
        {"date": {"$gte": start_date}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(10000)
    
    return {
        "period_days": days,
        "total_events": len(events),
        "events": events
    }
