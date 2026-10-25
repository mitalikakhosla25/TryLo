"""Database Session and Connection Management for TryLo."""

import time
import logging
from typing import Generator, Optional, Dict, Any
from sqlalchemy import create_engine, text, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings

logger = logging.getLogger("trylo.db")

_engine: Optional[Engine] = None
_SessionFactory: Optional[sessionmaker[Session]] = None


def get_engine() -> Optional[Engine]:
    """
    Get or initialize the SQLAlchemy engine.
    Lazy initialization ensures the app can start even if DATABASE_URL is not yet configured.
    """
    global _engine, _SessionFactory
    if _engine is not None:
        return _engine

    if not settings.is_database_configured:
        return None

    try:
        connect_args: Dict[str, Any] = {}
        # Psycopg 3 accepts connect_timeout in seconds
        if settings.DB_TIMEOUT_SECONDS > 0:
            connect_args["connect_timeout"] = settings.DB_TIMEOUT_SECONDS

        _engine = create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_timeout=10,
            connect_args=connect_args,
        )
        _SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        logger.info("SQLAlchemy engine initialized successfully.")
        return _engine
    except Exception as exc:
        logger.error("Failed to initialize database engine: %s", str(exc).split("://")[0])
        return None


def get_session_factory() -> Optional[sessionmaker[Session]]:
    """Return the configured session factory."""
    global _SessionFactory
    if _SessionFactory is None:
        get_engine()
    return _SessionFactory


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Ensures session cleanup on route completion.
    """
    session_factory = get_session_factory()
    if session_factory is None:
        raise RuntimeError(
            "Database is not configured. Please set a valid DATABASE_URL in the backend environment."
        )

    db: Session = session_factory()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Dict[str, Any]:
    """
    Executes a lightweight query ('SELECT 1') to verify database connectivity.
    Returns latency and status, or raises an error with sanitized message (no credentials/stack trace).
    """
    if not settings.is_database_configured:
        return {
            "connected": False,
            "error": "DATABASE_URL is not configured. Please add your Supabase connection string to backend/.env",
            "latency_ms": None,
        }

    engine = get_engine()
    if engine is None:
        return {
            "connected": False,
            "error": "Failed to create database engine. Please check DATABASE_URL format in backend/.env",
            "latency_ms": None,
        }

    start_time = time.perf_counter()
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            latency = (time.perf_counter() - start_time) * 1000.0

            if result == 1:
                return {
                    "connected": True,
                    "error": None,
                    "latency_ms": round(latency, 2),
                }
            else:
                return {
                    "connected": False,
                    "error": "Unexpected database response from health query.",
                    "latency_ms": round(latency, 2),
                }
    except SQLAlchemyError as exc:
        # Sanitize exception message: never leak host, credentials, or full connection string
        logger.warning("Database connection health check failed: %s", type(exc).__name__)
        err_type = type(exc).__name__
        return {
            "connected": False,
            "error": f"Database unreachable or connection refused ({err_type}). Verify Supabase host, port, credentials, and SSL settings.",
            "latency_ms": None,
        }
    except Exception as exc:
        logger.warning("Unexpected error during database health check: %s", type(exc).__name__)
        return {
            "connected": False,
            "error": f"Connection check failed ({type(exc).__name__}).",
            "latency_ms": None,
        }
