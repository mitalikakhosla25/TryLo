"""Pytest Fixtures for TryLo Backend Tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 - Register all models
from app.main import app as fastapi_app
from app.db.base import Base
from app.db.session import get_db


@pytest.fixture
def client():
    """Create a FastAPI TestClient instance."""
    with TestClient(fastapi_app) as test_client:
        yield test_client


@pytest.fixture
def db_session():
    """
    Creates an isolated in-memory SQLite database session for tests.
    Ensures zero side effects on the real Supabase database.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_client(db_session: Session):
    """
    FastAPI TestClient with get_db dependency overridden by the isolated test db_session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as client:
        yield client
    fastapi_app.dependency_overrides.clear()
