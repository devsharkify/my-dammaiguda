# My Dammaiguda - Complete API Reference

## Base URL
```
https://dammaiguda.preview.emergentagent.com/api
```

---

## Authentication APIs

### POST /auth/otp
Send OTP to phone number
```json
// Request
{ "phone": "9999999999" }

// Response
{ "success": true, "message": "OTP sent (test mode)", "dev_otp": "123456" }
```

### POST /auth/verify
Verify OTP and get JWT token
```json
// Request
{ "phone": "9999999999", "otp": "123456" }

// Response
{
  "success": true,
  "is_new_user": false,
  "user": { "id": "...", "phone": "+919999999999", "name": "User", "role": "admin" },
  "token": "eyJhbGci...",
  "access_token": "eyJhbGci..."
}
```

### POST /auth/admin-login
Staff portal password login
```json
// Request
{ "phone": "9100063133", "password": "Plan@123" }

// Response
{ "success": true, "user": {...}, "token": "..." }
```

### GET /auth/me
Get current user profile
```
Authorization: Bearer <token>
```

### PUT /auth/me
Update user profile
```json
// Request
{ "name": "New Name", "email": "new@email.com" }
```

---

## Education APIs

### GET /education/courses
List all published courses
```json
// Query Params
?category=professional&difficulty=beginner&search=web&limit=10&skip=0

// Response
{
  "courses": [...],
  "total": 7,
  "categories": [...]
}
```

### GET /education/courses/:courseId
Get course details with lessons
```json
// Response
{
  "course": {...},
  "lessons": [...],
  "quizzes": [...],
  "is_enrolled": true,
  "progress": { "completed": 2, "total": 22, "percentage": 9 }
}
```

### GET /education/courses/:courseId/subjects
Get subjects for a course
```json
// Response
{
  "subjects": [
    { "id": "...", "title": "HTML & CSS Fundamentals", "lesson_count": 4 },
    { "id": "...", "title": "JavaScript Programming", "lesson_count": 6 }
  ]
}
```

### GET /education/subjects/:subjectId/lessons
Get lessons for a subject
```json
// Response
{
  "lessons": [
    { "id": "...", "title": "Introduction to JavaScript", "is_free_preview": true },
    { "id": "...", "title": "Variables & Data Types", "is_free_preview": false }
  ]
}
```

### GET /education/lessons/:lessonId
Get lesson details (with sequential access check)
```
Authorization: Bearer <token>

// Success Response
{ "id": "...", "title": "...", "video_url": "...", "description": "..." }

// Blocked Response (if trying to skip)
{ "detail": "Please complete 'Variables & Data Types' first" }
```

### POST /education/enroll
Enroll in a course
```json
// Request
{ "course_id": "b326b25e-97ac-439b-a691-ec06996c8fad" }

// Response
{ "success": true, "message": "Enrolled successfully", "enrollment": {...} }
```

### POST /education/lessons/:lessonId/progress
Mark lesson complete
```json
// Request
{
  "course_id": "...",
  "lesson_id": "...",
  "completed": true
}

// Response
{ "success": true, "message": "Progress updated" }
```

### GET /education/my-courses
Get user's enrolled courses with progress
```json
// Response
{
  "courses": [
    {
      "title": "Full Stack Web Development",
      "progress": { "completed": 2, "total": 22, "percentage": 9 }
    }
  ]
}
```

### POST /education/quizzes/:quizId/submit
Submit quiz answers
```json
// Request
{
  "answers": { "q1": "a", "q2": "b", "q3": "c" }
}

// Response
{
  "score": 80,
  "passed": true,
  "correct_answers": 8,
  "total_questions": 10
}
```

### POST /education/certificates/generate/:courseId
Generate completion certificate
```json
// Response
{
  "certificate_id": "...",
  "certificate_url": "..."
}
```

---

## Fitness APIs

### GET /fitness/dashboard
Get fitness dashboard data
```json
// Response
{
  "today": { "steps": 5000, "calories": 200, "distance": 3.5 },
  "weekly_summary": {...},
  "recent_activities": [...]
}
```

### POST /fitness/activity
Log an activity
```json
// Request
{
  "activity_type": "walking",
  "duration_minutes": 30,
  "calories_burned": 150
}
```

### GET /fitness/weight/history
Get weight history
```json
// Query: ?days=30

// Response
{
  "weights": [
    { "date": "2026-02-22", "weight": 75.5, "bmi": 24.2 }
  ],
  "goal": { "target_weight": 70, "deadline": "2026-06-01" }
}
```

### POST /fitness/weight
Log weight
```json
// Request
{ "weight": 75.5, "notes": "Morning weight" }
```

### POST /fitness/live/start
Start live activity tracking
```json
// Request
{ "activity_type": "running" }

// Response
{ "session_id": "...", "started_at": "..." }
```

---

## Benefits APIs

### GET /benefits/stats
Get public benefit stats
```json
// Response
{
  "total_applications": 50,
  "approved": 30,
  "pending": 15,
  "by_type": { "accidental": 20, "health": 15, "education": 15 }
}
```

