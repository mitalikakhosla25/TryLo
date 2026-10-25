"""Tests for Health Check Endpoints."""

from unittest.mock import patch
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test the root endpoint returns 200 and API discovery links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "documentation" in data
    assert "health_check" in data
    assert "db_health_check" in data


def test_api_health_endpoint(client: TestClient):
    """Test the general API health endpoint returns 200 OK and expected structure."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "TryLo API"
    assert "environment" in data
    assert "timestamp" in data


def test_database_health_unconfigured(client: TestClient):
    """
    Test database health check when DATABASE_URL is not set.
    Should return 503 Service Unavailable and never leak credentials.
    """
    with patch("app.core.config.settings.DATABASE_URL", ""):
        response = client.get("/api/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
        assert "error" in data
        assert "password" not in data["error"].lower()
        assert "postgres://" not in data["error"]



def test_database_health_connected_mock(client: TestClient):
    """
    Test database health check reporting 200 OK when connection succeeds.
    """
    mock_result = {
        "connected": True,
        "error": None,
        "latency_ms": 14.52,
    }
    with patch("app.api.health.check_db_connection", return_value=mock_result):
        response = client.get("/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"
        assert data["latency_ms"] == 14.52


def test_database_health_failure_mock(client: TestClient):
    """
    Test database health check reporting 503 when connection fails.
    """
    mock_result = {
        "connected": False,
        "error": "Database unreachable: connection timed out.",
        "latency_ms": None,
    }
    with patch("app.api.health.check_db_connection", return_value=mock_result):
        response = client.get("/api/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
        assert "Database unreachable" in data["error"]
