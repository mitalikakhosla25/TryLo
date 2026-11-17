"""Automated Tests for AI Bug Triaging, Duplicate Detection & Developer Ticket Synthesis."""

import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.startup import Startup
from app.models.campaign import Campaign, CAMPAIGN_STATUS_PUBLISHED
from app.models.feedback import FeedbackSubmission
from app.models.profile import TesterProfile

TesterProfile.__test__ = False


def seed_user(db: Session, full_name: str, email: str, role: str) -> User:
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


def set_auth(client: TestClient, user: User):
    token = create_access_token(user_id=user.id, role=user.role)
    client.cookies.set(settings.COOKIE_NAME, token)


def test_ai_bug_triaging_and_duplicate_detection(test_client: TestClient, db_session: Session):
    founder = seed_user(db_session, "Priya Founder", f"founder_{uuid.uuid4().hex[:6]}@trylo.io", "founder")
    tester1 = seed_user(db_session, "Rohan Tester", f"tester1_{uuid.uuid4().hex[:6]}@trylo.io", "tester")
    tester2 = seed_user(db_session, "Sneha Tester", f"tester2_{uuid.uuid4().hex[:6]}@trylo.io", "tester")

    startup = Startup(owner_id=founder.id, name="FinTech App", slug=f"fintech-{uuid.uuid4().hex[:6]}")
    db_session.add(startup)
    db_session.commit()

    campaign = Campaign(
        startup_id=startup.id,
        title="FinTech Payment Beta",
        slug=f"fintech-beta-{uuid.uuid4().hex[:6]}",
        status=CAMPAIGN_STATUS_PUBLISHED,
        summary="Test checkout and Stripe integration",
        description="Detailed description",
        access_instructions="Use sandbox cards",
    )
    db_session.add(campaign)
    db_session.commit()

    # Pre-existing bug in the same campaign (potential duplicate)
    existing_bug = FeedbackSubmission(
        campaign_id=campaign.id,
        tester_id=tester1.id,
        feedback_type="bug_report",
        title="Stripe payment checkout button freezes UI on submit",
        description="When clicking Pay with Card, the spinner hangs indefinitely and tab freezes.",
        severity="critical",
        reproduction_steps="1. Add item to cart\n2. Click checkout\n3. Click Pay Now",
        status="submitted",
    )
    db_session.add(existing_bug)
    db_session.commit()

    # Target bug submitted by tester 2 with similar payment freeze symptoms
    target_bug = FeedbackSubmission(
        campaign_id=campaign.id,
        tester_id=tester2.id,
        feedback_type="bug_report",
        title="Payment checkout button crashes and freezes modal",
        description="Checkout modal spinner keeps spinning and hangs browser during card payment processing.",
        severity="critical",
        reproduction_steps="1. Open payment dialog\n2. Enter credit card\n3. Submit payment",
        expected_behavior="Payment confirms and receipt shows",
        actual_behavior="Spinner hangs, tab freezes completely",
        video_url="/api/feedback/videos/repro_test.webm",
        video_duration_seconds=30,
        timestamped_notes=[
            {"timestamp_seconds": 15, "timestamp_display": "0:15", "note": "Click Pay button"}
        ],
        status="submitted",
    )
    db_session.add(target_bug)
    db_session.commit()

    # 1. Founder triggers AI Triage on target bug
    set_auth(test_client, founder)
    res_triage = test_client.post(f"/api/founder/feedback/{target_bug.id}/ai-triage")
    assert res_triage.status_code == 200
    triage_data = res_triage.json()

    assert "root_cause_hypothesis" in triage_data
    assert "suggested_fix" in triage_data
    assert "fix_complexity" in triage_data
    assert "friction_score" in triage_data
    assert triage_data["friction_score"] >= 8  # Critical payment freeze
    assert "potential_duplicates" in triage_data

    # Verify duplicate detection caught existing_bug
    duplicates = triage_data["potential_duplicates"]
    assert len(duplicates) >= 1
    assert duplicates[0]["title"] == existing_bug.title
    assert duplicates[0]["similarity_score"] >= 40

    # Verify Dev Ticket Markdown
    dev_ticket = triage_data["dev_ticket_markdown"]
    assert "### [Bug]:" in dev_ticket
    assert "CRITICAL" in dev_ticket
    assert "Screen Recording Proof" in dev_ticket
    assert "0:15" in dev_ticket
    assert "Suggested Fix" in dev_ticket

    # 2. Verify Founder Feedback Detail endpoint returns ai_triage
    res_detail = test_client.get(f"/api/founder/feedback/{target_bug.id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["ai_triage"] is not None
    assert detail_data["ai_triage"]["root_cause_hypothesis"] == triage_data["root_cause_hypothesis"]
