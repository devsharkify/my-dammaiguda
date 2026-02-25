"""
News API - Standalone Service
A complete, production-ready news aggregation API with admin dashboard support.
Can be deployed separately and synced with My Dammaiguda or other apps.
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
from bs4 import BeautifulSoup
import logging
import os
import uuid
import asyncio
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

# ============== CONFIGURATION ==============

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "news_db")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-this-secret")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DAMMAIGUDA_API = os.environ.get("DAMMAIGUDA_API_URL")
DAMMAIGUDA_TOKEN = os.environ.get("DAMMAIGUDA_ADMIN_TOKEN")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== DATABASE ==============

client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    logger.info(f"Connected to MongoDB: {DB_NAME}")
    
    # Create indexes
    await db.news_articles.create_index("id", unique=True)
    await db.news_articles.create_index("category")
    await db.news_articles.create_index([("created_at", -1)])
    await db.news_bookmarks.create_index([("user_id", 1), ("article_id", 1)], unique=True)
    
    yield
    
    client.close()
    logger.info("MongoDB connection closed")

# ============== APP SETUP ==============

app = FastAPI(
    title="News API",
    description="Standalone news aggregation service with admin dashboard",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class NewsCategory(BaseModel):
    id: str
    name_en: str
    name_te: str
    icon: str = "newspaper"
    color: str = "#3B82F6"

class NewsArticle(BaseModel):
    title: str
    title_te: Optional[str] = None
    summary: str
    summary_te: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    link: Optional[str] = None
    source: str = "News API"
    content_type: str = "text"  # text, video
    is_pinned: bool = False
    is_breaking: bool = False
    priority: int = 5  # 1=highest, 10=lowest

class NewsArticleUpdate(BaseModel):
    title: Optional[str] = None
    title_te: Optional[str] = None
    summary: Optional[str] = None
    summary_te: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    link: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_breaking: Optional[bool] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: str = "editor"  # admin, editor, viewer

# ============== CATEGORIES ==============

NEWS_CATEGORIES = {
    "local": {"name_en": "Local", "name_te": "స్థానికం", "icon": "map-pin", "color": "#3B82F6"},
    "city": {"name_en": "City", "name_te": "నగరం", "icon": "building", "color": "#8B5CF6"},
    "state": {"name_en": "State", "name_te": "రాష్ట్రం", "icon": "landmark", "color": "#10B981"},
    "national": {"name_en": "National", "name_te": "జాతీయం", "icon": "flag", "color": "#F59E0B"},
    "international": {"name_en": "International", "name_te": "అంతర్జాతీయం", "icon": "globe", "color": "#6366F1"},
    "sports": {"name_en": "Sports", "name_te": "క్రీడలు", "icon": "trophy", "color": "#22C55E"},
    "entertainment": {"name_en": "Entertainment", "name_te": "వినోదం", "icon": "film", "color": "#EC4899"},
    "tech": {"name_en": "Technology", "name_te": "టెక్నాలజీ", "icon": "cpu", "color": "#06B6D4"},
    "health": {"name_en": "Health", "name_te": "ఆరోగ్యం", "icon": "heart-pulse", "color": "#EF4444"},
    "business": {"name_en": "Business", "name_te": "వ్యాపారం", "icon": "briefcase", "color": "#84CC16"},
    "politics": {"name_en": "Politics", "name_te": "రాజకీయాలు", "icon": "vote", "color": "#F97316"},
    "education": {"name_en": "Education", "name_te": "విద్య", "icon": "graduation-cap", "color": "#0EA5E9"},
}

# RSS feed sources by category
RSS_FEEDS = {
    "local": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://telanganatoday.com/feed",
    ],
    "city": [
        "https://www.siasat.com/hyderabad/feed/",
    ],
    "state": [
        "https://telanganatoday.com/feed",
    ],
    "national": [
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    ],
    "sports": [
        "https://www.thehindu.com/sport/feeder/default.rss",
    ],
    "tech": [
        "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
    ],
    "health": [
        "https://www.thehindu.com/sci-tech/health/feeder/default.rss",
    ],
    "business": [
        "https://www.thehindu.com/business/feeder/default.rss",
    ],
}

# ============== UTILITIES ==============

def generate_id() -> str:
    return str(uuid.uuid4())[:12]

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_time_ago(date_str: str) -> str:
    """Convert datetime to relative time"""
    if not date_str:
        return "Just now"
    try:
        if isinstance(date_str, str):
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        else:
            dt = date_str
        now = datetime.now(timezone.utc)
        diff = now - dt
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            return f"{int(seconds // 60)}m ago"
        elif seconds < 86400:
            return f"{int(seconds // 3600)}h ago"
        elif seconds < 604800:
            return f"{int(seconds // 86400)}d ago"
        else:
            return dt.strftime("%b %d")
    except:
        return "Just now"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    return jwt.encode(data, JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: str = None):
    """Extract user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    """Require admin role"""
    if user.get("role") not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== AI REPHRASING ==============

