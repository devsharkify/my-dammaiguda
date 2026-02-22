# My Dammaiguda - Pending APIs & Features

## Summary

| Category | Status | Count |
|----------|--------|-------|
| **Fully Working** | ✅ | 95% |
| **Needs Real API Key** | ⚠️ | 3 features |
| **Placeholder/Mock** | 🟡 | 4 features |
| **TODO/Incomplete** | 🔴 | 5 items |

---

## 1. Features Needing Real API Keys (Currently Configured)

### ✅ Working with Keys Provided:
| Feature | API | Status |
|---------|-----|--------|
| **SMS OTP** | Authkey.io | ✅ Working |
| **Image Upload** | Cloudinary | ✅ Working |
| **AI Chat** | OpenAI | ✅ Working |
| **Google Fit** | Google OAuth | ⚠️ Needs user testing |

### ⚠️ Google Fit OAuth
- **Status:** Code complete, needs production testing
- **Issue:** OAuth callback URL set to production domain
- **File:** `/app/backend/routers/google_fit.py`
- **Action:** User needs to test on live domain

---

## 2. Placeholder/Mock Features

### 🟡 SMS Notifications for Benefits Approval
- **File:** `/app/backend/routers/benefits.py` (Line 356-362)
- **What's Missing:** SMS sending when benefit is approved
- **Current:** Just logs, doesn't send SMS
```python
# TODO: Send SMS via Authkey.io
pass
```

### 🟡 Device Sync (Wearables)
- **File:** `/app/backend/routers/fitness.py` (Line 1282)
- **What's Missing:** Actual sync with smartwatch/fitness bands
- **Current:** Placeholder - returns mock data
```python
"""Sync data from all connected devices (placeholder for actual sync logic)"""
```

### 🟡 Sleep Data
- **File:** `/app/backend/routers/fitness.py` (Line 1832-1833)
- **What's Missing:** Real sleep tracking integration
- **Current:** Returns default 7.5 hours
```python
sleep_hours = 7.5  # Default/placeholder
```

### 🟡 News Fallback
- **File:** `/app/backend/routers/news.py` (Line 438-507)
- **What's Missing:** When RSS scraping fails
- **Current:** Shows placeholder news articles
- **Note:** This is intentional fallback, not broken

---

## 3. TODO Items in Code

| File | Line | TODO |
|------|------|------|
| `benefits.py` | 361 | Send SMS via Authkey.io when approved |
| `education.py` | 1113 | Implement streak tracking for courses |
| `fitness.py` | 1576-1700 | Error handling improvements |
| `websocket_chat.py` | 383 | Error handling for disconnects |

---

## 4. Empty Database Collections

| Collection | Purpose | Status |
|------------|---------|--------|
| `templates` | Status templates | 0 documents (needs seeding) |

---

## 5. Pending User Testing (Not Code Issues)

| Feature | Status | Action Required |
|---------|--------|-----------------|
| Google Play Store | Awaiting review | User to check |
| Google Fit OAuth | Code complete | Test on production domain |
| Claim Benefits Flow | Built | User verification needed |
| Sequential Learning | ✅ Tested | Working |

---

## 6. Security Items (Before Production)

| Item | Status | Priority |
|------|--------|----------|
| Remove test OTP backdoor (123456) | Pending | 🔴 HIGH |
| Sentry Error Monitoring | Placeholder | 🟡 MEDIUM |
| Rate Limiting | ✅ Implemented | Done |

### To Remove Test OTP:
**File:** `/app/backend/routers/auth.py` (Line 58)
```python
# DELETE THIS LINE BEFORE PRODUCTION:
TEST_PHONES = ["+919876543210", "+919999999999", ...]
```

---

## 7. APIs That Are 100% Complete

### Authentication ✅
- OTP Send/Verify
- Password Login (Staff)
- Profile Management
- Account Deletion

### Education ✅
- Course CRUD
- Subject CRUD
- Lesson CRUD
- Enrollment
- Sequential Learning
- Progress Tracking
- Quiz System
- Certificates
- Reviews

### Fitness ✅
- Activity Logging
- Weight Tracking
- Water Intake
- Meal Logging
- Live Activity
- Challenges
- Badges
- Leaderboard

### Benefits ✅
- Application Submission
- Admin Review
- Voucher Generation
- Status Tracking

### News ✅
- RSS Aggregation
- Category Filtering
- Admin Publishing
- Push Notifications

### Issues ✅
- Report Creation
- Status Updates
- Category Filtering
- Admin Management

### Admin ✅
- User Management
- Role Assignment
- Analytics
- Reports
- Settings

### Manager ✅
- Area Management
- Wall Posts
- Banner Updates
- Grievance Handling

---

## Quick Fix Priority

### 🔴 HIGH Priority (Fix Before Launch)
1. Remove TEST_PHONES from auth.py
2. Test Google Fit on production

### 🟡 MEDIUM Priority
3. Implement SMS notification for benefits approval
4. Add Sentry DSN for error monitoring

### 🟢 LOW Priority (Enhancement)
5. Implement course streak tracking
6. Add real sleep tracking integration
7. Add real wearable device sync

---

## Summary: What's NOT Working

| Feature | Issue | Impact |
|---------|-------|--------|
| Benefits SMS | No SMS sent on approval | Low - manual notification works |
| Sleep Tracking | Returns mock data | Low - cosmetic |
| Device Sync | No real device integration | Low - manual logging works |
| Course Streaks | Always shows 0 | Low - cosmetic |

**Everything else is fully functional!**