### POST /benefits/accidental-insurance
Apply for accidental insurance
```json
// Request
{
  "name": "User Name",
  "father_name": "Father Name",
  "dob": "1990-01-01",
  "aadhar": "123456789012",
  "voter_id": "ABC1234567",
  "whatsapp": "9876543210",
  "address": "...",
  "occupation": "...",
  "monthly_earning": "50000",
  "family_members": [...]
}
```

### POST /benefits/education-voucher
Get education voucher (auto-approved)
```json
// Request
{
  "name": "User Name",
  "education": "Graduate",
  "occupation": "Software Developer"
}

// Response
{
  "success": true,
  "voucher_code": "BOSE-XXXX-XXXX"
}
```

### GET /benefits/my-applications
Get user's applications
```json
// Response
{
  "applications": [
    { "type": "accidental-insurance", "status": "pending", "applied_at": "..." }
  ]
}
```

---

## News APIs

### GET /news/feed/all
Get all news articles
```json
// Response
{
  "articles": [
    { "title": "...", "summary": "...", "image_url": "...", "source": "..." }
  ]
}
```

### GET /news/:category
Get news by category (business, sports, tech, entertainment, local)
```json
// Response
{ "articles": [...] }
```

---

## Issues APIs

### GET /issues
Get all issues
```json
// Query: ?status=pending&category=road

// Response
{
  "issues": [
    { "id": "...", "title": "Pothole on Main Road", "status": "pending", "votes": 5 }
  ]
}
```

### POST /issues
Report a new issue
```json
// Request
{
  "title": "Pothole on Main Road",
  "description": "Large pothole causing accidents",
  "category": "road",
  "location": "Main Street, Block A",
  "images": ["cloudinary-url"]
}
```

### PUT /issues/:issueId/status
Update issue status (admin/manager)
```json
// Request
{ "status": "in-progress", "notes": "Team dispatched" }
```

---

## Admin APIs

### GET /admin/stats
Get admin dashboard stats
```json
// Response
{
  "users": { "total": 13, "active": 5, "new_today": 1 },
  "issues": { "total": 4, "pending": 2 },
  "courses": { "total": 7, "enrollments": 7 },
  "benefits": { "pending": 0 }
}
```

### GET /admin/users
List all users
```json
// Query: ?role=admin&search=rohan&limit=20

// Response
{
  "users": [...],
  "total": 13
}
```

### PUT /admin/users/:userId/role
Change user role
```json
// Request
{ "role": "manager" }
```

---

## Analytics APIs

### GET /analytics/admin/summary
Get analytics summary
```json
// Query: ?days=7

// Response
{
  "page_views": [...],
  "feature_usage": [...],
  "active_users": [...]
}
```

---

## Notifications APIs

### GET /notifications/vapid-public-key
Get VAPID public key for push subscriptions

### POST /notifications/subscribe
Subscribe to push notifications
```json
// Request
{
  "subscription": { "endpoint": "...", "keys": {...} }
}
```

### POST /notifications/admin/broadcast
Send broadcast notification (admin)
```json
// Request
{
  "title": "Important Update",
  "body": "Check out the new feature!",
  "url": "/dashboard"
}
```

---

## AQI APIs

### GET /aqi/dammaiguda
Get Dammaiguda air quality
```json
// Response
{
  "aqi": 85,
  "category": "Moderate",
  "pm25": 35.2,
  "pm10": 65.1,
  "daily_peak": { "aqi": 120, "time": "14:00" },
  "updated_at": "..."
}
```

### GET /aqi/both
Get AQI for both Dammaiguda and Hyderabad

---

## Panchangam APIs

### GET /panchangam/today
Get today's Telugu calendar
```json
// Response
{
  "date": "2026-02-22",
  "tithi": "...",
  "nakshatra": "...",
  "yoga": "...",
  "karana": "...",
  "rahu_kalam": "09:00-10:30",
  "yamaganda": "12:00-13:30",
  "varjyam": "..."
}
```

---

## WebSocket Endpoints

### /api/ws/chat
Real-time chat WebSocket
```javascript
const ws = new WebSocket('wss://...api/ws/chat?token=...');
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));
```

### /api/alerts/ws
Real-time alerts WebSocket (admin)

---

## Error Responses

### 400 Bad Request
```json
{ "detail": "Invalid request data" }
```

### 401 Unauthorized
```json
{ "detail": "Not authenticated" }
```

### 403 Forbidden
```json
{ "detail": "Only admins and instructors can create courses" }
```

### 404 Not Found
```json
{ "detail": "Course not found" }
```

### 422 Validation Error
```json
{
  "detail": [
    { "loc": ["body", "phone"], "msg": "field required", "type": "value_error.missing" }
  ]
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /auth/otp | 5/minute |
| /auth/verify | 10/minute |
| General API | 60/minute |

---

*API Version: 2.7.0*
