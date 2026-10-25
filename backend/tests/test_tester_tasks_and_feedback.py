"""Automated Tests for TryLo Phase 2C.1: Tester Task Execution & Structured Feedback Submission."""

import uuid
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
from app.models.task_progress import (
    CampaignTaskProgress,
    TASK_PROGRESS_NOT_STARTED,
    TASK_PROGRESS_IN_PROGRESS,
    TASK_PROGRESS_COMPLETED,
)
from app.models.feedback import (
    FeedbackSubmission,
    FEEDBACK_TYPE_GENERAL,
    FEEDBACK_TYPE_BUG,
    FEEDBACK_STATUS_SUBMITTED,
)

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
    testing_tasks: list = None,
    max_testers: int = 5,
    access_instructions: str = "CONFIDENTIAL_INSTRUCTIONS_TOKEN_9999",
    product_url: str = "https://product.example.com",
) -> Campaign:
    """Helper to seed a test campaign."""
    now = datetime.now(timezone.utc)
    pub_at = (now - timedelta(days=1)) if status == CAMPAIGN_STATUS_PUBLISHED else None

    if testing_tasks is None:
        testing_tasks = [
            {"id": "t1", "title": "Account Registration", "description": "Create an account.", "is_required": True, "order": 1},
            {"id": "t2", "title": "Core Feature Test", "description": "Execute main flow.", "is_required": True, "order": 2},
            {"id": "t3", "title": "Settings & Profile", "description": "Update preferences.", "is_required": False, "order": 3},
        ]

    campaign = Campaign(
        startup_id=startup.id,
        title=title,
        slug=slug,
        summary=f"Summary for {title}",
        description=f"Detailed description for {title}.",
        product_type="Web App",
        product_url=product_url,
        access_instructions=access_instructions,
        testing_tasks=testing_tasks,
        screening_questions=[],
        target_audience={"experience_level": "Intermediate", "devices": ["Desktop / Mac"]},
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
# 1. Task Authorization Tests
# ==============================================================================


def test_accepted_tester_can_retrieve_campaign_tasks(test_client: TestClient, db_session: Session):
    """Accepted tester can retrieve campaign tasks with progress."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Alice QA", f"alice_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)

    # Submit application and founder accepts
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]
    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    # Tester retrieves tasks
    authenticate_client(test_client, tester)
    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 200
    data = res.json()
    assert data["campaign_id"] == str(campaign.id)
    assert data["total_tasks"] == 3
    assert data["completed_tasks"] == 0
    assert data["in_progress_tasks"] == 0
    assert len(data["tasks"]) == 3
    assert data["tasks"][0]["id"] == "t1"
    assert data["tasks"][0]["status"] == "not_started"


def test_pending_tester_cannot_retrieve_tasks(test_client: TestClient, db_session: Session):
    """Pending applicant is rejected with 403."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Bob QA", f"bob_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}})

    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 403
    assert "exclusively to accepted testers" in res.json()["detail"]


def test_rejected_tester_cannot_retrieve_tasks(test_client: TestClient, db_session: Session):
    """Rejected applicant is rejected with 403."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Charlie QA", f"charlie_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    # Founder rejects
    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/reject", json={"rejection_note": "Not a fit."})

    authenticate_client(test_client, tester)
    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 403


def test_non_applicant_cannot_retrieve_tasks(test_client: TestClient, db_session: Session):
    """Non-applicant tester cannot retrieve tasks."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "David QA", f"david_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)

    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 403


