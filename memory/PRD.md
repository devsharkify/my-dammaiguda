# My Dammaiguda - Civic Engagement Platform

## Original Problem Statement
Build a production-ready, mobile-first civic engagement platform "My Dammaiguda". The platform must be minimalistic, fast, low-data, and trust-focused.

## Product Requirements

### Core Modules
- **User Auth**: OTP-based authentication (currently MOCKED - static 123456)
- **Issue Reporting**: Citizens report local issues with media support
- **Dump Yard/Environment**: Comprehensive pollution zone data, health risks, affected groups, and updates
- **Health & Fitness (Kaizer Fit)**: Fitness tracking with smartwatch integration
- **Citizen Benefits**: Government scheme information
- **Ward Expenditure Dashboard**: Local spending transparency
- **Polls**: Community voting
- **Volunteer Module**: Volunteer coordination
- **Admin Dashboard**: Platform management
- **Gift Shop**: E-commerce with two-tier points system

---

## Recently Implemented Features (Feb 19, 2026)

### 1. Dashboard Reorganization ✅
- **Stories bar** at top
- **AQI Widget**: Dammaiguda AQI (BIG font, 3xl) with Hyderabad status (small 10px text below)
- **Dump Yard Card**: Quick info (1,200 tons/day, 350 acres, 2km Red Zone alert)
- **Citizen Wall Widget**: Latest community post
- **9 Quick Action Boxes**: Report, Issues, Benefits, Fit, Doctor, Family, Gifts, Education, Polls
- **Benefits Slider**: Citizen benefits cards

### 2. Bottom Navigation Update ✅
- Removed AI Assistant/Chat from bottom navigation
- New navigation: **Home → Learn → Fit → Gifts → Profile**

### 3. Issues Page Enhancement ✅
- **Two Tabs**: "All Issues" and "My Issues" (user-filed issues with badge)
- **New Admin Status Options**:
  - Action Taken
  - Filed with Authority
  - Resolved by Authority  
  - Resolved by Us
  - Issue Not Found (with "Please contact us" message)
- Status badges now have icons

### 4. Bottom Navigation Redesign ✅
- **Home** (left) - Dashboard
- **Education** - AIT Education platform
- **NEWS** (center bulge) - Raised button with red-orange gradient, grabs attention
- **Benefits** - Citizen benefits
- **Helpline** - Emergency numbers page

### 5. New Helpline Page ✅
- Emergency numbers: Police (100), Ambulance (108), Fire (101), Women (181), Child (1098), Disaster (1078)
- Local services: GHMC, Water Board, Electricity, Corporator
- WhatsApp support card

### 6. Family Module - Course Progress ✅
- Parents can see child's course progress (total, completed, in-progress, certificates)
- Course summary displayed in family member card
- API: `/api/family/member/{member_id}/courses` for detailed progress

### 7. Two-Tier Points System for Gift Shop ✅
- **Normal Points**: Earned through activities, fitness, admin credits
- **Privilege Points**: Exclusively assigned by admin to selected users
- **Product Point Types**:
  - `normal` - Only requires normal points
  - `privilege` - Only requires privilege points  
  - `both` - Requires both types
- **Admin Features**:
  - Single user point adjustment (normal OR privilege)
  - Bulk privilege points assignment to ALL users or selected users
  - Product creation with point_type, privilege_points_required, delivery_fee
- **Wallet Display**: Shows both balances side by side

### 8. Discount Vouchers System ✅ (P1)
- **Admin Features**: Create vouchers with random or specific codes, set discount type (percentage/flat), partner name, category, terms, validity
- **User Features**: Browse vouchers by category, view full details with CODE, copy code, share, claim
- **Categories**: Food, Shopping, Health, Education, Entertainment
- **Sample Vouchers Created**: Dominos (DAMM20, 20% off), Apollo Pharmacy (₹100 off), Emeritus (LEARN50, 50% off)

### 9. Status Templates Editor ✅ (P1)
- **Template Categories**: Festivals, Birthday, Events, Greetings
- **Editor Features**: Upload photo (optional), enter name, generate status image
- **Canvas-based Rendering**: Client-side image generation using HTML5 Canvas
- **Sharing**: Download PNG or share directly to WhatsApp/Instagram
- **Fallback Templates**: Ugadi Wishes, Birthday templates pre-loaded

### 10. Enhanced Dumpyard Section ✅
- **Pollution Zones Tab**: Red (2km), Orange (5km), Green (10km) zones with risk levels
- **Health Risks Tab**: 
  - Respiratory Issues, Cadmium Exposure, Skin Allergies, Eye Irritation
  - Risk descriptions in English and Telugu
- **Affected Groups**: Children, Pregnant Women, Elderly with specific advice
- **Updates Tab**: News and alerts from the dump yard

