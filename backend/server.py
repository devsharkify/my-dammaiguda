from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import random
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'dammaiguda-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer(auto_error=False)

app = FastAPI(title="My Dammaiguda API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserCreate(BaseModel):
    phone: str
    name: str
    colony: Optional[str] = None
    age_range: Optional[str] = None  # "18-25", "26-35", "36-45", "46-55", "56-65", "65+"

class UserResponse(BaseModel):
    id: str
    phone: str
    name: str
    colony: Optional[str] = None
    age_range: Optional[str] = None
    role: str = "citizen"  # citizen, volunteer, admin
    created_at: str
    language: str = "te"  # te=Telugu, en=English

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    colony: Optional[str] = None
    age_range: Optional[str] = None

class IssueCreate(BaseModel):
    category: str  # dump_yard, garbage, drainage, water, roads, lights, parks
    description: str
    location: Optional[Dict[str, float]] = None  # {lat, lng}
    address: Optional[str] = None
    media_urls: List[str] = []

class IssueResponse(BaseModel):
    id: str
    category: str
    description: str
    status: str  # reported, verified, escalated, closed
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

class PollCreate(BaseModel):
    question: str
    question_te: str  # Telugu version
    options: List[str]
    options_te: List[str]
    poll_type: str = "single"  # single, rating, yes_no
    end_date: Optional[str] = None

class PollResponse(BaseModel):
    id: str
    question: str
    question_te: str
    options: List[str]
    options_te: List[str]
    poll_type: str
    votes: Dict[str, int]
    total_votes: int
    created_at: str
    end_date: Optional[str] = None
    is_active: bool = True

class VoteRequest(BaseModel):
    option_index: int

class ExpenditureCreate(BaseModel):
    year: int
    category: str  # parks, sports, sanitation, roads, dump_yard
    amount: float
    description: str
    description_te: str
    rti_document_url: Optional[str] = None
    ground_reality_notes: Optional[str] = None

class ExpenditureResponse(BaseModel):
    id: str
    year: int
    category: str
    amount: float
    description: str
    description_te: str
    rti_document_url: Optional[str] = None
    ground_reality_notes: Optional[str] = None
    created_at: str

class BenefitApplication(BaseModel):
    benefit_type: str  # health_checkup, education_voucher, insurance, health_insurance
    applicant_name: str
    phone: str
    age: Optional[int] = None
    address: Optional[str] = None
    documents: List[str] = []

class BenefitResponse(BaseModel):
    id: str
    benefit_type: str
    applicant_name: str
    phone: str
    status: str  # pending, approved, rejected
    created_at: str
    notes: Optional[str] = None

class FitnessEntry(BaseModel):
    steps: int
    date: str  # YYYY-MM-DD

class FitnessResponse(BaseModel):
    id: str
    user_id: str
    steps: int
    date: str
    fitness_score: float
    created_at: str

class ChallengeCreate(BaseModel):
    name: str
    name_te: str
    description: str
    description_te: str
    target_steps: int
    start_date: str
    end_date: str

class ChallengeResponse(BaseModel):
    id: str
    name: str
    name_te: str
    description: str
    description_te: str
    target_steps: int
    start_date: str
    end_date: str
    participants: int
    is_active: bool

class CloudinarySignature(BaseModel):
    signature: str
    timestamp: int
    cloud_name: str
    api_key: str
    folder: str

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

# Store OTPs temporarily (in production, use Redis)
otp_store = {}

# ============== AUTH ROUTES ==============

@api_router.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP to phone number (MOCK - always 123456 for dev)"""
    phone = request.phone.strip()
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    # Generate OTP (mock: always 123456)
    otp = "123456"  # In production, use random.randint(100000, 999999)
    otp_store[phone] = {"otp": otp, "expires": datetime.now(timezone.utc) + timedelta(minutes=10)}
    
    # TODO: Integrate Twilio when keys are provided
    # For now, return success
    return {"success": True, "message": "OTP sent successfully", "dev_otp": otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: OTPVerify):
    """Verify OTP and login/register user"""
    phone = request.phone.strip()
    
    # Check OTP (mock: always accept 123456)
    stored = otp_store.get(phone)
    if not stored or stored["otp"] != request.otp:
        # For dev, accept 123456
        if request.otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if user exists
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    
    if user:
        # Existing user - login
        token = create_token(user["id"], user.get("role", "citizen"))
        return {"success": True, "token": token, "user": user, "is_new": False}
    else:
        # New user - register
        if not request.name:
            raise HTTPException(status_code=400, detail="Name is required for new users")
        
        new_user = {
            "id": generate_id(),
            "phone": phone,
            "name": request.name,
            "colony": request.colony,
            "age_range": request.age_range,
            "role": "citizen",
            "language": "te",
            "created_at": now_iso()
        }
        await db.users.insert_one(new_user)
        new_user.pop("_id", None)
        
        token = create_token(new_user["id"], "citizen")
        return {"success": True, "token": token, "user": new_user, "is_new": True}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return user

@api_router.put("/auth/profile")
async def update_profile(
    name: Optional[str] = None,
    colony: Optional[str] = None,
    age_range: Optional[str] = None,
    language: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Update user profile"""
    updates = {}
    if name: updates["name"] = name
    if colony: updates["colony"] = colony
    if age_range: updates["age_range"] = age_range
    if language and language in ["te", "en"]: updates["language"] = language
    
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return updated_user

# ============== ISSUE ROUTES ==============

@api_router.post("/issues", response_model=IssueResponse)
async def create_issue(issue: IssueCreate, user: dict = Depends(get_current_user)):
    """Create a new issue report"""
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
    """Get all issues with filters"""
    query = {}
    if category: query["category"] = category
    if status: query["status"] = status
    if colony: query["colony"] = colony
    
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return issues

@api_router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str):
    """Get single issue by ID"""
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@api_router.put("/issues/{issue_id}/verify")
async def verify_issue(issue_id: str, user: dict = Depends(get_current_user)):
    """Volunteer verifies an issue"""
    await require_role(user, ["volunteer", "admin"])
    
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    await db.issues.update_one(
        {"id": issue_id},
        {"$set": {
            "status": "verified",
            "verified_by": user["id"],
            "verified_at": now_iso(),
            "updated_at": now_iso()
        }}
    )
    return {"success": True, "message": "Issue verified"}

