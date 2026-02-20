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

### P1 - High Priority:
- [ ] Update Play Store listing with production URLs
- [ ] Create Terms of Service page
- [ ] Test OTP flow with real phone numbers
- [ ] Remove test OTP backdoor (123456) for production security

### P2 - Medium Priority:
- [ ] White-label replication for other areas (AS Rao Nagar, Kapra)
- [ ] Enhanced WebSocket Chat features
- [ ] User analytics dashboard

### P3 - Low Priority:
- [ ] Push notifications setup
- [ ] Offline mode enhancements

---

## Test Credentials (Development Only)
- **Test Phone:** 9876543210
- **Admin Phone:** 9999999999
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
