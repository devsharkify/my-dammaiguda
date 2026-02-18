# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.8.0  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)
**Last Updated:** February 18, 2026

## What's Been Implemented (v2.8.0)

### ✅ Dashboard Redesign (NEW)
- **Quick Actions (4 buttons):** Report, Fit, Doctor, News
- **Removed:** Dump, Wall, AI Chat buttons
- **Bottom Nav (3 items):** Home, News, Wall
- **Removed:** Issues, Kaizer Fit from bottom nav
- **Wall Widget:** Medium-sized card showing latest citizen wall post
- **Benefits Slider:** Horizontal scroll with 4 benefit cards
  - Senior Pension (₹2,500/month)
  - Free Health Camp
  - Education Scholarship (₹15,000/year)
  - Ration Card Benefits
- **Groups Section:** Quick access to user's groups

### ✅ Public/Private Groups
- Group creation dialog has privacy toggle
- Private groups require invitation to join
- Public groups can be discovered and joined directly

### ✅ Admin-Injected Ads in News Feed
- Backend endpoints for admin to create/manage ads
- Frontend injects ads every 5 news articles
- Ads show with "Sponsored" badge and CTA button
- Supports image and video ad types

### ✅ Live Activity Tracking
- Activity selection: Running, Walking, Cycling, Yoga, Gym, Swimming, Sports, Dancing, Hiking
- Real-time tracking: Timer, Distance, Calories, Steps
- GPS tracking for applicable activities
- Session management: Start, Pause/Resume, Stop, Discard

### Previous Features
- Stories/Status (24-hour ephemeral)
- News Tinder-Style swipe UI
- Citizen Wall with posts, groups, client-side chat
- Psychologist AI "Kaizer Mind"
- Smart Device integration
- PWA Push Notifications infrastructure
- Kaizer Fit + Kaizer Doctor premium UI

## API Endpoints (v2.8)

### Admin Ads API
- `POST /api/stories/admin/ad` - Create ad (admin only)
- `GET /api/stories/admin/ads` - List all ads (admin only)
- `PUT /api/stories/admin/ad/{id}` - Update ad (admin only)
- `DELETE /api/stories/admin/ad/{id}` - Delete ad (admin only)
- `GET /api/stories/ads/stories` - Get story ads (all users)
- `GET /api/stories/ads/news` - Get news ads (all users)
- `POST /api/stories/ads/{id}/impression` - Record impression
- `POST /api/stories/ads/{id}/click` - Record click

### Key Files (v2.8.0)
```
/app/frontend/src/
├── pages/
│   ├── Dashboard.jsx     - Redesigned with Wall Widget, Benefits Slider
│   ├── NewsShorts.jsx    - Admin ads injection every 5 articles
│   ├── CitizenWall.jsx   - Public/private group toggle
│   └── LiveActivity.jsx  - Live fitness tracking
├── components/
│   └── Layout.jsx        - 3-item bottom nav (Home, News, Wall)
```

## Testing Status (v2.8.0)
- **Frontend:** 100% (15/15 features verified)
- **Test Report:** `/app/test_reports/iteration_10.json`

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
- [ ] Google Maps integration for live tracking routes
- [ ] Activate real Twilio SMS for OTP
- [ ] Cloudinary media upload integration
- [ ] SOS alerts with real SMS

### P2 (Medium Priority)
- [ ] Real webpush with VAPID keys
- [ ] PWA Offline support
- [ ] Stories ad injection (between user stories)

### P3 (Future)
- [ ] Multi-ward scalability
- [ ] Real-time chat (WebSocket)
- [ ] Data export features
