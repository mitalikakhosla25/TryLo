"""Automated Tests for TryLo Phase 2B.2A: Campaign Data Model, APIs, and Lifecycle."""

import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_CLOSED,
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_PUBLISHED,
    REWARD_TYPE_MONETARY,
    REWARD_TYPE_PERK,
    REWARD_TYPE_UNPAID,
)
from app.models.startup import Startup
from app.models.user import User


def create_user_with_token(
    client: TestClient,
    db: Session,
    full_name: str,
    email: str,
    role: str,
) -> User:
    """Helper to register user and set authenticated session cookie on the client."""
    hashed = hash_password("SecurePassword123!")
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


def create_test_startup(db: Session, owner: User, name: str, slug: str) -> Startup:
    """Helper to seed a startup for an owner."""
    startup = Startup(
        owner_id=owner.id,
        name=name,
        slug=slug,
        tagline="Building innovative products",
        description="A startup description.",
        company_stage="MVP",
        website_url="https://example.com",
    )
    db.add(startup)
    db.commit()
    db.refresh(startup)
    return startup


# ==============================================================================
# Authentication & Role Authorization Tests
# ==============================================================================


def test_unauthenticated_campaign_access(test_client: TestClient):
    """Unauthenticated requests to founder campaign management endpoints must return 401."""
    fake_id = uuid.uuid4()
    assert test_client.get(f"/api/startups/{fake_id}/campaigns").status_code == 401
    assert test_client.post(f"/api/startups/{fake_id}/campaigns", json={"title": "Draft"}).status_code == 401
    assert test_client.get(f"/api/campaigns/{fake_id}").status_code == 401
    assert test_client.put(f"/api/campaigns/{fake_id}", json={"title": "Draft"}).status_code == 401
    assert test_client.post(f"/api/campaigns/{fake_id}/publish").status_code == 401
    assert test_client.post(f"/api/campaigns/{fake_id}/close").status_code == 401
    assert test_client.delete(f"/api/campaigns/{fake_id}").status_code == 401


def test_tester_cannot_access_campaign_management_endpoints(test_client: TestClient, db_session: Session):
    """Testers must be forbidden from founder campaign management endpoints with 403."""
    create_user_with_token(test_client, db_session, "Tina Tester", "tina@example.com", "tester")
    fake_id = uuid.uuid4()

    assert test_client.get(f"/api/startups/{fake_id}/campaigns").status_code == 403
    assert test_client.post(f"/api/startups/{fake_id}/campaigns", json={"title": "Draft"}).status_code == 403
    assert test_client.get(f"/api/campaigns/{fake_id}").status_code == 403
    assert test_client.put(f"/api/campaigns/{fake_id}", json={"title": "Draft"}).status_code == 403
    assert test_client.post(f"/api/campaigns/{fake_id}/publish").status_code == 403
    assert test_client.post(f"/api/campaigns/{fake_id}/close").status_code == 403
    assert test_client.delete(f"/api/campaigns/{fake_id}").status_code == 403


# ==============================================================================
# Draft Creation and Persistence Tests
# ==============================================================================


