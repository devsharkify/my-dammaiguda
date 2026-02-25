#!/bin/bash

# News API Setup Script
# Run this to set up the standalone news API

echo "📰 Setting up News API..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn motor pydantic python-dotenv httpx beautifulsoup4 lxml python-jose passlib python-multipart

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file - please edit with your values"
fi

# Create first admin user
echo ""
echo "Creating admin user..."
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "news_db")]
    
    existing = await db.users.find_one({"username": "admin"})
    if existing:
        print("Admin user already exists")
        return
    
    admin = {
        "id": str(uuid.uuid4())[:12],
        "username": "admin",
        "password": pwd_context.hash("admin123"),
        "name": "Administrator",
        "role": "admin"
    }
    
    await db.users.insert_one(admin)
    print("✅ Admin user created!")
    print("   Username: admin")
    print("   Password: admin123")
    print("   ⚠️  Please change password after first login!")

asyncio.run(create_admin())
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --host 0.0.0.0 --port 8002 --reload"
echo ""
echo "Then open:"
echo "  API Docs: http://localhost:8002/docs"
echo "  Admin UI: http://localhost:8002/admin.html"
