# My Dammaiguda - Source Code

## Project Structure
```
├── backend/           # FastAPI Backend
│   ├── server.py      # Main entry point
│   ├── routers/       # API routes (30+ files)
│   ├── models/        # Pydantic models
│   ├── middleware/    # Rate limiting, Sentry
│   └── requirements.txt
├── frontend/          # React Frontend
│   ├── src/
│   │   ├── pages/     # 45+ page components
│   │   ├── components/# Reusable components
│   │   ├── context/   # React contexts
│   │   └── App.js     # Routes
│   ├── package.json
│   └── tailwind.config.js
└── Documentation files
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## Environment Variables
See `.env` files in backend/ and frontend/ directories.

## Documentation
- MY_DAMMAIGUDA_DOCUMENTATION.md - Complete technical docs
- API_REFERENCE.md - All API endpoints
- CREDENTIALS_AND_TESTING.md - Test credentials
