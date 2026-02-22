"""Real-Time Analytics Alerts System
Features:
- Activity spike detection
- Anomaly detection based on historical patterns
- Admin notifications via WebSocket and Push
- Configurable thresholds
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user, JWT_SECRET
import logging
import asyncio
import statistics

router = APIRouter(prefix="/analytics/alerts", tags=["Analytics Alerts"])
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class AlertThreshold(BaseModel):
    metric: str  # active_users, page_views, feature_usage, login_attempts, errors
    threshold_type: str  # spike, drop, absolute
    value: float  # For spike/drop: percentage, for absolute: count
    time_window_minutes: int = 60
    enabled: bool = True

class AlertConfig(BaseModel):
    thresholds: List[AlertThreshold]
    notify_email: bool = False
    notify_push: bool = True
    notify_websocket: bool = True

class Alert(BaseModel):
    id: str
    alert_type: str
    metric: str
    message: str
    severity: str  # low, medium, high, critical
    current_value: float
    baseline_value: float
    change_percentage: float
    created_at: str
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None

# ============== WEBSOCKET CONNECTION MANAGER ==============

class AlertConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast_alert(self, alert: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(alert)
            except Exception:
                dead_connections.append(connection)
        
        for conn in dead_connections:
            self.disconnect(conn)

alert_manager = AlertConnectionManager()

# ============== DETECTION FUNCTIONS ==============

async def get_baseline_metrics(metric: str, time_window_minutes: int = 60) -> dict:
    """Get baseline metrics from the past 7 days for comparison"""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=time_window_minutes)
    
    # Get data for the same time window over the past 7 days
    historical_values = []
    
    for days_ago in range(1, 8):
        day_start = (now - timedelta(days=days_ago, minutes=time_window_minutes)).isoformat()
        day_end = (now - timedelta(days=days_ago)).isoformat()
        
        if metric == "active_users":
            count = len(await db.user_analytics.distinct(
                "user_id", 
                {"timestamp": {"$gte": day_start, "$lte": day_end}}
            ))
        elif metric == "page_views":
            count = await db.user_analytics.count_documents({
                "event_type": "page_view",
                "timestamp": {"$gte": day_start, "$lte": day_end}
            })
        elif metric == "login_attempts":
            count = await db.user_analytics.count_documents({
                "event_type": "action",
                "action": "login",
                "timestamp": {"$gte": day_start, "$lte": day_end}
            })
        elif metric == "feature_usage":
            count = await db.user_analytics.count_documents({
                "event_type": "feature_usage",
                "timestamp": {"$gte": day_start, "$lte": day_end}
            })
        else:
            count = 0
        
        historical_values.append(count)
    
    if historical_values:
        avg = statistics.mean(historical_values)
        std_dev = statistics.stdev(historical_values) if len(historical_values) > 1 else 0
    else:
        avg = 0
        std_dev = 0
    
    return {
        "average": avg,
        "std_dev": std_dev,
        "min": min(historical_values) if historical_values else 0,
        "max": max(historical_values) if historical_values else 0,
        "historical_values": historical_values
    }

async def get_current_metric(metric: str, time_window_minutes: int = 60) -> float:
    """Get current metric value for the given time window"""
    now = datetime.now(timezone.utc)
    window_start = (now - timedelta(minutes=time_window_minutes)).isoformat()
    
    if metric == "active_users":
        return len(await db.user_analytics.distinct(
            "user_id", 
            {"timestamp": {"$gte": window_start}}
        ))
    elif metric == "page_views":
        return await db.user_analytics.count_documents({
            "event_type": "page_view",
            "timestamp": {"$gte": window_start}
        })
    elif metric == "login_attempts":
        return await db.user_analytics.count_documents({
            "event_type": "action",
            "action": "login",
            "timestamp": {"$gte": window_start}
        })
    elif metric == "feature_usage":
        return await db.user_analytics.count_documents({
            "event_type": "feature_usage",
            "timestamp": {"$gte": window_start}
        })
    elif metric == "errors":
        return await db.error_logs.count_documents({
            "timestamp": {"$gte": window_start}
        })
    
    return 0

def calculate_severity(change_percentage: float, threshold_type: str) -> str:
    """Calculate alert severity based on change percentage"""
    abs_change = abs(change_percentage)
    
    if abs_change >= 200:
        return "critical"
    elif abs_change >= 100:
        return "high"
    elif abs_change >= 50:
        return "medium"
    else:
        return "low"

async def check_threshold(threshold: AlertThreshold) -> Optional[dict]:
    """Check if a threshold has been breached"""
    current_value = await get_current_metric(threshold.metric, threshold.time_window_minutes)
    baseline = await get_baseline_metrics(threshold.metric, threshold.time_window_minutes)
    
    baseline_avg = baseline["average"]
    
    if baseline_avg == 0:
        # No baseline data, skip check
        return None
    
    change_percentage = ((current_value - baseline_avg) / baseline_avg) * 100
    
    alert_triggered = False
    alert_type = ""
    message = ""
    
    if threshold.threshold_type == "spike":
        if change_percentage >= threshold.value:
            alert_triggered = True
            alert_type = "spike"
            message = f"Activity spike detected: {threshold.metric} is {change_percentage:.1f}% above normal"
    
    elif threshold.threshold_type == "drop":
        if change_percentage <= -threshold.value:
            alert_triggered = True
            alert_type = "drop"
            message = f"Activity drop detected: {threshold.metric} is {abs(change_percentage):.1f}% below normal"
    
    elif threshold.threshold_type == "absolute":
        if current_value >= threshold.value:
            alert_triggered = True
            alert_type = "threshold_exceeded"
            message = f"Threshold exceeded: {threshold.metric} reached {current_value} (threshold: {threshold.value})"
    
    if alert_triggered:
        return {
            "id": generate_id(),
            "alert_type": alert_type,
            "metric": threshold.metric,
            "message": message,
            "severity": calculate_severity(change_percentage, threshold.threshold_type),
            "current_value": current_value,
            "baseline_value": baseline_avg,
            "change_percentage": round(change_percentage, 1),
            "created_at": now_iso(),
            "acknowledged": False
        }
    
    return None

# ============== API ENDPOINTS ==============

@router.get("/config")
async def get_alert_config(user: dict = Depends(get_current_user)):
    """Get current alert configuration"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await db.alert_config.find_one({}, {"_id": 0})
    
    if not config:
        # Return default config
        config = {
            "thresholds": [
                {"metric": "active_users", "threshold_type": "spike", "value": 50, "time_window_minutes": 60, "enabled": True},
                {"metric": "active_users", "threshold_type": "drop", "value": 50, "time_window_minutes": 60, "enabled": True},
                {"metric": "login_attempts", "threshold_type": "spike", "value": 100, "time_window_minutes": 30, "enabled": True},
                {"metric": "page_views", "threshold_type": "spike", "value": 75, "time_window_minutes": 60, "enabled": True},
                {"metric": "errors", "threshold_type": "absolute", "value": 10, "time_window_minutes": 15, "enabled": True},
            ],
            "notify_email": False,
            "notify_push": True,
            "notify_websocket": True
        }
    
    return config