def test_create_campaign_draft(test_client: TestClient, db_session: Session):
    """Founder should be able to create a campaign draft under their startup."""
    founder = create_user_with_token(test_client, db_session, "Alice Founder", "alice@example.com", "founder")
    startup = create_test_startup(db_session, founder, "Nova Labs", "nova-labs")

    payload = {
        "title": "Quantum Sensor Beta",
        "summary": "Beta testing our IoT quantum temperature sensor.",
        "description": "Comprehensive testing of hardware and web dashboard telemetry.",
        "product_type": "Web App",
        "product_url": "https://quantumsensor.example.com",
        "access_instructions": "Login with invite code NOVABETA2026.",
        "testing_tasks": [
            {"title": "Connect device to Wi-Fi", "description": "Verify Bluetooth provisioning.", "is_required": True, "order": 1},
            {"title": "View real-time telemetry", "description": "Check live chart rendering.", "is_required": True, "order": 2},
        ],
        "target_audience": {
            "skills": ["IoT", "Hardware"],
            "devices": ["Mac", "Linux", "Windows"],
            "experience_level": "Intermediate",
        },
        "max_testers": 30,
        "reward_type": "unpaid",
    }

    res = test_client.post(f"/api/startups/{startup.id}/campaigns", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["title"] == "Quantum Sensor Beta"
    assert data["slug"] == "quantum-sensor-beta"
    assert data["status"] == "draft"
    assert data["published_at"] is None
    assert str(data["startup_id"]) == str(startup.id)
    assert data["max_testers"] == 30
    assert len(data["testing_tasks"]) == 2
    assert data["target_audience"]["skills"] == ["IoT", "Hardware"]
    assert data["access_instructions"] == "Login with invite code NOVABETA2026."


def test_slug_collision_handling_within_startup(test_client: TestClient, db_session: Session):
    """Campaigns with the same title under the same startup receive unique incremental slugs."""
    founder = create_user_with_token(test_client, db_session, "Bob Founder", "bob@example.com", "founder")
    startup = create_test_startup(db_session, founder, "Rocket App", "rocket-app")

    payload = {"title": "Mobile Beta Test", "summary": "Short summary"}

    res1 = test_client.post(f"/api/startups/{startup.id}/campaigns", json=payload)
    assert res1.status_code == 201
    assert res1.json()["slug"] == "mobile-beta-test"

    res2 = test_client.post(f"/api/startups/{startup.id}/campaigns", json=payload)
    assert res2.status_code == 201
    assert res2.json()["slug"] == "mobile-beta-test-2"

    res3 = test_client.post(f"/api/startups/{startup.id}/campaigns", json=payload)
    assert res3.status_code == 201
    assert res3.json()["slug"] == "mobile-beta-test-3"


def test_multiple_campaigns_belonging_to_one_startup(test_client: TestClient, db_session: Session):
    """A startup can own multiple campaigns; listing returns all campaigns for that startup."""
    founder = create_user_with_token(test_client, db_session, "Carol Founder", "carol@example.com", "founder")
    startup = create_test_startup(db_session, founder, "Apex AI", "apex-ai")

    test_client.post(f"/api/startups/{startup.id}/campaigns", json={"title": "Campaign Alpha"})
    test_client.post(f"/api/startups/{startup.id}/campaigns", json={"title": "Campaign Beta"})
    test_client.post(f"/api/startups/{startup.id}/campaigns", json={"title": "Campaign Gamma"})

    res = test_client.get(f"/api/startups/{startup.id}/campaigns")
    assert res.status_code == 200
    campaigns = res.json()
    assert len(campaigns) == 3
    titles = [c["title"] for c in campaigns]
    assert "Campaign Alpha" in titles
    assert "Campaign Beta" in titles
    assert "Campaign Gamma" in titles


def test_campaign_ownership_across_multiple_startups(test_client: TestClient, db_session: Session):
    """A founder owning multiple startups has campaigns cleanly isolated per startup."""
    founder = create_user_with_token(test_client, db_session, "Dave Founder", "dave@example.com", "founder")
    startup_a = create_test_startup(db_session, founder, "Startup Alpha", "startup-alpha")
    startup_b = create_test_startup(db_session, founder, "Startup Beta", "startup-beta")

    test_client.post(f"/api/startups/{startup_a.id}/campaigns", json={"title": "Alpha Exclusive"})
    test_client.post(f"/api/startups/{startup_b.id}/campaigns", json={"title": "Beta Exclusive"})

    res_a = test_client.get(f"/api/startups/{startup_a.id}/campaigns")
    assert res_a.status_code == 200
    a_campaigns = res_a.json()
    assert len(a_campaigns) == 1
    assert a_campaigns[0]["title"] == "Alpha Exclusive"

    res_b = test_client.get(f"/api/startups/{startup_b.id}/campaigns")
    assert res_b.status_code == 200
    b_campaigns = res_b.json()
    assert len(b_campaigns) == 1
    assert b_campaigns[0]["title"] == "Beta Exclusive"


def test_cross_founder_access_denial(test_client: TestClient, db_session: Session):
    """Founders cannot read, update, publish, close, or delete campaigns belonging to other founders."""
    founder_1 = create_user_with_token(test_client, db_session, "Owner One", "owner1@example.com", "founder")
    startup_1 = create_test_startup(db_session, founder_1, "Company One", "company-one")

    res = test_client.post(f"/api/startups/{startup_1.id}/campaigns", json={"title": "Top Secret Draft"})
    campaign_id = res.json()["id"]

    # Switch to Founder 2
    founder_2 = create_user_with_token(test_client, db_session, "Owner Two", "owner2@example.com", "founder")

    # Founder 2 should receive 404 on all endpoints accessing Founder 1's startup or campaign
    assert test_client.get(f"/api/startups/{startup_1.id}/campaigns").status_code == 404
    assert test_client.post(f"/api/startups/{startup_1.id}/campaigns", json={"title": "Intruder"}).status_code == 404
    assert test_client.get(f"/api/campaigns/{campaign_id}").status_code == 404
    assert test_client.put(f"/api/campaigns/{campaign_id}", json={"title": "Hijacked"}).status_code == 404
    assert test_client.post(f"/api/campaigns/{campaign_id}/publish").status_code == 404
    assert test_client.post(f"/api/campaigns/{campaign_id}/close").status_code == 404
    assert test_client.delete(f"/api/campaigns/{campaign_id}").status_code == 404


def test_update_owned_draft(test_client: TestClient, db_session: Session):
    """Founder can update fields of their draft campaign, updating slug when title changes."""
    founder = create_user_with_token(test_client, db_session, "Eve Founder", "eve@example.com", "founder")
    startup = create_test_startup(db_session, founder, "SaaSify", "saasify")

    create_res = test_client.post(f"/api/startups/{startup.id}/campaigns", json={"title": "Initial Title"})
    campaign_id = create_res.json()["id"]

    update_payload = {
        "title": "Updated Super Product",
        "summary": "New concise summary",
        "description": "Expanded product overview and test procedures.",
        "max_testers": 50,
        "product_type": "iOS App",
    }
    update_res = test_client.put(f"/api/campaigns/{campaign_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()

    assert updated_data["title"] == "Updated Super Product"
    assert updated_data["slug"] == "updated-super-product"
    assert updated_data["summary"] == "New concise summary"
    assert updated_data["max_testers"] == 50
    assert updated_data["product_type"] == "iOS App"
    assert updated_data["status"] == "draft"


# ==============================================================================
# Validation Tests
# ==============================================================================


def test_reward_validation(test_client: TestClient, db_session: Session):
    """Reward combinations must adhere to strict platform constraints."""
    founder = create_user_with_token(test_client, db_session, "Grace Founder", "grace@example.com", "founder")
    startup = create_test_startup(db_session, founder, "FinTech Pro", "fintech-pro")

    # 1. Unpaid with monetary amount must fail
    res1 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Unpaid Error", "reward_type": "unpaid", "reward_amount": 20.0},
    )
    assert res1.status_code == 422

    # 2. Negative reward amount must fail
    res2 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Negative Reward", "reward_type": "monetary", "reward_amount": -10.0, "reward_currency": "USD"},
    )
    assert res2.status_code == 422

    # 3. Monetary reward with 0 amount must fail
    res3 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Zero Reward", "reward_type": "monetary", "reward_amount": 0, "reward_currency": "USD"},
    )
    assert res3.status_code == 422

    # 4. Monetary reward missing currency must fail
    res4 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "No Currency", "reward_type": "monetary", "reward_amount": 50.0},
    )
    assert res4.status_code == 422

    # 5. Monetary reward with invalid currency length must fail
    res5 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Invalid Curr", "reward_type": "monetary", "reward_amount": 50.0, "reward_currency": "US"},
    )
    assert res5.status_code == 422

    # 6. Perk reward missing description must fail
    res6 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Perk No Desc", "reward_type": "perk"},
    )
    assert res6.status_code == 422

    # 7. Valid monetary reward succeeds
    res7 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Paid Test", "reward_type": "monetary", "reward_amount": 75.0, "reward_currency": "USD"},
    )
    assert res7.status_code == 201
    assert res7.json()["reward_amount"] == 75.0
    assert res7.json()["reward_currency"] == "USD"

    # 8. Valid perk reward succeeds
    res8 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Perk Test", "reward_type": "perk", "reward_description": "Free annual tier access"},
    )
    assert res8.status_code == 201
    assert res8.json()["reward_description"] == "Free annual tier access"