async def rephrase_with_ai(title: str, summary: str) -> Dict[str, str]:
    """Use OpenAI to rephrase news for originality"""
    if not OPENAI_API_KEY:
        return {"title": title, "summary": summary}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a news editor. Rephrase the title and summary to be original while keeping facts accurate. Keep it concise. Format: TITLE: [title]\nSUMMARY: [summary]"
                        },
                        {
                            "role": "user",
                            "content": f"Title: {title}\nSummary: {summary}"
                        }
                    ],
                    "max_tokens": 300
                },
                timeout=30.0
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            
            result = {"title": title, "summary": summary}
            for line in content.strip().split('\n'):
                if line.startswith("TITLE:"):
                    result["title"] = line.replace("TITLE:", "").strip()
                elif line.startswith("SUMMARY:"):
                    result["summary"] = line.replace("SUMMARY:", "").strip()
            return result
    except Exception as e:
        logger.error(f"AI rephrase error: {e}")
        return {"title": title, "summary": summary}

# ============== RSS SCRAPING ==============

async def scrape_rss_feed(url: str, category: str, limit: int = 10) -> List[Dict]:
    """Scrape news from RSS feed"""
    news_items = []
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
            response = await client.get(url, headers=headers, timeout=20.0, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml-xml')
                items = soup.find_all('item')[:limit]
                
                for idx, item in enumerate(items):
                    title_el = item.find('title')
                    link_el = item.find('link')
                    desc_el = item.find('description')
                    pub_date = item.find('pubDate')
                    
                    # Extract image
                    image = None
                    media = item.find('media:content') or item.find('enclosure') or item.find('media:thumbnail')
                    if media and media.get('url'):
                        image = media.get('url')
                    
                    if not image and desc_el:
                        desc_soup = BeautifulSoup(desc_el.text, 'html.parser')
                        img_tag = desc_soup.find('img')
                        if img_tag and img_tag.get('src'):
                            image = img_tag.get('src')
                    
                    # Clean description
                    desc_text = ""
                    if desc_el:
                        desc_soup = BeautifulSoup(desc_el.text, 'html.parser')
                        desc_text = desc_soup.get_text()[:400].strip()
                    
                    # Determine source
                    source = "News"
                    if "thehindu" in url:
                        source = "The Hindu"
                    elif "timesofindia" in url:
                        source = "Times of India"
                    elif "telangana" in url.lower():
                        source = "Telangana Today"
                    elif "siasat" in url:
                        source = "Siasat"
                    elif "hansindia" in url:
                        source = "The Hans India"
                    
                    title_text = title_el.text.strip() if title_el else "No title"
                    
                    news_items.append({
                        "id": f"rss_{category}_{idx}_{uuid.uuid4().hex[:6]}",
                        "title": title_text,
                        "summary": desc_text or "Read more...",
                        "link": link_el.text.strip() if link_el else "",
                        "image_url": image,
                        "category": category,
                        "source": source,
                        "is_scraped": True,
                        "published_at": pub_date.text if pub_date else now_iso(),
                        "created_at": now_iso()
                    })
    except Exception as e:
        logger.error(f"RSS scrape error for {url}: {e}")
    
    return news_items

async def scrape_category(category: str, limit: int = 20, use_ai: bool = False) -> List[Dict]:
    """Scrape all RSS feeds for a category"""
    feeds = RSS_FEEDS.get(category, [])
    all_news = []
    
    for feed_url in feeds:
        news = await scrape_rss_feed(feed_url, category, limit=limit // len(feeds) if feeds else limit)
        all_news.extend(news)
    
    # Optional: AI rephrase first 5 articles
    if use_ai and OPENAI_API_KEY:
        for i, article in enumerate(all_news[:5]):
            rephrased = await rephrase_with_ai(article["title"], article["summary"])
            all_news[i]["title"] = rephrased["title"]
            all_news[i]["summary"] = rephrased["summary"]
            all_news[i]["is_ai_rephrased"] = True
    
    return all_news[:limit]

# ============== SYNC WITH DAMMAIGUDA ==============

async def sync_to_dammaiguda(article: Dict):
    """Push article to My Dammaiguda API"""
    if not DAMMAIGUDA_API or not DAMMAIGUDA_TOKEN:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DAMMAIGUDA_API}/news/admin/push",
                json={
                    "title": article.get("title"),
                    "title_te": article.get("title_te"),
                    "summary": article.get("summary"),
                    "summary_te": article.get("summary_te"),
                    "category": article.get("category", "local"),
                    "image_url": article.get("image_url"),
                    "video_url": article.get("video_url"),
                    "link": article.get("link"),
                    "is_pinned": article.get("is_pinned", False),
                    "priority": article.get("priority", 5),
                    "content_type": article.get("content_type", "text")
                },
                headers={"Authorization": f"Bearer {DAMMAIGUDA_TOKEN}"},
                timeout=30.0
            )
            return response.json()
    except Exception as e:
        logger.error(f"Sync to Dammaiguda failed: {e}")
        return None

