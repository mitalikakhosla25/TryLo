"""Tests for Startup Management, Multi-startup Ownership, and Isolation."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.startup import Startup
from app.core.security import hash_password, create_access_token
from app.core.config import settings


def create_user_with_token(client: TestClient, db: Session, full_name: str, email: str, role: str) -> User:
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


def set_client_token(client: TestClient, user: User) -> None:
    """Switch active cookie for client to given user."""
    token = create_access_token(user_id=user.id, role=user.role)
    client.cookies.set(settings.COOKIE_NAME, token)


def test_unauthenticated_startup_access(test_client: TestClient):
    """Unauthenticated requests to founder startup endpoints must return 401."""
    assert test_client.get("/api/startups").status_code == 401
    assert test_client.post("/api/startups", json={"name": "Ghost Startup"}).status_code == 401
    assert test_client.get("/api/startups/00000000-0000-0000-0000-000000000000").status_code == 401
    assert test_client.put("/api/startups/00000000-0000-0000-0000-000000000000", json={"name": "Ghost"}).status_code == 401


def test_tester_cannot_access_startup_endpoints(test_client: TestClient, db_session: Session):
    """Testers must be rejected from startup management endpoints with 403 Forbidden."""
    create_user_with_token(test_client, db_session, "Tom Tester", "tester@example.com", "tester")

    assert test_client.get("/api/startups").status_code == 403
    assert test_client.post("/api/startups", json={"name": "Tester Co"}).status_code == 403


def test_founder_can_create_multiple_startups(test_client: TestClient, db_session: Session):
    """A single founder must be able to create and own multiple startups."""
    founder = create_user_with_token(test_client, db_session, "Frank Founder", "frank@example.com", "founder")

    # Create Startup 1
    s1_payload = {
        "name": "Nova Dynamics",
        "tagline": "Next-gen solar propulsion",
        "description": "Revolutionizing space exploration with solar sails.",
        "industry": "Aerospace",
        "company_stage": "MVP",
        "website_url": "https://novadynamics.example.com",
        "city": "Austin",
        "country": "USA",
        "founded_year": 2024,
    }
    res1 = test_client.post("/api/startups", json=s1_payload)
    assert res1.status_code == 201
    data1 = res1.json()
    assert data1["name"] == "Nova Dynamics"
    assert data1["slug"] == "nova-dynamics"
    assert data1["tagline"] == "Next-gen solar propulsion"
    assert data1["company_stage"] == "MVP"
    assert str(data1["owner_id"]) == str(founder.id)
    assert data1["id"] is not None

    # Create Startup 2 for the same founder
    s2_payload = {
        "name": "Quantum Grid",
        "tagline": "Decentralized energy management",
        "description": "Smart energy grids for distributed communities.",
        "industry": "CleanTech",
        "company_stage": "Early Traction",
        "website_url": "https://quantumgrid.example.com",
        "city": "Berlin",
        "country": "Germany",
        "founded_year": 2025,
    }
    res2 = test_client.post("/api/startups", json=s2_payload)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["name"] == "Quantum Grid"
    assert data2["slug"] == "quantum-grid"
    assert str(data2["owner_id"]) == str(founder.id)

    # Verify listing returns both startups
    list_res = test_client.get("/api/startups")
    assert list_res.status_code == 200
    startups = list_res.json()
    assert len(startups) == 2
    names = [s["name"] for s in startups]
    assert "Nova Dynamics" in names
    assert "Quantum Grid" in names


def test_slug_collision_handling(test_client: TestClient, db_session: Session):
    """When creating startups with duplicate names, slug collision should automatically append a counter."""
    founder = create_user_with_token(test_client, db_session, "Sam Founder", "sam@example.com", "founder")

    # Startup 1
    res1 = test_client.post("/api/startups", json={"name": "Acme Ventures"})
    assert res1.status_code == 201
    assert res1.json()["slug"] == "acme-ventures"

    # Startup 2 with exact same name
    res2 = test_client.post("/api/startups", json={"name": "Acme Ventures"})
    assert res2.status_code == 201
    assert res2.json()["slug"] == "acme-ventures-2"

    # Startup 3 with exact same name
    res3 = test_client.post("/api/startups", json={"name": "Acme Ventures"})
    assert res3.status_code == 201
    assert res3.json()["slug"] == "acme-ventures-3"


def test_cross_founder_isolation(test_client: TestClient, db_session: Session):
    """Founders cannot see, retrieve, or update other founders' startups."""
    # Create Founder A and startup
    founder_a = create_user_with_token(test_client, db_session, "Founder A", "fa@example.com", "founder")
    res_a = test_client.post("/api/startups", json={"name": "Company Alpha"})
    assert res_a.status_code == 201
    startup_a_id = res_a.json()["id"]

    # Create Founder B and startup
    founder_b = create_user_with_token(test_client, db_session, "Founder B", "fb@example.com", "founder")
    res_b = test_client.post("/api/startups", json={"name": "Company Beta"})
    assert res_b.status_code == 201
    startup_b_id = res_b.json()["id"]

    # Founder B listings should only show Company Beta
    list_b = test_client.get("/api/startups")
    assert list_b.status_code == 200
    b_items = list_b.json()
    assert len(b_items) == 1
    assert b_items[0]["id"] == startup_b_id

    # Founder B attempting to retrieve Founder A's startup returns 404 (not 403 to prevent enumeration)
    get_cross = test_client.get(f"/api/startups/{startup_a_id}")
    assert get_cross.status_code == 404

    # Founder B attempting to update Founder A's startup returns 404
    put_cross = test_client.put(f"/api/startups/{startup_a_id}", json={"name": "Hacked Alpha"})
    assert put_cross.status_code == 404

    # Switch back to Founder A to verify Alpha wasn't altered
    set_client_token(test_client, founder_a)
    verify_a = test_client.get(f"/api/startups/{startup_a_id}")
    assert verify_a.status_code == 200
    assert verify_a.json()["name"] == "Company Alpha"


