"""Automated Tests for TryLo Phase 2B.3C: Founder Application Review, Acceptance, Rejection & Private Access."""

import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.application import (
    CampaignApplication,
    APPLICATION_STATUS_PENDING,
    APPLICATION_STATUS_ACCEPTED,
    APPLICATION_STATUS_REJECTED,
)
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_ARCHIVED,
    CAMPAIGN_STATUS_CLOSED,
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_PUBLISHED,
)
from app.models.profile import TesterProfile as TesterProfileModel
from app.models.startup import Startup
from app.models.user import User

TesterProfileModel.__test__ = False


def seed_test_user(db: Session, full_name: str, email: str, role: str) -> User:
    """Helper to seed a test user."""
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password("Password123!"),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_tester_with_profile(
    db: Session,
    full_name: str,
    email: str,
    is_complete: bool = True,
) -> User:
    """Helper to seed a tester with either complete or incomplete profile."""
    tester = seed_test_user(db, full_name, email, "tester")
    if is_complete:
        profile = TesterProfileModel(
            user_id=tester.id,
            bio="Experienced QA engineer specializing in SaaS and mobile testing.",
            skills=["UI Testing", "API Testing", "Bug Reporting"],
            interests=["SaaS", "Developer Tools", "AI"],
            experience_level="Intermediate",
            devices=["Desktop / Mac", "iPhone"],
            city="Berlin",
            country="Germany",
            linkedin_url="https://linkedin.com/in/test-qa",
        )
    else:
        profile = TesterProfileModel(
            user_id=tester.id,
            bio="",
            skills=[],
            interests=[],
        )
    db.add(profile)
    db.commit()
    db.refresh(tester)
    return tester


def seed_test_startup(db: Session, owner: User, name: str, slug: str) -> Startup:
    """Helper to seed a test startup."""
    startup = Startup(
        owner_id=owner.id,
        name=name,
        slug=slug,
        tagline="Next-gen software",
        description="Revolutionizing testing.",
        company_stage="MVP",
        website_url="https://teststartup.com",
    )
    db.add(startup)
    db.commit()
    db.refresh(startup)
    return startup


