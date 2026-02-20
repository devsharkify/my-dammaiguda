"""Authentication Router - OTP login, registration, profile"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import random
from .utils import db, generate_id, now_iso, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Authkey.io configuration
AUTHKEY_API_KEY = os.environ.get("AUTHKEY_API_KEY", "")
AUTHKEY_ENABLED = bool(AUTHKEY_API_KEY)

# OTP store (stores LogID from Authkey for verification, or OTP for dev mode)
otp_store = {}

# ============== MODELS ==============

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    colony: Optional[str] = None
    age_range: Optional[str] = None

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

async def send_authkey_otp(phone: str) -> dict:
    """Send OTP via Authkey.io API"""
    # Extract phone number without country code
    mobile = phone.replace("+91", "").replace("+", "").strip()
    
    # Generate a 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Use Authkey.io SMS API
    url = "https://api.authkey.io/request"
    params = {
        "authkey": AUTHKEY_API_KEY,
        "mobile": mobile,
        "country_code": "91",
        "sms": f"Your My Dammaiguda verification code is {otp}. Do not share with anyone.",
        "sender": "MYDAMM"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=30.0)
            result = response.json() if response.text else {}
            
            if response.status_code == 200:
                # Store OTP for verification
                otp_store[phone] = {"otp": otp, "type": "authkey"}
                return {"success": True, "message": "OTP sent via SMS"}
            else:
                # Fallback to dev mode
                otp_store[phone] = {"otp": "123456", "type": "dev"}
                return {"success": True, "message": "OTP sent (dev mode)", "dev_otp": "123456", "error": str(result)}
    except Exception as e:
        # Fallback to dev mode on error
        otp_store[phone] = {"otp": "123456", "type": "dev"}
        return {"success": True, "message": "OTP sent (dev mode)", "dev_otp": "123456", "error": str(e)}

@router.post("/otp")
@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP to phone number"""
    if AUTHKEY_ENABLED:
        # Use Authkey.io for real SMS
        result = await send_authkey_otp(request.phone)
        return result
    else:
        # Dev mode - fixed OTP
        otp = "123456"
        otp_store[request.phone] = {"otp": otp, "type": "dev"}
        return {
            "success": True,
            "message": "OTP sent successfully",
            "dev_otp": otp
        }

@router.post("/verify")
@router.post("/verify-otp")
async def verify_otp(request: OTPVerify):
    """Verify OTP and login/register user"""
    stored_data = otp_store.get(request.phone)
    
    if not stored_data:
        raise HTTPException(status_code=400, detail="OTP expired or not sent")
    
    stored_otp = stored_data.get("otp")
    if stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Clear OTP after successful verification
    otp_store.pop(request.phone, None)
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
        # If registration data is provided, create user directly
        if request.name:
            new_user = {
                "id": generate_id(),
                "phone": request.phone,
                "name": request.name,
                "colony": request.colony or "",
                "age_range": request.age_range or "",
                "role": "citizen",
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
                "is_new_user": False,
                "user": new_user,
                "token": token
            }
        
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
@router.put("/profile")
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
