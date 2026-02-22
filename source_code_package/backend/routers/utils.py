"""Shared utilities and database connection for all routers"""
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import jwt
import math
import logging

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'dammaiguda-secret-key-2024')
JWT_EXPIRATION_HOURS = 24 * 7

# Security
security = HTTPBearer()

# ============== HELPER FUNCTIONS ==============

def generate_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def create_token(user_id: str, role: str):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== GEO HELPERS ==============

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters"""
    R = 6371000  # Earth's radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def is_inside_geofence(lat: float, lon: float, fence_lat: float, fence_lon: float, radius: int) -> bool:
    """Check if a point is inside a circular geofence"""
    distance = haversine_distance(lat, lon, fence_lat, fence_lon)
    return distance <= radius

# ============== CALORIE HELPERS ==============

ACTIVITY_MET_VALUES = {
    "walking": 3.5,
    "running": 9.8,
    "cycling": 7.5,
    "yoga": 2.5,
    "gym": 6.0,
    "swimming": 8.0,
    "sports": 7.0,
    "dancing": 5.0,
    "hiking": 6.0
}

def calculate_calories(activity_type: str, duration_minutes: int, weight_kg: float = 70):
    met = ACTIVITY_MET_VALUES.get(activity_type, 4.0)
    return int((met * weight_kg * duration_minutes) / 60)

def estimate_steps(activity_type: str, duration_minutes: int, distance_km: float = None):
    if distance_km:
        return int(distance_km * 1300)
    steps_per_minute = {
        "walking": 100,
        "running": 150,
        "hiking": 90
    }
    return int(steps_per_minute.get(activity_type, 80) * duration_minutes)
