# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.5.1  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)
**Last Updated:** December 18, 2025

## What's Been Implemented (v2.5.1)

### ✅ Frontend UI for P1/P2 Features (NEW)

**1. Psychologist AI UI in Kaizer Doctor**
- New "Mind" tab in Kaizer Doctor page
- AI chat interface with Kaizer Mind assistant
- Quick prompt suggestions for common topics
- Message history with user/AI distinction
- Emergency helplines card (iCall, Vandrevala Foundation)
- data-testid: mind-tab, psych-input, psych-send-btn

**2. Smart Device UI in Kaizer Fit**
- Smart Devices card with connected devices list
- Add Device dialog (Phone/Smartwatch selection)
- Smartwatch brand selector (Apple, Samsung, Fitbit, Garmin, Mi, Amazfit)
- Sync button for each connected device
- Disconnect device functionality
- data-testid: add-device-btn

**3. Notification Preferences UI in Profile**
- Master push notification toggle
- 6 individual notification type toggles:
  - SOS Alerts, Geo-fence Alerts, News Updates
  - Community Updates, Health Reminders, Challenge Updates
- Visual icons and descriptions for each type
- data-testid: push-toggle

### Backend Features (v2.5.0)
- Enhanced News Scraper (multi-source, AI rephrasing, admin push)
- Smart Device Integration APIs (phone sensors, smartwatch sync)
- Psychologist AI "Kaizer Mind" (chat + assessment)
- PWA Push Notification infrastructure

## Testing Status (v2.5.1)
- **Frontend:** 100% (10/10 tests passed)
- **Backend:** 100% (36/36 tests passed)
- **Test Reports:** `/app/test_reports/iteration_7.json`

## Bugs Fixed in This Session
1. **KaizerDoctor.jsx:** Diet plans API returns object - fixed with conversion
2. **KaizerFit.jsx:** Leaderboard total_steps field mismatch - fixed with fallback

## Test Credentials
- **Phone:** Any number (e.g., 9876543210)
- **OTP:** 123456 (MOCKED)

## Mocked APIs
1. OTP verification - static code `123456`
2. Media uploads - base64 data URLs
3. Group Chat - client-side only (IndexedDB)
4. SOS alerts - DB record only (NO actual SMS)
5. Push notifications - DB polling (NO real webpush)
6. Smart device sync - simulated sensor data

## Key Files (v2.5.1)
```
/app/frontend/src/pages/
├── KaizerDoctor.jsx  - Mind tab with Psychologist AI
├── KaizerFit.jsx     - Smart Devices card
├── Profile.jsx       - Notification preferences
├── CitizenWall.jsx   - Posts + Groups + Chat
└── ...

/app/backend/routers/
├── doctor.py         - Psychologist AI endpoints
├── fitness.py        - Smart device sync endpoints
├── notifications.py  - Push notification service
├── news.py           - Enhanced news scraper
└── ...
```

## Prioritized Backlog

### Completed ✅
- Citizen Wall with posts, groups, client-side chat
- Kaizer Doctor UI + Psychologist AI
- Kaizer Fit + Smart Device integration
- News Scraper improvements
- PWA Push Notification infrastructure
- Notification preferences UI

### Remaining P1
- [ ] Activate real Twilio SMS for OTP
- [ ] Cloudinary media upload integration
- [ ] SOS alerts with real SMS

### P2/Future
- [ ] Real webpush with VAPID keys
- [ ] PWA Offline support
- [ ] Multi-ward scalability
- [ ] Data export features
- [ ] Real-time chat (WebSocket)
