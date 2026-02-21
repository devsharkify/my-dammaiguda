"""Report Generation and Export Router
Provides downloadable reports for Admin and Manager dashboards
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, get_current_user, now_iso
import csv
import io
import json
import logging

router = APIRouter(prefix="/reports", tags=["Reports"])
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class ReportRequest(BaseModel):
    report_type: str  # users, grievances, analytics, engagement, health
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    area: Optional[str] = None
    format: str = "csv"  # csv, json

# ============== UTILITY FUNCTIONS ==============

def generate_csv(data: List[dict], headers: List[str]) -> str:
    """Generate CSV string from data"""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue()

def get_date_range(date_from: str = None, date_to: str = None, default_days: int = 30):
    """Get date range for filtering"""
    if date_to:
        to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    else:
        to_date = datetime.now(timezone.utc)
    
    if date_from:
        from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    else:
        from_date = to_date - timedelta(days=default_days)
    
    return from_date.isoformat(), to_date.isoformat()

# ============== ADMIN REPORTS ==============

@router.get("/admin/users")
async def export_users_report(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    area: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_current_user)
):
    """Export users report (Admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 90)
    
    query = {"created_at": {"$gte": from_date, "$lte": to_date}}
    if area:
        query["area"] = area
    
    users = await db.users.find(query, {
        "_id": 0,
        "id": 1,
        "name": 1,
        "phone": 1,
        "colony": 1,
        "age_range": 1,
        "role": 1,
        "area": 1,
        "created_at": 1
    }).to_list(5000)
    
    if format == "json":
        return {"users": users, "total": len(users), "period": {"from": from_date, "to": to_date}}
    
    # CSV format
    headers = ["id", "name", "phone", "colony", "age_range", "role", "area", "created_at"]
    csv_data = generate_csv(users, headers)
    
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users_report_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/admin/grievances")
async def export_grievances_report(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    area: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_current_user)
):
    """Export grievances/issues report (Admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 90)
    
    query = {"created_at": {"$gte": from_date, "$lte": to_date}}
    if status:
        query["status"] = status
    if area:
        query["area"] = area
    
    issues = await db.issues.find(query, {
        "_id": 0,
        "id": 1,
        "title": 1,
        "description": 1,
        "category": 1,
        "status": 1,
        "location": 1,
        "area": 1,
        "reporter_name": 1,
        "reporter_phone": 1,
        "created_at": 1,
        "resolved_at": 1
    }).to_list(5000)
    
    if format == "json":
        return {"grievances": issues, "total": len(issues), "period": {"from": from_date, "to": to_date}}
    
    headers = ["id", "title", "category", "status", "location", "area", "reporter_name", "created_at", "resolved_at"]
    csv_data = generate_csv(issues, headers)
    
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=grievances_report_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/admin/analytics")
async def export_analytics_report(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_current_user)
):
    """Export analytics/engagement report (Admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 30)
    
    # Get daily aggregated analytics
    pipeline = [
        {"$match": {"timestamp": {"$gte": from_date, "$lte": to_date}}},
        {"$group": {
            "_id": {"$substr": ["$timestamp", 0, 10]},
            "page_views": {"$sum": {"$cond": [{"$eq": ["$event_type", "page_view"]}, 1, 0]}},
            "actions": {"$sum": {"$cond": [{"$eq": ["$event_type", "action"]}, 1, 0]}},
            "feature_usage": {"$sum": {"$cond": [{"$eq": ["$event_type", "feature_usage"]}, 1, 0]}},
            "unique_users": {"$addToSet": "$user_id"}
        }},
        {"$project": {
            "date": "$_id",
            "page_views": 1,
            "actions": 1,
            "feature_usage": 1,
            "unique_users": {"$size": "$unique_users"}
        }},
        {"$sort": {"date": 1}}
    ]
    
    analytics = await db.user_analytics.aggregate(pipeline).to_list(100)
    
    if format == "json":
        return {"analytics": analytics, "total_days": len(analytics), "period": {"from": from_date, "to": to_date}}
    
    # Format for CSV
    csv_data = []
    for item in analytics:
        csv_data.append({
            "date": item.get("date", item.get("_id")),
            "page_views": item.get("page_views", 0),
            "actions": item.get("actions", 0),
            "feature_usage": item.get("feature_usage", 0),
            "unique_users": item.get("unique_users", 0)
        })
    
    headers = ["date", "page_views", "actions", "feature_usage", "unique_users"]
    csv_str = generate_csv(csv_data, headers)
    
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=analytics_report_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/admin/health-summary")
async def export_health_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_current_user)
):
    """Export aggregated health/fitness data (Admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 30)
    
    # Get daily health metrics
    pipeline = [
        {"$match": {"date": {"$gte": from_date[:10], "$lte": to_date[:10]}}},
        {"$group": {
            "_id": "$date",
            "total_steps": {"$sum": "$steps"},
            "total_calories": {"$sum": "$calories_burned"},
            "active_users": {"$addToSet": "$user_id"}
        }},
        {"$project": {
            "date": "$_id",
            "total_steps": 1,
            "total_calories": 1,
            "active_users": {"$size": "$active_users"}
        }},
        {"$sort": {"date": 1}}
    ]
    
    health_data = await db.fitness_logs.aggregate(pipeline).to_list(100)
    
    if format == "json":
        return {"health_summary": health_data, "period": {"from": from_date, "to": to_date}}
    
    csv_data = []
    for item in health_data:
        csv_data.append({
            "date": item.get("date", item.get("_id")),
            "total_steps": item.get("total_steps", 0),
            "total_calories": item.get("total_calories", 0),
            "active_users": item.get("active_users", 0)
        })
    
    headers = ["date", "total_steps", "total_calories", "active_users"]
    csv_str = generate_csv(csv_data, headers)
    
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=health_summary_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# ============== MANAGER REPORTS ==============

@router.get("/manager/grievances")
async def export_manager_grievances(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_current_user)
):
    """Export grievances for manager's assigned area"""
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Manager access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 90)
    
    query = {"created_at": {"$gte": from_date, "$lte": to_date}}
    if status:
        query["status"] = status
    
    # Managers can only see their assigned area
    if user.get("role") == "manager" and user.get("assigned_area"):
        query["area"] = user["assigned_area"]
    
    issues = await db.issues.find(query, {
        "_id": 0,
        "id": 1,
        "title": 1,
        "description": 1,
        "category": 1,
        "status": 1,
        "location": 1,
        "reporter_name": 1,
        "created_at": 1,
        "resolved_at": 1,
        "assigned_to": 1
    }).to_list(2000)
    
    if format == "json":
        return {"grievances": issues, "total": len(issues), "period": {"from": from_date, "to": to_date}}
    
    headers = ["id", "title", "category", "status", "location", "reporter_name", "created_at", "resolved_at", "assigned_to"]
    csv_data = generate_csv(issues, headers)
    
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=grievances_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/manager/users")
async def export_manager_users(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_current_user)
):
    """Export users for manager's assigned area"""
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Manager access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 90)
    
    query = {"created_at": {"$gte": from_date, "$lte": to_date}}
    
    if user.get("role") == "manager" and user.get("assigned_area"):
        query["area"] = user["assigned_area"]
    
    users = await db.users.find(query, {
        "_id": 0,
        "id": 1,
        "name": 1,
        "phone": 1,
        "colony": 1,
        "created_at": 1
    }).to_list(2000)
    
    if format == "json":
        return {"users": users, "total": len(users), "period": {"from": from_date, "to": to_date}}
    
    headers = ["id", "name", "phone", "colony", "created_at"]
    csv_data = generate_csv(users, headers)
    
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/manager/summary")
async def get_manager_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get summary statistics for manager dashboard"""
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Manager access required")
    
    from_date, to_date = get_date_range(date_from, date_to, 30)
    
    area_filter = {}
    if user.get("role") == "manager" and user.get("assigned_area"):
        area_filter["area"] = user["assigned_area"]
    
    # Grievance stats
    total_grievances = await db.issues.count_documents({**area_filter, "created_at": {"$gte": from_date, "$lte": to_date}})
    pending = await db.issues.count_documents({**area_filter, "status": "pending", "created_at": {"$gte": from_date, "$lte": to_date}})
    resolved = await db.issues.count_documents({**area_filter, "status": "resolved", "created_at": {"$gte": from_date, "$lte": to_date}})
    in_progress = await db.issues.count_documents({**area_filter, "status": "in_progress", "created_at": {"$gte": from_date, "$lte": to_date}})
    
    # User stats
    total_users = await db.users.count_documents({**area_filter, "created_at": {"$gte": from_date, "$lte": to_date}})
    
    # Category breakdown
    category_pipeline = [
        {"$match": {**area_filter, "created_at": {"$gte": from_date, "$lte": to_date}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.issues.aggregate(category_pipeline).to_list(20)
    
    return {
        "period": {"from": from_date, "to": to_date},
        "grievances": {
            "total": total_grievances,
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved,
            "resolution_rate": round((resolved / total_grievances * 100) if total_grievances > 0 else 0, 1)
        },
        "users": {
            "total": total_users
        },
        "categories": [{"category": c["_id"], "count": c["count"]} for c in categories]
    }

# ============== AVAILABLE REPORTS LIST ==============

@router.get("/available")
async def get_available_reports(user: dict = Depends(get_current_user)):
    """Get list of available reports based on user role"""
    
    admin_reports = [
        {"id": "users", "name": "Users Report", "description": "All registered users with details", "endpoint": "/api/reports/admin/users"},
        {"id": "grievances", "name": "Grievances Report", "description": "All grievances/issues with status", "endpoint": "/api/reports/admin/grievances"},
        {"id": "analytics", "name": "Analytics Report", "description": "Daily engagement metrics", "endpoint": "/api/reports/admin/analytics"},
        {"id": "health", "name": "Health Summary", "description": "Aggregated fitness/health data", "endpoint": "/api/reports/admin/health-summary"}
    ]
    
    manager_reports = [
        {"id": "grievances", "name": "Grievances Report", "description": "Grievances in your area", "endpoint": "/api/reports/manager/grievances"},
        {"id": "users", "name": "Users Report", "description": "Users in your area", "endpoint": "/api/reports/manager/users"}
    ]
    
    if user.get("role") == "admin":
        return {"reports": admin_reports + manager_reports, "role": "admin"}
    elif user.get("role") == "manager":
        return {"reports": manager_reports, "role": "manager"}
    else:
        return {"reports": [], "role": user.get("role")}
