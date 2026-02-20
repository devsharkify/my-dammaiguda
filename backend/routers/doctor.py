"""Kaizer Doctor Router - Health tracking, diet plans, recommendations"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user

# Import extensive food database
from data.food_database import FOOD_DATABASE, FOOD_CATEGORIES, search_foods, get_foods_by_category, get_food_by_id

router = APIRouter(prefix="/doctor", tags=["Kaizer Doctor"])

# ============== FOOD DATABASE (NOW IMPORTED FROM data/food_database.py) ==============
# 500+ foods with complete nutritional information
# See /app/backend/data/food_database.py for full database

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

# ============== FOOD SEARCH API ==============

@router.get("/foods/search")
async def search_foods_api(
    q: str = Query(..., min_length=1, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, le=50, description="Max results")
):
    """
    Search foods by name (English or Telugu)
    Returns matching foods with nutrition info
    """
    results = search_foods(q, category, limit)
    return {
        "query": q,
        "count": len(results),
        "foods": results
    }

@router.get("/foods/categories")
async def get_food_categories_api():
    """Get all food categories"""
    return {
        "categories": [
            {"id": cat_id, "name": name}
            for cat_id, name in FOOD_CATEGORIES.items()
        ]
    }

@router.get("/foods/category/{category}")
async def get_foods_by_category_api(category: str):
    """Get all foods in a category"""
    if category not in FOOD_CATEGORIES:
        raise HTTPException(status_code=404, detail="Category not found")
    
    foods = get_foods_by_category(category)
    return {
        "category": category,
        "category_name": FOOD_CATEGORIES[category],
        "count": len(foods),
        "foods": foods
    }

@router.get("/foods/{food_id}")
async def get_food_api(food_id: str):
    """Get nutrition info for a specific food"""
    food = get_food_by_id(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food

@router.get("/foods")
async def get_all_foods(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    category: Optional[str] = None
):
    """Get all foods with pagination"""
    foods_list = list(FOOD_DATABASE.items())
    
    if category:
        foods_list = [(k, v) for k, v in foods_list if v.get("category") == category]
    
    total = len(foods_list)
    foods_list = foods_list[offset:offset + limit]
    
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "foods": [{"id": k, **v} for k, v in foods_list]
    }

# ============== PSYCHOLOGIST AI ==============

import os
from dotenv import load_dotenv

load_dotenv()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

PSYCHOLOGIST_SYSTEM_PROMPT = """You are a compassionate AI psychologist assistant named "Kaizer Mind". Your role is to:

1. EMPATHETIC LISTENING: Listen with empathy and validate the user's feelings. Never dismiss or minimize their emotions.

2. CONVERSATIONAL THERAPY: Use evidence-based therapeutic approaches:
   - Cognitive Behavioral Therapy (CBT) techniques
   - Mindfulness and grounding exercises
   - Positive psychology principles
   - Stress management strategies

3. MENTAL HEALTH ASSESSMENT: When appropriate, gently assess:
   - Stress levels (1-10)
   - Anxiety indicators
   - Mood patterns
   - Sleep and energy levels

4. RECOMMENDATIONS: Provide actionable suggestions:
   - Breathing exercises
   - Mindfulness activities
   - Lifestyle improvements
   - When to seek professional help

5. BOUNDARIES: 
   - You are NOT a replacement for professional mental health care
   - For serious concerns (self-harm, suicide, severe depression), always recommend professional help
   - Emergency helplines: iCall (9152987821), Vandrevala Foundation (1860-2662-345)

6. LANGUAGE: Respond in the same language the user uses. Support both English and Telugu.

7. TONE: Warm, supportive, non-judgmental, patient, and encouraging.