@api_router.put("/issues/{issue_id}/escalate")
async def escalate_issue(issue_id: str, user: dict = Depends(get_current_user)):
    """Admin escalates an issue"""
    await require_role(user, ["admin"])
    
    await db.issues.update_one(
        {"id": issue_id},
        {"$set": {"status": "escalated", "updated_at": now_iso()}}
    )
    return {"success": True, "message": "Issue escalated"}

@api_router.put("/issues/{issue_id}/close")
async def close_issue(issue_id: str, resolution_notes: str = "", user: dict = Depends(get_current_user)):
    """Admin closes an issue"""
    await require_role(user, ["admin"])
    
    await db.issues.update_one(
        {"id": issue_id},
        {"$set": {
            "status": "closed",
            "resolution_notes": resolution_notes,
            "updated_at": now_iso()
        }}
    )
    return {"success": True, "message": "Issue closed"}

# ============== POLLS ROUTES ==============

@api_router.post("/polls", response_model=PollResponse)
async def create_poll(poll: PollCreate, user: dict = Depends(get_current_user)):
    """Create a new poll (admin only)"""
    await require_role(user, ["admin"])
    
    votes = {str(i): 0 for i in range(len(poll.options))}
    new_poll = {
        "id": generate_id(),
        "question": poll.question,
        "question_te": poll.question_te,
        "options": poll.options,
        "options_te": poll.options_te,
        "poll_type": poll.poll_type,
        "votes": votes,
        "total_votes": 0,
        "voters": [],
        "created_at": now_iso(),
        "end_date": poll.end_date,
        "is_active": True
    }
    await db.polls.insert_one(new_poll)
    new_poll.pop("_id", None)
    del new_poll["voters"]
    return new_poll

