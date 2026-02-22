"""Benefits Router - Accidental Insurance, Health Insurance, Education Vouchers"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from .utils import db, generate_id, now_iso, get_current_user
import random
import string

router = APIRouter(prefix="/benefits", tags=["Benefits"])

# ============== MODELS ==============

class FamilyMember(BaseModel):
    name: str
    gender: str  # Male, Female, Other
    relation: str  # Father's Name / Husband's Name
    relation_name: str
    dob: str  # YYYY-MM-DD
    aadhar_number: str
    voter_id: str
    whatsapp_number: str
    address: str
    occupation: str  # Student, Private Job, Housewife, Business, Self-employed
    monthly_earning: str  # Range

class AccidentalInsuranceApplication(BaseModel):
    primary_applicant: FamilyMember
    family_members: List[FamilyMember] = []  # Max 4 additional
    terms_accepted: bool = True

class HealthInsuranceApplication(BaseModel):
    name: str
    mobile_number: str
    family_count: int = Field(ge=1, le=10)
    terms_accepted: bool = True

class EducationVoucherApplication(BaseModel):
    name: str
    education: str  # 10th, 12th, Undergraduate, Graduate, Post Graduate
    occupation: str
    dob: str  # YYYY-MM-DD
    aadhar_number: str
    voter_id: Optional[str] = None  # Only if 18+
    address: str
    terms_accepted: bool = True

class ApplicationStatusUpdate(BaseModel):
    status: str  # approved, rejected
    notes: Optional[str] = None
    document_url: Optional[str] = None  # For insurance PDF/JPG

# ============== HELPER FUNCTIONS ==============

def generate_voucher_code():
    """Generate a unique voucher code like BOSE-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(random.choices(chars, k=4))
    part2 = ''.join(random.choices(chars, k=4))
    return f"BOSE-{part1}-{part2}"

def calculate_age(dob_str: str) -> int:
    """Calculate age from DOB string"""
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age
    except:
        return 0

# ============== ROUTES ==============

@router.post("/accidental-insurance")
async def apply_accidental_insurance(
    application: AccidentalInsuranceApplication,
    user: dict = Depends(get_current_user)
):
    """Apply for 2 Lakhs Accidental Insurance"""
    
    # Validate primary applicant age (min 18)
    age = calculate_age(application.primary_applicant.dob)
    if age < 18:
        raise HTTPException(status_code=400, detail="Primary applicant must be at least 18 years old")
    
    # Validate max family members (4 additional = 5 total)
    if len(application.family_members) > 4:
        raise HTTPException(status_code=400, detail="Maximum 5 people allowed (1 primary + 4 family members)")
    
    # Check for unique WhatsApp numbers
    all_numbers = [application.primary_applicant.whatsapp_number]
    for member in application.family_members:
        if member.whatsapp_number in all_numbers:
            raise HTTPException(status_code=400, detail="Each family member must have a unique WhatsApp number")
        all_numbers.append(member.whatsapp_number)
    
    # Validate family member ages
    for member in application.family_members:
        member_age = calculate_age(member.dob)
        if member_age < 18:
            raise HTTPException(status_code=400, detail=f"Family member {member.name} must be at least 18 years old")
    
    # Create application record
    app_record = {
        "id": generate_id(),
        "type": "accidental_insurance",
        "user_id": user["id"],
        "user_phone": user.get("phone", ""),
        "primary_applicant": application.primary_applicant.dict(),
        "family_members": [m.dict() for m in application.family_members],
        "total_members": 1 + len(application.family_members),
        "status": "pending",
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "terms_accepted": application.terms_accepted,
        "document_url": None,
        "approved_at": None,
        "approved_by": None,
        "notes": None
    }
    
    await db.benefit_applications.insert_one(app_record)
    app_record.pop("_id", None)
    
    return {
        "success": True,
        "message": "Your accidental insurance application has been submitted. You will receive your insurance documents within 7 days.",
        "application_id": app_record["id"],
        "application": app_record
    }

@router.post("/health-insurance")
async def apply_health_insurance(
    application: HealthInsuranceApplication,
    user: dict = Depends(get_current_user)
):
    """Apply for 25% Monthly Health Insurance Reimbursement"""
    
    # Create application record
    app_record = {
        "id": generate_id(),
        "type": "health_insurance",
        "user_id": user["id"],
        "user_phone": user.get("phone", ""),
        "name": application.name,
        "mobile_number": application.mobile_number,
        "family_count": application.family_count,
        "status": "pending",
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "terms_accepted": application.terms_accepted,
        "approved_at": None,
        "approved_by": None,
        "notes": None
    }
    
    await db.benefit_applications.insert_one(app_record)
    app_record.pop("_id", None)
    
    return {
        "success": True,
        "message": "Your health insurance reimbursement application has been submitted. Our team will contact you soon.",
        "application_id": app_record["id"],
        "application": app_record
    }

