# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 3.6.0  
**Last Updated:** December 19, 2025

## What's Been Implemented

### ✅ AIT Education Module (v3.5.0-3.6.0)
- **Course Catalog**: 6 categories (K-12, College, Professional, Skill, Languages, Tech)
- **5 Seeded Courses**: Python Programming, Spoken English, 10th Math, Digital Marketing, Tailoring
- **25 Lessons**: 5 lessons per course with video placeholders
- **Quiz System**: 3 quizzes with multiple choice questions
- **Enrollment & Progress**: Track learning progress, XP points
- **Certificates**: Auto-generated on course completion
- **Admin Course Management**: Create, edit, publish courses

### ✅ Badge Count Bug Fixed (v3.6.0)
- KaizerFit now correctly displays earned badges using API response
- Uses `badgesCount.earned` / `badgesCount.total` from `/api/fitness/badges`

### ✅ Admin Dashboard Education Tab (v3.6.0)
- Course listing with publish status
- Create new courses with form
- Edit existing courses
- Publish draft courses

### Previous Features
- Web Push Notifications (VAPID)
- Enhanced AQI Widget (Hyderabad + Dammaiguda)
- PWA Offline Support
- Fitness Streaks & Badges
- Stories, Citizen Wall, News Shorts

## Test Credentials
- **Phone:** 9876543210
- **OTP:** 123456 (MOCKED)

## API Endpoints (Education)
- `GET /api/education/courses` - List courses
- `GET /api/education/courses/{id}` - Course with lessons
- `POST /api/education/enroll` - Enroll in course
- `GET /api/education/my-courses` - User's enrolled courses
- `POST /api/education/quizzes/{id}/submit` - Submit quiz
- `POST /api/education/certificates/generate/{id}` - Generate certificate

## Remaining Backlog

### P0 (Critical - Blocking Production)
- [ ] Real Twilio SMS for OTP
- [ ] Cloudinary Media Uploads

### P1 (High Priority)
- [ ] Add more sample video content to lessons
- [ ] Course reviews & ratings

### P2 (Medium/Future)
- [ ] Social sharing cards
- [ ] WebSocket real-time chat
- [ ] Data export features

## 3rd Party Integrations

| Integration | Status |
|-------------|--------|
| Emergent LLM Key | ✅ Integrated |
| Web Push (VAPID) | ✅ Integrated |
| Google Maps API | ⚠️ Needs user key |
| Twilio SMS | ❌ Mocked |
| Cloudinary | ❌ Mocked |

## Database Collections
- `courses`, `lessons`, `quizzes`, `enrollments`
- `lesson_progress`, `quiz_attempts`, `certificates`
- `user_badges`, `user_streaks`
