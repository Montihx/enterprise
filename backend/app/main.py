import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.db.session import engine
from app.api.v1.api import api_router
from app.core.logging import setup_logging, logger
from app.core.cache import cache
from app.api.middleware import RequestContextMiddleware
from app.api.errors import http_error_handler, unhandled_exception_handler
from pathlib import Path

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    setup_logging()
    Path(settings.MEDIA_ROOT)
    await cache.connect().mkdir(parents=True, exist_ok=True)
    
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.API_ENV,
            traces_sample_rate=1.0,
        )
        logger.info("Sentry: Guarding application state")

    logger.info("Kitsu Enterprise API: Cluster Online", env=settings.API_ENV)
    yield
    # Shutdown sequence
    logger.info("Kitsu Enterprise API: Initiating graceful shutdown")
    await cache.disconnect()
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Rate Limiting Configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Exception Handlers
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Middleware Stack
app.add_middleware(RequestContextMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# Sovereign Media Hosting
if settings.API_ENV == "development":
    app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "cluster_nodes": ["api-main", "worker-sync"],
        "telemetry": "active"
    }

@app.get("/")
async def root():
    return {
        "gateway": "Kitsu Enterprise API v2",
        "documentation": "/docs",
        "status": "OPERATIONAL"
    }
