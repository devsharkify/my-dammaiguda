"""Clone Generator Router - Generate full clone with GitHub push"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import json
import zipfile
import io
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "dammaiguda_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

router = APIRouter(prefix="/clone", tags=["Clone Generator"])

# ============== MODELS ==============

class CloneConfig(BaseModel):
    area_id: str
    area_name: str
    area_name_te: Optional[str] = ""
    primary_color: str = "#0F766E"
    domain: str = ""
    package_name: str = ""
    sender_name: str = ""
    tagline: str = "Track Issues. Protect Health. Claim Benefits."
    tagline_te: str = ""
    company_name: str = "Rohan Kulkarni"
    partner_name: str = "Kaizer News"
    education_partner: str = "Bose American Academy"
    stats_benefits: str = "₹5Cr+"
    stats_problems: str = "50+"
    stats_people: str = "25K+"
    lat: float = 17.4534
    lon: float = 78.5674
    backend_url: str = "https://www.mydammaiguda.in"

class GitHubPushRequest(BaseModel):
    config: CloneConfig
    github_token: str
    repo_name: str
    is_private: bool = False

# ============== TEMPLATE GENERATORS ==============

def generate_manifest(config: CloneConfig) -> str:
    """Generate manifest.json for PWA"""
    manifest = {
        "name": f"My {config.area_name} - Civic Engagement Platform",
        "short_name": f"My {config.area_name[:3].upper()}",
        "version": "1.0.0",
        "description": f"{config.tagline} Your civic engagement platform for {config.area_name}.",
        "id": f"my-{config.area_id}-app",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "display_override": ["standalone", "minimal-ui"],
        "orientation": "portrait",
        "theme_color": config.primary_color,
        "background_color": "#0a0a0a",
        "lang": "en",
        "dir": "ltr",
        "icons": [
            {"src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png", "purpose": "any"},
            {"src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "/icons/maskable-icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
            {"src": "/icons/maskable-icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ],
        "categories": ["government", "utilities", "lifestyle", "health"],
        "shortcuts": [
            {"name": "Report Issue", "short_name": "Report", "description": "Report a civic issue", "url": "/issues?action=new", "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]},
            {"name": "View News", "short_name": "News", "description": "Latest local news", "url": "/news", "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]},
            {"name": "Check Benefits", "short_name": "Benefits", "description": "View benefits", "url": "/benefits", "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]},
            {"name": "Health & Fitness", "short_name": "Fitness", "description": "Track your health", "url": "/fitness", "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]}
        ],
        "share_target": {
            "action": "/share",
            "method": "POST",
            "enctype": "multipart/form-data",
            "params": {"title": "title", "text": "text", "url": "url"}
        },
        "launch_handler": {"client_mode": ["navigate-existing", "auto"]},
        "handle_links": "preferred",
        "prefer_related_applications": False,
        "related_applications": [
            {"platform": "play", "url": f"https://play.google.com/store/apps/details?id={config.package_name}", "id": config.package_name}
        ]
    }
    return json.dumps(manifest, indent=2)

def generate_env_file(config: CloneConfig) -> str:
    """Generate .env file for frontend"""
    return f"""REACT_APP_BACKEND_URL={config.backend_url}
REACT_APP_AREA_CODE={config.area_id}
REACT_APP_AREA_NAME={config.area_name}
REACT_APP_THEME_COLOR={config.primary_color}
GENERATE_SOURCEMAP=false
"""

def generate_app_config(config: CloneConfig) -> str:
    """Generate appConfig.js"""
    return f"""// Auto-generated App Configuration for {config.area_name}
// Generated on {datetime.now(timezone.utc).isoformat()}

export const APP_CONFIG = {{
  // Area Settings
  AREA_ID: "{config.area_id}",
  AREA_NAME: "{config.area_name}",
  AREA_NAME_TE: "{config.area_name_te}",
  
  // Branding
  APP_NAME: "My {config.area_name}",
  TAGLINE: "{config.tagline}",
  TAGLINE_TE: "{config.tagline_te}",
  PRIMARY_COLOR: "{config.primary_color}",
  
  // Domain & Package
  DOMAIN: "{config.domain}",
  PACKAGE_NAME: "{config.package_name}",
  SENDER_NAME: "{config.sender_name}",
  
  // Partners
  COMPANY_NAME: "{config.company_name}",
  PARTNER_NAME: "{config.partner_name}",
  EDUCATION_PARTNER: "{config.education_partner}",
  
  // Stats
  STATS: {{
    BENEFITS: "{config.stats_benefits}",
    PROBLEMS: "{config.stats_problems}",
    PEOPLE: "{config.stats_people}"
  }},
  
  // Location
  DEFAULT_LAT: {config.lat},
  DEFAULT_LON: {config.lon},
  
  // Backend
  API_URL: "{config.backend_url}/api"
}};

