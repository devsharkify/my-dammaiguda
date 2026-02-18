# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.6.0  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)
**Last Updated:** December 18, 2025

## What's Been Implemented (v2.6.0)

### ✅ Stories/Status Feature (NEW - WhatsApp/Instagram Style)
- **24-hour stories** with automatic expiry
- **Content types:** Text, Photos, Videos
- **Text stories:** Custom background colors
- **Viewer tracking:** See who viewed your stories
- **Story creation dialog:** Select type, preview, post
- **Story viewer:** Full-screen with progress bar, navigation
- **Delete stories:** Remove your own stories
- **Stories bar:** Horizontal scroll on Dashboard

### ✅ Dashboard Redesign (NEW)
- **Stories bar at top** - Add story button + user stories
- **Compact quick actions** - 4 icons (Report, Fit, Doctor, News)
- **Groups quick access** - Show user's groups with avatars
- **Citizen Wall card** - Quick link to posts/groups/chat
- **AQI Widget** - Live air quality
- **Recent Issues** - Latest reported problems

### ✅ News Tinder-Style (NEW)
- **Vertical swipe** - Swipe up/down for next/prev article
- **Full-screen cards** - Gradient backgrounds with images
- **Telugu content** - Title/summary in Telugu when toggled
- **NO source display** - Only category badge shown
- **Category pills** - Horizontal scroll with icons
- **Progress indicator** - "1/14" counter
- **Keyboard navigation** - Arrow keys or j/k

### Previous Features (v2.5.x)
- Citizen Wall (posts, groups, client-side chat)
- Psychologist AI "Kaizer Mind"
- Smart Device integration (phone, smartwatch)
- Enhanced News Scraper (multi-source, AI rephrasing)
- PWA Push Notifications infrastructure
- Kaizer Fit + Kaizer Doctor premium UI

## API Endpoints (v2.6)

### Stories API (NEW)
- `POST /api/stories/create` - Create story (text/image/video)
- `GET /api/stories/feed` - Get stories feed grouped by user
- `GET /api/stories/my` - Get own active stories
- `POST /api/stories/view` - Mark story as viewed
- `GET /api/stories/{id}/viewers` - Get story viewers (owner only)
- `DELETE /api/stories/{id}` - Delete own story
- `GET /api/stories/user/{user_id}` - Get user's stories

### News API (Updated)
- Category endpoints now return Telugu content (title_te, summary_te)
- Source field NOT displayed in frontend

## Testing Status (v2.6.0)
- **Backend:** 100% (26/26 tests passed)
- **Frontend:** 100% (14/14 features verified)
- **Test Report:** `/app/test_reports/iteration_8.json`

## Key Files (v2.6.0)
```
/app/backend/routers/
├── stories.py     - Stories/Status API (NEW)
├── news.py        - Enhanced with Telugu content
└── ...

/app/frontend/src/pages/
├── Dashboard.jsx  - Stories bar + Groups (REDESIGNED)
├── NewsShorts.jsx - Tinder-style swipe (REDESIGNED)
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

## Remaining Backlog

### P1 (High Priority)
- [ ] Activate real Twilio SMS for OTP
- [ ] Cloudinary media upload integration
- [ ] SOS alerts with real SMS

### P2 (Medium Priority)
- [ ] Real webpush with VAPID keys
- [ ] PWA Offline support

### P3 (Future)
- [ ] Multi-ward scalability
- [ ] Real-time chat (WebSocket)
- [ ] Data export features