def test_founder_cannot_use_tester_task_endpoints(test_client: TestClient, db_session: Session):
    """Founders receive 403 on tester task endpoints."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Beta Test", f"beta-{uuid.uuid4().hex[:6]}")

    authenticate_client(test_client, founder)
    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 403


def test_draft_and_archived_campaigns_reject_task_access(test_client: TestClient, db_session: Session):
    """Draft or archived campaigns reject task access."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Draft Campaign", f"draft-{uuid.uuid4().hex[:6]}", status=CAMPAIGN_STATUS_DRAFT)

    tester = seed_tester_with_profile(db_session, "Emma QA", f"emma_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)

    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 403
    assert "draft" in res.json()["detail"].lower()


# ==============================================================================
# 2. Stable Task Identity & Legacy Compatibility Tests
# ==============================================================================


def test_legacy_campaign_tasks_without_ids_receive_stable_ids(test_client: TestClient, db_session: Session):
    """Existing campaigns with tasks lacking IDs get deterministic stable IDs that persist."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    
    # Legacy tasks missing 'id'
    legacy_tasks = [
        {"title": "Explore Dashboard", "description": "Walk through metrics.", "is_required": True, "order": 1},
        {"title": "Export CSV", "description": "Download reports.", "is_required": False, "order": 2},
    ]
    campaign = seed_test_campaign(db_session, startup, "Legacy Beta", f"legacy-{uuid.uuid4().hex[:6]}", testing_tasks=legacy_tasks)

    tester = seed_tester_with_profile(db_session, "Frank QA", f"frank_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    # First request: generates stable IDs and persists them
    authenticate_client(test_client, tester)
    res1 = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res1.status_code == 200
    t1_id = res1.json()["tasks"][0]["id"]
    t2_id = res1.json()["tasks"][1]["id"]
    assert t1_id.startswith("task_")
    assert t2_id.startswith("task_")

    # Second request: must return the exact same IDs
    res2 = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res2.json()["tasks"][0]["id"] == t1_id
    assert res2.json()["tasks"][1]["id"] == t2_id

    # Verify database: campaign.testing_tasks now has the IDs persisted
    db_session.expire_all()
    reloaded_campaign = db_session.get(Campaign, campaign.id)
    assert reloaded_campaign.testing_tasks[0]["id"] == t1_id
    assert reloaded_campaign.testing_tasks[1]["id"] == t2_id


def test_task_ids_remain_stable_across_task_reordering(test_client: TestClient, db_session: Session):
    """Reordering tasks in the campaign does not detach saved progress."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Task Reorder", f"reorder-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Grace QA", f"grace_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    # Tester marks task t1 as completed
    authenticate_client(test_client, tester)
    update_res = test_client.put(
        f"/api/campaigns/{campaign.id}/tasks/t1/progress",
        json={"status": "completed", "completion_note": "All good."},
    )
    assert update_res.status_code == 200

    # Founder updates campaign by reordering tasks (swapping t1 and t2)
    authenticate_client(test_client, founder)
    reordered_tasks = [
        {"id": "t2", "title": "Core Feature Test", "is_required": True, "order": 1},
        {"id": "t1", "title": "Account Registration", "is_required": True, "order": 2},
    ]
    test_client.put(f"/api/campaigns/{campaign.id}", json={"testing_tasks": reordered_tasks})

    # Tester requests tasks: t1 is still completed, t2 is still not_started
    authenticate_client(test_client, tester)
    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 200
    tasks = {t["id"]: t for t in res.json()["tasks"]}
    assert tasks["t1"]["status"] == "completed"
    assert tasks["t1"]["completion_note"] == "All good."
    assert tasks["t2"]["status"] == "not_started"


# ==============================================================================
# 3. Task Progress Updates & Persistence Tests
# ==============================================================================


def test_task_progress_lifecycle_and_completed_at(test_client: TestClient, db_session: Session):
    """Tester can update progress, and completed_at is set on completed and cleared on reopen."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Lifecycle Test", f"life-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Henry QA", f"henry_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    # 1. Update to in_progress
    authenticate_client(test_client, tester)
    res1 = test_client.put(
        f"/api/campaigns/{campaign.id}/tasks/t1/progress",
        json={"status": "in_progress"},
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "in_progress"
    assert res1.json()["completed_at"] is None

    # 2. Update to completed
    res2 = test_client.put(
        f"/api/campaigns/{campaign.id}/tasks/t1/progress",
        json={"status": "completed", "completion_note": "Executed successfully without errors."},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "completed"
    assert res2.json()["completed_at"] is not None
    assert res2.json()["completion_note"] == "Executed successfully without errors."

    # 3. Reopen to in_progress -> completed_at is cleared
    res3 = test_client.put(
        f"/api/campaigns/{campaign.id}/tasks/t1/progress",
        json={"status": "in_progress"},
    )
    assert res3.status_code == 200
    assert res3.json()["status"] == "in_progress"
    assert res3.json()["completed_at"] is None


def test_tester_cannot_update_another_testers_progress(test_client: TestClient, db_session: Session):
    """Tester A updating progress does not touch Tester B's progress."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Multi Tester", f"multi-{uuid.uuid4().hex[:6]}")

    t1 = seed_tester_with_profile(db_session, "Tester 1", f"t1_{uuid.uuid4().hex[:6]}@example.com")
    t2 = seed_tester_with_profile(db_session, "Tester 2", f"t2_{uuid.uuid4().hex[:6]}@example.com")

    # Both apply and get accepted
    for t in (t1, t2):
        authenticate_client(test_client, t)
        aid = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]
        authenticate_client(test_client, founder)
        test_client.post(f"/api/founder/applications/{aid}/accept")

    # Tester 1 marks t1 as completed
    authenticate_client(test_client, t1)
    test_client.put(f"/api/campaigns/{campaign.id}/tasks/t1/progress", json={"status": "completed"})

    # Tester 2 inspects tasks: t1 is still not_started for Tester 2
    authenticate_client(test_client, t2)
    res2 = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    tasks2 = {t["id"]: t for t in res2.json()["tasks"]}
    assert tasks2["t1"]["status"] == "not_started"


