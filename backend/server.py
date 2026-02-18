from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import random
import hashlib
import time
import cloudinary
import cloudinary.utils
import httpx
from bs4 import BeautifulSoup
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'dammaiguda-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Security
security = HTTPBearer(auto_error=False)

app = FastAPI(title="My Dammaiguda API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserCreate(BaseModel):
    phone: str
    name: str
    colony: Optional[str] = None
    age_range: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    phone: str
    name: str
    colony: Optional[str] = None
    age_range: Optional[str] = None
    role: str = "citizen"
    created_at: str
    language: str = "te"

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    colony: Optional[str] = None
    age_range: Optional[str] = None

class IssueCreate(BaseModel):
    category: str
    description: str
    location: Optional[Dict[str, float]] = None
    address: Optional[str] = None
    media_urls: List[str] = []

class IssueResponse(BaseModel):
    id: str
    category: str
    description: str
    status: str
    location: Optional[Dict[str, float]] = None
    address: Optional[str] = None
    media_urls: List[str] = []
    reporter_id: str
    reporter_name: str
    colony: Optional[str] = None
    created_at: str
    updated_at: str
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    resolution_notes: Optional[str] = None

# ============== KAIZER FIT MODELS ==============

class ActivityLog(BaseModel):
    activity_type: str  # walking, running, cycling, yoga, gym, swimming, sports
    duration_minutes: int
    distance_km: Optional[float] = None
    calories_burned: Optional[int] = None
    steps: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    notes: Optional[str] = None
    source: str = "manual"  # manual, watch, phone

class ActivityResponse(BaseModel):
    id: str
    user_id: str
    activity_type: str
    duration_minutes: int
    distance_km: Optional[float] = None
    calories_burned: int
    steps: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    date: str
    created_at: str

class FitnessGoal(BaseModel):
    goal_type: str  # daily_steps, weekly_distance, daily_calories, weekly_active_days
    target_value: int
    
class HealthMetrics(BaseModel):
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    resting_heart_rate: Optional[int] = None
    blood_sugar: Optional[float] = None

# ============== KAIZER DOCTOR MODELS ==============

class MealLog(BaseModel):
    meal_type: str  # breakfast, lunch, dinner, snack
    food_items: List[Dict[str, Any]]  # [{name, quantity, calories, protein, carbs, fat}]
    total_calories: int
    notes: Optional[str] = None

class WaterLog(BaseModel):
    glasses: int  # Each glass = 250ml
    
class SleepLog(BaseModel):
    sleep_start: str  # ISO datetime
    sleep_end: str
    quality: int  # 1-5

class MoodLog(BaseModel):
    mood: str  # happy, calm, stressed, anxious, sad, energetic
    energy_level: int  # 1-10
    notes: Optional[str] = None

class DietPlan(BaseModel):
    plan_type: str  # weight_loss, weight_gain, maintenance, diabetic, heart_healthy
    dietary_preference: str  # vegetarian, non_vegetarian, eggetarian, vegan
    allergies: List[str] = []
    health_conditions: List[str] = []

# ============== MY FAMILY MODELS ==============

class FamilyMemberRequest(BaseModel):
    phone: str
    relationship: str  # spouse, child, parent, sibling, other

class FamilyRequestResponse(BaseModel):
    request_id: str
    action: str  # accept, decline

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    battery_level: Optional[int] = None

# ============== AI CHAT MODELS ==============

class ChatMessage(BaseModel):
    message: str
    chat_type: str = "general"  # general, health, fitness, doctor, psychologist

class ChatResponse(BaseModel):
    id: str
    user_id: str
    message: str
    response: str
    chat_type: str
    created_at: str

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
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_role(user: dict, roles: List[str]):
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# OTP store
otp_store = {}

# ============== AQI HELPER FUNCTIONS ==============

def get_indian_aqi_category(aqi: int):
    """Get Indian AQI category and color based on value"""
    if aqi <= 50:
        return {"category": "Good", "category_te": "మంచి", "color": "#00B050", "health_impact": "Minimal impact", "health_impact_te": "కనీస ప్రభావం"}
    elif aqi <= 100:
        return {"category": "Moderate", "category_te": "మధ్యస్థం", "color": "#92D050", "health_impact": "Minor breathing discomfort to sensitive people", "health_impact_te": "సున్నితమైన వ్యక్తులకు స్వల్ప శ్వాసకోశ అసౌకర్యం"}
    elif aqi <= 200:
        return {"category": "Poor", "category_te": "చెడు", "color": "#FFFF00", "health_impact": "Breathing discomfort to people with lungs, asthma and heart diseases", "health_impact_te": "ఊపిరితిత్తులు, ఆస్తమా మరియు గుండె వ్యాధులు ఉన్న వారికి శ్వాసకోశ అసౌకర్యం"}
    elif aqi <= 300:
        return {"category": "Unhealthy", "category_te": "అనారోగ్యకరమైన", "color": "#FF9900", "health_impact": "Breathing discomfort to all on prolonged exposure", "health_impact_te": "దీర్ఘకాలిక బహిర్గతంపై అందరికీ శ్వాసకోశ అసౌకర్యం"}
    elif aqi <= 400:
        return {"category": "Severe", "category_te": "తీవ్రమైన", "color": "#FF0000", "health_impact": "Affects healthy people and seriously impacts those with existing diseases", "health_impact_te": "ఆరోగ్యకరమైన వ్యక్తులను ప్రభావితం చేస్తుంది మరియు ఇప్పటికే వ్యాధులు ఉన్నవారిని తీవ్రంగా ప్రభావితం చేస్తుంది"}
    else:
        return {"category": "Hazardous", "category_te": "ప్రమాదకరమైన", "color": "#800000", "health_impact": "Serious health impacts even on light physical work", "health_impact_te": "తేలికపాటి శారీరక పనిపై కూడా తీవ్రమైన ఆరోగ్య ప్రభావాలు"}

def calculate_indian_aqi_pm25(pm25: float) -> int:
    """Calculate Indian AQI from PM2.5 concentration (μg/m³)"""
    if pm25 <= 30:
        return int((pm25 / 30) * 50)
    elif pm25 <= 60:
        return int(50 + ((pm25 - 30) / 30) * 50)
    elif pm25 <= 90:
        return int(100 + ((pm25 - 60) / 30) * 100)
    elif pm25 <= 120:
        return int(200 + ((pm25 - 90) / 30) * 100)
    elif pm25 <= 250:
        return int(300 + ((pm25 - 120) / 130) * 100)
    else:
        return int(400 + ((pm25 - 250) / 130) * 100)

async def scrape_aqi_in(url: str) -> dict:
    """Scrape AQI data from aqi.in website"""
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = await client.get(url, headers=headers, timeout=30.0, follow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            page_text = soup.get_text()
            
            # Extract PM2.5 and PM10 values
            pm25_match = re.search(r'PM2\.5\s*[:\s]+(\d+)\s*µg/m³', page_text, re.IGNORECASE)
            pm25_value = int(pm25_match.group(1)) if pm25_match else None
            
            pm10_match = re.search(r'PM10\s*[:\s]+(\d+)\s*µg/m³', page_text, re.IGNORECASE)
            pm10_value = int(pm10_match.group(1)) if pm10_match else None
            
            # Calculate Indian AQI from PM2.5
            aqi_value = calculate_indian_aqi_pm25(pm25_value) if pm25_value else None
            category_info = get_indian_aqi_category(aqi_value) if aqi_value else {
                "category": "Unknown", "category_te": "తెలియదు", "color": "#888888",
                "health_impact": "Data unavailable", "health_impact_te": "డేటా అందుబాటులో లేదు"
            }
            
            return {
                "aqi": aqi_value,
                "category": category_info["category"],
                "category_te": category_info["category_te"],
                "color": category_info["color"],
                "health_impact": category_info["health_impact"],
                "health_impact_te": category_info["health_impact_te"],
                "pollutants": [
                    {"name": "PM2.5", "value": pm25_value, "unit": "µg/m³"},
                    {"name": "PM10", "value": pm10_value, "unit": "µg/m³"}
                ],
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "source": "aqi.in",
                "aqi_standard": "IN"
            }
    except Exception as e:
        logging.error(f"AQI scrape error: {str(e)}")
        return {
            "aqi": None,
            "category": "Error",
            "category_te": "లోపం",
            "color": "#888888",
            "health_impact": "Failed to fetch data",
            "health_impact_te": "డేటా పొందడంలో విఫలమైంది",
            "pollutants": [],
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "source": "aqi.in",
            "error": str(e)
        }

# Calorie calculation helpers
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
    calories = met * weight_kg * (duration_minutes / 60)
    return int(calories)

# South Indian food database (Hyderabad focus)
SOUTH_INDIAN_FOODS = {
    "breakfast": [
        {"name": "Idli (2 pcs)", "name_te": "ఇడ్లీ", "calories": 120, "protein": 4, "carbs": 24, "fat": 1},
        {"name": "Dosa", "name_te": "దోస", "calories": 168, "protein": 4, "carbs": 28, "fat": 5},
        {"name": "Upma (1 cup)", "name_te": "ఉప్మా", "calories": 210, "protein": 5, "carbs": 35, "fat": 6},
        {"name": "Pesarattu", "name_te": "పెసరట్టు", "calories": 150, "protein": 8, "carbs": 22, "fat": 4},
        {"name": "Poha (1 cup)", "name_te": "పోహా", "calories": 180, "protein": 4, "carbs": 32, "fat": 5},
        {"name": "Puri (2 pcs)", "name_te": "పూరీ", "calories": 200, "protein": 4, "carbs": 26, "fat": 9},
        {"name": "Vada (2 pcs)", "name_te": "వడ", "calories": 220, "protein": 6, "carbs": 20, "fat": 13},
        {"name": "Pongal (1 cup)", "name_te": "పొంగల్", "calories": 250, "protein": 6, "carbs": 40, "fat": 8},
        {"name": "Uttapam", "name_te": "ఉత్తపం", "calories": 200, "protein": 5, "carbs": 32, "fat": 6},
        {"name": "Ragi Mudde", "name_te": "రాగి ముద్ద", "calories": 180, "protein": 4, "carbs": 38, "fat": 1}
    ],
    "lunch": [
        {"name": "Rice (1 cup)", "name_te": "అన్నం", "calories": 200, "protein": 4, "carbs": 45, "fat": 0},
        {"name": "Sambar (1 cup)", "name_te": "సాంబార్", "calories": 130, "protein": 6, "carbs": 18, "fat": 4},
        {"name": "Rasam (1 cup)", "name_te": "రసం", "calories": 50, "protein": 2, "carbs": 8, "fat": 1},
        {"name": "Dal (1 cup)", "name_te": "పప్పు", "calories": 150, "protein": 9, "carbs": 22, "fat": 3},
        {"name": "Hyderabadi Biryani", "name_te": "హైదరాబాదీ బిర్యానీ", "calories": 450, "protein": 18, "carbs": 52, "fat": 18},
        {"name": "Curd Rice", "name_te": "పెరుగు అన్నం", "calories": 220, "protein": 6, "carbs": 38, "fat": 5},
        {"name": "Palak Paneer", "name_te": "పాలక్ పనీర్", "calories": 280, "protein": 14, "carbs": 12, "fat": 20},
        {"name": "Chapati (2 pcs)", "name_te": "చపాతీ", "calories": 180, "protein": 6, "carbs": 32, "fat": 4},
        {"name": "Mixed Veg Curry", "name_te": "కూరగాయల కర్రీ", "calories": 150, "protein": 4, "carbs": 15, "fat": 8},
        {"name": "Chicken Curry", "name_te": "చికెన్ కర్రీ", "calories": 300, "protein": 25, "carbs": 8, "fat": 18}
    ],
    "dinner": [
        {"name": "Jowar Roti (2 pcs)", "name_te": "జొన్న రొట్టె", "calories": 180, "protein": 5, "carbs": 36, "fat": 2},
        {"name": "Dal Khichdi", "name_te": "ఖిచ్డి", "calories": 250, "protein": 8, "carbs": 42, "fat": 5},
        {"name": "Vegetable Soup", "name_te": "కూరగాయల సూప్", "calories": 80, "protein": 3, "carbs": 12, "fat": 2},
        {"name": "Roti with Sabzi", "name_te": "రోటీ కూర", "calories": 280, "protein": 8, "carbs": 40, "fat": 10},
        {"name": "Dosa with Chutney", "name_te": "దోస చట్నీ", "calories": 200, "protein": 5, "carbs": 30, "fat": 7},
        {"name": "Pulihora", "name_te": "పులిహోర", "calories": 220, "protein": 4, "carbs": 42, "fat": 5},
        {"name": "Pappu Charu", "name_te": "పప్పు చారు", "calories": 160, "protein": 8, "carbs": 20, "fat": 4}
    ],
    "snacks": [
        {"name": "Mirchi Bajji (2)", "name_te": "మిర్చి బజ్జి", "calories": 180, "protein": 3, "carbs": 18, "fat": 11},
        {"name": "Punugulu (4 pcs)", "name_te": "పునుగులు", "calories": 200, "protein": 4, "carbs": 24, "fat": 10},
        {"name": "Masala Chai", "name_te": "మసాలా టీ", "calories": 90, "protein": 2, "carbs": 12, "fat": 3},
        {"name": "Biscuits (4)", "name_te": "బిస్కెట్లు", "calories": 140, "protein": 2, "carbs": 20, "fat": 6},
        {"name": "Banana", "name_te": "అరటిపండు", "calories": 105, "protein": 1, "carbs": 27, "fat": 0},
        {"name": "Groundnuts (handful)", "name_te": "వేరుశెనగ", "calories": 160, "protein": 7, "carbs": 5, "fat": 14},
        {"name": "Coconut Water", "name_te": "కొబ్బరి నీళ్ళు", "calories": 45, "protein": 0, "carbs": 9, "fat": 0},
        {"name": "Fruit Salad", "name_te": "పండ్ల సలాడ్", "calories": 80, "protein": 1, "carbs": 20, "fat": 0}
    ]
}

# AI System Prompts
AI_SYSTEM_PROMPTS = {
    "general": """You are a helpful assistant for the My Dammaiguda civic engagement platform. 
You help citizens with general queries about the platform, ward issues, and community matters.
Respond in the language the user uses (Telugu or English).
Be concise and helpful.""",

    "health": """You are Kaizer Doctor, a health advisor for My Dammaiguda platform.
You provide general health advice focused on the Dammaiguda community near the dump yard.
Key focus areas:
- Pollution-related health concerns
- Respiratory health
- Safe outdoor activity timing
- General wellness tips
IMPORTANT: Always recommend consulting a real doctor for serious health issues.
You are NOT a replacement for professional medical advice.
Respond in the user's language (Telugu or English).""",

    "fitness": """You are Kaizer Fit Coach, a fitness advisor for the My Dammaiguda platform.
You help users with:
- Exercise recommendations
- Activity tracking advice
- Fitness goal setting
- Pollution-safe exercise timing for Dammaiguda area
- Workout suggestions for different fitness levels
Be encouraging and supportive. Consider the pollution levels near the dump yard when giving outdoor activity advice.
Respond in the user's language.""",

    "doctor": """You are Kaizer Doctor AI, a virtual health assistant for Dammaiguda citizens.
You provide:
- Diet recommendations (South Indian/Hyderabad cuisine focused)
- Basic health guidance
- Wellness tips
- Information about common health conditions
- Advice on dealing with pollution-related health issues

IMPORTANT RULES:
1. You are NOT a replacement for real doctors
2. Always recommend professional medical help for serious symptoms
3. Focus on preventive care and healthy lifestyle
4. Be culturally sensitive to Telugu/Hyderabadi context
5. Consider the dump yard pollution when giving advice

Respond in the user's language (Telugu or English).""",

    "psychologist": """You are Kaizer Mind, a mental wellness companion for Dammaiguda citizens.
You provide:
- Emotional support and active listening
- Stress management techniques
- Mindfulness and breathing exercises
- General mental wellness tips
- Support during difficult times

IMPORTANT RULES:
1. You are NOT a licensed psychologist
2. Always recommend professional help for serious mental health issues
3. Be empathetic, warm, and supportive
4. Maintain confidentiality in your responses
5. Focus on coping strategies and self-care

If someone expresses suicidal thoughts or severe distress, immediately recommend:
- iCall: 9152987821
- Vandrevala Foundation: 1860-2662-345

Respond warmly in the user's language."""
}

# ============== AUTH ROUTES ==============

@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    phone = request.phone.strip()
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    # Generate OTP (mock: 123456 for dev)
    otp = "123456"
    otp_store[phone] = {"otp": otp, "expires": datetime.now(timezone.utc) + timedelta(minutes=10)}
    
    # TODO: Integrate Twilio for real SMS
    return {"success": True, "message": "OTP sent successfully", "dev_otp": otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify):
    phone = request.phone.strip()
    
    stored = otp_store.get(phone)
    if not stored or stored["otp"] != request.otp:
        if request.otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    
    if user:
        token = create_token(user["id"], user.get("role", "citizen"))
        return {"success": True, "token": token, "user": user, "is_new": False}
    else:
        if not request.name:
            return {"success": True, "is_new": True, "needs_registration": True}
        
        new_user = {
            "id": generate_id(),
            "phone": phone,
            "name": request.name,
            "colony": request.colony,
            "age_range": request.age_range,
            "role": "citizen",
            "language": "te",
            "created_at": now_iso(),
            "health_profile": {}
        }
        await db.users.insert_one(new_user)
        new_user.pop("_id", None)
        
        token = create_token(new_user["id"], "citizen")
        return {"success": True, "token": token, "user": new_user, "is_new": True}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.put("/auth/profile")
async def update_profile(
    name: Optional[str] = None,
    colony: Optional[str] = None,
    age_range: Optional[str] = None,
    language: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    updates = {}
    if name: updates["name"] = name
    if colony: updates["colony"] = colony
    if age_range: updates["age_range"] = age_range
    if language and language in ["te", "en"]: updates["language"] = language
    
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return updated_user

# ============== KAIZER FIT ROUTES (EXPANDED) ==============

@api_router.post("/fitness/activity")
async def log_activity(activity: ActivityLog, user: dict = Depends(get_current_user)):
    """Log any type of physical activity"""
    valid_types = ["walking", "running", "cycling", "yoga", "gym", "swimming", "sports", "dancing", "hiking"]
    if activity.activity_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid activity type. Valid: {valid_types}")
    
    # Get user weight for calorie calculation
    health_profile = user.get("health_profile", {})
    weight = health_profile.get("weight_kg", 70)
    
    # Calculate calories if not provided
    calories = activity.calories_burned or calculate_calories(activity.activity_type, activity.duration_minutes, weight)
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    new_activity = {
        "id": generate_id(),
        "user_id": user["id"],
        "activity_type": activity.activity_type,
        "duration_minutes": activity.duration_minutes,
        "distance_km": activity.distance_km,
        "calories_burned": calories,
        "steps": activity.steps,
        "heart_rate_avg": activity.heart_rate_avg,
        "heart_rate_max": activity.heart_rate_max,
        "notes": activity.notes,
        "source": activity.source,
        "date": today,
        "created_at": now_iso()
    }
    
    await db.activities.insert_one(new_activity)
    new_activity.pop("_id", None)
    
    # Update daily summary
    await update_daily_fitness_summary(user["id"], today)
    
    return new_activity

async def update_daily_fitness_summary(user_id: str, date: str):
    """Update or create daily fitness summary"""
    activities = await db.activities.find({"user_id": user_id, "date": date}, {"_id": 0}).to_list(100)
    
    total_steps = sum(a.get("steps", 0) or 0 for a in activities)
    total_calories = sum(a.get("calories_burned", 0) for a in activities)
    total_duration = sum(a.get("duration_minutes", 0) for a in activities)
    total_distance = sum(a.get("distance_km", 0) or 0 for a in activities)
    
    # Calculate fitness score (0-100)
    step_score = min(50, (total_steps / 10000) * 50)
    calorie_score = min(30, (total_calories / 500) * 30)
    duration_score = min(20, (total_duration / 60) * 20)
    fitness_score = round(step_score + calorie_score + duration_score)
    
    summary = {
        "user_id": user_id,
        "date": date,
        "total_steps": total_steps,
        "total_calories": total_calories,
        "total_duration_minutes": total_duration,
        "total_distance_km": round(total_distance, 2),
        "activity_count": len(activities),
        "fitness_score": fitness_score,
        "updated_at": now_iso()
    }
    
    await db.fitness_daily.update_one(
        {"user_id": user_id, "date": date},
        {"$set": summary},
        upsert=True
    )
    
    return summary

@api_router.get("/fitness/activities")
async def get_activities(
    days: int = 7,
    activity_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get user's activity history"""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    query = {"user_id": user["id"], "date": {"$gte": cutoff_date}}
    if activity_type:
        query["activity_type"] = activity_type
    
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return activities

@api_router.get("/fitness/dashboard")
async def get_fitness_dashboard(user: dict = Depends(get_current_user)):
    """Get comprehensive fitness dashboard data"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Today's summary
    today_summary = await db.fitness_daily.find_one(
        {"user_id": user["id"], "date": today},
        {"_id": 0}
    )
    
    # Weekly data
    weekly_data = await db.fitness_daily.find(
        {"user_id": user["id"], "date": {"$gte": week_ago}},
        {"_id": 0}
    ).sort("date", 1).to_list(7)
    
    # Monthly totals
    monthly_activities = await db.activities.find(
        {"user_id": user["id"], "date": {"$gte": month_ago}},
        {"_id": 0}
    ).to_list(500)
    
    monthly_stats = {
        "total_activities": len(monthly_activities),
        "total_steps": sum(a.get("steps", 0) or 0 for a in monthly_activities),
        "total_calories": sum(a.get("calories_burned", 0) for a in monthly_activities),
        "total_distance_km": round(sum(a.get("distance_km", 0) or 0 for a in monthly_activities), 2),
        "total_duration_minutes": sum(a.get("duration_minutes", 0) for a in monthly_activities)
    }
    
    # Activity breakdown
    activity_breakdown = {}
    for a in monthly_activities:
        atype = a.get("activity_type", "other")
        if atype not in activity_breakdown:
            activity_breakdown[atype] = {"count": 0, "duration": 0, "calories": 0}
        activity_breakdown[atype]["count"] += 1
        activity_breakdown[atype]["duration"] += a.get("duration_minutes", 0)
        activity_breakdown[atype]["calories"] += a.get("calories_burned", 0)
    
    # Goals
    goals = await db.fitness_goals.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    
    # Streaks
    streak = await calculate_streak(user["id"])
    
    return {
        "today": today_summary or {"total_steps": 0, "total_calories": 0, "fitness_score": 0},
        "weekly_data": weekly_data,
        "monthly_stats": monthly_stats,
        "activity_breakdown": activity_breakdown,
        "goals": goals,
        "streak": streak
    }

async def calculate_streak(user_id: str):
    """Calculate current activity streak"""
    summaries = await db.fitness_daily.find(
        {"user_id": user_id, "activity_count": {"$gt": 0}},
        {"_id": 0, "date": 1}
    ).sort("date", -1).to_list(60)
    
    if not summaries:
        return {"current": 0, "best": 0}
    
    dates = [s["date"] for s in summaries]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Check if streak is active
    if dates[0] not in [today, yesterday]:
        return {"current": 0, "best": len(dates)}
    
    # Count consecutive days
    streak = 1
    for i in range(1, len(dates)):
        prev_date = datetime.strptime(dates[i-1], "%Y-%m-%d")
        curr_date = datetime.strptime(dates[i], "%Y-%m-%d")
        if (prev_date - curr_date).days == 1:
            streak += 1
        else:
            break
    
    return {"current": streak, "best": max(streak, len(dates))}

@api_router.post("/fitness/goals")
async def set_fitness_goals(goals: FitnessGoal, user: dict = Depends(get_current_user)):
    """Set or update fitness goals"""
    valid_types = ["daily_steps", "weekly_distance", "daily_calories", "weekly_active_days"]
    if goals.goal_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid goal type. Valid: {valid_types}")
    
    await db.fitness_goals.update_one(
        {"user_id": user["id"]},
        {"$set": {goals.goal_type: goals.target_value, "updated_at": now_iso()}},
        upsert=True
    )
    
    return {"success": True, "message": "Goal set successfully"}

@api_router.get("/fitness/leaderboard")
async def get_leaderboard(period: str = "week", metric: str = "steps"):
    """Get fitness leaderboard (anonymized)"""
    if period == "week":
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    
    if metric == "steps":
        field = "total_steps"
    elif metric == "calories":
        field = "total_calories"
    else:
        field = "total_distance_km"
    
    pipeline = [
        {"$match": {"date": {"$gte": cutoff}}},
        {"$group": {
            "_id": "$user_id",
            "total": {"$sum": f"${field}"},
            "days_active": {"$sum": 1}
        }},
        {"$sort": {"total": -1}},
        {"$limit": 10}
    ]
    
    results = await db.fitness_daily.aggregate(pipeline).to_list(10)
    
    leaderboard = []
    for i, r in enumerate(results):
        user = await db.users.find_one({"id": r["_id"]}, {"name": 1, "colony": 1})
        name = user.get("name", "Citizen") if user else "Citizen"
        anon_name = name[0] + "***" + name[-1] if len(name) > 2 else name[0] + "***"
        leaderboard.append({
            "rank": i + 1,
            "name": anon_name,
            "colony": user.get("colony") if user else None,
            "total": r["total"],
            "days_active": r["days_active"]
        })
    
    return leaderboard

@api_router.get("/fitness/challenges")
async def get_challenges(active_only: bool = True):
    """Get available fitness challenges"""
    query = {"is_active": True} if active_only else {}
    challenges = await db.challenges.find(query, {"_id": 0, "participant_ids": 0}).to_list(20)
    return challenges

@api_router.post("/fitness/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, user: dict = Depends(get_current_user)):
    """Join a fitness challenge"""
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if user["id"] in challenge.get("participant_ids", []):
        raise HTTPException(status_code=400, detail="Already joined")
    
    await db.challenges.update_one(
        {"id": challenge_id},
        {"$push": {"participant_ids": user["id"]}, "$inc": {"participants": 1}}
    )
    return {"success": True}

@api_router.post("/fitness/sync")
async def sync_wearable_data(
    data: Dict[str, Any] = Body(...),
    user: dict = Depends(get_current_user)
):
    """Sync data from wearable devices (Apple Watch, Android Wear, Fitbit, etc.)"""
    source = data.get("source", "unknown")  # apple_watch, android_wear, fitbit, google_fit, samsung_health
    
    # Process step data
    if "steps" in data:
        for step_entry in data["steps"]:
            await db.activities.update_one(
                {"user_id": user["id"], "date": step_entry["date"], "source": source, "activity_type": "walking"},
                {"$set": {
                    "id": generate_id(),
                    "user_id": user["id"],
                    "activity_type": "walking",
                    "steps": step_entry.get("count", 0),
                    "calories_burned": step_entry.get("calories", 0),
                    "distance_km": step_entry.get("distance_km"),
                    "source": source,
                    "date": step_entry["date"],
                    "created_at": now_iso()
                }},
                upsert=True
            )
    
    # Process workouts
    if "workouts" in data:
        for workout in data["workouts"]:
            activity = ActivityLog(
                activity_type=workout.get("type", "gym"),
                duration_minutes=workout.get("duration_minutes", 0),
                distance_km=workout.get("distance_km"),
                calories_burned=workout.get("calories"),
                heart_rate_avg=workout.get("heart_rate_avg"),
                heart_rate_max=workout.get("heart_rate_max"),
                source=source
            )
            await log_activity(activity, user)
    
    # Process health metrics
    if "health_metrics" in data:
        await update_health_metrics(HealthMetrics(**data["health_metrics"]), user)
    
    return {"success": True, "message": "Data synced successfully"}

# ============== KAIZER DOCTOR ROUTES ==============

@api_router.post("/doctor/health-metrics")
async def update_health_metrics(metrics: HealthMetrics, user: dict = Depends(get_current_user)):
    """Update user's health metrics"""
    updates = {}
    if metrics.weight_kg: updates["weight_kg"] = metrics.weight_kg
    if metrics.height_cm: updates["height_cm"] = metrics.height_cm
    if metrics.blood_pressure_systolic: updates["blood_pressure_systolic"] = metrics.blood_pressure_systolic
    if metrics.blood_pressure_diastolic: updates["blood_pressure_diastolic"] = metrics.blood_pressure_diastolic
    if metrics.resting_heart_rate: updates["resting_heart_rate"] = metrics.resting_heart_rate
    if metrics.blood_sugar: updates["blood_sugar"] = metrics.blood_sugar
    
    if updates:
        updates["updated_at"] = now_iso()
        # Store history
        history_entry = {
            "id": generate_id(),
            "user_id": user["id"],
            **updates,
            "recorded_at": now_iso()
        }
        await db.health_metrics_history.insert_one(history_entry)
        
        # Update user profile
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {f"health_profile.{k}": v for k, v in updates.items()}}
        )
    
    return {"success": True, "message": "Health metrics updated"}

@api_router.get("/doctor/health-metrics")
async def get_health_metrics(days: int = 30, user: dict = Depends(get_current_user)):
    """Get health metrics history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    history = await db.health_metrics_history.find(
        {"user_id": user["id"], "recorded_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("recorded_at", -1).to_list(100)
    
    current = user.get("health_profile", {})
    
    # Calculate BMI if height and weight available
    bmi = None
    bmi_category = None
    if current.get("weight_kg") and current.get("height_cm"):
        height_m = current["height_cm"] / 100
        bmi = round(current["weight_kg"] / (height_m ** 2), 1)
        if bmi < 18.5:
            bmi_category = "underweight"
        elif bmi < 25:
            bmi_category = "normal"
        elif bmi < 30:
            bmi_category = "overweight"
        else:
            bmi_category = "obese"
    
    return {
        "current": current,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "history": history
    }

@api_router.post("/doctor/meal")
async def log_meal(meal: MealLog, user: dict = Depends(get_current_user)):
    """Log a meal"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    meal_entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "meal_type": meal.meal_type,
        "food_items": meal.food_items,
        "total_calories": meal.total_calories,
        "notes": meal.notes,
        "date": today,
        "created_at": now_iso()
    }
    
    await db.meals.insert_one(meal_entry)
    meal_entry.pop("_id", None)
    
    # Update daily nutrition summary
    await update_daily_nutrition(user["id"], today)
    
    return meal_entry

async def update_daily_nutrition(user_id: str, date: str):
    """Update daily nutrition summary"""
    meals = await db.meals.find({"user_id": user_id, "date": date}, {"_id": 0}).to_list(20)
    
    total_calories = sum(m.get("total_calories", 0) for m in meals)
    total_protein = sum(sum(f.get("protein", 0) for f in m.get("food_items", [])) for m in meals)
    total_carbs = sum(sum(f.get("carbs", 0) for f in m.get("food_items", [])) for m in meals)
    total_fat = sum(sum(f.get("fat", 0) for f in m.get("food_items", [])) for m in meals)
    
    summary = {
        "user_id": user_id,
        "date": date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fat": total_fat,
        "meal_count": len(meals),
        "updated_at": now_iso()
    }
    
    await db.nutrition_daily.update_one(
        {"user_id": user_id, "date": date},
        {"$set": summary},
        upsert=True
    )
    
    return summary

@api_router.get("/doctor/meals")
async def get_meals(days: int = 7, user: dict = Depends(get_current_user)):
    """Get meal history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    meals = await db.meals.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return meals

@api_router.get("/doctor/nutrition-summary")
async def get_nutrition_summary(days: int = 7, user: dict = Depends(get_current_user)):
    """Get nutrition summary"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    summaries = await db.nutrition_daily.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("date", -1).to_list(days)
    
    # Calculate averages
    if summaries:
        avg_calories = sum(s.get("total_calories", 0) for s in summaries) / len(summaries)
        avg_protein = sum(s.get("total_protein", 0) for s in summaries) / len(summaries)
    else:
        avg_calories = 0
        avg_protein = 0
    
    return {
        "daily_summaries": summaries,
        "average_calories": round(avg_calories),
        "average_protein": round(avg_protein)
    }

@api_router.post("/doctor/water")
async def log_water(water: WaterLog, user: dict = Depends(get_current_user)):
    """Log water intake"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    await db.water_logs.update_one(
        {"user_id": user["id"], "date": today},
        {"$inc": {"glasses": water.glasses, "ml": water.glasses * 250}},
        upsert=True
    )
    
    updated = await db.water_logs.find_one(
        {"user_id": user["id"], "date": today},
        {"_id": 0}
    )
    
    return updated

@api_router.get("/doctor/water")
async def get_water(user: dict = Depends(get_current_user)):
    """Get today's water intake"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    water = await db.water_logs.find_one(
        {"user_id": user["id"], "date": today},
        {"_id": 0}
    )
    
    return water or {"glasses": 0, "ml": 0}