def seed_test_campaign(
    db: Session,
    startup: Startup,
    title: str,
    slug: str,
    status: str = CAMPAIGN_STATUS_PUBLISHED,
    screening_questions: list = None,
    max_testers: int = 5,
    access_instructions: str = "CONFIDENTIAL_INSTRUCTIONS_SECRET_TOKEN_XYZ",
    product_url: str = "https://product.example.com",
) -> Campaign:
    """Helper to seed a test campaign."""
    now = datetime.now(timezone.utc)
    pub_at = (now - timedelta(days=1)) if status == CAMPAIGN_STATUS_PUBLISHED else None

    campaign = Campaign(
        startup_id=startup.id,
        title=title,
        slug=slug,
        summary=f"Summary for {title}",
        description=f"Detailed description for {title}.",
        product_type="Web App",
        product_url=product_url,
        access_instructions=access_instructions,
        testing_tasks=[{"id": "t1", "title": "Test login", "is_required": True, "order": 1}],
        screening_questions=screening_questions if screening_questions is not None else [],
        target_audience={
            "experience_level": "Beginner",
            "devices": ["Desktop / Mac"],
        },
        max_testers=max_testers,
        status=status,
        published_at=pub_at,
        created_at=pub_at or now,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def authenticate_client(client: TestClient, user: User) -> None:
    """Sets the auth cookie on the test client for the given user."""
    token = create_access_token(user_id=user.id, role=user.role)
    client.cookies.set(settings.COOKIE_NAME, token)


# ==============================================================================
# 1. Ownership & Role Authorization Tests
# ==============================================================================


SAMPLE_QUESTIONS = [
    {
        "id": "q1",
        "prompt": "How many years of testing experience do you have?",
        "question_type": "single_choice",
        "is_required": True,
        "options": ["< 1 year", "1-3 years", "3+ years"],
    }
]


def test_owning_founder_can_list_campaign_applications(test_client: TestClient, db_session: Session):
    """Owning founder can retrieve applications submitted to their campaign."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}", max_testers=10, screening_questions=SAMPLE_QUESTIONS
    )

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q1": "1-3 years"}, "motivation": "I love beta testing."},
    )

    # Founder lists applications
    authenticate_client(test_client, founder)
    res = test_client.get(f"/api/campaigns/{campaign.id}/applications")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["accepted_testers"] == 0
    assert data["max_testers"] == 10
    assert data["is_full"] is False

    item = data["items"][0]
    assert item["campaign_title"] == "Beta Test"
    assert item["startup_name"] == "Acme AI"
    assert item["status"] == "pending"
    assert item["motivation"] == "I love beta testing."
    assert item["screening_answers"] == {"q1": "1-3 years"}
    assert item["tester"]["full_name"] == "Alice QA"
    assert item["tester"]["experience_level"] == "Intermediate"
    assert "Desktop / Mac" in item["tester"]["devices"]
    assert "password_hash" not in item["tester"]
    assert "email" not in item["tester"]


def test_cross_founder_cannot_list_another_founders_applications(test_client: TestClient, db_session: Session):
    """Founder B cannot list applications for Founder A's campaign (returns 404)."""
    founder_a = seed_test_user(db_session, "Founder A", f"fa_{uuid.uuid4().hex[:6]}@example.com", "founder")
    founder_b = seed_test_user(db_session, "Founder B", f"fb_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup_a = seed_test_startup(db_session, founder_a, "Alpha Corp", f"alpha-{uuid.uuid4().hex[:6]}")
    campaign_a = seed_test_campaign(db_session, startup_a, "Alpha Camp", f"alpha-{uuid.uuid4().hex[:6]}")

    # Founder B attempts to list Founder A's campaign applications
    authenticate_client(test_client, founder_b)
    res = test_client.get(f"/api/campaigns/{campaign_a.id}/applications")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_founder_can_inspect_screening_answers_and_details(test_client: TestClient, db_session: Session):
    """Founder can retrieve single application detail with campaign screening questions."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}", screening_questions=SAMPLE_QUESTIONS
    )

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    create_res = test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q1": "1-3 years"}, "motivation": "I love beta testing."},
    )
    app_id = create_res.json()["id"]

    # Founder inspects application details
    authenticate_client(test_client, founder)
    res = test_client.get(f"/api/founder/applications/{app_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == app_id
    assert data["status"] == "pending"
    assert data["screening_answers"] == {"q1": "1-3 years"}
    assert len(data["screening_questions"]) == 1
    assert data["screening_questions"][0]["prompt"] == "How many years of testing experience do you have?"


def test_cross_founder_cannot_retrieve_single_application_detail(test_client: TestClient, db_session: Session):
    """Founder B cannot view single application detail belonging to Founder A (404)."""
    founder_a = seed_test_user(db_session, "Founder A", f"fa_{uuid.uuid4().hex[:6]}@example.com", "founder")
    founder_b = seed_test_user(db_session, "Founder B", f"fb_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup_a = seed_test_startup(db_session, founder_a, "Alpha Corp", f"alpha-{uuid.uuid4().hex[:6]}")
    campaign_a = seed_test_campaign(db_session, startup_a, "Alpha Camp", f"alpha-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    create_res = test_client.post(f"/api/campaigns/{campaign_a.id}/applications", json={"screening_answers": {}})
    app_id = create_res.json()["id"]

    # Founder B attempts to fetch Founder A's application
    authenticate_client(test_client, founder_b)
    res = test_client.get(f"/api/founder/applications/{app_id}")
    assert res.status_code == 404


def test_tester_cannot_access_founder_application_endpoints(test_client: TestClient, db_session: Session):
    """Testers cannot access founder application management endpoints (403 Forbidden)."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    create_res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    app_id = create_res.json()["id"]

    # Tester tries to access founder endpoints
    res1 = test_client.get(f"/api/campaigns/{campaign.id}/applications")
    assert res1.status_code == 403

    res2 = test_client.get(f"/api/founder/applications/{app_id}")
    assert res2.status_code == 403

    res3 = test_client.post(f"/api/founder/applications/{app_id}/accept")
    assert res3.status_code == 403

    res4 = test_client.post(f"/api/founder/applications/{app_id}/reject")
    assert res4.status_code == 403


def test_unauthenticated_request_is_rejected(test_client: TestClient, db_session: Session):
    """Unauthenticated requests are rejected with 401 Unauthorized."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    test_client.cookies.clear()
    res = test_client.get(f"/api/campaigns/{campaign.id}/applications")
    assert res.status_code == 401


def test_founder_overview_lists_applications_across_campaigns(test_client: TestClient, db_session: Session):
    """GET /api/founder/applications returns applications across all owned campaigns."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    camp1 = seed_test_campaign(db_session, startup, "Camp 1", f"c1-{uuid.uuid4().hex[:6]}")
    camp2 = seed_test_campaign(db_session, startup, "Camp 2", f"c2-{uuid.uuid4().hex[:6]}")

    tester1 = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com")
    tester2 = seed_tester_with_profile(db_session, "Tester 2", f"t2_{uuid.uuid4().hex[:6]}@example.com")

    authenticate_client(test_client, tester1)
    test_client.post(f"/api/campaigns/{camp1.id}/applications", json={"screening_answers": {}})

    authenticate_client(test_client, tester2)
    test_client.post(f"/api/campaigns/{camp2.id}/applications", json={"screening_answers": {}})

    # Founder checks overview
    authenticate_client(test_client, founder)
    res = test_client.get("/api/founder/applications")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2


# ==============================================================================
# 2. Acceptance & Rejection Workflow Tests
# ==============================================================================


def test_pending_application_can_be_accepted(test_client: TestClient, db_session: Session):
    """Pending application transitions to accepted and updates capacity."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}", max_testers=3)

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    create_res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    app_id = create_res.json()["id"]

    # Founder accepts
    authenticate_client(test_client, founder)
    accept_res = test_client.post(f"/api/founder/applications/{app_id}/accept")
    assert accept_res.status_code == 200
    data = accept_res.json()
    assert data["status"] == "accepted"
    assert data["accepted_testers"] == 1
    assert data["max_testers"] == 3
    assert data["is_full"] is False

    # Check database state
    app_in_db = db_session.scalar(select(CampaignApplication).where(CampaignApplication.id == uuid.UUID(app_id)))
    assert app_in_db.status == APPLICATION_STATUS_ACCEPTED


def test_pending_application_can_be_rejected_with_internal_note(test_client: TestClient, db_session: Session):
    """Pending application transitions to rejected and stores internal note."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    create_res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    app_id = create_res.json()["id"]

    # Founder rejects
    authenticate_client(test_client, founder)
    reject_res = test_client.post(
        f"/api/founder/applications/{app_id}/reject",
        json={"rejection_note": "Targeting different device ecosystem for this test."},
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "rejected"
    assert data["rejection_note"] == "Targeting different device ecosystem for this test."

    # Check database state
    app_in_db = db_session.scalar(select(CampaignApplication).where(CampaignApplication.id == uuid.UUID(app_id)))
    assert app_in_db.status == APPLICATION_STATUS_REJECTED
    assert app_in_db.rejection_note == "Targeting different device ecosystem for this test."


def test_terminal_states_prevent_repeated_transitions(test_client: TestClient, db_session: Session):
    """Accepted and rejected states are terminal; repeated or flip-flop transitions are rejected."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester1 = seed_tester_with_profile(db_session, "T1", f"t1_{uuid.uuid4().hex[:6]}@example.com")
    tester2 = seed_tester_with_profile(db_session, "T2", f"t2_{uuid.uuid4().hex[:6]}@example.com")

    authenticate_client(test_client, tester1)
    app1_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, tester2)
    app2_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)

    # 1. Accept App 1
    test_client.post(f"/api/founder/applications/{app1_id}/accept")
    # Repeated accept
    rep_accept = test_client.post(f"/api/founder/applications/{app1_id}/accept")
    assert rep_accept.status_code == 400
    assert "already been accepted" in rep_accept.json()["detail"].lower()

    # Attempt to reject already accepted
    flip_reject = test_client.post(f"/api/founder/applications/{app1_id}/reject")
    assert flip_reject.status_code == 400
    assert "cannot reject an already accepted" in flip_reject.json()["detail"].lower()

    # 2. Reject App 2
    test_client.post(f"/api/founder/applications/{app2_id}/reject")
    # Repeated reject
    rep_reject = test_client.post(f"/api/founder/applications/{app2_id}/reject")
    assert rep_reject.status_code == 400
    assert "already been rejected" in rep_reject.json()["detail"].lower()

    # Attempt to accept already rejected
    flip_accept = test_client.post(f"/api/founder/applications/{app2_id}/accept")
    assert flip_accept.status_code == 400
    assert "cannot accept a rejected" in flip_accept.json()["detail"].lower()


def test_cannot_accept_applications_for_non_published_campaign(test_client: TestClient, db_session: Session):
    """Applications cannot be accepted if campaign is closed, archived, or draft."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    # Close campaign
    campaign.status = CAMPAIGN_STATUS_CLOSED
    db_session.commit()

    # Founder tries to accept
    authenticate_client(test_client, founder)
    res = test_client.post(f"/api/founder/applications/{app_id}/accept")
    assert res.status_code == 400
    assert "closed" in res.json()["detail"].lower()


# ==============================================================================
# 3. Concurrency & Capacity Enforcement Tests
# ==============================================================================


def test_acceptance_enforces_max_testers_capacity(test_client: TestClient, db_session: Session):
    """Campaign with max_testers=2 rejects the 3rd applicant when full."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}", max_testers=2)

    tester1 = seed_tester_with_profile(db_session, "T1", f"t1_{uuid.uuid4().hex[:6]}@example.com")
    tester2 = seed_tester_with_profile(db_session, "T2", f"t2_{uuid.uuid4().hex[:6]}@example.com")
    tester3 = seed_tester_with_profile(db_session, "T3", f"t3_{uuid.uuid4().hex[:6]}@example.com")

    authenticate_client(test_client, tester1)
    app1_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, tester2)
    app2_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, tester3)
    app3_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)

    # Accept 1st
    res1 = test_client.post(f"/api/founder/applications/{app1_id}/accept")
    assert res1.status_code == 200
    assert res1.json()["accepted_testers"] == 1
    assert res1.json()["is_full"] is False

    # Accept 2nd (capacity reached)
    res2 = test_client.post(f"/api/founder/applications/{app2_id}/accept")
    assert res2.status_code == 200
    assert res2.json()["accepted_testers"] == 2
    assert res2.json()["is_full"] is True

    # Try accepting 3rd (must be rejected)
    res3 = test_client.post(f"/api/founder/applications/{app3_id}/accept")
    assert res3.status_code == 400
    assert "maximum capacity" in res3.json()["detail"].lower()

    # Verify 3rd application is still pending in database
    app3 = db_session.scalar(select(CampaignApplication).where(CampaignApplication.id == uuid.UUID(app3_id)))
    assert app3.status == APPLICATION_STATUS_PENDING

    # Total accepted in DB is exactly 2
    total_accepted = db_session.scalar(
        select(func.count(CampaignApplication.id)).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    )
    assert total_accepted == 2


def test_unlimited_capacity_campaign_accepts_testers_without_limit(test_client: TestClient, db_session: Session):
    """Campaigns with max_testers=None allow multiple acceptances without capacity failure."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}", max_testers=None)

    for i in range(3):
        t = seed_tester_with_profile(db_session, f"T{i}", f"t{i}_{uuid.uuid4().hex[:6]}@example.com")
        authenticate_client(test_client, t)
        app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

        authenticate_client(test_client, founder)
        res = test_client.post(f"/api/founder/applications/{app_id}/accept")
        assert res.status_code == 200
        assert res.json()["accepted_testers"] == i + 1
        assert res.json()["is_full"] is False


def test_simulated_concurrent_acceptance_respects_capacity(test_client: TestClient, db_session: Session):
    """When only 1 slot remains, concurrent attempts cannot exceed capacity."""
    import threading
    from sqlalchemy.orm import sessionmaker
    from fastapi import HTTPException
    from app.api.applications import accept_campaign_application

    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}", max_testers=1)

    t1 = seed_tester_with_profile(db_session, "T1", f"t1_{uuid.uuid4().hex[:6]}@example.com")
    t2 = seed_tester_with_profile(db_session, "T2", f"t2_{uuid.uuid4().hex[:6]}@example.com")

    authenticate_client(test_client, t1)
    app1_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, t2)
    app2_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    founder_id = founder.id
    engine = db_session.get_bind()
    SessionLocal = sessionmaker(bind=engine)
    sqlite_conn_lock = threading.Lock()

    def try_accept_direct(app_id_str: str):
        with sqlite_conn_lock:
            with SessionLocal() as session:
                try:
                    founder_user = session.get(User, founder_id)
                    res = accept_campaign_application(
                        application_id=uuid.UUID(app_id_str),
                        current_user=founder_user,
                        db=session,
                    )
                    return 200, res
                except HTTPException as e:
                    return e.status_code, e.detail

    with ThreadPoolExecutor(max_workers=2) as executor:
        fut1 = executor.submit(try_accept_direct, app1_id)
        fut2 = executor.submit(try_accept_direct, app2_id)
        status1, _ = fut1.result()
        status2, _ = fut2.result()

    status_codes = [status1, status2]
    assert 200 in status_codes
    assert 400 in status_codes

    # Verify database: exactly 1 is accepted, no over-allocation
    with SessionLocal() as session:
        accepted_count = session.scalar(
            select(func.count(CampaignApplication.id)).where(
                CampaignApplication.campaign_id == campaign.id,
                CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
            )
        )
        assert accepted_count == 1


