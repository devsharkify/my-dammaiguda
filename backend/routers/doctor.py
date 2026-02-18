"""Kaizer Doctor Router - Health tracking, diet plans, recommendations"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/doctor", tags=["Kaizer Doctor"])

# ============== SOUTH INDIAN FOOD DATABASE ==============

FOOD_DATABASE = {
    "idli": {"name_te": "ఇడ్లీ", "calories": 39, "protein": 2, "carbs": 8, "fat": 0.2, "category": "breakfast"},
    "dosa": {"name_te": "దోస", "calories": 168, "protein": 4, "carbs": 28, "fat": 4, "category": "breakfast"},
    "pesarattu": {"name_te": "పెసరట్టు", "calories": 150, "protein": 8, "carbs": 20, "fat": 4, "category": "breakfast"},
    "upma": {"name_te": "ఉప్మా", "calories": 200, "protein": 5, "carbs": 30, "fat": 7, "category": "breakfast"},
    "pongal": {"name_te": "పొంగల్", "calories": 180, "protein": 5, "carbs": 32, "fat": 4, "category": "breakfast"},
    "vada": {"name_te": "వడ", "calories": 97, "protein": 4, "carbs": 10, "fat": 5, "category": "breakfast"},
    "uttapam": {"name_te": "ఉత్తపం", "calories": 150, "protein": 4, "carbs": 25, "fat": 4, "category": "breakfast"},
    "poori": {"name_te": "పూరీ", "calories": 70, "protein": 2, "carbs": 10, "fat": 3, "category": "breakfast"},
    "rice": {"name_te": "అన్నం", "calories": 130, "protein": 3, "carbs": 28, "fat": 0.3, "category": "lunch"},
    "sambar": {"name_te": "సాంబార్", "calories": 80, "protein": 4, "carbs": 12, "fat": 2, "category": "lunch"},
    "rasam": {"name_te": "రసం", "calories": 40, "protein": 2, "carbs": 6, "fat": 1, "category": "lunch"},
    "dal": {"name_te": "పప్పు", "calories": 120, "protein": 8, "carbs": 18, "fat": 2, "category": "lunch"},
    "biryani": {"name_te": "బిర్యానీ", "calories": 350, "protein": 15, "carbs": 45, "fat": 12, "category": "lunch"},
    "chicken_curry": {"name_te": "చికెన్ కర్రీ", "calories": 250, "protein": 25, "carbs": 8, "fat": 14, "category": "lunch"},
    "mutton_curry": {"name_te": "మటన్ కర్రీ", "calories": 300, "protein": 28, "carbs": 6, "fat": 18, "category": "lunch"},
    "fish_curry": {"name_te": "చేపల పులుసు", "calories": 200, "protein": 22, "carbs": 5, "fat": 10, "category": "lunch"},
    "vegetable_curry": {"name_te": "కూరగాయల కర్రీ", "calories": 100, "protein": 3, "carbs": 15, "fat": 4, "category": "lunch"},
    "curd_rice": {"name_te": "పెరుగు అన్నం", "calories": 180, "protein": 6, "carbs": 30, "fat": 4, "category": "lunch"},
    "roti": {"name_te": "రోటీ", "calories": 71, "protein": 3, "carbs": 15, "fat": 0.4, "category": "dinner"},
    "paratha": {"name_te": "పరాటా", "calories": 180, "protein": 5, "carbs": 25, "fat": 7, "category": "dinner"},
    "pulao": {"name_te": "పులావ్", "calories": 200, "protein": 5, "carbs": 35, "fat": 5, "category": "dinner"},
    "egg_curry": {"name_te": "గుడ్డు కర్రీ", "calories": 180, "protein": 12, "carbs": 5, "fat": 12, "category": "dinner"},
    "paneer_curry": {"name_te": "పనీర్ కర్రీ", "calories": 220, "protein": 14, "carbs": 8, "fat": 15, "category": "dinner"},
    "haleem": {"name_te": "హలీమ్", "calories": 350, "protein": 20, "carbs": 30, "fat": 16, "category": "dinner"},
    "gulab_jamun": {"name_te": "గులాబ్ జామూన్", "calories": 150, "protein": 2, "carbs": 25, "fat": 5, "category": "dessert"},
    "payasam": {"name_te": "పాయసం", "calories": 200, "protein": 5, "carbs": 35, "fat": 5, "category": "dessert"},
    "laddu": {"name_te": "లడ్డూ", "calories": 180, "protein": 4, "carbs": 25, "fat": 8, "category": "dessert"},
    "chai": {"name_te": "చాయ్", "calories": 40, "protein": 1, "carbs": 6, "fat": 1, "category": "beverage"},
    "filter_coffee": {"name_te": "ఫిల్టర్ కాఫీ", "calories": 50, "protein": 1, "carbs": 8, "fat": 2, "category": "beverage"},
    "buttermilk": {"name_te": "మజ్జిగ", "calories": 30, "protein": 2, "carbs": 4, "fat": 1, "category": "beverage"},
    "coconut_water": {"name_te": "కొబ్బరి నీళ్లు", "calories": 45, "protein": 0.5, "carbs": 9, "fat": 0.5, "category": "beverage"}
}

DIET_PLANS = {
    "weight_loss": {
        "name": "Weight Loss Plan",
        "name_te": "బరువు తగ్గించే ప్లాన్",
        "daily_calories": 1500,
        "meals": {
            "breakfast": ["idli", "pesarattu", "upma"],
            "lunch": ["rice", "sambar", "vegetable_curry"],
            "dinner": ["roti", "dal"],
            "snacks": ["buttermilk", "fruits"]
        }
    },
    "weight_gain": {
        "name": "Weight Gain Plan",
        "name_te": "బరువు పెంచే ప్లాన్",
        "daily_calories": 2500,
        "meals": {
            "breakfast": ["dosa", "vada", "pongal"],
            "lunch": ["biryani", "chicken_curry"],
            "dinner": ["paratha", "paneer_curry"],
            "snacks": ["laddu", "chai"]
        }
    },
    "diabetic": {
        "name": "Diabetic Friendly",
        "name_te": "మధుమేహ స్నేహపూర్వక",
        "daily_calories": 1800,
        "meals": {
            "breakfast": ["pesarattu", "idli"],
            "lunch": ["rice", "dal", "vegetable_curry"],
            "dinner": ["roti", "fish_curry"],
            "snacks": ["buttermilk", "coconut_water"]
        }
    },
    "heart_healthy": {
        "name": "Heart Healthy",
        "name_te": "గుండె ఆరోగ్యం",
        "daily_calories": 1600,
        "meals": {
            "breakfast": ["idli", "upma"],
            "lunch": ["curd_rice", "rasam"],
            "dinner": ["roti", "vegetable_curry"],
            "snacks": ["fruits", "coconut_water"]
        }
    }
}

# ============== MODELS ==============

class HealthMetrics(BaseModel):
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_pressure_sys: Optional[int] = None
    blood_pressure_dia: Optional[int] = None
    blood_sugar: Optional[float] = None

class MealLog(BaseModel):
    food_item: str
    meal_type: str
    quantity: float = 1.0
    custom_calories: Optional[int] = None

class WaterLog(BaseModel):
    glasses: int

class SleepLog(BaseModel):
    hours: float
    quality: str

class MoodLog(BaseModel):
    mood: str
    notes: Optional[str] = None

# ============== ROUTES ==============

@router.get("/foods")
async def get_food_database():
    """Get food database"""
    return FOOD_DATABASE

@router.get("/diet-plans")
async def get_diet_plans():
    """Get available diet plans"""
    return DIET_PLANS

@router.get("/diet-plans/{plan_id}")
async def get_diet_plan(plan_id: str):
    """Get specific diet plan"""
    if plan_id not in DIET_PLANS:
        raise HTTPException(status_code=404, detail="Diet plan not found")
    return DIET_PLANS[plan_id]

@router.post("/health-metrics")
async def log_health_metrics(metrics: HealthMetrics, user: dict = Depends(get_current_user)):
    """Log health metrics"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "date": today,
        "weight_kg": metrics.weight_kg,
        "height_cm": metrics.height_cm,
        "blood_pressure_sys": metrics.blood_pressure_sys,
        "blood_pressure_dia": metrics.blood_pressure_dia,
        "blood_sugar": metrics.blood_sugar,
        "created_at": now_iso()
    }
    
    # Calculate BMI
    if metrics.weight_kg and metrics.height_cm:
        height_m = metrics.height_cm / 100
        entry["bmi"] = round(metrics.weight_kg / (height_m * height_m), 1)
    
    await db.health_metrics.insert_one(entry)
    entry.pop("_id", None)
    
    # Update user profile
    if metrics.weight_kg:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"health_profile.weight_kg": metrics.weight_kg}}
        )
    
    return entry

