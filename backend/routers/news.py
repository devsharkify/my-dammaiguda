"""News Router - Multi-source news aggregation with admin push"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import httpx
from bs4 import BeautifulSoup
import logging
import time
import re
from .utils import db, generate_id, now_iso, get_current_user

router = APIRouter(prefix="/news", tags=["News"])

# ============== NEWS SOURCES CONFIG ==============

NEWS_CATEGORIES = {
    "local": {"en": "Local - Dammaiguda", "te": "స్థానిక - దమ్మాయిగూడ"},
    "city": {"en": "City - Hyderabad", "te": "నగరం - హైదరాబాద్"},
    "state": {"en": "State - Telangana", "te": "రాష్ట్రం - తెలంగాణ"},
    "national": {"en": "National - India", "te": "జాతీయ - భారతదేశం"},
    "international": {"en": "International", "te": "అంతర్జాతీయ"},
    "sports": {"en": "Sports", "te": "క్రీడలు"},
    "entertainment": {"en": "Entertainment", "te": "వినోదం"},
    "tech": {"en": "Technology", "te": "టెక్నాలజీ"},
    "health": {"en": "Health", "te": "ఆరోగ్యం"},
    "business": {"en": "Business", "te": "వ్యాపారం"}
}

# Multiple RSS sources for better coverage
RSS_FEEDS = {
    "local": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://www.deccanchronicle.com/rss_feed/?rss_section=nation"
    ],
    "city": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://www.deccanchronicle.com/rss_feed/?rss_section=nation"
    ],
    "state": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://telanganatoday.com/feed"
    ],
    "national": [
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
        "https://www.deccanchronicle.com/rss_feed/?rss_section=nation"
    ],
    "international": [
        "https://www.thehindu.com/news/international/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms"
    ],
    "sports": [
        "https://www.thehindu.com/sport/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms"
    ],
    "entertainment": [
        "https://www.thehindu.com/entertainment/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms"
    ],
    "tech": [
        "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms"
    ],
    "health": [
        "https://www.thehindu.com/sci-tech/health/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/3908999.cms"
    ],
    "business": [
        "https://www.thehindu.com/business/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms"
    ]
}

# Telugu news sources
TELUGU_SOURCES = [
    {"name": "Eenadu", "url": "https://www.eenadu.net/"},
    {"name": "Sakshi", "url": "https://www.sakshi.com/"},
    {"name": "TV9 Telugu", "url": "https://tv9telugu.com/"},
    {"name": "ETV Bharat", "url": "https://www.etvbharat.com/telugu/"}
]

# ============== MODELS ==============

class AdminNewsPush(BaseModel):
    title: str
    title_te: Optional[str] = None
    summary: str
    summary_te: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    link: Optional[str] = None
    is_pinned: bool = True
    priority: int = 1  # 1=highest

# ============== HELPER FUNCTIONS ==============

async def scrape_rss_feed(url: str, category: str, limit: int = 10) -> List[Dict]:
    """Scrape news from RSS feed"""
    news_items = []
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = await client.get(url, headers=headers, timeout=15.0, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml-xml')
                items = soup.find_all('item')[:limit]
                
                for idx, item in enumerate(items):
                    title = item.find('title')
                    link = item.find('link')
                    description = item.find('description')
                    pub_date = item.find('pubDate')
                    
                    # Extract image
                    image = None
                    media = item.find('media:content') or item.find('enclosure') or item.find('media:thumbnail')
                    if media and media.get('url'):
                        image = media.get('url')
                    
                    # Clean description
                    desc_text = ""
                    if description:
                        desc_soup = BeautifulSoup(description.text, 'html.parser')
                        desc_text = desc_soup.get_text()[:300]
                    
                    # Determine source from URL
                    source = "News Feed"
                    if "thehindu" in url:
                        source = "The Hindu"
                    elif "timesofindia" in url:
                        source = "Times of India"
                    elif "deccan" in url:
                        source = "Deccan Chronicle"
                    elif "hansindia" in url:
                        source = "The Hans India"
                    elif "telangana" in url.lower():
                        source = "Telangana Today"
                    
                    news_items.append({
                        "id": f"{category}_{idx}_{int(time.time())}",
                        "title": title.text.strip() if title else "No title",
                        "summary": desc_text,
                        "link": link.text.strip() if link else "",
                        "image": image,
                        "category": category,
                        "category_label": NEWS_CATEGORIES.get(category, {}).get("en", category),
                        "category_label_te": NEWS_CATEGORIES.get(category, {}).get("te", category),
                        "published_at": pub_date.text if pub_date else datetime.now(timezone.utc).isoformat(),
                        "source": source,
                        "is_admin_pushed": False,
                        "is_pinned": False
                    })
    except Exception as e:
        logging.error(f"RSS scrape error for {url}: {str(e)}")
    
    return news_items

def generate_placeholder_news(category: str, limit: int = 10) -> List[Dict]:
    """Generate placeholder news"""
    placeholder_news = {
        "local": [
            {"title": "Dammaiguda Road Development Project Announced", "title_te": "దమ్మాయిగూడ రోడ్ అభివృద్ధి ప్రాజెక్ట్ ప్రకటన"},
            {"title": "New Health Center Opens in Dammaiguda", "title_te": "దమ్మాయిగూడలో కొత్త ఆరోగ్య కేంద్రం ప్రారంభం"},
            {"title": "Community Clean-up Drive This Weekend", "title_te": "ఈ వారాంతంలో కమ్యూనిటీ క్లీన్-అప్ డ్రైవ్"},
            {"title": "Ward Meeting Scheduled for Next Month", "title_te": "వచ్చే నెలలో వార్డు సమావేశం నిర్ణయం"},
            {"title": "Dump Yard Remediation Update", "title_te": "డంప్ యార్డ్ పరిష్కార నవీకరణ"}
        ],
        "city": [
            {"title": "Metro Expansion to Reach Secunderabad East", "title_te": "మెట్రో విస్తరణ సికింద్రాబాద్ తూర్పుకు"},
            {"title": "Hyderabad Ranks in Top 10 IT Cities", "title_te": "హైదరాబాద్ టాప్ 10 IT నగరాల్లో"},
            {"title": "New Flyover Construction at Uppal", "title_te": "ఉప్పల్‌లో కొత్త ఫ్లైఓవర్"},
            {"title": "GHMC Green Initiative Program", "title_te": "GHMC గ్రీన్ ప్రోగ్రామ్"}
        ],
        "state": [
            {"title": "Telangana Government Announces Welfare Schemes", "title_te": "తెలంగాణ ప్రభుత్వం సంక్షేమ పథకాలు"},
            {"title": "State Budget Session Next Week", "title_te": "రాష్ట్ర బడ్జెట్ సెషన్ వచ్చే వారం"},
            {"title": "Irrigation Projects Progress", "title_te": "నీటిపారుదల ప్రాజెక్టుల పురోగతి"}
        ],
        "national": [
            {"title": "Parliament Session Highlights", "title_te": "పార్లమెంట్ సెషన్ హైలైట్స్"},
            {"title": "Economy Shows Strong Growth", "title_te": "ఆర్థిక వ్యవస్థ బలమైన వృద్ధి"},
            {"title": "Digital India Milestone", "title_te": "డిజిటల్ ఇండియా మైలురాయి"}
        ],
        "sports": [
            {"title": "IPL Auction: Hyderabad Team Big Signings", "title_te": "IPL వేలం: హైదరాబాద్ పెద్ద సైనింగ్‌లు"},
            {"title": "Cricket Team World Cup Prep", "title_te": "క్రికెట్ టీమ్ ప్రపంచ కప్ సిద్ధం"}
        ],
        "entertainment": [
            {"title": "Tollywood Blockbuster Breaks Records", "title_te": "టాలీవుడ్ బ్లాక్‌బస్టర్ రికార్డులు"},
            {"title": "Music Festival in Hyderabad", "title_te": "హైదరాబాద్‌లో సంగీత ఉత్సవం"}
        ],
        "tech": [
            {"title": "AI Startups Raise Major Funding", "title_te": "AI స్టార్టప్‌లు పెద్ద ఫండింగ్"},
            {"title": "5G Network Expansion", "title_te": "5G నెట్‌వర్క్ విస్తరణ"}
        ],
        "health": [
            {"title": "Vaccination Drive for Children", "title_te": "పిల్లలకు వ్యాక్సినేషన్ డ్రైవ్"},
            {"title": "Air Quality Health Advisory", "title_te": "వాయు నాణ్యత ఆరోగ్య సలహా"}
        ],
        "business": [
            {"title": "Stock Markets Positive Trends", "title_te": "స్టాక్ మార్కెట్లు సానుకూల ధోరణులు"},
            {"title": "Industrial Corridor for Telangana", "title_te": "తెలంగాణకు పారిశ్రామిక కారిడార్"}
        ],
        "international": [
            {"title": "Global Climate Summit Outcomes", "title_te": "గ్లోబల్ క్లైమేట్ సమ్మిట్ ఫలితాలు"},
            {"title": "Tech Giants Quarterly Earnings", "title_te": "టెక్ దిగ్గజాలు త్రైమాసిక ఆదాయాలు"}
        ]
    }
    
    items = placeholder_news.get(category, placeholder_news["national"])
    result = []
    
    for idx, item in enumerate(items[:limit]):
        result.append({
            "id": f"{category}_ph_{idx}_{int(time.time())}",
            "title": item["title"],
            "title_te": item.get("title_te", item["title"]),
            "summary": f"Latest updates on {item['title'].lower()}...",
            "summary_te": f"{item.get('title_te', item['title'])} గురించి తాజా నవీకరణలు...",
            "link": "#",
            "image": None,
            "category": category,
            "category_label": NEWS_CATEGORIES.get(category, {}).get("en", category),
            "category_label_te": NEWS_CATEGORIES.get(category, {}).get("te", category),
            "published_at": datetime.now(timezone.utc).isoformat(),
            "source": "My Dammaiguda News",
            "is_placeholder": True,
            "is_admin_pushed": False,
            "is_pinned": False
        })
    
    return result

# ============== ROUTES ==============

@router.get("/categories")
async def get_news_categories():
    """Get all news categories"""
    return NEWS_CATEGORIES

@router.get("/{category}")
async def get_news_by_category(category: str, limit: int = 20):
    """Get news for a category"""
    if category not in NEWS_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category")
    
    all_news = []
    
    # First, get admin-pushed/pinned news for this category
    pinned_news = await db.admin_news.find(
        {"category": category, "is_active": True},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("priority", 1), ("created_at", -1)]).to_list(5)
    
    for news in pinned_news:
        news["is_admin_pushed"] = True
        all_news.append(news)
    
    # Then scrape from RSS feeds
    feeds = RSS_FEEDS.get(category, [])
    for feed_url in feeds:
        scraped = await scrape_rss_feed(feed_url, category, limit=limit // len(feeds) if feeds else limit)
        all_news.extend(scraped)
    
    # If no news found, use placeholders
    if len(all_news) <= len(pinned_news):
        all_news.extend(generate_placeholder_news(category, limit))
    
    # Sort: pinned first, then by date
    all_news.sort(key=lambda x: (not x.get("is_pinned", False), not x.get("is_admin_pushed", False), x.get("published_at", "")), reverse=True)
    
    return {
        "category": category,
        "category_info": NEWS_CATEGORIES[category],
        "news": all_news[:limit],
        "count": len(all_news[:limit]),
        "fetched_at": now_iso()
    }

@router.get("/feed/all")
async def get_all_news(limit: int = 5):
    """Get mixed news from all categories"""
    all_news = []
    
    # Get pinned news from all categories
    pinned = await db.admin_news.find(
        {"is_active": True, "is_pinned": True},
        {"_id": 0}
    ).sort("priority", 1).to_list(10)
    
    for news in pinned:
        news["is_admin_pushed"] = True
        all_news.append(news)
    
    for category in ["local", "city", "national", "sports", "entertainment"]:
        feeds = RSS_FEEDS.get(category, [])
        if feeds:
            news = await scrape_rss_feed(feeds[0], category, limit)
            all_news.extend(news)
    
    all_news.sort(key=lambda x: (not x.get("is_pinned", False), x.get("published_at", "")), reverse=True)
    
    return {
        "news": all_news[:limit * 6],
        "categories": list(NEWS_CATEGORIES.keys()),
        "fetched_at": now_iso()
    }

# ============== ADMIN ROUTES ==============

@router.post("/admin/push")
async def admin_push_news(news: AdminNewsPush, user: dict = Depends(get_current_user)):
    """Admin: Push a news article"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if news.category not in NEWS_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    new_news = {
        "id": generate_id(),
        "title": news.title,
        "title_te": news.title_te or news.title,
        "summary": news.summary,
        "summary_te": news.summary_te or news.summary,
        "category": news.category,
        "category_label": NEWS_CATEGORIES[news.category]["en"],
        "category_label_te": NEWS_CATEGORIES[news.category]["te"],
        "image": news.image_url,
        "link": news.link,
        "is_pinned": news.is_pinned,
        "priority": news.priority,
        "is_active": True,
        "is_admin_pushed": True,
        "source": "My Dammaiguda Admin",
        "pushed_by": user["id"],
        "pushed_by_name": user.get("name"),
        "published_at": now_iso(),
        "created_at": now_iso()
    }
    
    await db.admin_news.insert_one(new_news)
    new_news.pop("_id", None)
    
    return {"success": True, "news": new_news}

