# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.1.0  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)
**Last Updated:** February 18, 2026

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **AI:** Emergent LLM (GPT-4o-mini via Emergent integrations)
- **Authentication:** Phone OTP (Mock for dev, ready for Twilio)
- **Media:** Cloudinary (configured)
- **Maps:** Google Maps API (configured)
- **AQI Data:** Live scraping from aqi.in

## User Personas
1. **Citizens** - Report issues, track fitness, access benefits, use AI chat, family tracking
2. **Volunteers** - Verify reported issues, assist elderly
3. **Admins** - Manage content, view analytics, moderate

## Core Requirements (Static)
1. ✅ Mobile-first PWA design
2. ✅ Telugu-first language with English toggle
3. ✅ No political party symbols or colors
4. ✅ Accessibility-first (elderly-friendly)
5. ✅ Role-based access (Citizen, Volunteer, Admin)

## What's Been Implemented (Feb 2026)

### Authentication Module
- ✅ Phone OTP login (Mock OTP: 123456)
- ✅ User registration with colony and age range
- ✅ JWT-based session management
- ✅ Role management

### Issue Reporting System
- ✅ 7 Categories: Dump Yard, Garbage, Drainage, Water, Roads, Lights, Parks
- ✅ Photo/video upload support
- ✅ GPS location capture (Google Maps API configured)
- ✅ Status flow: Reported → Verified → Escalated → Closed
- ✅ Public issue feed with filters

### Dump Yard & Environment Module
- ✅ Pollution risk zoning (Red/Orange/Green)
- ✅ Health risk information
- ✅ Affected groups (Children, Pregnant, Elderly)
- ✅ Cadmium exposure info

### AQI Live Widget (NEW v2.1)
- ✅ Live AQI scraping from aqi.in
- ✅ Dammaiguda (Vayushakti Nagar station) AQI
- ✅ Hyderabad city AQI comparison
- ✅ PM2.5 and PM10 pollutant values
- ✅ Indian AQI scale calculation
- ✅ Color-coded health impact warnings
- ✅ Telugu translations for all categories
- ✅ Dashboard widget with quick view
- ✅ Full AQI report page with health tips
- ✅ Refresh functionality

### My Family Module (NEW v2.1)
- ✅ Family member request/accept flow
- ✅ Relationship types: Spouse, Child, Parent, Sibling, Other
- ✅ Real-time location tracking (GPS)
- ✅ Location history storage
- ✅ View family member location on Google Maps
- ✅ Battery level tracking
- ✅ Auto location updates every 5 minutes
- ✅ Remove family member functionality

### Kaizer Fit Module (ENHANCED v2.1)
- ✅ 9 Activity Types: Walking, Running, Cycling, Yoga, Gym, Swimming, Sports, Dancing, Hiking
- ✅ Activity logging with duration, distance, steps, calories
- ✅ Daily/Weekly/Monthly fitness dashboard
- ✅ Fitness score calculation (0-100)
- ✅ Activity streak tracking
- ✅ Anonymized leaderboard
- ✅ Community challenges
- ✅ Ward-level statistics
- ✅ Wearable sync API (Apple Watch, Android Wear, Fitbit compatible)
- ✅ Pollution-aware exercise alerts
- ✅ **NEW: Motivational quotes banner (Telugu & English)**
- ✅ **NEW: Premium gradient UI design**
- ✅ **NEW: Steps progress bar with goal tracking**
- ✅ **NEW: Device sync button placeholder**

### Kaizer Doctor Module (v2.0)
- ✅ Health Metrics: Weight, Height, BMI, Blood Sugar, Blood Pressure
- ✅ Meal Logging with South Indian/Hyderabad food database
  - 40+ Telugu-named foods (Idli, Dosa, Biryani, Pesarattu, etc.)
  - Calorie, Protein, Carbs, Fat tracking
- ✅ Water Intake Tracking (glasses per day)
- ✅ Sleep Logging with duration and quality
- ✅ Mood Tracking (Happy, Calm, Stressed, Anxious, Sad, Energetic)
- ✅ 5 Diet Plans: Weight Loss, Weight Gain, Maintenance, Diabetic, Heart Healthy
- ✅ Daily Nutrition Summary
- ✅ Health Score calculation
- ✅ Personalized Recommendations

