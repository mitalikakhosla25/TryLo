"""Automated Tests for Phase 1B: Login, Logout, Session Persistence, and Role Protection."""

import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.core.rate_limiter import login_rate_limiter
from app.models.user import User, UserRole


@pytest.fixture(autouse=True)
def reset_limiter():
    """Reset rate limiter state before each test."""
    login_rate_limiter.clear_all()
    yield
    login_rate_limiter.clear_all()


@pytest.fixture
def founder_user(db_session: Session) -> User:
    """Create a test founder account in the isolated test DB."""
    user = User(
        id=uuid.uuid4(),
        full_name="Fiona Founder",
        email="fiona@founderstartup.io",
        password_hash=hash_password("FounderPassword123!"),
        role=UserRole.FOUNDER.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tester_user(db_session: Session) -> User:
    """Create a test tester account in the isolated test DB."""
    user = User(
        id=uuid.uuid4(),
        full_name="Tom Tester",
        email="tom@betatester.com",
        password_hash=hash_password("TesterPassword123!"),
        role=UserRole.TESTER.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def inactive_user(db_session: Session) -> User:
    """Create an inactive user account in the isolated test DB."""
    user = User(
        id=uuid.uuid4(),
        full_name="Inactive Ian",
        email="ian@inactive.com",
        password_hash=hash_password("IanPassword123!"),
        role=UserRole.TESTER.value,
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_founder_success(test_client: TestClient, founder_user: User):
    """Test successful login for a Founder setting HttpOnly cookie and CSRF token."""
    payload = {
        "email": founder_user.email,
        "password": "FounderPassword123!",
    }
    response = test_client.post("/api/auth/login", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(founder_user.id)
    assert data["email"] == founder_user.email
    assert data["role"] == "founder"
    assert "password" not in data
    assert "password_hash" not in data

    # Verify cookies
    assert settings.COOKIE_NAME in response.cookies
    assert settings.CSRF_COOKIE_NAME in response.cookies


def test_login_tester_success(test_client: TestClient, tester_user: User):
    """Test successful login for a Tester."""
    payload = {
        "email": tester_user.email,
        "password": "TesterPassword123!",
    }
    response = test_client.post("/api/auth/login", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(tester_user.id)
    assert data["email"] == tester_user.email
    assert data["role"] == "tester"
    assert settings.COOKIE_NAME in response.cookies


def test_login_incorrect_password(test_client: TestClient, founder_user: User):
    """Test login with incorrect password returns 401 with generic error message."""
    payload = {
        "email": founder_user.email,
        "password": "WrongPassword999!",
    }
    response = test_client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."
    assert settings.COOKIE_NAME not in response.cookies


def test_login_unknown_email(test_client: TestClient):
    """Test login with non-existent email returns generic 401 (preventing user enumeration)."""
    payload = {
        "email": "nonexistent@user.com",
        "password": "SomePassword123!",
    }
    response = test_client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_login_inactive_user(test_client: TestClient, inactive_user: User):
    """Test login for inactive user returns 401 and denies session creation."""
    payload = {
        "email": inactive_user.email,
        "password": "IanPassword123!",
    }
    response = test_client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "inactive" in response.json()["detail"].lower()
    assert settings.COOKIE_NAME not in response.cookies


def test_login_rate_limiting(test_client: TestClient, founder_user: User):
    """Test that 5 consecutive failed login attempts trigger 429 Too Many Requests."""
    payload = {
        "email": founder_user.email,
        "password": "WrongPassword!",
    }
    for _ in range(settings.LOGIN_RATE_LIMIT_MAX_ATTEMPTS):
        res = test_client.post("/api/auth/login", json=payload)
        assert res.status_code == 401

    # 6th attempt must be blocked by rate limiter
    blocked_res = test_client.post("/api/auth/login", json=payload)
    assert blocked_res.status_code == 429
    assert "too many" in blocked_res.json()["detail"].lower()


def test_get_me_authenticated(test_client: TestClient, founder_user: User):
    """Test GET /api/auth/me resolves identity from the HttpOnly session cookie."""
    # First log in to obtain session cookie
    login_res = test_client.post("/api/auth/login", json={
        "email": founder_user.email,
        "password": "FounderPassword123!",
    })
    assert login_res.status_code == 200

    # Call /api/auth/me with the cookie
    me_res = test_client.get("/api/auth/me")
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["id"] == str(founder_user.id)
    assert data["email"] == founder_user.email
    assert data["full_name"] == founder_user.full_name
    assert data["role"] == "founder"
    assert "password" not in data
    assert "password_hash" not in data


def test_get_me_unauthenticated(test_client: TestClient):
    """Test GET /api/auth/me returns 401 when no session cookie or token is provided."""
    response = test_client.get("/api/auth/me")
    assert response.status_code == 401
    assert "not authenticated" in response.json()["detail"].lower()


def test_get_me_tampered_token(test_client: TestClient):
    """Test GET /api/auth/me rejects forged or tampered session token."""
    test_client.cookies.set(settings.COOKIE_NAME, "tampered.jwt.token")
    response = test_client.get("/api/auth/me")
    assert response.status_code == 401
    assert "invalid or tampered" in response.json()["detail"].lower()


def test_get_me_expired_token(test_client: TestClient, founder_user: User):
    """Test GET /api/auth/me returns 401 when access token is expired."""
    expired_token = create_access_token(
        user_id=founder_user.id,
        role=founder_user.role,
        expires_delta=timedelta(seconds=-10),  # expired 10 seconds ago
    )
    test_client.cookies.set(settings.COOKIE_NAME, expired_token)
    response = test_client.get("/api/auth/me")
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_logout_clears_cookies(test_client: TestClient, founder_user: User):
    """Test POST /api/auth/logout deletes the session and CSRF cookies."""
    # Log in
    login_res = test_client.post("/api/auth/login", json={
        "email": founder_user.email,
        "password": "FounderPassword123!",
    })
    assert login_res.status_code == 200
    csrf_token = login_res.cookies.get(settings.CSRF_COOKIE_NAME)

    # Call logout with CSRF header
    logout_res = test_client.post(
        "/api/auth/logout",
        headers={
            settings.CSRF_HEADER_NAME: csrf_token,
            "Origin": "http://localhost:5173",
        },
    )
    assert logout_res.status_code == 200
    assert "successfully logged out" in logout_res.json()["message"].lower()

    # Verify cookies have been deleted / expired
    set_cookie_headers = [v for k, v in logout_res.headers.multi_items() if k.lower() == "set-cookie"]
    assert any(settings.COOKIE_NAME in h for h in set_cookie_headers)
    assert any(settings.CSRF_COOKIE_NAME in h for h in set_cookie_headers)


def test_csrf_protection_on_logout(test_client: TestClient, founder_user: User):
    """Test that logout with a missing or mismatched CSRF token returns 403 Forbidden."""
    # Log in
    test_client.post("/api/auth/login", json={
        "email": founder_user.email,
        "password": "FounderPassword123!",
    })

    # Missing X-CSRF-Token header
    res_no_header = test_client.post("/api/auth/logout")
    assert res_no_header.status_code == 403

    # Mismatched CSRF token
    res_mismatch = test_client.post(
        "/api/auth/logout",
        headers={
            settings.CSRF_HEADER_NAME: "wrong-csrf-token",
            "Origin": "http://localhost:5173",
        },
    )
    assert res_mismatch.status_code == 403


def test_untrusted_origin_rejected(test_client: TestClient, founder_user: User):
    """Test that requests with an untrusted Origin are rejected by CSRF origin verification."""
    login_res = test_client.post("/api/auth/login", json={
        "email": founder_user.email,
        "password": "FounderPassword123!",
    })
    csrf_token = login_res.cookies.get(settings.CSRF_COOKIE_NAME)

    res_bad_origin = test_client.post(
        "/api/auth/logout",
        headers={
            settings.CSRF_HEADER_NAME: csrf_token,
            "Origin": "https://malicious-phishing-site.com",
        },
    )
    assert res_bad_origin.status_code == 403
    assert "untrusted" in res_bad_origin.json()["detail"].lower()


def test_role_protection_founder_workspace(
    test_client: TestClient,
    founder_user: User,
    tester_user: User,
):
    """
    Test role authorization:
    - Founder can access /api/auth/founder-workspace
    - Tester is denied access (403 Forbidden)
    """
    # Founder login
    test_client.post("/api/auth/login", json={
        "email": founder_user.email,
        "password": "FounderPassword123!",
    })
    founder_access = test_client.get("/api/auth/founder-workspace")
    assert founder_access.status_code == 200
    assert "Founder Workspace" in founder_access.json()["message"]

    # Tester login
    test_client.post("/api/auth/login", json={
        "email": tester_user.email,
        "password": "TesterPassword123!",
    })
    # Tester attempts to access Founder workspace
    tester_access = test_client.get("/api/auth/founder-workspace")
    assert tester_access.status_code == 403
    assert "not authorized" in tester_access.json()["detail"].lower()


def test_role_protection_tester_workspace(
    test_client: TestClient,
    founder_user: User,
    tester_user: User,
):
    """
    Test role authorization:
    - Tester can access /api/auth/tester-workspace
    - Founder is denied access (403 Forbidden)
    """
    # Tester login
    test_client.post("/api/auth/login", json={
        "email": tester_user.email,
        "password": "TesterPassword123!",
    })
    tester_access = test_client.get("/api/auth/tester-workspace")
    assert tester_access.status_code == 200
    assert "Tester Workspace" in tester_access.json()["message"]

    # Founder login
    test_client.post("/api/auth/login", json={
        "email": founder_user.email,
        "password": "FounderPassword123!",
    })
    # Founder attempts to access Tester workspace
    founder_access = test_client.get("/api/auth/tester-workspace")
    assert founder_access.status_code == 403
    assert "not authorized" in founder_access.json()["detail"].lower()
