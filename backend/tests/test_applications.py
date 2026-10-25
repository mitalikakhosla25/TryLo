"""Automated Tests for TryLo Phase 2B.3B: Tester Application Submission & Screening."""

import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.application import (
    APPLICATION_STATUS_PENDING,
    CampaignApplication,
)
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_ARCHIVED,
    CAMPAIGN_STATUS_CLOSED,
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_PUBLISHED,
    REWARD_TYPE_MONETARY,
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
            bio="Experienced QA engineer specialized in SaaS and Web apps.",
            skills=["UI Testing", "API Testing", "Bug Reporting"],
            interests=["SaaS", "Developer Tools", "AI"],
            experience_level="Intermediate",
            devices=["Desktop / Mac", "iPhone"],
            city="Berlin",
            country="Germany",
        )
    else:
        profile = TesterProfileModel(
            user_id=tester.id,
            bio="",  # Missing required bio for completeness
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
    application_deadline: datetime = None,
    max_testers: int = 5,
) -> Campaign:
    """Helper to seed a campaign with configurable screening questions."""
    now = datetime.now(timezone.utc)
    pub_at = (now - timedelta(days=1)) if status == CAMPAIGN_STATUS_PUBLISHED else None

    campaign = Campaign(
        startup_id=startup.id,
        title=title,
        slug=slug,
        summary=f"Summary for {title}",
        description=f"Detailed description for {title}.",
        product_type="Web App",
        product_url="https://product.example.com",
        access_instructions="TOP SECRET PROPRIETARY INSTRUCTIONS - NEVER EXPOSE",
        testing_tasks=[{"id": "t1", "title": "Test login", "is_required": True, "order": 1}],
        target_audience={
            "experience_level": "Beginner",
            "devices": ["Web"],
            "countries": ["USA"],
        },
        reward_type=REWARD_TYPE_MONETARY,
        reward_amount=50.0,
        reward_currency="USD",
        screening_questions=screening_questions or [],
        status=status,
        max_testers=max_testers,
        published_at=pub_at,
        application_deadline=application_deadline,
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


SAMPLE_SCREENING_QUESTIONS = [
    {
        "id": "q1",
        "prompt": "How many years of beta testing experience do you have?",
        "question_type": "single_choice",
        "is_required": True,
        "options": ["< 1 year", "1-3 years", "3+ years"],
    },
    {
        "id": "q2",
        "prompt": "Do you own an iOS device running iOS 17+?",
        "question_type": "boolean",
        "is_required": True,
        "options": [],
    },
    {
        "id": "q3",
        "prompt": "Briefly describe your familiarity with productivity tools.",
        "question_type": "text",
        "is_required": False,
        "options": [],
    },
]


def test_valid_tester_can_apply_to_published_campaign(test_client: TestClient, db_session: Session):
    """A valid tester with a complete profile can apply with screening answers and motivation."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}",
        screening_questions=SAMPLE_SCREENING_QUESTIONS,
    )

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    payload = {
        "screening_answers": {
            "q1": "1-3 years",
            "q2": True,
            "q3": "I use Notion, Linear, and Slack every day.",
        },
        "motivation": "I love testing productivity software and giving detailed feedback.",
    }

    res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["campaign_id"] == str(campaign.id)
    assert data["tester_id"] == str(tester.id)
    assert data["status"] == "pending"
    assert data["motivation"] == payload["motivation"]
    assert data["screening_answers"]["q1"] == "1-3 years"
    assert data["screening_answers"]["q2"] is True
    assert "access_instructions" not in data
    assert "access_instructions" not in res.text


def test_duplicate_application_rejected(test_client: TestClient, db_session: Session):
    """Applying twice to the same campaign returns 409 Conflict."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    payload = {"screening_answers": {}, "motivation": "First submission"}
    res1 = test_client.post(f"/api/campaigns/{campaign.id}/applications", json=payload)
    assert res1.status_code == 201

    # Second submission
    res2 = test_client.post(f"/api/campaigns/{campaign.id}/applications", json=payload)
    assert res2.status_code == 409
    assert "already submitted" in res2.json()["detail"].lower()


def test_two_different_testers_can_apply_to_same_campaign(test_client: TestClient, db_session: Session):
    """Multiple distinct testers can each submit applications to the same published campaign."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}")

    tester_a = seed_tester_with_profile(db_session, "Tester A", f"ta_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    tester_b = seed_tester_with_profile(db_session, "Tester B", f"tb_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)

    authenticate_client(test_client, tester_a)
    res_a = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res_a.status_code == 201

    authenticate_client(test_client, tester_b)
    res_b = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res_b.status_code == 201


def test_unauthenticated_user_cannot_apply(test_client: TestClient, db_session: Session):
    """Unauthenticated requests to submit applications return 401."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}")

    test_client.cookies.clear()
    res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res.status_code == 401


