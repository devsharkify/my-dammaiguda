"""Vouchers Router - Discount vouchers management"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import random
import string
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/vouchers", tags=["Vouchers"])

# ============== MODELS ==============

class VoucherCreate(BaseModel):
    title: str
    title_te: Optional[str] = None
    description: str
    description_te: Optional[str] = None
    discount_type: str  # "percentage", "flat", "freebie"
    discount_value: float  # percentage or flat amount
    code: Optional[str] = None  # If None, auto-generate
    code_type: str = "random"  # "random", "specific"
    partner_name: str
    partner_logo: Optional[str] = None
    category: str  # "food", "shopping", "health", "education", "entertainment", "other"
    terms_conditions: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    max_uses: Optional[int] = None  # Total uses allowed
    max_uses_per_user: int = 1
    min_order_value: Optional[float] = None
    is_active: bool = True

class VoucherUpdate(BaseModel):
    title: Optional[str] = None
    title_te: Optional[str] = None
    description: Optional[str] = None
    description_te: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    code: Optional[str] = None
    partner_name: Optional[str] = None
    partner_logo: Optional[str] = None
    category: Optional[str] = None
    terms_conditions: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    min_order_value: Optional[float] = None
    is_active: Optional[bool] = None

# ============== HELPER ==============

def generate_voucher_code(length: int = 8) -> str:
    """Generate a random voucher code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

# ============== USER ROUTES ==============

@router.get("")
async def get_vouchers(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Get all active vouchers"""
    query = {"is_active": True}
    
    # Filter by validity
    now = datetime.now(timezone.utc).isoformat()
    query["$or"] = [
        {"valid_until": None},
        {"valid_until": {"$gte": now}}
    ]
    
    if category:
        query["category"] = category
    
    skip = (page - 1) * limit
    vouchers = await db.vouchers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.vouchers.count_documents(query)
    
    return {
        "vouchers": vouchers,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{voucher_id}")
async def get_voucher_details(voucher_id: str):
    """Get full voucher details including code"""
    voucher = await db.vouchers.find_one({"id": voucher_id, "is_active": True}, {"_id": 0})
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    return voucher

@router.post("/{voucher_id}/claim")
async def claim_voucher(voucher_id: str, user: dict = Depends(get_current_user)):
    """Record that user has claimed/viewed a voucher"""
    voucher = await db.vouchers.find_one({"id": voucher_id, "is_active": True})
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    # Check if voucher has max uses
    if voucher.get("max_uses"):
        total_claims = await db.voucher_claims.count_documents({"voucher_id": voucher_id})
        if total_claims >= voucher["max_uses"]:
            raise HTTPException(status_code=400, detail="Voucher has reached maximum uses")
    
    # Check user's claims for this voucher
    user_claims = await db.voucher_claims.count_documents({
        "voucher_id": voucher_id,
        "user_id": user["id"]
    })
    if user_claims >= voucher.get("max_uses_per_user", 1):
        raise HTTPException(status_code=400, detail="You have already claimed this voucher")
    
    # Record claim
    claim = {
        "id": generate_id(),
        "voucher_id": voucher_id,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "claimed_at": now_iso()
    }
    await db.voucher_claims.insert_one(claim)
    
    return {
        "success": True,
        "message": "Voucher claimed successfully",
        "code": voucher["code"],
        "voucher": {k: v for k, v in voucher.items() if k != "_id"}
    }

@router.get("/categories/list")
async def get_voucher_categories():
    """Get list of voucher categories with counts"""
    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.vouchers.aggregate(pipeline).to_list(20)
    
    category_labels = {
        "food": {"en": "Food & Dining", "te": "ఆహారం"},
        "shopping": {"en": "Shopping", "te": "షాపింగ్"},
        "health": {"en": "Health & Wellness", "te": "ఆరోగ్యం"},
        "education": {"en": "Education", "te": "విద్య"},
        "entertainment": {"en": "Entertainment", "te": "వినోదం"},
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

# ============== ADMIN ROUTES ==============

@router.post("/admin/create")
async def admin_create_voucher(voucher: VoucherCreate, user: dict = Depends(get_current_user)):
    """Admin: Create a new voucher"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Generate code if not provided
    code = voucher.code
    if not code or voucher.code_type == "random":
        code = generate_voucher_code()
        # Ensure unique
        while await db.vouchers.find_one({"code": code}):
            code = generate_voucher_code()
    else:
        # Check if code already exists
        existing = await db.vouchers.find_one({"code": code})
        if existing:
            raise HTTPException(status_code=400, detail="Voucher code already exists")
    
    new_voucher = {
        "id": generate_id(),
        "title": voucher.title,
        "title_te": voucher.title_te,
        "description": voucher.description,
        "description_te": voucher.description_te,
        "discount_type": voucher.discount_type,
        "discount_value": voucher.discount_value,
        "code": code,
        "code_type": voucher.code_type,
        "partner_name": voucher.partner_name,
        "partner_logo": voucher.partner_logo,
        "category": voucher.category,
        "terms_conditions": voucher.terms_conditions,
        "valid_from": voucher.valid_from or now_iso(),
        "valid_until": voucher.valid_until,
        "max_uses": voucher.max_uses,
        "max_uses_per_user": voucher.max_uses_per_user,
        "min_order_value": voucher.min_order_value,
        "is_active": voucher.is_active,
        "total_claims": 0,
        "created_by": user["id"],
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    await db.vouchers.insert_one(new_voucher)
    new_voucher.pop("_id", None)
    
    return {"message": "Voucher created successfully", "voucher": new_voucher}

@router.put("/admin/{voucher_id}")
async def admin_update_voucher(voucher_id: str, update: VoucherUpdate, user: dict = Depends(get_current_user)):
    """Admin: Update a voucher"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = now_iso()
    
    result = await db.vouchers.update_one({"id": voucher_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    updated = await db.vouchers.find_one({"id": voucher_id}, {"_id": 0})
    return {"message": "Voucher updated", "voucher": updated}

@router.delete("/admin/{voucher_id}")
async def admin_delete_voucher(voucher_id: str, user: dict = Depends(get_current_user)):
    """Admin: Delete a voucher"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.vouchers.delete_one({"id": voucher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    return {"message": "Voucher deleted"}

@router.get("/admin/all")
async def admin_get_all_vouchers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Admin: Get all vouchers including inactive"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    skip = (page - 1) * limit
    vouchers = await db.vouchers.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.vouchers.count_documents({})
    
    # Add claim counts
    for v in vouchers:
        v["total_claims"] = await db.voucher_claims.count_documents({"voucher_id": v["id"]})
    
    return {"vouchers": vouchers, "total": total, "page": page}

@router.get("/admin/{voucher_id}/claims")
async def admin_get_voucher_claims(voucher_id: str, user: dict = Depends(get_current_user)):
    """Admin: Get all claims for a voucher"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    claims = await db.voucher_claims.find({"voucher_id": voucher_id}, {"_id": 0}).sort("claimed_at", -1).to_list(100)
    return {"claims": claims, "total": len(claims)}