### 3. Bug Fixes ✅
- Fixed Issues page crash (frontend was parsing API response incorrectly)
- Added missing admin endpoints (/api/admin/stats, /api/admin/users, /api/admin/issues-heatmap)

---

## Technical Architecture

### Frontend (React)
```
/app/frontend/src/
├── components/
│   ├── Layout.jsx (PhonePe-style bottom nav, dark mode)
│   └── PageTransition.jsx (framer-motion animations)
├── context/
│   ├── AuthContext.jsx
│   ├── LanguageContext.jsx (default: 'en')
│   └── ThemeContext.jsx (dark/light mode)
├── pages/
│   ├── Dashboard.jsx (Quick actions grid, AQI widgets)
│   ├── GiftShop.jsx (Dual wallet, products with point types)
│   ├── DumpYardInfo.jsx (Zones, Risks, Updates tabs)
│   ├── AdminDashboard.jsx (Shop tab with bulk privilege)
│   └── ... (other modules)
```

### Backend (FastAPI)
```
/app/backend/
├── server.py (main app, admin endpoints, dumpyard data)
└── routers/
    ├── auth.py (OTP auth - MOCKED)
    ├── shop.py (two-tier points, wallet, products, orders)
    ├── fitness.py (profile, activities, devices)
    └── ... (other modules)
```

### Database (MongoDB)
Key Collections:
- `users`, `wallets`, `points_transactions`
- `gift_products` (with point_type, privilege_points_required, delivery_fee)
- `gift_orders` (with normal_points_spent, privilege_points_spent)
- `dumpyard_updates`

---

## Key API Endpoints

### Shop (Two-Tier Points)
- `GET /api/shop/wallet` - Returns balance + privilege_balance
- `GET /api/shop/products` - Products with point_type badges
- `POST /api/shop/claim` - Deducts correct point type(s)
- `POST /api/shop/admin/products` - Create with point_type, delivery_fee
- `POST /api/shop/admin/points/adjust` - Single user, specify point_type
- `POST /api/shop/admin/points/bulk-privilege` - Mass privilege assignment

### Dumpyard
- `GET /api/dumpyard/info` - Zones, health risks, affected groups
- `GET /api/dumpyard/updates` - News and alerts

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - All users list
- `GET /api/admin/issues-heatmap` - Issues by colony

---

## Known Limitations

### MOCKED Integrations (P0)
- **OTP Authentication**: Uses static code `123456`
- **Media Uploads**: Not connected to cloud storage

### Requires User API Keys
- Twilio SMS (for real OTP)
- Cloudinary (for media storage)

---

## Test Credentials
- **Regular User**: Phone `9876543210`, OTP: `123456`
- **Admin User**: Phone `+919999999999`, OTP: `123456`
- **Test User Points**: 1000 Normal + 120 Privilege

---

## Sample Gift Products
1. **Water Bottle** - 100 normal points, free delivery
2. **VIP Event Pass** - 100 privilege points only
3. **Premium Fitness Band** - 500 normal + 50 privilege, ₹49 delivery

---

## Upcoming Tasks (P1)
1. Real Twilio OTP integration
2. Cloudinary media upload integration
3. News page content (currently /news route placeholder)
4. OpenGraph Meta Tags for certificate sharing
5. Automatic fitness points rewards (connect Fitness → Gift Shop)

## Future/Backlog (P2)
- Native app for Health Connect/HealthKit integration
- Instructor Portal for course management
- Student Progress Leaderboard
- WebSocket Real-time Chat
- Component refactoring (large files)

---

## Change Log

### Feb 19, 2026 (Session 2 - Latest)
- **Dashboard Reorganization**: AQI (Dammaiguda big, Hyderabad small) + Dump Yard card → Wall → 9 boxes → Benefits
- **Bottom Navigation**: Replaced Chat with Gifts (Home, Learn, Fit, Gifts, Profile)
- **Issues Enhancement**: Added "My Issues" tab, new admin status options (Action Taken, Filed with Authority, etc.)
- Testing: 100% frontend success (33/33 tests)

### Feb 19, 2026 (Session 1)
- Implemented two-tier points system (Normal + Privilege)
- Added bulk privilege points assignment to ALL users
- Enhanced product model with point_type, privilege_points_required, delivery_fee
- Updated wallet to show both balance types
- Populated Dumpyard with comprehensive data (zones, risks, groups, updates)
- Fixed Issues page crash
- Added admin stats/users/heatmap endpoints
- Testing: 89% backend, 100% frontend success

### Feb 19, 2026 (Earlier)
- Changed default language from Telugu to English
- Built Gift Shop module with wallet, products, orders
- Added Admin Gift Shop management
- Added fitness profile onboarding
- Added manual activity recording
- Built Device Sync page