@api_router.get("/polls", response_model=List[PollResponse])
async def get_polls(active_only: bool = True):
    """Get all polls"""
    query = {"is_active": True} if active_only else {}
    polls = await db.polls.find(query, {"_id": 0, "voters": 0}).sort("created_at", -1).to_list(50)
    return polls

@api_router.post("/polls/{poll_id}/vote")
async def vote_poll(poll_id: str, vote: VoteRequest, user: dict = Depends(get_current_user)):
    """Vote on a poll"""
    poll = await db.polls.find_one({"id": poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if not poll.get("is_active"):
        raise HTTPException(status_code=400, detail="Poll is closed")
    
    if user["id"] in poll.get("voters", []):
        raise HTTPException(status_code=400, detail="Already voted")
    
    if vote.option_index < 0 or vote.option_index >= len(poll["options"]):
        raise HTTPException(status_code=400, detail="Invalid option")
    
    await db.polls.update_one(
        {"id": poll_id},
        {
            "$inc": {f"votes.{vote.option_index}": 1, "total_votes": 1},
            "$push": {"voters": user["id"]}
        }
    )
    return {"success": True, "message": "Vote recorded"}

# ============== EXPENDITURE ROUTES ==============

@api_router.post("/expenditure", response_model=ExpenditureResponse)
async def create_expenditure(exp: ExpenditureCreate, user: dict = Depends(get_current_user)):
    """Add expenditure record (admin only)"""
    await require_role(user, ["admin"])
    
    new_exp = {
        "id": generate_id(),
        **exp.model_dump(),
        "created_at": now_iso()
    }
    await db.expenditure.insert_one(new_exp)
    new_exp.pop("_id", None)
    return new_exp

@api_router.get("/expenditure", response_model=List[ExpenditureResponse])
async def get_expenditure(year: Optional[int] = None, category: Optional[str] = None):
    """Get expenditure records"""
    query = {}
    if year: query["year"] = year
    if category: query["category"] = category
    
    records = await db.expenditure.find(query, {"_id": 0}).sort("year", -1).to_list(100)
    return records

@api_router.get("/expenditure/summary")
async def get_expenditure_summary():
    """Get expenditure summary by year and category"""
    pipeline = [
        {"$group": {
            "_id": {"year": "$year", "category": "$category"},
            "total": {"$sum": "$amount"}
        }},
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

# ============== BENEFITS ROUTES ==============

@api_router.post("/benefits/apply", response_model=BenefitResponse)
async def apply_benefit(app: BenefitApplication, user: dict = Depends(get_current_user)):
    """Apply for a citizen benefit"""
    valid_types = ["health_checkup", "education_voucher", "insurance", "health_insurance"]
    if app.benefit_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid benefit type")
    
    new_app = {
        "id": generate_id(),
        "user_id": user["id"],
        "benefit_type": app.benefit_type,
        "applicant_name": app.applicant_name,
        "phone": app.phone,
        "age": app.age,
        "address": app.address,
        "documents": app.documents,
        "status": "pending",
        "created_at": now_iso()
    }
    await db.benefits.insert_one(new_app)
    new_app.pop("_id", None)
    return new_app

@api_router.get("/benefits/my-applications", response_model=List[BenefitResponse])
async def get_my_benefits(user: dict = Depends(get_current_user)):
    """Get user's benefit applications"""
    apps = await db.benefits.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    return apps

@api_router.get("/benefits/all", response_model=List[BenefitResponse])
async def get_all_benefits(user: dict = Depends(get_current_user)):
    """Get all benefit applications (admin only)"""
    await require_role(user, ["admin"])
    apps = await db.benefits.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return apps

@api_router.put("/benefits/{app_id}/status")
async def update_benefit_status(
    app_id: str,
    status: str,
    notes: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Update benefit application status (admin only)"""
    await require_role(user, ["admin"])
    
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    updates = {"status": status}
    if notes: updates["notes"] = notes
    
    await db.benefits.update_one({"id": app_id}, {"$set": updates})
    return {"success": True}

# ============== FITNESS ROUTES (KAIZER FIT) ==============

@api_router.post("/fitness/log", response_model=FitnessResponse)
async def log_fitness(entry: FitnessEntry, user: dict = Depends(get_current_user)):
    """Log daily fitness entry"""
    # Calculate simple fitness score (0-100)
    fitness_score = min(100, (entry.steps / 10000) * 100)
    
    # Check if entry exists for this date
    existing = await db.fitness.find_one({
        "user_id": user["id"],
        "date": entry.date
    })
    
    if existing:
        await db.fitness.update_one(
            {"id": existing["id"]},
            {"$set": {"steps": entry.steps, "fitness_score": fitness_score}}
        )
        return {**existing, "steps": entry.steps, "fitness_score": fitness_score}
    
    new_entry = {
        "id": generate_id(),
        "user_id": user["id"],
        "steps": entry.steps,
        "date": entry.date,
        "fitness_score": fitness_score,
        "created_at": now_iso()
    }
    await db.fitness.insert_one(new_entry)
    new_entry.pop("_id", None)
    return new_entry

@api_router.get("/fitness/my-stats")
async def get_my_fitness(days: int = 7, user: dict = Depends(get_current_user)):
    """Get user's fitness stats"""
    entries = await db.fitness.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).limit(days).to_list(days)
    
    total_steps = sum(e.get("steps", 0) for e in entries)
    avg_steps = total_steps / len(entries) if entries else 0
    avg_score = sum(e.get("fitness_score", 0) for e in entries) / len(entries) if entries else 0
    
    return {
        "entries": entries,
        "total_steps": total_steps,
        "average_steps": round(avg_steps),
        "average_score": round(avg_score, 1),
        "days_logged": len(entries)
    }

@api_router.get("/fitness/leaderboard")
async def get_fitness_leaderboard(period: str = "week"):
    """Get ward-level fitness leaderboard (anonymized)"""
    # Get entries from last 7 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": "$user_id",
            "total_steps": {"$sum": "$steps"},
            "days_active": {"$sum": 1}
        }},
        {"$sort": {"total_steps": -1}},
        {"$limit": 10}
    ]
    
    results = await db.fitness.aggregate(pipeline).to_list(10)
    
    # Anonymize and add rank
    leaderboard = []
    for i, r in enumerate(results):
        user = await db.users.find_one({"id": r["_id"]}, {"name": 1, "colony": 1})
        name = user.get("name", "Citizen") if user else "Citizen"
        # Partially anonymize name
        anon_name = name[0] + "***" + name[-1] if len(name) > 2 else name[0] + "***"
        leaderboard.append({
            "rank": i + 1,
            "name": anon_name,
            "colony": user.get("colony") if user else None,
            "total_steps": r["total_steps"],
            "days_active": r["days_active"]
        })
    
    return leaderboard

