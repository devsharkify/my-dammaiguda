# My Dammaiguda - Product Requirements Document

## Project Overview
**My Dammaiguda** is a production-ready, mobile-first civic engagement platform for citizens of Dammaiguda. The platform is minimalistic, fast, low-data, and trust-focused.

## 🚀 PRODUCTION DEPLOYMENT - COMPLETED (Feb 20, 2026)

### Live URLs:
- **Frontend:** https://www.mydammaiguda.in ✅
- **Backend:** https://sparkling-abundance-production-0143.up.railway.app ✅
- **Database:** MongoDB Atlas (Mumbai region) ✅
- **Domain Forwarding:** mydammaiguda.in → www.mydammaiguda.in ✅

### Hosting:
- **Platform:** Railway
- **Database:** MongoDB Atlas (Free Tier, Mumbai ap-south-1)
- **Domain:** GoDaddy (mydammaiguda.in)

---

## Core Modules Implemented

### 1. User Authentication ✅
- OTP-based login via Authkey.io
- JWT token authentication
- Admin role support

### 2. Issue Reporting ✅
- Report civic issues with photos
- Track issue status
- Admin moderation

### 3. News Feed ✅
- Scraped news from multiple sources
- Admin-pushed video/text news
- YouTube video support (including Shorts)

### 4. AQI Monitoring ✅
- Real-time air quality data
- Dammaiguda & Hyderabad sections

### 5. Astrology Module ✅
- Kundali generation
- Marriage compatibility
- Daily/Weekly/Monthly horoscopes

### 6. Kaizer Fit (Health & Fitness) ✅
- Google Fit integration
- Workout tracking
- AI nutrition advisor

### 7. Admin Dashboard ✅
- News management
- Issue moderation
- Image uploads via Cloudinary

### 8. PWA & Play Store Ready ✅
- Complete icon set
- Optimized manifest.json
- Privacy Policy page
- Delete Account page (Play Store requirement)

---

## Tech Stack

### Frontend:
- React 19
- Tailwind CSS
- Shadcn/UI components
- PWA with Service Workers

### Backend:
- FastAPI (Python)
- Motor (async MongoDB)
- Pydantic models

### Database:
- MongoDB Atlas

### Integrations:
- Authkey.io (SMS OTP)
- Cloudinary (Image storage)
- OpenAI GPT-4o-mini (AI features)
- Google Fit API

---

## Environment Variables

### Backend (.env):
```
MONGO_URL=mongodb+srv://...
DB_NAME=dammaiguda_db
CORS_ORIGINS=*
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
AUTHKEY_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_FIT_CLIENT_ID=...
GOOGLE_FIT_CLIENT_SECRET=...
```

### Frontend (.env):
```
REACT_APP_BACKEND_URL=https://sparkling-abundance-production-0143.up.railway.app
CI=false
DISABLE_ESLINT_PLUGIN=true
```

---

## Completed Tasks (This Session)

1. ✅ MongoDB Atlas setup (Mumbai region)
2. ✅ Railway backend deployment
3. ✅ Railway frontend deployment
4. ✅ Custom domain connection (www.mydammaiguda.in)
5. ✅ Domain forwarding (mydammaiguda.in → www)
6. ✅ Fixed emergentintegrations dependency (replaced with direct OpenAI calls)
7. ✅ Fixed ESLint build errors
8. ✅ DNS configuration in GoDaddy

---

## Pending/Future Tasks

### P0 - Immediate:
- [ ] Complete Google Play Store submission
- [ ] Google Fit OAuth verification (user testing on live domain)

### P1 - High Priority:
- [ ] Update Play Store listing with production URLs
- [ ] Test OTP flow with real phone numbers
- [ ] Remove test OTP backdoor (123456) for production security (after Play Store approval)
- [ ] Apple App Store submission
- [x] ✅ Calorie Counter Enhancement (COMPLETED - Feb 21, 2026)