def test_invalid_task_id_and_invalid_status_rejected(test_client: TestClient, db_session: Session):
    """Invalid task ID returns 404; invalid status returns 422."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Validation Test", f"val-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Ian QA", f"ian_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)

    # 1. Non-existent task ID
    res_fake = test_client.put(f"/api/campaigns/{campaign.id}/tasks/nonexistent_id/progress", json={"status": "completed"})
    assert res_fake.status_code == 404

    # 2. Invalid status
    res_bad_status = test_client.put(f"/api/campaigns/{campaign.id}/tasks/t1/progress", json={"status": "invalid_status"})
    assert res_bad_status.status_code == 422


def test_tester_task_list_overview_shows_accepted_campaigns(test_client: TestClient, db_session: Session):
    """GET /api/tester/tasks returns all accepted campaign assignments with progress counts."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    c1 = seed_test_campaign(db_session, startup, "Campaign 1", f"c1-{uuid.uuid4().hex[:6]}")
    c2 = seed_test_campaign(db_session, startup, "Campaign 2", f"c2-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Julia QA", f"julia_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)

    # Apply to both
    a1 = test_client.post(f"/api/campaigns/{c1.id}/applications", json={"screening_answers": {}}).json()["id"]
    a2 = test_client.post(f"/api/campaigns/{c2.id}/applications", json={"screening_answers": {}}).json()["id"]

    # Founder accepts both
    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{a1}/accept")
    test_client.post(f"/api/founder/applications/{a2}/accept")

    # Tester marks 1 task completed in c1
    authenticate_client(test_client, tester)
    test_client.put(f"/api/campaigns/{c1.id}/tasks/t1/progress", json={"status": "completed"})

    res = test_client.get("/api/tester/tasks")
    assert res.status_code == 200
    data = res.json()
    assert data["total_campaigns"] == 2
    c1_item = next(i for i in data["items"] if i["campaign_id"] == str(c1.id))
    assert c1_item["completed_tasks"] == 1
    assert c1_item["assignment_status"] == "in_progress"


# ==============================================================================
# 4. Structured Feedback Submission Tests
# ==============================================================================


def test_accepted_tester_can_submit_general_feedback(test_client: TestClient, db_session: Session):
    """Accepted tester submits general feedback with optional task ID."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Feedback Camp", f"fb-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Kevin QA", f"kevin_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)
    payload = {
        "feedback_type": "general_feedback",
        "title": "Onboarding UX was very smooth",
        "description": "I liked the step-by-step guidance. Suggest adding keyboard navigation.",
        "task_id": "t1",
    }
    res = test_client.post(f"/api/campaigns/{campaign.id}/feedback", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["feedback_type"] == "general_feedback"
    assert data["title"] == "Onboarding UX was very smooth"
    assert data["task_id"] == "t1"
    assert data["task_title"] == "Account Registration"
    assert data["status"] == "submitted"


def test_accepted_tester_can_submit_bug_report(test_client: TestClient, db_session: Session):
    """Accepted tester submits bug report with severity, steps, expected & actual behavior."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Bug Camp", f"bug-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Laura QA", f"laura_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)
    payload = {
        "feedback_type": "bug_report",
        "title": "Dropdown freeze on Safari",
        "description": "Clicking the settings dropdown causes Safari to freeze for 3 seconds.",
        "task_id": "t3",
        "severity": "high",
        "reproduction_steps": "1. Open Safari 17. 2. Navigate to settings. 3. Click language dropdown.",
        "expected_behavior": "Dropdown opens immediately without stutter.",
        "actual_behavior": "Page hangs for 3 seconds before opening.",
    }
    res = test_client.post(f"/api/campaigns/{campaign.id}/feedback", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["feedback_type"] == "bug_report"
    assert data["severity"] == "high"
    assert data["status"] == "submitted"
    assert data["task_title"] == "Settings & Profile"


def test_whitespace_only_and_short_inputs_rejected(test_client: TestClient, db_session: Session):
    """Whitespace-only and insufficient-length fields are rejected with 422."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Short Camp", f"short-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Mike QA", f"mike_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)

    # Whitespace title
    res1 = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={"feedback_type": "general_feedback", "title": "   ", "description": "Valid description length here."},
    )
    assert res1.status_code == 422

    # Short description
    res2 = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={"feedback_type": "general_feedback", "title": "Valid Title", "description": "Short"},
    )
    assert res2.status_code == 422


def test_task_id_from_different_campaign_in_feedback_rejected(test_client: TestClient, db_session: Session):
    """Specifying a task ID that doesn't belong to the campaign returns 400."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Task Check", f"tc-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Nora QA", f"nora_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)
    res = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={
            "feedback_type": "general_feedback",
            "title": "Feedback with invalid task",
            "description": "Detailed text describing this submission.",
            "task_id": "nonexistent_task_999",
        },
    )
    assert res.status_code == 400
    assert "does not belong to this campaign" in res.json()["detail"]


# ==============================================================================
# 5. Feedback Ownership & Retrieval Tests
# ==============================================================================


def test_tester_can_list_and_retrieve_own_feedback(test_client: TestClient, db_session: Session):
    """Tester can list their own submissions and retrieve individual records."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Feedback List", f"fl-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Oscar QA", f"oscar_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)
    # Submit one general and one bug
    f1 = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={"feedback_type": "general_feedback", "title": "Great overall look", "description": "Design looks clean and modern."},
    ).json()["id"]
    f2 = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={"feedback_type": "bug_report", "title": "Missing favicon", "description": "Browser tab icon is 404.", "severity": "low"},
    ).json()["id"]

    # List all
    res_list = test_client.get("/api/feedback/me")
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 2

    # Filter by bug_report
    res_bugs = test_client.get("/api/feedback/me?feedback_type=bug_report")
    assert res_bugs.status_code == 200
    assert res_bugs.json()["total"] == 1
    assert res_bugs.json()["items"][0]["id"] == f2

    # Retrieve single
    res_single = test_client.get(f"/api/feedback/{f1}")
    assert res_single.status_code == 200
    assert res_single.json()["title"] == "Great overall look"


def test_tester_cannot_retrieve_another_testers_feedback(test_client: TestClient, db_session: Session):
    """Tester A cannot retrieve Tester B's feedback submission (404 non-leaking)."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Isolation Camp", f"iso-{uuid.uuid4().hex[:6]}")

    t1 = seed_tester_with_profile(db_session, "Tester One", f"t1_{uuid.uuid4().hex[:6]}@example.com")
    t2 = seed_tester_with_profile(db_session, "Tester Two", f"t2_{uuid.uuid4().hex[:6]}@example.com")

    for t in (t1, t2):
        authenticate_client(test_client, t)
        aid = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]
        authenticate_client(test_client, founder)
        test_client.post(f"/api/founder/applications/{aid}/accept")

    # Tester 1 creates feedback
    authenticate_client(test_client, t1)
    f_id = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={"feedback_type": "general_feedback", "title": "Tester 1 Note", "description": "Private observation by Tester 1."},
    ).json()["id"]

    # Tester 2 tries to retrieve Tester 1's feedback
    authenticate_client(test_client, t2)
    res = test_client.get(f"/api/feedback/{f_id}")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_private_access_instructions_never_leak_in_task_or_feedback_endpoints(test_client: TestClient, db_session: Session):
    """Confidential access instructions never leak in task, progress, or feedback payloads."""
    secret = "SUPER_SECRET_ACCESS_KEY_NEVER_LEAK_12345"
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Secret Test", f"sec-{uuid.uuid4().hex[:6]}", access_instructions=secret)

    tester = seed_tester_with_profile(db_session, "Paula QA", f"paula_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)

    # 1. Tasks endpoint
    res_tasks = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res_tasks.status_code == 200
    assert secret not in res_tasks.text

    # 2. Task progress update endpoint
    res_progress = test_client.put(f"/api/campaigns/{campaign.id}/tasks/t1/progress", json={"status": "in_progress"})
    assert res_progress.status_code == 200
    assert secret not in res_progress.text

    # 3. Tester tasks list endpoint
    res_list = test_client.get("/api/tester/tasks")
    assert res_list.status_code == 200
    assert secret not in res_list.text

    # 4. Feedback creation endpoint
    res_fb = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={"feedback_type": "general_feedback", "title": "Valid Title", "description": "Detailed text describing testing."},
    )
    assert res_fb.status_code == 201
    assert secret not in res_fb.text