@api_router.get("/fitness/ward-stats")
async def get_ward_fitness_stats():
    """Get anonymized ward-level fitness statistics"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": None,
            "total_participants": {"$addToSet": "$user_id"},
            "total_steps": {"$sum": "$steps"},
            "total_entries": {"$sum": 1}
        }}
    ]
    
    results = await db.fitness.aggregate(pipeline).to_list(1)
    
    if results:
        r = results[0]
        return {
            "participants": len(r["total_participants"]),
            "total_steps": r["total_steps"],
            "average_steps_per_person": round(r["total_steps"] / len(r["total_participants"])) if r["total_participants"] else 0
        }
    
    return {"participants": 0, "total_steps": 0, "average_steps_per_person": 0}

# ============== CHALLENGES ROUTES ==============

@api_router.post("/challenges", response_model=ChallengeResponse)
async def create_challenge(challenge: ChallengeCreate, user: dict = Depends(get_current_user)):
    """Create a fitness challenge (admin only)"""
    await require_role(user, ["admin"])
    
    new_challenge = {
        "id": generate_id(),
        **challenge.model_dump(),
        "participant_ids": [],
        "participants": 0,
        "is_active": True,
        "created_at": now_iso()
    }
    await db.challenges.insert_one(new_challenge)
    new_challenge.pop("_id", None)
    del new_challenge["participant_ids"]
    return new_challenge

@api_router.get("/challenges", response_model=List[ChallengeResponse])
async def get_challenges(active_only: bool = True):
    """Get all challenges"""
    query = {"is_active": True} if active_only else {}
    challenges = await db.challenges.find(query, {"_id": 0, "participant_ids": 0}).to_list(20)
    return challenges

@api_router.post("/challenges/{challenge_id}/join")
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
    return {"success": True, "message": "Joined challenge"}

# ============== DUMP YARD MODULE ==============

@api_router.get("/dumpyard/info")
async def get_dumpyard_info():
    """Get Dammaiguda dump yard information"""
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
            "cadmium": {
                "title": "Cadmium Exposure",
                "title_te": "కాడ్మియం బహిర్గతం",
                "description": "Heavy metal that can cause kidney damage and bone issues",
                "description_te": "మూత్రపిండాల నష్టం మరియు ఎముక సమస్యలకు కారణమయ్యే భారీ లోహం"
            },
            "air_quality": {
                "title": "Air Pollution",
                "title_te": "వాయు కాలుష్యం",
                "description": "Methane and other harmful gases from decomposition",
                "description_te": "కుళ్ళిపోవడం వల్ల మీథేన్ మరియు ఇతర హానికరమైన వాయువులు"
            }
        },
        "affected_groups": [
            {
                "group": "children",
                "group_te": "పిల్లలు",
                "risk_level": "very_high",
                "advice": "Keep children indoors during high pollution days",
                "advice_te": "అధిక కాలుష్య రోజుల్లో పిల్లలను ఇంట్లోనే ఉంచండి"
            },
            {
                "group": "pregnant_women",
                "group_te": "గర్భిణీ స్త్రీలు",
                "risk_level": "very_high",
                "advice": "Avoid outdoor activities near dump yard",
                "advice_te": "డంప్ యార్డ్ దగ్గర బయటి కార్యకలాపాలను నివారించండి"
            },
            {
                "group": "elderly",
                "group_te": "వృద్ధులు",
                "risk_level": "high",
                "advice": "Use masks when outdoors, stay hydrated",
                "advice_te": "బయట ఉన్నప్పుడు మాస్కులు వాడండి, నీటిని తాగండి"
            }
        ]
    }

@api_router.get("/dumpyard/updates")
async def get_dumpyard_updates():
    """Get dump yard timeline updates"""
    updates = await db.dumpyard_updates.find({}, {"_id": 0}).sort("date", -1).limit(20).to_list(20)
    return updates

@api_router.post("/dumpyard/updates")
async def add_dumpyard_update(
    title: str,
    title_te: str,
    content: str,
    content_te: str,
    media_urls: List[str] = [],
    user: dict = Depends(get_current_user)
):
    """Add dump yard update (admin only)"""
    await require_role(user, ["admin"])
    
    update = {
        "id": generate_id(),
        "title": title,
        "title_te": title_te,
        "content": content,
        "content_te": content_te,
        "media_urls": media_urls,
        "date": now_iso(),
        "created_by": user["id"]
    }
    await db.dumpyard_updates.insert_one(update)
    update.pop("_id", None)
    return update

# ============== VOLUNTEER ROUTES ==============

@api_router.get("/volunteer/queue")
async def get_verification_queue(user: dict = Depends(get_current_user)):
    """Get issues pending verification"""
    await require_role(user, ["volunteer", "admin"])
    
    issues = await db.issues.find(
        {"status": "reported"},
        {"_id": 0}
    ).sort("created_at", 1).limit(20).to_list(20)
    return issues

@api_router.get("/volunteer/my-verifications")
async def get_my_verifications(user: dict = Depends(get_current_user)):
    """Get issues verified by current volunteer"""
    await require_role(user, ["volunteer", "admin"])
    
    issues = await db.issues.find(
        {"verified_by": user["id"]},
        {"_id": 0}
    ).sort("verified_at", -1).limit(50).to_list(50)
    return issues

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    """Get admin dashboard statistics"""
    await require_role(user, ["admin"])
    
    # Issue stats
    total_issues = await db.issues.count_documents({})
    pending_issues = await db.issues.count_documents({"status": "reported"})
    verified_issues = await db.issues.count_documents({"status": "verified"})
    closed_issues = await db.issues.count_documents({"status": "closed"})
    
    # Issue by category
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.issues.aggregate(category_pipeline).to_list(10)
    
    # User stats
    total_users = await db.users.count_documents({})
    volunteers = await db.users.count_documents({"role": "volunteer"})
    
    # Benefit stats
    pending_benefits = await db.benefits.count_documents({"status": "pending"})
    approved_benefits = await db.benefits.count_documents({"status": "approved"})
    
    # Fitness stats
    fitness_participants = len(await db.fitness.distinct("user_id"))
    
    return {
        "issues": {
            "total": total_issues,
            "pending": pending_issues,
            "verified": verified_issues,
            "closed": closed_issues,
            "by_category": {c["_id"]: c["count"] for c in categories}
        },
        "users": {
            "total": total_users,
            "volunteers": volunteers
        },
        "benefits": {
            "pending": pending_benefits,
            "approved": approved_benefits
        },
        "fitness": {
            "participants": fitness_participants
        }
    }

@api_router.get("/admin/issues-heatmap")
async def get_issues_heatmap(user: dict = Depends(get_current_user)):
    """Get issues grouped by colony for heatmap"""
    await require_role(user, ["admin"])
    
    pipeline = [
        {"$match": {"colony": {"$ne": None}}},
        {"$group": {
            "_id": "$colony",
            "count": {"$sum": 1},
            "categories": {"$push": "$category"}
        }},
        {"$sort": {"count": -1}}
    ]
    results = await db.issues.aggregate(pipeline).to_list(50)
    return results

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, user: dict = Depends(get_current_user)):
    """Update user role (admin only)"""
    await require_role(user, ["admin"])
    
    if role not in ["citizen", "volunteer", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True}

@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    await require_role(user, ["admin"])
    
    users = await db.users.find({}, {"_id": 0}).to_list(500)
    return users

# ============== MEDIA/UPLOAD ROUTES ==============

@api_router.get("/upload/signature")
async def get_upload_signature(
    resource_type: str = Query(default="image", enum=["image", "video"]),
    folder: str = "issues",
    user: dict = Depends(get_current_user)
):
    """Get Cloudinary upload signature (MOCK - returns placeholder when keys not configured)"""
    import time
    
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    
    if not all([cloud_name, api_key, api_secret]):
        # Return mock response for development
        return {
            "mock": True,
            "message": "Cloudinary not configured - using mock upload",
            "upload_url": "/api/upload/mock"
        }
    
    timestamp = int(time.time())
    
    # Generate signature
    import hashlib
    params = f"folder={folder}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(params.encode()).hexdigest()
    
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
    """Mock file upload for development"""
    # Generate a fake URL
    file_id = generate_id()
    fake_url = f"https://placeholder.dammaiguda.app/uploads/{file_id}/{file.filename}"
    
    return {
        "success": True,
        "url": fake_url,
        "public_id": file_id,
        "mock": True
    }

# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "My Dammaiguda API"}

@api_router.get("/")
async def root():
    return {"message": "My Dammaiguda API - Civic Engagement Platform"}

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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