### P2 - Medium Priority:
- [x] ✅ White-label replication architecture (COMPLETED - Feb 20, 2026)
- [x] ✅ Clone Generator Tool - CLI + Admin UI (COMPLETED - Feb 20, 2026)
- [x] ✅ Multi-Area Admin Panel with Area Filter (COMPLETED - Feb 20, 2026)
- [x] ✅ Manager Portal with Backend APIs (COMPLETED - Feb 20, 2026)
- [x] ✅ Admin Panel Site Settings Tab - Editable Branding (COMPLETED - Feb 20, 2026)
- [x] ✅ Manager Portal Wall Posts & Banner Update (COMPLETED - Feb 20, 2026)
- [x] ✅ Telugu Panchangam with Rahu Kalam, etc. (COMPLETED - Feb 21, 2026)
- [x] ✅ AQI Daily Max Logic with 8 PM reset (COMPLETED - Feb 21, 2026)
- [x] ✅ Enhanced WebSocket Chat features (COMPLETED - Feb 21, 2026)
- [x] ✅ User Analytics Dashboard (COMPLETED - Feb 21, 2026)
- [x] ✅ Deprecate /admin-dashboard → /admin/panel (COMPLETED - Feb 21, 2026)
- [x] ✅ Enterprise Grade Features - Rate Limiting + Sentry (COMPLETED - Feb 21, 2026)

### P3 - Low Priority:
- [x] ✅ Push Notifications Setup (COMPLETED - Feb 21, 2026)
- [x] ✅ Offline Mode Enhancements (COMPLETED - Feb 21, 2026)
- [x] ✅ Muhurtam Calculator (COMPLETED - Feb 21, 2026)
- [x] ✅ Weight Tracker Enhancement (COMPLETED - Feb 21, 2026)
- [x] ✅ Report Downloading in Admin & Manager (COMPLETED - Feb 21, 2026)

---

## Enterprise Grade Features (Completed Feb 21, 2026)

### Rate Limiting
- **Library:** slowapi
- **Configuration:**
  - OTP endpoint: 5 requests/minute
  - Verify endpoint: 10 requests/minute
  - General API: 60 requests/minute (default)
- **Implementation:** `/app/backend/middleware/rate_limiter.py`

### Sentry Error Monitoring
- **Status:** Placeholder ready
- **Setup:** To enable, add `SENTRY_DSN` to backend/.env
- **Features:**
  - FastAPI + Starlette integrations
  - Performance monitoring (20% sample rate)
  - Error filtering (excludes 4xx errors)
  - User context tracking
- **Implementation:** `/app/backend/middleware/sentry_config.py`

### User Analytics Dashboard
- **Location:** Admin Panel > Analytics tab
- **API Endpoints:**
  - `GET /api/analytics/admin/summary?days=N` - Feature popularity, top pages, daily active users
  - `GET /api/analytics/admin/active-users?hours=N` - Recently active users
  - `GET /api/analytics/admin/export?days=N` - Raw analytics export
- **UI Features:**
  - Key metrics (Active Users, Total Events, Page Views, Feature Uses)
  - Daily Active Users bar chart
  - Feature Popularity ranking
  - Top Pages with avg duration
  - Active Users list with last seen

### Enhanced WebSocket Chat
- **New Features:**
  - User presence (online/offline tracking)
  - Typing indicators with auto-timeout
  - Read receipts for messages
  - Room-based online user count
  - Unread message count per room
- **API Endpoints:**
  - `GET /api/chat/rooms` - Now includes online_count, unread_count
  - `GET /api/chat/presence/online` - Global online users
  - `POST /api/chat/rooms/{room_id}/read` - Mark messages read
- **WebSocket Messages:**
  - `presence` - Join/leave events
  - `typing` - Typing indicator with user list
  - `read_receipt` - Read status updates

