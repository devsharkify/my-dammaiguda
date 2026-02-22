# Backend Router Package
# Each router handles a specific feature module

from .auth import router as auth_router
from .aqi import router as aqi_router
from .family import router as family_router
from .sos import router as sos_router
from .news import router as news_router
from .fitness import router as fitness_router
from .doctor import router as doctor_router
from .chat import router as chat_router
from .wall import router as wall_router
from .issues import router as issues_router

__all__ = [
    "auth_router",
    "aqi_router", 
    "family_router",
    "sos_router",
    "news_router",
    "fitness_router",
    "doctor_router",
    "chat_router",
    "wall_router",
    "issues_router"
]
