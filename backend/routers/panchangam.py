"""Panchangam Router - Telugu Panchangam with Rahu Kalam, etc."""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from typing import Optional
import math

router = APIRouter(prefix="/panchangam", tags=["Panchangam"])

# ============== PANCHANGAM CALCULATIONS ==============

# Telugu month names
TELUGU_MONTHS = [
    "చైత్రం", "వైశాఖం", "జ్యేష్ఠం", "ఆషాఢం", "శ్రావణం", "భాద్రపదం",
    "ఆశ్వయుజం", "కార్తీకం", "మార్గశిరం", "పుష్యం", "మాఘం", "ఫాల్గుణం"
]

ENGLISH_MONTHS = [
    "Chaitra", "Vaisakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashwayuja", "Kartika", "Margashira", "Pushya", "Magha", "Phalguna"
]

# Tithis (Lunar days)
TITHIS = [
    ("Pratipada", "పాడ్యమి", "1"),
    ("Dwitiya", "విదియ", "2"),
    ("Tritiya", "తదియ", "3"),
    ("Chaturthi", "చవితి", "4"),
    ("Panchami", "పంచమి", "5"),
    ("Shashthi", "షష్ఠి", "6"),
    ("Saptami", "సప్తమి", "7"),
    ("Ashtami", "అష్టమి", "8"),
    ("Navami", "నవమి", "9"),
    ("Dashami", "దశమి", "10"),
    ("Ekadashi", "ఏకాదశి", "11"),
    ("Dwadashi", "ద్వాదశి", "12"),
    ("Trayodashi", "త్రయోదశి", "13"),
    ("Chaturdashi", "చతుర్దశి", "14"),
    ("Purnima", "పూర్ణిమ", "15"),  # Full Moon
    ("Amavasya", "అమావాస్య", "30")  # New Moon
]

# Nakshatras
NAKSHATRAS = [
    ("Ashwini", "అశ్విని"),
    ("Bharani", "భరణి"),
    ("Krittika", "కృత్తిక"),
    ("Rohini", "రోహిణి"),
    ("Mrigashira", "మృగశిర"),
    ("Ardra", "ఆర్ద్ర"),
    ("Punarvasu", "పునర్వసు"),
    ("Pushya", "పుష్యమి"),
    ("Ashlesha", "ఆశ్లేష"),
    ("Magha", "మఘ"),
    ("Purva Phalguni", "పూర్వ ఫల్గుణి"),
    ("Uttara Phalguni", "ఉత్తర ఫల్గుణి"),
    ("Hasta", "హస్త"),
    ("Chitra", "చిత్త"),
    ("Swati", "స్వాతి"),
    ("Vishakha", "విశాఖ"),
    ("Anuradha", "అనురాధ"),
    ("Jyeshtha", "జ్యేష్ఠ"),
    ("Mula", "మూల"),
    ("Purva Ashadha", "పూర్వాషాఢ"),
    ("Uttara Ashadha", "ఉత్తరాషాఢ"),
    ("Shravana", "శ్రవణం"),
    ("Dhanishta", "ధనిష్ట"),
    ("Shatabhisha", "శతభిషం"),
    ("Purva Bhadrapada", "పూర్వ భాద్ర"),
    ("Uttara Bhadrapada", "ఉత్తర భాద్ర"),
    ("Revati", "రేవతి")
]

# Yogas
YOGAS = [
    ("Vishkumbha", "విష్కుంభం"),
    ("Priti", "ప్రీతి"),
    ("Ayushman", "ఆయుష్మాన్"),
    ("Saubhagya", "సౌభాగ్య"),
    ("Shobhana", "శోభన"),
    ("Atiganda", "అతిగండ"),
    ("Sukarma", "సుకర్మ"),
    ("Dhriti", "ధృతి"),
    ("Shula", "శూల"),
    ("Ganda", "గండ"),
    ("Vriddhi", "వృద్ధి"),
    ("Dhruva", "ధ్రువ"),
    ("Vyaghata", "వ్యాఘాత"),
    ("Harshana", "హర్షణ"),
    ("Vajra", "వజ్ర"),
    ("Siddhi", "సిద్ధి"),
    ("Vyatipata", "వ్యతీపాత"),
    ("Variyan", "వరియాన్"),
    ("Parigha", "పరిఘ"),
    ("Shiva", "శివ"),
    ("Siddha", "సిద్ధ"),
    ("Sadhya", "సాధ్య"),
    ("Shubha", "శుభ"),
    ("Shukla", "శుక్ల"),
    ("Brahma", "బ్రహ్మ"),
    ("Indra", "ఇంద్ర"),
    ("Vaidhriti", "వైధృతి")
]

