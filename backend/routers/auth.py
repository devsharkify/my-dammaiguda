"""Authentication Router - OTP login, registration, profile"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from .utils import db, generate_id, now_iso, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OTP store (in-memory for demo)
otp_store = {}

# ============== MODELS ==============

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class UserRegister(BaseModel):
    phone: str
    name: str
    age_range: str
    colony: str
    role: str = "citizen"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    colony: Optional[str] = None
    age_range: Optional[str] = None

# ============== ROUTES ==============

@router.post("/otp")
async def send_otp(request: OTPRequest):
    """Send OTP to phone number (mock for development)"""
    otp = "123456"  # Fixed OTP for testing
    otp_store[request.phone] = otp
    
    return {
        "success": True,
        "message": "OTP sent successfully",
        "dev_otp": otp  # Remove in production
    }

@router.post("/verify")
async def verify_otp(request: OTPVerify):
    """Verify OTP and login/register user"""
    stored_otp = otp_store.get(request.phone)
    
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if user exists
    user = await db.users.find_one({"phone": request.phone}, {"_id": 0})
    
    if user:
        token = create_token(user["id"], user["role"])
        return {
            "success": True,
            "is_new_user": False,
            "user": user,
            "token": token
        }
    else:
        return {
            "success": True,
            "is_new_user": True,
            "message": "Please complete registration"
        }

@router.post("/register")
async def register_user(user_data: UserRegister):
    """Register a new user"""
    existing = await db.users.find_one({"phone": user_data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = {
        "id": generate_id(),
        "phone": user_data.phone,
        "name": user_data.name,
        "age_range": user_data.age_range,
        "colony": user_data.colony,
        "role": user_data.role,
        "created_at": now_iso(),
        "fitness_profile": {
            "daily_step_goal": 10000,
            "weekly_active_days_goal": 5
        }
    }
    
    await db.users.insert_one(new_user)
    new_user.pop("_id", None)
    
    token = create_token(new_user["id"], new_user["role"])
    
    return {
        "success": True,
        "user": new_user,
        "token": token
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return user

@router.put("/me")
async def update_me(updates: UserUpdate, user: dict = Depends(get_current_user)):
    """Update current user profile"""
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return updated_user