@api_router.post("/doctor/sleep")
async def log_sleep(sleep: SleepLog, user: dict = Depends(get_current_user)):
    """Log sleep data"""
    start = datetime.fromisoformat(sleep.sleep_start.replace("Z", "+00:00"))
    end = datetime.fromisoformat(sleep.sleep_end.replace("Z", "+00:00"))
    duration_hours = (end - start).total_seconds() / 3600
    
    sleep_entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "sleep_start": sleep.sleep_start,
        "sleep_end": sleep.sleep_end,
        "duration_hours": round(duration_hours, 1),
        "quality": sleep.quality,
        "date": start.strftime("%Y-%m-%d"),
        "created_at": now_iso()
    }
    
    await db.sleep_logs.insert_one(sleep_entry)
    sleep_entry.pop("_id", None)
    
    return sleep_entry

@api_router.get("/doctor/sleep")
async def get_sleep(days: int = 7, user: dict = Depends(get_current_user)):
    """Get sleep history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    logs = await db.sleep_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("date", -1).to_list(days)
    
    # Calculate averages
    if logs:
        avg_duration = sum(l.get("duration_hours", 0) for l in logs) / len(logs)
        avg_quality = sum(l.get("quality", 0) for l in logs) / len(logs)
    else:
        avg_duration = 0
        avg_quality = 0
    
    return {
        "logs": logs,
        "average_duration": round(avg_duration, 1),
        "average_quality": round(avg_quality, 1)
    }

@api_router.post("/doctor/mood")
async def log_mood(mood: MoodLog, user: dict = Depends(get_current_user)):
    """Log mood/mental wellness"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    mood_entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "mood": mood.mood,
        "energy_level": mood.energy_level,
        "notes": mood.notes,
        "date": today,
        "created_at": now_iso()
    }
    
    await db.mood_logs.insert_one(mood_entry)
    mood_entry.pop("_id", None)
    
    return mood_entry

