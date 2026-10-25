"""Automated Tests for TryLo Phase 2B.3A: Tester Campaign Discovery and Public Browsing."""

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


def seed_test_startup(db: Session, owner: User, name: str, slug: str) -> Startup:
    """Helper to seed a test startup."""
    startup = Startup(
        owner_id=owner.id,
        name=name,
        slug=slug,
        tagline="Next-gen software",
        description="Revolutionizing beta testing.",
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
    product_type: str = "Web App",
    reward_type: str = REWARD_TYPE_UNPAID,
    reward_amount: float = None,
    reward_currency: str = None,
    reward_description: str = None,
    target_audience: dict = None,
    application_deadline: datetime = None,
    published_offset_hours: int = 0,
) -> Campaign:
    """Helper to seed a campaign with configurable criteria."""
    now = datetime.now(timezone.utc)
    pub_at = (now - timedelta(hours=published_offset_hours)) if status == CAMPAIGN_STATUS_PUBLISHED else None

    campaign = Campaign(
        startup_id=startup.id,
        title=title,
        slug=slug,
        summary=f"Summary for {title}",
        description=f"Detailed description for {title} beta testing experience.",
        product_type=product_type,
        product_url="https://product.example.com",
        access_instructions="TOP SECRET PROPRIETARY INSTRUCTIONS - NEVER EXPOSE",
        testing_tasks=[{"id": "t1", "title": "Test login", "is_required": True, "order": 1}],
        target_audience=target_audience or {
            "experience_level": "Beginner",
            "devices": ["Web", "iOS"],
            "countries": ["USA", "Germany"],
        },
        reward_type=reward_type,
        reward_amount=reward_amount,
        reward_currency=reward_currency,
        reward_description=reward_description,
        status=status,
        published_at=pub_at,
        application_deadline=application_deadline,
        created_at=pub_at or now,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def test_public_discovery_only_returns_published_campaigns(test_client: TestClient, db_session: Session):
    """Discovery feed must return only published campaigns, excluding drafts and closed campaigns."""
    founder = seed_test_user(db_session, "Alice Founder", f"alice_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Acme AI", f"acme-{uuid.uuid4().hex[:6]}")

    seed_test_campaign(db_session, startup, "Public Alpha", "public-alpha", status=CAMPAIGN_STATUS_PUBLISHED)
    seed_test_campaign(db_session, startup, "Secret Draft", "secret-draft", status=CAMPAIGN_STATUS_DRAFT)
    seed_test_campaign(db_session, startup, "Finished Beta", "finished-beta", status=CAMPAIGN_STATUS_CLOSED)

    # Test GET /api/public/campaigns
    res1 = test_client.get("/api/public/campaigns")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "items" in data1
    assert "total" in data1
    assert data1["total"] == 1
    assert len(data1["items"]) == 1
    assert data1["items"][0]["title"] == "Public Alpha"
    assert data1["items"][0]["status"] == "published"


def test_public_discovery_never_exposes_access_instructions_or_founder_data(test_client: TestClient, db_session: Session):
    """Security check: access_instructions, owner_id, emails, and passwords must never leak in public discovery."""
    founder = seed_test_user(db_session, "Secure Founder", f"sec_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Stealth Labs", f"stealth-{uuid.uuid4().hex[:6]}")
    seed_test_campaign(db_session, startup, "Flagship App", "flagship-app", status=CAMPAIGN_STATUS_PUBLISHED)

    res = test_client.get("/api/public/campaigns")
    assert res.status_code == 200
    item = res.json()["items"][0]

    assert "access_instructions" not in item
    assert "owner_id" not in item
    assert "password_hash" not in item
    assert "email" not in item

    # Raw response body inspection for safety
    raw_text = res.text
    assert "TOP SECRET" not in raw_text


def test_public_discovery_search_keyword(test_client: TestClient, db_session: Session):
    """Search query 'q' matches title, summary, description, and startup name."""
    founder = seed_test_user(db_session, "Search Founder", f"srch_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup_a = seed_test_startup(db_session, founder, "Quantum FinTech", f"quantum-{uuid.uuid4().hex[:6]}")
    startup_b = seed_test_startup(db_session, founder, "Solaris Health", f"solaris-{uuid.uuid4().hex[:6]}")

    c1 = seed_test_campaign(db_session, startup_a, "Ledger Sync", "ledger-sync", status=CAMPAIGN_STATUS_PUBLISHED)
    c2 = seed_test_campaign(db_session, startup_b, "Heart Monitor", "heart-monitor", status=CAMPAIGN_STATUS_PUBLISHED)

    # Search by campaign title
    res_title = test_client.get("/api/public/campaigns?q=Ledger")
    assert res_title.status_code == 200
    assert res_title.json()["total"] == 1
    assert res_title.json()["items"][0]["title"] == "Ledger Sync"

    # Search by startup name
    res_startup = test_client.get("/api/public/campaigns?q=Solaris")
    assert res_startup.status_code == 200
    assert res_startup.json()["total"] == 1
    assert res_startup.json()["items"][0]["title"] == "Heart Monitor"

    # Search non-matching term
    res_none = test_client.get("/api/public/campaigns?q=NonExistentKeyword99")
    assert res_none.status_code == 200
    assert res_none.json()["total"] == 0
    assert res_none.json()["items"] == []


def test_public_discovery_category_filter(test_client: TestClient, db_session: Session):
    """Filter by product category / type."""
    founder = seed_test_user(db_session, "Cat Founder", f"cat_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "MultiApp Studio", f"multi-{uuid.uuid4().hex[:6]}")

    seed_test_campaign(db_session, startup, "Web Dashboard", "web-dash", status=CAMPAIGN_STATUS_PUBLISHED, product_type="Web App")
    seed_test_campaign(db_session, startup, "Mobile Tracker", "mob-track", status=CAMPAIGN_STATUS_PUBLISHED, product_type="iOS App")

    res = test_client.get("/api/public/campaigns?category=iOS%20App")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["title"] == "Mobile Tracker"
    assert res.json()["items"][0]["product_type"] == "iOS App"


def test_public_discovery_reward_filter(test_client: TestClient, db_session: Session):
    """Filter by controlled reward_type and reject invalid reward_type with 400."""
    founder = seed_test_user(db_session, "Reward Founder", f"rew_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Reward Inc", f"rew-{uuid.uuid4().hex[:6]}")

    seed_test_campaign(
        db_session, startup, "Paid Testing", "paid-testing",
        status=CAMPAIGN_STATUS_PUBLISHED,
        reward_type=REWARD_TYPE_MONETARY,
        reward_amount=75.0,
        reward_currency="USD",
    )
    seed_test_campaign(
        db_session, startup, "Free License Perk", "perk-testing",
        status=CAMPAIGN_STATUS_PUBLISHED,
        reward_type=REWARD_TYPE_PERK,
        reward_description="1 Year Premium Pro license",
    )
    seed_test_campaign(
        db_session, startup, "Community Volunteer", "unpaid-testing",
        status=CAMPAIGN_STATUS_PUBLISHED,
        reward_type=REWARD_TYPE_UNPAID,
    )

    # Filter monetary
    res_mon = test_client.get("/api/public/campaigns?reward_type=monetary")
    assert res_mon.status_code == 200
    assert res_mon.json()["total"] == 1
    assert res_mon.json()["items"][0]["title"] == "Paid Testing"
    assert res_mon.json()["items"][0]["reward_amount"] == 75.0

    # Filter perk
    res_perk = test_client.get("/api/public/campaigns?reward_type=perk")
    assert res_perk.status_code == 200
    assert res_perk.json()["total"] == 1
    assert res_perk.json()["items"][0]["title"] == "Free License Perk"

    # Filter invalid reward_type
    res_invalid = test_client.get("/api/public/campaigns?reward_type=crypto")
    assert res_invalid.status_code == 400
    assert "Invalid reward_type" in res_invalid.json()["detail"]


def test_public_discovery_audience_criteria_filters(test_client: TestClient, db_session: Session):
    """Filter by experience_level, device, and country criteria."""
    founder = seed_test_user(db_session, "Audience Founder", f"aud_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Audience Corp", f"aud-{uuid.uuid4().hex[:6]}")

    seed_test_campaign(
        db_session, startup, "Android Pro Tool", "android-pro",
        status=CAMPAIGN_STATUS_PUBLISHED,
        target_audience={
            "experience_level": "Advanced",
            "devices": ["Android", "Tablet"],
            "countries": ["Canada", "USA"],
        },
    )
    seed_test_campaign(
        db_session, startup, "Beginner Web App", "beginner-web",
        status=CAMPAIGN_STATUS_PUBLISHED,
        target_audience={
            "experience_level": "Beginner",
            "devices": ["Web", "macOS"],
            "countries": ["Japan"],
        },
    )

    # Filter by experience_level
    res_exp = test_client.get("/api/public/campaigns?experience_level=Advanced")
    assert res_exp.status_code == 200
    assert res_exp.json()["total"] == 1
    assert res_exp.json()["items"][0]["title"] == "Android Pro Tool"

    # Filter by device
    res_dev = test_client.get("/api/public/campaigns?device=Android")
    assert res_dev.status_code == 200
    assert res_dev.json()["total"] == 1
    assert res_dev.json()["items"][0]["title"] == "Android Pro Tool"

    # Filter by country
    res_cntry = test_client.get("/api/public/campaigns?country=Japan")
    assert res_cntry.status_code == 200
    assert res_cntry.json()["total"] == 1
    assert res_cntry.json()["items"][0]["title"] == "Beginner Web App"


def test_public_discovery_sorting_and_pagination(test_client: TestClient, db_session: Session):
    """Sorting by newest and deadline; pagination slicing and page calculation."""
    founder = seed_test_user(db_session, "Sort Founder", f"sort_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Sort Labs", f"sort-{uuid.uuid4().hex[:6]}")

    now = datetime.now(timezone.utc)
    # C1: published 3 hours ago, deadline in 10 days
    c1 = seed_test_campaign(
        db_session, startup, "Campaign Alpha", "camp-alpha",
        status=CAMPAIGN_STATUS_PUBLISHED,
        published_offset_hours=3,
        application_deadline=now + timedelta(days=10),
    )
    # C2: published 1 hour ago, deadline in 2 days (sooner deadline)
    c2 = seed_test_campaign(
        db_session, startup, "Campaign Beta", "camp-beta",
        status=CAMPAIGN_STATUS_PUBLISHED,
        published_offset_hours=1,
        application_deadline=now + timedelta(days=2),
    )
    # C3: published 5 hours ago, no deadline
    c3 = seed_test_campaign(
        db_session, startup, "Campaign Gamma", "camp-gamma",
        status=CAMPAIGN_STATUS_PUBLISHED,
        published_offset_hours=5,
        application_deadline=None,
    )

    # Sort by newest (default) -> Beta (1h ago), Alpha (3h ago), Gamma (5h ago)
    res_newest = test_client.get("/api/public/campaigns?sort=newest")
    assert res_newest.status_code == 200
    items_newest = res_newest.json()["items"]
    assert len(items_newest) == 3
    assert items_newest[0]["title"] == "Campaign Beta"
    assert items_newest[1]["title"] == "Campaign Alpha"
    assert items_newest[2]["title"] == "Campaign Gamma"

    # Sort by deadline -> Beta (2 days), Alpha (10 days), Gamma (null at end)
    res_deadline = test_client.get("/api/public/campaigns?sort=deadline")
    assert res_deadline.status_code == 200
    items_deadline = res_deadline.json()["items"]
    assert items_deadline[0]["title"] == "Campaign Beta"
    assert items_deadline[1]["title"] == "Campaign Alpha"
    assert items_deadline[2]["title"] == "Campaign Gamma"

    # Pagination: page 1 of size 2
    res_p1 = test_client.get("/api/public/campaigns?page=1&page_size=2&sort=newest")
    assert res_p1.status_code == 200
    d1 = res_p1.json()
    assert d1["total"] == 3
    assert d1["page"] == 1
    assert d1["page_size"] == 2
    assert d1["total_pages"] == 2
    assert len(d1["items"]) == 2
    assert d1["items"][0]["title"] == "Campaign Beta"
    assert d1["items"][1]["title"] == "Campaign Alpha"

    # Pagination: page 2 of size 2
    res_p2 = test_client.get("/api/public/campaigns?page=2&page_size=2&sort=newest")
    assert res_p2.status_code == 200
    d2 = res_p2.json()
    assert d2["page"] == 2
    assert len(d2["items"]) == 1
    assert d2["items"][0]["title"] == "Campaign Gamma"


def test_authenticated_tester_can_discover_campaigns(test_client: TestClient, db_session: Session):
    """An authenticated tester can query the discovery feed without restriction."""
    founder = seed_test_user(db_session, "Boss Founder", f"boss_{uuid.uuid4().hex[:6]}@example.com", "founder")
    startup = seed_test_startup(db_session, founder, "Open Beta", f"open-{uuid.uuid4().hex[:6]}")
    seed_test_campaign(db_session, startup, "Public Discovery Item", "pub-item", status=CAMPAIGN_STATUS_PUBLISHED)

    # Tester login session
    tester = seed_test_user(db_session, "Tim Tester", f"tim_{uuid.uuid4().hex[:6]}@example.com", "tester")
    token = create_access_token(user_id=tester.id, role=tester.role)
    test_client.cookies.set(settings.COOKIE_NAME, token)

    res = test_client.get("/api/public/campaigns")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Public Discovery Item"
