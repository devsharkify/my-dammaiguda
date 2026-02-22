"""Clone Maker Router - Automated white-label app deployment"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from .utils import db, generate_id, now_iso, get_current_user
import json
import os

router = APIRouter(prefix="/clone", tags=["Clone Maker"])

class CloneConfig(BaseModel):
    area_id: str
    area_name: str
    area_name_te: str
    primary_color: str
    domain: str
    package_name: str
    sender_name: str
    tagline: Optional[str] = "Track Issues. Protect Health. Claim Benefits."
    tagline_te: Optional[str] = "సమస్యలను ట్రాక్ చేయండి. ఆరోగ్యాన్ని కాపాడండి. ప్రయోజనాలను పొందండి."
    company_name: Optional[str] = "Rohan Kulkarni"
    partner_name: Optional[str] = "Kaizer News"
    education_partner: Optional[str] = "Bose American Academy"
    stats_benefits: Optional[str] = "₹5Cr+"
    stats_problems: Optional[str] = "50+"
    stats_people: Optional[str] = "25K+"
    lat: Optional[float] = 17.4534
    lon: Optional[float] = 78.5674
    features: Optional[dict] = None

class CloneDeployment(BaseModel):
    config: CloneConfig
    deploy_type: str = "preview"  # preview, production

# Store for deployed clones
@router.get("/list")
async def list_clones(user: dict = Depends(get_current_user)):
    """List all deployed clones"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    clones = await db.clones.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"clones": clones}

@router.post("/generate")
async def generate_clone_config(config: CloneConfig, user: dict = Depends(get_current_user)):
    """Generate all configuration files for a new clone"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Generate App Config
    app_config = generate_app_config(config)
    
    # Generate Manifest
    manifest = generate_manifest(config)
    
    # Generate Security Shield
    security = generate_security_shield()
    
    # Generate Environment Variables
    env_vars = generate_env_vars(config)
    
    # Generate index.html meta tags
    meta_tags = generate_meta_tags(config)
    
    # Generate CSS Variables
    css_vars = generate_css_vars(config)
    
    return {
        "success": True,
        "files": {
            "appConfig.js": app_config,
            "manifest.json": manifest,
            "securityShield.js": security,
            ".env": env_vars,
            "meta_tags.html": meta_tags,
            "variables.css": css_vars
        },
        "instructions": get_deployment_instructions(config)
    }

@router.post("/deploy")
async def deploy_clone(deployment: CloneDeployment, user: dict = Depends(get_current_user)):
    """Save clone configuration to database and generate deployment package"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = deployment.config
    
    # Check if clone already exists
    existing = await db.clones.find_one({"area_id": config.area_id})
    
    clone_data = {
        "id": existing.get("id") if existing else generate_id(),
        "area_id": config.area_id,
        "area_name": config.area_name,
        "area_name_te": config.area_name_te,
        "primary_color": config.primary_color,
        "domain": config.domain,
        "package_name": config.package_name,
        "sender_name": config.sender_name,
        "tagline": config.tagline,
        "tagline_te": config.tagline_te,
        "company_name": config.company_name,
        "partner_name": config.partner_name,
        "education_partner": config.education_partner,
        "stats": {
            "benefits": config.stats_benefits,
            "problems": config.stats_problems,
            "people": config.stats_people
        },
        "location": {
            "lat": config.lat,
            "lon": config.lon
        },
        "features": config.features or {
            "issues": True,
            "fitness": True,
            "benefits": True,
            "education": True,
            "dumpyard": True,
            "polls": True,
            "news": True,
            "astrology": True
        },
        "status": "deployed",
        "deploy_type": deployment.deploy_type,
        "created_at": existing.get("created_at") if existing else now_iso(),
        "updated_at": now_iso()
    }
    
    if existing:
        await db.clones.update_one({"area_id": config.area_id}, {"$set": clone_data})
    else:
        await db.clones.insert_one(clone_data)
    
    clone_data.pop("_id", None)
    
    # Generate all files
    files = {
        "appConfig.js": generate_app_config(config),
        "manifest.json": generate_manifest(config),
        "securityShield.js": generate_security_shield(),
        ".env.example": generate_env_vars(config),
        "variables.css": generate_css_vars(config)
    }
    
    return {
        "success": True,
        "clone": clone_data,
        "files": files,
        "download_ready": True
    }

