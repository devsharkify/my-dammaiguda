"""South Indian Astrology Router - Kundali Generation"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import math

router = APIRouter(prefix="/astrology", tags=["Astrology"])

# Zodiac signs (Rashi) - South Indian order
RASHIS = [
    {"name": "Mesha", "name_te": "మేషం", "symbol": "♈", "english": "Aries"},
    {"name": "Vrishabha", "name_te": "వృషభం", "symbol": "♉", "english": "Taurus"},
    {"name": "Mithuna", "name_te": "మిథునం", "symbol": "♊", "english": "Gemini"},
    {"name": "Karka", "name_te": "కర్కాటకం", "symbol": "♋", "english": "Cancer"},
    {"name": "Simha", "name_te": "సింహం", "symbol": "♌", "english": "Leo"},
    {"name": "Kanya", "name_te": "కన్య", "symbol": "♍", "english": "Virgo"},
    {"name": "Tula", "name_te": "తులా", "symbol": "♎", "english": "Libra"},
    {"name": "Vrischika", "name_te": "వృశ్చికం", "symbol": "♏", "english": "Scorpio"},
    {"name": "Dhanu", "name_te": "ధనుస్సు", "symbol": "♐", "english": "Sagittarius"},
    {"name": "Makara", "name_te": "మకరం", "symbol": "♑", "english": "Capricorn"},
    {"name": "Kumbha", "name_te": "కుంభం", "symbol": "♒", "english": "Aquarius"},
    {"name": "Meena", "name_te": "మీనం", "symbol": "♓", "english": "Pisces"}
]

# Planets (Grahas)
GRAHAS = [
    {"name": "Surya", "name_te": "సూర్యుడు", "symbol": "☉", "english": "Sun"},
    {"name": "Chandra", "name_te": "చంద్రుడు", "symbol": "☽", "english": "Moon"},
    {"name": "Mangal", "name_te": "కుజుడు", "symbol": "♂", "english": "Mars"},
    {"name": "Budha", "name_te": "బుధుడు", "symbol": "☿", "english": "Mercury"},
    {"name": "Guru", "name_te": "గురువు", "symbol": "♃", "english": "Jupiter"},
    {"name": "Shukra", "name_te": "శుక్రుడు", "symbol": "♀", "english": "Venus"},
    {"name": "Shani", "name_te": "శని", "symbol": "♄", "english": "Saturn"},
    {"name": "Rahu", "name_te": "రాహువు", "symbol": "☊", "english": "Rahu"},
    {"name": "Ketu", "name_te": "కేతువు", "symbol": "☋", "english": "Ketu"}
]

# Nakshatras (27 birth stars)
NAKSHATRAS = [
    {"name": "Ashwini", "name_te": "అశ్వని", "lord": "Ketu"},
    {"name": "Bharani", "name_te": "భరణి", "lord": "Venus"},
    {"name": "Krittika", "name_te": "కృత్తిక", "lord": "Sun"},
    {"name": "Rohini", "name_te": "రోహిణి", "lord": "Moon"},
    {"name": "Mrigashira", "name_te": "మృగశిర", "lord": "Mars"},
    {"name": "Ardra", "name_te": "ఆర్ద్ర", "lord": "Rahu"},
    {"name": "Punarvasu", "name_te": "పునర్వసు", "lord": "Jupiter"},
    {"name": "Pushya", "name_te": "పుష్య", "lord": "Saturn"},
    {"name": "Ashlesha", "name_te": "ఆశ్లేష", "lord": "Mercury"},
    {"name": "Magha", "name_te": "మఖ", "lord": "Ketu"},
    {"name": "Purva Phalguni", "name_te": "పూర్వ ఫల్గుని", "lord": "Venus"},
    {"name": "Uttara Phalguni", "name_te": "ఉత్తర ఫల్గుని", "lord": "Sun"},
    {"name": "Hasta", "name_te": "హస్త", "lord": "Moon"},
    {"name": "Chitra", "name_te": "చిత్ర", "lord": "Mars"},
    {"name": "Swati", "name_te": "స్వాతి", "lord": "Rahu"},
    {"name": "Vishakha", "name_te": "విశాఖ", "lord": "Jupiter"},
    {"name": "Anuradha", "name_te": "అనూరాధ", "lord": "Saturn"},
    {"name": "Jyeshtha", "name_te": "జ్యేష్ఠ", "lord": "Mercury"},
    {"name": "Mula", "name_te": "మూల", "lord": "Ketu"},
    {"name": "Purva Ashadha", "name_te": "పూర్వాషాఢ", "lord": "Venus"},
    {"name": "Uttara Ashadha", "name_te": "ఉత్తరాషాఢ", "lord": "Sun"},
    {"name": "Shravana", "name_te": "శ్రవణం", "lord": "Moon"},
    {"name": "Dhanishta", "name_te": "ధనిష్ఠ", "lord": "Mars"},
    {"name": "Shatabhisha", "name_te": "శతభిషం", "lord": "Rahu"},
    {"name": "Purva Bhadrapada", "name_te": "పూర్వభాద్ర", "lord": "Jupiter"},
    {"name": "Uttara Bhadrapada", "name_te": "ఉత్తరభాద్ర", "lord": "Saturn"},
    {"name": "Revati", "name_te": "రేవతి", "lord": "Mercury"}
]

# Major cities in India with coordinates
CITIES = {
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "tz": 5.5},
    "chennai": {"lat": 13.0827, "lon": 80.2707, "tz": 5.5},
    "bangalore": {"lat": 12.9716, "lon": 77.5946, "tz": 5.5},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "tz": 5.5},
    "delhi": {"lat": 28.6139, "lon": 77.2090, "tz": 5.5},
    "kolkata": {"lat": 22.5726, "lon": 88.3639, "tz": 5.5},
    "vijayawada": {"lat": 16.5062, "lon": 80.6480, "tz": 5.5},
    "visakhapatnam": {"lat": 17.6868, "lon": 83.2185, "tz": 5.5},
    "tirupati": {"lat": 13.6288, "lon": 79.4192, "tz": 5.5},
    "warangal": {"lat": 17.9784, "lon": 79.5941, "tz": 5.5},
    "secunderabad": {"lat": 17.4399, "lon": 78.4983, "tz": 5.5},
    "dammaiguda": {"lat": 17.4844, "lon": 78.5667, "tz": 5.5},
}


class KundaliRequest(BaseModel):
    name: str
    gender: str  # male/female
    date_of_birth: str  # YYYY-MM-DD
    time_of_birth: str  # HH:MM
    place_of_birth: str


def calculate_julian_day(year: int, month: int, day: int, hour: float) -> float:
    """Calculate Julian Day Number"""
    if month <= 2:
        year -= 1
        month += 12
    
    a = int(year / 100)
    b = 2 - a + int(a / 4)
    
    jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + hour/24 + b - 1524.5
    return jd


def calculate_ayanamsa(jd: float) -> float:
    """Calculate Lahiri Ayanamsa"""
    t = (jd - 2451545.0) / 36525.0
    ayanamsa = 23.85 + 0.0137 * (jd - 2451545.0) / 365.25
    return ayanamsa


def get_moon_longitude(jd: float) -> float:
    """Simplified Moon longitude calculation"""
    d = jd - 2451545.0
    # Mean longitude
    l = (218.316 + 13.176396 * d) % 360
    # Mean anomaly
    m = (134.963 + 13.064993 * d) % 360
    # Mean distance
    f = (93.272 + 13.229350 * d) % 360
    
    # Simplified correction
    lon = l + 6.289 * math.sin(math.radians(m))
    return lon % 360


def get_sun_longitude(jd: float) -> float:
    """Simplified Sun longitude calculation"""
    d = jd - 2451545.0
    g = (357.529 + 0.98560028 * d) % 360
    q = (280.459 + 0.98564736 * d) % 360
    
    l = q + 1.915 * math.sin(math.radians(g)) + 0.020 * math.sin(math.radians(2*g))
    return l % 360


def calculate_ascendant(jd: float, lat: float, lon: float) -> float:
    """Calculate Lagna (Ascendant)"""
    # Local Sidereal Time
    d = jd - 2451545.0
    lst = (100.46 + 0.985647 * d + lon + 15 * ((jd % 1) * 24)) % 360
    
    # Ascendant calculation
    obliquity = 23.44
    asc = math.degrees(math.atan2(
        math.cos(math.radians(lst)),
        -math.sin(math.radians(lst)) * math.cos(math.radians(obliquity)) - 
        math.tan(math.radians(lat)) * math.sin(math.radians(obliquity))
    ))
    
    if asc < 0:
        asc += 360
    
    return asc % 360


def get_rashi_index(longitude: float) -> int:
    """Get Rashi index from longitude"""
    return int(longitude / 30) % 12


def get_nakshatra_index(moon_longitude: float) -> int:
    """Get Nakshatra index from Moon longitude"""
    return int(moon_longitude / (360/27)) % 27


def generate_planetary_positions(jd: float, ayanamsa: float, lat: float, lon: float) -> list:
    """Generate positions for all planets"""
    positions = []
    
    # Sun
    sun_lon = (get_sun_longitude(jd) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[0],
        "longitude": sun_lon,
        "rashi_index": get_rashi_index(sun_lon),
        "rashi": RASHIS[get_rashi_index(sun_lon)]
    })
    
    # Moon
    moon_lon = (get_moon_longitude(jd) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[1],
        "longitude": moon_lon,
        "rashi_index": get_rashi_index(moon_lon),
        "rashi": RASHIS[get_rashi_index(moon_lon)]
    })
    
    # Other planets (simplified positions based on average motions)
    d = jd - 2451545.0
    
    # Mars
    mars_lon = ((355.45 + 0.5240207 * d) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[2],
        "longitude": mars_lon,
        "rashi_index": get_rashi_index(mars_lon),
        "rashi": RASHIS[get_rashi_index(mars_lon)]
    })
    
    # Mercury
    merc_lon = ((48.33 + 4.092377 * d) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[3],
        "longitude": merc_lon,
        "rashi_index": get_rashi_index(merc_lon),
        "rashi": RASHIS[get_rashi_index(merc_lon)]
    })
    
    # Jupiter
    jup_lon = ((34.40 + 0.0830853 * d) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[4],
        "longitude": jup_lon,
        "rashi_index": get_rashi_index(jup_lon),
        "rashi": RASHIS[get_rashi_index(jup_lon)]
    })
    
    # Venus
    ven_lon = ((181.98 + 1.6021302 * d) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[5],
        "longitude": ven_lon,
        "rashi_index": get_rashi_index(ven_lon),
        "rashi": RASHIS[get_rashi_index(ven_lon)]
    })
    
    # Saturn
    sat_lon = ((49.94 + 0.0334442 * d) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[6],
        "longitude": sat_lon,
        "rashi_index": get_rashi_index(sat_lon),
        "rashi": RASHIS[get_rashi_index(sat_lon)]
    })
    
    # Rahu (Mean Node)
    rahu_lon = ((125.04 - 0.0529539 * d) - ayanamsa) % 360
    positions.append({
        "planet": GRAHAS[7],
        "longitude": rahu_lon,
        "rashi_index": get_rashi_index(rahu_lon),
        "rashi": RASHIS[get_rashi_index(rahu_lon)]
    })
    
    # Ketu (opposite to Rahu)
    ketu_lon = (rahu_lon + 180) % 360
    positions.append({
        "planet": GRAHAS[8],
        "longitude": ketu_lon,
        "rashi_index": get_rashi_index(ketu_lon),
        "rashi": RASHIS[get_rashi_index(ketu_lon)]
    })
    
    return positions


def generate_house_chart(ascendant_index: int, planets: list) -> list:
    """Generate South Indian style chart with 12 houses"""
    # South Indian chart - houses are fixed, signs rotate
    # House positions in the grid (0-11)
    houses = []
    
    for i in range(12):
        rashi_idx = (ascendant_index + i) % 12
        house_planets = [p for p in planets if p["rashi_index"] == rashi_idx]
        houses.append({
            "house_number": i + 1,
            "rashi": RASHIS[rashi_idx],
            "planets": house_planets
        })
    
    return houses


def get_dasha_periods(moon_nakshatra_index: int, birth_date: datetime) -> list:
    """Calculate Vimshottari Dasha periods"""
    dasha_lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
    dasha_years = [7, 20, 6, 10, 7, 18, 16, 19, 17]
    
    # Starting dasha based on nakshatra
    start_idx = moon_nakshatra_index % 9
    
    periods = []
    current_date = birth_date
    
    for i in range(9):
        idx = (start_idx + i) % 9
        end_date = current_date.replace(year=current_date.year + dasha_years[idx])
        periods.append({
            "lord": dasha_lords[idx],
            "years": dasha_years[idx],
            "start": current_date.strftime("%Y-%m-%d"),
            "end": end_date.strftime("%Y-%m-%d")
        })
        current_date = end_date
    
    return periods


@router.post("/kundali")
async def generate_kundali(request: KundaliRequest):
    """Generate South Indian Kundali/Birth Chart"""
    try:
        # Parse birth date and time
        dob = datetime.strptime(request.date_of_birth, "%Y-%m-%d")
        time_parts = request.time_of_birth.split(":")
        hour = int(time_parts[0]) + int(time_parts[1]) / 60
        
        # Get coordinates for place
        place_lower = request.place_of_birth.lower().strip()
        if place_lower in CITIES:
            coords = CITIES[place_lower]
        else:
            # Default to Hyderabad if place not found
            coords = CITIES["hyderabad"]
        
        # Calculate Julian Day
        jd = calculate_julian_day(dob.year, dob.month, dob.day, hour - coords["tz"])
        
        # Calculate Ayanamsa (Lahiri)
        ayanamsa = calculate_ayanamsa(jd)
        
        # Calculate Ascendant (Lagna)
        ascendant = (calculate_ascendant(jd, coords["lat"], coords["lon"]) - ayanamsa) % 360
        ascendant_index = get_rashi_index(ascendant)
        
        # Get planetary positions
        planets = generate_planetary_positions(jd, ayanamsa, coords["lat"], coords["lon"])
        
        # Get Moon's Nakshatra
        moon_lon = planets[1]["longitude"]
        nakshatra_index = get_nakshatra_index(moon_lon)
        nakshatra = NAKSHATRAS[nakshatra_index]
        
        # Generate house chart
        houses = generate_house_chart(ascendant_index, planets)
        
        # Generate Dasha periods
        dashas = get_dasha_periods(nakshatra_index, dob)
        
        # Moon sign (Rashi)
        moon_rashi = RASHIS[planets[1]["rashi_index"]]
        
        # Sun sign
        sun_rashi = RASHIS[planets[0]["rashi_index"]]
        
        return {
            "success": True,
            "kundali": {
                "name": request.name,
                "gender": request.gender,
                "date_of_birth": request.date_of_birth,
                "time_of_birth": request.time_of_birth,
                "place_of_birth": request.place_of_birth,
                "coordinates": coords,
                
                # Key details
                "lagna": {
                    "rashi": RASHIS[ascendant_index],
                    "degree": round(ascendant % 30, 2)
                },
                "moon_sign": moon_rashi,
                "sun_sign": sun_rashi,
                "nakshatra": nakshatra,
                
                # Chart data
                "planets": planets,
                "houses": houses,
                
                # Dasha
                "vimshottari_dasha": dashas,
                
                # Predictions based on Moon sign
                "general_traits": get_general_traits(moon_rashi["english"]),
                "compatibility": get_compatible_signs(moon_rashi["english"])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def get_general_traits(moon_sign: str) -> dict:
    """Get general personality traits based on Moon sign"""
    traits = {
        "Aries": {"positive": ["Courageous", "Energetic", "Confident"], "negative": ["Impatient", "Aggressive"], "element": "Fire"},
        "Taurus": {"positive": ["Patient", "Reliable", "Devoted"], "negative": ["Stubborn", "Possessive"], "element": "Earth"},
        "Gemini": {"positive": ["Versatile", "Curious", "Communicative"], "negative": ["Nervous", "Inconsistent"], "element": "Air"},
        "Cancer": {"positive": ["Caring", "Intuitive", "Protective"], "negative": ["Moody", "Oversensitive"], "element": "Water"},
        "Leo": {"positive": ["Creative", "Passionate", "Generous"], "negative": ["Arrogant", "Stubborn"], "element": "Fire"},
        "Virgo": {"positive": ["Analytical", "Hardworking", "Practical"], "negative": ["Overcritical", "Perfectionist"], "element": "Earth"},
        "Libra": {"positive": ["Diplomatic", "Fair", "Social"], "negative": ["Indecisive", "Avoids confrontation"], "element": "Air"},
        "Scorpio": {"positive": ["Resourceful", "Passionate", "Brave"], "negative": ["Jealous", "Secretive"], "element": "Water"},
        "Sagittarius": {"positive": ["Optimistic", "Honest", "Adventurous"], "negative": ["Careless", "Impatient"], "element": "Fire"},
        "Capricorn": {"positive": ["Responsible", "Disciplined", "Self-controlled"], "negative": ["Pessimistic", "Unforgiving"], "element": "Earth"},
        "Aquarius": {"positive": ["Progressive", "Original", "Independent"], "negative": ["Aloof", "Unpredictable"], "element": "Air"},
        "Pisces": {"positive": ["Compassionate", "Artistic", "Intuitive"], "negative": ["Fearful", "Escapist"], "element": "Water"}
    }
    return traits.get(moon_sign, traits["Aries"])


def get_compatible_signs(moon_sign: str) -> list:
    """Get compatible signs for marriage/relationship"""
    compatibility = {
        "Aries": ["Leo", "Sagittarius", "Aquarius", "Gemini"],
        "Taurus": ["Cancer", "Virgo", "Capricorn", "Pisces"],
        "Gemini": ["Libra", "Aquarius", "Aries", "Leo"],
        "Cancer": ["Scorpio", "Pisces", "Taurus", "Virgo"],
        "Leo": ["Aries", "Sagittarius", "Gemini", "Libra"],
        "Virgo": ["Taurus", "Capricorn", "Cancer", "Scorpio"],
        "Libra": ["Gemini", "Aquarius", "Leo", "Sagittarius"],
        "Scorpio": ["Cancer", "Pisces", "Virgo", "Capricorn"],
        "Sagittarius": ["Aries", "Leo", "Libra", "Aquarius"],
        "Capricorn": ["Taurus", "Virgo", "Scorpio", "Pisces"],
        "Aquarius": ["Gemini", "Libra", "Aries", "Sagittarius"],
        "Pisces": ["Cancer", "Scorpio", "Taurus", "Capricorn"]
    }
    return compatibility.get(moon_sign, ["Leo", "Sagittarius"])


@router.get("/cities")
async def get_cities():
    """Get list of available cities for birth place"""
    return {
        "cities": [
            {"name": key.title(), "name_te": key.title()} 
            for key in CITIES.keys()
        ]
    }


@router.get("/rashis")
async def get_rashis():
    """Get all Rashi (zodiac signs) information"""
    return {"rashis": RASHIS}


@router.get("/nakshatras")
async def get_nakshatras():
    """Get all Nakshatra (birth stars) information"""
    return {"nakshatras": NAKSHATRAS}
