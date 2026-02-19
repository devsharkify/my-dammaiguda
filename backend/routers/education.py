"""AIT Education Router - Comprehensive EdTech platform"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from .utils import db, generate_id, now_iso, get_current_user
import logging

router = APIRouter(prefix="/education", tags=["AIT Education"])

# ============== MODELS ==============

class CourseCreate(BaseModel):
    title: str
    title_te: Optional[str] = None
    description: str
    description_te: Optional[str] = None
    category: str  # k12, college, professional, skill
    subcategory: Optional[str] = None
    thumbnail_url: Optional[str] = None
    instructor_id: Optional[str] = None
    instructor_name: Optional[str] = None
    price: float = 0  # 0 = free
    duration_hours: Optional[float] = None
    difficulty: str = "beginner"  # beginner, intermediate, advanced
    tags: List[str] = []
    is_featured: bool = False
    is_live: bool = False  # For live classes

class LessonCreate(BaseModel):
    course_id: str
    title: str
    title_te: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    content_html: Optional[str] = None
    duration_minutes: int = 0
    order_index: int
    is_free_preview: bool = False

class QuizCreate(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    title: str
    title_te: Optional[str] = None
    questions: List[dict]  # [{question, options, correct_answer, explanation}]
    passing_score: int = 70
    time_limit_minutes: Optional[int] = None

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[dict]  # [{question_id, selected_option}]

class LiveClassCreate(BaseModel):
    title: str
    title_te: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[str] = None
    instructor_id: str
    scheduled_at: str
    duration_minutes: int = 60
    meeting_url: Optional[str] = None
    max_participants: int = 100

class EnrollmentRequest(BaseModel):
    course_id: str

class ProgressUpdate(BaseModel):
    course_id: str
    lesson_id: str
    completed: bool = True
    watch_time_seconds: int = 0

# ============== HELPER FUNCTIONS ==============

def calculate_course_progress(enrollments: list, lessons: list) -> dict:
    """Calculate overall course progress"""
    if not lessons:
        return {"completed": 0, "total": 0, "percentage": 0}
    
    completed = len([l for l in lessons if any(
        e.get("lesson_id") == l.get("id") and e.get("completed") 
        for e in enrollments
    )])
    
    return {
        "completed": completed,
        "total": len(lessons),
        "percentage": round((completed / len(lessons)) * 100)
    }

# ============== COURSE ROUTES ==============

@router.get("/courses")
async def get_courses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: bool = False,
    limit: int = 20,
    skip: int = 0
):
    """Get all courses with optional filtering"""
    query = {"is_published": True}
    
    if category:
        query["category"] = category
    if featured:
        query["is_featured"] = True
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search]}}
        ]
    
    courses = await db.courses.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.courses.count_documents(query)
    
    # Get enrollment counts
    for course in courses:
        enrollment_count = await db.enrollments.count_documents({"course_id": course["id"]})
        course["enrollment_count"] = enrollment_count
    
    return {"courses": courses, "total": total}

@router.get("/courses/categories")
async def get_categories():
    """Get all course categories"""
    return {
        "categories": [
            {"id": "k12", "name": "School (K-12)", "name_te": "పాఠశాల (K-12)", "icon": "school"},
            {"id": "college", "name": "College", "name_te": "కాలేజీ", "icon": "graduation-cap"},
            {"id": "professional", "name": "Professional", "name_te": "వృత్తిపరమైన", "icon": "briefcase"},
            {"id": "skill", "name": "Skill Development", "name_te": "నైపుణ్య అభివృద్ధి", "icon": "tool"},
            {"id": "language", "name": "Languages", "name_te": "భాషలు", "icon": "languages"},
            {"id": "tech", "name": "Technology", "name_te": "సాంకేతికత", "icon": "laptop"}
        ]
    }

@router.get("/courses/{course_id}")
async def get_course(course_id: str, user: dict = Depends(get_current_user)):
    """Get course details with lessons"""
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get lessons
    lessons = await db.lessons.find(
        {"course_id": course_id}, 
        {"_id": 0}
    ).sort("order_index", 1).to_list(100)
    
    # Check enrollment
    enrollment = await db.enrollments.find_one({
        "course_id": course_id,
        "user_id": user["id"]
    }, {"_id": 0})
    
    # Get progress if enrolled
    progress = None
    if enrollment:
        progress_records = await db.lesson_progress.find({
            "course_id": course_id,
            "user_id": user["id"]
        }, {"_id": 0}).to_list(100)
        progress = calculate_course_progress(progress_records, lessons)
    
    # Get quizzes
    quizzes = await db.quizzes.find(
        {"course_id": course_id},
        {"_id": 0, "questions": 0}  # Don't send questions in listing
    ).to_list(20)
    
    return {
        "course": course,
        "lessons": lessons,
        "quizzes": quizzes,
        "is_enrolled": enrollment is not None,
        "enrollment": enrollment,
        "progress": progress
    }

@router.post("/courses")
async def create_course(course_data: CourseCreate, user: dict = Depends(get_current_user)):
    """Create a new course (admin/instructor only)"""
    if user.get("role") not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Only admins and instructors can create courses")
    
    new_course = {
        "id": generate_id(),
        **course_data.dict(),
        "instructor_id": course_data.instructor_id or user["id"],
        "instructor_name": course_data.instructor_name or user.get("name", "Instructor"),
        "is_published": False,
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    await db.courses.insert_one(new_course)
    new_course.pop("_id", None)
    
    return {"success": True, "course": new_course}

@router.put("/courses/{course_id}/publish")
async def publish_course(course_id: str, user: dict = Depends(get_current_user)):
    """Publish a course"""
    if user.get("role") not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    result = await db.courses.update_one(
        {"id": course_id},
        {"$set": {"is_published": True, "published_at": now_iso()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return {"success": True, "message": "Course published"}

# ============== LESSON ROUTES ==============

@router.post("/lessons")
async def create_lesson(lesson_data: LessonCreate, user: dict = Depends(get_current_user)):
    """Create a new lesson"""
    if user.get("role") not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    new_lesson = {
        "id": generate_id(),
        **lesson_data.dict(),
        "created_at": now_iso()
    }
    
    await db.lessons.insert_one(new_lesson)
    new_lesson.pop("_id", None)
    
    return {"success": True, "lesson": new_lesson}

@router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str, user: dict = Depends(get_current_user)):
    """Get lesson content"""
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check if user is enrolled or lesson is free preview
    if not lesson.get("is_free_preview"):
        enrollment = await db.enrollments.find_one({
            "course_id": lesson["course_id"],
            "user_id": user["id"]
        })
        if not enrollment and user.get("role") not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Please enroll in the course to access this lesson")
    
    return lesson

@router.post("/lessons/{lesson_id}/progress")
async def update_lesson_progress(lesson_id: str, progress: ProgressUpdate, user: dict = Depends(get_current_user)):
    """Update lesson progress"""
    existing = await db.lesson_progress.find_one({
        "lesson_id": lesson_id,
        "user_id": user["id"]
    })
    
    if existing:
        await db.lesson_progress.update_one(
            {"id": existing["id"]},
            {"$set": {
                "completed": progress.completed,
                "watch_time_seconds": existing.get("watch_time_seconds", 0) + progress.watch_time_seconds,
                "updated_at": now_iso()
            }}
        )
    else:
        new_progress = {
            "id": generate_id(),
            "user_id": user["id"],
            "course_id": progress.course_id,
            "lesson_id": lesson_id,
            "completed": progress.completed,
            "watch_time_seconds": progress.watch_time_seconds,
            "created_at": now_iso()
        }
        await db.lesson_progress.insert_one(new_progress)
    
    # Check if course is completed
    course_lessons = await db.lessons.find({"course_id": progress.course_id}).to_list(100)
    completed_lessons = await db.lesson_progress.count_documents({
        "course_id": progress.course_id,
        "user_id": user["id"],
        "completed": True
    })
    
    if completed_lessons >= len(course_lessons):
        # Award completion badge/certificate
        await db.enrollments.update_one(
            {"course_id": progress.course_id, "user_id": user["id"]},
            {"$set": {"completed_at": now_iso(), "status": "completed"}}
        )
    
    return {"success": True, "message": "Progress updated"}

# ============== ENROLLMENT ROUTES ==============

@router.post("/enroll")
async def enroll_course(enrollment: EnrollmentRequest, user: dict = Depends(get_current_user)):
    """Enroll in a course"""
    course = await db.courses.find_one({"id": enrollment.course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    existing = await db.enrollments.find_one({
        "course_id": enrollment.course_id,
        "user_id": user["id"]
    })
    
    if existing:
        return {"success": True, "message": "Already enrolled", "enrollment": existing}
    
    new_enrollment = {
        "id": generate_id(),
        "user_id": user["id"],
        "course_id": enrollment.course_id,
        "enrolled_at": now_iso(),
        "status": "active",
        "completed_at": None
    }
    
    await db.enrollments.insert_one(new_enrollment)
    new_enrollment.pop("_id", None)
    
    return {"success": True, "message": "Enrolled successfully", "enrollment": new_enrollment}

@router.get("/my-courses")
async def get_my_courses(user: dict = Depends(get_current_user)):
    """Get user's enrolled courses with progress"""
    enrollments = await db.enrollments.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    courses = []
    for enrollment in enrollments:
        course = await db.courses.find_one(
            {"id": enrollment["course_id"]},
            {"_id": 0}
        )
        if course:
            # Get progress
            lessons = await db.lessons.find({"course_id": course["id"]}).to_list(100)
            progress_records = await db.lesson_progress.find({
                "course_id": course["id"],
                "user_id": user["id"]
            }).to_list(100)
            
            course["enrollment"] = enrollment
            course["progress"] = calculate_course_progress(progress_records, lessons)
            courses.append(course)
    
    return {"courses": courses}

