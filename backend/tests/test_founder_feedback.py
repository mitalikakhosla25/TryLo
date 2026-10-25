"""Automated Tests for TryLo Phase 2C.2: Founder Feedback Review & Issue Management."""

import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.application import (
    CampaignApplication,
    APPLICATION_STATUS_ACCEPTED,
)
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_PUBLISHED,
)
from app.models.profile import FounderProfile, TesterProfile
from app.models.startup import Startup
from app.models.user import User
from app.models.feedback import (
    FeedbackSubmission,
    FeedbackInternalNote,
    FeedbackStatusHistory,
    FEEDBACK_STATUS_SUBMITTED,
    FEEDBACK_STATUS_IN_REVIEW,
    FEEDBACK_STATUS_NEEDS_RETEST,
    FEEDBACK_STATUS_RESOLVED,
    FEEDBACK_TYPE_BUG,
    FEEDBACK_TYPE_GENERAL,
)

TesterProfile.__test__ = False


def seed_user(db: Session, full_name: str, email: str, role: str) -> User:
    """Helper to seed an active user."""
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


def seed_founder(db: Session, full_name: str, email: str) -> User:
    """Helper to seed founder user with completed founder profile."""
    founder = seed_user(db, full_name, email, "founder")
    prof = FounderProfile(
        user_id=founder.id,
        startup_name="Tech Co",
        startup_description="Building great tools",
        company_stage="MVP",
        industry="SaaS",
    )
    db.add(prof)
    db.commit()
    db.refresh(founder)
    return founder


def seed_tester(db: Session, full_name: str, email: str) -> User:
    """Helper to seed tester user with completed tester profile."""
    tester = seed_user(db, full_name, email, "tester")
    prof = TesterProfile(
        user_id=tester.id,
        bio="Senior QA engineer",
        skills=["Bug hunting", "Usability"],
        interests=["SaaS", "DevTools"],
        experience_level="Advanced",
        devices=["Mac", "Android"],
        city="San Francisco",
        country="USA",
    )
    db.add(prof)
    db.commit()
    db.refresh(tester)
    return tester


