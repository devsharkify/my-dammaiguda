"""Security Utilities for Backend
- Input sanitization
- XSS prevention
- SQL injection prevention (for raw queries)
- Request validation
"""
import re
import html
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

# Dangerous patterns
XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript:',
    r'on\w+\s*=',
    r'<iframe[^>]*>',
    r'<object[^>]*>',
    r'<embed[^>]*>',
    r'<link[^>]*>',
    r'<meta[^>]*>',
    r'expression\s*\(',
    r'url\s*\(',
    r'@import',
]

SQL_INJECTION_PATTERNS = [
    r"('\s*OR\s*'1'\s*=\s*'1)",
    r'(;\s*DROP\s+TABLE)',
    r'(;\s*DELETE\s+FROM)',
    r'(UNION\s+SELECT)',
    r'(INSERT\s+INTO)',
    r'(UPDATE\s+.*\s+SET)',
    r"(--\s*$)",
    r'(/\*.*\*/)',
]

NOSQL_INJECTION_PATTERNS = [
    r'\$where',
    r'\$regex',
    r'\$ne',
    r'\$gt',
    r'\$lt',
    r'\$or',
    r'\$and',
]


def sanitize_string(value: str) -> str:
    """Sanitize a string value to prevent XSS"""
    if not isinstance(value, str):
        return value
    
    # HTML escape
    sanitized = html.escape(value)
    
    # Remove potential XSS patterns
    for pattern in XSS_PATTERNS:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    return sanitized


def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively sanitize all string values in a dictionary"""
    sanitized = {}
    for key, value in data.items():
        # Sanitize key
        clean_key = sanitize_string(key) if isinstance(key, str) else key
        
        # Sanitize value
        if isinstance(value, str):
            sanitized[clean_key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[clean_key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[clean_key] = sanitize_list(value)
        else:
            sanitized[clean_key] = value
    
    return sanitized


def sanitize_list(data: list) -> list:
    """Sanitize all items in a list"""
    sanitized = []
    for item in data:
        if isinstance(item, str):
            sanitized.append(sanitize_string(item))
        elif isinstance(item, dict):
            sanitized.append(sanitize_dict(item))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item))
        else:
            sanitized.append(item)
    return sanitized


def detect_injection(value: str) -> bool:
    """Detect potential SQL/NoSQL injection attempts"""
    if not isinstance(value, str):
        return False
    
    # Check SQL injection patterns
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            logger.warning(f"SQL injection attempt detected: {value[:100]}")
            return True
    
    # Check NoSQL injection patterns
    for pattern in NOSQL_INJECTION_PATTERNS:
        if pattern in value:
            logger.warning(f"NoSQL injection attempt detected: {value[:100]}")
            return True
    
    return False


def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove any non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    
    # Check length (10 digits for Indian mobile, or with country code)
    if len(digits_only) == 10:
        return digits_only.isdigit()
    elif len(digits_only) == 12 and digits_only.startswith('91'):
        return True
    
    return False


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_otp(otp: str) -> bool:
    """Validate OTP format"""
    return len(otp) == 6 and otp.isdigit()


def rate_limit_key(request) -> str:
    """Generate rate limit key from request"""
    # Use IP + User-Agent for better rate limiting
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    ua = request.headers.get("User-Agent", "unknown")[:50]
    return f"{ip}:{ua}"


def mask_sensitive_data(data: Dict[str, Any], fields: list = None) -> Dict[str, Any]:
    """Mask sensitive fields in data for logging"""
    if fields is None:
        fields = ['password', 'token', 'otp', 'secret', 'key', 'authorization']
    
    masked = {}
    for key, value in data.items():
        if any(f in key.lower() for f in fields):
            masked[key] = '***MASKED***'
        elif isinstance(value, dict):
            masked[key] = mask_sensitive_data(value, fields)
        else:
            masked[key] = value
    
    return masked


class SecurityValidator:
    """Security validation helper class"""
    
    @staticmethod
    def is_safe_redirect(url: str, allowed_hosts: list = None) -> bool:
        """Check if redirect URL is safe"""
        if not url:
            return False
        
        # Allow relative URLs
        if url.startswith('/') and not url.startswith('//'):
            return True
        
        # Check against allowed hosts
        if allowed_hosts:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc in allowed_hosts
        
        return False
    
    @staticmethod
    def validate_file_type(filename: str, allowed_types: list = None) -> bool:
        """Validate uploaded file type"""
        if allowed_types is None:
            allowed_types = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
        
        if not filename:
            return False
        
        ext = filename.rsplit('.', 1)[-1].lower()
        return ext in allowed_types
    
    @staticmethod
    def validate_file_size(size: int, max_size_mb: int = 10) -> bool:
        """Validate file size"""
        max_bytes = max_size_mb * 1024 * 1024
        return size <= max_bytes
