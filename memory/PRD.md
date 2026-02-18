# My Dammaiguda - Civic Engagement Platform PRD

## Project Overview
**Name:** My Dammaiguda  
**Type:** Civic Engagement Platform (PWA)  
**Version:** 2.0.0  
**Target:** GHMC Ward-level citizen engagement for Dammaiguda  
**Primary Language:** Telugu (with English toggle)

## Architecture
- **Frontend:** React 19 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **AI:** Emergent LLM (GPT-4o-mini via Emergent integrations)
- **Authentication:** Phone OTP (Mock for dev, ready for Twilio)
- **Media:** Cloudinary (configured)

## User Personas
1. **Citizens** - Report issues, track fitness, access benefits, use AI chat
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
- ✅ Photo/video upload support
- ✅ GPS location capture
- ✅ Status flow: Reported → Verified → Escalated → Closed
- ✅ Public issue feed with filters

### Dump Yard & Environment Module
- ✅ Pollution risk zoning (Red/Orange/Green)
- ✅ Health risk information
- ✅ Affected groups (Children, Pregnant, Elderly)
- ✅ Cadmium exposure info

### Kaizer Fit Module (EXPANDED v2.0)
- ✅ 8 Activity Types: Walking, Running, Cycling, Yoga, Gym, Swimming, Sports, Dancing
- ✅ Activity logging with duration, distance, steps, calories
- ✅ Daily/Weekly/Monthly fitness dashboard
- ✅ Fitness score calculation (0-100)
- ✅ Activity streak tracking
- ✅ Anonymized leaderboard
- ✅ Community challenges
- ✅ Ward-level statistics
- ✅ Wearable sync API (Apple Watch, Android Wear, Fitbit compatible)
- ✅ Pollution-aware exercise alerts

### Kaizer Doctor Module (NEW v2.0)
- ✅ Health Metrics: Weight, Height, BMI, Blood Sugar, Blood Pressure
- ✅ Meal Logging with South Indian/Hyderabad food database
  - 40+ Telugu-named foods (Idli, Dosa, Biryani, Pesarattu, etc.)
  - Calorie, Protein, Carbs, Fat tracking
- ✅ Water Intake Tracking (glasses per day)
- ✅ Sleep Logging with duration and quality
- ✅ Mood Tracking (Happy, Calm, Stressed, Anxious, Sad, Energetic)
- ✅ 5 Diet Plans: Weight Loss, Weight Gain, Maintenance, Diabetic, Heart Healthy
- ✅ Daily Nutrition Summary
- ✅ Health Score calculation
- ✅ Personalized Recommendations

### AI Chat Module (NEW v2.0)
- ✅ 5 AI Assistants:
  1. General - Platform help
  2. Health - Pollution-related health concerns
  3. Fitness - Exercise recommendations
  4. Doctor - Diet advice (South Indian focus)
  5. Psychologist - Mental wellness support
- ✅ Chat history storage in MongoDB
- ✅ Conversation context awareness
- ✅ Telugu/English language support
- ✅ Powered by GPT-4o-mini via Emergent LLM

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

### Polls & Surveys
- ✅ Yes/No and choice-based polls
- ✅ Anonymous voting
- ✅ Live result visualization

## API Endpoints (v2.0)
- `/api/auth/*` - Authentication
- `/api/issues/*` - Issue management
- `/api/dumpyard/*` - Dump yard info
- `/api/fitness/*` - Kaizer Fit (activity, dashboard, leaderboard, challenges, sync)
- `/api/doctor/*` - Kaizer Doctor (health-metrics, meal, water, sleep, mood, diet-plans)
- `/api/chat` - AI Chat
- `/api/benefits/*` - Citizen benefits
- `/api/expenditure/*` - Ward expenditure
- `/api/polls/*` - Polls and surveys
- `/api/volunteer/*` - Volunteer features
- `/api/admin/*` - Admin dashboard

## Environment Variables Configured
### Backend (.env)
- ✅ MONGO_URL, DB_NAME
- ✅ JWT_SECRET
- ✅ TWILIO_ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER
- ✅ CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
- ✅ EMERGENT_LLM_KEY (for AI Chat)
- ✅ GOOGLE_VISION_API_KEY

## Prioritized Backlog

### P0 (Critical) - Done
- ✅ Kaizer Fit multi-activity tracking
- ✅ Kaizer Doctor with South Indian diet
- ✅ AI Chat integration

### P1 (High Priority)
- [ ] Activate real Twilio SMS OTP
- [ ] WhatsApp share card generation
- [ ] Push notifications (PWA)
- [ ] Wearable device deep integration

### P2 (Medium Priority)
- [ ] Admin content moderation tools
- [ ] Drone image gallery for dump yard
- [ ] Issue resolution time analytics
- [ ] Voice input for elderly

### P3 (Low Priority)
- [ ] Offline support
- [ ] Multi-ward scalability
- [ ] Data export features

## Next Tasks
1. Test AI Chat with real conversations
2. Add sample fitness challenges
3. Add sample expenditure data
4. Enable Twilio for production OTP
5. Add WhatsApp sharing
