"""Sentry Error Monitoring Configuration

To enable Sentry:
1. Create a Sentry account at https://sentry.io
2. Create a new project for FastAPI/Python
3. Copy your DSN from Project Settings > Client Keys (DSN)
4. Set the SENTRY_DSN environment variable in your backend/.env file
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
import os
import logging

logger = logging.getLogger(__name__)

def init_sentry():
    """Initialize Sentry SDK if DSN is configured"""
    sentry_dsn = os.environ.get("SENTRY_DSN")
    
    if not sentry_dsn:
        logger.info("Sentry DSN not configured. Error monitoring disabled.")
        logger.info("To enable: Set SENTRY_DSN in backend/.env")
        return False
    
    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                StarletteIntegration(transaction_style="endpoint"),
            ],
            # Performance monitoring sample rate (0.0 to 1.0)
            traces_sample_rate=0.2,
            # Session tracking
            auto_session_tracking=True,
            # Environment (production, staging, development)
            environment=os.environ.get("ENVIRONMENT", "development"),
            # Release version
            release=os.environ.get("APP_VERSION", "2.7.0"),
            # Filter sensitive data
            send_default_pii=False,
            # Before send hook for filtering
            before_send=filter_events,
        )
        logger.info("Sentry initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
        return False

def filter_events(event, hint):
    """Filter out noise events before sending to Sentry"""
    # Don't send 404 errors
    if event.get("level") == "error":
        exception = event.get("exception", {})
        values = exception.get("values", [])
        for value in values:
            exc_type = value.get("type", "")
            if exc_type in ["HTTPException", "RequestValidationError"]:
                # Only send if it's a server error (5xx)
                if "status" in event.get("tags", {}):
                    status = int(event["tags"]["status"])
                    if status < 500:
                        return None
    return event

def capture_exception(error: Exception, context: dict = None):
    """Capture an exception manually"""
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)

def capture_message(message: str, level: str = "info", context: dict = None):
    """Capture a message manually"""
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level=level)
    else:
        sentry_sdk.capture_message(message, level=level)

def set_user_context(user_id: str, phone: str = None, role: str = None):
    """Set user context for error tracking"""
    sentry_sdk.set_user({
        "id": user_id,
        "username": phone,
        "role": role
    })