@router.put("/config")
async def update_alert_config(config: AlertConfig, user: dict = Depends(get_current_user)):
    """Update alert configuration"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config_dict = config.dict()
    config_dict["updated_at"] = now_iso()
    config_dict["updated_by"] = user["id"]
    
    await db.alert_config.update_one(
        {},
        {"$set": config_dict},
        upsert=True
    )
    
    return {"success": True, "message": "Alert configuration updated"}

@router.get("/")
async def get_alerts(
    limit: int = 50,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    user: dict = Depends(get_current_user)
):
    """Get recent alerts"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if severity:
        query["severity"] = severity
    if acknowledged is not None:
        query["acknowledged"] = acknowledged
    
    alerts = await db.analytics_alerts.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get unacknowledged count
    unack_count = await db.analytics_alerts.count_documents({"acknowledged": False})
    
    return {
        "alerts": alerts,
        "total": len(alerts),
        "unacknowledged_count": unack_count
    }

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, user: dict = Depends(get_current_user)):
    """Acknowledge an alert"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.analytics_alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "acknowledged": True,
            "acknowledged_by": user["id"],
            "acknowledged_at": now_iso()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert acknowledged"}

@router.post("/acknowledge-all")
async def acknowledge_all_alerts(user: dict = Depends(get_current_user)):
    """Acknowledge all unacknowledged alerts"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.analytics_alerts.update_many(
        {"acknowledged": False},
        {"$set": {
            "acknowledged": True,
            "acknowledged_by": user["id"],
            "acknowledged_at": now_iso()
        }}
    )
    
    return {"success": True, "acknowledged_count": result.modified_count}