# Karanas
KARANAS = [
    ("Bava", "బవ"),
    ("Balava", "బాలవ"),
    ("Kaulava", "కౌలవ"),
    ("Taitila", "తైతిల"),
    ("Gara", "గర"),
    ("Vanija", "వణిజ"),
    ("Vishti", "విష్టి"),  # Also called Bhadra
    ("Shakuni", "శకుని"),
    ("Chatushpada", "చతుష్పాద"),
    ("Naga", "నాగ"),
    ("Kimstughna", "కింస్తుఘ్న")
]

# Day names
VARAMS = [
    ("Sunday", "ఆదివారం", "Ravivaram"),
    ("Monday", "సోమవారం", "Somavaram"),
    ("Tuesday", "మంగళవారం", "Mangalavaram"),
    ("Wednesday", "బుధవారం", "Budhavaram"),
    ("Thursday", "గురువారం", "Guruvaram"),
    ("Friday", "శుక్రవారం", "Shukravaram"),
    ("Saturday", "శనివారం", "Shanivaram")
]

# Rahu Kalam timings for each day (as fractions of daylight hours)
# Order: Sun, Mon, Tue, Wed, Thu, Fri, Sat
RAHU_KALAM_PERIODS = [
    (7.5, 9),    # Sunday: 4:30 PM - 6:00 PM (7.5th to 9th period)
    (1, 2.5),    # Monday: 7:30 AM - 9:00 AM
    (3, 4.5),    # Tuesday: 3:00 PM - 4:30 PM
    (4.5, 6),    # Wednesday: 12:00 PM - 1:30 PM
    (6, 7.5),    # Thursday: 1:30 PM - 3:00 PM
    (2.5, 4),    # Friday: 10:30 AM - 12:00 PM
    (0, 1.5)     # Saturday: 9:00 AM - 10:30 AM
]

# Yamagandam timings
YAMAGANDAM_PERIODS = [
    (4.5, 6),    # Sunday
    (3, 4.5),    # Monday
    (6, 7.5),    # Tuesday
    (1.5, 3),    # Wednesday
    (0, 1.5),    # Thursday
    (4.5, 6),    # Friday
    (3, 4.5)     # Saturday
]

# Gulika/Kuligai timings
GULIKA_PERIODS = [
    (6, 7.5),    # Sunday
    (4.5, 6),    # Monday
    (3, 4.5),    # Tuesday
    (1.5, 3),    # Wednesday
    (0, 1.5),    # Thursday
    (7.5, 9),    # Friday
    (6, 7.5)     # Saturday
]

def get_sunrise_sunset(lat: float = 17.4563, lon: float = 78.6727):
    """Calculate approximate sunrise/sunset for Hyderabad (default coords)"""
    # Simplified calculation - actual would use proper astronomical formulas
    # For Hyderabad, approximate times vary by season
    today = datetime.now()
    day_of_year = today.timetuple().tm_yday
    
    # Seasonal variation (simplified)
    offset = math.sin((day_of_year - 80) * 2 * math.pi / 365) * 30  # +/- 30 minutes
    
    sunrise_hour = 6 + offset / 60  # Around 5:30 to 6:30
    sunset_hour = 18 + offset / 60  # Around 5:30 to 6:30 PM
    
    return {
        "sunrise": f"{int(sunrise_hour):02d}:{int((sunrise_hour % 1) * 60):02d}",
        "sunset": f"{int(sunset_hour):02d}:{int((sunset_hour % 1) * 60):02d}",
        "sunrise_hour": sunrise_hour,
        "sunset_hour": sunset_hour
    }

