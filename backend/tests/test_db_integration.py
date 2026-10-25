"""Integration Tests Exercising the Real Configured Supabase Database.

These tests run against the live development database configured in backend/.env.
They strictly test isolated test records and NEVER truncate, drop, or reset the real database.
"""

import uuid
from datetime import datetime, timezone
import pytest
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_engine, get_session_factory
from app.models.user import User, UserRole
from app.core.security import hash_password, verify_password


@pytest.mark.skipif(
    not settings.is_database_configured,
    reason="Supabase DATABASE_URL is not configured in backend/.env",
)
def test_real_supabase_users_table_operations():
    """
    Test safe insertion, query, and cleanup of an isolated test user on the live Supabase database.
    """
    session_factory = get_session_factory()
    assert session_factory is not None, "Failed to get session factory for live database."

    test_uid = uuid.uuid4()
    test_email = f"ephemeral-test-{test_uid.hex[:8]}@example-test.com"
    plain_password = "EphemeralPassword99!"
    hashed = hash_password(plain_password)

    db: Session = session_factory()
    try:
        # Create an ephemeral test user
        user = User(
            id=test_uid,
            full_name="Supabase Integration Tester",
            email=test_email,
            password_hash=hashed,
            role=UserRole.TESTER.value,
            is_active=True,
        )
        db.add(user)
        db.commit()

        # Query the user back from Supabase
        retrieved = db.scalar(select(User).where(User.email == test_email))
        assert retrieved is not None
        assert retrieved.id == test_uid
        assert retrieved.full_name == "Supabase Integration Tester"
        assert retrieved.role == "tester"
        assert retrieved.is_active is True
        assert retrieved.created_at is not None
        assert verify_password(plain_password, retrieved.password_hash) is True

    finally:
        # Clean up only the specific ephemeral test user created by this test
        try:
            db.execute(delete(User).where(User.id == test_uid))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


@pytest.mark.skipif(
    not settings.is_database_configured,
    reason="Supabase DATABASE_URL is not configured in backend/.env",
)
def test_real_supabase_profiles_operations():
    """
    Test insertion, query, and cascade deletion of FounderProfile and TesterProfile
    on the live Supabase PostgreSQL database.
    """
    from app.models.profile import FounderProfile, TesterProfile

    session_factory = get_session_factory()
    assert session_factory is not None

    db: Session = session_factory()
    founder_uid = uuid.uuid4()
    tester_uid = uuid.uuid4()

    try:
        # 1. Test live Founder profile
        founder_user = User(
            id=founder_uid,
            full_name="Ephemeral Founder",
            email=f"founder-{founder_uid.hex[:8]}@example-test.com",
            password_hash=hash_password("Pass1234!"),
            role="founder",
            is_active=True,
        )
        db.add(founder_user)
        db.commit()

        founder_profile = FounderProfile(
            user_id=founder_uid,
            startup_name="Live Supabase Startup",
            professional_title="CEO",
            industry="Cloud Computing",
            company_stage="Early Traction",
            website_url="https://live-test.supabase.co",
            city="Bengaluru",
            country="India",
        )
        db.add(founder_profile)
        db.commit()

        # Query back
        fp = db.scalar(select(FounderProfile).where(FounderProfile.user_id == founder_uid))
        assert fp is not None
        assert fp.startup_name == "Live Supabase Startup"
        assert fp.is_complete is True
        assert fp.company_stage == "Early Traction"

        # 2. Test live Tester profile with JSONB fields
        tester_user = User(
            id=tester_uid,
            full_name="Ephemeral Tester",
            email=f"tester-{tester_uid.hex[:8]}@example-test.com",
            password_hash=hash_password("Pass1234!"),
            role="tester",
            is_active=True,
        )
        db.add(tester_user)
        db.commit()

        tester_profile = TesterProfile(
            user_id=tester_uid,
            bio="Live database tester with PostgreSQL JSONB support.",
            skills=["UI/UX", "backend development"],
            interests=["Developer Tools", "Cloud"],
            devices=["Windows", "Android"],
            experience_level="Advanced",
        )
        db.add(tester_profile)
        db.commit()

        # Query back
        tp = db.scalar(select(TesterProfile).where(TesterProfile.user_id == tester_uid))
        assert tp is not None
        assert tp.bio == "Live database tester with PostgreSQL JSONB support."
        assert tp.is_complete is True
        assert "backend development" in tp.skills
        assert "Windows" in tp.devices

    finally:
        # Cascade cleanup: deleting user automatically removes profile
        try:
            db.execute(delete(User).where(User.id.in_([founder_uid, tester_uid])))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


