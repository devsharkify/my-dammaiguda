"""Gift Shop Router - E-commerce style gift redemption with points (Normal + Privilege)"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/shop", tags=["Gift Shop"])

# ============== MODELS ==============

class GiftProduct(BaseModel):
    name: str
    description: str
    category: str
    image_url: str
    mrp: float  # Original price
    points_required: int  # Normal points required
    privilege_points_required: int = 0  # Privilege points required (0 = not needed)
    point_type: str = "normal"  # "normal", "privilege", or "both"
    delivery_fee: float = 0  # Delivery fee in INR
    stock_quantity: int
    is_active: bool = True

class GiftProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    mrp: Optional[float] = None
    points_required: Optional[int] = None
    privilege_points_required: Optional[int] = None
    point_type: Optional[str] = None
    delivery_fee: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None

class DeliveryAddress(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ClaimGiftRequest(BaseModel):
    product_id: str
    delivery_address: DeliveryAddress

class PointsTransaction(BaseModel):
    user_id: str
    points: int
    transaction_type: str  # "earned", "spent", "admin_credit", "admin_debit"
    description: str
    reference_id: Optional[str] = None

class AdminPointsAdjust(BaseModel):
    user_id: str
    points: int
    reason: str
    point_type: str = "normal"  # "normal" or "privilege"

class BulkPrivilegePointsAdjust(BaseModel):
    user_ids: List[str]  # Can include "ALL" to select all users
    points: int
    reason: str

class OrderStatusUpdate(BaseModel):
    status: str  # "pending", "approved", "rejected", "shipped", "delivered"
    admin_notes: Optional[str] = None
    tracking_number: Optional[str] = None

# ============== WALLET / POINTS ==============

@router.get("/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    """Get user's points wallet with both normal and privilege points"""
    wallet = await db.wallets.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not wallet:
        # Create wallet if doesn't exist with both point types
        wallet = {
            "id": generate_id(),
            "user_id": user["id"],
            "balance": 0,  # Normal points
            "privilege_balance": 0,  # Privilege points
            "total_earned": 0,
            "total_privilege_earned": 0,
            "total_spent": 0,
            "created_at": now_iso(),
            "updated_at": now_iso()
        }
        await db.wallets.insert_one(wallet)
    
    # Ensure privilege fields exist for old wallets
    if "privilege_balance" not in wallet:
        wallet["privilege_balance"] = 0
        wallet["total_privilege_earned"] = 0
        await db.wallets.update_one(
            {"user_id": user["id"]},
            {"$set": {"privilege_balance": 0, "total_privilege_earned": 0}}
        )
    
    # Get recent transactions
    transactions = await db.points_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        **wallet,
        "recent_transactions": transactions
    }

@router.get("/wallet/transactions")
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    """Get user's points transaction history"""
    skip = (page - 1) * limit
    
    transactions = await db.points_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.points_transactions.count_documents({"user_id": user["id"]})
    
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

async def add_points_transaction(user_id: str, points: int, trans_type: str, description: str, reference_id: str = None, point_type: str = "normal"):
    """Helper to add points transaction and update wallet (supports normal and privilege points)"""
    transaction = {
        "id": generate_id(),
        "user_id": user_id,
        "points": points,
        "point_type": point_type,  # "normal" or "privilege"
        "transaction_type": trans_type,
        "description": description,
        "reference_id": reference_id,
        "created_at": now_iso()
    }
    await db.points_transactions.insert_one(transaction)
    
    # Update wallet
    wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        wallet = {
            "id": generate_id(),
            "user_id": user_id,
            "balance": 0,
            "privilege_balance": 0,
            "total_earned": 0,
            "total_privilege_earned": 0,
            "total_spent": 0,
            "created_at": now_iso()
        }
        await db.wallets.insert_one(wallet)
    
    # Ensure privilege fields exist
    if "privilege_balance" not in wallet:
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$set": {"privilege_balance": 0, "total_privilege_earned": 0}}
        )
    
    update = {"updated_at": now_iso()}
    if point_type == "privilege":
        if trans_type in ["earned", "admin_credit"]:
            update["$inc"] = {"privilege_balance": points, "total_privilege_earned": points}
        else:
            update["$inc"] = {"privilege_balance": -points, "total_spent": points}
    else:  # normal points
        if trans_type in ["earned", "admin_credit"]:
            update["$inc"] = {"balance": points, "total_earned": points}
        else:
            update["$inc"] = {"balance": -points, "total_spent": points}
    
    await db.wallets.update_one({"user_id": user_id}, {"$set": {"updated_at": now_iso()}, "$inc": update.get("$inc", {})})
    
    return transaction
    
    return transaction

# ============== PRODUCTS ==============

