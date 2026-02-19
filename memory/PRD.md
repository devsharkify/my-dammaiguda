# My Dammaiguda - Civic Engagement Platform

## Original Problem Statement
Build a production-ready, mobile-first civic engagement platform "My Dammaiguda". The platform must be minimalistic, fast, low-data, and trust-focused.

## Product Requirements

### Core Modules
- **User Auth**: OTP-based authentication (currently MOCKED - static 123456)
- **Issue Reporting**: Citizens report local issues with media support
- **Dump Yard/Environment**: Environmental information tracking
- **Health & Fitness (Kaizer Fit)**: Comprehensive fitness tracking with smartwatch integration
- **Citizen Benefits**: Government scheme information
- **Ward Expenditure Dashboard**: Local spending transparency
- **Polls**: Community voting
- **Volunteer Module**: Volunteer coordination
- **Admin Dashboard**: Platform management

---

## Recently Implemented Features (Feb 19, 2026)

### 1. Language Default Change ✅
- English is now the default language (previously Telugu)
- Users can toggle to Telugu if desired
- Stored in localStorage as `dammaiguda_language`

### 2. Gift Shop Module (E-commerce) ✅
- **Points Wallet System**: Balance tracking, transaction history
- **Product Catalog**: Categories (Fitness, Electronics, Home, Fashion, Books)
- **Product Details**: MRP display, points-to-claim conversion, stock tracking
- **Claim Flow**: Delivery address collection, order creation
- **Order Tracking**: Status flow (pending → approved → shipped → delivered)
- **Admin Management**:
  - Add/Edit/Delete products
  - Approve/Reject orders
  - Mark orders as shipped/delivered
  - Adjust user points (+/-)
  - View order statistics

### 3. Fitness Page Enhancements ✅
- **Mandatory Onboarding**: First-time users must provide:
  - Height (cm), Weight (kg), Gender, Age
  - Fitness Goal (optional)
  - BMI and calorie recommendations calculated automatically
- **Manual Activity Recording**: Log workouts with editable dates
  - Activity type, duration, distance, calories, notes
  - Cannot record future activities
- **Start Live Activity**: GPS-tracked real-time activity
- **Record Fitness**: Manual entry option alongside live tracking
- **Connect Smartwatch Card**: Quick link to device sync page

### 4. Smartwatch/Device Integration ✅
- **Device Sync Page** (`/devices`):
  - Sync status card showing connected device count
  - Auto-sync toggle
  - Connected devices list with disconnect option
- **Supported Devices**:
  - Apple Watch (iOS - via Apple Health)
  - Fitbit (all platforms)
  - Samsung Galaxy Watch (Android - via Samsung Health)
  - Noise/boAt (Bluetooth)
  - Google Fit (Android - Health Connect)
  - Mi Band/Amazfit (via Zepp app)
- **Web Bluetooth API**: For compatible devices (Noise, Mi Band)
- **Backend Support**: Device connection, sync logging

### 5. Admin Gift Shop Management ✅
- **New "Shop" Tab** in Admin Dashboard
- **Order Statistics**: Pending, Approved, Shipped, Delivered counts
- **Product Management**: Add, edit, delete products
- **Order Management**: Approve, reject, ship, deliver orders
- **Points Adjustment**: Add or deduct points from users

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
│   ├── GiftShop.jsx (Wallet, products, orders)
│   ├── DeviceSync.jsx (Smartwatch connection)
│   ├── KaizerFit.jsx (Onboarding, live/manual tracking)
│   ├── AdminDashboard.jsx (Shop tab added)
│   └── ... (other modules)
└── hooks/
    └── usePushNotifications.js
```

### Backend (FastAPI)
```
/app/backend/
├── server.py (main app, router registration)
└── routers/
    ├── auth.py (OTP auth - MOCKED)
    ├── fitness.py (profile, activities, devices, badges, manual recording)
    ├── shop.py (wallet, products, orders, admin)
    ├── education.py (courses, lessons, certificates)
    └── ... (other modules)
```

### Database (MongoDB)
Key Collections:
- `users`, `wallets`, `points_transactions`
- `gift_products`, `gift_orders`
- `fitness_profiles`, `fitness_devices`, `device_syncs`
- `activities`, `fitness_daily`
- `courses`, `lessons`, `quizzes`, `enrollments`, `certificates`

---

## Known Limitations

### MOCKED Integrations (P0)
- **OTP Authentication**: Uses static code `123456`
- **Media Uploads**: Not connected to cloud storage

### Smartwatch Integration Notes
- Health Connect (Android) and HealthKit (iOS) are **native-only APIs**
- Web apps cannot directly access these APIs
- Current implementation:
  - Web Bluetooth for compatible devices
  - Manual sync for other devices
  - Backend ready to receive data from native apps

### Requires User API Keys
- Twilio SMS (for real OTP)
- Cloudinary (for media storage)
- Google Maps API (partially integrated)

### Working Integrations
- Emergent LLM Key (AI features)
- Web Push (VAPID) - fully working
- AQI data (real-time scraping)

---

## Test Credentials
- **Regular User**: Phone `9876543210`, OTP: `123456`
- **Admin User**: Phone `+919999999999`, OTP: `123456`

---

## Sample Data
- **Gift Products**: Water Bottle (100 pts), Yoga Mat (250 pts), Fitness Tracker (500 pts)
- **User Points**: Test user has 1,000 points

---

## API Endpoints Added

### Shop
- `GET /api/shop/wallet` - Get user wallet
- `GET /api/shop/products` - List products
- `POST /api/shop/claim` - Claim a gift
- `GET /api/shop/orders` - User orders
- `GET /api/shop/admin/products` - Admin products
- `POST /api/shop/admin/products` - Create product
- `PUT /api/shop/admin/orders/{id}/status` - Update order
- `POST /api/shop/admin/points/adjust` - Adjust user points

### Fitness
- `GET /api/fitness/profile` - Get fitness profile
- `POST /api/fitness/profile` - Create/update profile
- `POST /api/fitness/record` - Manual activity record
- `GET /api/fitness/devices` - Connected devices
- `POST /api/fitness/devices/connect` - Connect device
- `DELETE /api/fitness/devices/{id}` - Disconnect
- `POST /api/fitness/sync-all` - Sync all devices

---

## Upcoming Tasks (P1)
1. Real Twilio OTP integration
2. Cloudinary media upload integration
3. OpenGraph Meta Tags for certificate sharing
4. Automatic points rewards for fitness activities

## Future/Backlog (P2)
- Native app for full Health Connect/HealthKit integration
- Instructor Portal for course management
- Student Progress Leaderboard
- WebSocket Real-time Chat
- Component refactoring (large files)

---

## Change Log

### Feb 19, 2026 (Latest)
- Changed default language from Telugu to English
- Built Gift Shop module with wallet, products, orders
- Added Admin Gift Shop management (Shop tab)
- Added fitness profile onboarding (mandatory for first-time users)
- Added manual activity recording with editable dates
- Built Device Sync page with smartwatch connection UI
- Added Web Bluetooth support for compatible devices
- Testing: 100% backend, 95% frontend success

### Previous Sessions
- Built AIT Education module with courses, quizzes, certificates
- Implemented web push notifications
- Created PhonePe-style UI with bottom navigation
- Added AQI widgets with real-time data
- Built Kaizer Fit with live activity tracking
- Implemented dark mode and page transitions
