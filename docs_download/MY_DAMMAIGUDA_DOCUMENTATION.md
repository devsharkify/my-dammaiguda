# My Dammaiguda - Complete Technical Documentation

**Version:** 2.7.0  
**Last Updated:** February 22, 2026  
**Status:** Production Ready  

---

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Architecture](#2-architecture)
3. [URLs & Endpoints](#3-urls--endpoints)
4. [Test Credentials](#4-test-credentials)
5. [All Portals](#5-all-portals)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Source Code Structure](#8-source-code-structure)
9. [Deployment Configuration](#9-deployment-configuration)
10. [Third-Party Integrations](#10-third-party-integrations)
11. [Features & Modules](#11-features--modules)
12. [Testing](#12-testing)

---

## 1. Application Overview

### What is My Dammaiguda?
My Dammaiguda is a **production-ready, mobile-first civic engagement platform** designed for local communities. It provides:
- Citizen services (issue reporting, benefits claiming)
- Health & fitness tracking
- Education platform (Byju's-style courses)
- News aggregation
- Community wall & social features
- Admin & management tools

### Key Statistics
| Metric | Value |
|--------|-------|
| Total Users | 13 |
| Total Courses | 7 |
| Total Lessons | 47 |
| Total Issues | 4 |
| API Endpoints | 200+ |
| Database Collections | 60+ |

---

## 2. Architecture

### Technology Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Tailwind CSS, Shadcn/UI |
| **Backend** | FastAPI (Python 3.11) |
| **Database** | MongoDB (Motor async driver) |
| **Authentication** | JWT + OTP via Authkey.io |
| **File Storage** | Cloudinary |
| **Real-time** | WebSockets |
| **Notifications** | Web Push (VAPID) |

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  (Mobile PWA / Desktop Browser / Tablet)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     KUBERNETES INGRESS                       │
│            https://dammaiguda.preview.emergentagent.com │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐         ┌───────────────────────────┐
│    FRONTEND (3000)    │         │      BACKEND (8001)       │
│    React + Tailwind   │         │         FastAPI           │
│                       │         │                           │
│  - Landing Page       │         │  - REST API (/api/*)      │
│  - Dashboard          │         │  - WebSocket Chat         │
│  - Admin Panel        │         │  - Background Tasks       │
│  - Course Manager     │         │                           │
└───────────────────────┘         └───────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │        MONGODB (27017)        │
                              │      Database: dammaiguda_db  │
                              │      Collections: 60+         │
                              └───────────────────────────────┘
```

---

## 3. URLs & Endpoints

### Production URLs
| Environment | URL |
|-------------|-----|
| **Preview** | https://dammaiguda.preview.emergentagent.com |
| **Production** | https://www.mydammaiguda.in |
| **Railway Backend** | https://sparkling-abundance-production-0143.up.railway.app |

### Main Application Routes
| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing Page | No |
| `/auth` | Login/Register | No |
| `/dashboard` | User Dashboard | Yes |
| `/education` | Course Catalog | No |
| `/education/course/:id` | Course Details | Yes |
| `/benefits` | Citizen Benefits | No |
| `/claim-benefits` | Apply for Benefits | Yes |
| `/news` | News Feed | No |
| `/issues` | Issue Feed | Yes |
| `/report` | Report Issue | Yes |
| `/fitness` | Health & Fitness | Yes |
| `/astrology` | Astrology/Kundali | Yes |
| `/wall` | Citizen Wall | Yes |
| `/profile` | User Profile | Yes |
| `/portals` | Staff Portal Selector | Yes (Staff) |
| `/admin/panel` | Admin Dashboard | Yes (Admin) |
| `/manager` | Manager Portal | Yes (Manager) |
| `/instructor` | Instructor Portal | Yes (Instructor) |
| `/volunteer` | Volunteer Dashboard | Yes (Volunteer) |

### API Base Paths
| Prefix | Description |
|--------|-------------|
| `/api/auth` | Authentication |
| `/api/education` | Courses & Learning |
| `/api/fitness` | Health & Fitness |
| `/api/issues` | Issue Management |
| `/api/news` | News & RSS |
| `/api/benefits` | Citizen Benefits |
| `/api/admin` | Admin Operations |
| `/api/manager` | Manager Operations |
| `/api/analytics` | User Analytics |
| `/api/notifications` | Push Notifications |
| `/api/aqi` | Air Quality Index |
| `/api/panchangam` | Telugu Calendar |

---

## 4. Test Credentials

### OTP-Based Login (Regular Users)
| User Type | Phone Number | OTP | Notes |
|-----------|--------------|-----|-------|
| Test User | 9999999999 | 123456 | Admin role |
| Test User 2 | 9876543210 | 123456 | Citizen role |
| Test User 3 | 8888888888 | 123456 | User role |
| Original Manager | 9844548537 | 123456 | Manager role |

### Password-Based Login (Staff Portal - `/portals`)
| Role | Phone | Password |
|------|-------|----------|
| **Master Admin** | 9100063133 | Plan@123 |
| **Manager** | 7386917770 | Manager@123 |

### Quick Login Commands
```bash
# Send OTP
curl -X POST "https://dammaiguda.preview.emergentagent.com/api/auth/otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999"}'

# Verify OTP & Get Token
curl -X POST "https://dammaiguda.preview.emergentagent.com/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456"}'

# Admin Login (Password)
curl -X POST "https://dammaiguda.preview.emergentagent.com/api/auth/admin-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9100063133","password":"Plan@123"}'
```

---

## 5. All Portals

### Portal Access Matrix
| Portal | URL | Roles Allowed | Features |
|--------|-----|---------------|----------|
| **Staff Portal Selector** | `/portals` | Admin, Manager, Instructor, Volunteer | Central hub for staff login |
| **Admin Panel** | `/admin/panel` | Admin | Full system control |
| **Manager Portal** | `/manager` | Admin, Manager | Area-specific management |
| **Instructor Portal** | `/instructor` | Admin, Instructor | Course creation & student analytics |
| **Volunteer Dashboard** | `/volunteer` | Admin, Volunteer | Community service activities |

### Admin Panel Tabs
| Tab | Features |
|-----|----------|
| **Dashboard** | Key metrics, charts, quick actions |
| **Users** | User management, role assignment, search |
| **Issues** | All reported issues, status updates |
| **Course Manager** | Full course CRUD (Course → Subject → Lesson) |
| **Content** | Headlines, banners, benefits management |
| **News** | News article creation, RSS management |
| **Benefits** | Review insurance/voucher applications |
| **Analytics** | User analytics, feature popularity |
| **Alerts** | System alerts configuration |
| **Reports** | Downloadable reports |
| **Settings** | Site branding, area configuration |
| **Clone Maker** | White-label app generator |

---

## 6. Database Schema

### MongoDB Collections (60+)
```
Database: dammaiguda_db

USER & AUTH
├── users (13 docs) - User profiles, roles
├── otp_store (1 doc) - Temporary OTP storage
└── oauth_states (1 doc) - OAuth state management

EDUCATION SYSTEM
├── courses (7 docs) - Course definitions
├── subjects (4 docs) - Course subjects
├── lessons (47 docs) - Individual lessons
├── enrollments (7 docs) - User enrollments
├── lesson_progress (4 docs) - Progress tracking
├── quizzes (3 docs) - Quiz questions
├── certificates (1 doc) - Generated certificates
└── course_reviews (1 doc) - User reviews

HEALTH & FITNESS
├── fitness_profiles (3 docs) - User fitness data
├── fitness_daily (8 docs) - Daily stats
├── activities (27 docs) - Activity logs
├── weight_logs (11 docs) - Weight tracking
├── meals (24 docs) - Meal logging
├── water_logs (4 docs) - Hydration tracking
├── sleep_logs (3 docs) - Sleep tracking
├── heart_rate_logs (3 docs) - Heart rate data
├── live_activities (11 docs) - Real-time tracking
└── fitness_points_log (8 docs) - Points earned

BENEFITS & VOUCHERS
├── benefits (2 docs) - Benefit applications
├── vouchers (3 docs) - Available vouchers
└── voucher_claims (1 doc) - Claimed vouchers

COMMUNITY
├── issues (4 docs) - Reported issues
├── wall_posts (14 docs) - Community posts
├── wall_comments (3 docs) - Post comments
├── groups (6 docs) - Community groups
└── stories (9 docs) - User stories

NOTIFICATIONS & CHAT
├── push_subscriptions (2 docs) - Web push
├── pending_notifications (4 docs) - Queued notifs
├── chat_rooms (3 docs) - Chat rooms
└── chat_history (6 docs) - AI chat history

ANALYTICS & ADMIN
├── user_analytics (3 docs) - Usage tracking
├── alert_config (1 doc) - Alert settings
├── site_content (4 docs) - CMS content
├── site_banners (2 docs) - Banners
└── app_settings (1 doc) - Global settings
```

### Key Data Models

#### User Schema
```javascript
{
  "id": "uuid-string",
  "phone": "+919876543210",
  "name": "User Name",
  "email": "optional@email.com",
  "role": "citizen|admin|manager|instructor|volunteer|user",
  "password_hash": "sha256-hash (for staff)",
  "profile_image": "cloudinary-url",
  "area_id": "dammaiguda",
  "created_at": "ISO-timestamp",
  "last_active": "ISO-timestamp"
}
```

#### Course Schema
```javascript
{
  "id": "uuid-string",
  "title": "Full Stack Web Development",
  "title_te": "Telugu translation",
  "description": "Course description",
  "thumbnail_url": "image-url",
  "category": "professional|skill|language",
  "price": 39999,
  "duration_hours": 200,
  "difficulty": "beginner|intermediate|advanced",
  "is_published": true,
  "certificate_enabled": true,
  "instructor_id": "user-id",
  "instructor_name": "Instructor Name",
  "enrollment_count": 3,
  "rating_average": 4.5,
  "created_at": "ISO-timestamp"
}
```

#### Lesson Schema
```javascript
{
  "id": "uuid-string",
  "course_id": "course-uuid",
  "subject_id": "subject-uuid",
  "title": "Introduction to JavaScript",
  "description": "Lesson description",
  "video_url": "youtube-or-hosted-url",
  "duration_minutes": 45,
  "order_index": 0,
  "is_free_preview": true,
  "requires_previous": true,
  "study_materials": [
    {"name": "PDF Notes", "url": "download-url"}
  ],
  "created_at": "ISO-timestamp"
}
```

---

## 7. API Reference

### Authentication APIs
```
POST /api/auth/otp              - Send OTP
POST /api/auth/verify           - Verify OTP & Login
POST /api/auth/admin-login      - Password login (staff)
GET  /api/auth/me               - Get current user
PUT  /api/auth/me               - Update profile
DELETE /api/auth/delete-account - Account deletion
```

### Education APIs
```
GET  /api/education/courses                    - List all courses
GET  /api/education/courses/:id                - Course details
GET  /api/education/courses/:id/subjects       - Course subjects
GET  /api/education/subjects/:id/lessons       - Subject lessons
GET  /api/education/lessons/:id                - Lesson details (sequential check)
POST /api/education/enroll                     - Enroll in course
POST /api/education/lessons/:id/progress       - Update progress
GET  /api/education/my-courses                 - User's enrolled courses
POST /api/education/quizzes/:id/submit         - Submit quiz
POST /api/education/certificates/generate/:id  - Generate certificate
```

### Fitness APIs
```
GET  /api/fitness/dashboard        - Dashboard data
GET  /api/fitness/activities       - Activity list
POST /api/fitness/activity         - Log activity
POST /api/fitness/record           - Record exercise
GET  /api/fitness/weight/history   - Weight history
POST /api/fitness/weight           - Log weight
GET  /api/fitness/today-stats      - Today's stats
GET  /api/fitness/weekly-summary   - Weekly summary
POST /api/fitness/live/start       - Start live activity
POST /api/fitness/live/end         - End live activity
```

### Benefits APIs
```
GET  /api/benefits/stats                  - Public stats
POST /api/benefits/accidental-insurance   - Apply for insurance
POST /api/benefits/health-insurance       - Apply for health ins.
POST /api/benefits/education-voucher      - Get education voucher
GET  /api/benefits/my-applications        - User's applications
GET  /api/benefits/admin/applications     - Admin: all applications
PUT  /api/benefits/admin/applications/:id - Admin: update status
```

### News APIs
```
GET  /api/news/feed/all       - All news
GET  /api/news/local          - Local news
GET  /api/news/:category      - By category
POST /api/news/admin/create   - Create article
POST /api/news/admin/push     - Push notification
```

### Admin APIs
```
GET  /api/admin/stats              - Admin statistics
GET  /api/admin/users              - User list
PUT  /api/admin/users/:id/role     - Change user role
GET  /api/analytics/admin/summary  - Analytics summary
GET  /api/reports/available        - Available reports
```

---

## 8. Source Code Structure

### Frontend Structure
```
/app/frontend/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── service-worker.js      # Service worker
├── src/
│   ├── components/
│   │   ├── ui/                # Shadcn/UI components (40+)
│   │   ├── Layout.jsx         # Main layout wrapper
│   │   ├── AQIWidget.jsx      # Air quality widget
│   │   ├── CalorieCounter.jsx # Calorie tracker
│   │   ├── CourseManager.jsx  # Course CRUD UI
│   │   ├── UserManager.jsx    # User management
│   │   ├── BenefitsAdmin.jsx  # Benefits admin
│   │   └── ...
│   ├── pages/
│   │   ├── LandingPage.jsx    # Home page
│   │   ├── Dashboard.jsx      # User dashboard
│   │   ├── AdminPanel.jsx     # Admin dashboard (52KB)
│   │   ├── ManagerApp.jsx     # Manager portal
│   │   ├── InstructorPortal.jsx
│   │   ├── AITEducation.jsx   # Education catalog
│   │   ├── CourseDetail.jsx   # Course viewer
│   │   ├── KaizerFit.jsx      # Fitness module (72KB)
│   │   ├── Astrology.jsx      # Astrology (66KB)
│   │   ├── NewsPage.jsx       # News feed
│   │   ├── PortalSelector.jsx # Staff portal hub
│   │   └── ... (45+ pages)
│   ├── context/
│   │   ├── AuthContext.jsx    # Auth state
│   │   ├── LanguageContext.jsx # i18n
│   │   └── ThemeContext.jsx   # Theme
│   ├── hooks/
│   │   ├── useOffline.js      # Offline detection
│   │   └── usePushNotifications.js
│   └── App.js                 # Routes & providers
├── package.json
└── tailwind.config.js
```

### Backend Structure
```
/app/backend/
├── server.py                  # FastAPI app entry
├── models/
│   ├── education.py           # Course/Lesson models
│   └── ...
├── routers/
│   ├── auth.py                # Authentication
│   ├── education.py           # Education (1592 lines)
│   ├── fitness.py             # Fitness tracking
│   ├── doctor.py              # Health metrics
│   ├── benefits.py            # Benefits system
│   ├── news.py                # News management
│   ├── issues.py              # Issue reporting
│   ├── analytics.py           # User analytics
│   ├── manager.py             # Manager APIs
│   ├── admin_users.py         # Admin user mgmt
│   ├── aqi.py                 # Air quality
│   ├── panchangam.py          # Telugu calendar
│   ├── muhurtam.py            # Auspicious times
│   ├── astrology.py           # Kundali generation
│   ├── notifications.py       # Push notifications
│   ├── websocket_chat.py      # Real-time chat
│   ├── clone.py               # White-label generator
│   └── ... (30+ routers)
├── middleware/
│   ├── rate_limiter.py        # Rate limiting
│   └── sentry_config.py       # Error monitoring
├── requirements.txt
└── .env
```

### Key Files by Size
| File | Lines | Description |
|------|-------|-------------|
| education.py | 1592 | Education module backend |
| KaizerFit.jsx | 2400+ | Fitness frontend |
| Astrology.jsx | 2200+ | Astrology frontend |
| AdminPanel.jsx | 1295 | Admin dashboard |
| CourseDetail.jsx | 1700+ | Course viewer |
| CourseManager.jsx | 1162 | Course CRUD |

---

## 9. Deployment Configuration

### Server Configuration
| Parameter | Value |
|-----------|-------|
| **Frontend Port** | 3000 |
| **Backend Port** | 8001 |
| **MongoDB Port** | 27017 |
| **Database Name** | dammaiguda_db |

### Environment Variables

#### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="dammaiguda_db"
CORS_ORIGINS="*"
JWT_SECRET="your-secret-key"

# SMS (Authkey.io)
AUTHKEY_API_KEY=bedfc307ae476372

# Cloudinary (Media)
CLOUDINARY_CLOUD_NAME=divb7z5yq
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Google Fit
GOOGLE_FIT_CLIENT_ID=203132203944-...
GOOGLE_FIT_CLIENT_SECRET=your-secret
GOOGLE_FIT_REDIRECT_URI=https://mydammaiguda.in/api/fitness/google-fit/callback

# Push Notifications
VAPID_PRIVATE_KEY=your-key
VAPID_PUBLIC_KEY=your-key
VAPID_CLAIMS_EMAIL=mailto:support@sharkify.ai

# OpenAI (AI Chat)
OPENAI_API_KEY=your-key

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=AC6c4afd9715e25770fc1dd27af5322e6a
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=+12692304345
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://dammaiguda.preview.emergentagent.com
WDS_SOCKET_PORT=443
CI=false
DISABLE_ESLINT_PLUGIN=true
ESLINT_NO_DEV_ERRORS=true
```

### Supervisor Configuration
```bash
# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```

### Production Deployment (Railway)
```yaml
# Backend
Build: pip install -r requirements.txt
Start: uvicorn server:app --host 0.0.0.0 --port $PORT

# Frontend
Build: yarn install && yarn build
Start: serve -s build -l $PORT
```

---

## 10. Third-Party Integrations

### Active Integrations
| Service | Purpose | Required Keys |
|---------|---------|---------------|
| **Authkey.io** | SMS OTP | AUTHKEY_API_KEY |
| **Cloudinary** | Image/Media storage | CLOUDINARY_* |
| **OpenAI** | AI Chat | OPENAI_API_KEY |
| **Google Fit** | Fitness sync | GOOGLE_FIT_* |
| **Twilio** | WhatsApp | TWILIO_* |
| **Kerykeion** | Astrology | (Python library) |
| **BeautifulSoup** | AQI scraping | (Python library) |

### Integration Endpoints
| Integration | Endpoint | Notes |
|-------------|----------|-------|
| **Authkey SMS** | api.authkey.io | OTP delivery |
| **Google Fit** | fitness.googleapis.com | OAuth2 |
| **AQI Data** | aqi.in | Web scraping |
| **RSS Feeds** | Various | News aggregation |

---

## 11. Features & Modules

### Core Modules
| Module | Status | Description |
|--------|--------|-------------|
| **Authentication** | ✅ Complete | OTP + Password login |
| **Education** | ✅ Complete | Byju's-style courses with sequential learning |
| **Fitness** | ✅ Complete | Comprehensive health tracking |
| **Benefits** | ✅ Complete | Insurance & voucher claims |
| **News** | ✅ Complete | Way2News style feed |
| **Issues** | ✅ Complete | Civic issue reporting |
| **Wall** | ✅ Complete | Community posts |
| **Analytics** | ✅ Complete | User analytics dashboard |
| **Admin** | ✅ Complete | Full admin control |
| **Manager** | ✅ Complete | Area-specific management |
| **Clone Maker** | ✅ Complete | White-label generator |

### Education Module Details
```
Course Structure:
├── Course (e.g., Full Stack Web Development)
│   ├── Subject 1: HTML & CSS Fundamentals (4 lessons)
│   ├── Subject 2: JavaScript Programming (6 lessons)
│   ├── Subject 3: React.js Framework (6 lessons)
│   └── Subject 4: Node.js & Backend (6 lessons)

Sequential Learning:
- Users CANNOT skip lessons
- Must complete Lesson N before accessing Lesson N+1
- Admins/Instructors bypass this restriction
- Error: "Please complete '[Previous Lesson]' first"

Progress Tracking:
- Per-lesson completion status
- Percentage calculation
- Certificate generation on 100% completion
```

### Fitness Module Details
```
Tracking Features:
├── Daily Statistics
│   ├── Steps
│   ├── Calories
│   ├── Distance
│   └── Active Minutes
├── Health Metrics
│   ├── Weight (with goal tracking)
│   ├── Heart Rate
│   ├── Sleep
│   ├── Water Intake
│   └── SpO2
├── Activities
│   ├── Walking
│   ├── Running
│   ├── Cycling
│   ├── Swimming
│   ├── Yoga
│   └── Gym/Strength
├── Live Activity Tracking
├── Challenges & Badges
└── Google Fit Integration
```

---

## 12. Testing

### Test Reports Location
```
/app/test_reports/
├── iteration_42.json  # Previous QA
├── iteration_43.json  # Full QA pass
├── iteration_44.json  # Student experience
└── pytest/
    └── pytest_student_course.xml
```

### Backend Test Files
```
/app/backend/tests/
└── test_student_course_experience.py
```

### Quick Test Commands
```bash
# Health Check
curl https://dammaiguda.preview.emergentagent.com/api/health

# Test Authentication
curl -X POST "...api/auth/otp" -d '{"phone":"9999999999"}'
curl -X POST "...api/auth/verify" -d '{"phone":"9999999999","otp":"123456"}'

# Test Education API
curl "...api/education/courses"
curl "...api/education/courses/b326b25e-97ac-439b-a691-ec06996c8fad/subjects"

# Test with Auth
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" "...api/education/my-courses"
```

### Test Scenarios Verified
| Test | Status |
|------|--------|
| OTP Login | ✅ Pass |
| Password Login | ✅ Pass |
| Course Listing | ✅ Pass |
| Course Enrollment | ✅ Pass |
| Sequential Learning | ✅ Pass |
| Progress Tracking | ✅ Pass |
| Benefits Page (Public) | ✅ Pass |
| Education Page (Public) | ✅ Pass |
| Admin Panel Access | ✅ Pass |
| Manager Portal | ✅ Pass |

---

## Quick Reference Card

### Essential Commands
```bash
# Start/Restart Services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# View Logs
tail -f /var/log/supervisor/backend.err.log

# Test API
API="https://dammaiguda.preview.emergentagent.com/api"
curl $API/health
```

### Key Course ID
```
Full Stack Web Development: b326b25e-97ac-439b-a691-ec06996c8fad
```

### Login Quick Reference
```
Staff Portal: /portals
- Admin: 9100063133 / Plan@123
- Manager: 7386917770 / Manager@123

OTP Login: /auth
- Test: 9999999999 / 123456
```

---

**Document End**

*Powered by Sharkify Technology Private Limited*
