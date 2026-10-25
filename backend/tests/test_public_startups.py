"""Tests for Public Startup Discovery, State-Based Filtering, and State Startup Aggregations."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.startup import Startup
from app.models.campaign import Campaign, CAMPAIGN_STATUS_PUBLISHED, CAMPAIGN_STATUS_DRAFT
from app.core.security import hash_password, create_access_token
from app.core.config import settings


def create_founder(client: TestClient, db: Session, full_name: str, email: str) -> User:
    """Helper to register founder and obtain an authenticated test client with cookies."""
    hashed = hash_password("ValidPassword123!")
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hashed,
        role="founder",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, role="founder")
    client.cookies.set(settings.COOKIE_NAME, token)
    return user


def test_public_startup_endpoints_unauthenticated(test_client: TestClient, db_session: Session):
    """Anonymous visitors must be able to list public startups and query by state without logging in."""
    test_client.cookies.clear()

    # Create a test founder and 2 startups in different states
    founder = create_founder(test_client, db_session, "Kiran Rao", "kiran@example.com")
    test_client.cookies.clear()  # Ensure unauthenticated for subsequent calls

    s1 = Startup(
        owner_id=founder.id,
        name="Bengaluru Tech Solutions",
        slug="bengaluru-tech-solutions",
        tagline="Next-gen developer tooling",
        description="High performance APIs for developers",
        industry="Developer Tools",
        company_stage="Growth",
        city="Bengaluru",
        state="Karnataka",
        country="India",
    )
    s2 = Startup(
        owner_id=founder.id,
        name="Mumbai FinTech Labs",
        slug="mumbai-fintech-labs",
        tagline="Modern payment orchestration",
        description="Scalable payments infrastructure",
        industry="Fintech",
        company_stage="Early Traction",
        city="Mumbai",
        state="Maharashtra",
        country="India",
    )
    db_session.add_all([s1, s2])
    db_session.commit()

    # Add a published campaign to s1 and draft to s2
    c1 = Campaign(
        startup_id=s1.id,
        title="Bengaluru Alpha Test",
        slug="bengaluru-alpha-test",
        summary="Test our dev tools",
        description="Testing task description here",
        access_instructions="Confidential instructions",
        status=CAMPAIGN_STATUS_PUBLISHED,
        testing_tasks=[{"title": "Test API", "order": 1, "is_required": True}],
        target_audience={},
    )
    c2 = Campaign(
        startup_id=s2.id,
        title="Mumbai Draft Test",
        slug="mumbai-draft-test",
        summary="Draft campaign",
        description="Testing draft description here",
        access_instructions="Secret instructions",
        status=CAMPAIGN_STATUS_DRAFT,
        testing_tasks=[],
        target_audience={},
    )
    db_session.add_all([c1, c2])
    db_session.commit()

    # 1. Test listing all public startups
    resp = test_client.get("/api/public/startups")
    assert resp.status_code == 200
    data = resp.json()

    assert "items" in data
    assert "total" in data
    assert "state_counts" in data
    assert data["total"] >= 2

    # Check state aggregation counts
    assert data["state_counts"].get("Karnataka", 0) >= 1
    assert data["state_counts"].get("Maharashtra", 0) >= 1

    # Verify published campaign count on Bengaluru Tech Solutions
    bengaluru_item = next(item for item in data["items"] if item["slug"] == "bengaluru-tech-solutions")
    assert bengaluru_item["state"] == "Karnataka"
    assert bengaluru_item["campaign_count"] == 1
    # Ensure owner_id or private access instructions are NOT exposed
    assert "owner_id" not in bengaluru_item
    assert "access_instructions" not in bengaluru_item

    # 2. Test filtering by state (Karnataka)
    resp_ka = test_client.get("/api/public/startups?state=Karnataka")
    assert resp_ka.status_code == 200
    data_ka = resp_ka.json()
    assert all(item["state"] == "Karnataka" for item in data_ka["items"])
    assert any(item["slug"] == "bengaluru-tech-solutions" for item in data_ka["items"])
    assert not any(item["slug"] == "mumbai-fintech-labs" for item in data_ka["items"])

    # 3. Test filtering by state with no matching startups
    resp_none = test_client.get("/api/public/startups?state=Goa")
    assert resp_none.status_code == 200
    data_none = resp_none.json()
    assert len(data_none["items"]) == 0
    assert data_none["total"] == 0


def test_founder_creates_and_updates_startup_with_state(test_client: TestClient, db_session: Session):
    """Founders can supply state during creation and update, and it persists properly."""
    create_founder(test_client, db_session, "Ananya Sharma", "ananya@example.com")

    # Create startup with state
    payload = {
        "name": "Delhi AI Workspace",
        "tagline": "AI workflows for teams",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "company_stage": "MVP",
    }
    create_resp = test_client.post("/api/startups", json=payload)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["state"] == "Delhi"
    startup_id = created_data["id"]

    # Update startup state to Haryana
    update_payload = {
        "city": "Gurugram",
        "state": "Haryana",
    }
    update_resp = test_client.put(f"/api/startups/{startup_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["city"] == "Gurugram"
    assert updated_data["state"] == "Haryana"
