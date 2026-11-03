"""Automated Tests for Startup Anti-Shell Verification & Tester Credibility Hub."""

import uuid
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_DRAFT,
    REWARD_TYPE_UNPAID,
)
from app.models.startup import Startup
from app.models.startup_verification import (
    StartupVerification,
    VERIFICATION_STATUS_PENDING,
    VERIFICATION_STATUS_REJECTED,
    VERIFICATION_STATUS_VERIFIED,
)
from app.models.tester_verification import (
    TesterCertification,
    TesterEmployerReview,
    TesterEndorsement,
    TesterResume,
)
from app.models.user import User


def create_user(db: Session, full_name: str, email: str, role: str) -> User:
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
    return user


def set_auth(client: TestClient, user: User):
    token = create_access_token(user_id=user.id, role=user.role)
    client.cookies.set(settings.COOKIE_NAME, token)


def create_startup(db: Session, owner: User, name: str, slug: str) -> Startup:
    startup = Startup(
        owner_id=owner.id,
        name=name,
        slug=slug,
        tagline="NextGen Beta Platform",
        company_stage="MVP",
        website_url="https://acmebeta.com",
    )
    db.add(startup)
    db.commit()
    db.refresh(startup)
    return startup


# ==============================================================================
# Startup Verification & Anti-Shell Tests
# ==============================================================================


