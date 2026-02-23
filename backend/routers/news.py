"""News Router - Multi-source news aggregation with AI rephrasing and admin push"""
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import httpx
from bs4 import BeautifulSoup
import logging
import time
import re
import os
import asyncio
from dotenv import load_dotenv
from .utils import db, generate_id, now_iso, get_current_user

load_dotenv()

router = APIRouter(prefix="/news", tags=["News"])

# ============== HELPER: TIME AGO ==============

def get_time_ago(date_str: str) -> str:
    """Convert datetime string to relative time ago"""
    if not date_str:
        return "Just now"
    try:
        from datetime import datetime, timezone
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
    except Exception:
        return "Just now"

# ============== AI REPHRASING SETUP ==============

async def rephrase_with_ai(title: str, summary: str) -> Dict:
    """Use AI to rephrase news article for originality"""
    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        return {"title": title, "summary": summary}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are a professional news editor. Rephrase the given news title and summary to be original while preserving all key facts. Keep it concise and professional. Output format: TITLE: [rephrased title]\nSUMMARY: [rephrased summary in 2-3 sentences]"},
                        {"role": "user", "content": f"Rephrase this news:\nTitle: {title}\nSummary: {summary}"}
                    ],
                    "max_tokens": 500
                },
                timeout=30.0
            )
            resp.raise_for_status()
            response = resp.json()["choices"][0]["message"]["content"]
        
        # Parse response
        lines = response.strip().split('\n')
        rephrased_title = title
        rephrased_summary = summary
        
        for line in lines:
            if line.startswith("TITLE:"):
                rephrased_title = line.replace("TITLE:", "").strip()
            elif line.startswith("SUMMARY:"):
                rephrased_summary = line.replace("SUMMARY:", "").strip()
        
        return {"title": rephrased_title, "summary": rephrased_summary}
    except Exception as e:
        logging.error(f"AI rephrase error: {str(e)}")
        return {"title": title, "summary": summary}

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

