"""Site Content Management Router - Editable headlines, images, statistics"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/content", tags=["content"])

# Database reference
db = None

def set_db(database):
    global db
    db = database

def generate_id():
    return str(uuid.uuid4())[:8]

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# Auth dependency placeholder
async def get_current_user():
    return {"id": "admin", "role": "admin"}

# ============== PYDANTIC MODELS ==============

class ContentItem(BaseModel):
    key: str
    value: Any
    type: str = "text"  # text, number, image, json
    category: str = "general"  # general, dumpyard, benefits, banners, headlines
    description: Optional[str] = None

class ContentUpdate(BaseModel):
    value: Any
    description: Optional[str] = None

class DumpYardConfig(BaseModel):
    daily_waste_tons: float = 1200
    area_acres: float = 350
    red_zone_km: float = 2
    status: str = "Active"
    historical_data: Optional[str] = None  # e.g., "Till 2025: 5500 tons, IIT-B recommends: 19000 tons"
    health_risks: Optional[List[str]] = None
    affected_groups: Optional[List[str]] = None
    last_updated: Optional[str] = None

class BannerConfig(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    is_active: bool = True
    order: int = 0

class BenefitConfig(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    image_url: str
    category: str = "general"
    link_url: Optional[str] = None
    is_active: bool = True

# ============== CONTENT MANAGEMENT ENDPOINTS ==============

@router.get("/all")
async def get_all_content():
    """Get all editable content"""
    content = await db.site_content.find({}, {"_id": 0}).to_list(500)
    
    # Group by category
    grouped = {}
    for item in content:
        cat = item.get("category", "general")
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(item)
    
    return {"content": content, "grouped": grouped}

@router.get("/category/{category}")
async def get_content_by_category(category: str):
    """Get content by category"""
    content = await db.site_content.find(
        {"category": category},
        {"_id": 0}
    ).to_list(100)
    return {"content": content}

@router.get("/key/{key}")
async def get_content_by_key(key: str):
    """Get single content item by key"""
    content = await db.site_content.find_one({"key": key}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content

@router.post("/")
async def create_content(item: ContentItem, user: dict = Depends(get_current_user)):
    """Create new content item (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if key exists
    existing = await db.site_content.find_one({"key": item.key})
    if existing:
        raise HTTPException(status_code=400, detail="Content key already exists")
    
    content = {
        "id": generate_id(),
        "key": item.key,
        "value": item.value,
        "type": item.type,
        "category": item.category,
        "description": item.description,
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    await db.site_content.insert_one(content)
    content.pop("_id", None)
    return {"success": True, "content": content}

@router.put("/key/{key}")
async def update_content(key: str, update: ContentUpdate, user: dict = Depends(get_current_user)):
    """Update content by key (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.site_content.update_one(
        {"key": key},
        {"$set": {
            "value": update.value,
            "description": update.description,
            "updated_at": now_iso()
        }}
    )
    
    if result.matched_count == 0:
        # Create if doesn't exist
        content = {
            "id": generate_id(),
            "key": key,
            "value": update.value,
            "type": "text",
            "category": "general",
            "description": update.description,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }
        await db.site_content.insert_one(content)
    
    updated = await db.site_content.find_one({"key": key}, {"_id": 0})
    return {"success": True, "content": updated}

@router.delete("/key/{key}")
async def delete_content(key: str, user: dict = Depends(get_current_user)):
    """Delete content by key (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.site_content.delete_one({"key": key})
    return {"success": True, "deleted": result.deleted_count > 0}

# ============== DUMP YARD SPECIFIC ENDPOINTS ==============

@router.get("/dumpyard")
async def get_dumpyard_config():
    """Get dump yard configuration"""
    config = await db.site_content.find_one({"key": "dumpyard_config"}, {"_id": 0})
    
    if not config:
        # Return defaults
        return {
            "daily_waste_tons": 1200,
            "area_acres": 350,
            "red_zone_km": 2,
            "status": "Active",
            "historical_data": "",
            "health_risks": [
                "Respiratory issues from toxic fumes",
                "Groundwater contamination",
                "Skin diseases from polluted water",
                "Higher cancer risk in surrounding areas"
            ],
            "affected_groups": [
                "Children (High Risk)",
                "Elderly (High Risk)",
                "Pregnant Women (High Risk)",
                "Workers (Very High Risk)"
            ],
            "recent_updates": []
        }
    
    return config.get("value", {})

@router.put("/dumpyard")
async def update_dumpyard_config(config: DumpYardConfig, user: dict = Depends(get_current_user)):
    """Update dump yard configuration (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config_data = config.dict()
    config_data["last_updated"] = now_iso()
    
    await db.site_content.update_one(
        {"key": "dumpyard_config"},
        {"$set": {
            "value": config_data,
            "updated_at": now_iso()
        }},
        upsert=True
    )
    
    return {"success": True, "config": config_data}

# ============== BANNERS MANAGEMENT ==============

@router.get("/banners")
async def get_banners():
    """Get all banners"""
    banners = await db.site_banners.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(50)
    return {"banners": banners}

@router.get("/banners/all")
async def get_all_banners(user: dict = Depends(get_current_user)):
    """Get all banners including inactive (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    banners = await db.site_banners.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return {"banners": banners}

@router.post("/banners")
async def create_banner(banner: BannerConfig, user: dict = Depends(get_current_user)):
    """Create new banner (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    banner_data = banner.dict()
    banner_data["id"] = banner_data.get("id") or generate_id()
    banner_data["created_at"] = now_iso()
    banner_data["updated_at"] = now_iso()
    
    await db.site_banners.insert_one(banner_data)
    banner_data.pop("_id", None)
    
    return {"success": True, "banner": banner_data}

@router.put("/banners/{banner_id}")
async def update_banner(banner_id: str, banner: BannerConfig, user: dict = Depends(get_current_user)):
    """Update banner (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    banner_data = banner.dict()
    banner_data["updated_at"] = now_iso()
    
    result = await db.site_banners.update_one(
        {"id": banner_id},
        {"$set": banner_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    return {"success": True, "banner": banner_data}

@router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, user: dict = Depends(get_current_user)):
    """Delete banner (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.site_banners.delete_one({"id": banner_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ============== BENEFITS IMAGES MANAGEMENT ==============

@router.get("/benefits")
async def get_benefits():
    """Get all benefit items"""
    benefits = await db.site_benefits.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(100)
    return {"benefits": benefits}

@router.get("/benefits/all")
async def get_all_benefits(user: dict = Depends(get_current_user)):
    """Get all benefits including inactive (admin)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    benefits = await db.site_benefits.find({}, {"_id": 0}).to_list(100)
    return {"benefits": benefits}

@router.post("/benefits")
async def create_benefit(benefit: BenefitConfig, user: dict = Depends(get_current_user)):
    """Create new benefit item (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    benefit_data = benefit.dict()
    benefit_data["id"] = benefit_data.get("id") or generate_id()
    benefit_data["created_at"] = now_iso()
    benefit_data["updated_at"] = now_iso()
    
    await db.site_benefits.insert_one(benefit_data)
    benefit_data.pop("_id", None)
    
    return {"success": True, "benefit": benefit_data}

@router.put("/benefits/{benefit_id}")
async def update_benefit(benefit_id: str, benefit: BenefitConfig, user: dict = Depends(get_current_user)):
    """Update benefit (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    benefit_data = benefit.dict()
    benefit_data["updated_at"] = now_iso()
    
    result = await db.site_benefits.update_one(
        {"id": benefit_id},
        {"$set": benefit_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Benefit not found")
    
    return {"success": True, "benefit": benefit_data}

@router.delete("/benefits/{benefit_id}")
async def delete_benefit(benefit_id: str, user: dict = Depends(get_current_user)):
    """Delete benefit (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.site_benefits.delete_one({"id": benefit_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ============== HEADLINES MANAGEMENT ==============

@router.get("/headlines")
async def get_headlines():
    """Get all editable headlines"""
    headlines = await db.site_content.find(
        {"category": "headlines"},
        {"_id": 0}
    ).to_list(100)
    return {"headlines": headlines}

@router.put("/headlines/{key}")
async def update_headline(key: str, update: ContentUpdate, user: dict = Depends(get_current_user)):
    """Update headline (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.site_content.update_one(
        {"key": key, "category": "headlines"},
        {"$set": {
            "value": update.value,
            "description": update.description,
            "updated_at": now_iso()
        }},
        upsert=True
    )
    
    return {"success": True}

# ============== SEED DEFAULT CONTENT ==============

@router.post("/seed")
async def seed_default_content(user: dict = Depends(get_current_user)):
    """Seed default editable content (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    default_content = [
        # Dump Yard
        {
            "id": generate_id(),
            "key": "dumpyard_config",
            "value": {
                "daily_waste_tons": 1200,
                "area_acres": 350,
                "red_zone_km": 2,
                "status": "Active",
                "historical_data": "Till 2025: 5500 tons/day. IIT-B recommends: 19000 tons/day capacity.",
                "health_risks": [
                    "Respiratory issues from toxic fumes",
                    "Groundwater contamination",
                    "Skin diseases from polluted water",
                    "Higher cancer risk in surrounding areas"
                ],
                "affected_groups": [
                    "Children (High Risk)",
                    "Elderly (High Risk)",
                    "Pregnant Women (High Risk)",
                    "Workers (Very High Risk)"
                ]
            },
            "type": "json",
            "category": "dumpyard",
            "description": "Dump yard statistics and information",
            "created_at": now_iso(),
            "updated_at": now_iso()
        },
        # Headlines
        {
            "id": generate_id(),
            "key": "headline_welcome",
            "value": "Welcome to My Dammaiguda",
            "type": "text",
            "category": "headlines",
            "description": "Main welcome headline",
            "created_at": now_iso(),
            "updated_at": now_iso()
        },
        {
            "id": generate_id(),
            "key": "headline_education",
            "value": "Learn with AIT Education!",
            "type": "text",
            "category": "headlines",
            "description": "Education section headline",
            "created_at": now_iso(),
            "updated_at": now_iso()
        },
        {
            "id": generate_id(),
            "key": "headline_benefits",
            "value": "Citizen Benefits",
            "type": "text",
            "category": "headlines",
            "description": "Benefits section headline",
            "created_at": now_iso(),
            "updated_at": now_iso()
        }
    ]
    
    # Default banners
    default_banners = [
        {
            "id": "banner_education",
            "title": "New Courses Available",
            "subtitle": "Learn with AIT Education! Free courses available",
            "image_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
            "link_url": "/education",
            "is_active": True,
            "order": 1,
            "created_at": now_iso(),
            "updated_at": now_iso()
        },
        {
            "id": "banner_fitness",
            "title": "Kaizer Fit",
            "subtitle": "Track your fitness journey",
            "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
            "link_url": "/fitness",
            "is_active": True,
            "order": 2,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }
    ]
    
    # Default benefits
    default_benefits = [
        {
            "id": "benefit_ration",
            "title": "Ration Card",
            "description": "Apply for ration card online",
            "image_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400",
            "category": "government",
            "is_active": True,
            "created_at": now_iso(),
            "updated_at": now_iso()
        },
        {
            "id": "benefit_aadhar",
            "title": "Aadhar Services",
            "description": "Update Aadhar details",
            "image_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
            "category": "government",
            "is_active": True,
            "created_at": now_iso(),
            "updated_at": now_iso()
        },
        {
            "id": "benefit_pension",
            "title": "Pension Schemes",
            "description": "Apply for pension benefits",
            "image_url": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400",
            "category": "government",
            "is_active": True,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }
    ]
    
    # Insert content
    for item in default_content:
        await db.site_content.update_one(
            {"key": item["key"]},
            {"$setOnInsert": item},
            upsert=True
        )
    
    # Insert banners
    for banner in default_banners:
        await db.site_banners.update_one(
            {"id": banner["id"]},
            {"$setOnInsert": banner},
            upsert=True
        )
    
    # Insert benefits
    for benefit in default_benefits:
        await db.site_benefits.update_one(
            {"id": benefit["id"]},
            {"$setOnInsert": benefit},
            upsert=True
        )
    
    return {
        "success": True,
        "message": "Default content seeded",
        "seeded": {
            "content": len(default_content),
            "banners": len(default_banners),
            "benefits": len(default_benefits)
        }
    }