@router.get("/health-metrics")
async def get_health_metrics(days: int = 30, user: dict = Depends(get_current_user)):
    """Get health metrics history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    metrics = await db.health_metrics.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}}, {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    return metrics

@router.post("/meal")
async def log_meal(meal: MealLog, user: dict = Depends(get_current_user)):
    """Log a meal"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    food_info = FOOD_DATABASE.get(meal.food_item, {})
    calories = meal.custom_calories or int(food_info.get("calories", 100) * meal.quantity)
    
    entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "date": today,
        "food_item": meal.food_item,
        "food_name_te": food_info.get("name_te", meal.food_item),
        "meal_type": meal.meal_type,
        "quantity": meal.quantity,
        "calories": calories,
        "protein": int(food_info.get("protein", 0) * meal.quantity),
        "carbs": int(food_info.get("carbs", 0) * meal.quantity),
        "fat": int(food_info.get("fat", 0) * meal.quantity),
        "created_at": now_iso()
    }
    
    await db.meals.insert_one(entry)
    entry.pop("_id", None)
    
    return entry

@router.get("/meals")
async def get_meals(date: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get meals for a date"""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    meals = await db.meals.find(
        {"user_id": user["id"], "date": date}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    
    summary = {
        "total_calories": sum(m.get("calories", 0) for m in meals),
        "total_protein": sum(m.get("protein", 0) for m in meals),
        "total_carbs": sum(m.get("carbs", 0) for m in meals),
        "total_fat": sum(m.get("fat", 0) for m in meals)
    }
    
    return {"date": date, "meals": meals, "summary": summary}

@router.post("/water")
async def log_water(water: WaterLog, user: dict = Depends(get_current_user)):
    """Log water intake"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    await db.water_logs.update_one(
        {"user_id": user["id"], "date": today},
        {"$inc": {"glasses": water.glasses}, "$set": {"updated_at": now_iso()}},
        upsert=True
    )
    
    updated = await db.water_logs.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    return updated

