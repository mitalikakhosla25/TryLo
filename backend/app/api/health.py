"""Health Check Endpoints for TryLo."""

from datetime import datetime, timezone
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import check_db_connection

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
def api_health():
    """
    Check if the FastAPI API process is running and responsive.
    """
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/db")
def database_health():
    """
    Perform a real connectivity check to the Supabase PostgreSQL database
    using SQLAlchemy to execute 'SELECT 1'.
    
    Returns HTTP 200 OK if connected, or HTTP 503 Service Unavailable if
    unreachable or unconfigured, without leaking credentials or stack traces.
    """
    result = check_db_connection()

    if result["connected"]:
        return {
            "status": "ok",
            "database": "connected",
            "latency_ms": result["latency_ms"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "unhealthy",
            "database": "disconnected",
            "error": result["error"],
            "latency_ms": result["latency_ms"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