@router.delete("/{clone_id}")
async def delete_clone(clone_id: str, user: dict = Depends(get_current_user)):
    """Delete a clone configuration"""
    if user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.clones.delete_one({"id": clone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clone not found")
    
    return {"success": True, "message": "Clone deleted"}

# ============== GENERATORS ==============

def generate_app_config(config: CloneConfig) -> str:
    return f'''/**
 * White-Label App Configuration
 * Area: {config.area_name}
 * Generated: {datetime.now(timezone.utc).isoformat()}
 */

const APP_CONFIG = {{
  // Area Information
  area: {{
    id: "{config.area_id}",
    name: "{config.area_name}",
    name_te: "{config.area_name_te}",
    tagline: "{config.tagline}",
    tagline_te: "{config.tagline_te}",
  }},

  // Branding
  branding: {{
    appName: "My {config.area_name}",
    appName_te: "మై {config.area_name_te}",
    primaryColor: "{config.primary_color}",
    logo: "/icons/icon-512x512.png",
  }},

  // Company & Partners
  company: {{
    name: "{config.company_name}",
    website: "https://{config.domain}",
  }},
  partner: {{
    name: "{config.partner_name}",
  }},
  education: {{
    partnerName: "{config.education_partner}",
  }},

  // Landing Page Stats
  stats: {{
    benefitsAmount: "{config.stats_benefits}",
    problemsSolved: "{config.stats_problems}",
    peopleBenefited: "{config.stats_people}",
  }},

  // URLs & Package
  urls: {{
    domain: "{config.domain}",
    packageName: "{config.package_name}",
    playStore: "https://play.google.com/store/apps/details?id={config.package_name}",
    appStore: "", // Add when available
  }},

  // Location
  location: {{
    lat: {config.lat},
    lon: {config.lon},
    defaultZoom: 14,
  }},

  // SMS Settings
  sms: {{
    senderName: "{config.sender_name}",
  }},

  // Security Settings
  security: {{
    enabled: true,
    disableRightClick: true,
    disableDevTools: true,
    disableTextSelection: false,
    disableCopyPaste: false,
    disablePrint: false,
    antiDebugging: true,
    sessionProtection: true,
  }},

  // Feature Flags
  features: {{
    issues: true,
    fitness: true,
    benefits: true,
    education: true,
    dumpyard: true,
    polls: true,
    news: true,
    astrology: true,
    shop: true,
    volunteer: true,
    chat: true,
    sos: true,
  }},
}};

export default APP_CONFIG;
'''

def generate_manifest(config: CloneConfig) -> str:
    manifest = {
        "name": f"My {config.area_name} - Civic Engagement Platform",
        "short_name": f"My {config.area_name}",
        "description": config.tagline,
        "start_url": "/",
        "display": "standalone",
        "orientation": "portrait",
        "theme_color": config.primary_color,
        "background_color": "#0a0a0a",
        "icons": [
            {"src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png"},
            {"src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png"},
            {"src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png"},
            {"src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png"},
            {"src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png"},
            {"src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png"},
            {"src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icons/maskable-icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ],
        "categories": ["government", "utilities", "lifestyle"],
        "lang": "en-IN",
        "dir": "ltr",
        "scope": "/",
        "prefer_related_applications": False
    }
    return json.dumps(manifest, indent=2)

def generate_security_shield() -> str:
    return '''/**
 * Security Shield - Enterprise Grade Website Protection
 * Import in App.js and call initSecurityShield() in useEffect
 */

class SecurityShield {
  constructor() {
    this.devToolsOpen = false;
  }

  init() {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🛡️ Security Shield: Development mode - protections disabled');
      return;
    }

    this.disableRightClick();
    this.disableKeyboardShortcuts();
    this.detectDevTools();
    this.protectConsole();
    console.log('🛡️ Security Shield: Active');
  }

  disableRightClick() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  disableKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    });
  }

  detectDevTools() {
    const threshold = 160;
    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!this.devToolsOpen) {
          this.devToolsOpen = true;
          this.onDevToolsOpen();
        }
      } else {
        this.devToolsOpen = false;
      }
    };
    
    setInterval(check, 1000);
  }

  onDevToolsOpen() {
    // Optional: Clear sensitive data or redirect
    console.clear();
    console.log('%c⚠️ Warning!', 'color: red; font-size: 30px; font-weight: bold;');
    console.log('%cThis is a protected application.', 'font-size: 16px;');
  }

  protectConsole() {
    const noop = () => {};
    ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace'].forEach((method) => {
      // Keep console in production but could disable if needed
      // console[method] = noop;
    });
  }
}

const securityShield = new SecurityShield();

export default function initSecurityShield() {
  securityShield.init();
}

export { SecurityShield };
'''

def generate_env_vars(config: CloneConfig) -> str:
    return f'''# Environment Variables for My {config.area_name}
# Copy this to .env in your frontend directory

# Backend API URL (update with your Railway/deployment URL)
REACT_APP_BACKEND_URL=https://api.{config.domain}

# App Configuration
REACT_APP_AREA_ID={config.area_id}
REACT_APP_AREA_NAME={config.area_name}
REACT_APP_PRIMARY_COLOR={config.primary_color}

# Google Maps (optional)
REACT_APP_GOOGLE_MAPS_KEY=

# Analytics (optional)
REACT_APP_GA_ID=

# Sentry Error Tracking (optional)
REACT_APP_SENTRY_DSN=
'''

def generate_meta_tags(config: CloneConfig) -> str:
    return f'''<!-- Add these meta tags to public/index.html -->
<meta name="application-name" content="My {config.area_name}" />
<meta name="apple-mobile-web-app-title" content="My {config.area_name}" />
<meta name="description" content="{config.tagline}" />
<meta name="theme-color" content="{config.primary_color}" />
<meta name="msapplication-TileColor" content="{config.primary_color}" />

<!-- Open Graph -->
<meta property="og:title" content="My {config.area_name} - Civic Engagement Platform" />
<meta property="og:description" content="{config.tagline}" />
<meta property="og:site_name" content="My {config.area_name}" />
<meta property="og:url" content="https://{config.domain}" />
<meta property="og:type" content="website" />

<!-- Twitter -->
<meta name="twitter:title" content="My {config.area_name}" />
<meta name="twitter:description" content="{config.tagline}" />
'''

def generate_css_vars(config: CloneConfig) -> str:
    # Convert hex to HSL for Tailwind
    return f'''/* CSS Variables for My {config.area_name} */
/* Add to src/index.css or tailwind config */

:root {{
  --primary: {config.primary_color};
  --primary-foreground: #ffffff;
  
  /* You can generate HSL values from the hex color */
  /* Use a tool like https://htmlcolors.com/hex-to-hsl */
}}

/* Theme color override */
.bg-primary {{
  background-color: {config.primary_color} !important;
}}

.text-primary {{
  color: {config.primary_color} !important;
}}

.border-primary {{
  border-color: {config.primary_color} !important;
}}
'''

def get_deployment_instructions(config: CloneConfig) -> list:
    return [
        {
            "step": 1,
            "title": "Download Files",
            "description": "Download all generated configuration files"
        },
        {
            "step": 2,
            "title": "Create New Repository",
            "description": f"Fork the base repository and rename to my-{config.area_id}"
        },
        {
            "step": 3,
            "title": "Replace Config Files",
            "description": "Copy appConfig.js to src/config/, manifest.json to public/, etc."
        },
        {
            "step": 4,
            "title": "Update Icons",
            "description": f"Generate icons with your branding color ({config.primary_color}) and replace in public/icons/"
        },
        {
            "step": 5,
            "title": "Setup Backend",
            "description": "Deploy backend to Railway with new MongoDB database"
        },
        {
            "step": 6,
            "title": "Update Environment",
            "description": f"Set REACT_APP_BACKEND_URL to your backend URL"
        },
        {
            "step": 7,
            "title": "Deploy Frontend",
            "description": f"Deploy frontend to Railway and connect domain {config.domain}"
        },
        {
            "step": 8,
            "title": "Configure DNS",
            "description": f"Point {config.domain} to Railway deployment"
        }
    ]
'''
