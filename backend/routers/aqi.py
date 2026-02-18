"""AQI Router - Live air quality data from aqi.in"""
from fastapi import APIRouter
from datetime import datetime, timezone
import httpx
from bs4 import BeautifulSoup
import re
import logging

router = APIRouter(prefix="/aqi", tags=["Air Quality"])

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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = await client.get(url, headers=headers, timeout=30.0, follow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            page_text = soup.get_text()
            
            pm25_match = re.search(r'PM2\.5\s*[:\s]+(\d+)\s*µg/m³', page_text, re.IGNORECASE)
            pm25_value = int(pm25_match.group(1)) if pm25_match else None
            
            pm10_match = re.search(r'PM10\s*[:\s]+(\d+)\s*µg/m³', page_text, re.IGNORECASE)
            pm10_value = int(pm10_match.group(1)) if pm10_match else None
            
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

# ============== ROUTES ==============

@router.get("/dammaiguda")
async def get_dammaiguda_aqi():
    """Get AQI for Dammaiguda area"""
    url = "https://www.aqi.in/in/dashboard/india/telangana/secunderabad/vayushakti-nagar"
    data = await scrape_aqi_in(url)
    data["location"] = "Dammaiguda"
    data["location_te"] = "దమ్మాయిగూడ"
    return data

@router.get("/hyderabad")
async def get_hyderabad_aqi():
    """Get AQI for Hyderabad"""
    url = "https://www.aqi.in/in/dashboard/india/telangana/hyderabad"
    data = await scrape_aqi_in(url)
    data["location"] = "Hyderabad"
    data["location_te"] = "హైదరాబాద్"
    return data

@router.get("/both")
async def get_both_aqi():
    """Get AQI for both Dammaiguda and Hyderabad"""
    dammaiguda_url = "https://www.aqi.in/in/dashboard/india/telangana/secunderabad/vayushakti-nagar"
    hyderabad_url = "https://www.aqi.in/in/dashboard/india/telangana/hyderabad"
    
    dammaiguda_data = await scrape_aqi_in(dammaiguda_url)
    dammaiguda_data["location"] = "Dammaiguda"
    dammaiguda_data["location_te"] = "దమ్మాయిగూడ"
    
    hyderabad_data = await scrape_aqi_in(hyderabad_url)
    hyderabad_data["location"] = "Hyderabad"
    hyderabad_data["location_te"] = "హైదరాబాద్"
    
    return {
        "dammaiguda": dammaiguda_data,
        "hyderabad": hyderabad_data,
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/scrape/{location:path}")
async def scrape_location_aqi(location: str):
    """Scrape AQI for any location on aqi.in"""
    url = f"https://www.aqi.in/in/dashboard/india/{location}"
    return await scrape_aqi_in(url)
