"""Automated Tests for In-Browser Screen Recording, Video Streaming & Timestamped Bug Annotations."""

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
from app.models.application import CampaignApplication, APPLICATION_STATUS_ACCEPTED
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


def test_video_recording_upload_and_timestamped_notes(test_client: TestClient, db_session: Session):
    founder = seed_user(db_session, "Karan Founder", f"founder_{uuid.uuid4().hex[:6]}@trylo.io", "founder")
    tester = seed_user(db_session, "Neha Tester", f"tester_{uuid.uuid4().hex[:6]}@trylo.io", "tester")

    profile = TesterProfile(user_id=tester.id, bio="Screen Recording Tester", skills=["UI Testing"], interests=["SaaS"])
    db_session.add(profile)

    startup = Startup(owner_id=founder.id, name="SaaS App", slug=f"saas-{uuid.uuid4().hex[:6]}")
    db_session.add(startup)
    db_session.commit()

    campaign = Campaign(
        startup_id=startup.id,
        title="SaaS Live Beta",
        slug=f"saas-beta-{uuid.uuid4().hex[:6]}",
        status=CAMPAIGN_STATUS_PUBLISHED,
        summary="Test checkout flow",
        description="Detailed description",
        access_instructions="Go to staging.saas.io",
        testing_tasks=[{"id": "t1", "title": "Complete checkout", "is_required": True, "order": 1}],
    )
    db_session.add(campaign)
    db_session.commit()

    app = CampaignApplication(
        campaign_id=campaign.id,
        tester_id=tester.id,
        status=APPLICATION_STATUS_ACCEPTED,
    )
    db_session.add(app)
    db_session.commit()

    # 1. Tester uploads video recording binary
    set_auth(test_client, tester)
    fake_video_bytes = b"\x1a\x45\xdf\xa3" + b"SIMULATED_WEBM_VIDEO_DATA" * 50

    res_upload = test_client.post(
        "/api/feedback/upload-video",
        content=fake_video_bytes,
        headers={"Content-Type": "video/webm"},
    )
    assert res_upload.status_code == 201
    upload_data = res_upload.json()
    assert "video_url" in upload_data
    assert upload_data["format"] == "webm"
    video_url = upload_data["video_url"]
    filename = upload_data["filename"]

    # 2. Stream video back
    res_stream = test_client.get(f"/api/feedback/videos/{filename}")
    assert res_stream.status_code == 200
    assert res_stream.content == fake_video_bytes

    # 3. Submit bug report with screen recording video attached
    feedback_payload = {
        "feedback_type": "bug_report",
        "title": "Checkout button freezes during payment",
        "description": "When clicking Pay Now, UI becomes completely unresponsive.",
        "severity": "critical",
        "video_url": video_url,
        "video_duration_seconds": 45,
        "video_format": "webm",
        "timestamped_notes": [
            {
                "timestamp_seconds": 12,
                "timestamp_display": "0:12",
                "note": "User clicks Proceed to Payment",
                "tag": "step_1",
            },
            {
                "timestamp_seconds": 28,
                "timestamp_display": "0:28",
                "note": "Modal spinner stops and freezes entire tab",
                "tag": "freeze",
            },
        ],
    }

    res_feedback = test_client.post(
        f"/api/campaigns/{campaign.id}/feedback",
        json=feedback_payload,
    )
    assert res_feedback.status_code == 201
    fb_data = res_feedback.json()
    assert fb_data["video_url"] == video_url
    assert fb_data["video_duration_seconds"] == 45
    assert len(fb_data["timestamped_notes"]) == 2
    feedback_id = fb_data["id"]

    # 4. Founder reviews feedback detail and adds timestamped annotation
    set_auth(test_client, founder)
    res_detail = test_client.get(f"/api/founder/feedback/{feedback_id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["video_url"] == video_url
    assert detail_data["severity"] == "critical"

    # Founder adds annotation at 0:35
    res_add_note = test_client.post(
        f"/api/feedback/{feedback_id}/video-notes",
        json={
            "timestamp_seconds": 35,
            "timestamp_display": "0:35",
            "note": "Confirmed: Console shows Uncaught TypeError in stripe-elements.js",
            "tag": "root_cause",
        },
    )
    assert res_add_note.status_code == 201
    notes_data = res_add_note.json()
    assert len(notes_data["timestamped_notes"]) == 3
    # Check chronological ordering: 12, 28, 35
    assert notes_data["timestamped_notes"][2]["timestamp_seconds"] == 35
    assert notes_data["timestamped_notes"][2]["author_role"] == "founder"
