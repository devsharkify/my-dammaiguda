"""Status Templates Router - Festival/event templates for social sharing"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/templates", tags=["Status Templates"])

# ============== MODELS ==============

class TemplateCreate(BaseModel):
    title: str
    title_te: Optional[str] = None
    category: str  # "festival", "birthday", "event", "greeting", "civic", "other"
    background_url: str  # Template background image URL
    thumbnail_url: Optional[str] = None
    photo_position: dict  # {"x": 10, "y": 20, "width": 100, "height": 100, "shape": "circle"}
    name_position: dict  # {"x": 50, "y": 150, "fontSize": 24, "color": "#ffffff", "align": "center"}
    is_active: bool = True
    display_order: int = 0

class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    title_te: Optional[str] = None
    category: Optional[str] = None
    background_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    photo_position: Optional[dict] = None
    name_position: Optional[dict] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class GenerateStatus(BaseModel):
    template_id: str
    user_photo_url: Optional[str] = None  # User's uploaded photo
    display_name: str  # Name to show on template

# ============== USER ROUTES ==============

@router.get("")
async def get_templates(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Get all active templates"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    skip = (page - 1) * limit
    templates = await db.templates.find(query, {"_id": 0}).sort("display_order", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.templates.count_documents(query)
    
    return {
        "templates": templates,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/categories")
async def get_template_categories():
    """Get template categories with counts"""
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.templates.aggregate(pipeline).to_list(20)
    
    category_labels = {
        "festival": {"en": "Festivals", "te": "పండుగలు"},
        "birthday": {"en": "Birthday", "te": "పుట్టినరోజు"},
        "event": {"en": "Events", "te": "ఈవెంట్స్"},
        "greeting": {"en": "Greetings", "te": "శుభాకాంక్షలు"},
        "civic": {"en": "Civic", "te": "పౌర"},
        "other": {"en": "Other", "te": "ఇతర"}
    }
    
    return [
        {
            "value": c["_id"],
            "label": category_labels.get(c["_id"], {"en": c["_id"], "te": c["_id"]}),
            "count": c["count"]
        }
        for c in categories
    ]

@router.get("/{template_id}")
async def get_template_details(template_id: str):
    """Get full template details"""
    template = await db.templates.find_one({"id": template_id, "is_active": True}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/generate")
async def generate_status_image(request: GenerateStatus, user: dict = Depends(get_current_user)):
    """Generate a personalized status image from template
    
    Note: This returns the template data with user info for client-side rendering.
    The actual image composition is done on the frontend using Canvas API.
    """
    template = await db.templates.find_one({"id": request.template_id, "is_active": True}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Record usage
    usage = {
        "id": generate_id(),
        "template_id": request.template_id,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "display_name": request.display_name,
        "created_at": now_iso()
    }
    await db.template_usage.insert_one(usage)
    
    # Update template usage count
    await db.templates.update_one(
        {"id": request.template_id},
        {"$inc": {"usage_count": 1}}
    )
    
    return {
        "success": True,
        "template": template,
        "user_data": {
            "photo_url": request.user_photo_url,
            "display_name": request.display_name
        },
        "share_text": f"Created with My Dammaiguda App - {template['title']}"
    }

# ============== ADMIN ROUTES ==============

@router.post("/admin/create")
async def admin_create_template(template: TemplateCreate, user: dict = Depends(get_current_user)):
    """Admin: Create a new template"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_template = {
        "id": generate_id(),
        "title": template.title,
        "title_te": template.title_te,
        "category": template.category,
        "background_url": template.background_url,
        "thumbnail_url": template.thumbnail_url or template.background_url,
        "photo_position": template.photo_position,
        "name_position": template.name_position,
        "is_active": template.is_active,
        "display_order": template.display_order,
        "usage_count": 0,
        "created_by": user["id"],
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    await db.templates.insert_one(new_template)
    new_template.pop("_id", None)
    
    return {"message": "Template created successfully", "template": new_template}

@router.put("/admin/{template_id}")
async def admin_update_template(template_id: str, update: TemplateUpdate, user: dict = Depends(get_current_user)):
    """Admin: Update a template"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = now_iso()
    
    result = await db.templates.update_one({"id": template_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    updated = await db.templates.find_one({"id": template_id}, {"_id": 0})
    return {"message": "Template updated", "template": updated}

@router.delete("/admin/{template_id}")
async def admin_delete_template(template_id: str, user: dict = Depends(get_current_user)):
    """Admin: Delete a template"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {"message": "Template deleted"}

@router.get("/admin/all")
async def admin_get_all_templates(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Admin: Get all templates including inactive"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    skip = (page - 1) * limit
    templates = await db.templates.find({}, {"_id": 0}).sort("display_order", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.templates.count_documents({})
    
    return {"templates": templates, "total": total, "page": page}