# Enhanced RSS sources with more reliable feeds
RSS_FEEDS = {
    "local": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://telanganatoday.com/feed",
        "https://www.deccanchronicle.com/rss_feed/?rss_section=nation"
    ],
    "city": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://telanganatoday.com/feed",
        "https://www.siasat.com/feed/"
    ],
    "state": [
        "https://www.thehansindia.com/feeds/telangana.xml",
        "https://telanganatoday.com/feed",
        "https://www.siasat.com/feed/"
    ],
    "national": [
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
        "https://www.deccanchronicle.com/rss_feed/?rss_section=nation",
        "https://www.siasat.com/feed/"
    ],
    "international": [
        "https://www.thehindu.com/news/international/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms"
    ],
    "sports": [
        "https://www.thehindu.com/sport/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
        "https://www.siasat.com/sports/feed/"
    ],
    "entertainment": [
        "https://www.thehindu.com/entertainment/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
        "https://www.siasat.com/entertainment/feed/"
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

# Telugu news sources for web scraping - Prioritize Siasat
TELUGU_SOURCES = {
    "siasat": {"name": "Siasat", "url": "https://www.siasat.com/hyderabad/", "selector": "article", "priority": 1},
    "siasat_telangana": {"name": "Siasat Telangana", "url": "https://www.siasat.com/telangana/", "selector": "article", "priority": 1},
    "eenadu": {"name": "Eenadu", "url": "https://www.eenadu.net/telangana", "selector": ".news-item", "priority": 2},
    "sakshi": {"name": "Sakshi", "url": "https://www.sakshi.com/telugu/telangana", "selector": ".story-card", "priority": 3},
}

# YouTube Shorts channel to fetch videos from
YOUTUBE_SHORTS_CHANNEL = "https://www.youtube.com/@KaizerNigha/shorts"

# Scheduled extraction times (IST): 7 AM, 11 AM, 4 PM, 8 PM
EXTRACTION_SCHEDULE = ["07:00", "11:00", "16:00", "20:00"]

# ============== MODELS ==============

class AdminNewsPush(BaseModel):
    title: str
    title_te: Optional[str] = None
    summary: str
    summary_te: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None  # YouTube video URL
    link: Optional[str] = None
    is_pinned: bool = True
    priority: int = 1  # 1=highest
    content_type: str = "text"  # "text" or "video"

class AdminNewsUpdate(BaseModel):
    title: Optional[str] = None
    title_te: Optional[str] = None
    summary: Optional[str] = None
    summary_te: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    is_pinned: Optional[bool] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    content_type: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

async def fetch_youtube_shorts(channel_url: str = YOUTUBE_SHORTS_CHANNEL, limit: int = 10) -> List[Dict]:
    """Fetch latest YouTube Shorts from Kaizer Nigha channel"""
    shorts = []
    try:
        async with httpx.AsyncClient() as client:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = await client.get(channel_url, headers=headers, timeout=20.0, follow_redirects=True)
            
            if response.status_code == 200:
                # Extract video IDs from shorts page
                import re
                video_ids = re.findall(r'"videoId":"([^"]+)"', response.text)
                seen = set()
                
                for vid in video_ids[:limit * 2]:  # Get more to filter
                    if vid not in seen and len(shorts) < limit:
                        seen.add(vid)
                        shorts.append({
                            "id": f"yt_{vid}",
                            "title": "Kaizer News Short",
                            "summary": "Watch the latest news update from Kaizer News",
                            "video_url": f"https://www.youtube.com/shorts/{vid}",
                            "image": f"https://img.youtube.com/vi/{vid}/maxresdefault.jpg",
                            "source": "Kaizer News",
                            "category": "local",
                            "content_type": "video",
                            "time_ago": "Just now",
                            "is_video": True
                        })
    except Exception as e:
        logging.error(f"Error fetching YouTube shorts: {str(e)}")
    
    return shorts

async def scrape_siasat_news(limit: int = 15) -> List[Dict]:
    """Scrape latest news from Siasat.com with AI summarization"""
    news_items = []
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    try:
        urls = [
            "https://www.siasat.com/hyderabad/",
            "https://www.siasat.com/telangana/"
        ]
        
        async with httpx.AsyncClient() as client:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            
            for url in urls:
                try:
                    response = await client.get(url, headers=headers, timeout=20.0, follow_redirects=True)
                    
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        articles = soup.find_all('article', limit=limit // 2)
                        
                        for article in articles:
                            try:
                                title_el = article.find(['h2', 'h3', 'h4'])
                                link_el = article.find('a', href=True)
                                img_el = article.find('img')
                                
                                if title_el and link_el:
                                    title = title_el.get_text(strip=True)
                                    link = link_el['href']
                                    if not link.startswith('http'):
                                        link = f"https://www.siasat.com{link}"
                                    
                                    image = None
                                    if img_el:
                                        image = img_el.get('data-src') or img_el.get('src')
                                    
                                    # Create concise summary
                                    summary = title[:150] + "..." if len(title) > 150 else title
                                    
                                    # Use AI to create better summary if available
                                    if openai_key and len(news_items) < 5:
                                        try:
                                            result = await rephrase_with_ai(title, summary)
                                            title = result.get("title", title)
                                            summary = result.get("summary", summary)
                                        except:
                                            pass
                                    
                                    news_items.append({
                                        "id": generate_id(),
                                        "title": title,
                                        "summary": summary,
                                        "link": link,
                                        "image": image,
                                        "source": "Siasat",
                                        "category": "city" if "hyderabad" in url else "state",
                                        "time_ago": "Just now",
                                        "content_type": "text"
                                    })
                            except Exception as e:
                                logging.error(f"Error parsing Siasat article: {e}")
                                continue
                except Exception as e:
                    logging.error(f"Error fetching {url}: {e}")
                    continue
    except Exception as e:
        logging.error(f"Error in scrape_siasat_news: {str(e)}")
    
    return news_items[:limit]

async def scrape_rss_feed(url: str, category: str, limit: int = 10, use_ai: bool = False) -> List[Dict]:
    """Scrape news from RSS feed with optional AI rephrasing"""
    news_items = []
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
            response = await client.get(url, headers=headers, timeout=20.0, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml-xml')
                items = soup.find_all('item')[:limit]
                
                for idx, item in enumerate(items):
                    title = item.find('title')
                    link = item.find('link')
                    description = item.find('description')
                    pub_date = item.find('pubDate')
                    
                    # Extract image from various possible locations
                    image = None
                    media = item.find('media:content') or item.find('enclosure') or item.find('media:thumbnail')
                    if media and media.get('url'):
                        image = media.get('url')
                    
                    # Try to extract image from description HTML
                    if not image and description:
                        desc_soup = BeautifulSoup(description.text, 'html.parser')
                        img_tag = desc_soup.find('img')
                        if img_tag and img_tag.get('src'):
                            image = img_tag.get('src')
                    
                    # Clean description
                    desc_text = ""
                    if description:
                        desc_soup = BeautifulSoup(description.text, 'html.parser')
                        desc_text = desc_soup.get_text()[:400].strip()
                    
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
                    elif "siasat" in url:
                        source = "Siasat"
                    elif "tv9" in url:
                        source = "TV9"
                    elif "eenadu" in url:
                        source = "Eenadu"
                    
                    title_text = title.text.strip() if title else "No title"
                    summary_text = desc_text or "Read more..."
                    
                    # Apply AI rephrasing if enabled
                    openai_key = os.environ.get("OPENAI_API_KEY")
                    if use_ai and openai_key and idx < 5:  # Limit AI calls to first 5 items
                        rephrased = await rephrase_with_ai(title_text, summary_text)
                        title_text = rephrased["title"]
                        summary_text = rephrased["summary"]
                    
                    news_items.append({
                        "id": f"{category}_{idx}_{int(time.time())}_{hash(title_text) % 10000}",
                        "title": title_text,
                        "summary": summary_text,
                        "link": link.text.strip() if link else "",
                        "image": image,
                        "category": category,
                        "category_label": NEWS_CATEGORIES.get(category, {}).get("en", category),
                        "category_label_te": NEWS_CATEGORIES.get(category, {}).get("te", category),
                        "published_at": pub_date.text if pub_date else datetime.now(timezone.utc).isoformat(),
                        "source": source,
                        "is_admin_pushed": False,
                        "is_pinned": False,
                        "is_ai_rephrased": use_ai
                    })
    except Exception as e:
        logging.error(f"RSS scrape error for {url}: {str(e)}")
    
    return news_items

async def scrape_website(source_key: str, category: str = "local", limit: int = 5) -> List[Dict]:
    """Scrape Telugu news websites directly"""
    news_items = []
    source = TELUGU_SOURCES.get(source_key)
    
    if not source:
        return news_items
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5,te;q=0.3'
            }
            response = await client.get(source["url"], headers=headers, timeout=15.0, follow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Generic news item extraction
                articles = soup.find_all(['article', 'div'], class_=lambda x: x and any(
                    term in str(x).lower() for term in ['news', 'story', 'article', 'post', 'card']
                ))[:limit]
                
                for idx, article in enumerate(articles):
                    # Extract title
                    title_elem = article.find(['h1', 'h2', 'h3', 'h4', 'a'])
                    title = title_elem.get_text().strip() if title_elem else ""
                    
                    # Extract link
                    link_elem = article.find('a', href=True)
                    link = link_elem['href'] if link_elem else ""
                    if link and not link.startswith('http'):
                        link = source["url"].rstrip('/') + '/' + link.lstrip('/')
                    
                    # Extract image
                    img_elem = article.find('img', src=True)
                    image = img_elem['src'] if img_elem else None
                    if image and not image.startswith('http'):
                        image = source["url"].rstrip('/') + '/' + image.lstrip('/')
                    
                    # Extract summary
                    summary_elem = article.find(['p', 'span', 'div'], class_=lambda x: x and any(
                        term in str(x).lower() for term in ['desc', 'summary', 'excerpt', 'text']
                    ))
                    summary = summary_elem.get_text().strip()[:300] if summary_elem else ""
                    
                    if title and len(title) > 10:
                        news_items.append({
                            "id": f"{source_key}_{idx}_{int(time.time())}",
                            "title": title,
                            "title_te": title,  # Already in Telugu
                            "summary": summary or title[:100],
                            "summary_te": summary or title[:100],
                            "link": link,
                            "image": image,
                            "category": category,
                            "category_label": NEWS_CATEGORIES.get(category, {}).get("en", category),
                            "category_label_te": NEWS_CATEGORIES.get(category, {}).get("te", category),
                            "published_at": datetime.now(timezone.utc).isoformat(),
                            "source": source["name"],
                            "is_admin_pushed": False,
                            "is_pinned": False,
                            "is_telugu_source": True
                        })
    except Exception as e:
        logging.error(f"Website scrape error for {source_key}: {str(e)}")
    
    return news_items

def generate_placeholder_news(category: str, limit: int = 10) -> List[Dict]:
    """Generate placeholder news when scraping fails"""
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

@router.get("/local")
async def get_local_news(
    category: str = Query("local", description="News category"),
    limit: int = Query(30, description="Number of items")
):
    """Get local news feed - only admin-pushed news"""
    all_news = []
    
    # Get admin-pushed news only (no scraped news)
    admin_news = await db.admin_news.find(
        {"$or": [{"category": {"$regex": category, "$options": "i"}}, {"is_pinned": True}]},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("created_at", -1)]).to_list(limit)
    
    for news in admin_news:
        news["is_admin_pushed"] = True
        news["time_ago"] = get_time_ago(news.get("created_at", ""))
        news.setdefault("content_type", "text")
        all_news.append(news)
    
    return {"news": all_news, "total": len(all_news)}

@router.get("/categories")
async def get_news_categories():
    """Get all news categories"""
    return NEWS_CATEGORIES

@router.get("/{category}")
async def get_news_by_category(
    category: str, 
    limit: int = 20,
    use_ai: bool = Query(False, description="Use AI to rephrase articles")
):
    """Get news for a category - admin-pushed news only (no scraping)"""
    if category not in NEWS_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    all_news = []
    
    # Get admin-pushed news for this category only (no scraping)
    admin_news = await db.admin_news.find(
        {"$or": [
            {"category": {"$regex": category, "$options": "i"}},
            {"is_pinned": True}
        ], "is_active": {"$ne": False}},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("priority", 1), ("created_at", -1)]).to_list(limit)
    
    for news in admin_news:
        news["is_admin_pushed"] = True
        news["time_ago"] = get_time_ago(news.get("created_at", ""))
        news.setdefault("content_type", "text")
        all_news.append(news)
    
    return {
        "category": category,
        "category_info": NEWS_CATEGORIES[category],
        "news": all_news,
        "count": len(all_news),
        "ai_enabled": use_ai,
        "fetched_at": now_iso()
    }

@router.get("/feed/all")
async def get_all_news(
    limit: int = 30,
    use_ai: bool = Query(False, description="Use AI to rephrase articles")
):
    """Get all news - admin-pushed only (no scraping)"""
    all_news = []
    
    # Get all admin-pushed news
    admin_news = await db.admin_news.find(
        {"is_active": {"$ne": False}},
        {"_id": 0}
    ).sort([("is_pinned", -1), ("priority", 1), ("created_at", -1)]).to_list(limit)
    
    for news in admin_news:
        news["is_admin_pushed"] = True
        news["time_ago"] = get_time_ago(news.get("created_at", ""))
        news.setdefault("content_type", "text")
        all_news.append(news)
    
    return {
        "news": all_news,
        "categories": list(NEWS_CATEGORIES.keys()),
        "fetched_at": now_iso()
    }

# ============== ADMIN ROUTES ==============

@router.post("/admin/push")
@router.post("/admin/create")
async def admin_push_news(news: AdminNewsPush, user: dict = Depends(get_current_user)):
    """Admin: Push/create a news article"""
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
        "video_url": news.video_url,
        "content_type": news.content_type,
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
@router.get("/admin/all")
async def get_admin_pushed_news(user: dict = Depends(get_current_user)):
    """Admin: Get all admin-pushed news"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    news = await db.admin_news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"news": news, "total": len(news)}

@router.put("/admin/news/{news_id}")
async def update_admin_news(news_id: str, updates: AdminNewsUpdate, user: dict = Depends(get_current_user)):
    """Admin: Update pushed news article"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if update_data:
        update_data["updated_at"] = now_iso()
        update_data["updated_by"] = user["id"]
        await db.admin_news.update_one({"id": news_id}, {"$set": update_data})
    
    updated = await db.admin_news.find_one({"id": news_id}, {"_id": 0})
    return {"success": True, "news": updated}

@router.post("/admin/news/{news_id}/pin")
async def toggle_pin_news(news_id: str, user: dict = Depends(get_current_user)):
    """Admin: Toggle pin status for a news article"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    news = await db.admin_news.find_one({"id": news_id})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    new_pinned = not news.get("is_pinned", False)
    await db.admin_news.update_one(
        {"id": news_id}, 
        {"$set": {"is_pinned": new_pinned, "updated_at": now_iso()}}
    )
    
    return {"success": True, "is_pinned": new_pinned}

@router.delete("/admin/news/{news_id}")
async def delete_admin_news(news_id: str, user: dict = Depends(get_current_user)):
    """Admin: Delete pushed news"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.admin_news.delete_one({"id": news_id})
    
    return {"success": True, "deleted": result.deleted_count > 0}

# ============== USER ROUTES ==============

@router.post("/save/{article_id}")
async def save_news_article(article_id: str, user: dict = Depends(get_current_user)):
    """Save a news article for later"""
    # Check if already saved
    existing = await db.saved_news.find_one({"user_id": user["id"], "article_id": article_id})
    if existing:
        return {"success": True, "message": "Already saved"}
    
    saved = {
        "id": generate_id(),
        "user_id": user["id"],
        "article_id": article_id,
        "saved_at": now_iso()
    }
    
    await db.saved_news.insert_one(saved)
    return {"success": True, "message": "Article saved"}

@router.delete("/save/{article_id}")
async def unsave_news_article(article_id: str, user: dict = Depends(get_current_user)):
    """Remove a saved news article"""
    await db.saved_news.delete_one({"user_id": user["id"], "article_id": article_id})
    return {"success": True, "message": "Article removed"}

@router.get("/saved/list")
async def get_saved_news(user: dict = Depends(get_current_user)):
    """Get user's saved articles"""
    saved = await db.saved_news.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("saved_at", -1).to_list(100)
    
    return {"saved": saved, "count": len(saved)}
