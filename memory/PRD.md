# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.2.0  
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
- **News:** RSS feeds + placeholder content

## User Personas
1. **Citizens** - Report issues, track fitness, access benefits, use AI chat, family tracking, read news
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

### AQI Live Widget (v2.1)
- ✅ Live AQI scraping from aqi.in
- ✅ Dammaiguda (Vayushakti Nagar station) & Hyderabad AQI
- ✅ PM2.5 and PM10 pollutant values
- ✅ Indian AQI scale calculation
- ✅ Color-coded health impact warnings (Telugu)
- ✅ Dashboard widget + Full report page

### News Shorts Module (NEW v2.2) 📰
- ✅ 10 Categories:
  1. **Local** - Dammaiguda news (స్థానిక)
  2. **City** - Hyderabad news (నగరం)
  3. **State** - Telangana news (రాష్ట్రం)
  4. **National** - India news (జాతీయ)
  5. **International** - World news (అంతర్జాతీయ)
  6. **Sports** - Sports news (క్రీడలు)
  7. **Entertainment** - Entertainment (వినోదం)
  8. **Tech** - Technology (టెక్నాలజీ)
  9. **Health** - Health news (ఆరోగ్యం)
  10. **Business** - Business news (వ్యాపారం)
- ✅ RSS feed integration (The Hindu, Hans India)
- ✅ Placeholder content for local news
- ✅ Swipeable card UI (like Inshorts/DailyHunt)
- ✅ Category tabs
- ✅ Share functionality
- ✅ Telugu-first content display

### My Family Module (ENHANCED v2.2) 👨‍👩‍👧‍👦
- ✅ Family member request/accept flow
- ✅ Relationship types: Spouse, Child, Parent, Sibling, Other
- ✅ Real-time GPS location tracking
- ✅ Location history storage
- ✅ View on Google Maps
- ✅ **SOS Emergency Alerts (NEW):**
  - 🚨 Big red SOS button on Family page
  - 1-3 emergency contacts setup
  - Sends alert with GPS location
  - Alert history tracking
- ✅ **Geo-fencing (Safe Zones) (NEW):**
  - Create safe zones for family members
  - Configurable radius (100m - 2km)
  - Inside/outside zone detection
  - Haversine formula for distance calculation

### Kaizer Fit Module (ENHANCED v2.1)
- ✅ 9 Activity Types: Walking, Running, Cycling, Yoga, Gym, Swimming, Sports, Dancing, Hiking
- ✅ Activity logging with duration, distance, steps, calories
- ✅ Fitness dashboard with scores
- ✅ Activity streak tracking
- ✅ Leaderboard & community challenges
- ✅ Motivational quotes banner (Telugu & English)
- ✅ Premium gradient UI design
- ✅ Device sync placeholder

### Kaizer Doctor Module (v2.0)
- ✅ Health Metrics tracking
- ✅ South Indian meal logging (40+ foods)
- ✅ Water/Sleep/Mood tracking
- ✅ 5 Diet Plans
- ✅ Personalized recommendations

### AI Chat Module (v2.0)
- ✅ 5 AI Assistants: General, Health, Fitness, Doctor, Psychologist
- ✅ Chat history storage
- ✅ Powered by GPT-4o-mini via Emergent LLM

### Other Modules
- ✅ Citizen Benefits
- ✅ Ward Expenditure Dashboard
- ✅ Polls & Surveys
- ✅ Dump Yard Info

## API Endpoints (v2.2)
### New in v2.2:
- `/api/news/categories` - Get all news categories
- `/api/news/{category}` - Get news by category
- `/api/news/feed/all` - Get mixed news feed
- `/api/news/save` - Save article for later
- `/api/sos/contacts` - Manage SOS emergency contacts
- `/api/sos/trigger` - Trigger SOS alert
- `/api/sos/history` - Get SOS history
- `/api/sos/resolve/{alert_id}` - Resolve SOS alert
- `/api/family/geofence` - Create geo-fence
- `/api/family/geofences/{member_id}` - Get member's geo-fences
- `/api/family/check-geofences/{member_id}` - Check geo-fence status

### Existing:
- `/api/auth/*` - Authentication
- `/api/issues/*` - Issue management
- `/api/aqi/*` - Live AQI data
- `/api/family/*` - Family tracking
- `/api/fitness/*` - Kaizer Fit
- `/api/doctor/*` - Kaizer Doctor
- `/api/chat` - AI Chat
- `/api/benefits/*`, `/api/expenditure/*`, `/api/polls/*`

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- ✅ AQI Live Widget
- ✅ My Family location tracking
- ✅ SOS Emergency Alerts
- ✅ Geo-fencing (Safe Zones)
- ✅ News Shorts module

### P1 (High Priority)
- [ ] Activate real Twilio SMS for OTP
- [ ] Activate real SMS for SOS alerts
- [ ] Cloudinary media upload integration
- [ ] Kaizer Doctor UI enhancement
- [ ] Admin moderation tools

### P2 (Medium Priority)
- [ ] Smart device integration (pedometer, smartwatch)
- [ ] "Psychologist AI" enhanced mode
- [ ] Push notifications (PWA)
- [ ] Social sharing cards for achievements
- [ ] WhatsApp share integration

### P3 (Low Priority)
- [ ] PWA Offline support
- [ ] Multi-ward scalability
- [ ] Data export features
- [ ] Refactor server.py into routers

## Testing Status
- **Backend:** 100% (24/24 tests passed)
- **Frontend:** 100% (All features verified)
- **Test Reports:** `/app/test_reports/iteration_4.json`

## Test Credentials
- **Phone:** Any number (e.g., 9876543210)
- **OTP:** 123456 (MOCKED)

## Mocked APIs
1. OTP verification - uses static code `123456`
2. News local/city/state - uses placeholder data when RSS unavailable
3. SOS alerts - records in database but doesn't send actual SMS
4. File uploads - mock URLs (Cloudinary configured but not integrated)

## Key Files
- `/app/backend/server.py` - Main backend (1500+ lines, needs refactoring)
- `/app/frontend/src/pages/NewsShorts.jsx` - News shorts UI
- `/app/frontend/src/pages/MyFamily.jsx` - Family tracking + SOS + Geofencing
- `/app/frontend/src/pages/Dashboard.jsx` - Dashboard with AQI + News
- `/app/frontend/src/components/AQIWidget.jsx` - AQI widget

## Environment Variables
### Backend (.env)
- ✅ MONGO_URL, DB_NAME
- ✅ JWT_SECRET
- ✅ TWILIO_ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER
- ✅ CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
- ✅ EMERGENT_LLM_KEY
- ✅ GOOGLE_VISION_API_KEY
- ✅ GOOGLE_MAPS_API_KEY
