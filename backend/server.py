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
from routers.vouchers import router as vouchers_router
from routers.templates import router as templates_router
from routers.content import router as content_router
from routers.websocket_chat import router as websocket_chat_router
from routers.google_fit import router as google_fit_router
from routers.astrology import router as astrology_router
from routers.upload import router as upload_router
from routers.analytics import router as analytics_router
from routers.user import router as user_router

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
app.include_router(vouchers_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(websocket_chat_router, prefix="/api")
app.include_router(google_fit_router, prefix="/api")
app.include_router(astrology_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(user_router, prefix="/api")

from fastapi.responses import HTMLResponse

# Certificate OpenGraph preview endpoint
@app.get("/certificate/{certificate_id}", response_class=HTMLResponse)
async def certificate_og_page(certificate_id: str):
    """Certificate page with OpenGraph meta tags for social sharing"""
    certificate = await db.certificates.find_one({"id": certificate_id}, {"_id": 0})
    
    if not certificate:
        return HTMLResponse(content="<html><body><h1>Certificate not found</h1></body></html>", status_code=404)
    
    user_name = certificate.get("user_name", "Student")
    course_title = certificate.get("course_title", "Course")
    cert_number = certificate.get("certificate_number", "")
    issued_at = certificate.get("issued_at", "")[:10] if certificate.get("issued_at") else ""
    
    # Generate a dynamic certificate image URL (or use a placeholder)
    og_image = "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=1200&h=630&fit=crop"
    
    frontend_url = "https://www.mydammaiguda.in"
    page_url = f"{frontend_url}/certificate/{certificate_id}"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{user_name} - {course_title} Certificate | My Dammaiguda</title>
        
        <!-- OpenGraph Meta Tags -->
        <meta property="og:title" content="{user_name} completed {course_title}!" />
        <meta property="og:description" content="Certificate of Completion from AIT Education Platform. Certificate No: {cert_number}" />
        <meta property="og:image" content="{og_image}" />
        <meta property="og:url" content="{page_url}" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="My Dammaiguda - AIT Education" />
        
        <!-- Twitter Card Meta Tags -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="{user_name} completed {course_title}!" />
        <meta name="twitter:description" content="Certificate of Completion from AIT Education Platform" />
        <meta name="twitter:image" content="{og_image}" />
        
        <!-- Redirect to frontend app -->
        <meta http-equiv="refresh" content="0; url={frontend_url}/education/certificate/{certificate_id}">
        
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #0D9488 0%, #1e293b 100%); color: white; }}
            .card {{ background: white; color: #333; padding: 40px; border-radius: 16px; max-width: 500px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }}
            h1 {{ color: #0D9488; margin-bottom: 10px; }}
            .cert-number {{ font-family: monospace; background: #f1f5f9; padding: 8px 16px; border-radius: 8px; display: inline-block; margin: 20px 0; }}
            .link {{ color: #0D9488; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Certificate of Completion</h1>
            <h2>{user_name}</h2>
            <p>has successfully completed</p>
            <h3>{course_title}</h3>
            <div class="cert-number">{cert_number}</div>
            <p>Issued: {issued_at}</p>
            <p><a href="{frontend_url}/education/certificate/{certificate_id}" class="link">View Full Certificate →</a></p>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)

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
        "pollution_zones": [
            {
                "zone": "red",
                "radius_km": 2,
                "risk": "high",
                "risk_te": "అధికం",
                "description": "Highly contaminated area. Avoid prolonged outdoor activities."
            },
            {
                "zone": "orange", 
                "radius_km": 5,
                "risk": "medium",
                "risk_te": "మధ్యస్థం",
                "description": "Moderate contamination. Limit outdoor activities during peak hours."
            },
            {
                "zone": "green",
                "radius_km": 10,
                "risk": "low",
                "risk_te": "తక్కువ",
                "description": "Lower risk zone. General precautions recommended."
            }
        ],
        "health_risks": {
            "respiratory": {
                "title": "Respiratory Issues",
                "title_te": "శ్వాసకోశ సమస్యలు",
                "description": "Airborne pollutants can cause asthma, bronchitis, and other respiratory conditions.",
                "description_te": "వాయు కాలుష్యాలు ఆస్తమా, బ్రాంకైటిస్ మరియు ఇతర శ్వాసకోశ సమస్యలకు కారణమవుతాయి."
            },
            "cadmium": {
                "title": "Cadmium Exposure",
                "title_te": "కాడ్మియం బహిర్గతం",
                "description": "Heavy metal contamination in groundwater can lead to kidney damage and bone disorders.",
                "description_te": "భూగర్భ జలాల్లో భారీ లోహ కలుషితం కిడ్నీ దెబ్బతినడం మరియు ఎముక సమస్యలకు దారితీస్తుంది."
            },
            "skin": {
                "title": "Skin Allergies",
                "title_te": "చర్మ అలర్జీలు",
                "description": "Contact with contaminated water or air can cause rashes and skin irritation.",
                "description_te": "కలుషిత నీరు లేదా గాలితో సంపర్కం దద్దుర్లు మరియు చర్మ చికాకుకు కారణమవుతుంది."
            },
            "eye": {
                "title": "Eye Irritation",
                "title_te": "కంటి చికాకు",
                "description": "Toxic fumes can cause chronic eye irritation and vision problems.",
                "description_te": "విషపూరిత పొగలు దీర్ఘకాలిక కంటి చికాకు మరియు దృష్టి సమస్యలకు కారణమవుతాయి."
            }
        },
        "affected_groups": [
            {
                "group": "children",
                "group_te": "పిల్లలు",
                "risk_level": "very_high",
                "advice": "Keep children indoors during peak pollution hours (10 AM - 4 PM). Use N95 masks outdoors.",
                "advice_te": "గరిష్ట కాలుష్య సమయాల్లో పిల్లలను ఇంట్లో ఉంచండి. బయట N95 మాస్కులు వాడండి."
            },
            {
                "group": "pregnant_women",
                "group_te": "గర్భిణీ స్త్రీలు",
                "risk_level": "very_high",
                "advice": "Avoid the area completely. Consult doctor regularly for prenatal checkups.",
                "advice_te": "ఈ ప్రాంతాన్ని పూర్తిగా నివారించండి. ప్రసవపూర్వ పరీక్షల కోసం క్రమం తప్పకుండా వైద్యుడిని సంప్రదించండి."
            },
            {
                "group": "elderly",
                "group_te": "వృద్ధులు",
                "risk_level": "high",
                "advice": "Limit outdoor activities. Keep windows closed. Use air purifiers indoors.",
                "advice_te": "బయటి కార్యకలాపాలను పరిమితం చేయండి. కిటికీలు మూసి ఉంచండి. ఇంట్లో ఎయిర్ ప్యూరిఫైయర్లు వాడండి."
            }
        ],
        "affected_areas": [
            "Dammaiguda", "Alwal", "Bolaram", "Yapral", "Lothkunta", "Rampally", "Nagaram"
        ],
        "remediation_status": "ongoing",
        "remediation_progress": 35,
        "next_steps": [
            {"en": "Bio-mining of old waste", "te": "పాత వ్యర్థాల బయో-మైనింగ్"},
            {"en": "Groundwater treatment plant", "te": "భూగర్భ జలాల శుద్ధి కేంద్రం"},
            {"en": "Buffer zone plantation", "te": "బఫర్ జోన్ మొక్కల పెంపకం"}
        ]
    }

@app.get("/api/dumpyard/info")
async def get_dumpyard_info_alias():
    """Alias for dump yard info (frontend compatibility)"""
    return await get_dumpyard_info()

@app.get("/api/dumpyard/updates")
async def get_dumpyard_updates():
    """Get dump yard news and updates"""
    updates = await db.dumpyard_updates.find({}, {"_id": 0}).sort("date", -1).limit(20).to_list(20)
    
    # If no updates exist, return sample data
    if not updates:
        updates = [
            {
                "id": "update-1",
                "title": "Bio-Mining Project Phase 1 Complete",
                "title_te": "బయో-మైనింగ్ ప్రాజెక్ట్ ఫేజ్ 1 పూర్తి",
                "content": "The first phase of the bio-mining project has been completed. 20% of old waste has been processed and cleared from the site.",
                "content_te": "బయో-మైనింగ్ ప్రాజెక్ట్ మొదటి దశ పూర్తయింది. 20% పాత వ్యర్థాలు ప్రాసెస్ చేయబడి సైట్ నుండి తొలగించబడ్డాయి.",
                "date": "2026-02-15T10:00:00Z",
                "category": "remediation"
            },
            {
                "id": "update-2",
                "title": "Free Health Camp This Sunday",
                "title_te": "ఈ ఆదివారం ఉచిత ఆరోగ్య క్యాంప్",
                "content": "Free health screening for residents of affected areas. Location: Dammaiguda Community Hall, 9 AM - 4 PM.",
                "content_te": "ప్రభావిత ప్రాంతాల నివాసులకు ఉచిత ఆరోగ్య పరీక్ష. స్థానం: దమ్మాయిగూడ కమ్యూనిటీ హాల్, ఉ. 9 - సా. 4.",
                "date": "2026-02-10T08:00:00Z",
                "category": "health"
            },
            {
                "id": "update-3",
                "title": "Air Quality Alert",
                "title_te": "వాయు నాణ్యత హెచ్చరిక",
                "content": "Due to recent fires, air quality has deteriorated. Residents advised to stay indoors and use masks.",
                "content_te": "ఇటీవలి మంటల కారణంగా వాయు నాణ్యత క్షీణించింది. నివాసులు ఇంట్లో ఉండాలని, మాస్కులు వాడాలని సలహా ఇవ్వబడింది.",
                "date": "2026-02-05T14:00:00Z",
                "category": "alert"
            },
            {
                "id": "update-4",
                "title": "Groundwater Testing Results",
                "title_te": "భూగర్భ జలాల పరీక్ష ఫలితాలు",
                "content": "Recent tests show cadmium levels in groundwater are above safe limits within 3km radius. RO water recommended.",
                "content_te": "ఇటీవలి పరీక్షలు 3 కి.మీ. వ్యాసార్థంలో భూగర్భ జలాల్లో కాడ్మియం స్థాయిలు సురక్షిత పరిమితులకు మించి ఉన్నాయని చూపిస్తున్నాయి. RO నీరు సిఫార్సు.",
                "date": "2026-01-28T09:00:00Z",
                "category": "health"
            }
        ]
    
    return updates

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


# ============== ADMIN ENDPOINTS ==============

@app.get("/api/admin/stats")
async def get_admin_stats():
    """Get admin dashboard statistics"""
    # Issues stats
    total_issues = await db.issues.count_documents({})
    pending_issues = await db.issues.count_documents({"status": {"$in": ["reported", "verified", "in_progress"]}})
    closed_issues = await db.issues.count_documents({"status": "closed"})
    
    # Get by category
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    by_category = {r["_id"]: r["count"] for r in await db.issues.aggregate(category_pipeline).to_list(20)}
    
    # Users stats
    total_users = await db.users.count_documents({})
    
    # Fitness stats
    fitness_participants = await db.fitness_profiles.count_documents({})
    
    # Benefits pending applications
    pending_benefits = 0  # Placeholder
    
    return {
        "issues": {
            "total": total_issues,
            "pending": pending_issues,
            "closed": closed_issues,
            "by_category": by_category
        },
        "users": {
            "total": total_users
        },
        "fitness": {
            "participants": fitness_participants
        },
        "benefits": {
            "pending": pending_benefits
        }
    }

@app.get("/api/admin/issues-heatmap")
async def get_issues_heatmap():
    """Get issues heatmap data by colony"""
    pipeline = [
        {"$match": {"reporter_colony": {"$ne": None}}},
        {"$group": {"_id": "$reporter_colony", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    
    heatmap = await db.issues.aggregate(pipeline).to_list(20)
    return heatmap

@app.get("/api/admin/users")
async def get_admin_users():
    """Get all users for admin"""
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return users


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
