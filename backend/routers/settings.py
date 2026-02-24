"""Settings Router - Admin-configurable app settings stored in MongoDB"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

# ============== MODELS ==============

class BrandingUpdate(BaseModel):
    app_name: Optional[str] = None
    app_name_short: Optional[str] = None
    tagline: Optional[str] = None
    tagline_te: Optional[str] = None
    primary_color: Optional[str] = None
    logo_url: Optional[str] = None
    partner_logo: Optional[str] = None
    partner_name: Optional[str] = None
    company_name: Optional[str] = None

class StatsUpdate(BaseModel):
    benefits_amount: Optional[str] = None
    problems_solved: Optional[str] = None
    people_benefited: Optional[str] = None

class AreaSettingsUpdate(BaseModel):
    area_id: str
    branding: Optional[BrandingUpdate] = None
    stats: Optional[StatsUpdate] = None
    banner_url: Optional[str] = None
    features: Optional[Dict[str, bool]] = None

# ============== HELPER FUNCTIONS ==============

async def get_admin(user: dict = Depends(get_current_user)):
    """Ensure user is admin"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== ROUTES ==============

@router.get("/branding")
async def get_branding_settings(area_id: Optional[str] = None):
    """Get branding settings - public endpoint for app configuration"""
    query = {"area_id": area_id or "dammaiguda"}
    settings = await db.app_settings.find_one(query, {"_id": 0})
    
    if not settings:
        # Return default settings
        return {
            "area_id": area_id or "dammaiguda",
            "branding": {
                "app_name": "My Dammaiguda",
                "app_name_short": "My Dammaiguda",
                "tagline": "Track Issues. Protect Health. Claim Benefits.",
                "tagline_te": "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని రక్షించండి. ప్రయోజనాలు పొందండి.",
                "primary_color": "#0F766E",
                "logo_url": "",
                "partner_logo": "",
                "partner_name": "Kaizer News",
                "company_name": "Sharkify Technology Pvt. Ltd."
            },
            "stats": {
                "benefits_amount": "₹10Cr+",
                "problems_solved": "100+",
                "people_benefited": "50K+"
            },
            "banner_url": "",
            "features": {}
        }
    
    return settings

@router.get("/branding/all")
async def get_all_branding_settings(admin: dict = Depends(get_admin)):
    """Get branding settings for all areas - admin only"""
    settings = await db.app_settings.find({}, {"_id": 0}).to_list(100)
    return {"settings": settings}

@router.put("/branding")
async def update_branding_settings(
    update: AreaSettingsUpdate,
    admin: dict = Depends(get_admin)
):
    """Update branding settings for an area - admin only"""
    area_id = update.area_id
    
    # Build update document
    update_doc = {
        "area_id": area_id,
        "updated_at": now_iso(),
        "updated_by": admin.get("id")
    }
    
    if update.branding:
        branding_dict = {k: v for k, v in update.branding.dict().items() if v is not None}
        if branding_dict:
            update_doc["branding"] = branding_dict
    
    if update.stats:
        stats_dict = {k: v for k, v in update.stats.dict().items() if v is not None}
        if stats_dict:
            update_doc["stats"] = stats_dict
    
    if update.banner_url is not None:
        update_doc["banner_url"] = update.banner_url
    
    if update.features is not None:
        update_doc["features"] = update.features
    
    # Upsert the settings
    await db.app_settings.update_one(
        {"area_id": area_id},
        {"$set": update_doc},
        upsert=True
    )
    
    return {"success": True, "message": f"Settings updated for {area_id}"}

@router.get("/banner/{area_id}")
async def get_area_banner(area_id: str):
    """Get banner URL for a specific area - public endpoint"""
    settings = await db.area_settings.find_one({"area": area_id}, {"_id": 0})
    return {"banner_url": settings.get("banner_url", "") if settings else ""}

@router.put("/banner/{area_id}")
async def update_area_banner(
    area_id: str,
    banner_url: str,
    admin: dict = Depends(get_admin)
):
    """Update banner URL for a specific area - admin only"""
    await db.area_settings.update_one(
        {"area": area_id},
        {
            "$set": {
                "banner_url": banner_url,
                "updated_at": now_iso(),
                "updated_by": admin.get("id")
            }
        },
        upsert=True
    )
    
    return {"success": True, "message": f"Banner updated for {area_id}"}

# ============== QUICK CONFIG ENDPOINT ==============

@router.get("/config/{area_id}")
async def get_area_config(area_id: str):
    """Get complete config for an area - used by frontend for dynamic loading"""
    # Get app settings
    app_settings = await db.app_settings.find_one({"area_id": area_id}, {"_id": 0})
    
    # Get area settings (banner, etc.)
    area_settings = await db.area_settings.find_one({"area": area_id}, {"_id": 0})
    
    # Merge and return
    config = {
        "area_id": area_id,
        "branding": app_settings.get("branding", {}) if app_settings else {},
        "stats": app_settings.get("stats", {}) if app_settings else {},
        "features": app_settings.get("features", {}) if app_settings else {},
        "banner_url": area_settings.get("banner_url", "") if area_settings else ""
    }
    
    return config

@router.put("/config/{area_id}")
async def update_area_config(
    area_id: str,
    config: dict,
    admin: dict = Depends(get_admin)
):
    """Update area config including sections - admin only"""
    update_doc = {
        "area_id": area_id,
        "updated_at": now_iso(),
        "updated_by": admin.get("id")
    }
    
    if "sections" in config:
        update_doc["sections"] = config["sections"]
    
    if "features" in config:
        update_doc["features"] = config["features"]
    
    await db.app_settings.update_one(
        {"area_id": area_id},
        {"$set": update_doc},
        upsert=True
    )
    
    return {"success": True, "message": f"Config updated for {area_id}"}