export default APP_CONFIG;
"""

def generate_index_html(config: CloneConfig) -> str:
    """Generate index.html"""
    return f'''<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="{config.primary_color}" />
        <meta name="description" content="{config.tagline} - My {config.area_name}" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="My {config.area_name}" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="%PUBLIC_URL%/icons/icon-192x192.png" />
        <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <title>My {config.area_name}</title>
        <script>
            if ('serviceWorker' in navigator) {{
                window.addEventListener('load', function() {{
                    navigator.serviceWorker.register('/service-worker.js')
                        .then(function(registration) {{ console.log('SW registered'); }})
                        .catch(function(error) {{ console.log('SW failed:', error); }});
                }});
            }}
        </script>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
    </body>
</html>
'''

def generate_readme(config: CloneConfig) -> str:
    """Generate README.md"""
    return f"""# My {config.area_name}

Civic Engagement Platform for {config.area_name}

## Quick Start

1. Install dependencies:
   ```bash
   cd frontend && yarn install
   ```

2. Configure environment:
   - Copy `.env.example` to `.env`
   - Update `REACT_APP_BACKEND_URL` if needed

3. Run development server:
   ```bash
   yarn start
   ```

4. Build for production:
   ```bash
   yarn build
   ```

## Configuration

- **Area ID:** {config.area_id}
- **Domain:** {config.domain}
- **Package:** {config.package_name}
- **Theme Color:** {config.primary_color}

## Deployment

### Railway
1. Connect GitHub repo
2. Add environment variables from `.env`
3. Deploy frontend service

### PWABuilder (Play Store)
1. Go to pwabuilder.com
2. Enter your domain: https://{config.domain}
3. Package for Android
4. Upload to Play Store

## Backend API

This app connects to the shared backend at:
`{config.backend_url}/api`

## Support

Contact: support@{config.domain}