# ============== ROUTES: PUBLIC ==============

@app.get("/")
async def root():
    return {
        "service": "News API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "categories": "/api/news/categories",
            "all_news": "/api/news/feed/all",
            "by_category": "/api/news/{category}",
            "admin": "/api/news/admin/*"
        }
    }

@app.get("/api/news/categories")
async def get_categories():
    """Get all available news categories"""
    return {
        "categories": [
            {"id": k, **v} for k, v in NEWS_CATEGORIES.items()
        ]
    }

@app.get("/api/news/feed/all")
async def get_all_news(
    limit: int = Query(30, ge=1, le=100),
    include_scraped: bool = Query(False)
):
    """Get all news from all categories"""
    all_news = []
    
    # Get admin-pushed articles
    admin_news = await db.news_articles.find(
        {"is_active": {"$ne": False}},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("is_breaking", -1), ("priority", 1), ("created_at", -1)]).to_list(limit)
    
    for article in admin_news:
        article["time_ago"] = get_time_ago(article.get("created_at"))
        all_news.append(article)
    
    # Optionally include scraped news
    if include_scraped and len(all_news) < limit:
        for category in ["local", "national", "sports"]:
            scraped = await scrape_category(category, limit=5)
            all_news.extend(scraped[:limit - len(all_news)])
            if len(all_news) >= limit:
                break
    
    return {
        "news": all_news[:limit],
        "total": len(all_news),
        "fetched_at": now_iso()
    }