def test_founder_update_startup(test_client: TestClient, db_session: Session):
    """Owner can update startup information and verify persistence."""
    founder = create_user_with_token(test_client, db_session, "Updator", "up@example.com", "founder")
    res = test_client.post(
        "/api/startups",
        json={"name": "Original Name", "tagline": "Initial Tag", "company_stage": "Idea"},
    )
    assert res.status_code == 201
    startup_id = res.json()["id"]

    update_payload = {
        "name": "Updated Name",
        "tagline": "Updated Tagline",
        "description": "Full new description.",
        "company_stage": "Early Traction",
        "industry": "Fintech",
        "website_url": "https://updated.example.com",
        "city": "London",
        "country": "UK",
        "founded_year": 2023,
    }
    update_res = test_client.put(f"/api/startups/{startup_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Updated Name"
    assert updated_data["company_stage"] == "Early Traction"
    assert updated_data["website_url"] == "https://updated.example.com"
    assert updated_data["city"] == "London"

    # Verify retrieval
    get_res = test_client.get(f"/api/startups/{startup_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Updated Name"


def test_startup_validation(test_client: TestClient, db_session: Session):
    """Invalid payload values should trigger 422 Unprocessable Entity."""
    create_user_with_token(test_client, db_session, "Validator", "val@example.com", "founder")

    # Invalid company stage
    bad_stage_res = test_client.post(
        "/api/startups",
        json={"name": "Bad Stage", "company_stage": "NonExistentStage"},
    )
    assert bad_stage_res.status_code == 422

    # Invalid founded year
    bad_year_res = test_client.post(
        "/api/startups",
        json={"name": "Bad Year", "founded_year": 1850},
    )
    assert bad_year_res.status_code == 422

    # Empty name
    empty_name_res = test_client.post(
        "/api/startups",
        json={"name": "   "},
    )
    assert empty_name_res.status_code == 422


def test_public_startup_endpoint(test_client: TestClient, db_session: Session):
    """Public startup endpoint returns public details by slug without requiring authentication or exposing owner_id."""
    founder = create_user_with_token(test_client, db_session, "Public Founder", "pub@example.com", "founder")

    create_res = test_client.post(
        "/api/startups",
        json={
            "name": "Public Ventures",
            "tagline": "Open to all",
            "description": "Public beta testing",
            "industry": "AI / ML",
            "company_stage": "Growth",
            "website_url": "https://pub.example.com",
            "city": "Toronto",
            "country": "Canada",
        },
    )
    assert create_res.status_code == 201
    slug = create_res.json()["slug"]

    # Clear authentication cookies to simulate unauthenticated visitor
    test_client.cookies.clear()

    pub_res = test_client.get(f"/api/startups/public/{slug}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["name"] == "Public Ventures"
    assert pub_data["slug"] == slug
    assert pub_data["industry"] == "AI / ML"
    assert pub_data["company_stage"] == "Growth"
    # Ensure owner_id or private founder fields are NOT in public response
    assert "owner_id" not in pub_data
    assert "password_hash" not in pub_data
    assert "email" not in pub_data

    # Unknown slug returns 404
    assert test_client.get("/api/startups/public/does-not-exist-slug").status_code == 404