def seed_startup_and_campaign(
    db: Session,
    founder: User,
    startup_name: str = "AlphaCorp",
    campaign_title: str = "Alpha Beta Test",
) -> tuple[Startup, Campaign]:
    """Helper to seed startup and published campaign."""
    startup = Startup(
        owner_id=founder.id,
        name=startup_name,
        slug=f"{startup_name.lower()}-{uuid.uuid4().hex[:6]}",
        tagline="Disrupting testing",
        company_stage="MVP",
    )
    db.add(startup)
    db.commit()
    db.refresh(startup)

    campaign = Campaign(
        startup_id=startup.id,
        title=campaign_title,
        slug=f"{campaign_title.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}",
        summary="Test our beta release",
        description="Detailed testing description",
        product_type="Web App",
        product_url="https://alpha.example.com",
        access_instructions="TOP SECRET FOUNDER ACCESS CODE: XYZ999",
        testing_tasks=[
            {
                "id": "task_signup_flow",
                "title": "Test User Registration Flow",
                "description": "Create an account using email verification.",
                "expected_outcome": "User lands on welcome dashboard.",
                "is_required": True,
                "order": 1,
            },
            {
                "id": "task_dashboard_widget",
                "title": "Configure Dashboard Widget",
                "description": "Add 3 metric widgets to the main view.",
                "expected_outcome": "Widgets persist upon reload.",
                "is_required": True,
                "order": 2,
            },
        ],
        status=CAMPAIGN_STATUS_PUBLISHED,
        max_testers=10,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return startup, campaign


def seed_accepted_tester(db: Session, campaign: Campaign, tester: User) -> CampaignApplication:
    """Helper to accept a tester into a campaign."""
    app = CampaignApplication(
        campaign_id=campaign.id,
        tester_id=tester.id,
        status=APPLICATION_STATUS_ACCEPTED,
        motivation="Excited to help test!",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def seed_feedback(
    db: Session,
    campaign: Campaign,
    tester: User,
    title: str = "Login button unresponsive on Firefox",
    feedback_type: str = FEEDBACK_TYPE_BUG,
    severity: str = "high",
    status: str = FEEDBACK_STATUS_SUBMITTED,
    task_id: str = "task_signup_flow",
) -> FeedbackSubmission:
    """Helper to seed a feedback submission."""
    sub = FeedbackSubmission(
        id=uuid.uuid4(),
        campaign_id=campaign.id,
        tester_id=tester.id,
        task_id=task_id,
        feedback_type=feedback_type,
        title=title,
        description="Clicking submit does nothing when Firefox tracking protection is enabled.",
        expected_behavior="Form should submit and show loading spinner.",
        actual_behavior="Nothing happens, console shows CSP error.",
        reproduction_steps="1. Open Firefox in Private Mode\n2. Fill login form\n3. Click Login",
        severity=severity,
        status=status,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def auth_headers(user: User) -> dict:
    """Generates bearer authorization header for a user."""
    token = create_access_token(user_id=user.id, role=user.role)
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Ownership & Authorization Tests
# ==============================================================================


def test_founder_can_list_feedback_for_owned_campaigns(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Alice Founder", "alice@example.com")
    tester = seed_tester(db_session, "Bob Tester", "bob@example.com")
    startup, campaign = seed_startup_and_campaign(db_session, founder)
    seed_accepted_tester(db_session, campaign, tester)
    seed_feedback(db_session, campaign, tester, title="Bug 1")
    seed_feedback(db_session, campaign, tester, title="Bug 2")

    res = test_client.get("/api/founder/feedback", headers=auth_headers(founder))
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    titles = [item["title"] for item in data["items"]]
    assert "Bug 1" in titles
    assert "Bug 2" in titles
    assert data["items"][0]["tester_name"] == "Bob Tester"
    assert data["items"][0]["tester_experience_level"] == "Advanced"


def test_founder_cannot_list_feedback_for_other_founders_campaigns(test_client: TestClient, db_session: Session):
    founder1 = seed_founder(db_session, "Founder One", "f1@example.com")
    founder2 = seed_founder(db_session, "Founder Two", "f2@example.com")
    tester = seed_tester(db_session, "Tester Charlie", "charlie@example.com")

    # Founder 1's campaign with feedback
    _, camp1 = seed_startup_and_campaign(db_session, founder1, startup_name="Start1")
    seed_accepted_tester(db_session, camp1, tester)
    seed_feedback(db_session, camp1, tester, title="Feedback for Start1")

    # Founder 2's campaign with feedback
    _, camp2 = seed_startup_and_campaign(db_session, founder2, startup_name="Start2")
    seed_accepted_tester(db_session, camp2, tester)
    seed_feedback(db_session, camp2, tester, title="Feedback for Start2")

    # Founder 1 queries: should only see Start1 feedback
    res1 = test_client.get("/api/founder/feedback", headers=auth_headers(founder1))
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total"] == 1
    assert data1["items"][0]["title"] == "Feedback for Start1"

    # Founder 2 queries: should only see Start2 feedback
    res2 = test_client.get("/api/founder/feedback", headers=auth_headers(founder2))
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total"] == 1
    assert data2["items"][0]["title"] == "Feedback for Start2"


def test_founder_can_retrieve_details_for_owned_feedback(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Alice Founder", "alice_detail@example.com")
    tester = seed_tester(db_session, "Bob Tester", "bob_detail@example.com")
    _, campaign = seed_startup_and_campaign(db_session, founder)
    seed_accepted_tester(db_session, campaign, tester)
    sub = seed_feedback(db_session, campaign, tester, title="Reproduction detailed bug")

    res = test_client.get(f"/api/founder/feedback/{sub.id}", headers=auth_headers(founder))
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(sub.id)
    assert data["title"] == "Reproduction detailed bug"
    assert data["task_title"] == "Test User Registration Flow"
    assert data["task_description"] == "Create an account using email verification."
    assert data["task_expected_outcome"] == "User lands on welcome dashboard."
    assert "access_instructions" not in data  # Never leaked!


def test_founder_cannot_retrieve_other_founders_feedback(test_client: TestClient, db_session: Session):
    founder1 = seed_founder(db_session, "F1", "f1_priv@example.com")
    founder2 = seed_founder(db_session, "F2", "f2_priv@example.com")
    tester = seed_tester(db_session, "Tester Dave", "dave@example.com")

    _, camp1 = seed_startup_and_campaign(db_session, founder1)
    seed_accepted_tester(db_session, camp1, tester)
    sub1 = seed_feedback(db_session, camp1, tester)

    # Founder 2 attempts to fetch sub1
    res = test_client.get(f"/api/founder/feedback/{sub1.id}", headers=auth_headers(founder2))
    assert res.status_code == 404
    assert res.json()["detail"] == "Feedback submission not found."


def test_testers_and_anonymous_rejected_from_founder_review_endpoints(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "F", "f_sec@example.com")
    tester = seed_tester(db_session, "T", "t_sec@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester)

    # Anonymous
    assert test_client.get("/api/founder/feedback").status_code == 401
    assert test_client.get(f"/api/founder/feedback/{sub.id}").status_code == 401
    assert test_client.patch(f"/api/founder/feedback/{sub.id}/status", json={"status": "in_review"}).status_code == 401
    assert test_client.post(f"/api/founder/feedback/{sub.id}/notes", json={"body": "note"}).status_code == 401

    # Tester role
    assert test_client.get("/api/founder/feedback", headers=auth_headers(tester)).status_code == 403
    assert test_client.get(f"/api/founder/feedback/{sub.id}", headers=auth_headers(tester)).status_code == 403
    assert test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(tester),
        json={"status": "in_review"},
    ).status_code == 403
    assert test_client.post(
        f"/api/founder/feedback/{sub.id}/notes",
        headers=auth_headers(tester),
        json={"body": "note"},
    ).status_code == 403


# ==============================================================================
# 2. Status Transition State Machine Tests
# ==============================================================================


def test_status_transition_submitted_to_in_review(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Status", "f_status1@example.com")
    tester = seed_tester(db_session, "Tester Status", "t_status1@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester, status=FEEDBACK_STATUS_SUBMITTED)

    res = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "in_review", "reason": "Founder started investigation"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "in_review"
    assert len(data["status_history"]) == 1
    assert data["status_history"][0]["previous_status"] == "submitted"
    assert data["status_history"][0]["new_status"] == "in_review"
    assert data["status_history"][0]["reason"] == "Founder started investigation"


def test_status_transition_submitted_to_resolved(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Status", "f_status2@example.com")
    tester = seed_tester(db_session, "Tester Status", "t_status2@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester, status=FEEDBACK_STATUS_SUBMITTED)

    res = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "resolved", "resolution_notes": "Known issue, already patched in main branch."},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "resolved"
    assert data["resolution_notes"] == "Known issue, already patched in main branch."
    assert data["status_history"][0]["new_status"] == "resolved"


def test_status_transition_in_review_to_needs_retest(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Status", "f_status3@example.com")
    tester = seed_tester(db_session, "Tester Status", "t_status3@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester, status=FEEDBACK_STATUS_IN_REVIEW)

    res = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={
            "status": "needs_retest",
            "retest_instructions": "Please reload staging server v1.2 and confirm button works.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_retest"
    assert data["retest_instructions"] == "Please reload staging server v1.2 and confirm button works."
    assert data["status_history"][0]["new_status"] == "needs_retest"


def test_status_transition_needs_retest_to_in_review_and_resolved(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Status", "f_status4@example.com")
    tester = seed_tester(db_session, "Tester Status", "t_status4@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester, status=FEEDBACK_STATUS_NEEDS_RETEST)

    # 1. needs_retest -> in_review
    res1 = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "in_review", "reason": "Tester provided follow-up details"},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "in_review"

    # 2. in_review -> resolved
    res2 = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "resolved", "resolution_notes": "Fix confirmed."},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "resolved"
    assert len(data2["status_history"]) == 2


def test_resolved_feedback_can_be_reopened_only_to_in_review(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Status", "f_status5@example.com")
    tester = seed_tester(db_session, "Tester Status", "t_status5@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester, status=FEEDBACK_STATUS_RESOLVED)

    # Reopen to in_review is allowed
    res_reopen = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "in_review", "reason": "Issue reproduced again by another tester"},
    )
    assert res_reopen.status_code == 200
    assert res_reopen.json()["status"] == "in_review"

    # Now resolve again
    test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "resolved"},
    )

    # Attempt invalid transition from resolved to needs_retest (should fail 400)
    res_invalid = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "needs_retest"},
    )
    assert res_invalid.status_code == 400
    assert "Invalid status transition" in res_invalid.json()["detail"]


def test_invalid_status_transitions_rejected(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Status", "f_status6@example.com")
    tester = seed_tester(db_session, "Tester Status", "t_status6@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester, status=FEEDBACK_STATUS_SUBMITTED)

    # Invalid target status value
    res_bogus = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={"status": "bogus_status"},
    )
    assert res_bogus.status_code == 422


# ==============================================================================
# 3. Internal Notes & Audit History Tests
# ==============================================================================


def test_founder_can_add_internal_note_and_empty_note_rejected(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Note", "f_note@example.com")
    tester = seed_tester(db_session, "Tester Note", "t_note@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    sub = seed_feedback(db_session, camp, tester)

    # Valid note
    res = test_client.post(
        f"/api/founder/feedback/{sub.id}/notes",
        headers=auth_headers(founder),
        json={"body": "Internal team discussion: verified this is related to WebKit CSP policy."},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["body"] == "Internal team discussion: verified this is related to WebKit CSP policy."
    assert data["author_name"] == "Founder Note"
    assert data["author_id"] == str(founder.id)

    # Empty note rejected
    res_empty = test_client.post(
        f"/api/founder/feedback/{sub.id}/notes",
        headers=auth_headers(founder),
        json={"body": "   "},
    )
    assert res_empty.status_code == 422


def test_internal_notes_never_exposed_to_testers(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Note", "f_note_priv@example.com")
    tester = seed_tester(db_session, "Tester Note", "t_note_priv@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    seed_accepted_tester(db_session, camp, tester)
    sub = seed_feedback(db_session, camp, tester)

    # Founder adds internal note
    test_client.post(
        f"/api/founder/feedback/{sub.id}/notes",
        headers=auth_headers(founder),
        json={"body": "CONFIDENTIAL: Do not reveal backend architecture to tester."},
    )

    # Tester retrieves their own feedback via /api/feedback/{id}
    res_detail = test_client.get(f"/api/feedback/{sub.id}", headers=auth_headers(tester))
    assert res_detail.status_code == 200
    data_detail = res_detail.json()
    assert "internal_notes" not in data_detail
    assert "status_history" not in data_detail
    assert "CONFIDENTIAL" not in str(data_detail)

    # Tester lists feedback via /api/feedback/me
    res_list = test_client.get("/api/feedback/me", headers=auth_headers(tester))
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert "CONFIDENTIAL" not in str(data_list)


def test_other_founder_cannot_add_or_view_notes(test_client: TestClient, db_session: Session):
    founder1 = seed_founder(db_session, "F1", "f1_note@example.com")
    founder2 = seed_founder(db_session, "F2", "f2_note@example.com")
    tester = seed_tester(db_session, "T", "t_fnote@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder1)
    sub = seed_feedback(db_session, camp, tester)

    # Founder 2 attempts to post note on Founder 1's feedback
    res = test_client.post(
        f"/api/founder/feedback/{sub.id}/notes",
        headers=auth_headers(founder2),
        json={"body": "Malicious intrusion note"},
    )
    assert res.status_code == 404


# ==============================================================================
# 4. Retesting & Tester Visibility Tests
# ==============================================================================


def test_retest_request_visible_to_authoring_tester(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Retest", "f_retest@example.com")
    tester = seed_tester(db_session, "Tester Retest", "t_retest@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    seed_accepted_tester(db_session, camp, tester)
    sub = seed_feedback(db_session, camp, tester)

    # Founder requests retest
    res_status = test_client.patch(
        f"/api/founder/feedback/{sub.id}/status",
        headers=auth_headers(founder),
        json={
            "status": "needs_retest",
            "retest_instructions": "Please repeat step 3 with Firefox 120 and see if CSP alert appears.",
        },
    )
    assert res_status.status_code == 200

    # Tester fetches their feedback detail
    res_tester = test_client.get(f"/api/feedback/{sub.id}", headers=auth_headers(tester))
    assert res_tester.status_code == 200
    t_data = res_tester.json()
    assert t_data["status"] == "needs_retest"
    assert t_data["retest_instructions"] == "Please repeat step 3 with Firefox 120 and see if CSP alert appears."

    # Tester lists their feedback
    res_tester_list = test_client.get("/api/feedback/me", headers=auth_headers(tester))
    assert res_tester_list.status_code == 200
    items = res_tester_list.json()["items"]
    assert items[0]["status"] == "needs_retest"
    assert items[0]["retest_instructions"] == "Please repeat step 3 with Firefox 120 and see if CSP alert appears."


def test_other_testers_cannot_view_feedback_or_retest_instructions(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Retest", "f_iso@example.com")
    tester1 = seed_tester(db_session, "Tester One", "t1_iso@example.com")
    tester2 = seed_tester(db_session, "Tester Two", "t2_iso@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder)
    seed_accepted_tester(db_session, camp, tester1)
    seed_accepted_tester(db_session, camp, tester2)

    sub = seed_feedback(db_session, camp, tester1, title="Tester 1 Bug")

    # Tester 2 tries to fetch Tester 1's feedback
    res = test_client.get(f"/api/feedback/{sub.id}", headers=auth_headers(tester2))
    assert res.status_code == 404

    # Tester 2 lists /api/feedback/me
    res_list = test_client.get("/api/feedback/me", headers=auth_headers(tester2))
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 0


def test_founder_filtering_sorting_and_search(test_client: TestClient, db_session: Session):
    founder = seed_founder(db_session, "Founder Filter", "f_filt@example.com")
    tester = seed_tester(db_session, "Tester Filter", "t_filt@example.com")
    _, camp = seed_startup_and_campaign(db_session, founder, campaign_title="Mobile UI")
    seed_accepted_tester(db_session, camp, tester)

    sub1 = seed_feedback(db_session, camp, tester, title="Crash on checkout", severity="critical", status="submitted")
    sub2 = seed_feedback(db_session, camp, tester, title="Minor alignment flaw", severity="low", status="in_review")
    sub3 = seed_feedback(db_session, camp, tester, title="Great onboarding text", feedback_type=FEEDBACK_TYPE_GENERAL, severity=None, status="resolved")

    # Filter by status: resolved
    res_res = test_client.get("/api/founder/feedback?status=resolved", headers=auth_headers(founder))
    assert res_res.status_code == 200
    assert res_res.json()["total"] == 1
    assert res_res.json()["items"][0]["title"] == "Great onboarding text"

    # Filter by severity: critical
    res_sev = test_client.get("/api/founder/feedback?severity=critical", headers=auth_headers(founder))
    assert res_sev.status_code == 200
    assert res_sev.json()["total"] == 1
    assert res_sev.json()["items"][0]["title"] == "Crash on checkout"

    # Filter by feedback_type: general_feedback
    res_gen = test_client.get("/api/founder/feedback?feedback_type=general_feedback", headers=auth_headers(founder))
    assert res_gen.status_code == 200
    assert res_gen.json()["total"] == 1

    # Search by query
    res_search = test_client.get("/api/founder/feedback?search=alignment", headers=auth_headers(founder))
    assert res_search.status_code == 200
    assert res_search.json()["total"] == 1
    assert res_search.json()["items"][0]["title"] == "Minor alignment flaw"
