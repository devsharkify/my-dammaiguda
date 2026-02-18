# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.4.0  
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
- **News:** RSS feeds + placeholder content

## User Personas
1. **Citizens** - Report issues, track fitness, access benefits, use AI chat, family tracking, read news, Citizen Wall
2. **Volunteers** - Verify reported issues, assist elderly
3. **Admins** - Manage content, view analytics, moderate

## What's Been Implemented

### ✅ Citizen Wall & Group Chat (NEW v2.4)
- **Posts Feed:**
  - Create text, photo, video posts
  - Like/unlike posts with live count update
  - Comment on posts with dialog UI
  - Share posts (native share or clipboard)
  - Visibility: Public or Colony-only
- **Groups:**
  - Create public/private groups
  - Join public groups
  - Discover groups section
  - Group invites system with accept/decline
  - Leave group functionality
- **Group Chat (Client-Side Storage):**
  - Uses IndexedDB for storing messages locally
  - ~500 message limit per group
  - Messages NOT synced to server
  - Clear indicator: "Messages stored only on your device"

### ✅ Kaizer Doctor UI Enhancement (NEW v2.4)
- Premium enterprise-grade UI matching Kaizer Fit
- Motivational health quotes banner
- Health score card with BMI display
- Quick action buttons with gradient design
- Enhanced dialogs for:
  - Water tracking with progress bar
  - Meal logging with food search
  - Health metrics (weight, height, BP, blood sugar)
  - Mood logging with visual selection
  - Sleep logging with quality stars
- Health recommendations section
- Tabbed interface: Nutrition, Vitals, Plans

### ✅ Backend Refactoring (v2.3)
- Modular router structure in `/app/backend/routers/`
- Routes: auth, aqi, family, sos, news, fitness, doctor, chat, wall, issues
- Added route aliases for frontend compatibility (/send-otp, /verify-otp)

### ✅ Previous Features (v2.0-2.2)
- Phone OTP login (Mock OTP: 123456)
- Issue Reporting with 7 categories
- AQI Live Widget (Dammaiguda + Hyderabad)
- My Family Module with GPS tracking
- SOS Emergency Alerts (stub - no SMS)
- Geo-fencing/Safe Zones
- News Shorts (RSS + placeholder)
- Kaizer Fit (enhanced premium UI)
- AI Chat with 5 assistants
- Citizen Benefits, Expenditure Dashboard, Polls

## API Endpoints (v2.4)

### Citizen Wall (NEW)
- `GET /api/wall/posts` - Get posts feed
- `POST /api/wall/post` - Create post (text/image/video)
- `POST /api/wall/post/{id}/like` - Like/unlike post
- `POST /api/wall/post/{id}/comment` - Add comment
- `GET /api/wall/post/{id}` - Get post with comments
- `DELETE /api/wall/post/{id}` - Delete own post
- `POST /api/wall/group` - Create group
- `GET /api/wall/groups` - Get user's groups
- `GET /api/wall/groups/discover` - Discover public groups
- `POST /api/wall/group/{id}/join` - Join public group
- `POST /api/wall/group/{id}/leave` - Leave group
- `POST /api/wall/group/{id}/invite` - Invite to group
- `GET /api/wall/group-invites` - Get pending invites
- `POST /api/wall/group-invite/{id}/respond` - Accept/decline invite

### Auth Routes (aliases added)
- `POST /api/auth/otp` OR `/api/auth/send-otp`
- `POST /api/auth/verify` OR `/api/auth/verify-otp`
- `PUT /api/auth/me` OR `/api/auth/profile`

## Key Database Schema
- **wall_posts:** `{id, user_id, user_name, content, image_url, video_url, visibility, likes[], comments_count, created_at}`
- **wall_comments:** `{id, post_id, user_id, user_name, content, created_at}`
- **groups:** `{id, name, description, is_private, created_by, members[], members_count, created_at}`
- **group_invites:** `{id, group_id, group_name, invited_user_id, invited_by, status, created_at}`

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- ✅ Citizen Wall with posts and groups
- ✅ Group Chat with client-side storage
- ✅ Kaizer Doctor UI enhancement

### P1 (High Priority) - NEXT
- [ ] News Scraper improvements (more sources, rephrasing, admin push)
- [ ] Activate real Twilio SMS for OTP
- [ ] Cloudinary media upload integration
- [ ] SOS alerts with real SMS

### P2 (Medium Priority)
- [ ] Smart device integration (pedometer, smartwatch)
- [ ] "Psychologist AI" enhanced mode
- [ ] PWA push notifications for SOS/geo-fencing
- [ ] Social sharing cards

### P3 (Low Priority)
- [ ] PWA Offline support
- [ ] Multi-ward scalability
- [ ] Data export features

## Testing Status
- **Citizen Wall Backend:** 100% (26/26 tests passed)
- **Citizen Wall Frontend:** 100% verified
- **Test Report:** `/app/test_reports/iteration_5.json`

## Test Credentials
- **Phone:** Any number (e.g., 9876543210)
- **OTP:** 123456 (MOCKED)

## Mocked APIs
1. **OTP verification** - uses static code `123456`
2. **Media uploads** - uses base64 data URLs (Cloudinary NOT integrated)
3. **Group Chat** - client-side only (IndexedDB)
4. **SOS alerts** - records in database but NO actual SMS sent

## Key Files
- `/app/backend/server.py` - Main FastAPI app with router imports
- `/app/backend/routers/` - Modular backend routers
- `/app/frontend/src/pages/CitizenWall.jsx` - Posts + Groups + Chat
- `/app/frontend/src/pages/KaizerDoctor.jsx` - Enhanced health UI
- `/app/frontend/src/pages/KaizerFit.jsx` - Fitness tracking (premium)
- `/app/memory/PRD.md` - This file

## Code Architecture
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   └── routers/
│       ├── auth.py, aqi.py, chat.py, doctor.py
│       ├── family.py, fitness.py, issues.py
│       ├── news.py, sos.py, utils.py, wall.py
├── frontend/
│   ├── src/
│   │   ├── components/ (AQIWidget, Layout, ui/*)
│   │   ├── pages/ (CitizenWall, KaizerDoctor, etc.)
│   │   ├── context/ (AuthContext, LanguageContext)
│   │   └── App.js
│   └── package.json
└── memory/
    └── PRD.md
```

## Environment Variables
### Backend (.env)
- MONGO_URL, DB_NAME, JWT_SECRET
- TWILIO_ACCOUNT_SID, AUTH_TOKEN (configured, NOT used)
- CLOUDINARY_CLOUD_NAME, API_KEY (configured, NOT used)
- EMERGENT_LLM_KEY (used for AI Chat)
- GOOGLE_MAPS_API_KEY

## Bug Fixes in This Session
1. **Dashboard.jsx** - Fixed `recentIssues.map is not a function` error (API returns `{issues: [...]}` not array)
2. **auth.py** - Added route aliases for frontend compatibility (`/send-otp`, `/verify-otp`, `/profile`)

## Next Steps for Future Agent
1. **News Scraper:** Implement reliable scraping with multiple fallback sources
2. **Real API Integrations:** Twilio SMS, Cloudinary uploads
3. **Advanced Features:** Psychologist AI, PWA push notifications
