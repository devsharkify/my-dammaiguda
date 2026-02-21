"""Muhurtam Calculator - Find auspicious times for events"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import math

router = APIRouter(prefix="/muhurtam", tags=["Muhurtam"])

# ============== EVENT TYPES ==============

EVENT_TYPES = {
    "marriage": {
        "name": "Marriage",
        "name_te": "వివాహం",
        "description": "Wedding ceremony",
        "description_te": "పెళ్లి వేడుక",
        "duration_hours": 3,
        "preferred_tithis": ["Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Trayodashi"],
        "avoided_tithis": ["Amavasya", "Chaturthi", "Shashthi", "Ashtami", "Navami", "Chaturdashi", "Purnima"],
        "preferred_nakshatras": ["Rohini", "Mrigashira", "Magha", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Mula", "Uttara Ashadha", "Shravana", "Uttara Bhadrapada", "Revati"],
        "avoided_nakshatras": ["Bharani", "Krittika", "Ardra", "Ashlesha", "Purva Phalguni", "Vishakha", "Jyeshtha", "Purva Ashadha", "Purva Bhadrapada"],
        "preferred_days": [1, 3, 4, 5],  # Mon, Wed, Thu, Fri
        "avoided_days": [2, 6]  # Tue, Sat
    },
    "griha_pravesham": {
        "name": "Griha Pravesham",
        "name_te": "గృహ ప్రవేశం",
        "description": "House warming ceremony",
        "description_te": "ఇంట్లోకి ప్రవేశం",
        "duration_hours": 2,
        "preferred_tithis": ["Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi"],
        "avoided_tithis": ["Amavasya", "Chaturthi", "Navami", "Chaturdashi"],
        "preferred_nakshatras": ["Rohini", "Mrigashira", "Punarvasu", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Anuradha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Uttara Bhadrapada", "Revati"],
        "avoided_nakshatras": ["Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Purva Phalguni", "Vishakha", "Jyeshtha"],
        "preferred_days": [1, 3, 4, 5],
        "avoided_days": [2, 6]
    },
    "vehicle_purchase": {
        "name": "Vehicle Purchase",
        "name_te": "వాహన కొనుగోలు",
        "description": "Buying a new vehicle",
        "description_te": "కొత్త వాహనం కొనుగోలు",
        "duration_hours": 1,
        "preferred_tithis": ["Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi"],
        "avoided_tithis": ["Amavasya", "Chaturthi", "Ashtami", "Navami", "Chaturdashi"],
        "preferred_nakshatras": ["Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Dhanishta", "Revati"],
        "avoided_nakshatras": ["Bharani", "Krittika", "Ardra", "Ashlesha", "Purva Phalguni", "Vishakha", "Jyeshtha", "Mula"],
        "preferred_days": [0, 1, 3, 5],  # Sun, Mon, Wed, Fri
        "avoided_days": [2, 6]
    },
    "business_start": {
        "name": "Business Start",
        "name_te": "వ్యాపార ప్రారంభం",
        "description": "Starting a new business or venture",
        "description_te": "కొత్త వ్యాపారం ప్రారంభించడం",
        "duration_hours": 1,
        "preferred_tithis": ["Pratipada", "Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi"],
        "avoided_tithis": ["Amavasya", "Chaturthi", "Shashthi", "Ashtami", "Navami", "Chaturdashi"],
        "preferred_nakshatras": ["Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Anuradha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Uttara Bhadrapada", "Revati"],
        "avoided_nakshatras": ["Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Purva Phalguni", "Vishakha", "Jyeshtha", "Mula"],
        "preferred_days": [1, 3, 4, 5],
        "avoided_days": [2, 6]
    },
    "naming_ceremony": {
        "name": "Naming Ceremony",
        "name_te": "నామకరణం",
        "description": "Baby naming ceremony",
        "description_te": "శిశువుకు పేరు పెట్టే వేడుక",
        "duration_hours": 1,
        "preferred_tithis": ["Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Purnima"],
        "avoided_tithis": ["Amavasya", "Chaturthi", "Shashthi", "Ashtami", "Navami", "Chaturdashi"],
        "preferred_nakshatras": ["Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Anuradha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Uttara Bhadrapada", "Revati"],
        "avoided_nakshatras": ["Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Vishakha", "Jyeshtha", "Mula"],
        "preferred_days": [0, 1, 3, 4, 5],
        "avoided_days": [2, 6]
    }
}

# Tithis list for calculation
TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"
]

TITHIS_TE = {
    "Pratipada": "పాడ్యమి",
    "Dwitiya": "విదియ",
    "Tritiya": "తదియ",
    "Chaturthi": "చవితి",
    "Panchami": "పంచమి",
    "Shashthi": "షష్ఠి",
    "Saptami": "సప్తమి",
    "Ashtami": "అష్టమి",
    "Navami": "నవమి",
    "Dashami": "దశమి",
    "Ekadashi": "ఏకాదశి",
    "Dwadashi": "ద్వాదశి",
    "Trayodashi": "త్రయోదశి",
    "Chaturdashi": "చతుర్దశి",
    "Purnima": "పూర్ణిమ",
    "Amavasya": "అమావాస్య"
}

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

NAKSHATRAS_TE = {
    "Ashwini": "అశ్విని", "Bharani": "భరణి", "Krittika": "కృత్తిక",
    "Rohini": "రోహిణి", "Mrigashira": "మృగశిర", "Ardra": "ఆర్ద్ర",
    "Punarvasu": "పునర్వసు", "Pushya": "పుష్యమి", "Ashlesha": "ఆశ్లేష",
    "Magha": "మఘ", "Purva Phalguni": "పూర్వ ఫల్గుణి", "Uttara Phalguni": "ఉత్తర ఫల్గుణి",
    "Hasta": "హస్త", "Chitra": "చిత్త", "Swati": "స్వాతి",
    "Vishakha": "విశాఖ", "Anuradha": "అనురాధ", "Jyeshtha": "జ్యేష్ఠ",
    "Mula": "మూల", "Purva Ashadha": "పూర్వాషాఢ", "Uttara Ashadha": "ఉత్తరాషాఢ",
    "Shravana": "శ్రవణం", "Dhanishta": "ధనిష్ట", "Shatabhisha": "శతభిషం",
    "Purva Bhadrapada": "పూర్వ భాద్ర", "Uttara Bhadrapada": "ఉత్తర భాద్ర", "Revati": "రేవతి"
}

DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
DAYS_TE = {
    "Sunday": "ఆదివారం", "Monday": "సోమవారం", "Tuesday": "మంగళవారం",
    "Wednesday": "బుధవారం", "Thursday": "గురువారం", "Friday": "శుక్రవారం",
    "Saturday": "శనివారం"
}

# ============== CALCULATION HELPERS ==============

def get_tithi_for_date(date: datetime) -> str:
    """Calculate approximate tithi for a date"""
    ref_new_moon = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    lunar_month = 29.530588853
    
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    
    days_since_new_moon = (date - ref_new_moon).total_seconds() / 86400
    lunar_day = (days_since_new_moon % lunar_month) / lunar_month * 30
    
    tithi_index = int(lunar_day) % 15
    is_shukla = int(lunar_day) < 15
    
    if tithi_index == 14:
        return "Purnima" if is_shukla else "Amavasya"
    
    return TITHIS[tithi_index]

def get_nakshatra_for_date(date: datetime) -> str:
    """Calculate approximate nakshatra for a date"""
    ref_date = datetime(2000, 1, 1, tzinfo=timezone.utc)
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    days = (date - ref_date).days
    nak_index = int((days * 27.32166 / 27.3) % 27)
    return NAKSHATRAS[nak_index]

def get_rahu_kalam(day_of_week: int, sunrise_hour: float = 6.0, sunset_hour: float = 18.0) -> tuple:
    """Get Rahu Kalam start and end hours"""
    rahu_periods = [
        (16.5, 18),    # Sunday
        (7.5, 9),      # Monday
        (15, 16.5),    # Tuesday
        (12, 13.5),    # Wednesday
        (13.5, 15),    # Thursday
        (10.5, 12),    # Friday
        (9, 10.5)      # Saturday
    ]
    return rahu_periods[day_of_week]

def is_in_rahu_kalam(hour: float, day_of_week: int) -> bool:
    """Check if given hour falls in Rahu Kalam"""
    start, end = get_rahu_kalam(day_of_week)
    return start <= hour < end

def calculate_score(date: datetime, event_config: dict) -> dict:
    """Calculate suitability score for an event on given date"""
    score = 0
    factors = []
    warnings = []
    
    day_of_week = date.weekday()
    # Convert to Indian week (0 = Sunday)
    indian_day = (day_of_week + 1) % 7
    
    tithi = get_tithi_for_date(date)
    nakshatra = get_nakshatra_for_date(date)
    day_name = DAYS[indian_day]
    
    # Check tithi
    if tithi in event_config.get("preferred_tithis", []):
        score += 25
        factors.append({"type": "tithi", "status": "good", "message": f"Auspicious Tithi: {tithi}", "message_te": f"శుభ తిథి: {TITHIS_TE.get(tithi, tithi)}"})
    elif tithi in event_config.get("avoided_tithis", []):
        score -= 20
        warnings.append({"type": "tithi", "status": "bad", "message": f"Inauspicious Tithi: {tithi}", "message_te": f"అశుభ తిథి: {TITHIS_TE.get(tithi, tithi)}"})
    else:
        score += 10
        factors.append({"type": "tithi", "status": "neutral", "message": f"Neutral Tithi: {tithi}", "message_te": f"తిథి: {TITHIS_TE.get(tithi, tithi)}"})
    
    # Check nakshatra
    if nakshatra in event_config.get("preferred_nakshatras", []):
        score += 25
        factors.append({"type": "nakshatra", "status": "good", "message": f"Auspicious Nakshatra: {nakshatra}", "message_te": f"శుభ నక్షత్రం: {NAKSHATRAS_TE.get(nakshatra, nakshatra)}"})
    elif nakshatra in event_config.get("avoided_nakshatras", []):
        score -= 20
        warnings.append({"type": "nakshatra", "status": "bad", "message": f"Inauspicious Nakshatra: {nakshatra}", "message_te": f"అశుభ నక్షత్రం: {NAKSHATRAS_TE.get(nakshatra, nakshatra)}"})
    else:
        score += 10
        factors.append({"type": "nakshatra", "status": "neutral", "message": f"Neutral Nakshatra: {nakshatra}", "message_te": f"నక్షత్రం: {NAKSHATRAS_TE.get(nakshatra, nakshatra)}"})
    
    # Check day
    if indian_day in event_config.get("preferred_days", []):
        score += 20
        factors.append({"type": "day", "status": "good", "message": f"Auspicious Day: {day_name}", "message_te": f"శుభ వారం: {DAYS_TE.get(day_name, day_name)}"})
    elif indian_day in event_config.get("avoided_days", []):
        score -= 15
        warnings.append({"type": "day", "status": "bad", "message": f"Avoid: {day_name}", "message_te": f"వద్దు: {DAYS_TE.get(day_name, day_name)}"})
    else:
        score += 5
        factors.append({"type": "day", "status": "neutral", "message": f"Day: {day_name}", "message_te": f"వారం: {DAYS_TE.get(day_name, day_name)}"})
    
    # Bonus for avoiding Rahu Kalam in the morning (common auspicious time)
    factors.append({"type": "rahu_kalam", "status": "info", "message": f"Avoid Rahu Kalam on this day", "message_te": f"ఈ రోజు రాహు కాలం నివారించండి"})
    
    # Normalize score to 0-100
    score = max(0, min(100, score + 50))
    
    # Determine rating
    if score >= 80:
        rating = {"level": "excellent", "label": "Excellent", "label_te": "అద్భుతం"}
    elif score >= 60:
        rating = {"level": "good", "label": "Good", "label_te": "మంచిది"}
    elif score >= 40:
        rating = {"level": "average", "label": "Average", "label_te": "సాధారణం"}
    else:
        rating = {"level": "poor", "label": "Not Recommended", "label_te": "సిఫార్సు చేయలేదు"}
    
    return {
        "score": score,
        "rating": rating,
        "tithi": {"name": tithi, "name_te": TITHIS_TE.get(tithi, tithi)},
        "nakshatra": {"name": nakshatra, "name_te": NAKSHATRAS_TE.get(nakshatra, nakshatra)},
        "day": {"name": day_name, "name_te": DAYS_TE.get(day_name, day_name)},
        "factors": factors,
        "warnings": warnings
    }

def find_muhurtam_times(date: datetime, event_config: dict) -> list:
    """Find auspicious time slots on a given date"""
    muhurtams = []
    indian_day = (date.weekday() + 1) % 7
    
    # Rahu Kalam to avoid
    rahu_start, rahu_end = get_rahu_kalam(indian_day)
    
    # Abhijit Muhurtam (around noon) - always auspicious
    abhijit_start = 11.6  # 11:36 AM
    abhijit_end = 12.4    # 12:24 PM
    
    # Check if Abhijit is not in Rahu Kalam
    if not (rahu_start <= abhijit_start < rahu_end):
        muhurtams.append({
            "name": "Abhijit Muhurtam",
            "name_te": "అభిజిత్ ముహూర్తం",
            "start": f"{int(abhijit_start):02d}:{int((abhijit_start % 1) * 60):02d}",
            "end": f"{int(abhijit_end):02d}:{int((abhijit_end % 1) * 60):02d}",
            "quality": "excellent",
            "description": "Most auspicious time of the day",
            "description_te": "రోజులో అత్యంత శుభ సమయం"
        })
    
    # Morning muhurtam (6 AM - 9 AM, avoiding Rahu Kalam)
    morning_slots = [(6, 7.5), (7.5, 9)]
    for start, end in morning_slots:
        if not (rahu_start <= start < rahu_end or rahu_start < end <= rahu_end):
            muhurtams.append({
                "name": "Morning Muhurtam",
                "name_te": "ఉదయ ముహూర్తం",
                "start": f"{int(start):02d}:{int((start % 1) * 60):02d}",
                "end": f"{int(end):02d}:{int((end % 1) * 60):02d}",
                "quality": "good",
                "description": "Auspicious morning time",
                "description_te": "శుభ ఉదయ సమయం"
            })
            break
    
    # Evening muhurtam (4 PM - 6 PM, avoiding Rahu Kalam)
    evening_slots = [(16, 17.5), (17.5, 18)]
    for start, end in evening_slots:
        if not (rahu_start <= start < rahu_end or rahu_start < end <= rahu_end):
            muhurtams.append({
                "name": "Evening Muhurtam",
                "name_te": "సాయంత్ర ముహూర్తం",
                "start": f"{int(start):02d}:{int((start % 1) * 60):02d}",
                "end": f"{int(end):02d}:{int((end % 1) * 60):02d}",
                "quality": "good",
                "description": "Auspicious evening time",
                "description_te": "శుభ సాయంత్ర సమయం"
            })
            break
    
    return muhurtams

# ============== ROUTES ==============

@router.get("/event-types")
async def get_event_types():
    """Get all supported event types with details"""
    events = []
    for key, config in EVENT_TYPES.items():
        events.append({
            "id": key,
            "name": config["name"],
            "name_te": config["name_te"],
            "description": config["description"],
            "description_te": config["description_te"],
            "duration_hours": config["duration_hours"]
        })
    return {"events": events}

@router.get("/calculate/{event_type}")
async def calculate_muhurtam(
    event_type: str,
    date: str,  # Format: YYYY-MM-DD
):
    """Calculate muhurtam for a specific event and date"""
    if event_type not in EVENT_TYPES:
        return {"error": f"Unknown event type: {event_type}. Valid types: {list(EVENT_TYPES.keys())}"}
    
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
        target_date = target_date.replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}
    
    event_config = EVENT_TYPES[event_type]
    
    # Calculate score for the date
    result = calculate_score(target_date, event_config)
    
    # Find auspicious times
    muhurtams = find_muhurtam_times(target_date, event_config)
    
    # Get Rahu Kalam for the day
    indian_day = (target_date.weekday() + 1) % 7
    rahu_start, rahu_end = get_rahu_kalam(indian_day)
    
    return {
        "event": {
            "type": event_type,
            "name": event_config["name"],
            "name_te": event_config["name_te"]
        },
        "date": date,
        "date_formatted": target_date.strftime("%d %B %Y"),
        "score": result["score"],
        "rating": result["rating"],
        "tithi": result["tithi"],
        "nakshatra": result["nakshatra"],
        "day": result["day"],
        "factors": result["factors"],
        "warnings": result["warnings"],
        "auspicious_times": muhurtams,
        "rahu_kalam": {
            "start": f"{int(rahu_start):02d}:{int((rahu_start % 1) * 60):02d}",
            "end": f"{int(rahu_end):02d}:{int((rahu_end % 1) * 60):02d}",
            "name_te": "రాహు కాలం",
            "warning": "Avoid starting important activities during Rahu Kalam",
            "warning_te": "రాహు కాలంలో ముఖ్యమైన పనులు ప్రారంభించవద్దు"
        }
    }

@router.get("/find-dates/{event_type}")
async def find_auspicious_dates(
    event_type: str,
    start_date: str,  # Format: YYYY-MM-DD
    num_days: int = 30
):
    """Find auspicious dates for an event in a date range"""
    if event_type not in EVENT_TYPES:
        return {"error": f"Unknown event type: {event_type}"}
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        start = start.replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}
    
    event_config = EVENT_TYPES[event_type]
    
    # Find dates with good scores
    good_dates = []
    for i in range(min(num_days, 90)):  # Max 90 days
        check_date = start + timedelta(days=i)
        result = calculate_score(check_date, event_config)
        
        if result["score"] >= 60:  # Good or excellent
            good_dates.append({
                "date": check_date.strftime("%Y-%m-%d"),
                "date_formatted": check_date.strftime("%d %B %Y"),
                "day": result["day"],
                "score": result["score"],
                "rating": result["rating"],
                "tithi": result["tithi"],
                "nakshatra": result["nakshatra"]
            })
    
    # Sort by score
    good_dates.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "event": {
            "type": event_type,
            "name": event_config["name"],
            "name_te": event_config["name_te"]
        },
        "search_range": {
            "start": start_date,
            "days": num_days
        },
        "auspicious_dates": good_dates[:10],  # Top 10
        "total_found": len(good_dates)
    }