@api_router.get("/doctor/mood")
async def get_mood(days: int = 14, user: dict = Depends(get_current_user)):
    """Get mood history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    logs = await db.mood_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return logs

@api_router.get("/doctor/food-database")
async def get_food_database(meal_type: Optional[str] = None, search: Optional[str] = None):
    """Get South Indian food database"""
    if meal_type and meal_type in SOUTH_INDIAN_FOODS:
        foods = SOUTH_INDIAN_FOODS[meal_type]
    else:
        foods = []
        for mt, items in SOUTH_INDIAN_FOODS.items():
            for item in items:
                item["meal_type"] = mt
                foods.append(item)
    
    if search:
        search_lower = search.lower()
        foods = [f for f in foods if search_lower in f["name"].lower() or search_lower in f.get("name_te", "")]
    
    return foods

@api_router.get("/doctor/diet-plans")
async def get_diet_plans():
    """Get available diet plans"""
    plans = [
        {
            "id": "weight_loss",
            "name": "Weight Loss Plan",
            "name_te": "బరువు తగ్గించే ప్రణాళిక",
            "calories_target": 1500,
            "description": "Low calorie plan with balanced nutrition",
            "description_te": "సమతుల్య పోషణతో తక్కువ కేలరీల ప్రణాళిక"
        },
        {
            "id": "weight_gain",
            "name": "Weight Gain Plan",
            "name_te": "బరువు పెరిగే ప్రణాళిక",
            "calories_target": 2500,
            "description": "High protein plan for muscle gain",
            "description_te": "కండరాల పెరుగుదలకు అధిక ప్రోటీన్ ప్రణాళిక"
        },
        {
            "id": "maintenance",
            "name": "Maintenance Plan",
            "name_te": "నిర్వహణ ప్రణాళిక",
            "calories_target": 2000,
            "description": "Balanced diet for maintaining weight",
            "description_te": "బరువు నిర్వహణకు సమతుల్య ఆహారం"
        },
        {
            "id": "diabetic",
            "name": "Diabetic Friendly",
            "name_te": "మధుమేహ స్నేహపూర్వక",
            "calories_target": 1800,
            "description": "Low glycemic index foods",
            "description_te": "తక్కువ గ్లైసెమిక్ ఇండెక్స్ ఆహారాలు"
        },
        {
            "id": "heart_healthy",
            "name": "Heart Healthy",
            "name_te": "గుండె ఆరోగ్యం",
            "calories_target": 1800,
            "description": "Low sodium, low fat diet",
            "description_te": "తక్కువ సోడియం, తక్కువ కొవ్వు ఆహారం"
        }
    ]
    return plans

@api_router.get("/doctor/dashboard")
async def get_doctor_dashboard(user: dict = Depends(get_current_user)):
    """Get comprehensive health dashboard"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Today's data
    nutrition = await db.nutrition_daily.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    water = await db.water_logs.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    fitness = await db.fitness_daily.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    latest_mood = await db.mood_logs.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    latest_sleep = await db.sleep_logs.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("date", -1)])
    
    # Health metrics
    health_profile = user.get("health_profile", {})
    
    # Calculate health score
    health_score = calculate_health_score(nutrition, water, fitness, latest_sleep, health_profile)
    
    return {
        "health_score": health_score,
        "today": {
            "nutrition": nutrition or {"total_calories": 0},
            "water": water or {"glasses": 0},
            "fitness": fitness or {"total_steps": 0, "total_calories": 0},
            "mood": latest_mood,
            "sleep": latest_sleep
        },
        "health_profile": health_profile,
        "recommendations": generate_health_recommendations(nutrition, water, fitness, latest_sleep, health_profile)
    }