@router.post("/education-voucher")
async def apply_education_voucher(
    application: EducationVoucherApplication,
    user: dict = Depends(get_current_user)
):
    """Apply for Bose American Education Voucher (₹54,999)"""
    
    # Calculate age
    age = calculate_age(application.dob)
    
    # Voter ID required only if 18+
    if age >= 18 and not application.voter_id:
        raise HTTPException(status_code=400, detail="Voter ID is required for applicants 18 years and above")
    
    # Generate voucher code (auto-approved)
    voucher_code = generate_voucher_code()
    
    # Create application record
    app_record = {
        "id": generate_id(),
        "type": "education_voucher",
        "user_id": user["id"],
        "user_phone": user.get("phone", ""),
        "name": application.name,
        "education": application.education,
        "occupation": application.occupation,
        "dob": application.dob,
        "age": age,
        "aadhar_number": application.aadhar_number,
        "voter_id": application.voter_id if age >= 18 else None,
        "address": application.address,
        "voucher_code": voucher_code,
        "status": "approved",  # Auto-approved
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "terms_accepted": application.terms_accepted,
        "approved_at": now_iso(),
        "approved_by": "system",
        "notes": "Auto-approved"
    }
    
    await db.benefit_applications.insert_one(app_record)
    app_record.pop("_id", None)
    
    # Also store the voucher for course enrollment validation
    voucher_record = {
        "id": generate_id(),
        "code": voucher_code,
        "user_id": user["id"],
        "application_id": app_record["id"],
        "value": 54999,
        "status": "active",
        "courses_unlocked": ["digital_marketing"],  # Only Digital Marketing live initially
        "created_at": now_iso(),
        "redeemed_at": None
    }
    await db.education_vouchers.insert_one(voucher_record)
    
    return {
        "success": True,
        "message": "Your education voucher has been generated! Use this code to enroll in courses.",
        "voucher_code": voucher_code,
        "application_id": app_record["id"],
        "application": app_record
    }

@router.get("/my-applications")
async def get_my_applications(user: dict = Depends(get_current_user)):
    """Get current user's benefit applications"""
    
    applications = await db.benefit_applications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"applications": applications}

@router.get("/my-vouchers")
async def get_my_vouchers(user: dict = Depends(get_current_user)):
    """Get current user's education vouchers"""
    
    vouchers = await db.education_vouchers.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"vouchers": vouchers}

@router.post("/validate-voucher")
async def validate_voucher(code: str, user: dict = Depends(get_current_user)):
    """Validate a voucher code for course enrollment"""
    
    voucher = await db.education_vouchers.find_one(
        {"code": code.upper(), "status": "active"},
        {"_id": 0}
    )
    
    if not voucher:
        raise HTTPException(status_code=404, detail="Invalid or expired voucher code")
    
    return {
        "valid": True,
        "voucher": voucher,
        "courses_unlocked": voucher.get("courses_unlocked", [])
    }

# ============== ADMIN ROUTES ==============

@router.get("/admin/applications")
async def get_all_applications(
    status: Optional[str] = None,
    benefit_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all benefit applications (Admin only)"""
    
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if benefit_type:
        query["type"] = benefit_type
    
    applications = await db.benefit_applications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Get counts by type and status
    pipeline = [
        {"$group": {
            "_id": {"type": "$type", "status": "$status"},
            "count": {"$sum": 1}
        }}
    ]
    stats_cursor = db.benefit_applications.aggregate(pipeline)
    stats_list = await stats_cursor.to_list(100)
    
    stats = {
        "accidental_insurance": {"pending": 0, "approved": 0, "rejected": 0},
        "health_insurance": {"pending": 0, "approved": 0, "rejected": 0},
        "education_voucher": {"pending": 0, "approved": 0, "rejected": 0}
    }
    
    for item in stats_list:
        t = item["_id"]["type"]
        s = item["_id"]["status"]
        if t in stats and s in stats[t]:
            stats[t][s] = item["count"]
    
    return {
        "applications": applications,
        "stats": stats,
        "total": len(applications)
    }

@router.put("/admin/applications/{application_id}")
async def update_application_status(
    application_id: str,
    update: ApplicationStatusUpdate,
    user: dict = Depends(get_current_user)
):
    """Update application status (Admin only)"""
    
    if user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    application = await db.benefit_applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {
        "status": update.status,
        "updated_at": now_iso(),
        "approved_by": user["id"] if update.status == "approved" else None,
        "approved_at": now_iso() if update.status == "approved" else None,
        "notes": update.notes
    }
    
    if update.document_url:
        update_data["document_url"] = update.document_url
    
    await db.benefit_applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    # Send SMS notification if approved
    if update.status == "approved":
        # Get user phone from application
        user_phone = application.get("user_phone") or application.get("primary_applicant", {}).get("whatsapp_number")
        if user_phone:
            await send_benefits_sms(user_phone, application.get("type", "benefit"), "approved")
    elif update.status == "rejected":
        user_phone = application.get("user_phone") or application.get("primary_applicant", {}).get("whatsapp_number")
        if user_phone:
            await send_benefits_sms(user_phone, application.get("type", "benefit"), "rejected")
    
    updated = await db.benefit_applications.find_one({"id": application_id}, {"_id": 0})
    
    return {
        "success": True,
        "message": f"Application {update.status}",
        "application": updated
    }

@router.get("/stats")
async def get_benefits_stats():
    """Get public benefits statistics"""
    
    # Count approved applications
    accidental_count = await db.benefit_applications.count_documents({"type": "accidental_insurance", "status": "approved"})
    health_count = await db.benefit_applications.count_documents({"type": "health_insurance", "status": "approved"})
    education_count = await db.benefit_applications.count_documents({"type": "education_voucher", "status": "approved"})
    
    return {
        "accidental_insurance": accidental_count,
        "health_insurance": health_count,
        "education_voucher": education_count,
        "total_beneficiaries": accidental_count + health_count + education_count
    }