### Real-Time Analytics Alerts (Completed Feb 21, 2026)
- **Purpose:** Alert admins when user activity spikes or unusual patterns detected
- **Backend Implementation:** `/app/backend/routers/analytics_alerts.py`
- **Frontend Component:** `/app/frontend/src/components/AlertsPanel.jsx`
- **Location:** Admin Panel > Alerts tab
- **API Endpoints:**
  - `GET /api/analytics/alerts/config` - Get alert thresholds
  - `PUT /api/analytics/alerts/config` - Update thresholds
  - `GET /api/analytics/alerts/` - List alerts with filters
  - `POST /api/analytics/alerts/check` - Trigger manual check
  - `GET /api/analytics/alerts/metrics/current` - Current metrics vs baseline
  - `POST /api/analytics/alerts/{id}/acknowledge` - Acknowledge alert
  - `WSS /api/analytics/alerts/ws` - Real-time WebSocket
- **Default Thresholds:**
  - Active Users spike: 50% above baseline (60min window)
  - Active Users drop: 50% below baseline (60min window)
  - Login Attempts spike: 100% above baseline (30min window)
  - Page Views spike: 75% above baseline (60min window)
  - Errors absolute: 10 errors (15min window)
- **Severity Levels:**
  - Critical: ≥200% change
  - High: ≥100% change
  - Medium: ≥50% change
  - Low: <50% change
- **UI Features:**
  - Real-time WebSocket connection status
  - 4 metrics cards (Active Users, Page Views, Login Attempts, Feature Usage)
  - Change percentage vs 7-day baseline
  - Configurable thresholds with enable/disable
  - Alert list with acknowledge/delete
  - Sound notifications toggle
  - Manual check trigger button

### Admin Dashboard Deprecation
- `/admin-dashboard` now redirects to `/admin/panel`
- Query parameters preserved during redirect
- Legacy component replaced with redirect-only component

### Calorie Counter Enhancement (Completed Feb 21, 2026)
- **Location:** KaizerFit page > Calories card (clickable opens full tracker)
- **Component:** `/app/frontend/src/components/CalorieCounter.jsx`
- **Features:**
  - 5 Meal Categories: Breakfast, Lunch, Snacks, Evening Snacks, Dinner
  - 8 Quantity Units: Serving, Grams, Spoon, Tablespoon, Piece, Cup, Bowl, Plate
  - Macro Tracking: Calories, Protein, Carbs, Fat
  - 500+ Foods Database with Telugu translations
  - Food Search (English & Telugu)
  - Popular Foods per meal type
  - Custom food entry with manual calories
- **API Endpoints:**
  - `POST /api/doctor/meal` - Log meal with macros
  - `GET /api/doctor/meals` - Get today's meals with summary
  - `DELETE /api/doctor/meal/{id}` - Delete meal entry
  - `GET /api/doctor/foods` - Food database
  - `GET /api/doctor/foods/search?q=` - Search foods
- **Quantity Multipliers:**
  - Serving: 1x
  - Grams: 0.01x (per 100g base)
  - Spoon: 0.15x
  - Tablespoon: 0.25x
  - Piece: 1x
  - Cup: 1.5x
  - Bowl: 2x
  - Plate: 2.5x

---

## Push Notifications (Completed Feb 21, 2026)

### Features:
- **Web Push API:** Browser-native notifications without external services
- **Notification Types:**
  - Grievance updates
  - News alerts
  - Panchangam daily reminder
  - Admin announcements
  - SOS alerts
  - Health reminders
  - Community updates
- **User Preferences:** Users can enable/disable specific notification types
- **API Endpoints:**
  - `GET /api/notifications/vapid-public-key` - Public VAPID key
  - `POST /api/notifications/subscribe` - Subscribe to push
  - `DELETE /api/notifications/unsubscribe` - Unsubscribe
  - `GET/PUT /api/notifications/preferences` - User preferences
  - `POST /api/notifications/test` - Send test notification
  - `POST /api/notifications/broadcast` - Admin broadcast

## Offline Mode Enhancements (Completed Feb 21, 2026)

### Service Worker Caching:
- **Cacheable API Routes:**
  - `/api/panchangam/today` - 24 hour cache
  - `/api/aqi/both`, `/api/aqi/current` - 30 minute cache
  - `/api/news/local`, `/api/news/categories` - 1 hour cache
  - `/api/benefits` - 12 hour cache (default)
- **Smart Caching:** Network-first with cache fallback, stale-while-revalidate pattern
- **Offline Indicator:** Shows cached data with offline message

