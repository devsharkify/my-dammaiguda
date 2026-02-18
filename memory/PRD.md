# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** Phone OTP (Mock for dev, ready for Twilio)
- **Media:** Ready for Cloudinary integration
- **Maps:** Ready for Google Maps integration

## User Personas
1. **Citizens** - Report issues, track fitness, access benefits
2. **Volunteers** - Verify reported issues, assist elderly
3. **Admins** - Manage content, view analytics, moderate

## Core Requirements (Static)
1. ✅ Mobile-first PWA design
2. ✅ Telugu-first language with English toggle
3. ✅ No political party symbols or colors
4. ✅ Accessibility-first (elderly-friendly)
5. ✅ Role-based access (Citizen, Volunteer, Admin)

## What's Been Implemented (Jan 2026)

### Authentication Module
- ✅ Phone OTP login (Mock OTP: 123456)
- ✅ User registration with colony and age range
- ✅ JWT-based session management
- ✅ Role management

### Issue Reporting System
- ✅ 7 Categories: Dump Yard, Garbage, Drainage, Water, Roads, Lights, Parks
- ✅ Photo/video upload support (mock URLs)
- ✅ GPS location capture
- ✅ Status flow: Reported → Verified → Escalated → Closed
- ✅ Public issue feed with filters

### Dump Yard & Environment Module
- ✅ Pollution risk zoning (Red/Orange/Green)
- ✅ Health risk information
- ✅ Affected groups (Children, Pregnant, Elderly)
- ✅ Cadmium exposure info
- ✅ Timeline updates section

### Kaizer Fit Module
- ✅ Daily steps tracking
- ✅ Fitness score calculation
- ✅ Weekly leaderboard (anonymized)
- ✅ Community challenges
- ✅ Ward-level statistics
- ✅ Pollution-aware alerts

### Citizen Benefits Module
- ✅ Health checkup registration
- ✅ Education voucher (₹50,000 with Emeritus)
- ✅ Accidental insurance enrollment
- ✅ Health insurance support (25% cashback)
- ✅ Application tracking

### Ward Expenditure Dashboard
- ✅ Year-wise expenditure view
- ✅ Category-wise breakdown
- ✅ RTI document links
- ✅ Ground reality notes
- ✅ Visual charts

### Polls & Surveys
- ✅ Yes/No and choice-based polls
- ✅ Anonymous voting
- ✅ Live result visualization
- ✅ Vote percentage display

### Volunteer Dashboard
- ✅ Issue verification queue
- ✅ Verification history
- ✅ Activity tracking

### Admin Dashboard
- ✅ Issue statistics by category
- ✅ Colony-wise heatmap
- ✅ User management
- ✅ Role assignment

## Prioritized Backlog

### P0 (Critical)
- [ ] Integrate real Twilio SMS for OTP
- [ ] Integrate Cloudinary for media uploads
- [ ] Integrate Google Maps for location

### P1 (High Priority)
- [ ] WhatsApp share card generation
- [ ] Push notifications (PWA)
- [ ] Admin content moderation tools
- [ ] Drone image gallery for dump yard

### P2 (Medium Priority)
- [ ] RTI document upload system
- [ ] Volunteer assignment system
- [ ] Fitness challenges with rewards
- [ ] Issue resolution time analytics

### P3 (Low Priority)
- [ ] Offline support
- [ ] Voice input for elderly
- [ ] Multi-ward scalability
- [ ] Data export features

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/issues/*` - Issue management
- `/api/dumpyard/*` - Dump yard info
- `/api/fitness/*` - Kaizer Fit
- `/api/benefits/*` - Citizen benefits
- `/api/expenditure/*` - Ward expenditure
- `/api/polls/*` - Polls and surveys
- `/api/volunteer/*` - Volunteer features
- `/api/admin/*` - Admin dashboard

## Environment Variables Required
### Backend (.env)
- `MONGO_URL` - MongoDB connection
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key
- `TWILIO_*` - Twilio SMS keys (pending)
- `CLOUDINARY_*` - Cloudinary keys (pending)

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - API URL
- `GOOGLE_MAPS_API_KEY` - Maps key (pending)

## Next Tasks
1. Collect and configure Twilio SMS keys
2. Configure Cloudinary for media
3. Add Google Maps integration
4. Implement share card generation
5. Add sample expenditure data
6. Create sample polls
