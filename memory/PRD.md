# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.5.0  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)
**Last Updated:** December 18, 2025

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python) - Modular Router Structure
- **Database:** MongoDB
- **AI:** Emergent LLM (GPT-4o-mini via Emergent integrations)
- **Authentication:** Phone OTP (Mock for dev - static 123456)
- **Media:** Cloudinary (configured but NOT integrated - uses base64)
- **Maps:** Google Maps API (configured)
- **AQI Data:** Live scraping from aqi.in
- **News:** Multi-source RSS + Web scraping + AI rephrasing

## What's Been Implemented (v2.5.0)

### ✅ P1: Enhanced News Scraper (NEW)
- **Multi-source aggregation:**
  - Deccan Chronicle, Times of India, Siasat
  - Telangana Today, The Hindu, Hans India
  - Telugu sources: Eenadu, Sakshi, TV9
- **AI Rephrasing:** Optional Emergent LLM integration for original content
- **Admin Features:**
  - Push/create news articles
  - Pin to top functionality
  - Edit/delete pushed articles
- **Deduplication:** Removes duplicate articles by title

### ✅ P2: Smart Device Integration (NEW)
- **Phone Pedometer Sync:**
  - Steps, distance, calories, active minutes
  - Auto-updates existing daily record
  - Sources: phone_pedometer, health_kit, google_fit
- **Smartwatch Sync:**
  - Full health data: steps, heart rate, SpO2, stress
  - Sleep data: duration, deep/light/REM sleep, quality
  - Supports: Apple, Samsung, Fitbit, Garmin, Mi, Amazfit
- **Device Management:**
  - Connect/disconnect devices
  - Track last sync time
  - Permission management

### ✅ P2: Psychologist AI - "Kaizer Mind" (NEW)
- **Conversational Therapy:**
  - Empathetic AI assistant powered by Emergent LLM
  - CBT techniques, mindfulness, stress management
  - Session history stored in DB
- **Mental Health Assessment:**
  - Structured self-assessment form
  - Wellness score calculation (0-100)
  - Risk level detection (low/moderate/high)
  - Personalized recommendations
- **Safety Features:**
  - Emergency helpline information
  - Professional help recommendations for high-risk

### ✅ P2: PWA Push Notifications (NEW)
- **Subscription Management:**
  - Subscribe/unsubscribe endpoints
  - Multiple device support per user
- **Notification Preferences:**
  - SOS alerts, geo-fence alerts
  - News updates, community updates
  - Health reminders, challenge updates
- **Trigger Functions:**
  - SOS emergency notifications
  - Geo-fence breach alerts
  - News push notifications
  - Community activity alerts
- **Note:** Currently uses DB polling (MOCKED) - real webpush requires VAPID keys

### ✅ Previous Features (v2.4 and earlier)
- Citizen Wall with posts, groups, client-side chat
- Kaizer Doctor UI (premium enterprise design)
- Kaizer Fit (fitness tracking, challenges, leaderboard)
- AQI Widget, My Family, SOS, News Shorts
- AI Chat with 5 assistants

## API Endpoints (v2.5)

### News (Enhanced)
- `GET /api/news/categories` - All categories
- `GET /api/news/{category}?use_ai=false&limit=20` - Category news
- `GET /api/news/feed/all?use_ai=false` - Mixed feed
- `POST /api/news/admin/push` - Admin: Push article
- `PUT /api/news/admin/news/{id}` - Admin: Update article
- `POST /api/news/admin/news/{id}/pin` - Admin: Toggle pin

### Smart Device Integration
- `POST /api/fitness/sync/phone-sensors` - Phone pedometer sync
- `POST /api/fitness/sync/smartwatch` - Smartwatch full sync
- `POST /api/fitness/devices/connect` - Connect device
- `GET /api/fitness/devices` - List connected devices
- `DELETE /api/fitness/devices/{id}` - Disconnect device
- `GET /api/fitness/health-data/heart-rate` - HR history
- `GET /api/fitness/health-data/sleep` - Sleep history

### Psychologist AI
- `POST /api/doctor/psychologist/chat` - AI chat
- `POST /api/doctor/psychologist/assessment` - Submit assessment
- `GET /api/doctor/psychologist/history` - Chat history
- `GET /api/doctor/psychologist/assessments` - Assessment history

### Push Notifications
- `POST /api/notifications/subscribe` - Subscribe
- `DELETE /api/notifications/subscribe` - Unsubscribe all
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `GET /api/notifications/pending` - Poll pending (dev mode)
- `GET /api/notifications/history` - Notification history
- `POST /api/notifications/admin/broadcast` - Admin broadcast

## Testing Status (v2.5)
- **Backend:** 100% (36/36 tests passed)
- **Test Report:** `/app/test_reports/iteration_6.json`

## Test Credentials
- **Phone:** Any number (e.g., 9876543210)
- **OTP:** 123456 (MOCKED)

## Mocked APIs
1. **OTP verification** - static code `123456`
2. **Media uploads** - base64 data URLs (Cloudinary NOT integrated)
3. **Group Chat** - client-side only (IndexedDB)
4. **SOS alerts** - DB record only (NO actual SMS)
5. **Push notifications** - DB polling (NO real webpush)

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- ✅ Citizen Wall with posts and groups
- ✅ Group Chat with client-side storage
- ✅ Kaizer Doctor UI enhancement

### P1 (High Priority) - COMPLETED ✅
- ✅ News Scraper (multi-source, AI rephrasing, admin push)
- [ ] Activate real Twilio SMS for OTP
- [ ] Cloudinary media upload integration
- [ ] SOS alerts with real SMS

### P2 (Medium Priority) - COMPLETED ✅
- ✅ Smart device integration (phone pedometer, smartwatch)
- ✅ Psychologist AI (conversational + assessment)
- ✅ PWA push notification infrastructure

### P3 (Future)
- [ ] Real webpush with VAPID keys
- [ ] PWA Offline support
- [ ] Multi-ward scalability
- [ ] Data export features
- [ ] Real-time chat (WebSocket)

## Key Files (v2.5)
```
/app/backend/
├── server.py - Main FastAPI app (v2.5.0)
└── routers/
    ├── news.py - Enhanced multi-source scraper + AI
    ├── fitness.py - Smart device integration
    ├── doctor.py - Psychologist AI feature
    ├── notifications.py - PWA push service (NEW)
    ├── wall.py - Citizen Wall
    └── ... (auth, aqi, family, sos, chat, issues)
```

## Environment Variables
### Backend (.env)
- MONGO_URL, DB_NAME, JWT_SECRET
- EMERGENT_LLM_KEY (used for AI Chat + Psychologist + News rephrasing)
- TWILIO_ACCOUNT_SID, AUTH_TOKEN (configured, NOT used)
- CLOUDINARY_CLOUD_NAME, API_KEY (configured, NOT used)
- GOOGLE_MAPS_API_KEY

## Next Steps
1. **Production Integrations:**
   - Twilio SMS for real OTP
   - Cloudinary for media uploads
   - VAPID keys for real webpush
2. **Frontend Enhancement:**
   - Add Psychologist AI UI to Kaizer Doctor
   - Add Smart Device connection UI to Kaizer Fit
   - Add Notification preferences UI to Settings