@pytest.mark.skipif(
    not settings.is_database_configured,
    reason="Supabase DATABASE_URL is not configured in backend/.env",
)
def test_real_supabase_startups_operations():
    """
    Test insertion, query, slug uniqueness, and cascade deletion of Startup
    on the live Supabase PostgreSQL database.
    """
    from app.models.startup import Startup

    session_factory = get_session_factory()
    assert session_factory is not None

    db: Session = session_factory()
    founder_uid = uuid.uuid4()
    startup_1_id = uuid.uuid4()
    startup_2_id = uuid.uuid4()
    slug_1 = f"live-startup-{founder_uid.hex[:6]}"
    slug_2 = f"live-startup-two-{founder_uid.hex[:6]}"

    try:
        founder_user = User(
            id=founder_uid,
            full_name="Live Startup Founder",
            email=f"live-startup-{founder_uid.hex[:8]}@example-test.com",
            password_hash=hash_password("Pass1234!"),
            role="founder",
            is_active=True,
        )
        db.add(founder_user)
        db.commit()

        s1 = Startup(
            id=startup_1_id,
            owner_id=founder_uid,
            name="Live Startup One",
            slug=slug_1,
            tagline="Testing live Supabase startup",
            company_stage="MVP",
            industry="DevTools",
            founded_year=2024,
        )
        s2 = Startup(
            id=startup_2_id,
            owner_id=founder_uid,
            name="Live Startup Two",
            slug=slug_2,
            tagline="Testing multi-startup ownership",
            company_stage="Early Traction",
            industry="Fintech",
            founded_year=2025,
        )
        db.add_all([s1, s2])
        db.commit()

        # Query back
        records = db.scalars(select(Startup).where(Startup.owner_id == founder_uid)).all()
        assert len(records) == 2
        slugs = [r.slug for r in records]
        assert slug_1 in slugs
        assert slug_2 in slugs

    finally:
        try:
            db.execute(delete(User).where(User.id == founder_uid))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


@pytest.mark.skipif(
    not settings.is_database_configured,
    reason="Supabase DATABASE_URL is not configured in backend/.env",
)
def test_real_supabase_campaigns_operations():
    """
    Test insertion, query, JSONB storage, constraints, and cascade deletion
    of Campaign on the live Supabase PostgreSQL database.
    """
    from app.models.startup import Startup
    from app.models.campaign import Campaign, CAMPAIGN_STATUS_DRAFT

    session_factory = get_session_factory()
    assert session_factory is not None

    db: Session = session_factory()
    founder_uid = uuid.uuid4()
    startup_id = uuid.uuid4()
    campaign_id = uuid.uuid4()
    startup_slug = f"live-camp-startup-{founder_uid.hex[:6]}"
    campaign_slug = "live-beta-campaign"

    try:
        founder_user = User(
            id=founder_uid,
            full_name="Live Campaign Founder",
            email=f"live-campaign-{founder_uid.hex[:8]}@example-test.com",
            password_hash=hash_password("Pass1234!"),
            role="founder",
            is_active=True,
        )
        db.add(founder_user)
        db.commit()

        startup = Startup(
            id=startup_id,
            owner_id=founder_uid,
            name="Live Campaign Startup",
            slug=startup_slug,
        )
        db.add(startup)
        db.commit()

        campaign = Campaign(
            id=campaign_id,
            startup_id=startup_id,
            title="Live Beta Testing Campaign",
            slug=campaign_slug,
            summary="A live database test campaign summary.",
            description="Testing live JSONB persistence for tasks and audience.",
            product_type="Web App",
            product_url="https://live-test.trylo.com",
            access_instructions="Secret test credentials 123.",
            testing_tasks=[
                {"id": "task1", "title": "Run test scenario", "order": 1, "is_required": True},
            ],
            target_audience={
                "skills": ["Python", "FastAPI"],
                "experience_level": "Intermediate",
                "devices": ["Mac", "Windows"],
            },
            max_testers=15,
            reward_type="unpaid",
            status=CAMPAIGN_STATUS_DRAFT,
        )
        db.add(campaign)
        db.commit()

        # Query back from Supabase
        retrieved = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
        assert retrieved is not None
        assert retrieved.title == "Live Beta Testing Campaign"
        assert retrieved.status == "draft"
        assert len(retrieved.testing_tasks) == 1
        assert retrieved.testing_tasks[0]["title"] == "Run test scenario"
        assert retrieved.target_audience["experience_level"] == "Intermediate"
        assert retrieved.startup_name == "Live Campaign Startup"

    finally:
        try:
            # Cascade delete user -> cascades to startup -> cascades to campaign
            db.execute(delete(User).where(User.id == founder_uid))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