### AI Chat Module (v2.0)
- ✅ 5 AI Assistants:
  1. General - Platform help
  2. Health - Pollution-related health concerns
  3. Fitness - Exercise recommendations
  4. Doctor - Diet advice (South Indian focus)
  5. Psychologist - Mental wellness support
- ✅ Chat history storage in MongoDB
- ✅ Conversation context awareness
- ✅ Telugu/English language support
- ✅ Powered by GPT-4o-mini via Emergent LLM

### Citizen Benefits Module
- ✅ Health checkup registration
- ✅ Education voucher (₹50,000 with Emeritus)
- ✅ Accidental insurance enrollment
- ✅ Health insurance support (25% cashback)
- ✅ Application tracking

### Ward Expenditure Dashboard
- ✅ Year-wise expenditure view
- ✅ Category-wise breakdown
- ✅ RTI document links
- ✅ Ground reality notes

### Polls & Surveys
- ✅ Yes/No and choice-based polls
- ✅ Anonymous voting
- ✅ Live result visualization

## API Endpoints (v2.1)
- `/api/auth/*` - Authentication
- `/api/issues/*` - Issue management
- `/api/dumpyard/*` - Dump yard info
- `/api/aqi/*` - Live AQI data (dammaiguda, hyderabad, both)
- `/api/family/*` - Family tracking (members, requests, location)
- `/api/fitness/*` - Kaizer Fit (activity, dashboard, leaderboard, challenges, sync)
- `/api/doctor/*` - Kaizer Doctor (health-metrics, meal, water, sleep, mood, diet-plans)
- `/api/chat` - AI Chat
- `/api/benefits/*` - Citizen benefits
- `/api/expenditure/*` - Ward expenditure
- `/api/polls/*` - Polls and surveys
- `/api/volunteer/*` - Volunteer features
- `/api/admin/*` - Admin dashboard

## Environment Variables Configured
### Backend (.env)
- ✅ MONGO_URL, DB_NAME
- ✅ JWT_SECRET
- ✅ TWILIO_ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER
- ✅ CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
- ✅ EMERGENT_LLM_KEY (for AI Chat)
- ✅ GOOGLE_VISION_API_KEY
- ✅ **GOOGLE_MAPS_API_KEY (NEW)**

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- ✅ AQI Live Widget with Dammaiguda & Hyderabad data
- ✅ My Family location tracking module
- ✅ Google Maps API integration
- ✅ Kaizer Fit motivational enhancements

### P1 (High Priority) - IN PROGRESS
- [ ] Activate real Twilio SMS OTP
- [ ] WhatsApp share card generation
- [ ] Push notifications (PWA)
- [ ] Kaizer Doctor UI enhancement
- [ ] Smart device deep integration

### P2 (Medium Priority)
- [ ] "Psychologist AI" enhanced mode for Kaizer Doctor
- [ ] Admin content moderation tools
- [ ] Drone image gallery for dump yard
- [ ] Issue resolution time analytics
- [ ] Voice input for elderly
- [ ] Social sharing cards for fitness achievements

### P3 (Low Priority)
- [ ] PWA Offline support
- [ ] Multi-ward scalability
- [ ] Data export features

## Testing Status
- **Testing Agent:** Used after Phase 1 implementation
- **Test Report:** `/app/test_reports/iteration_3.json`
- **Backend:** 100% (15/15 tests passed)
- **Frontend:** 100% (All Phase 1 features verified)

## Test Credentials
- **Phone:** Any number (e.g., 9876543210)
- **OTP:** 123456 (MOCKED for development)

## Mocked APIs
- OTP verification uses static code `123456`
- File uploads use mock URLs (Cloudinary configured but not integrated)

## Key Files
- `/app/backend/server.py` - Main backend (monolithic, needs refactoring)
- `/app/frontend/src/pages/Dashboard.jsx` - Dashboard with AQI widget
- `/app/frontend/src/pages/MyFamily.jsx` - Family tracking page
- `/app/frontend/src/pages/AQIReport.jsx` - Full AQI report
- `/app/frontend/src/pages/KaizerFit.jsx` - Enhanced fitness module
- `/app/frontend/src/components/AQIWidget.jsx` - AQI widget component