# ============== QUIZ ROUTES ==============

@router.post("/quizzes")
async def create_quiz(quiz_data: QuizCreate, user: dict = Depends(get_current_user)):
    """Create a quiz"""
    if user.get("role") not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    new_quiz = {
        "id": generate_id(),
        **quiz_data.dict(),
        "created_at": now_iso()
    }
    
    await db.quizzes.insert_one(new_quiz)
    new_quiz.pop("_id", None)
    
    return {"success": True, "quiz": new_quiz}

@router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, user: dict = Depends(get_current_user)):
    """Get quiz questions"""
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check enrollment
    if quiz.get("course_id"):
        enrollment = await db.enrollments.find_one({
            "course_id": quiz["course_id"],
            "user_id": user["id"]
        })
        if not enrollment and user.get("role") not in ["admin", "instructor"]:
            raise HTTPException(status_code=403, detail="Please enroll in the course")
    
    # Get previous attempts
    attempts = await db.quiz_attempts.find({
        "quiz_id": quiz_id,
        "user_id": user["id"]
    }, {"_id": 0}).sort("attempted_at", -1).to_list(10)
    
    # Don't send correct answers to client
    questions_for_client = []
    for q in quiz.get("questions", []):
        questions_for_client.append({
            "id": q.get("id", generate_id()),
            "question": q.get("question"),
            "question_te": q.get("question_te"),
            "options": q.get("options"),
            "type": q.get("type", "multiple_choice")
        })
    
    quiz["questions"] = questions_for_client
    quiz["attempts"] = attempts
    
    return quiz