def test_task_and_audience_validation(test_client: TestClient, db_session: Session):
    """Task count limits and schema constraints must be enforced."""
    founder = create_user_with_token(test_client, db_session, "Hank Founder", "hank@example.com", "founder")
    startup = create_test_startup(db_session, founder, "HealthTrack", "health-track")

    # More than 20 tasks rejected
    too_many_tasks = [{"title": f"Task {i}"} for i in range(21)]
    res = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Task Limit Test", "testing_tasks": too_many_tasks},
    )
    assert res.status_code == 422

    # Task with empty/too-short title rejected
    res2 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Short Task", "testing_tasks": [{"title": "X"}]},
    )
    assert res2.status_code == 422


def test_invalid_dates_and_capacity_values(test_client: TestClient, db_session: Session):
    """Non-positive capacity and invalid date order must be rejected."""
    founder = create_user_with_token(test_client, db_session, "Iris Founder", "iris@example.com", "founder")
    startup = create_test_startup(db_session, founder, "CyberShield", "cybershield")

    # max_testers <= 0 rejected
    res1 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Zero Testers", "max_testers": 0},
    )
    assert res1.status_code == 422

    # Invalid URL scheme rejected
    res2 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={"title": "Invalid URL", "product_url": "ftp://bad-url.com"},
    )
    assert res2.status_code == 422

    # Application deadline after testing start date rejected
    now = datetime.now(timezone.utc)
    res3 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={
            "title": "Bad Dates",
            "application_deadline": (now + timedelta(days=10)).isoformat(),
            "testing_start_date": (now + timedelta(days=5)).isoformat(),
        },
    )
    assert res3.status_code == 422

    # Testing start date after testing end date rejected
    res4 = test_client.post(
        f"/api/startups/{startup.id}/campaigns",
        json={
            "title": "Bad Dates 2",
            "testing_start_date": (now + timedelta(days=15)).isoformat(),
            "testing_end_date": (now + timedelta(days=10)).isoformat(),
        },
    )
    assert res4.status_code == 422


