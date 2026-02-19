"""
My Dammaiguda - Civic Engagement Platform
Main FastAPI Application with Modular Routers
"""
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from routers.auth import router as auth_router
from routers.aqi import router as aqi_router
from routers.family import router as family_router
from routers.sos import router as sos_router
from routers.news import router as news_router
from routers.fitness import router as fitness_router
from routers.doctor import router as doctor_router
from routers.chat import router as chat_router
from routers.wall import router as wall_router
from routers.issues import router as issues_router
from routers.notifications import router as notifications_router
from routers.stories import router as stories_router
from routers.education import router as education_router
from routers.shop import router as shop_router

# Create FastAPI app
app = FastAPI(
    title="My Dammaiguda API",
    description="Civic Engagement Platform for Dammaiguda Ward",
    version="2.6.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(aqi_router, prefix="/api")
app.include_router(family_router, prefix="/api")
app.include_router(sos_router, prefix="/api")
app.include_router(news_router, prefix="/api")
app.include_router(fitness_router, prefix="/api")
app.include_router(doctor_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(wall_router, prefix="/api")
app.include_router(issues_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(stories_router, prefix="/api")
app.include_router(education_router, prefix="/api")
app.include_router(shop_router, prefix="/api")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.6.0",
        "service": "My Dammaiguda API"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to My Dammaiguda API",
        "docs": "/docs",
        "version": "2.5.0"
    }

# Additional static endpoints for backwards compatibility
from routers.utils import db, now_iso

@app.get("/api/dump-yard/info")
async def get_dumpyard_info():
    """Get dump yard information"""
    return {
        "name": "Dammaiguda Dump Yard",
        "name_te": "దమ్మాయిగూడ డంప్ యార్డ్",
        "location": {"lat": 17.4875, "lng": 78.5625},
        "status": "active",
        "daily_waste_tons": 1200,
        "area_acres": 350,
        "health_risks": [
            {"en": "Respiratory Issues", "te": "శ్వాసకోశ సమస్యలు"},
            {"en": "Skin Allergies", "te": "చర్మ అలర్జీలు"},
            {"en": "Eye Irritation", "te": "కంటి చికాకు"},
            {"en": "Cadmium Exposure", "te": "కాడ్మియం బహిర్గతం"}
        ],
        "affected_areas": [
            "Dammaiguda", "Alwal", "Bolaram", "Yapral", "Lothkunta"
        ],
        "remediation_status": "ongoing"
    }

@app.get("/api/benefits")
async def get_benefits():
    """Get citizen benefits"""
    return [
        {
            "id": "health_checkup",
            "title": "Free Health Checkup",
            "title_te": "ఉచిత ఆరోగ్య పరీక్ష",
            "description": "Annual health checkup for residents",
            "eligibility": "All ward residents"
        },
        {
            "id": "education_voucher",
            "title": "Education Voucher",
            "title_te": "విద్య వౌచర్",
            "description": "₹50,000 education voucher with Emeritus",
            "eligibility": "Students aged 18-35"
        },
        {
            "id": "accident_insurance",
            "title": "Accident Insurance",
            "title_te": "ప్రమాద బీమా",
            "description": "Free accident insurance coverage",
            "eligibility": "Ward residents aged 18-60"
        },
        {
            "id": "health_insurance",
            "title": "Health Insurance Support",
            "title_te": "ఆరోగ్య బీమా సహాయం",
            "description": "25% cashback on health insurance",
            "eligibility": "All ward residents"
        }
    ]

@app.get("/api/expenditure")
async def get_expenditure():
    """Get ward expenditure data"""
    return {
        "year": 2024,
        "total_budget": 50000000,
        "spent": 35000000,
        "categories": [
            {"name": "Roads", "name_te": "రోడ్లు", "amount": 15000000, "spent": 12000000},
            {"name": "Drainage", "name_te": "డ్రైనేజీ", "amount": 10000000, "spent": 8000000},
            {"name": "Sanitation", "name_te": "పారిశుధ్యం", "amount": 8000000, "spent": 6000000},
            {"name": "Street Lights", "name_te": "వీధి దీపాలు", "amount": 5000000, "spent": 4000000},
            {"name": "Parks", "name_te": "పార్కులు", "amount": 7000000, "spent": 3000000},
            {"name": "Other", "name_te": "ఇతర", "amount": 5000000, "spent": 2000000}
        ]
    }

@app.get("/api/polls")
async def get_polls():
    """Get active polls"""
    polls = await db.polls.find({"is_active": True}, {"_id": 0}).to_list(20)
    return polls

@app.get("/api/colonies")
async def get_colonies():
    """Get list of colonies"""
    return [
        "Dammaiguda", "Alwal", "Bolaram", "Yapral", "Lothkunta",
        "Sainikpuri", "Malkajgiri", "Karkhana", "Trimulgherry",
        "Bowenpally", "Rampally", "Nagaram"
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
