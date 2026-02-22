"""Google Fit Integration Router - Real fitness data from Google Fit API"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import httpx
from dotenv import load_dotenv
from .utils import db, generate_id, now_iso, get_current_user

load_dotenv()

router = APIRouter(prefix="/fitness/google-fit", tags=["Google Fit"])

# Google Fit OAuth Config
GOOGLE_FIT_CLIENT_ID = os.environ.get("GOOGLE_FIT_CLIENT_ID")
GOOGLE_FIT_CLIENT_SECRET = os.environ.get("GOOGLE_FIT_CLIENT_SECRET")
GOOGLE_FIT_REDIRECT_URI = os.environ.get("GOOGLE_FIT_REDIRECT_URI")

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_FIT_API_URL = "https://www.googleapis.com/fitness/v1/users/me"

# Scopes for Google Fit
GOOGLE_FIT_SCOPES = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.location.read"
]

class GoogleFitToken(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[str] = None

# ============== OAuth Flow ==============

@router.get("/connect")
async def connect_google_fit(user: dict = Depends(get_current_user)):
    """Start Google Fit OAuth flow"""
    if not GOOGLE_FIT_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Fit not configured")
    
    # Generate state token for security
    state = f"{user['id']}_{generate_id()}"
    
    # Store state in database
    await db.oauth_states.update_one(
        {"user_id": user["id"]},
        {"$set": {"state": state, "created_at": now_iso()}},
        upsert=True
    )
    
    # Build authorization URL
    params = {
        "client_id": GOOGLE_FIT_CLIENT_ID,
        "redirect_uri": GOOGLE_FIT_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_FIT_SCOPES),
        "access_type": "offline",
        "state": state,
        "prompt": "consent"
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?" + "&".join(f"{k}={v}" for k, v in params.items())
    
    return {"auth_url": auth_url}

@router.get("/callback")
async def google_fit_callback(code: str = None, state: str = None, error: str = None):
    """Handle Google OAuth callback"""
    if error:
        return RedirectResponse(url=f"/fitness?error={error}")
    
    if not code or not state:
        return RedirectResponse(url="/fitness?error=missing_params")
    
    # Extract user_id from state
    try:
        user_id = state.split("_")[0]
    except:
        return RedirectResponse(url="/fitness?error=invalid_state")
    
    # Verify state
    stored_state = await db.oauth_states.find_one({"user_id": user_id})
    if not stored_state or stored_state.get("state") != state:
        return RedirectResponse(url="/fitness?error=state_mismatch")
    
    # Exchange code for tokens
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_FIT_CLIENT_ID,
                    "client_secret": GOOGLE_FIT_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_FIT_REDIRECT_URI
                }
            )
            tokens = response.json()
            
            if "error" in tokens:
                return RedirectResponse(url=f"/fitness?error={tokens['error']}")
            
            # Calculate expiry time
            expires_in = tokens.get("expires_in", 3600)
            expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()
            
            # Store tokens
            await db.google_fit_tokens.update_one(
                {"user_id": user_id},
                {"$set": {
                    "access_token": tokens["access_token"],
                    "refresh_token": tokens.get("refresh_token"),
                    "expires_at": expires_at,
                    "updated_at": now_iso()
                }},
                upsert=True
            )
            
            # Clean up state
            await db.oauth_states.delete_one({"user_id": user_id})
            
            return RedirectResponse(url="/fitness?connected=true")
            
    except Exception as e:
        print(f"Google Fit callback error: {e}")
        return RedirectResponse(url="/fitness?error=token_exchange_failed")

@router.get("/status")
async def get_connection_status(user: dict = Depends(get_current_user)):
    """Check if Google Fit is connected"""
    token = await db.google_fit_tokens.find_one({"user_id": user["id"]}, {"_id": 0})
    
    if not token:
        return {"connected": False}
    
    # Check if token is expired
    expires_at = token.get("expires_at")
    if expires_at:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expiry < datetime.now(timezone.utc):
            # Try to refresh token
            refreshed = await refresh_access_token(user["id"])
            if not refreshed:
                return {"connected": False, "expired": True}
    
    return {
        "connected": True,
        "expires_at": token.get("expires_at")
    }

@router.delete("/disconnect")
async def disconnect_google_fit(user: dict = Depends(get_current_user)):
    """Disconnect Google Fit"""
    await db.google_fit_tokens.delete_one({"user_id": user["id"]})
    return {"success": True, "message": "Google Fit disconnected"}

# ============== Token Management ==============

async def refresh_access_token(user_id: str) -> bool:
    """Refresh Google Fit access token"""
    token = await db.google_fit_tokens.find_one({"user_id": user_id})
    
    if not token or not token.get("refresh_token"):
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_FIT_CLIENT_ID,
                    "client_secret": GOOGLE_FIT_CLIENT_SECRET,
                    "refresh_token": token["refresh_token"],
                    "grant_type": "refresh_token"
                }
            )
            new_tokens = response.json()
            
            if "error" in new_tokens:
                return False
            
            expires_in = new_tokens.get("expires_in", 3600)
            expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()
            
            await db.google_fit_tokens.update_one(
                {"user_id": user_id},
                {"$set": {
                    "access_token": new_tokens["access_token"],
                    "expires_at": expires_at,
                    "updated_at": now_iso()
                }}
            )
            return True
            
    except Exception as e:
        print(f"Token refresh error: {e}")
        return False

async def get_valid_token(user_id: str) -> Optional[str]:
    """Get valid access token, refreshing if necessary"""
    token = await db.google_fit_tokens.find_one({"user_id": user_id})
    
    if not token:
        return None
    
    expires_at = token.get("expires_at")
    if expires_at:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expiry < datetime.now(timezone.utc):
            if not await refresh_access_token(user_id):
                return None
            token = await db.google_fit_tokens.find_one({"user_id": user_id})
    
    return token.get("access_token")

# ============== Data Fetching ==============

@router.get("/steps")
async def get_google_fit_steps(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """Get steps data from Google Fit"""
    access_token = await get_valid_token(user["id"])
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    # Calculate time range
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    # Convert to nanoseconds (Google Fit format)
    start_ns = int(start_time.timestamp() * 1e9)
    end_ns = int(end_time.timestamp() * 1e9)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_FIT_API_URL}/dataset:aggregate",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "aggregateBy": [{
                        "dataTypeName": "com.google.step_count.delta",
                        "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
                    }],
                    "bucketByTime": {"durationMillis": 86400000},  # 1 day
                    "startTimeMillis": int(start_time.timestamp() * 1000),
                    "endTimeMillis": int(end_time.timestamp() * 1000)
                }
            )
            
            data = response.json()
            
            if "error" in data:
                raise HTTPException(status_code=400, detail=data["error"]["message"])
            
            # Parse steps data
            daily_steps = []
            for bucket in data.get("bucket", []):
                start_ms = int(bucket["startTimeMillis"])
                date = datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                
                steps = 0
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        for value in point.get("value", []):
                            if "intVal" in value:
                                steps += value["intVal"]
                
                daily_steps.append({
                    "date": date,
                    "steps": steps
                })
            
            # Store in our database for caching
            for entry in daily_steps:
                await db.fitness_data.update_one(
                    {"user_id": user["id"], "date": entry["date"], "type": "steps"},
                    {"$set": {"value": entry["steps"], "source": "google_fit", "updated_at": now_iso()}},
                    upsert=True
                )
            
            return {
                "source": "google_fit",
                "days": days,
                "data": daily_steps,
                "total_steps": sum(d["steps"] for d in daily_steps)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Google Fit API error: {str(e)}")

@router.get("/calories")
async def get_google_fit_calories(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """Get calories burned from Google Fit"""
    access_token = await get_valid_token(user["id"])
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_FIT_API_URL}/dataset:aggregate",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "aggregateBy": [{
                        "dataTypeName": "com.google.calories.expended"
                    }],
                    "bucketByTime": {"durationMillis": 86400000},
                    "startTimeMillis": int(start_time.timestamp() * 1000),
                    "endTimeMillis": int(end_time.timestamp() * 1000)
                }
            )
            
            data = response.json()
            
            if "error" in data:
                raise HTTPException(status_code=400, detail=data["error"]["message"])
            
            daily_calories = []
            for bucket in data.get("bucket", []):
                start_ms = int(bucket["startTimeMillis"])
                date = datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                
                calories = 0
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        for value in point.get("value", []):
                            if "fpVal" in value:
                                calories += value["fpVal"]
                
                daily_calories.append({
                    "date": date,
                    "calories_burned": int(calories)
                })
            
            return {
                "source": "google_fit",
                "days": days,
                "data": daily_calories,
                "total_calories_burned": sum(d["calories_burned"] for d in daily_calories)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Google Fit API error: {str(e)}")

@router.get("/heart-rate")
async def get_google_fit_heart_rate(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """Get heart rate data from Google Fit"""
    access_token = await get_valid_token(user["id"])
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_FIT_API_URL}/dataset:aggregate",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "aggregateBy": [{
                        "dataTypeName": "com.google.heart_rate.bpm"
                    }],
                    "bucketByTime": {"durationMillis": 86400000},
                    "startTimeMillis": int(start_time.timestamp() * 1000),
                    "endTimeMillis": int(end_time.timestamp() * 1000)
                }
            )
            
            data = response.json()
            
            if "error" in data:
                raise HTTPException(status_code=400, detail=data["error"]["message"])
            
            daily_hr = []
            for bucket in data.get("bucket", []):
                start_ms = int(bucket["startTimeMillis"])
                date = datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                
                hr_values = []
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        for value in point.get("value", []):
                            if "fpVal" in value:
                                hr_values.append(value["fpVal"])
                
                if hr_values:
                    daily_hr.append({
                        "date": date,
                        "avg_bpm": int(sum(hr_values) / len(hr_values)),
                        "min_bpm": int(min(hr_values)),
                        "max_bpm": int(max(hr_values))
                    })
            
            return {
                "source": "google_fit",
                "days": days,
                "data": daily_hr
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Google Fit API error: {str(e)}")

@router.get("/distance")
async def get_google_fit_distance(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """Get distance traveled from Google Fit"""
    access_token = await get_valid_token(user["id"])
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_FIT_API_URL}/dataset:aggregate",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "aggregateBy": [{
                        "dataTypeName": "com.google.distance.delta"
                    }],
                    "bucketByTime": {"durationMillis": 86400000},
                    "startTimeMillis": int(start_time.timestamp() * 1000),
                    "endTimeMillis": int(end_time.timestamp() * 1000)
                }
            )
            
            data = response.json()
            
            if "error" in data:
                raise HTTPException(status_code=400, detail=data["error"]["message"])
            
            daily_distance = []
            for bucket in data.get("bucket", []):
                start_ms = int(bucket["startTimeMillis"])
                date = datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                
                distance = 0
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        for value in point.get("value", []):
                            if "fpVal" in value:
                                distance += value["fpVal"]
                
                daily_distance.append({
                    "date": date,
                    "distance_meters": int(distance),
                    "distance_km": round(distance / 1000, 2)
                })
            
            return {
                "source": "google_fit",
                "days": days,
                "data": daily_distance,
                "total_km": round(sum(d["distance_km"] for d in daily_distance), 2)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Google Fit API error: {str(e)}")

@router.get("/sleep")
async def get_google_fit_sleep(
    days: int = 7,
    user: dict = Depends(get_current_user)
):
    """Get sleep data from Google Fit"""
    access_token = await get_valid_token(user["id"])
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_FIT_API_URL}/dataset:aggregate",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "aggregateBy": [{
                        "dataTypeName": "com.google.sleep.segment"
                    }],
                    "bucketByTime": {"durationMillis": 86400000},
                    "startTimeMillis": int(start_time.timestamp() * 1000),
                    "endTimeMillis": int(end_time.timestamp() * 1000)
                }
            )
            
            data = response.json()
            
            if "error" in data:
                raise HTTPException(status_code=400, detail=data["error"]["message"])
            
            daily_sleep = []
            for bucket in data.get("bucket", []):
                start_ms = int(bucket["startTimeMillis"])
                date = datetime.fromtimestamp(start_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                
                sleep_duration_ms = 0
                for dataset in bucket.get("dataset", []):
                    for point in dataset.get("point", []):
                        start_ns = int(point.get("startTimeNanos", 0))
                        end_ns = int(point.get("endTimeNanos", 0))
                        sleep_duration_ms += (end_ns - start_ns) / 1e6
                
                if sleep_duration_ms > 0:
                    hours = sleep_duration_ms / (1000 * 60 * 60)
                    daily_sleep.append({
                        "date": date,
                        "sleep_hours": round(hours, 1)
                    })
            
            return {
                "source": "google_fit",
                "days": days,
                "data": daily_sleep,
                "avg_sleep_hours": round(sum(d["sleep_hours"] for d in daily_sleep) / max(len(daily_sleep), 1), 1)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Google Fit API error: {str(e)}")

@router.get("/summary")
async def get_google_fit_summary(user: dict = Depends(get_current_user)):
    """Get comprehensive fitness summary from Google Fit"""
    access_token = await get_valid_token(user["id"])
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Google Fit not connected")
    
    # Get today's data
    today = datetime.now(timezone.utc)
    start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_FIT_API_URL}/dataset:aggregate",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "aggregateBy": [
                        {"dataTypeName": "com.google.step_count.delta"},
                        {"dataTypeName": "com.google.calories.expended"},
                        {"dataTypeName": "com.google.distance.delta"},
                        {"dataTypeName": "com.google.active_minutes"}
                    ],
                    "bucketByTime": {"durationMillis": 86400000},
                    "startTimeMillis": int(start_of_day.timestamp() * 1000),
                    "endTimeMillis": int(today.timestamp() * 1000)
                }
            )
            
            data = response.json()
            
            summary = {
                "date": today.strftime("%Y-%m-%d"),
                "steps": 0,
                "calories_burned": 0,
                "distance_km": 0,
                "active_minutes": 0,
                "source": "google_fit"
            }
            
            for bucket in data.get("bucket", []):
                for dataset in bucket.get("dataset", []):
                    data_type = dataset.get("dataSourceId", "")
                    for point in dataset.get("point", []):
                        for value in point.get("value", []):
                            if "step_count" in data_type:
                                summary["steps"] += value.get("intVal", 0)
                            elif "calories" in data_type:
                                summary["calories_burned"] += int(value.get("fpVal", 0))
                            elif "distance" in data_type:
                                summary["distance_km"] += round(value.get("fpVal", 0) / 1000, 2)
                            elif "active_minutes" in data_type:
                                summary["active_minutes"] += value.get("intVal", 0)
            
            # Store summary
            await db.fitness_data.update_one(
                {"user_id": user["id"], "date": summary["date"], "type": "daily_summary"},
                {"$set": {**summary, "updated_at": now_iso()}},
                upsert=True
            )
            
            return summary
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Google Fit API error: {str(e)}")