def test_submit_startup_verification(test_client: TestClient, db_session: Session):
    founder = create_user(db_session, "Alice Founder", "alice@acme.com", "founder")
    startup = create_startup(db_session, founder, "Acme Tech", "acme-tech")
    set_auth(test_client, founder)

    payload = {
        "legal_entity_name": "Acme Technologies Private Limited",
        "registration_type": "Private Limited (Pvt Ltd)",
        "registration_number": "U72200KA2024PTC123456",
        "tax_identifier": "AAACA1234A",
        "document_url": "https://docs.acme.com/cin-certificate.pdf",
        "document_name": "cin_certificate.pdf",
        "corporate_email": "admin@acmebeta.com",
    }

    res = test_client.post(f"/api/startups/{startup.id}/verification", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["legal_entity_name"] == "Acme Technologies Private Limited"
    assert data["registration_number"] == "U72200KA2024PTC123456"
    assert data["verification_status"] == VERIFICATION_STATUS_PENDING


def test_startup_verification_review_flow(test_client: TestClient, db_session: Session):
    founder = create_user(db_session, "Bob Founder", "bob@shellfree.com", "founder")
    startup = create_startup(db_session, founder, "Shell Free Corp", "shell-free")
    set_auth(test_client, founder)

    # Submit verification
    payload = {
        "legal_entity_name": "Shell Free Corp Inc",
        "registration_type": "Corporation (C-Corp / S-Corp)",
        "registration_number": "EIN-987654321",
        "document_url": "https://shellfree.com/cert.pdf",
        "corporate_email": "team@shellfree.com",
    }
    test_client.post(f"/api/startups/{startup.id}/verification", json=payload)

    # Review as verified
    rev_res = test_client.post(
        f"/api/startups/{startup.id}/verification/review",
        json={"verification_status": "verified"},
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["verification_status"] == "verified"
    assert rev_res.json()["verified_at"] is not None

    # Startup now reports is_verified
    st_res = test_client.get(f"/api/startups/{startup.id}")
    assert st_res.status_code == 200
    assert st_res.json()["is_verified"] is True


def test_rejected_verification_blocks_publishing(test_client: TestClient, db_session: Session):
    founder = create_user(db_session, "Bad Actor", "fake@shellcompany.com", "founder")
    startup = create_startup(db_session, founder, "Fake Shell Co", "fake-shell-co")
    set_auth(test_client, founder)

    # Submit verification
    test_client.post(
        f"/api/startups/{startup.id}/verification",
        json={
            "legal_entity_name": "Fake Shell LLC",
            "registration_type": "Limited Liability Company (LLC)",
            "registration_number": "FAKE123",
        },
    )

    # Reject verification
    test_client.post(
        f"/api/startups/{startup.id}/verification/review",
        json={
            "verification_status": "rejected",
            "rejection_reason": "Forged incorporation documents detected.",
        },
    )

    # Create draft campaign
    campaign = Campaign(
        startup_id=startup.id,
        title="Malicious Shell Beta",
        slug="malicious-shell-beta",
        summary="A shell test",
        description="Detailed description exceeding ten chars",
        access_instructions="Go to http://fake.com and login",
        product_type="Web App",
        reward_type=REWARD_TYPE_UNPAID,
        testing_tasks=[{"title": "Test Task 1", "description": "Do this"}],
        status=CAMPAIGN_STATUS_DRAFT,
    )
    db_session.add(campaign)
    db_session.commit()

    # Attempt to publish must fail with 400
    pub_res = test_client.post(f"/api/campaigns/{campaign.id}/publish")
    assert pub_res.status_code == 400
    assert "Startup business verification was rejected" in pub_res.json()["detail"]


# ==============================================================================
# Tester Credibility, Resume, Certs & Reviews Tests
# ==============================================================================


def test_tester_resume_crud(test_client: TestClient, db_session: Session):
    tester = create_user(db_session, "Sam Tester", "sam@testers.io", "tester")
    set_auth(test_client, tester)

    resume_payload = {
        "resume_url": "https://storage.example.com/resumes/sam_cv.pdf",
        "file_name": "sam_cv.pdf",
        "github_url": "https://github.com/samtester",
        "portfolio_url": "https://samtester.dev",
        "specializations": ["Manual Functional Testing", "API & Backend Testing (Postman/REST/GraphQL)"],
    }

    res = test_client.put("/api/testers/me/resume", json=resume_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["file_name"] == "sam_cv.pdf"
    assert "Manual Functional Testing" in data["specializations"]


def test_tester_certifications(test_client: TestClient, db_session: Session):
    tester = create_user(db_session, "Carol QA", "carol@qa.org", "tester")
    set_auth(test_client, tester)

    cert_payload = {
        "name": "ISTQB Certified Tester Foundation Level",
        "issuing_organization": "ISTQB / Indian Testing Board",
        "credential_id": "CTFL-2024-8849",
        "credential_url": "https://istqb.org/verify/CTFL-2024-8849",
        "issue_date": str(date.today()),
    }

    res = test_client.post("/api/testers/me/certifications", json=cert_payload)
    assert res.status_code == 201
    cert_id = res.json()["id"]
    assert res.json()["verification_status"] == "verified"

    # Delete certification
    del_res = test_client.delete(f"/api/testers/me/certifications/{cert_id}")
    assert del_res.status_code == 204


def test_tester_endorsement_and_employer_reviews(test_client: TestClient, db_session: Session):
    founder = create_user(db_session, "Dave Founder", "dave@faststart.com", "founder")
    tester = create_user(db_session, "Eve Tester", "eve@testers.io", "tester")

    # Founder endorses tester
    set_auth(test_client, founder)
    end_res = test_client.post(
        f"/api/testers/{tester.id}/endorse",
        json={
            "skill_name": "API Testing",
            "endorsement_note": "Eve discovered critical race conditions in our v1 API.",
        },
    )
    assert end_res.status_code == 201
    assert end_res.json()["skill_name"] == "API Testing"

    # Founder leaves an employer/founder review
    rev_payload = {
        "reviewer_name": "Dave Founder",
        "reviewer_title": "CTO",
        "company_name": "FastStart Inc",
        "overall_rating": 5,
        "thoroughness_rating": 5,
        "responsiveness_rating": 5,
        "bug_report_quality_rating": 5,
        "review_text": "Exceptional tester. Clear repro steps with HAR logs and screen recordings.",
        "project_scope": "SaaS Platform Beta",
    }
    rev_res = test_client.post(f"/api/testers/{tester.id}/reviews", json=rev_payload)
    assert rev_res.status_code == 201
    assert rev_res.json()["overall_rating"] == 5

    # Check tester verification overview
    set_auth(test_client, tester)
    overview_res = test_client.get("/api/testers/me/overview")
    assert overview_res.status_code == 200
    ov_data = overview_res.json()
    assert ov_data["reviews_count"] == 1
    assert ov_data["average_rating"] == 5.0
    assert ov_data["endorsements_count"] == 1


def test_cannot_self_endorse_or_self_review(test_client: TestClient, db_session: Session):
    tester = create_user(db_session, "Frank Tester", "frank@testers.io", "tester")
    set_auth(test_client, tester)

    # Self-endorsement must fail
    res1 = test_client.post(
        f"/api/testers/{tester.id}/endorse",
        json={"skill_name": "Security Testing"},
    )
    assert res1.status_code == 400

    # Self-review must fail
    res2 = test_client.post(
        f"/api/testers/{tester.id}/reviews",
        json={
            "reviewer_name": "Frank Tester",
            "company_name": "Self",
            "overall_rating": 5,
            "review_text": "I am the best tester ever in the world.",
        },
    )
    assert res2.status_code == 400