---
Generated by Clone Maker on {datetime.now(timezone.utc).strftime("%Y-%m-%d")}
"""

def generate_railway_config(config: CloneConfig) -> str:
    """Generate railway.json"""
    return json.dumps({
        "$schema": "https://railway.app/railway.schema.json",
        "build": {
            "builder": "NIXPACKS"
        },
        "deploy": {
            "startCommand": "cd frontend && yarn start",
            "healthcheckPath": "/",
            "restartPolicyType": "ON_FAILURE"
        }
    }, indent=2)

def generate_package_json(config: CloneConfig) -> str:
    """Generate package.json"""
    return json.dumps({
        "name": f"my-{config.area_id}",
        "version": "1.0.0",
        "private": True,
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.20.0",
            "axios": "^1.6.2",
            "lucide-react": "^0.294.0",
            "tailwindcss": "^3.3.0",
            "sonner": "^1.2.0"
        },
        "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test"
        }
    }, indent=2)


# ============== ROUTES ==============

@router.post("/generate")
async def generate_clone_files(config: CloneConfig):
    """Generate all configuration files for a clone"""
    files = {
        "manifest.json": generate_manifest(config),
        ".env": generate_env_file(config),
        "appConfig.js": generate_app_config(config),
        "index.html": generate_index_html(config),
        "README.md": generate_readme(config),
        "railway.json": generate_railway_config(config)
    }
    
    # Save to database
    await db.clones.update_one(
        {"area_id": config.area_id},
        {"$set": {
            **config.dict(),
            "files": files,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "status": "generated"
        }},
        upsert=True
    )
    
    return {"success": True, "files": files}

@router.post("/deploy")
async def deploy_clone(data: dict):
    """Deploy clone configuration"""
    config = CloneConfig(**data.get("config", {}))
    
    files = {
        "manifest.json": generate_manifest(config),
        ".env": generate_env_file(config),
        "appConfig.js": generate_app_config(config),
        "index.html": generate_index_html(config),
        "README.md": generate_readme(config),
        "railway.json": generate_railway_config(config)
    }
    
    # Save to database as deployed
    await db.clones.update_one(
        {"area_id": config.area_id},
        {"$set": {
            **config.dict(),
            "files": files,
            "deployed_at": datetime.now(timezone.utc).isoformat(),
            "status": "deployed"
        }},
        upsert=True
    )
    
    return {"success": True, "files": files, "status": "deployed"}

@router.get("/list")
async def list_clones():
    """List all deployed clones"""
    clones = await db.clones.find({}, {"_id": 0, "files": 0}).to_list(100)
    return {"clones": clones}

@router.delete("/{clone_id}")
async def delete_clone(clone_id: str):
    """Delete a clone configuration"""
    result = await db.clones.delete_one({"area_id": clone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clone not found")
    return {"success": True}

@router.post("/download-zip")
async def download_clone_zip(config: CloneConfig):
    """Generate and download a complete ZIP file with all clone files"""
    
    # Generate all files
    files = {
        "public/manifest.json": generate_manifest(config),
        "public/index.html": generate_index_html(config),
        "src/config/appConfig.js": generate_app_config(config),
        ".env": generate_env_file(config),
        ".env.example": generate_env_file(config),
        "README.md": generate_readme(config),
        "railway.json": generate_railway_config(config),
    }
    
    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for filepath, content in files.items():
            zip_file.writestr(f"my-{config.area_id}/{filepath}", content)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=my-{config.area_id}-clone.zip"}
    )

@router.post("/push-to-github")
async def push_to_github(request: GitHubPushRequest):
    """Create GitHub repo and push clone files"""
    import aiohttp
    
    config = request.config
    token = request.github_token
    repo_name = request.repo_name or f"my-{config.area_id}"
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with aiohttp.ClientSession() as session:
        # 1. Create repository
        create_repo_url = "https://api.github.com/user/repos"
        repo_data = {
            "name": repo_name,
            "description": f"Civic Engagement Platform for {config.area_name}",
            "private": request.is_private,
            "auto_init": True
        }
        
        async with session.post(create_repo_url, headers=headers, json=repo_data) as resp:
            if resp.status == 201:
                repo_info = await resp.json()
            elif resp.status == 422:
                # Repo exists, get it
                async with session.get(f"https://api.github.com/repos/{(await resp.json()).get('errors', [{}])[0].get('value', '')}", headers=headers) as get_resp:
                    if get_resp.status == 200:
                        repo_info = await get_resp.json()
                    else:
                        raise HTTPException(status_code=400, detail="Repository already exists or creation failed")
            else:
                error = await resp.json()
                raise HTTPException(status_code=resp.status, detail=error.get("message", "Failed to create repo"))
        
        # 2. Get user info
        async with session.get("https://api.github.com/user", headers=headers) as resp:
            user_info = await resp.json()
            username = user_info.get("login")
        
        # 3. Create files via GitHub API
        files_to_create = {
            "public/manifest.json": generate_manifest(config),
            "public/index.html": generate_index_html(config),
            "src/config/appConfig.js": generate_app_config(config),
            ".env.example": generate_env_file(config),
            "README.md": generate_readme(config),
            "railway.json": generate_railway_config(config),
        }
        
        import base64
        
        for filepath, content in files_to_create.items():
            file_url = f"https://api.github.com/repos/{username}/{repo_name}/contents/{filepath}"
            file_data = {
                "message": f"Add {filepath}",
                "content": base64.b64encode(content.encode()).decode()
            }
            
            async with session.put(file_url, headers=headers, json=file_data) as resp:
                if resp.status not in [200, 201]:
                    # Try to update if exists
                    async with session.get(file_url, headers=headers) as get_resp:
                        if get_resp.status == 200:
                            existing = await get_resp.json()
                            file_data["sha"] = existing.get("sha")
                            async with session.put(file_url, headers=headers, json=file_data) as update_resp:
                                pass
        
        # Save to database
        await db.clones.update_one(
            {"area_id": config.area_id},
            {"$set": {
                **config.dict(),
                "github_repo": f"{username}/{repo_name}",
                "github_url": f"https://github.com/{username}/{repo_name}",
                "pushed_at": datetime.now(timezone.utc).isoformat(),
                "status": "pushed"
            }},
            upsert=True
        )
        
        return {
            "success": True,
            "repo_url": f"https://github.com/{username}/{repo_name}",
            "clone_url": f"https://github.com/{username}/{repo_name}.git"
        }

@router.get("/github/auth-url")
async def get_github_auth_url():
    """Get GitHub OAuth URL for connecting"""
    client_id = os.environ.get("GITHUB_CLIENT_ID", "")
    redirect_uri = os.environ.get("GITHUB_REDIRECT_URI", "")
    
    if not client_id:
        return {
            "success": False,
            "message": "GitHub OAuth not configured. Use Personal Access Token instead.",
            "manual_token_url": "https://github.com/settings/tokens/new?scopes=repo&description=CloneMaker"
        }
    
    auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=repo"
    return {"success": True, "auth_url": auth_url}
