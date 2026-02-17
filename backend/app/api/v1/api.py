
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, anime, episodes, releases, parsers, system, notifications, roles, monitoring, backups, interactions, dashboard, bulk, scheduler

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(anime.router, prefix="/anime", tags=["anime"])
api_router.include_router(episodes.router, prefix="/episodes", tags=["episodes"])
api_router.include_router(releases.router, prefix="/releases", tags=["releases"])
api_router.include_router(parsers.router, prefix="/dashboard/parsers", tags=["parsers"])
api_router.include_router(scheduler.router, prefix="/dashboard/parsers/scheduler", tags=["scheduler"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(bulk.router, prefix="/dashboard/bulk", tags=["bulk"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(backups.router, prefix="/backups", tags=["backups"])
api_router.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
