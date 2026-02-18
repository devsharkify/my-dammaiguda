# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.7.0  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)
**Last Updated:** February 18, 2026

## What's Been Implemented (v2.7.0)

### ✅ Live Activity Tracking (NEW)
- **Activity selection dialog** from Kaizer Fit page
- **9 activity types:** Running, Walking, Cycling, Yoga, Gym, Swimming, Sports, Dancing, Hiking
- **Real-time tracking:** Timer, Distance, Calories, Steps, Heart Rate (simulated)
- **GPS tracking:** For applicable activities (running, walking, cycling, hiking, football)
- **Session management:** Start, Pause/Resume, Stop, Discard
- **Activity history:** View past live-tracked activities
- **MET-based calorie calculation** for accurate burn estimates
- **Route: `/live-activity/:activityType`**

### ✅ Stories/Status Feature (WhatsApp/Instagram Style)
- **24-hour stories** with automatic expiry
- **Content types:** Text, Photos, Videos
- **Text stories:** Custom background colors
- **Viewer tracking:** See who viewed your stories
- **Story creation dialog:** Select type, preview, post
- **Story viewer:** Full-screen with progress bar, navigation
- **Delete stories:** Remove your own stories
- **Stories bar:** Horizontal scroll on Dashboard

### ✅ Dashboard Redesign
- **Stories bar at top** - Add story button + user stories
- **Compact quick actions** - 4 icons (Report, Fit, Doctor, News)
- **Groups quick access** - Show user's groups with avatars
- **Citizen Wall card** - Quick link to posts/groups/chat
- **AQI Widget** - Live air quality
- **Recent Issues** - Latest reported problems

### ✅ News Tinder-Style
- **Vertical swipe** - Swipe up/down for next/prev article
- **Full-screen cards** - Gradient backgrounds with images
- **Telugu content** - Title/summary in Telugu when toggled
- **NO source display** - Only category badge shown
- **Category pills** - Horizontal scroll with icons
- **Progress indicator** - "1/14" counter

### Previous Features
- Citizen Wall (posts, groups, client-side chat)
- Psychologist AI "Kaizer Mind"
- Smart Device integration (phone, smartwatch)
- Enhanced News Scraper (multi-source, AI rephrasing)
- PWA Push Notifications infrastructure
- Kaizer Fit + Kaizer Doctor premium UI

## API Endpoints (v2.7)

### Live Activity API (NEW)
- `POST /api/fitness/live/start` - Start live tracking session
- `POST /api/fitness/live/update` - Update session with stats/GPS
- `POST /api/fitness/live/end` - End session and save activity
- `GET /api/fitness/live/active` - Get user's active session
- `DELETE /api/fitness/live/{session_id}` - Cancel/discard session
- `GET /api/fitness/live/history` - Get live-tracked activities
- `GET /api/fitness/activity-types` - Get all activity types with MET values

### Stories API
- `POST /api/stories/create` - Create story (text/image/video)
- `GET /api/stories/feed` - Get stories feed grouped by user
- `GET /api/stories/my` - Get own active stories
- `POST /api/stories/view` - Mark story as viewed
- `GET /api/stories/{id}/viewers` - Get story viewers (owner only)
- `DELETE /api/stories/{id}` - Delete own story

## Testing Status (v2.7.0)
- **Backend:** 100% (18/18 live activity tests passed)
- **Frontend:** 100% (10/10 live activity features verified)
- **Test Report:** `/app/test_reports/iteration_9.json`

## Key Files (v2.7.0)
```
/app/backend/routers/
├── fitness.py     - Live activity endpoints (lines 130-305)
├── stories.py     - Stories/Status API
└── ...

/app/frontend/src/pages/
├── LiveActivity.jsx   - Live tracking UI (NEW)
├── KaizerFit.jsx      - Start Live Activity button + dialog
├── Dashboard.jsx      - Stories bar + Groups
└── ...
```

## Test Credentials
- **Phone:** Any number (e.g., 9876543210)
- **OTP:** 123456 (MOCKED)

## Mocked APIs
1. OTP verification - static code `123456`
2. Media uploads - base64 data URLs
3. Stories media - base64
4. Group Chat - client-side only (IndexedDB)
5. SOS alerts - DB record only (NO actual SMS)
6. Push notifications - DB polling (NO real webpush)
7. Heart rate during live tracking - simulated based on activity type

## Remaining Backlog

### P0 (Pending User Request)
- [ ] Public/Private Groups in Citizen Wall
- [ ] Admin-injected video ads in News/Stories feeds

### P1 (High Priority)
- [ ] Activate real Twilio SMS for OTP
- [ ] Cloudinary media upload integration
- [ ] SOS alerts with real SMS

### P2 (Medium Priority)
- [ ] Real webpush with VAPID keys
- [ ] PWA Offline support
- [ ] Google Maps integration for live tracking routes

### P3 (Future)
- [ ] Multi-ward scalability
- [ ] Real-time chat (WebSocket)
- [ ] Data export features
