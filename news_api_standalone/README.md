# News API - Standalone Service

A complete, production-ready News API that can be deployed separately and integrated with My Dammaiguda or any other app.

## Features

- **Multi-category news** (local, city, state, national, sports, etc.)
- **Bilingual support** (English + Telugu)
- **Admin dashboard** for pushing news
- **Video news support** (YouTube embeds)
- **AI-powered rephrasing** (OpenAI integration)
- **RSS feed scraping** (configurable sources)
- **User bookmarks** (save articles)
- **Breaking news** with pinning

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news/categories` | Get all categories |
| GET | `/api/news/feed/all` | Get all news |
| GET | `/api/news/{category}` | Get news by category |
| GET | `/api/news/article/{id}` | Get single article |

### Admin Endpoints (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/news/admin/push` | Create news article |
| GET | `/api/news/admin/all` | Get all admin news |
| PUT | `/api/news/admin/{id}` | Update article |
| DELETE | `/api/news/admin/{id}` | Delete article |
| POST | `/api/news/admin/{id}/pin` | Toggle pin status |

### User Endpoints (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/news/bookmark/{id}` | Save article |
| DELETE | `/api/news/bookmark/{id}` | Remove bookmark |
| GET | `/api/news/bookmarks` | Get saved articles |

## Integration with My Dammaiguda

```python
import httpx

DAMMAIGUDA_API = "https://mydammaiguda.in/api"

# Push news to My Dammaiguda
async def push_to_dammaiguda(news_data, admin_token):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{DAMMAIGUDA_API}/news/admin/push",
            json=news_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        return response.json()
```

## Environment Variables

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=news_db
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-xxx (optional, for AI rephrasing)
DAMMAIGUDA_API_URL=https://mydammaiguda.in/api (for sync)
DAMMAIGUDA_ADMIN_TOKEN=xxx (for sync)
```

## Database Collections

- `news_articles` - All news articles
- `news_bookmarks` - User saved articles
- `news_analytics` - View counts, reactions

## License

MIT - Free to use and modify