def calculate_period_time(day_of_week: int, period_start: float, period_end: float, sunrise_hour: float, sunset_hour: float):
    """Calculate actual time for a period based on daylight hours"""
    daylight_minutes = (sunset_hour - sunrise_hour) * 60
    period_length = daylight_minutes / 8  # 8 periods in daylight
    
    start_minutes = sunrise_hour * 60 + period_start * period_length / 1.5
    end_minutes = sunrise_hour * 60 + period_end * period_length / 1.5
    
    start_hour = int(start_minutes // 60)
    start_min = int(start_minutes % 60)
    end_hour = int(end_minutes // 60)
    end_min = int(end_minutes % 60)
    
    return f"{start_hour:02d}:{start_min:02d} - {end_hour:02d}:{end_min:02d}"

def get_tithi(date: datetime) -> dict:
    """Calculate approximate Tithi based on lunar phase"""
    # Simplified calculation
    # New moon reference: January 6, 2000
    ref_new_moon = datetime(2000, 1, 6, 18, 14)
    lunar_month = 29.530588853  # Average synodic month in days
    
    days_since_new_moon = (date - ref_new_moon).total_seconds() / 86400
    lunar_day = (days_since_new_moon % lunar_month) / lunar_month * 30
    
    tithi_index = int(lunar_day) % 15
    is_shukla = int(lunar_day) < 15  # Bright fortnight
    
    paksha = "Shukla" if is_shukla else "Krishna"
    paksha_te = "శుక్ల" if is_shukla else "కృష్ణ"
    
    tithi = TITHIS[tithi_index]
    
    return {
        "name": tithi[0],
        "name_te": tithi[1],
        "number": tithi[2],
        "paksha": paksha,
        "paksha_te": paksha_te,
        "lunar_day": int(lunar_day) + 1
    }

def get_nakshatra(date: datetime) -> dict:
    """Calculate approximate Nakshatra"""
    # Each nakshatra spans 13°20' (800 arc-minutes)
    # Moon moves ~13.2° per day
    ref_date = datetime(2000, 1, 1)
    days = (date - ref_date).days
    
    # Approximate nakshatra index (simplified)
    nak_index = int((days * 27.32166 / 27.3) % 27)
    nakshatra = NAKSHATRAS[nak_index]
    
    return {
        "name": nakshatra[0],
        "name_te": nakshatra[1],
        "number": nak_index + 1
    }

def get_yoga(date: datetime) -> dict:
    """Calculate approximate Yoga"""
    ref_date = datetime(2000, 1, 1)
    days = (date - ref_date).days
    yoga_index = int((days * 27 / 27.3) % 27)
    yoga = YOGAS[yoga_index]
    
    return {
        "name": yoga[0],
        "name_te": yoga[1],
        "number": yoga_index + 1
    }

def get_karana(date: datetime) -> dict:
    """Calculate approximate Karana"""
    ref_date = datetime(2000, 1, 1)
    days = (date - ref_date).days
    karana_index = int((days * 60 / 29.53) % 11)
    karana = KARANAS[karana_index]
    
    return {
        "name": karana[0],
        "name_te": karana[1]
    }

def get_telugu_month(date: datetime) -> dict:
    """Get Telugu month (approximate - based on lunar calendar)"""
    # Telugu calendar starts around March/April
    month = (date.month + 9) % 12  # Shift to start from Chaitra
    
    return {
        "name": ENGLISH_MONTHS[month],
        "name_te": TELUGU_MONTHS[month],
        "number": month + 1
    }

# ============== ROUTES ==============

@router.get("/today")
async def get_today_panchangam():
    """Get complete Panchangam for today"""
    now = datetime.now(timezone(timedelta(hours=5, minutes=30)))  # IST
    return await get_panchangam_for_date(now)

@router.get("/date/{date_str}")
async def get_panchangam_by_date(date_str: str):
    """Get Panchangam for a specific date (format: YYYY-MM-DD)"""
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d")
        date = date.replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
        return await get_panchangam_for_date(date)
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

async def get_panchangam_for_date(date: datetime) -> dict:
    """Generate complete Panchangam data for a date"""
    day_of_week = date.weekday()  # 0 = Monday, 6 = Sunday
    # Adjust for Indian week (Sunday = 0)
    indian_day = (day_of_week + 1) % 7
    
    sun_times = get_sunrise_sunset()
    tithi = get_tithi(date)
    nakshatra = get_nakshatra(date)
    yoga = get_yoga(date)
    karana = get_karana(date)
    telugu_month = get_telugu_month(date)
    varam = VARAMS[indian_day]
    
    # Calculate Rahu Kalam, Yamagandam, Gulika
    sunrise_h = sun_times["sunrise_hour"]
    sunset_h = sun_times["sunset_hour"]
    
    rahu_period = RAHU_KALAM_PERIODS[indian_day]
    yama_period = YAMAGANDAM_PERIODS[indian_day]
    gulika_period = GULIKA_PERIODS[indian_day]
    
    rahu_time = calculate_period_time(indian_day, rahu_period[0], rahu_period[1], sunrise_h, sunset_h)
    yama_time = calculate_period_time(indian_day, yama_period[0], yama_period[1], sunrise_h, sunset_h)
    gulika_time = calculate_period_time(indian_day, gulika_period[0], gulika_period[1], sunrise_h, sunset_h)
    
    # Calculate Abhijit Muhurtam (auspicious time around noon)
    abhijit_start = 11 + 36/60 + (sunset_h - sunrise_h - 12) / 2
    abhijit_end = abhijit_start + 48/60
    abhijit_time = f"{int(abhijit_start):02d}:{int((abhijit_start % 1) * 60):02d} - {int(abhijit_end):02d}:{int((abhijit_end % 1) * 60):02d}"
    
    # Durmuhurtam (inauspicious period)
    durmuhurt_periods = [
        (8, 24, 9, 12) if indian_day in [0, 3] else None,
        (15, 0, 15, 48) if indian_day in [1, 4] else None,
        (12, 24, 13, 12) if indian_day in [2, 5] else None,
        (10, 48, 11, 36) if indian_day == 6 else None
    ]
    durmuhurt = next((f"{h1:02d}:{m1:02d} - {h2:02d}:{m2:02d}" for h1, m1, h2, m2 in durmuhurt_periods if (h1, m1, h2, m2) is not None), "08:24 - 09:12")
    
    # Amrit Kalam (most auspicious time)
    amrit_offset = (nakshatra["number"] * 4) % 24
    amrit_start = (sunrise_h + amrit_offset) % 24
    amrit_end = amrit_start + 1.5
    amrit_time = f"{int(amrit_start):02d}:{int((amrit_start % 1) * 60):02d} - {int(amrit_end):02d}:{int((amrit_end % 1) * 60):02d}"
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "date_formatted": date.strftime("%d %B %Y"),
        "day": {
            "english": varam[0],
            "telugu": varam[1],
            "sanskrit": varam[2]
        },
        "telugu_month": telugu_month,
        "tithi": tithi,
        "nakshatra": nakshatra,
        "yoga": yoga,
        "karana": karana,
        "sunrise": sun_times["sunrise"],
        "sunset": sun_times["sunset"],
        "rahu_kalam": {
            "time": rahu_time,
            "name_te": "రాహు కాలం",
            "description": "Inauspicious time - avoid new beginnings",
            "description_te": "అశుభ సమయం - కొత్త పనులు మొదలుపెట్టవద్దు"
        },
        "yamagandam": {
            "time": yama_time,
            "name_te": "యమగండం",
            "description": "Inauspicious time - avoid risky activities",
            "description_te": "అశుభ సమయం - ప్రమాదకర కార్యకలాపాలు మానండి"
        },
        "gulika": {
            "time": gulika_time,
            "name_te": "గుళిక కాలం",
            "description": "Avoid starting important work",
            "description_te": "ముఖ్యమైన పని మొదలుపెట్టవద్దు"
        },
        "abhijit_muhurtam": {
            "time": abhijit_time,
            "name_te": "అభిజిత్ ముహూర్తం",
            "description": "Most auspicious time of the day",
            "description_te": "రోజులో అత్యంత శుభ సమయం"
        },
        "durmuhurtam": {
            "time": durmuhurt,
            "name_te": "దుర్ముహూర్తం",
            "description": "Inauspicious period",
            "description_te": "అశుభ సమయం"
        },
        "amrit_kalam": {
            "time": amrit_time,
            "name_te": "అమృత కాలం",
            "description": "Excellent for important activities",
            "description_te": "ముఖ్యమైన కార్యకలాపాలకు అద్భుతం"
        },
        "special_notes": get_special_notes(tithi, nakshatra, yoga),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

def get_special_notes(tithi: dict, nakshatra: dict, yoga: dict) -> list:
    """Get special notes based on Panchangam elements"""
    notes = []
    
    # Ekadashi fasting
    if tithi["name"] == "Ekadashi":
        notes.append({
            "type": "festival",
            "name": "Ekadashi Fasting Day",
            "name_te": "ఏకాదశి ఉపవాసం",
            "description": "Auspicious day for fasting and worship of Lord Vishnu"
        })
    
    # Purnima
    if tithi["name"] == "Purnima":
        notes.append({
            "type": "festival",
            "name": "Full Moon Day",
            "name_te": "పూర్ణిమ",
            "description": "Auspicious for charity and worship"
        })
    
    # Amavasya
    if tithi["name"] == "Amavasya":
        notes.append({
            "type": "festival",
            "name": "New Moon Day",
            "name_te": "అమావాస్య",
            "description": "Day for ancestral worship (Pitru Tarpana)"
        })
    
    # Auspicious Nakshatras
    auspicious_nakshatras = ["Ashwini", "Rohini", "Mrigashira", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Dhanishta", "Revati"]
    if nakshatra["name"] in auspicious_nakshatras:
        notes.append({
            "type": "auspicious",
            "name": f"{nakshatra['name']} - Auspicious Nakshatra",
            "name_te": f"{nakshatra['name_te']} - శుభ నక్షత్రం",
            "description": "Good for starting new ventures"
        })
    
    return notes
