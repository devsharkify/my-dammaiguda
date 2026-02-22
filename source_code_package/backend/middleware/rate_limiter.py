"""Rate Limiting Middleware using SlowAPI"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
import os

# Initialize limiter with client IP as key
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
RATE_LIMITS = {
    "auth": "5/minute",          # Strict for auth endpoints
    "otp": "3/minute",           # Very strict for OTP
    "api_default": "60/minute",  # General API calls
    "upload": "10/minute",       # File uploads
    "ai": "10/minute",           # AI endpoints
    "search": "30/minute",       # Search/query endpoints
}

def get_rate_limit(endpoint_type: str) -> str:
    """Get rate limit for endpoint type"""
    return RATE_LIMITS.get(endpoint_type, RATE_LIMITS["api_default"])