@app.get("/api/news/{category}")
async def get_news_by_category(
    category: str,
    limit: int = Query(20, ge=1, le=100),
    include_scraped: bool = Query(False),
    use_ai: bool = Query(False)
):
    """Get news for a specific category"""
    if category not in NEWS_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Available: {list(NEWS_CATEGORIES.keys())}")
    
    all_news = []
    
    # Get admin-pushed articles for this category
    admin_news = await db.news_articles.find(
        {"$or": [{"category": category}, {"is_pinned": True}], "is_active": {"$ne": False}},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("is_breaking", -1), ("priority", 1), ("created_at", -1)]).to_list(limit)
    
    for article in admin_news:
        article["time_ago"] = get_time_ago(article.get("created_at"))
        all_news.append(article)
    
    # Optionally scrape RSS feeds
    if include_scraped and len(all_news) < limit:
        scraped = await scrape_category(category, limit=limit - len(all_news), use_ai=use_ai)
        all_news.extend(scraped)
    
    return {
        "category": category,
        "category_info": NEWS_CATEGORIES[category],
        "news": all_news[:limit],
        "total": len(all_news),
        "fetched_at": now_iso()
    }

@app.get("/api/news/article/{article_id}")
async def get_article(article_id: str):
    """Get single article by ID"""
    article = await db.news_articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Increment view count
    await db.news_articles.update_one(
        {"id": article_id},
        {"$inc": {"views": 1}}
    )
    
    article["time_ago"] = get_time_ago(article.get("created_at"))
    return article

# ============== ROUTES: ADMIN ==============

@app.post("/api/news/admin/push")
async def admin_push_news(
    article: NewsArticle,
    background_tasks: BackgroundTasks,
    sync_to_app: bool = Query(False, description="Also push to My Dammaiguda"),
    user: dict = Depends(require_admin)
):
    """Create/push a new article"""
    if article.category not in NEWS_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    new_article = {
        "id": generate_id(),
        "title": article.title,
        "title_te": article.title_te or article.title,
        "summary": article.summary,
        "summary_te": article.summary_te or article.summary,
        "category": article.category,
        "category_info": NEWS_CATEGORIES[article.category],
        "image_url": article.image_url,
        "video_url": article.video_url,
        "link": article.link,
        "source": article.source,
        "content_type": article.content_type,
        "is_pinned": article.is_pinned,
        "is_breaking": article.is_breaking,
        "priority": article.priority,
        "is_active": True,
        "views": 0,
        "created_by": user["id"],
        "created_by_name": user.get("name"),
        "created_at": now_iso(),
        "updated_at": now_iso()
    }
    
    await db.news_articles.insert_one(new_article)
    new_article.pop("_id", None)
    
    # Sync to My Dammaiguda in background
    if sync_to_app:
        background_tasks.add_task(sync_to_dammaiguda, new_article)
    
    return {"success": True, "article": new_article}

@app.get("/api/news/admin/all")
async def admin_get_all_news(user: dict = Depends(require_admin)):
    """Get all articles (admin view)"""
    articles = await db.news_articles.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    for article in articles:
        article["time_ago"] = get_time_ago(article.get("created_at"))
    
    return {"articles": articles, "total": len(articles)}

