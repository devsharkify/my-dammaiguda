# My Dammaiguda - Civic Engagement Platform

## Original Problem Statement
Build a production-ready, mobile-first civic engagement platform "My Dammaiguda". The platform must be minimalistic, fast, low-data, and trust-focused.

## Product Requirements

### Core Modules
- **User Auth**: OTP-based authentication (currently MOCKED - static 123456)
- **Issue Reporting**: Citizens report local issues with media support
- **Dump Yard/Environment**: Environmental information tracking
- **Health & Fitness (Kaizer Fit)**: Comprehensive fitness tracking with smartwatch integration
- **Citizen Benefits**: Government scheme information
- **Ward Expenditure Dashboard**: Local spending transparency
- **Polls**: Community voting
- **Volunteer Module**: Volunteer coordination
- **Admin Dashboard**: Platform management

### Recently Implemented Features (Feb 2026)

#### 1. Language Default Change
- **Status**: COMPLETED
- English is now the default language (previously Telugu)
- Users can toggle to Telugu if desired
- Stored in localStorage as `dammaiguda_language`

#### 2. Gift Shop Module (E-commerce)
- **Status**: COMPLETED
- Points wallet system with balance tracking
- Product catalog with categories (Fitness, Electronics)
- MRP display and points-to-claim conversion
- Delivery address collection with exact location
- Order tracking (pending, approved, shipped, delivered)
- Admin product management
- Admin points adjustment and order approval

#### 3. Fitness Page Enhancements
- **Status**: COMPLETED
- **Mandatory Onboarding**: First-time users must provide:
  - Height (cm)
  - Weight (kg)
  - Gender (Male/Female/Other)
  - Age
  - Fitness Goal (optional)
- BMI and calorie recommendations calculated automatically
- **Manual Activity Recording**: Log workouts with editable dates
  - Activity type, duration, distance, calories, notes
  - Cannot record future activities
- **Start Live Activity**: GPS-tracked real-time activity
- **Record Fitness**: Manual entry option alongside live tracking

#### 4. Dark Mode & Page Transitions
- **Status**: COMPLETED
- Global dark mode toggle in header and Profile page
- Theme persists in localStorage
- Smooth page transitions using framer-motion
- CSS variables for light/dark themes

#### 5. AIT Education Module
- **Status**: COMPLETED
- Course catalog with categories
- Video lessons and quizzes
- Progress tracking and certificates
- Course reviews and ratings
- Admin course management

---

## Technical Architecture

### Frontend (React)
```
/app/frontend/src/
├── components/
│   ├── Layout.jsx (PhonePe-style bottom nav, dark mode)
│   └── PageTransition.jsx (framer-motion animations)
├── context/
│   ├── AuthContext.jsx
│   ├── LanguageContext.jsx (default: 'en')
│   └── ThemeContext.jsx (dark/light mode)
├── pages/
│   ├── Dashboard.jsx (Quick actions grid, AQI widgets)
│   ├── GiftShop.jsx (Wallet, products, orders)
│   ├── KaizerFit.jsx (Onboarding, live/manual tracking)
│   ├── AITEducation.jsx, CourseDetail.jsx, Certificate.jsx
│   └── ... (other modules)
└── hooks/
    └── usePushNotifications.js
```

### Backend (FastAPI)
```
/app/backend/
├── server.py (main app, router registration)
└── routers/
    ├── auth.py (OTP auth - MOCKED)
    ├── fitness.py (profile, activities, badges, manual recording)
    ├── shop.py (wallet, products, orders, admin)
    ├── education.py (courses, lessons, certificates)
    └── ... (other modules)
```

### Database (MongoDB)
Key Collections:
- `users`, `wallets`, `points_transactions`
- `gift_products`, `gift_orders`
- `fitness_profiles`, `activities`, `fitness_daily`
- `courses`, `lessons`, `quizzes`, `enrollments`, `certificates`

---

## Known Limitations

### MOCKED Integrations (P0)
- **OTP Authentication**: Uses static code `123456`
- **Media Uploads**: Not connected to cloud storage

### Requires User API Keys
- Twilio SMS (for real OTP)
- Cloudinary (for media storage)
- Google Maps API (partially integrated)

### Working Integrations
- Emergent LLM Key (AI features)
- Web Push (VAPID) - fully working
- AQI data (real-time scraping)

---

## Test Credentials
- Phone: `9876543210`
- OTP: `123456`
- Admin: Phone `+919999999999`, role: admin

---

## Upcoming Tasks (P1)
1. OpenGraph Meta Tags for certificate social sharing
2. Smartwatch SDK integration (Health Connect, HealthKit)
3. Real Twilio OTP integration
4. Cloudinary media upload integration

## Future/Backlog (P2)
- Instructor Portal for course management
- Student Progress Leaderboard
- WebSocket Real-time Chat
- Component refactoring (large files)

---

## Change Log

### Feb 19, 2026
- Changed default language from Telugu to English
- Added Gift Shop module with wallet, products, orders
- Added fitness profile onboarding (mandatory for first-time users)
- Added manual activity recording with editable dates
- Completed dark mode and page transitions
- Added sample gift products (Water Bottle, Yoga Mat, Fitness Tracker)
- Testing agent verified: 100% backend, 95% frontend success

### Previous Sessions
- Built AIT Education module with courses, quizzes, certificates
- Implemented web push notifications
- Created PhonePe-style UI with bottom navigation
- Added AQI widgets with real-time data
- Built Kaizer Fit with live activity tracking