def calculate_health_score(nutrition, water, fitness, sleep, profile):
    """Calculate overall health score (0-100)"""
    score = 0
    
    # Nutrition score (25 points)
    if nutrition:
        cal_target = 2000
        cal_diff = abs(nutrition.get("total_calories", 0) - cal_target)
        nutrition_score = max(0, 25 - (cal_diff / 100))
        score += nutrition_score
    
    # Hydration score (20 points)
    if water:
        glasses = water.get("glasses", 0)
        hydration_score = min(20, glasses * 2.5)
        score += hydration_score
    
    # Fitness score (30 points)
    if fitness:
        steps = fitness.get("total_steps", 0)
        fitness_score = min(30, (steps / 10000) * 30)
        score += fitness_score
    
    # Sleep score (25 points)
    if sleep:
        duration = sleep.get("duration_hours", 0)
        quality = sleep.get("quality", 0)
        sleep_score = min(25, (min(duration, 8) / 8 * 15) + (quality * 2))
        score += sleep_score
    
    return round(score)

def generate_health_recommendations(nutrition, water, fitness, sleep, profile):
    """Generate personalized health recommendations"""
    recommendations = []
    
    # Water recommendation
    glasses = water.get("glasses", 0) if water else 0
    if glasses < 8:
        recommendations.append({
            "type": "water",
            "message": f"Drink {8 - glasses} more glasses of water today",
            "message_te": f"ఈ రోజు మరో {8 - glasses} గ్లాసుల నీళ్ళు తాగండి",
            "priority": "high" if glasses < 4 else "medium"
        })
    
    # Fitness recommendation
    steps = fitness.get("total_steps", 0) if fitness else 0
    if steps < 5000:
        recommendations.append({
            "type": "fitness",
            "message": "Take a 20-minute walk to reach your step goal",
            "message_te": "మీ అడుగుల లక్ష్యాన్ని చేరుకోవడానికి 20 నిమిషాలు నడవండి",
            "priority": "medium"
        })
    
    # Sleep recommendation
    if sleep:
        duration = sleep.get("duration_hours", 0)
        if duration < 7:
            recommendations.append({
                "type": "sleep",
                "message": "Try to get 7-8 hours of sleep tonight",
                "message_te": "ఈ రాత్రి 7-8 గంటలు నిద్రపొందడానికి ప్రయత్నించండి",
                "priority": "medium"
            })
    
    # Pollution alert (Dammaiguda specific)
    recommendations.append({
        "type": "pollution",
        "message": "Best time for outdoor exercise: 6-7 AM (before dump yard activity increases)",
        "message_te": "బయటి వ్యాయామానికి ఉత్తమ సమయం: ఉదయం 6-7 (డంప్ యార్డ్ కార్యకలాపం పెరగడానికి ముందు)",
        "priority": "info"
    })
    
    return recommendations