@app.put("/api/news/admin/{article_id}")
async def admin_update_article(
    article_id: str,
    updates: NewsArticleUpdate,
    user: dict = Depends(require_admin)
):
    """Update an article"""
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    update_data["updated_at"] = now_iso()
    update_data["updated_by"] = user["id"]
    
    result = await db.news_articles.update_one(
        {"id": article_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    updated = await db.news_articles.find_one({"id": article_id}, {"_id": 0})
    return {"success": True, "article": updated}

@app.delete("/api/news/admin/{article_id}")
async def admin_delete_article(article_id: str, user: dict = Depends(require_admin)):
    """Delete an article"""
    result = await db.news_articles.delete_one({"id": article_id})
    
    return {"success": True, "deleted": result.deleted_count > 0}

@app.post("/api/news/admin/{article_id}/pin")
async def admin_toggle_pin(article_id: str, user: dict = Depends(require_admin)):
    """Toggle pin status"""
    article = await db.news_articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    new_status = not article.get("is_pinned", False)
    await db.news_articles.update_one(
        {"id": article_id},
        {"$set": {"is_pinned": new_status, "updated_at": now_iso()}}
    )
    
    return {"success": True, "is_pinned": new_status}

@app.post("/api/news/admin/{article_id}/breaking")
async def admin_toggle_breaking(article_id: str, user: dict = Depends(require_admin)):
    """Toggle breaking news status"""
    article = await db.news_articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    new_status = not article.get("is_breaking", False)
    await db.news_articles.update_one(
        {"id": article_id},
        {"$set": {"is_breaking": new_status, "updated_at": now_iso()}}
    )
    
    return {"success": True, "is_breaking": new_status}

# ============== ROUTES: USER BOOKMARKS ==============

@app.post("/api/news/bookmark/{article_id}")
async def bookmark_article(article_id: str, user: dict = Depends(get_current_user)):
    """Save article to bookmarks"""
    existing = await db.news_bookmarks.find_one({
        "user_id": user["id"],
        "article_id": article_id
    })
    
    if existing:
        return {"success": True, "message": "Already bookmarked"}
    
    await db.news_bookmarks.insert_one({
        "id": generate_id(),
        "user_id": user["id"],
        "article_id": article_id,
        "created_at": now_iso()
    })
    
    return {"success": True, "message": "Bookmarked"}

@app.delete("/api/news/bookmark/{article_id}")
async def remove_bookmark(article_id: str, user: dict = Depends(get_current_user)):
    """Remove article from bookmarks"""
    await db.news_bookmarks.delete_one({
        "user_id": user["id"],
        "article_id": article_id
    })
    
    return {"success": True, "message": "Removed"}

@app.get("/api/news/bookmarks")
async def get_bookmarks(user: dict = Depends(get_current_user)):
    """Get user's bookmarked articles"""
    bookmarks = await db.news_bookmarks.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get full article data
    article_ids = [b["article_id"] for b in bookmarks]
    articles = await db.news_articles.find(
        {"id": {"$in": article_ids}},
        {"_id": 0}
    ).to_list(100)
    
    for article in articles:
        article["time_ago"] = get_time_ago(article.get("created_at"))
    
    return {"bookmarks": articles, "total": len(articles)}

# ============== ROUTES: AUTH ==============

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    """Register new user"""
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = {
        "id": generate_id(),
        "username": user_data.username,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "created_at": now_iso()
    }
    
    await db.users.insert_one(new_user)
    
    token = create_token({"user_id": new_user["id"]})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": new_user["id"],
            "username": new_user["username"],
            "name": new_user["name"],
            "role": new_user["role"]
        }
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"username": credentials.username})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"user_id": user["id"]})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "name": user.get("name"),
            "role": user.get("role")
        }
    }

@app.get("/api/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user"""
    return user

# ============== SCRAPING JOBS ==============

@app.post("/api/news/admin/scrape/{category}")
async def trigger_scrape(
    category: str,
    limit: int = Query(10, ge=1, le=50),
    use_ai: bool = Query(False),
    auto_save: bool = Query(False),
    user: dict = Depends(require_admin)
):
    """Manually trigger RSS scraping for a category"""
    if category not in NEWS_CATEGORIES and category != "all":
        raise HTTPException(status_code=400, detail="Invalid category")
    
    categories = [category] if category != "all" else list(RSS_FEEDS.keys())
    all_scraped = []
    
    for cat in categories:
        scraped = await scrape_category(cat, limit=limit, use_ai=use_ai)
        all_scraped.extend(scraped)
        
        # Auto-save to database
        if auto_save and scraped:
            for article in scraped:
                article["is_scraped"] = True
                article["scraped_at"] = now_iso()
                await db.news_articles.update_one(
                    {"id": article["id"]},
                    {"$set": article},
                    upsert=True
                )
    
    return {
        "success": True,
        "scraped_count": len(all_scraped),
        "articles": all_scraped,
        "saved_to_db": auto_save
    }

# ============== HEALTH CHECK ==============

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "News API",
        "database": "connected" if db else "disconnected",
        "timestamp": now_iso()
    }

# ============== RUN ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
