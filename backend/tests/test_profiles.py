"""Tests for Founder and Tester Profiles, Onboarding, and Authorization."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.models.profile import FounderProfile, TesterProfile
from app.core.security import hash_password, create_access_token
from app.core.config import settings

# Prevent pytest from mistaking TesterProfile model for a test class
TesterProfile.__test__ = False


def create_user_with_token(client: TestClient, db: Session, full_name: str, email: str, role: str):
    """Helper to register user and obtain an authenticated test client with cookies."""
    hashed = hash_password("ValidPassword123!")
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hashed,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role)
    client.cookies.set(settings.COOKIE_NAME, token)
    return user


def test_missing_profile_handling(test_client: TestClient, db_session: Session):
    """Users without profiles should return 200 with is_complete=False and profile=None."""
    user = create_user_with_token(test_client, db_session, "Alice Founder", "alice@example.com", "founder")

    response = test_client.get("/api/profiles/me")
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "founder"
    assert data["is_complete"] is False
    assert data["profile"] is None


def test_unauthenticated_profile_access(test_client: TestClient):
    """Unauthenticated requests must be rejected with 401."""
    response = test_client.get("/api/profiles/me")
    assert response.status_code == 401

    response = test_client.put("/api/profiles/me", json={"startup_name": "Test Startup"})
    assert response.status_code == 401


def test_founder_profile_creation_and_completion(test_client: TestClient, db_session: Session):
    """Founders can create their profile and completion is driven by startup_name."""
    user = create_user_with_token(test_client, db_session, "Bob Founder", "bob@example.com", "founder")

    # Incomplete save (no startup_name)
    payload_incomplete = {
        "professional_title": "CEO",
        "city": "San Francisco",
        "country": "USA",
    }
    res = test_client.put("/api/profiles/me", json=payload_incomplete)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "founder"
    assert data["is_complete"] is False
    assert data["profile"]["professional_title"] == "CEO"
    assert data["profile"]["startup_name"] is None

    # Complete save with required startup_name
    payload_complete = {
        "startup_name": "HyperLoop Systems",
        "professional_title": "Founder & CEO",
        "industry": "Transportation",
        "company_stage": "Early Traction",
        "website_url": "https://hyperloop.example.com",
        "linkedin_url": "https://www.linkedin.com/in/bobfounder",
        "startup_description": "Building high speed transit networks.",
        "city": "Los Angeles",
        "country": "USA",
    }
    res = test_client.put("/api/profiles/me", json=payload_complete)
    assert res.status_code == 200
    data = res.json()
    assert data["is_complete"] is True
    assert data["profile"]["startup_name"] == "HyperLoop Systems"
    assert data["profile"]["company_stage"] == "Early Traction"
    assert data["profile"]["website_url"] == "https://hyperloop.example.com"

    # Persistence verification via GET /api/profiles/me
    get_res = test_client.get("/api/profiles/me")
    assert get_res.status_code == 200
    assert get_res.json()["is_complete"] is True
    assert get_res.json()["profile"]["startup_name"] == "HyperLoop Systems"


def test_tester_profile_creation_and_completion(test_client: TestClient, db_session: Session):
    """Testers can create their profile. Completion requires bio, >=1 skill, and >=1 interest."""
    user = create_user_with_token(test_client, db_session, "Charlie Tester", "charlie@example.com", "tester")

    # Incomplete: only bio, no skills or interests
    res1 = test_client.put("/api/profiles/me", json={"bio": "Passionate software tester"})
    assert res1.status_code == 200
    assert res1.json()["is_complete"] is False

    # Incomplete: bio and skills, but no interests
    res2 = test_client.put("/api/profiles/me", json={
        "bio": "Passionate software tester",
        "skills": ["UI/UX", "testing"],
    })
    assert res2.status_code == 200
    assert res2.json()["is_complete"] is False

    # Complete: bio, skills, and interests
    res3 = test_client.put("/api/profiles/me", json={
        "bio": "Experienced QA engineer specializing in usability and automation.",
        "skills": ["UI/UX", "testing", "frontend development"],
        "interests": ["FinTech", "productivity"],
        "experience_level": "Intermediate",
        "devices": ["Android", "macOS", "Web"],
        "city": "Berlin",
        "country": "Germany",
        "linkedin_url": "https://linkedin.com/in/charlietest",
    })
    assert res3.status_code == 200
    data = res3.json()
    assert data["role"] == "tester"
    assert data["is_complete"] is True
    assert len(data["profile"]["skills"]) == 3
    assert "macOS" in data["profile"]["devices"]

    # Persistence verification
    get_res = test_client.get("/api/profiles/me")
    assert get_res.status_code == 200
    assert get_res.json()["is_complete"] is True


def test_profile_update_idempotence_no_duplicates(test_client: TestClient, db_session: Session):
    """Repeated saves should update the existing record without creating duplicates."""
    user = create_user_with_token(test_client, db_session, "Dave Founder", "dave@example.com", "founder")

    for i in range(3):
        res = test_client.put("/api/profiles/me", json={
            "startup_name": f"Iterative Startup {i}",
            "company_stage": "MVP",
        })
        assert res.status_code == 200

    profiles = db_session.scalars(select(FounderProfile).where(FounderProfile.user_id == user.id)).all()
    assert len(profiles) == 1
    assert profiles[0].startup_name == "Iterative Startup 2"


def test_cross_role_data_rejection(test_client: TestClient, db_session: Session):
    """Founders cannot send tester fields, and testers cannot send founder fields."""
    founder = create_user_with_token(test_client, db_session, "Eve Founder", "eve@example.com", "founder")

    # Founder attempting to send tester fields to /api/profiles/me
    res = test_client.put("/api/profiles/me", json={
        "startup_name": "Eve Startup",
        "skills": ["testing"],
    })
    assert res.status_code == 400
    assert "Founders cannot submit tester profile data" in res.json()["detail"]

    # Founder attempting to access tester-only endpoint
    res_tester_endpoint = test_client.get("/api/profiles/tester")
    assert res_tester_endpoint.status_code == 403

    # Switch to tester
    tester = create_user_with_token(test_client, db_session, "Frank Tester", "frank@example.com", "tester")

    # Tester attempting to send founder fields to /api/profiles/me
    res = test_client.put("/api/profiles/me", json={
        "bio": "Bio for Frank",
        "startup_name": "Fake Startup",
    })
    assert res.status_code == 400
    assert "Testers cannot submit founder profile data" in res.json()["detail"]

    # Tester attempting to access founder-only endpoint
    res_founder_endpoint = test_client.get("/api/profiles/founder")
    assert res_founder_endpoint.status_code == 403


def test_modify_another_user_profile_forbidden(test_client: TestClient, db_session: Session):
    """Supplying a different user_id in the body must be rejected."""
    user1 = create_user_with_token(test_client, db_session, "User One", "user1@example.com", "founder")
    user2 = create_user_with_token(test_client, db_session, "User Two", "user2@example.com", "founder")

    # Authenticated as user2, but supplying user1.id in payload
    res = test_client.put("/api/profiles/me", json={
        "user_id": str(user1.id),
        "startup_name": "Malicious Hijack",
    })
    assert res.status_code == 403
    assert "Cannot modify another user's profile" in res.json()["detail"]


def test_cannot_change_role_via_profile_update(test_client: TestClient, db_session: Session):
    """Users cannot alter their account role through profile updates."""
    user = create_user_with_token(test_client, db_session, "Grace Founder", "grace@example.com", "founder")

    res = test_client.put("/api/profiles/me", json={
        "role": "admin",
        "startup_name": "Grace Startup",
    })
    assert res.status_code == 400
    assert "Cannot change account role" in res.json()["detail"]


def test_invalid_urls_and_enum_validation(test_client: TestClient, db_session: Session):
    """Invalid URLs and non-permitted enums must return 422."""
    user = create_user_with_token(test_client, db_session, "Heidi Founder", "heidi@example.com", "founder")

    # Invalid website URL (no scheme)
    res = test_client.put("/api/profiles/me", json={"website_url": "invalid-url-string"})
    assert res.status_code == 422

    # Invalid LinkedIn URL (not linkedin.com)
    res = test_client.put("/api/profiles/me", json={"linkedin_url": "https://facebook.com/profile"})
    assert res.status_code == 422

    # Invalid company_stage enum
    res = test_client.put("/api/profiles/me", json={"company_stage": "Pre-Seed-Superstar"})
    assert res.status_code == 422

    # Switch to tester and test invalid experience_level
    tester = create_user_with_token(test_client, db_session, "Ivan Tester", "ivan@example.com", "tester")
    res = test_client.put("/api/profiles/me", json={"experience_level": "SuperExpert"})
    assert res.status_code == 422


def test_existing_users_without_profile_can_login(test_client: TestClient, db_session: Session):
    """Existing user without a profile can sign in without errors."""
    raw_password = "Password123!"
    user = User(
        full_name="Legacy User",
        email="legacy@example.com",
        password_hash=hash_password(raw_password),
        role="founder",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    login_res = test_client.post("/api/auth/login", json={
        "email": "legacy@example.com",
        "password": raw_password,
    })
    assert login_res.status_code == 200
    assert login_res.json()["email"] == "legacy@example.com"

    # Profile lookup succeeds with is_complete=False
    profile_res = test_client.get("/api/profiles/me")
    assert profile_res.status_code == 200
    assert profile_res.json()["is_complete"] is False