@router.post("/check")
async def trigger_alert_check(user: dict = Depends(get_current_user)):
    """Manually trigger an alert check"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await db.alert_config.find_one({}, {"_id": 0})
    
    if not config:
        return {"success": True, "alerts_generated": 0, "message": "No alert config found"}
    
    alerts_generated = []
    
    for threshold_dict in config.get("thresholds", []):
        if not threshold_dict.get("enabled", True):
            continue
        
        threshold = AlertThreshold(**threshold_dict)
        alert = await check_threshold(threshold)
        
        if alert:
            # Save alert
            await db.analytics_alerts.insert_one(alert)
            alerts_generated.append(alert)
            
            # Broadcast via WebSocket
            if config.get("notify_websocket", True):
                await alert_manager.broadcast_alert({
                    "type": "new_alert",
                    "alert": alert
                })
    
    return {
        "success": True,
        "alerts_generated": len(alerts_generated),
        "alerts": alerts_generated
    }

@router.get("/metrics/current")
async def get_current_metrics(user: dict = Depends(get_current_user)):
    """Get current metric values with baselines"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    metrics = ["active_users", "page_views", "login_attempts", "feature_usage"]
    result = {}
    
    for metric in metrics:
        current = await get_current_metric(metric, 60)
        baseline = await get_baseline_metrics(metric, 60)
        
        change = 0
        if baseline["average"] > 0:
            change = ((current - baseline["average"]) / baseline["average"]) * 100
        
        result[metric] = {
            "current": current,
            "baseline_avg": round(baseline["average"], 1),
            "baseline_std_dev": round(baseline["std_dev"], 1),
            "change_percentage": round(change, 1),
            "status": "normal" if abs(change) < 50 else ("elevated" if change > 0 else "reduced")
        }
    
    return {"metrics": result, "timestamp": now_iso()}

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, user: dict = Depends(get_current_user)):
    """Delete an alert"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.analytics_alerts.delete_one({"id": alert_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert deleted"}

@router.delete("/")
async def clear_old_alerts(days: int = 30, user: dict = Depends(get_current_user)):
    """Clear alerts older than specified days"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    result = await db.analytics_alerts.delete_many({
        "created_at": {"$lt": cutoff}
    })
    
    return {"success": True, "deleted_count": result.deleted_count}

# ============== WEBSOCKET ENDPOINT ==============

@router.websocket("/ws")
async def alerts_websocket(websocket: WebSocket, token: Optional[str] = None):
    """WebSocket for real-time alert notifications"""
    # Validate admin access
    user = None
    if token:
        try:
            import jwt
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
        except Exception:
            pass
    
    if not user or user.get("role") != "admin":
        await websocket.close(code=4003)
        return
    
    await alert_manager.connect(websocket)
    
    try:
        # Send initial state
        unack_count = await db.analytics_alerts.count_documents({"acknowledged": False})
        await websocket.send_json({
            "type": "connected",
            "unacknowledged_count": unack_count
        })
        
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": now_iso()})
            
            elif data.get("type") == "acknowledge":
                alert_id = data.get("alert_id")
                if alert_id:
                    await db.analytics_alerts.update_one(
                        {"id": alert_id},
                        {"$set": {
                            "acknowledged": True,
                            "acknowledged_by": user["id"],
                            "acknowledged_at": now_iso()
                        }}
                    )
                    await alert_manager.broadcast_alert({
                        "type": "alert_acknowledged",
                        "alert_id": alert_id
                    })
    
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)