@router.get("/admin/pushed")
async def get_admin_pushed_news(user: dict = Depends(get_current_user)):
    """Admin: Get all admin-pushed news"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    news = await db.admin_news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return news

@router.put("/admin/news/{news_id}")
async def update_admin_news(news_id: str, updates: dict, user: dict = Depends(get_current_user)):
    """Admin: Update pushed news"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    allowed_fields = ["title", "title_te", "summary", "summary_te", "is_pinned", "priority", "is_active"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if update_data:
        await db.admin_news.update_one({"id": news_id}, {"$set": update_data})
    
    return {"success": True, "message": "News updated"}

@router.delete("/admin/news/{news_id}")
async def delete_admin_news(news_id: str, user: dict = Depends(get_current_user)):
    """Admin: Delete pushed news"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.admin_news.delete_one({"id": news_id})
    
    return {"success": True, "message": "News deleted"}

@router.post("/save")
async def save_news_article(article_id: str, user: dict = Depends(get_current_user)):
    """Save a news article"""
    saved = {
        "id": generate_id(),
        "user_id": user["id"],
        "article_id": article_id,
        "saved_at": now_iso()
    }
    
    await db.saved_news.insert_one(saved)
    return {"success": True, "message": "Article saved"}

@router.get("/saved")
async def get_saved_news(user: dict = Depends(get_current_user)):
    """Get saved articles"""
    saved = await db.saved_news.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("saved_at", -1).to_list(100)
    
    return saved