def test_founder_cannot_apply_as_tester(test_client: TestClient, db_session: Session):
    """Founders cannot call tester application submission endpoints (returns 403)."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}")

    authenticate_client(test_client, founder)
    res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res.status_code == 403


def test_incomplete_tester_profile_rejected(test_client: TestClient, db_session: Session):
    """Testers who have not completed onboarding profile are rejected with 403."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}")

    incomplete_tester = seed_tester_with_profile(
        db_session, "Incomplete Tester", f"inc_{uuid.uuid4().hex[:6]}@example.com", is_complete=False
    )
    authenticate_client(test_client, incomplete_tester)

    res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res.status_code == 403
    assert "onboarding profile" in res.json()["detail"].lower()


def test_draft_closed_archived_campaigns_reject_applications(test_client: TestClient, db_session: Session):
    """Non-published campaigns reject applications with 400."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")

    c_draft = seed_test_campaign(db_session, startup, "Draft Camp", f"draft-{uuid.uuid4().hex[:6]}", status=CAMPAIGN_STATUS_DRAFT)
    c_closed = seed_test_campaign(db_session, startup, "Closed Camp", f"closed-{uuid.uuid4().hex[:6]}", status=CAMPAIGN_STATUS_CLOSED)
    c_archived = seed_test_campaign(db_session, startup, "Archived Camp", f"arch-{uuid.uuid4().hex[:6]}", status=CAMPAIGN_STATUS_ARCHIVED)

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    res_draft = test_client.post(f"/api/campaigns/{c_draft.id}/applications", json={"screening_answers": {}})
    assert res_draft.status_code == 400
    assert "draft" in res_draft.json()["detail"].lower()

    res_closed = test_client.post(f"/api/campaigns/{c_closed.id}/applications", json={"screening_answers": {}})
    assert res_closed.status_code == 400
    assert "closed" in res_closed.json()["detail"].lower()

    res_archived = test_client.post(f"/api/campaigns/{c_archived.id}/applications", json={"screening_answers": {}})
    assert res_archived.status_code == 400
    assert "archived" in res_archived.json()["detail"].lower()


def test_expired_deadline_rejects_applications(test_client: TestClient, db_session: Session):
    """Campaigns with expired application deadlines reject new applications with 400."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    expired_time = datetime.now(timezone.utc) - timedelta(days=2)
    campaign = seed_test_campaign(
        db_session, startup, "Expired Camp", f"exp-{uuid.uuid4().hex[:6]}",
        application_deadline=expired_time,
    )

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res.status_code == 400
    assert "deadline" in res.json()["detail"].lower()


def test_campaign_without_screening_questions_accepts_application(test_client: TestClient, db_session: Session):
    """A campaign with no screening questions accepts valid empty screening_answers."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "No Questions", f"nq-{uuid.uuid4().hex[:6]}", screening_questions=[])

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res.status_code == 201
    assert res.json()["screening_answers"] == {}


def test_required_screening_answers_enforced(test_client: TestClient, db_session: Session):
    """Missing answers for required screening questions return 400."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Screened Camp", f"sc-{uuid.uuid4().hex[:6]}",
        screening_questions=SAMPLE_SCREENING_QUESTIONS,
    )

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    # Missing q1 and q2 (both required)
    res = test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q3": "Only optional answered"}},
    )
    assert res.status_code == 400
    assert "required" in res.json()["detail"].lower()


def test_invalid_choice_option_rejected(test_client: TestClient, db_session: Session):
    """Providing a choice not in the configured options list returns 400."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Screened Camp", f"sc-{uuid.uuid4().hex[:6]}",
        screening_questions=SAMPLE_SCREENING_QUESTIONS,
    )

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    res = test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q1": "100 years", "q2": True}},
    )
    assert res.status_code == 400
    assert "must be one of the configured choices" in res.json()["detail"].lower()


def test_invalid_question_id_rejected(test_client: TestClient, db_session: Session):
    """Providing an answer for a question ID not configured returns 400."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Screened Camp", f"sc-{uuid.uuid4().hex[:6]}",
        screening_questions=SAMPLE_SCREENING_QUESTIONS,
    )

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    res = test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q1": "1-3 years", "q2": True, "fake_question_99": "Malicious"}},
    )
    assert res.status_code == 400
    assert "invalid screening question id" in res.json()["detail"].lower()