# ==============================================================================
# 4. Access Instruction Security Tests
# ==============================================================================


def test_accepted_tester_can_retrieve_private_access_instructions(test_client: TestClient, db_session: Session):
    """Accepted tester retrieves confidential product instructions."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session,
        startup,
        "Secret App",
        f"secret-{uuid.uuid4().hex[:6]}",
        access_instructions="DOWNLOAD_KEY_CONFIDENTIAL_12345",
        product_url="https://app.secret.com",
    )

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    # Founder accepts tester
    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    # Tester requests access instructions
    authenticate_client(test_client, tester)
    res = test_client.get(f"/api/campaigns/{campaign.id}/access")
    assert res.status_code == 200
    data = res.json()
    assert data["campaign_id"] == str(campaign.id)
    assert data["title"] == "Secret App"
    assert data["access_instructions"] == "DOWNLOAD_KEY_CONFIDENTIAL_12345"
    assert data["product_url"] == "https://app.secret.com"


def test_pending_tester_cannot_retrieve_access_instructions(test_client: TestClient, db_session: Session):
    """Pending tester is forbidden from retrieving access instructions (403 Forbidden)."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Secret App", f"secret-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})

    # Tester tries to get access while still pending
    res = test_client.get(f"/api/campaigns/{campaign.id}/access")
    assert res.status_code == 403
    assert "exclusively to accepted testers" in res.json()["detail"].lower()


