"""TryLo FastAPI Application Entry Point."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.profiles import router as profiles_router
from app.api.startups import router as startups_router, public_startups_router
from app.api.campaigns import router as campaigns_router
from app.api.applications import router as applications_router
from app.api.tasks import router as tasks_router
from app.api.feedback import router as feedback_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("trylo.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    logger.info("Starting TryLo API service [%s]...", settings.APP_ENV)
    if settings.is_database_configured:
        logger.info("Database URL is configured in environment.")
    else:
        logger.warning(
            "DATABASE_URL is not yet configured. Database health checks will return 503 until configured."
        )
    yield
    logger.info("Shutting down TryLo API service...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Beta testing marketplace connecting startups and testers.",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(startups_router)
app.include_router(public_startups_router)
app.include_router(campaigns_router)
app.include_router(applications_router)
app.include_router(tasks_router)
app.include_router(feedback_router)


@app.get("/")
def root():
    """Root endpoint providing quick navigation links."""
    return {
        "app": settings.APP_NAME,
        "version": "0.1.0",
        "status": "running",
        "documentation": "/docs",
        "health_check": "/api/health",
        "db_health_check": "/api/health/db",
    }
