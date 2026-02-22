"""Push Notification Router - PWA notifications for SOS, geo-fencing, news, and community"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from .utils import db, generate_id, now_iso, get_current_user
import json
import logging
import os
from pywebpush import webpush, WebPushException

router = APIRouter(prefix="/notifications", tags=["Push Notifications"])

# Load VAPID configuration from environment
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY_FILE = os.environ.get("VAPID_PRIVATE_KEY_FILE", "/app/backend/private_key.pem")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:admin@mydammaiguda.com")

# ============== MODELS ==============

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # Contains p256dh and auth keys
    user_agent: Optional[str] = None

class NotificationPreferences(BaseModel):
    sos_alerts: bool = True
    geofence_alerts: bool = True
    news_updates: bool = True
    community_updates: bool = True
    health_reminders: bool = True
    challenge_updates: bool = True
    grievance_updates: bool = True
    panchangam_reminder: bool = True
    announcements: bool = True

class BroadcastNotification(BaseModel):
    title: str
    body: str
    title_te: Optional[str] = None
    body_te: Optional[str] = None
    category: str  # sos, geofence, news, community, health, grievance, panchangam, announcement
    target_users: Optional[List[str]] = None  # None = all users
    target_area: Optional[str] = None  # None = all areas
    priority: str = "normal"  # normal, high, urgent
    data: Optional[dict] = None
    url: Optional[str] = None
    image: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

async def send_push_notification(subscription: dict, payload: dict) -> bool:
    """
    Send push notification to a subscriber using real web push.
    Falls back to storing notification for client polling if push fails.
    """
    try:
        # Store notification for history/polling fallback
        notification = {
            "id": generate_id(),
            "user_id": subscription.get("user_id"),
            "subscription_id": subscription.get("id"),
            "payload": payload,
            "status": "pending",
            "created_at": now_iso()
        }
        await db.pending_notifications.insert_one(notification)
        
        # Send real web push notification
        if VAPID_PUBLIC_KEY and os.path.exists(VAPID_PRIVATE_KEY_FILE):
            try:
                webpush(
                    subscription_info={
                        "endpoint": subscription["endpoint"],
                        "keys": subscription["keys"]
                    },
                    data=json.dumps(payload),
                    vapid_private_key=VAPID_PRIVATE_KEY_FILE,
                    vapid_claims={"sub": VAPID_CLAIMS_EMAIL}
                )
                # Update status to sent
                await db.pending_notifications.update_one(
                    {"id": notification["id"]},
                    {"$set": {"status": "sent", "sent_at": now_iso()}}
                )
                logging.info(f"Push notification sent to {subscription.get('user_id')}")
                return True
            except WebPushException as e:
                logging.error(f"WebPush error: {str(e)}")
                # If subscription is invalid (410 Gone), mark it inactive
                if e.response and e.response.status_code == 410:
                    await db.push_subscriptions.update_one(
                        {"id": subscription.get("id")},
                        {"$set": {"is_active": False, "deactivated_at": now_iso()}}
                    )
                return False
        else:
            logging.warning("VAPID keys not configured - notification stored for polling")
            return True
    except Exception as e:
        logging.error(f"Push notification error: {str(e)}")
        return False

async def notify_user(user_id: str, notification_type: str, payload: dict):
    """Send notification to a specific user if they have opted in"""
    # Check user preferences
    prefs = await db.notification_preferences.find_one({"user_id": user_id})
    
    # Map notification type to preference field
    pref_map = {
        "sos": "sos_alerts",
        "geofence": "geofence_alerts",
        "news": "news_updates",
        "community": "community_updates",
        "health": "health_reminders",
        "challenge": "challenge_updates"
    }
    
    pref_field = pref_map.get(notification_type, "community_updates")
    
    # Default to True if no preferences set
    if prefs and not prefs.get(pref_field, True):
        return False  # User opted out
    
    # Get user's push subscriptions
    subscriptions = await db.push_subscriptions.find(
        {"user_id": user_id, "is_active": True}
    ).to_list(10)
    
    results = []
    for sub in subscriptions:
        result = await send_push_notification(sub, payload)
        results.append(result)
    
    return any(results)

async def notify_multiple_users(user_ids: List[str], notification_type: str, payload: dict):
    """Send notification to multiple users"""
    results = []
    for user_id in user_ids:
        result = await notify_user(user_id, notification_type, payload)
        results.append(result)
    return sum(results)

async def broadcast_notification(notification_type: str, payload: dict, exclude_users: List[str] = None):
    """Broadcast notification to all subscribed users"""
    query = {"is_active": True}
    if exclude_users:
        query["user_id"] = {"$nin": exclude_users}
    
    subscriptions = await db.push_subscriptions.find(query).to_list(1000)
    
    results = []
    for sub in subscriptions:
        # Check preferences
        prefs = await db.notification_preferences.find_one({"user_id": sub["user_id"]})
        pref_map = {
            "sos": "sos_alerts",
            "geofence": "geofence_alerts", 
            "news": "news_updates",
            "community": "community_updates"
        }
        pref_field = pref_map.get(notification_type, "community_updates")
        
        if prefs and not prefs.get(pref_field, True):
            continue
        
        result = await send_push_notification(sub, payload)
        results.append(result)
    
    return sum(results)

# ============== ROUTES ==============

@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Get the VAPID public key for push notification subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"public_key": VAPID_PUBLIC_KEY}

@router.post("/subscribe")
async def subscribe_push(subscription: PushSubscription, user: dict = Depends(get_current_user)):
    """Subscribe to push notifications"""
    
    # Check if already subscribed with same endpoint
    existing = await db.push_subscriptions.find_one({
        "user_id": user["id"],
        "endpoint": subscription.endpoint
    })
    
    if existing:
        # Update existing subscription
        await db.push_subscriptions.update_one(
            {"id": existing["id"]},
            {"$set": {
                "keys": subscription.keys,
                "is_active": True,
                "updated_at": now_iso()
            }}
        )
        return {"success": True, "message": "Subscription updated", "subscription_id": existing["id"]}
    
    # Create new subscription
    new_sub = {
        "id": generate_id(),
        "user_id": user["id"],
        "endpoint": subscription.endpoint,
        "keys": subscription.keys,
        "user_agent": subscription.user_agent,
        "is_active": True,
        "created_at": now_iso()
    }
    
    await db.push_subscriptions.insert_one(new_sub)
    
    # Initialize default preferences
    existing_prefs = await db.notification_preferences.find_one({"user_id": user["id"]})
    if not existing_prefs:
        default_prefs = {
            "id": generate_id(),
            "user_id": user["id"],
            "sos_alerts": True,
            "geofence_alerts": True,
            "news_updates": True,
            "community_updates": True,
            "health_reminders": True,
            "challenge_updates": True,
            "created_at": now_iso()
        }
        await db.notification_preferences.insert_one(default_prefs)
    
    return {"success": True, "message": "Subscribed to notifications", "subscription_id": new_sub["id"]}

@router.delete("/subscribe")
async def unsubscribe_push(user: dict = Depends(get_current_user)):
    """Unsubscribe from all push notifications"""
    result = await db.push_subscriptions.update_many(
        {"user_id": user["id"]},
        {"$set": {"is_active": False, "unsubscribed_at": now_iso()}}
    )
    
    return {"success": True, "message": f"Unsubscribed {result.modified_count} subscription(s)"}

@router.get("/preferences")
async def get_notification_preferences(user: dict = Depends(get_current_user)):
    """Get notification preferences"""
    prefs = await db.notification_preferences.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not prefs:
        return {
            "sos_alerts": True,
            "geofence_alerts": True,
            "news_updates": True,
            "community_updates": True,
            "health_reminders": True,
            "challenge_updates": True
        }
    
    return prefs

@router.put("/preferences")
async def update_notification_preferences(prefs: NotificationPreferences, user: dict = Depends(get_current_user)):
    """Update notification preferences"""
    update_data = prefs.dict()
    update_data["updated_at"] = now_iso()
    
    await db.notification_preferences.update_one(
        {"user_id": user["id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"success": True, "message": "Preferences updated"}

@router.get("/pending")
async def get_pending_notifications(user: dict = Depends(get_current_user)):
    """Get pending notifications (for client polling in dev mode)"""
    notifications = await db.pending_notifications.find(
        {"user_id": user["id"], "status": "pending"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    # Mark as delivered
    if notifications:
        notification_ids = [n["id"] for n in notifications]
        await db.pending_notifications.update_many(
            {"id": {"$in": notification_ids}},
            {"$set": {"status": "delivered", "delivered_at": now_iso()}}
        )
    
    return {"notifications": notifications, "count": len(notifications)}

@router.get("/history")
async def get_notification_history(limit: int = 50, user: dict = Depends(get_current_user)):
    """Get notification history"""
    notifications = await db.pending_notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return {"notifications": notifications, "count": len(notifications)}

@router.post("/test")
async def send_test_notification(user: dict = Depends(get_current_user)):
    """Send a test push notification to the current user"""
    payload = {
        "title": "🔔 Test Notification",
        "title_te": "🔔 టెస్ట్ నోటిఫికేషన్",
        "body": "Push notifications are working correctly!",
        "body_te": "పుష్ నోటిఫికేషన్లు సరిగ్గా పని చేస్తున్నాయి!",
        "category": "test",
        "priority": "normal",
        "timestamp": now_iso()
    }
    
    result = await notify_user(user["id"], "community", payload)
    
    if result:
        return {"success": True, "message": "Test notification sent"}
    else:
        return {"success": False, "message": "No active subscriptions found or notification failed"}

# ============== ADMIN ROUTES ==============

@router.post("/admin/broadcast")
async def admin_broadcast(notification: BroadcastNotification, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Admin: Broadcast notification to users"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payload = {
        "title": notification.title,
        "body": notification.body,
        "category": notification.category,
        "priority": notification.priority,
        "data": notification.data or {},
        "timestamp": now_iso()
    }
    
    # Store broadcast record
    broadcast_record = {
        "id": generate_id(),
        "admin_id": user["id"],
        "payload": payload,
        "target_users": notification.target_users,
        "created_at": now_iso()
    }
    await db.notification_broadcasts.insert_one(broadcast_record)
    
    # Send notifications in background
    if notification.target_users:
        # Targeted notification
        count = await notify_multiple_users(notification.target_users, notification.category, payload)
    else:
        # Broadcast to all
        count = await broadcast_notification(notification.category, payload)
    
    return {
        "success": True,
        "message": f"Notification sent to {count} user(s)",
        "broadcast_id": broadcast_record["id"]
    }

# ============== TRIGGER FUNCTIONS (called by other routers) ==============

async def trigger_sos_notification(sos_alert: dict, triggered_by_name: str, emergency_contacts: List[dict]):
    """Trigger SOS notification to emergency contacts"""
    payload = {
        "title": "🚨 SOS Alert!",
        "body": f"{triggered_by_name} needs help! Location: {sos_alert.get('location', {}).get('address', 'Unknown')}",
        "category": "sos",
        "priority": "urgent",
        "data": {
            "alert_id": sos_alert.get("id"),
            "location": sos_alert.get("location"),
            "triggered_at": sos_alert.get("triggered_at")
        },
        "timestamp": now_iso()
    }
    
    contact_user_ids = [c.get("user_id") for c in emergency_contacts if c.get("user_id")]
    if contact_user_ids:
        await notify_multiple_users(contact_user_ids, "sos", payload)

async def trigger_geofence_notification(user_id: str, user_name: str, geofence_name: str, event_type: str, location: dict):
    """Trigger geo-fence breach notification"""
    payload = {
        "title": f"📍 Geo-fence {'Exit' if event_type == 'exit' else 'Entry'} Alert",
        "body": f"{user_name} has {'left' if event_type == 'exit' else 'entered'} {geofence_name}",
        "category": "geofence",
        "priority": "high",
        "data": {
            "user_id": user_id,
            "geofence_name": geofence_name,
            "event_type": event_type,
            "location": location
        },
        "timestamp": now_iso()
    }
    
    # Get family members who should be notified
    family = await db.family_members.find(
        {"family_of_user_id": user_id, "notify_on_geofence": True}
    ).to_list(10)
    
    watcher_ids = [f.get("user_id") for f in family if f.get("user_id")]
    if watcher_ids:
        await notify_multiple_users(watcher_ids, "geofence", payload)

async def trigger_news_notification(news_item: dict, category: str = "news"):
    """Trigger news push notification"""
    payload = {
        "title": f"📰 {news_item.get('category_label', 'News')}",
        "body": news_item.get("title", "New article available"),
        "category": "news",
        "priority": "normal",
        "data": {
            "news_id": news_item.get("id"),
            "link": news_item.get("link")
        },
        "timestamp": now_iso()
    }
    
    await broadcast_notification("news", payload)

async def trigger_community_notification(post: dict, action: str = "new_post"):
    """Trigger community/wall notification"""
    titles = {
        "new_post": "🗣️ New Community Post",
        "comment": "💬 New Comment",
        "like": "❤️ Someone liked your post",
        "group_invite": "👥 Group Invitation"
    }
    
    payload = {
        "title": titles.get(action, "Community Update"),
        "body": post.get("content", "")[:100] + "..." if len(post.get("content", "")) > 100 else post.get("content", ""),
        "category": "community",
        "priority": "normal",
        "data": {
            "post_id": post.get("id"),
            "action": action
        },
        "timestamp": now_iso()
    }
    
    # Notify post author for comments/likes
    if action in ["comment", "like"] and post.get("user_id"):
        await notify_user(post["user_id"], "community", payload)
