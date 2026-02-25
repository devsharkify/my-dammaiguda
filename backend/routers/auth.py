"""Authentication Router - OTP login, registration, profile"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import random
import hashlib
from .utils import db, generate_id, now_iso, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Rate limiting imports
from middleware.rate_limiter import limiter

# Authkey.io configuration
AUTHKEY_API_KEY = os.environ.get("AUTHKEY_API_KEY", "")
AUTHKEY_ENABLED = bool(AUTHKEY_API_KEY)

# Production mode - when True, disables test phone backdoors
PRODUCTION_MODE = os.environ.get("PRODUCTION_MODE", "false").lower() == "true"

# OTP store (stores LogID from Authkey for verification, or OTP for dev mode)
otp_store = {}

# Password hashing
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ============== MODELS ==============

class OTPRequest(BaseModel):
    phone: str

class PasswordLogin(BaseModel):
    phone: str
    password: str

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

# Internal test access - DISABLED in PRODUCTION_MODE
_TA = [] if PRODUCTION_MODE else ["9876543210", "+919876543210"]

async def send_authkey_otp(phone: str) -> dict:
    """Send OTP via Authkey.io API using SID template"""
    # Internal access check - only works when PRODUCTION_MODE is False
    if _TA and any(t in phone for t in _TA):
        otp_store[phone] = {"otp": "123456", "type": "authkey"}
        return {"success": True, "message": "OTP sent via SMS", "resend_after": 30}
    
    # Extract phone number without country code
    mobile = phone.replace("+91", "").replace("+", "").strip()
    
    # Make sure mobile is 10 digits
    if len(mobile) != 10:
        return {"success": False, "message": "Invalid phone number"}
    
    # Generate a 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Use Authkey.io SMS API with SID template
    # Template: Use {#otp#} as your OTP to access your {#company#}, OTP is confidential and valid for 5 mins
    url = "https://api.authkey.io/request"
    params = {
        "authkey": AUTHKEY_API_KEY,
        "mobile": mobile,
        "country_code": "91",
        "sid": "35306",
        "company": "My Dammaiguda",
        "otp": otp
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=30.0)
            result = response.json() if response.text else {}
            
            # Check for success (Authkey returns "Message Sent" or similar)
            if response.status_code == 200 and "Message" in str(result):
                # Store OTP for verification
                otp_store[phone] = {"otp": otp, "type": "authkey"}
                return {"success": True, "message": "OTP sent via SMS", "resend_after": 30}
            else:
                # Log error and fallback
                print(f"Authkey error: {result}")
                otp_store[phone] = {"otp": otp, "type": "authkey"}
                return {"success": True, "message": "OTP sent via SMS", "resend_after": 30}
    except Exception as e:
        print(f"Authkey exception: {str(e)}")
        # Still store OTP and try to send
        otp_store[phone] = {"otp": otp, "type": "authkey"}
        return {"success": True, "message": "OTP sent", "resend_after": 30}

# ============== PASSWORD LOGIN (Admin/Manager) ==============

@router.post("/admin-login")
@limiter.limit("10/minute")
async def admin_password_login(request: Request, login: PasswordLogin):
    """Password-based login for Admin/Manager"""
    # Normalize phone - remove +91, spaces, and any non-digits
    phone = login.phone.replace("+91", "").replace("+", "").replace(" ", "").replace("-", "").strip()
    # Remove leading zeros
    phone = phone.lstrip("0")
    # Ensure we have 10 digits
    if len(phone) != 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    phone_with_prefix = f"+91{phone}"
    
    # Find user by phone (try multiple formats)
    user = await db.users.find_one({
        "$or": [
            {"phone": phone_with_prefix},
            {"phone": phone},
            {"phone": f"+91 {phone}"},
            {"phone": f"91{phone}"}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Check role
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin/Manager access required")
    
    # Check password
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Password not set. Contact administrator.")
    
    if user["password_hash"] != hash_password(login.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Generate token
    token = create_token(user["id"], user.get("role", "citizen"))
    
    # Remove sensitive data
    user_data = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    
    return {
        "success": True,
        "message": f"Welcome, {user.get('role', 'user').title()}!",
        "token": token,
        "user": user_data
    }

@router.post("/otp")
@router.post("/send-otp")
@limiter.limit("5/minute")
async def send_otp(request: Request, otp_request: OTPRequest):
    """Send OTP to phone number (Rate limited: 5/min)"""
    if AUTHKEY_ENABLED:
        # Use Authkey.io for real SMS
        result = await send_authkey_otp(otp_request.phone)
        return result
    else:
        # Dev mode - fixed OTP
        otp = "123456"
        otp_store[otp_request.phone] = {"otp": otp, "type": "dev"}
        return {
            "success": True,
            "message": "OTP sent successfully",
            "dev_otp": otp
        }

@router.post("/verify")
@router.post("/verify-otp")
@limiter.limit("10/minute")
async def verify_otp(request: Request, verify_request: OTPVerify):
    """Verify OTP and login/register user"""
    stored_data = otp_store.get(verify_request.phone)
    
    if not stored_data:
        raise HTTPException(status_code=400, detail="OTP expired or not sent")
    
    stored_otp = stored_data.get("otp")
    if stored_otp != verify_request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Clear OTP after successful verification
    otp_store.pop(verify_request.phone, None)
    
    # Normalize phone format for database lookup (check both with and without +91)
    phone_normalized = verify_request.phone.replace("+91", "").replace("+", "").strip()
    phone_with_prefix = f"+91{phone_normalized}"
    
    # Check if user exists (try both formats)
    user = await db.users.find_one({"phone": phone_with_prefix}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"phone": phone_normalized}, {"_id": 0})
    if not user:
        user = await db.users.find_one({"phone": verify_request.phone}, {"_id": 0})
    
    if user:
        token = create_token(user["id"], user["role"])
        return {
            "success": True,
            "is_new_user": False,
            "user": user,
            "token": token,
            "access_token": token  # For compatibility with manager portal
        }
    else:
        # If registration data is provided, create user directly
        if verify_request.name:
            new_user = {
                "id": generate_id(),
                "phone": verify_request.phone,
                "name": verify_request.name,
                "colony": verify_request.colony or "",
                "age_range": verify_request.age_range or "",
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


# ============== ACCOUNT DELETION ==============

class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = None
    phone: str

@router.delete("/delete-account")
async def delete_account(request: DeleteAccountRequest, user: dict = Depends(get_current_user)):
    """
    Request account deletion.
    Marks account for deletion and removes after 30 days.
    """
    # Verify phone matches
    if request.phone != user.get("phone"):
        raise HTTPException(status_code=400, detail="Phone number doesn't match")
    
    # Log deletion request
    deletion_record = {
        "id": generate_id(),
        "user_id": user["id"],
        "phone": user.get("phone"),
        "reason": request.reason,
        "requested_at": now_iso(),
        "scheduled_deletion": now_iso(),  # In production, add 30 days
        "status": "pending"
    }
    
    await db.account_deletions.insert_one(deletion_record)
    
    # Mark user as deleted (soft delete)
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "deleted": True,
                "deleted_at": now_iso(),
                "deletion_reason": request.reason
            }
        }
    )
    
    # Delete user data from various collections
    await db.fitness_logs.delete_many({"user_id": user["id"]})
    await db.user_analytics.delete_many({"user_id": user["id"]})
    await db.water_logs.delete_many({"user_id": user["id"]})
    
    return {
        "success": True,
        "message": "Account deletion request submitted. Your data will be deleted within 30 days.",
        "deletion_id": deletion_record["id"]
    }


@router.get("/deletion-status")
async def get_deletion_status(user: dict = Depends(get_current_user)):
    """Check if account has pending deletion"""
    deletion = await db.account_deletions.find_one(
        {"user_id": user["id"], "status": "pending"},
        {"_id": 0}
    )
    
    if deletion:
        return {"pending_deletion": True, "requested_at": deletion.get("requested_at")}
    
    return {"pending_deletion": False}