## Muhurtam Calculator (Completed Feb 21, 2026)

### Features:
- **5 Event Types:** Marriage (వివాహం), Griha Pravesham (గృహ ప్రవేశం), Vehicle Purchase (వాహన కొనుగోలు), Business Start (వ్యాపార ప్రారంభం), Naming Ceremony (నామకరణం)
- **Score System:** 0-100 score based on tithi, nakshatra, day compatibility
- **Ratings:** Excellent, Good, Average, Poor
- **Auspicious Times:** Abhijit Muhurtam, Morning Muhurtam, Evening Muhurtam
- **Rahu Kalam Warning:** Shows time to avoid for each day
- **Date Suggestions:** Find best dates in next 60 days
- **Telugu Support:** All labels, descriptions, and results in Telugu

### API Endpoints:
- `GET /api/muhurtam/event-types` - All event types
- `GET /api/muhurtam/calculate/{event_type}?date=YYYY-MM-DD` - Calculate muhurtam
- `GET /api/muhurtam/find-dates/{event_type}?start_date=X&num_days=N` - Find auspicious dates

### Frontend:
- Accessible from Astrology page as 5th option
- Direct URL: `/muhurtam`

---

## Telugu Panchangam (Completed Feb 21, 2026)

### Features:
- **API Endpoint:** `/api/panchangam/today` - Public API returning complete Telugu Panchangam
- **Telugu Translations:** All elements have Telugu names (తిథి, నక్షత్రం, యోగం, కరణం, etc.)
- **Daily Updates:** Automatically refreshes with each new day
- **Included Elements:**
  - Tithi (తిథి) with Shukla/Krishna Paksha
  - Nakshatra (నక్షత్రం)
  - Yoga (యోగం)
  - Karana (కరణం)
  - Rahu Kalam (రాహు కాలం)
  - Yamagandam (యమగండం)
  - Gulika Kalam (గుళిక కాలం)
  - Abhijit Muhurtam (అభిజిత్ ముహూర్తం)
  - Amrit Kalam (అమృత కాలం)
  - Durmuhurtam (దుర్ముహూర్తం)
  - Sunrise/Sunset times

### AQI Daily Max Logic:
- Shows day's highest AQI value until 8 PM
- After 8 PM, shows live value
- Info banner explains the logic to users
- Values stored in localStorage per day

---

## White-Label Architecture (Completed Feb 20, 2026)

### Overview
The app now supports easy replication for different areas (e.g., "My AS Rao Nagar", "My Kapra") through a centralized configuration system.

### Key Files:
1. **`/src/config/appConfig.js`** - Master configuration file with:
   - Area identity (name, location, pincode)
   - Branding (colors, logos, app name)
   - Feature toggles (dump yard is disabled for non-Dammaiguda areas)
   - AQI station configuration
   - Stats for landing page
   - Company info

2. **`/src/context/AppConfigContext.jsx`** - React context provider with hooks:
   - `useAppConfig()` - Full config access
   - `useFeatureFlags()` - Feature toggles
   - `useLocalizedConfig(language)` - Localized values
   - `useBranding()`, `useAreaInfo()`, `useStats()`, etc.

3. **`/scripts/create-area.js`** - CLI clone generator:
   ```bash
   node scripts/create-area.js asraonagar     # Use preset
   node scripts/create-area.js kompally --new # Create new
   ```

### Configured Components:
- ✅ LandingPage.jsx - Uses config for branding, stats, area name
- ✅ Dashboard.jsx - Conditionally shows dump yard widget
- ✅ Layout.jsx - Menu items filtered by feature flags
- ✅ App.js - AppConfigProvider wrapping app

### Area Presets Available:
| Area | Color | Dump Yard | Domain |
|------|-------|-----------|--------|
| Dammaiguda | Teal | ✅ Yes | mydammaiguda.in |
| AS Rao Nagar | Blue | ❌ No | myasraonagar.in |
| Kapra | Purple | ❌ No | mykapra.in |
| Bachupally | Red | ❌ No | mybachupally.in |
| Kukatpally | Orange | ❌ No | mykukatpally.in |
| Malkajgiri | Emerald | ❌ No | mymalkajgiri.in |
| Uppal | Cyan | ❌ No | myuppal.in |