def test_oversized_text_and_script_injection_rejected(test_client: TestClient, db_session: Session):
    """Text answer exceeding 2000 chars or containing script tags is rejected."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(
        db_session, startup, "Screened Camp", f"sc-{uuid.uuid4().hex[:6]}",
        screening_questions=SAMPLE_SCREENING_QUESTIONS,
    )

    tester = seed_tester_with_profile(db_session, "Tom Tester", f"tom_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    # 1. Script tag injection
    res_script = test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q1": "1-3 years", "q2": True, "q3": "<script>alert(1)</script>"}},
    )
    assert res_script.status_code == 400
    assert "script" in res_script.json()["detail"].lower()

    # 2. Oversized answer > 2000 chars
    res_large = test_client.post(
        f"/api/campaigns/{campaign.id}/applications",
        json={"screening_answers": {"q1": "1-3 years", "q2": True, "q3": "A" * 2001}},
    )
    assert res_large.status_code == 400
    assert "maximum allowed length" in res_large.json()["detail"].lower()


def test_capacity_semantics_pending_applications_do_not_block_new_ones(test_client: TestClient, db_session: Session):
    """
    max_testers represents the target quota of accepted testers (Phase 2B.3C).
    Pending applications must not prematurely block subsequent testers from applying.
    """
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    # Capacity set to 1
    campaign = seed_test_campaign(db_session, startup, "Nova Beta", f"nova-beta-{uuid.uuid4().hex[:6]}", max_testers=1)

    tester_1 = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    tester_2 = seed_tester_with_profile(db_session, "Tester 2", f"t2_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)

    authenticate_client(test_client, tester_1)
    res1 = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res1.status_code == 201

    authenticate_client(test_client, tester_2)
    res2 = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    assert res2.status_code == 201  # Successfully submitted pending application


def test_tester_can_list_only_their_own_applications(test_client: TestClient, db_session: Session):
    """GET /api/applications/me returns only the authenticated tester's applications."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    camp_a = seed_test_campaign(db_session, startup, "Camp A", f"camp-a-{uuid.uuid4().hex[:6]}")
    camp_b = seed_test_campaign(db_session, startup, "Camp B", f"camp-b-{uuid.uuid4().hex[:6]}")

    tester_1 = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    tester_2 = seed_tester_with_profile(db_session, "Tester 2", f"t2_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)

    # Tester 1 applies to Camp A
    authenticate_client(test_client, tester_1)
    test_client.post(f"/api/campaigns/{camp_a.id}/applications", json={"screening_answers": {}})

    # Tester 2 applies to Camp B
    authenticate_client(test_client, tester_2)
    test_client.post(f"/api/campaigns/{camp_b.id}/applications", json={"screening_answers": {}})

    # Tester 1 lists applications
    authenticate_client(test_client, tester_1)
    res1 = test_client.get("/api/applications/me")
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1) == 1
    assert data1[0]["campaign_title"] == "Camp A"
    assert data1[0]["startup_name"] == "Nova Cloud"
    assert "access_instructions" not in data1[0]

    # Tester 2 lists applications
    authenticate_client(test_client, tester_2)
    res2 = test_client.get("/api/applications/me")
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2) == 1
    assert data2[0]["campaign_title"] == "Camp B"


def test_tester_can_retrieve_own_application_by_id(test_client: TestClient, db_session: Session):
    """GET /api/applications/{id} allows tester to view their own application."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Camp A", f"camp-a-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)
    create_res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    app_id = create_res.json()["id"]

    res = test_client.get(f"/api/applications/{app_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == app_id
    assert data["campaign_title"] == "Camp A"
    assert data["status"] == "pending"
    assert "access_instructions" not in data


def test_tester_cannot_retrieve_another_testers_application(test_client: TestClient, db_session: Session):
    """GET /api/applications/{id} returns 404 for another tester's application (no leakage)."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Camp A", f"camp-a-{uuid.uuid4().hex[:6]}")

    tester_1 = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    tester_2 = seed_tester_with_profile(db_session, "Tester 2", f"t2_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)

    authenticate_client(test_client, tester_1)
    create_res = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})
    app_id = create_res.json()["id"]

    # Tester 2 tries to fetch Tester 1's application
    authenticate_client(test_client, tester_2)
    res = test_client.get(f"/api/applications/{app_id}")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_check_application_status_endpoint(test_client: TestClient, db_session: Session):
    """GET /api/campaigns/{campaign_id}/application-status correctly reports application presence."""
    founder = seed_test_user(db_session, "Founder Frank", f"frank_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Nova Cloud", f"nova-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Camp A", f"camp-a-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com", is_complete=True)
    authenticate_client(test_client, tester)

    # Before applying
    res_before = test_client.get(f"/api/campaigns/{campaign.id}/application-status")
    assert res_before.status_code == 200
    assert res_before.json()["applied"] is False
    assert res_before.json()["application"] is None

    # Apply
    test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})

    # After applying
    res_after = test_client.get(f"/api/campaigns/{campaign.id}/application-status")
    assert res_after.status_code == 200
    assert res_after.json()["applied"] is True
    assert res_after.json()["application"] is not None
    assert res_after.json()["application"]["status"] == "pending"