# ============== AI CHAT ROUTES ==============

@api_router.post("/chat")
async def send_chat_message(message: ChatMessage, user: dict = Depends(get_current_user)):
    """Send message to AI assistant"""
    chat_type = message.chat_type
    
    # Validate chat type
    if chat_type not in AI_SYSTEM_PROMPTS:
        chat_type = "general"
    
    # Get API key
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Create session ID for conversation history
    session_id = f"{user['id']}_{chat_type}"
    
    # Get recent chat history for context
    recent_messages = await db.chat_history.find(
        {"user_id": user["id"], "chat_type": chat_type},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Build context from history
    history_context = ""
    if recent_messages:
        for msg in reversed(recent_messages):
            history_context += f"\nUser: {msg['message']}\nAssistant: {msg['response']}"
    
    # Get user's health data for context (if health/doctor/fitness chat)
    user_context = ""
    if chat_type in ["health", "doctor", "fitness"]:
        health_profile = user.get("health_profile", {})
        if health_profile:
            user_context = f"\n\nUser health profile: Weight: {health_profile.get('weight_kg', 'unknown')}kg, Height: {health_profile.get('height_cm', 'unknown')}cm"
    
    # Create system message with context
    system_message = AI_SYSTEM_PROMPTS[chat_type] + user_context
    if history_context:
        system_message += f"\n\nRecent conversation:{history_context}"
    
    try:
        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")  # Using cost-effective model
        
        # Create message
        user_message = UserMessage(text=message.message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Store in database
        chat_entry = {
            "id": generate_id(),
            "user_id": user["id"],
            "message": message.message,
            "response": response,
            "chat_type": chat_type,
            "created_at": now_iso()
        }
        await db.chat_history.insert_one(chat_entry)
        chat_entry.pop("_id", None)
        
        return chat_entry
        
    except Exception as e:
        logging.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/chat/history")
async def get_chat_history(
    chat_type: str = "general",
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get chat history"""
    history = await db.chat_history.find(
        {"user_id": user["id"], "chat_type": chat_type},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return list(reversed(history))

@api_router.delete("/chat/history")
async def clear_chat_history(chat_type: str = "all", user: dict = Depends(get_current_user)):
    """Clear chat history"""
    if chat_type == "all":
        await db.chat_history.delete_many({"user_id": user["id"]})
    else:
        await db.chat_history.delete_many({"user_id": user["id"], "chat_type": chat_type})
    
    return {"success": True, "message": "Chat history cleared"}

# ============== EXISTING ROUTES (Issues, Polls, etc.) ==============

@api_router.post("/issues", response_model=IssueResponse)
async def create_issue(issue: IssueCreate, user: dict = Depends(get_current_user)):
    valid_categories = ["dump_yard", "garbage", "drainage", "water", "roads", "lights", "parks"]
    if issue.category not in valid_categories:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    new_issue = {
        "id": generate_id(),
        "category": issue.category,
        "description": issue.description,
        "status": "reported",
        "location": issue.location,
        "address": issue.address,
        "media_urls": issue.media_urls,
        "reporter_id": user["id"],
        "reporter_name": user.get("name", "Anonymous"),
        "colony": user.get("colony"),
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    await db.issues.insert_one(new_issue)
    new_issue.pop("_id", None)
    return new_issue

@api_router.get("/issues", response_model=List[IssueResponse])
async def get_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    colony: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    skip: int = 0
):
    query = {}
    if category: query["category"] = category
    if status: query["status"] = status
    if colony: query["colony"] = colony
    
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return issues

@api_router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str):
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@api_router.put("/issues/{issue_id}/verify")
async def verify_issue(issue_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["volunteer", "admin"])
    
    await db.issues.update_one(
        {"id": issue_id},
        {"$set": {"status": "verified", "verified_by": user["id"], "verified_at": now_iso(), "updated_at": now_iso()}}
    )
    return {"success": True}

@api_router.put("/issues/{issue_id}/escalate")
async def escalate_issue(issue_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["admin"])
    await db.issues.update_one({"id": issue_id}, {"$set": {"status": "escalated", "updated_at": now_iso()}})
    return {"success": True}

@api_router.put("/issues/{issue_id}/close")
async def close_issue(issue_id: str, resolution_notes: str = "", user: dict = Depends(get_current_user)):
    await require_role(user, ["admin"])
    await db.issues.update_one(
        {"id": issue_id},
        {"$set": {"status": "closed", "resolution_notes": resolution_notes, "updated_at": now_iso()}}
    )
    return {"success": True}

# Polls
@api_router.get("/polls")
async def get_polls(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    polls = await db.polls.find(query, {"_id": 0, "voters": 0}).sort("created_at", -1).to_list(50)
    return polls

@api_router.post("/polls/{poll_id}/vote")
async def vote_poll(poll_id: str, option_index: int = Body(..., embed=True), user: dict = Depends(get_current_user)):
    poll = await db.polls.find_one({"id": poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if user["id"] in poll.get("voters", []):
        raise HTTPException(status_code=400, detail="Already voted")
    
    await db.polls.update_one(
        {"id": poll_id},
        {"$inc": {f"votes.{option_index}": 1, "total_votes": 1}, "$push": {"voters": user["id"]}}
    )
    return {"success": True}

# Expenditure
@api_router.get("/expenditure")
async def get_expenditure(year: Optional[int] = None, category: Optional[str] = None):
    query = {}
    if year: query["year"] = year
    if category: query["category"] = category
    records = await db.expenditure.find(query, {"_id": 0}).sort("year", -1).to_list(100)
    return records

@api_router.get("/expenditure/summary")
async def get_expenditure_summary():
    pipeline = [
        {"$group": {"_id": {"year": "$year", "category": "$category"}, "total": {"$sum": "$amount"}}},
        {"$sort": {"_id.year": -1}}
    ]
    results = await db.expenditure.aggregate(pipeline).to_list(100)
    summary = {}
    for r in results:
        year = r["_id"]["year"]
        cat = r["_id"]["category"]
        if year not in summary:
            summary[year] = {}
        summary[year][cat] = r["total"]
    return summary

# Benefits
@api_router.post("/benefits/apply")
async def apply_benefit(
    benefit_type: str = Body(...),
    applicant_name: str = Body(...),
    phone: str = Body(...),
    age: Optional[int] = Body(None),
    address: Optional[str] = Body(None),
    documents: List[str] = Body([]),
    user: dict = Depends(get_current_user)
):
    valid_types = ["health_checkup", "education_voucher", "insurance", "health_insurance"]
    if benefit_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid benefit type")
    
    new_app = {
        "id": generate_id(),
        "user_id": user["id"],
        "benefit_type": benefit_type,
        "applicant_name": applicant_name,
        "phone": phone,
        "age": age,
        "address": address,
        "documents": documents,
        "status": "pending",
        "created_at": now_iso()
    }
    await db.benefits.insert_one(new_app)
    new_app.pop("_id", None)
    return new_app

@api_router.get("/benefits/my-applications")
async def get_my_benefits(user: dict = Depends(get_current_user)):
    apps = await db.benefits.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    return apps

# Dump Yard
@api_router.get("/dumpyard/info")
async def get_dumpyard_info():
    return {
        "name": "Dammaiguda Dump Yard",
        "name_te": "దమ్మాయిగూడ చెత్త డంప్ యార్డ్",
        "location": {"lat": 17.4823, "lng": 78.5642},
        "area_acres": 50,
        "daily_waste_tons": 2500,
        "pollution_zones": [
            {"zone": "red", "radius_km": 1, "risk": "high", "risk_te": "అధిక ప్రమాదం"},
            {"zone": "orange", "radius_km": 3, "risk": "medium", "risk_te": "మధ్యస్థ ప్రమాదం"},
            {"zone": "green", "radius_km": 5, "risk": "safer", "risk_te": "సురక్షితం"}
        ],
        "health_risks": {
            "cadmium": {"title": "Cadmium Exposure", "title_te": "కాడ్మియం బహిర్గతం", "description": "Heavy metal that can cause kidney damage", "description_te": "మూత్రపిండాల నష్టానికి కారణమయ్యే భారీ లోహం"},
            "air_quality": {"title": "Air Pollution", "title_te": "వాయు కాలుష్యం", "description": "Methane and harmful gases", "description_te": "మీథేన్ మరియు హానికరమైన వాయువులు"}
        },
        "affected_groups": [
            {"group": "children", "group_te": "పిల్లలు", "risk_level": "very_high", "advice": "Keep children indoors on high pollution days", "advice_te": "అధిక కాలుష్య రోజుల్లో పిల్లలను ఇంట్లోనే ఉంచండి"},
            {"group": "pregnant_women", "group_te": "గర్భిణీ స్త్రీలు", "risk_level": "very_high", "advice": "Avoid outdoor activities near dump yard", "advice_te": "డంప్ యార్డ్ దగ్గర బయటి కార్యకలాపాలను నివారించండి"},
            {"group": "elderly", "group_te": "వృద్ధులు", "risk_level": "high", "advice": "Use masks when outdoors", "advice_te": "బయట ఉన్నప్పుడు మాస్కులు వాడండి"}
        ]
    }

@api_router.get("/dumpyard/updates")
async def get_dumpyard_updates():
    updates = await db.dumpyard_updates.find({}, {"_id": 0}).sort("date", -1).limit(20).to_list(20)
    return updates

# Volunteer
@api_router.get("/volunteer/queue")
async def get_verification_queue(user: dict = Depends(get_current_user)):
    await require_role(user, ["volunteer", "admin"])
    issues = await db.issues.find({"status": "reported"}, {"_id": 0}).sort("created_at", 1).limit(20).to_list(20)
    return issues

@api_router.get("/volunteer/my-verifications")
async def get_my_verifications(user: dict = Depends(get_current_user)):
    await require_role(user, ["volunteer", "admin"])
    issues = await db.issues.find({"verified_by": user["id"]}, {"_id": 0}).sort("verified_at", -1).limit(50).to_list(50)
    return issues

# Admin
@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    await require_role(user, ["admin"])
    
    total_issues = await db.issues.count_documents({})
    pending_issues = await db.issues.count_documents({"status": "reported"})
    closed_issues = await db.issues.count_documents({"status": "closed"})
    total_users = await db.users.count_documents({})
    volunteers = await db.users.count_documents({"role": "volunteer"})
    pending_benefits = await db.benefits.count_documents({"status": "pending"})
    fitness_participants = len(await db.fitness_daily.distinct("user_id"))
    
    category_pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    categories = await db.issues.aggregate(category_pipeline).to_list(10)
    
    return {
        "issues": {"total": total_issues, "pending": pending_issues, "closed": closed_issues, "by_category": {c["_id"]: c["count"] for c in categories}},
        "users": {"total": total_users, "volunteers": volunteers},
        "benefits": {"pending": pending_benefits},
        "fitness": {"participants": fitness_participants}
    }

@api_router.get("/admin/issues-heatmap")
async def get_issues_heatmap(user: dict = Depends(get_current_user)):
    await require_role(user, ["admin"])
    pipeline = [{"$match": {"colony": {"$ne": None}}}, {"$group": {"_id": "$colony", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    return await db.issues.aggregate(pipeline).to_list(50)

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["admin"])
    if role not in ["citizen", "volunteer", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    return {"success": True}

@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(get_current_user)):
    await require_role(user, ["admin"])
    return await db.users.find({}, {"_id": 0}).to_list(500)

# Upload
@api_router.get("/upload/signature")
async def get_upload_signature(
    resource_type: str = Query(default="image", enum=["image", "video"]),
    folder: str = "issues",
    user: dict = Depends(get_current_user)
):
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    
    if not all([cloud_name, api_key, api_secret]):
        return {"mock": True, "message": "Cloudinary not configured", "upload_url": "/api/upload/mock"}
    
    timestamp = int(time.time())
    params = {"folder": folder, "timestamp": timestamp}
    signature = cloudinary.utils.api_sign_request(params, api_secret)
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": cloud_name,
        "api_key": api_key,
        "folder": folder,
        "resource_type": resource_type
    }

@api_router.post("/upload/mock")
async def mock_upload(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    file_id = generate_id()
    return {"success": True, "url": f"https://placeholder.dammaiguda.app/uploads/{file_id}/{file.filename}", "public_id": file_id, "mock": True}

# Health Check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "My Dammaiguda API", "version": "2.0.0"}

@api_router.get("/")
async def root():
    return {"message": "My Dammaiguda API - Civic Engagement Platform with Kaizer Fit & Doctor"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