@router.get("/water")
async def get_water(date: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get water intake"""
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    log = await db.water_logs.find_one({"user_id": user["id"], "date": date}, {"_id": 0})
    return log or {"date": date, "glasses": 0}

@router.post("/sleep")
async def log_sleep(sleep: SleepLog, user: dict = Depends(get_current_user)):
    """Log sleep"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "date": today,
        "hours": sleep.hours,
        "quality": sleep.quality,
        "created_at": now_iso()
    }
    
    await db.sleep_logs.insert_one(entry)
    entry.pop("_id", None)
    
    return entry

@router.get("/sleep")
async def get_sleep(days: int = 7, user: dict = Depends(get_current_user)):
    """Get sleep history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    
    logs = await db.sleep_logs.find(
        {"user_id": user["id"], "date": {"$gte": cutoff}}, {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    return logs

@router.post("/mood")
async def log_mood(mood: MoodLog, user: dict = Depends(get_current_user)):
    """Log mood"""
    entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "mood": mood.mood,
        "notes": mood.notes,
        "created_at": now_iso()
    }
    
    await db.mood_logs.insert_one(entry)
    entry.pop("_id", None)
    
    return entry

@router.get("/mood")
async def get_mood_history(days: int = 7, user: dict = Depends(get_current_user)):
    """Get mood history"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    logs = await db.mood_logs.find(
        {"user_id": user["id"], "created_at": {"$gte": cutoff}}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return logs

@router.get("/recommendations")
async def get_recommendations(user: dict = Depends(get_current_user)):
    """Get personalized health recommendations"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get today's data
    meals = await db.meals.find({"user_id": user["id"], "date": today}, {"_id": 0}).to_list(50)
    water = await db.water_logs.find_one({"user_id": user["id"], "date": today})
    sleep = await db.sleep_logs.find_one({"user_id": user["id"], "date": today})
    
    recommendations = []
    
    total_calories = sum(m.get("calories", 0) for m in meals)
    if total_calories < 1200:
        recommendations.append({
            "type": "nutrition",
            "message": "You haven't eaten enough today. Consider having a healthy meal.",
            "message_te": "మీరు ఈ రోజు తగినంత తినలేదు. ఆరోగ్యకరమైన భోజనం చేయండి."
        })
    
    glasses = water.get("glasses", 0) if water else 0
    if glasses < 6:
        recommendations.append({
            "type": "water",
            "message": f"Drink more water! You've had only {glasses} glasses today.",
            "message_te": f"మరింత నీరు త్రాగండి! మీరు ఈ రోజు {glasses} గ్లాసులు మాత్రమే తీసుకున్నారు."
        })
    
    if not sleep:
        recommendations.append({
            "type": "sleep",
            "message": "Don't forget to log your sleep for better health tracking.",
            "message_te": "మెరుగైన ఆరోగ్య ట్రాకింగ్ కోసం మీ నిద్రను నమోదు చేయడం మర్చిపోకండి."
        })
    
    return recommendations

@router.get("/dashboard")
async def get_doctor_dashboard(user: dict = Depends(get_current_user)):
    """Get health dashboard"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    latest_metrics = await db.health_metrics.find_one(
        {"user_id": user["id"]}, {"_id": 0}, sort=[("date", -1)]
    )
    
    meals_today = await db.meals.find({"user_id": user["id"], "date": today}, {"_id": 0}).to_list(50)
    water_today = await db.water_logs.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    sleep_today = await db.sleep_logs.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    mood_today = await db.mood_logs.find_one(
        {"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)]
    )
    
    # Calculate health score
    score = 50  # Base score
    if water_today and water_today.get("glasses", 0) >= 8:
        score += 15
    if sleep_today and sleep_today.get("hours", 0) >= 7:
        score += 15
    if meals_today:
        score += 10
    if mood_today and mood_today.get("mood") in ["happy", "calm", "energetic"]:
        score += 10
    
    return {
        "health_score": min(100, score),
        "latest_metrics": latest_metrics,
        "today": {
            "meals_count": len(meals_today),
            "total_calories": sum(m.get("calories", 0) for m in meals_today),
            "water_glasses": water_today.get("glasses", 0) if water_today else 0,
            "sleep_hours": sleep_today.get("hours", 0) if sleep_today else 0,
            "mood": mood_today.get("mood") if mood_today else None
        }
    }