### How to Clone for New Area:
1. **CLI Method (Developers):**
   ```bash
   node scripts/create-area.js --list          # See all presets
   node scripts/create-area.js kapra --deploy  # Deploy Kapra instantly
   node scripts/create-area.js kompally --new  # Create new custom area
   ```

2. **Admin UI Method (Non-technical):**
   - Navigate to `/admin/clone`
   - Select preset or create custom area
   - Download appConfig.js and manifest.json
   - Replace files and rebuild

### Key Files:
- **CLI Tool:** `/frontend/scripts/create-area.js`
- **Admin UI Clone Maker:** `/frontend/src/pages/CloneMaker.jsx` (route: `/admin/clone`)
- **Multi-Area Admin Panel:** `/frontend/src/pages/AdminPanel.jsx` (route: `/admin/panel`)
- **Config:** `/frontend/src/config/appConfig.js`
- **Context:** `/frontend/src/context/AppConfigContext.jsx`

### Admin Panel Features (`/admin/panel`):
- **Area Filter (Top Right):** Select which area to manage (All Areas, Dammaiguda, AS Rao Nagar, etc.)
- **Quick Links:** User App, Clone Maker, News/Course/User Manager, Analytics, Issues
- **Tabs:** Overview, Site Settings, Managers, Courses, News, Templates, Announcements
- **Site Settings Tab (NEW):** Edit branding (App Name, Tagline, Colors, Logos) and Stats (Benefits Amount, Problems Solved, People Benefited) - stored in MongoDB for runtime changes
- **Managers Tab:** Create and manage area-specific managers
- **Area Distribution Chart:** Shows all 7 areas with domains
- **Apply to Areas:** When creating content, select which areas it applies to (specific or all)

### Manager Portal (`/manager`):
- **Separate Login:** Managers login with OTP using their assigned phone number
- **Dashboard:** Shows stats for assigned area only (Total Members, Active Members, Pending Issues, Course Enrollments, Wall Posts)
- **Tabs:** Overview, Grievances, Enrollments, Wall, Members
- **Wall Posts:** Create, view, and delete announcements for their area
- **Banner Update:** Change the area banner via dialog with preview
- **Access Control:** Managers can only see data for their assigned area

### Manager API Endpoints (`/api/manager/*`):
- `POST /api/manager/create` - Admin creates manager (phone, name, assigned_area)
- `GET /api/manager/list` - Admin lists all managers
- `DELETE /api/manager/{id}` - Admin removes manager
- `GET /api/manager/stats` - Manager's area stats
- `GET /api/manager/grievances` - Area grievances
- `GET /api/manager/enrollments` - Area enrollments
- `GET /api/manager/members` - Area members
- `GET /api/manager/wall` - Area wall posts
- `POST /api/manager/wall` - Create wall post
- `DELETE /api/manager/wall/{id}` - Delete wall post
- `GET /api/manager/banner` - Get area banner
- `PUT /api/manager/banner` - Update area banner

### Settings API Endpoints (`/api/settings/*`):
- `GET /api/settings/branding?area_id=X` - Public endpoint for frontend config
- `PUT /api/settings/branding` - Admin-only endpoint to update branding/stats
- `GET /api/settings/config/{area_id}` - Public endpoint for full area config

---

## Test Credentials (Development Only)
- **Test Phone:** 9876543210
- **Admin Phone:** 9999999999
- **Manager Phone:** 9876543211 (assigned to Dammaiguda)
- **Test OTP:** 123456 (REMOVE IN PRODUCTION)

---

## Security Notes
⚠️ Before full production launch:
1. Remove test OTP backdoor in `/backend/routers/auth.py`
2. Restrict CORS_ORIGINS to specific domains
3. Rotate JWT_SECRET
4. Enable rate limiting

---

## Contact
**Powered by:** Sharkify Technology Private Limited