Remember: Your goal is to support emotional well-being, not diagnose or treat mental illness."""

class PsychologistMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    include_assessment: bool = False

class MentalHealthAssessment(BaseModel):
    stress_level: int  # 1-10
    sleep_quality: int  # 1-5
    energy_level: int  # 1-10
    anxiety_symptoms: List[str] = []
    mood_description: str
    recent_challenges: Optional[str] = None

@router.post("/psychologist/chat")
async def psychologist_chat(msg: PsychologistMessage, user: dict = Depends(get_current_user)):
    """Chat with the AI Psychologist (Kaizer Mind)"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Create or use session
        session_id = msg.session_id or f"psych_{user['id']}_{datetime.now(timezone.utc).strftime('%Y%m%d')}"
        
        # Get conversation history from DB (last 10 messages)
        history = await db.psychologist_sessions.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        history = list(reversed(history))  # Chronological order
        
        # Build context with history
        context = PSYCHOLOGIST_SYSTEM_PROMPT
        if history:
            context += "\n\nPrevious conversation:\n"
            for h in history[-5:]:  # Last 5 exchanges
                context += f"User: {h.get('user_message', '')}\nKaizer Mind: {h.get('ai_response', '')}\n"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=context
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=msg.message)
        response = await chat.send_message(user_message)
        
        # Store in DB
        chat_entry = {
            "id": generate_id(),
            "session_id": session_id,
            "user_id": user["id"],
            "user_message": msg.message,
            "ai_response": response,
            "created_at": now_iso()
        }
        await db.psychologist_sessions.insert_one(chat_entry)
        
        # Generate assessment if requested
        assessment = None
        if msg.include_assessment:
            assessment_prompt = f"""Based on this conversation, provide a brief mental wellness assessment in JSON format:
            {{
                "stress_indicator": "low/moderate/high",
                "mood_assessment": "brief description",
                "recommended_action": "one specific suggestion",
                "seek_professional_help": true/false
            }}
            User's message: {msg.message}"""
            
            assessment_chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"assess_{session_id}",
                system_message="You are a mental health assessment assistant. Respond only with valid JSON."
            ).with_model("openai", "gpt-4o-mini")
            
            assessment_response = await assessment_chat.send_message(UserMessage(text=assessment_prompt))
            try:
                import json
                assessment = json.loads(assessment_response)
            except (json.JSONDecodeError, ValueError):
                assessment = {"note": "Assessment unavailable"}
        
        return {
            "response": response,
            "session_id": session_id,
            "assessment": assessment,
            "timestamp": now_iso()
        }
        
    except ImportError:
        raise HTTPException(status_code=503, detail="AI library not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@router.post("/psychologist/assessment")
async def submit_mental_health_assessment(assessment: MentalHealthAssessment, user: dict = Depends(get_current_user)):
    """Submit a structured mental health self-assessment"""
    
    # Calculate wellness score
    wellness_score = 100
    wellness_score -= (assessment.stress_level - 1) * 5  # High stress reduces score
    wellness_score -= (5 - assessment.sleep_quality) * 5  # Poor sleep reduces score
    wellness_score -= (10 - assessment.energy_level) * 3  # Low energy reduces score
    wellness_score -= len(assessment.anxiety_symptoms) * 5  # Each symptom reduces score
    wellness_score = max(0, min(100, wellness_score))
    
    # Determine risk level
    risk_level = "low"
    if wellness_score < 40:
        risk_level = "high"
    elif wellness_score < 60:
        risk_level = "moderate"
    
    # Generate recommendations
    recommendations = []
    if assessment.stress_level > 6:
        recommendations.append({
            "type": "stress",
            "title": "Try deep breathing",
            "title_te": "గాఢ శ్వాసను ప్రయత్నించండి",
            "description": "Practice 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s",
            "description_te": "4-7-8 శ్వాస: 4సె పీల్చు, 7సె ఆపు, 8సె విడుదల"
        })
    if assessment.sleep_quality < 3:
        recommendations.append({
            "type": "sleep",
            "title": "Improve sleep hygiene",
            "title_te": "నిద్ర పరిశుభ్రతను మెరుగుపరచండి",
            "description": "Avoid screens 1 hour before bed, maintain regular sleep schedule",
            "description_te": "నిద్రకు 1 గంట ముందు స్క్రీన్లు మానుకోండి"
        })
    if assessment.energy_level < 5:
        recommendations.append({
            "type": "energy",
            "title": "Boost your energy",
            "title_te": "మీ శక్తిని పెంచుకోండి",
            "description": "Take a 10-minute walk, stay hydrated, eat protein-rich snacks",
            "description_te": "10 నిమిషాలు నడవండి, నీరు తాగండి"
        })
    if len(assessment.anxiety_symptoms) > 2:
        recommendations.append({
            "type": "anxiety",
            "title": "Grounding exercise",
            "title_te": "గ్రౌండింగ్ వ్యాయామం",
            "description": "5-4-3-2-1: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste",
            "description_te": "5-4-3-2-1: 5 చూడు, 4 విను, 3 తాకు, 2 వాసన, 1 రుచి"
        })
    
    # Always recommend professional help for high risk
    if risk_level == "high":
        recommendations.append({
            "type": "professional",
            "title": "Consider professional support",
            "title_te": "వృత్తిపరమైన సహాయాన్ని పరిగణించండి",
            "description": "Helplines: iCall 9152987821, Vandrevala Foundation 1860-2662-345",
            "description_te": "హెల్ప్‌లైన్లు: iCall 9152987821"
        })
    
    # Store assessment
    record = {
        "id": generate_id(),
        "user_id": user["id"],
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "stress_level": assessment.stress_level,
        "sleep_quality": assessment.sleep_quality,
        "energy_level": assessment.energy_level,
        "anxiety_symptoms": assessment.anxiety_symptoms,
        "mood_description": assessment.mood_description,
        "recent_challenges": assessment.recent_challenges,
        "wellness_score": wellness_score,
        "risk_level": risk_level,
        "created_at": now_iso()
    }
    
    await db.mental_health_assessments.insert_one(record)
    record.pop("_id", None)
    
    return {
        "assessment_id": record["id"],
        "wellness_score": wellness_score,
        "risk_level": risk_level,
        "recommendations": recommendations,
        "message": "Your assessment has been recorded. Remember, it's okay to seek help." if risk_level in ["moderate", "high"] else "You're doing well! Keep up the healthy habits."
    }

@router.get("/psychologist/history")
async def get_psychologist_history(days: int = 7, user: dict = Depends(get_current_user)):
    """Get chat history with the psychologist"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    sessions = await db.psychologist_sessions.find(
        {"user_id": user["id"], "created_at": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"sessions": sessions, "count": len(sessions)}

@router.get("/psychologist/assessments")
async def get_assessment_history(user: dict = Depends(get_current_user)):
    """Get mental health assessment history"""
    assessments = await db.mental_health_assessments.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(30)
    
    return {"assessments": assessments, "count": len(assessments)}