@router.get("/products")
async def get_products(
    category: Optional[str] = None,
    min_points: Optional[int] = None,
    max_points: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    """Get available gift products"""
    query = {"is_active": True, "stock_quantity": {"$gt": 0}}
    
    if category:
        query["category"] = category
    if min_points:
        query["points_required"] = {"$gte": min_points}
    if max_points:
        query.setdefault("points_required", {})["$lte"] = max_points
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    
    products = await db.gift_products.find(query, {"_id": 0}).sort("points_required", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.gift_products.count_documents(query)
    
    # Get user's wallet balance (both normal and privilege)
    wallet = await db.wallets.find_one({"user_id": user["id"]}, {"_id": 0})
    user_balance = wallet.get("balance", 0) if wallet else 0
    user_privilege_balance = wallet.get("privilege_balance", 0) if wallet else 0
    
    # Mark which products user can afford based on point_type
    for p in products:
        point_type = p.get("point_type", "normal")
        normal_required = p.get("points_required", 0)
        privilege_required = p.get("privilege_points_required", 0)
        
        if point_type == "normal":
            p["can_afford"] = user_balance >= normal_required
        elif point_type == "privilege":
            p["can_afford"] = user_privilege_balance >= privilege_required
        else:  # both
            p["can_afford"] = (user_balance >= normal_required and user_privilege_balance >= privilege_required)
        
        # Ensure new fields have defaults for old products
        p.setdefault("privilege_points_required", 0)
        p.setdefault("point_type", "normal")
        p.setdefault("delivery_fee", 0)
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "user_balance": user_balance,
        "user_privilege_balance": user_privilege_balance
    }

@router.get("/products/{product_id}")
async def get_product(product_id: str, user: dict = Depends(get_current_user)):
    """Get single product details"""
    product = await db.gift_products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    wallet = await db.wallets.find_one({"user_id": user["id"]}, {"_id": 0, "balance": 1})
    user_balance = wallet.get("balance", 0) if wallet else 0
    product["can_afford"] = user_balance >= product["points_required"]
    product["user_balance"] = user_balance
    
    return product

@router.get("/categories")
async def get_categories(user: dict = Depends(get_current_user)):
    """Get all product categories"""
    categories = await db.gift_products.distinct("category", {"is_active": True})
    
    # Get count per category
    result = []
    for cat in categories:
        count = await db.gift_products.count_documents({"category": cat, "is_active": True})
        result.append({"name": cat, "count": count})
    
    return {"categories": result}

# ============== ORDERS ==============

@router.post("/claim")
async def claim_gift(request: ClaimGiftRequest, user: dict = Depends(get_current_user)):
    """Claim a gift using points"""
    # Get product
    product = await db.gift_products.find_one({"id": request.product_id, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unavailable")
    
    if product["stock_quantity"] <= 0:
        raise HTTPException(status_code=400, detail="Product out of stock")
    
    # Check user's balance
    wallet = await db.wallets.find_one({"user_id": user["id"]})
    if not wallet or wallet.get("balance", 0) < product["points_required"]:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Create order
    order = {
        "id": generate_id(),
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_phone": user.get("phone", ""),
        "product_id": product["id"],
        "product_name": product["name"],
        "product_image": product.get("image_url", ""),
        "mrp": product["mrp"],
        "points_spent": product["points_required"],
        "delivery_address": request.delivery_address.dict(),
        "status": "pending",  # pending, approved, rejected, shipped, delivered
        "admin_notes": None,
        "tracking_number": None,
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    # Deduct points
    await add_points_transaction(
        user["id"], 
        product["points_required"], 
        "spent", 
        f"Claimed gift: {product['name']}", 
        order["id"]
    )
    
    # Update wallet balance
    await db.wallets.update_one(
        {"user_id": user["id"]},
        {"$inc": {"balance": -product["points_required"]}}
    )
    
    # Reduce stock
    await db.gift_products.update_one(
        {"id": product["id"]},
        {"$inc": {"stock_quantity": -1}}
    )
    
    # Save order
    await db.gift_orders.insert_one(order)
    
    return {
        "message": "Gift claimed successfully!",
        "order": order
    }

@router.get("/orders")
async def get_my_orders(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    """Get user's gift orders"""
    query = {"user_id": user["id"]}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    orders = await db.gift_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.gift_orders.count_documents(query)
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    """Get single order details"""
    order = await db.gift_orders.find_one(
        {"id": order_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ============== ADMIN ENDPOINTS ==============

@router.get("/admin/products")
async def admin_get_products(
    include_inactive: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Admin: Get all products"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {} if include_inactive else {"is_active": True}
    skip = (page - 1) * limit
    
    products = await db.gift_products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.gift_products.count_documents(query)
    
    return {"products": products, "total": total, "page": page}

@router.post("/admin/products")
async def admin_create_product(product: GiftProduct, user: dict = Depends(get_current_user)):
    """Admin: Create a new gift product"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_product = {
        "id": generate_id(),
        **product.dict(),
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    await db.gift_products.insert_one(new_product)
    return {"message": "Product created", "product": {k: v for k, v in new_product.items() if k != "_id"}}

@router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, update: GiftProductUpdate, user: dict = Depends(get_current_user)):
    """Admin: Update a gift product"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = now_iso()
    
    result = await db.gift_products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db.gift_products.find_one({"id": product_id}, {"_id": 0})
    return {"message": "Product updated", "product": updated}

@router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, user: dict = Depends(get_current_user)):
    """Admin: Delete a gift product"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.gift_products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}

@router.get("/admin/orders")
async def admin_get_orders(
    status: Optional[str] = None,
    auto_approve_filter: Optional[str] = None,  # "junk", "auto_approve"
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Admin: Get all gift orders"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    orders = await db.gift_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.gift_orders.count_documents(query)
    
    # Get stats
    pending_count = await db.gift_orders.count_documents({"status": "pending"})
    approved_count = await db.gift_orders.count_documents({"status": "approved"})
    shipped_count = await db.gift_orders.count_documents({"status": "shipped"})
    delivered_count = await db.gift_orders.count_documents({"status": "delivered"})
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "stats": {
            "pending": pending_count,
            "approved": approved_count,
            "shipped": shipped_count,
            "delivered": delivered_count
        }
    }

@router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, update: OrderStatusUpdate, user: dict = Depends(get_current_user)):
    """Admin: Update order status"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    valid_statuses = ["pending", "approved", "rejected", "shipped", "delivered"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {
        "status": update.status,
        "updated_at": now_iso()
    }
    if update.admin_notes:
        update_data["admin_notes"] = update.admin_notes
    if update.tracking_number:
        update_data["tracking_number"] = update.tracking_number
    
    result = await db.gift_orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If rejected, refund points
    if update.status == "rejected":
        order = await db.gift_orders.find_one({"id": order_id})
        if order:
            await add_points_transaction(
                order["user_id"],
                order["points_spent"],
                "admin_credit",
                f"Refund for rejected order: {order['product_name']}",
                order_id
            )
            # Restore stock
            await db.gift_products.update_one(
                {"id": order["product_id"]},
                {"$inc": {"stock_quantity": 1}}
            )
    
    return {"message": f"Order status updated to {update.status}"}

@router.post("/admin/points/adjust")
async def admin_adjust_points(request: AdminPointsAdjust, user: dict = Depends(get_current_user)):
    """Admin: Add or deduct points from a user"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify target user exists
    target_user = await db.users.find_one({"id": request.user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    trans_type = "admin_credit" if request.points > 0 else "admin_debit"
    await add_points_transaction(
        request.user_id,
        abs(request.points),
        trans_type,
        f"Admin adjustment: {request.reason}",
        None
    )
    
    # Update wallet
    if request.points > 0:
        await db.wallets.update_one(
            {"user_id": request.user_id},
            {"$inc": {"balance": request.points, "total_earned": request.points}},
            upsert=True
        )
    else:
        await db.wallets.update_one(
            {"user_id": request.user_id},
            {"$inc": {"balance": request.points}},
            upsert=True
        )
    
    return {"message": f"Points adjusted by {request.points} for user"}

@router.get("/admin/users/points")
async def admin_get_users_points(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user)
):
    """Admin: Get all users with their points balance"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get wallets with user info
    wallets = await db.wallets.find({}, {"_id": 0}).sort("balance", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    
    # Enrich with user info
    for w in wallets:
        u = await db.users.find_one({"id": w["user_id"]}, {"_id": 0, "name": 1, "phone": 1})
        if u:
            w["user_name"] = u.get("name", "")
            w["user_phone"] = u.get("phone", "")
    
    total = await db.wallets.count_documents({})
    
    return {"users": wallets, "total": total, "page": page}

# ============== SETTINGS ==============

@router.get("/admin/settings")
async def admin_get_shop_settings(user: dict = Depends(get_current_user)):
    """Admin: Get shop settings"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = await db.shop_settings.find_one({"id": "shop_config"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "shop_config",
            "auto_points_from_fitness": True,  # Toggle for automatic points from fitness activities
            "points_per_1000_steps": 10,
            "points_per_workout": 5,
            "order_auto_approve": False,
            "min_points_to_redeem": 100
        }
        await db.shop_settings.insert_one(settings)
    
    return settings

@router.put("/admin/settings")
async def admin_update_shop_settings(settings: dict, user: dict = Depends(get_current_user)):
    """Admin: Update shop settings"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings["updated_at"] = now_iso()
    await db.shop_settings.update_one(
        {"id": "shop_config"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Settings updated"}