@router.post("/quizzes/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, submission: QuizSubmission, user: dict = Depends(get_current_user)):
    """Submit quiz answers and get results"""
    quiz = await db.quizzes.find_one({"id": quiz_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Grade the quiz
    questions = quiz.get("questions", [])
    correct = 0
    results = []
    
    for q in questions:
        q_id = q.get("id")
        user_answer = next(
            (a.get("selected_option") for a in submission.answers if a.get("question_id") == q_id),
            None
        )
        is_correct = user_answer == q.get("correct_answer")
        if is_correct:
            correct += 1
        
        results.append({
            "question_id": q_id,
            "user_answer": user_answer,
            "correct_answer": q.get("correct_answer"),
            "is_correct": is_correct,
            "explanation": q.get("explanation")
        })
    
    score = round((correct / len(questions)) * 100) if questions else 0
    passed = score >= quiz.get("passing_score", 70)
    
    # Save attempt
    attempt = {
        "id": generate_id(),
        "quiz_id": quiz_id,
        "user_id": user["id"],
        "score": score,
        "correct_count": correct,
        "total_questions": len(questions),
        "passed": passed,
        "answers": submission.answers,
        "attempted_at": now_iso()
    }
    
    await db.quiz_attempts.insert_one(attempt)
    
    # Award badge if first time passing
    if passed:
        existing_pass = await db.quiz_attempts.find_one({
            "quiz_id": quiz_id,
            "user_id": user["id"],
            "passed": True,
            "id": {"$ne": attempt["id"]}
        })
        
        if not existing_pass:
            # First time passing - could award XP or badge here
            pass
    
    return {
        "success": True,
        "score": score,
        "correct": correct,
        "total": len(questions),
        "passed": passed,
        "passing_score": quiz.get("passing_score", 70),
        "results": results
    }

# ============== LIVE CLASS ROUTES ==============

@router.get("/live-classes")
async def get_live_classes(upcoming: bool = True):
    """Get live classes"""
    now = datetime.now(timezone.utc)
    
    if upcoming:
        query = {"scheduled_at": {"$gte": now.isoformat()}}
    else:
        query = {"scheduled_at": {"$lt": now.isoformat()}}
    
    classes = await db.live_classes.find(query, {"_id": 0}).sort("scheduled_at", 1).to_list(20)
    return {"live_classes": classes}

@router.post("/live-classes")
async def create_live_class(class_data: LiveClassCreate, user: dict = Depends(get_current_user)):
    """Create a live class"""
    if user.get("role") not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    new_class = {
        "id": generate_id(),
        **class_data.dict(),
        "created_by": user["id"],
        "created_at": now_iso(),
        "registrations": []
    }
    
    await db.live_classes.insert_one(new_class)
    new_class.pop("_id", None)
    
    return {"success": True, "live_class": new_class}

@router.post("/live-classes/{class_id}/register")
async def register_live_class(class_id: str, user: dict = Depends(get_current_user)):
    """Register for a live class"""
    live_class = await db.live_classes.find_one({"id": class_id})
    if not live_class:
        raise HTTPException(status_code=404, detail="Live class not found")
    
    if user["id"] in live_class.get("registrations", []):
        return {"success": True, "message": "Already registered"}
    
    await db.live_classes.update_one(
        {"id": class_id},
        {"$push": {"registrations": user["id"]}}
    )
    
    return {"success": True, "message": "Registered successfully"}

# ============== CERTIFICATE ROUTES ==============

@router.get("/certificates")
async def get_certificates(user: dict = Depends(get_current_user)):
    """Get user's certificates"""
    certificates = await db.certificates.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(50)
    
    return {"certificates": certificates}

@router.get("/certificates/{certificate_id}")
async def get_certificate(certificate_id: str):
    """Get certificate details (public)"""
    certificate = await db.certificates.find_one({"id": certificate_id}, {"_id": 0})
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return certificate

@router.post("/certificates/generate/{course_id}")
async def generate_certificate(course_id: str, user: dict = Depends(get_current_user)):
    """Generate certificate for completed course"""
    # Check if course is completed
    enrollment = await db.enrollments.find_one({
        "course_id": course_id,
        "user_id": user["id"],
        "status": "completed"
    })
    
    if not enrollment:
        raise HTTPException(status_code=400, detail="Course not completed")
    
    # Check if certificate already exists
    existing = await db.certificates.find_one({
        "course_id": course_id,
        "user_id": user["id"]
    })
    
    if existing:
        return {"success": True, "certificate": existing, "message": "Certificate already exists"}
    
    # Get course details
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    
    certificate = {
        "id": generate_id(),
        "user_id": user["id"],
        "user_name": user.get("name", "Student"),
        "course_id": course_id,
        "course_title": course.get("title", "Course"),
        "instructor_name": course.get("instructor_name", "Instructor"),
        "issued_at": now_iso(),
        "certificate_number": f"AIT-{generate_id()[:8].upper()}"
    }
    
    await db.certificates.insert_one(certificate)
    certificate.pop("_id", None)
    
    return {"success": True, "certificate": certificate}

# ============== GAMIFICATION ROUTES ==============

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 20):
    """Get learning leaderboard"""
    # Aggregate user stats
    pipeline = [
        {"$group": {
            "_id": "$user_id",
            "courses_completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
            "total_courses": {"$sum": 1}
        }},
        {"$sort": {"courses_completed": -1}},
        {"$limit": limit}
    ]
    
    stats = await db.enrollments.aggregate(pipeline).to_list(limit)
    
    # Get user details
    leaderboard = []
    for i, stat in enumerate(stats):
        user = await db.users.find_one({"id": stat["_id"]}, {"_id": 0, "name": 1, "id": 1})
        if user:
            leaderboard.append({
                "rank": i + 1,
                "user_id": user["id"],
                "user_name": user.get("name", "Student"),
                "courses_completed": stat["courses_completed"],
                "total_courses": stat["total_courses"]
            })
    
    return {"leaderboard": leaderboard}

@router.get("/my-stats")
async def get_my_stats(user: dict = Depends(get_current_user)):
    """Get user's learning statistics"""
    enrollments = await db.enrollments.find({"user_id": user["id"]}).to_list(100)
    quiz_attempts = await db.quiz_attempts.find({"user_id": user["id"]}).to_list(100)
    certificates = await db.certificates.count_documents({"user_id": user["id"]})
    
    total_watch_time = 0
    progress_records = await db.lesson_progress.find({"user_id": user["id"]}).to_list(500)
    for p in progress_records:
        total_watch_time += p.get("watch_time_seconds", 0)
    
    completed_courses = len([e for e in enrollments if e.get("status") == "completed"])
    avg_quiz_score = sum(a.get("score", 0) for a in quiz_attempts) / len(quiz_attempts) if quiz_attempts else 0
    
    return {
        "total_courses_enrolled": len(enrollments),
        "courses_completed": completed_courses,
        "courses_in_progress": len(enrollments) - completed_courses,
        "certificates_earned": certificates,
        "total_watch_time_hours": round(total_watch_time / 3600, 1),
        "quizzes_taken": len(quiz_attempts),
        "average_quiz_score": round(avg_quiz_score, 1),
        "current_streak": 0,  # TODO: Implement streak tracking
        "total_xp": completed_courses * 100 + len(quiz_attempts) * 10
    }

# ============== SEED DATA ==============

@router.post("/seed")
async def seed_education_data(user: dict = Depends(get_current_user)):
    """Seed sample education data (admin only)"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Sample courses
    sample_courses = [
        {
            "id": generate_id(),
            "title": "Python Programming Basics",
            "title_te": "పైథాన్ ప్రోగ్రామింగ్ బేసిక్స్",
            "description": "Learn Python from scratch with hands-on projects",
            "description_te": "హ్యాండ్స్-ఆన్ ప్రాజెక్ట్‌లతో పైథాన్ నేర్చుకోండి",
            "category": "tech",
            "subcategory": "programming",
            "thumbnail_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400",
            "instructor_name": "Dr. Ravi Kumar",
            "price": 0,
            "duration_hours": 20,
            "difficulty": "beginner",
            "tags": ["python", "programming", "coding"],
            "is_featured": True,
            "is_published": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "title": "Spoken English Course",
            "title_te": "స్పోకెన్ ఇంగ్లీష్ కోర్సు",
            "description": "Improve your English speaking skills with daily practice",
            "description_te": "రోజువారీ అభ్యాసంతో మీ ఇంగ్లీష్ మాట్లాడే నైపుణ్యాలను మెరుగుపరచుకోండి",
            "category": "language",
            "subcategory": "english",
            "thumbnail_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
            "instructor_name": "Prof. Lakshmi Devi",
            "price": 499,
            "duration_hours": 30,
            "difficulty": "beginner",
            "tags": ["english", "speaking", "communication"],
            "is_featured": True,
            "is_published": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "title": "10th Class Mathematics",
            "title_te": "10వ తరగతి గణితం",
            "description": "Complete SSC Mathematics preparation with solved examples",
            "description_te": "పరిష్కరించిన ఉదాహరణలతో పూర్తి SSC గణిత తయారీ",
            "category": "k12",
            "subcategory": "10th",
            "thumbnail_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
            "instructor_name": "Sri Venkat Rao",
            "price": 0,
            "duration_hours": 50,
            "difficulty": "intermediate",
            "tags": ["mathematics", "ssc", "10th class"],
            "is_featured": True,
            "is_published": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "title": "Digital Marketing Masterclass",
            "title_te": "డిజిటల్ మార్కెటింగ్ మాస్టర్‌క్లాస్",
            "description": "Learn SEO, Social Media, and Google Ads",
            "description_te": "SEO, సోషల్ మీడియా మరియు Google యాడ్స్ నేర్చుకోండి",
            "category": "professional",
            "subcategory": "marketing",
            "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
            "instructor_name": "Anil Kumar",
            "price": 1999,
            "duration_hours": 40,
            "difficulty": "intermediate",
            "tags": ["marketing", "digital", "seo", "ads"],
            "is_featured": False,
            "is_published": True,
            "created_at": now_iso()
        },
        {
            "id": generate_id(),
            "title": "Tailoring & Fashion Design",
            "title_te": "టైలరింగ్ & ఫ్యాషన్ డిజైన్",
            "description": "Learn professional tailoring and start your own business",
            "description_te": "ప్రొఫెషనల్ టైలరింగ్ నేర్చుకోండి మరియు మీ స్వంత వ్యాపారాన్ని ప్రారంభించండి",
            "category": "skill",
            "subcategory": "tailoring",
            "thumbnail_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
            "instructor_name": "Smt. Padma",
            "price": 2499,
            "duration_hours": 60,
            "difficulty": "beginner",
            "tags": ["tailoring", "fashion", "skill"],
            "is_featured": True,
            "is_published": True,
            "created_at": now_iso()
        }
    ]
    
    # Insert courses
    for course in sample_courses:
        existing = await db.courses.find_one({"title": course["title"]})
        if not existing:
            await db.courses.insert_one(course)
    
    return {"success": True, "message": f"Seeded {len(sample_courses)} courses"}