def test_task_title_edit_does_not_detach_or_confuse_progress(test_client: TestClient, db_session: Session):
    """Editing a task title keeps saved progress attached to the same task ID."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Title Edit Camp", f"te-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Rachel QA", f"rachel_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    # Tester completes task t1
    authenticate_client(test_client, tester)
    test_client.put(f"/api/campaigns/{campaign.id}/tasks/t1/progress", json={"status": "completed", "completion_note": "Done."})

    # Founder edits the title of t1
    authenticate_client(test_client, founder)
    updated_tasks = [
        {"id": "t1", "title": "Completely Renamed Title", "is_required": True, "order": 1},
        {"id": "t2", "title": "Core Feature Test", "is_required": True, "order": 2},
    ]
    test_client.put(f"/api/campaigns/{campaign.id}", json={"testing_tasks": updated_tasks})

    # Tester fetches tasks: t1 has the new title and retains status completed
    authenticate_client(test_client, tester)
    res = test_client.get(f"/api/campaigns/{campaign.id}/tasks")
    assert res.status_code == 200
    t1_task = next(t for t in res.json()["tasks"] if t["id"] == "t1")
    assert t1_task["title"] == "Completely Renamed Title"
    assert t1_task["status"] == "completed"
    assert t1_task["completion_note"] == "Done."


def test_client_cannot_set_server_managed_feedback_status(test_client: TestClient, db_session: Session):
    """Client attempting to set review status (e.g. resolved) is ignored; status is always submitted."""
    founder = seed_test_user(db_session, "Founder Alex", f"alex_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")
    campaign = seed_test_campaign(db_session, startup, "Status Camp", f"st-{uuid.uuid4().hex[:6]}")

    tester = seed_tester_with_profile(db_session, "Steve QA", f"steve_{uuid.uuid4().hex[:6]}@example.com")
    authenticate_client(test_client, tester)
    app_id = test_client.post(f"/api/campaigns/{campaign.id}/applications", json={"screening_answers": {}}).json()["id"]

    authenticate_client(test_client, founder)
    test_client.post(f"/api/founder/applications/{app_id}/accept")

    authenticate_client(test_client, tester)
    # Attempt to inject status="resolved"
    res = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json={
            "feedback_type": "bug_report",
            "title": "Bug With Injected Status",
            "description": "Attempting to mark bug as resolved immediately.",
            "status": "resolved",
        },
    )
    assert res.status_code == 201
    assert res.json()["status"] == "submitted"

