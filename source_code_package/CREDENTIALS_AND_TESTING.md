# My Dammaiguda - Quick Reference & Credentials

## Live URLs

| Environment | URL |
|-------------|-----|
| **Preview App** | https://course-learn-1.preview.emergentagent.com |
| **Production** | https://www.mydammaiguda.in |
| **API Docs** | https://course-learn-1.preview.emergentagent.com/docs |

---

## All Login Credentials

### Staff Portal Login (Password-based)
**URL:** https://course-learn-1.preview.emergentagent.com/portals

| Role | Phone | Password |
|------|-------|----------|
| Master Admin | 9100063133 | Plan@123 |
| Manager (Rohan) | 7386917770 | Manager@123 |

### OTP Login (Regular Auth)
**URL:** https://course-learn-1.preview.emergentagent.com/auth

| User Type | Phone | OTP |
|-----------|-------|-----|
| Admin User | 9999999999 | 123456 |
| Test User | 9876543210 | 123456 |
| Test User 2 | 8888888888 | 123456 |
| Manager | 9844548537 | 123456 |

---

## Portal Access URLs

| Portal | Direct URL | Who Can Access |
|--------|------------|----------------|
| Landing Page | / | Everyone |
| User Dashboard | /dashboard | Logged in users |
| Staff Portal Hub | /portals | Admin, Manager, Instructor, Volunteer |
| Admin Panel | /admin/panel | Admin only |
| Manager Portal | /manager | Admin, Manager |
| Instructor Portal | /instructor | Admin, Instructor |
| Volunteer Dashboard | /volunteer | Admin, Volunteer |

---

## Key Feature URLs

| Feature | URL |
|---------|-----|
| Education/Courses | /education |
| Benefits | /benefits |
| Claim Benefits | /claim-benefits |
| News | /news |
| Report Issue | /report |
| Issues Feed | /issues |
| Health & Fitness | /fitness |
| Astrology | /astrology |
| Community Wall | /wall |
| Profile | /profile |
| AI Chat | /chat |

---

## API Testing Quick Commands

### 1. Health Check
```bash
curl https://course-learn-1.preview.emergentagent.com/api/health
```

### 2. Send OTP
```bash
curl -X POST "https://course-learn-1.preview.emergentagent.com/api/auth/otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999"}'
```

### 3. Verify OTP & Get Token
```bash
curl -X POST "https://course-learn-1.preview.emergentagent.com/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456"}'
```

### 4. Admin Login (Password)
```bash
curl -X POST "https://course-learn-1.preview.emergentagent.com/api/auth/admin-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9100063133","password":"Plan@123"}'
```

### 5. Get Courses (Public)
```bash
curl https://course-learn-1.preview.emergentagent.com/api/education/courses
```

### 6. Get My Profile (Authenticated)
```bash
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  https://course-learn-1.preview.emergentagent.com/api/auth/me
```

---

## Key IDs for Testing

### Courses
| Course | ID |
|--------|-----|
| Full Stack Web Development | b326b25e-97ac-439b-a691-ec06996c8fad |
| Spoken English Mastery | c5315723-f7e9-415b-bef2-083837c83e41 |
| Graphic Design & Canva Pro | b9cb03bd-76b8-4a58-9ba3-387589a6402e |
| Data Entry & MS Office | a51d5130-330f-44d4-a1e3-7669a308b1bc |

### Subjects (Full Stack Course)
| Subject | ID |
|---------|-----|
| HTML & CSS Fundamentals | d78c5534-f3cb-40ec-8db6-6317c8eae1aa |
| JavaScript Programming | 81b9fd72-7f68-4b0a-85b2-e02764879618 |
| React.js Framework | efa41c45-bfe1-43b8-96b1-17d4a61b6533 |
| Node.js & Backend | bade5767-5934-4710-9590-45e39e09279c |

---

## Server Commands

```bash
# Check Service Status
sudo supervisorctl status

# Restart Backend
sudo supervisorctl restart backend

# Restart Frontend
sudo supervisorctl restart frontend

# View Backend Logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# View Frontend Logs
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/frontend.out.log
```

---

## Environment Files

### Backend: /app/backend/.env
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="dammaiguda_db"
```

### Frontend: /app/frontend/.env
```
REACT_APP_BACKEND_URL=https://course-learn-1.preview.emergentagent.com
```

---

## Database Access

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/dammaiguda_db

# List Collections
show collections

# Count Users
db.users.countDocuments()

# Find Admin Users
db.users.find({role: "admin"})
```

---

## Test Report Files

```
/app/test_reports/iteration_42.json
/app/test_reports/iteration_43.json
/app/test_reports/iteration_44.json
```

---

## Contact & Support

**Powered by:** Sharkify Technology Private Limited  
**Owner:** Rohan Kulkarni
