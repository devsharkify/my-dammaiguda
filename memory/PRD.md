# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 3.4.0  
**Last Updated:** December 19, 2025

## What's Been Implemented (v3.4.0)

### ✅ Web Push Notifications (NEW)
- **Real VAPID Key Integration**
  - VAPID keys generated and configured in backend/.env
  - `/api/notifications/vapid-public-key` - Returns public key for frontend
  - Real web push via `pywebpush` library
- **Frontend Push Subscription**
  - `usePushNotifications` hook (`/hooks/usePushNotifications.js`)
  - Browser permission request
  - Subscription management (subscribe/unsubscribe)
  - Test notification button in Profile
- **Service Worker Push Handling**
  - Push event listener in `/public/service-worker.js`
  - Notification display with actions
  - Click handling with navigation

### ✅ Enhanced AQI Widget (NEW)
- **Two Side-by-Side Cards on Dashboard**
  - Hyderabad citywide AQI
  - Dammaiguda local AQI
- **Status Text with Color Coding**
  - Good (మంచి) - Green
  - Moderate (మధ్యస్థం) - Yellow
  - Poor (చెడు) - Orange
  - Unhealthy (అనారోగ్యకరమైన) - Red
  - Very Unhealthy - Purple
  - Hazardous (ప్రమాదకరమైన) - Rose

### Previous Features (v3.0-3.3)
- PWA Offline Support (v3.3.0)
- Google Maps for live activity tracking (v3.2.0)
- Daily Fitness Streak & 10 Badges (v3.1.0)
- Premium Kaizer Fit with weight tracker (v3.0.0)
- Dashboard redesign with widgets
- Stories feature (24-hour ephemeral)
- Citizen Wall with groups
- News Shorts with AI rephrasing
- Admin-injected ads

## Key Files (v3.4.0)
```
/app/backend/
├── .env                    - VAPID keys added
├── private_key.pem         - VAPID private key file
├── public_key.pem          - VAPID public key file
└── routers/
    ├── notifications.py    - Real push implementation
    └── aqi.py              - /both endpoint for dual AQI

/app/frontend/
├── public/
│   └── service-worker.js   - Push event handling
└── src/
    ├── hooks/
    │   └── usePushNotifications.js  - NEW
    └── pages/
        ├── Dashboard.jsx   - Dual AQI widgets
        └── Profile.jsx     - Push toggle with test button
```

## Test Credentials
- **Phone:** 9876543210
- **OTP:** 123456 (MOCKED - uses static code)

## API Endpoints (New)
- `GET /api/notifications/vapid-public-key` - Get VAPID public key
- `POST /api/notifications/test` - Send test notification to user
- `GET /api/aqi/both` - Get AQI for both Hyderabad and Dammaiguda

## Remaining Backlog

### P0 (Critical - Blocking Production)
- [ ] **Real Twilio SMS for OTP** - Currently uses static OTP 123456
- [ ] **Cloudinary Media Uploads** - Issues, Wall, Stories all use mocked uploads

### P1 (High Priority)
- [ ] Fix badge count display bug in KaizerFit.jsx (shows 0 initially)
- [ ] Admin dashboard for ad management

### P2 (Medium Priority)
- [ ] Social sharing cards
- [ ] Data export features
- [ ] WebSocket real-time chat

### P3 (Low Priority)
- [ ] Refactor Dashboard.jsx (extract widgets to components)
- [ ] Refactor KaizerFit.jsx (extract sub-components)

## 3rd Party Integrations Status

| Integration | Status | Notes |
|-------------|--------|-------|
| Emergent LLM Key | ✅ Integrated | AI features |
| Web Push (VAPID) | ✅ Integrated | Real push notifications |
| Google Maps API | ⚠️ Partial | UI ready, needs user API key |
| Twilio SMS | ❌ Not Integrated | OTP is mocked |
| Cloudinary | ❌ Not Integrated | Uploads mocked |

## Architecture Notes
- Backend: FastAPI + Motor (async MongoDB)
- Frontend: React 19 + Tailwind + Shadcn UI
- PWA: Service Worker with caching strategies
- Auth: JWT tokens (OTP flow mocked)
