# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 3.5.0  
**Last Updated:** December 19, 2025

## What's Been Implemented

### ✅ AIT Education Module (NEW - v3.5.0)
A comprehensive EdTech platform integrated into the app:
- **Course Catalog**: Browse, search, filter courses by category
- **Categories**: K-12, College, Professional, Skill Development, Languages, Tech
- **Course Detail Page**: Video lessons, progress tracking, enrollment
- **Quiz System**: Multiple choice quizzes with scoring and results
- **Live Classes**: Scheduled live sessions with registration
- **Certificates**: Auto-generated certificates on course completion
- **Gamification**: XP points, learning stats, completion tracking
- **Telugu-First UI**: All content supports Telugu translations

**Key Files:**
- `/app/backend/routers/education.py` - Full backend API
- `/app/frontend/src/pages/AITEducation.jsx` - Course catalog
- `/app/frontend/src/pages/CourseDetail.jsx` - Course view/lessons
- `/app/frontend/src/pages/Certificate.jsx` - Certificate display

**API Endpoints:**
- `GET /api/education/courses` - List courses with filtering
- `GET /api/education/courses/categories` - Get categories
- `GET /api/education/courses/{id}` - Course details with lessons
- `POST /api/education/enroll` - Enroll in a course
- `GET /api/education/my-courses` - User's enrolled courses
- `POST /api/education/quizzes/{id}/submit` - Submit quiz answers
- `POST /api/education/certificates/generate/{course_id}` - Generate certificate

### ✅ Web Push Notifications (v3.4.0)
- Real VAPID key integration with `pywebpush`
- Browser push subscription via `usePushNotifications` hook
- Service worker push event handling
- Test notification button in Profile

### ✅ Enhanced AQI Widget (v3.4.0)
- Two side-by-side cards: Hyderabad & Dammaiguda
- Status text with color coding (Good/Moderate/Poor/Unhealthy)

### Previous Features (v3.0-3.3)
- PWA Offline Support
- Google Maps for live activity tracking
- Daily Fitness Streak & 10 Badges
- Premium Kaizer Fit with weight tracker
- Dashboard with widgets
- Stories feature (24-hour ephemeral)
- Citizen Wall with groups
- News Shorts with AI rephrasing

## Test Credentials
- **Phone:** 9876543210
- **OTP:** 123456 (MOCKED)

## Remaining Backlog

### P0 (Critical - Blocking Production)
- [ ] **Real Twilio SMS for OTP** - Uses static OTP 123456
- [ ] **Cloudinary Media Uploads** - All uploads mocked

### P1 (High Priority)
- [ ] Fix badge count display bug in KaizerFit.jsx
- [ ] Admin dashboard for ad and course management
- [ ] Add sample lessons/videos to courses

### P2 (Medium Priority)
- [ ] Social sharing cards
- [ ] WebSocket real-time chat
- [ ] Course reviews/ratings

### P3 (Low Priority)
- [ ] Refactor large components
- [ ] Data export features

## 3rd Party Integrations

| Integration | Status |
|-------------|--------|
| Emergent LLM Key | ✅ Integrated |
| Web Push (VAPID) | ✅ Integrated |
| Google Maps API | ⚠️ Needs user key |
| Twilio SMS | ❌ Mocked |
| Cloudinary | ❌ Mocked |

## Architecture
- Backend: FastAPI + Motor (async MongoDB)
- Frontend: React 19 + Tailwind + Shadcn UI
- Database: MongoDB (dammaiguda_db)
- PWA: Service Worker with caching