# ==============================================================================
# Lifecycle Transitions & Public Privacy Boundary Tests
# ==============================================================================


def test_publishing_incomplete_draft_rejected(test_client: TestClient, db_session: Session):
    """Publishing a draft lacking required public info or instructions must be rejected."""
    founder = create_user_with_token(test_client, db_session, "Jack Founder", "jack@example.com", "founder")
    startup = create_test_startup(db_session, founder, "Incomplete Labs", "incomplete-labs")

    # Bare draft without tasks, description, instructions
    res = test_client.post(f"/api/startups/{startup.id}/campaigns", json={"title": "Bare Bones"})
    campaign_id = res.json()["id"]

    # Attempt to publish incomplete draft
    pub_res = test_client.post(f"/api/campaigns/{campaign_id}/publish")
    assert pub_res.status_code == 400
    assert "required to publish" in pub_res.json()["detail"].lower()


def test_publishing_valid_draft_and_public_visibility(test_client: TestClient, db_session: Session):
    """
    Valid draft can be published.
    Before publish: public endpoint returns 404 (drafts are never exposed).
    After publish: public endpoint returns 200, concealing access instructions.
    """
    founder = create_user_with_token(test_client, db_session, "Karen Founder", "karen@example.com", "founder")
    startup = create_test_startup(db_session, founder, "Privacy First", "privacy-first")

    now = datetime.now(timezone.utc)
    complete_payload = {
        "title": "Encrypted Chat App",
        "summary": "End-to-end encrypted messaging test flight.",
        "description": "Looking for 20 testers to verify ratchet key exchange performance under high packet loss.",
        "product_type": "Web App",
        "product_url": "https://encryptedchat.example.com",
        "access_instructions": "SECRET-INTERNAL-TESTER-TOKEN-9988",
        "testing_tasks": [
            {"title": "Send 10 encrypted messages", "order": 1, "is_required": True},
        ],
        "target_audience": {"skills": ["Security"]},
        "max_testers": 20,
        "application_deadline": (now + timedelta(days=7)).isoformat(),
        "reward_type": "unpaid",
    }

    create_res = test_client.post(f"/api/startups/{startup.id}/campaigns", json=complete_payload)
    assert create_res.status_code == 201
    campaign_id = create_res.json()["id"]
    campaign_slug = create_res.json()["slug"]

    # 1. Draft is NOT visible on public endpoints
    public_id_res = test_client.get(f"/api/campaigns/public/{campaign_id}")
    assert public_id_res.status_code == 404

    public_slug_res = test_client.get(f"/api/campaigns/public/{startup.slug}/{campaign_slug}")
    assert public_slug_res.status_code == 404

    # 2. Publish campaign
    pub_res = test_client.post(f"/api/campaigns/{campaign_id}/publish")
    assert pub_res.status_code == 200
    published_data = pub_res.json()
    assert published_data["status"] == "published"
    assert published_data["published_at"] is not None
    original_published_at = published_data["published_at"]

    # 3. Now publicly visible by ID
    pub_id_ok = test_client.get(f"/api/campaigns/public/{campaign_id}")
    assert pub_id_ok.status_code == 200
    public_json = pub_id_ok.json()
    assert public_json["title"] == "Encrypted Chat App"
    assert public_json["startup_name"] == "Privacy First"
    assert public_json["startup_slug"] == "privacy-first"
    # Private tester instructions must NOT leak in public response
    assert "access_instructions" not in public_json

    # 4. Also publicly visible by slug
    pub_slug_ok = test_client.get(f"/api/campaigns/public/{startup.slug}/{campaign_slug}")
    assert pub_slug_ok.status_code == 200
    assert pub_slug_ok.json()["title"] == "Encrypted Chat App"

    # 5. Editing published campaign preserves published_at
    update_res = test_client.put(
        f"/api/campaigns/{campaign_id}",
        json={"summary": "Updated summary text"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["published_at"] == original_published_at


def test_closing_published_campaign_and_lifecycle_integrity(test_client: TestClient, db_session: Session):
    """
    Closing a campaign removes it from public discovery.
    Closed campaigns cannot be edited, re-published, or re-closed.
    """
    founder = create_user_with_token(test_client, db_session, "Leo Founder", "leo@example.com", "founder")
    startup = create_test_startup(db_session, founder, "FinCycle", "fincycle")

    payload = {
        "title": "Trading Platform Beta",
        "summary": "Real-time algorithmic trading interface.",
        "description": "Stress testing websocket feeds and low-latency order placement.",
        "product_type": "Desktop App",
        "product_url": "https://fincycle.example.com",
        "access_instructions": "Download installer from internal repo.",
        "testing_tasks": [{"title": "Connect API key", "order": 1}],
        "reward_type": "unpaid",
    }
    create_res = test_client.post(f"/api/startups/{startup.id}/campaigns", json=payload)
    campaign_id = create_res.json()["id"]

    # Cannot close a draft campaign
    res_close_draft = test_client.post(f"/api/campaigns/{campaign_id}/close")
    assert res_close_draft.status_code == 400
    assert "only published campaigns can be closed" in res_close_draft.json()["detail"].lower()

    # Publish campaign
    assert test_client.post(f"/api/campaigns/{campaign_id}/publish").status_code == 200

    # Cannot delete a published campaign
    del_pub = test_client.delete(f"/api/campaigns/{campaign_id}")
    assert del_pub.status_code == 400
    assert "only draft campaigns can be deleted" in del_pub.json()["detail"].lower()

    # Close campaign
    close_res = test_client.post(f"/api/campaigns/{campaign_id}/close")
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"

    # Closed campaign cannot be modified
    put_closed = test_client.put(f"/api/campaigns/{campaign_id}", json={"title": "Trying to modify closed"})
    assert put_closed.status_code == 400
    assert "closed campaigns cannot be modified" in put_closed.json()["detail"].lower()

    # Cannot re-publish closed campaign
    pub_closed = test_client.post(f"/api/campaigns/{campaign_id}/publish")
    assert pub_closed.status_code == 400
    assert "cannot publish a closed campaign" in pub_closed.json()["detail"].lower()

    # Cannot re-close closed campaign
    reclose = test_client.post(f"/api/campaigns/{campaign_id}/close")
    assert reclose.status_code == 400
    assert "already closed" in reclose.json()["detail"].lower()

    # Public endpoint should now return 404
    pub_get = test_client.get(f"/api/campaigns/public/{campaign_id}")
    assert pub_get.status_code == 404


def test_delete_draft_campaign(test_client: TestClient, db_session: Session):
    """Founders can safely delete their uncompleted drafts."""
    founder = create_user_with_token(test_client, db_session, "Mia Founder", "mia@example.com", "founder")
    startup = create_test_startup(db_session, founder, "Scratchpad Co", "scratchpad-co")

    res = test_client.post(f"/api/startups/{startup.id}/campaigns", json={"title": "Discardable Idea"})
    campaign_id = res.json()["id"]

    # Delete draft
    del_res = test_client.delete(f"/api/campaigns/{campaign_id}")
    assert del_res.status_code == 204

    # Subsequent GET returns 404
    assert test_client.get(f"/api/campaigns/{campaign_id}").status_code == 404