def test_rejected_tester_cannot_retrieve_access_instructions(test_client: TestClient, db_session: Session):
    """Rejected tester is forbidden from retrieving access instructions (403 Forbidden)."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Secret App", f"secret-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    # Founder rejects tester
    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/reject")

    # Rejected tester tries to get access
    authenticate_client(test_client, tester)
    res = test_client.get(f"/api/campaigns/{campaign.id}/access")
    assert res.status_code == 403
    assert "exclusively to accepted testers" in res.json()["detail"].lower()


def test_non_applicant_tester_cannot_retrieve_access_instructions(test_client: TestClient, db_session: Session):
    """Non-applicant tester receives 403 Forbidden on access endpoint."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Secret App", f"secret-{uuid.uuid4().hex[:6]}")

    non_applicant = seed_tester_with_profile(db_session, "Bob QA", f"bob_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, non_applicant)

    res = test_client.get(f"/api/campaigns/{campaign.id}/access")
    assert res.status_code == 403


def test_tester_accepted_for_one_campaign_cannot_access_another_campaign(test_client: TestClient, db_session: Session):
    """Tester accepted for Campaign A receives 403 for Campaign B."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    camp_a = seed_test_campaign(db_session, startup, "Camp A", f"ca-{uuid.uuid4().hex[:6]}")
    camp_b = seed_test_campaign(db_session, startup, "Camp B", f"cb-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_a = test_client.post(f"/api/campaigns/{camp_a.id}/applications", json={"screening_answers": {}}).json()["id"]

    # Founder accepts tester for Camp A
    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_a}/accept")

    # Tester requests Camp B
    authenticate_client(test_client, tester)
    res_b = test_client.get(f"/api/campaigns/{camp_b.id}/access")
    assert res_b.status_code == 403

    # But tester can access Camp A
    res_a = test_client.get(f"/api/campaigns/{camp_a.id}/access")
    assert res_a.status_code == 200


def test_public_and_general_application_endpoints_never_leak_instructions(test_client: TestClient, db_session: Session):
    """Verify that public endpoints and general application listings never contain access instructions."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    secret_key = "HIGHLY_CONFIDENTIAL_KEY_12345"
    campaign = seed_test_campaign(
        db_session,
        startup,
        "Secret App",
        f"secret-{uuid.uuid4().hex[:6]}",
        access_instructions=secret_key,
    )

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})

    # 1. Public discovery feed
    pub_res = test_client.get("/api/public/campaigns")
    assert pub_res.status_code == 200
    assert secret_key not in pub_res.text

    # 2. Public campaign details
    detail_res = test_client.get(f"/api/campaigns/public/{startup.slug}/{campaign.slug}")
    assert detail_res.status_code == 200
    assert secret_key not in detail_res.text

    # 3. Tester application list
    my_apps_res = test_client.get("/api/applications/me")
    assert my_apps_res.status_code == 200
    assert secret_key not in my_apps_res.text
