"""Automated Tests for TryLo Simulated UPI & Escrow Payout Engine."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.startup import Startup
from app.models.campaign import Campaign
from app.models.application import CampaignApplication, APPLICATION_STATUS_ACCEPTED
from app.models.profile import TesterProfile


def create_user(db: Session, full_name: str, email: str, role: str) -> User:
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


def test_escrow_lifecycle_and_disbursement(test_client: TestClient, db_session: Session):
    founder = create_user(db_session, "Rajiv Founder", "rajiv.escrow@trylo.io", "founder")
    tester = create_user(db_session, "Karan Tester", "karan.escrow@trylo.io", "tester")

    profile = TesterProfile(
        user_id=tester.id,
        bio="Full-stack QA Automation Engineer",
        skills=["API Testing", "Manual Testing"],
        interests=["FinTech"],
        devices=["Windows", "Android Phone"],
        upi_id="karan@okhdfcbank",
    )
    db_session.add(profile)

    startup = Startup(
        owner_id=founder.id,
        name="FinTrust Labs",
        slug="fintrust-labs",
        tagline="Next-gen UPI Escrow",
    )
    db_session.add(startup)
    db_session.commit()
    db_session.refresh(startup)

    campaign = Campaign(
        startup_id=startup.id,
        title="UPI Checkout Beta",
        slug="upi-checkout-beta",
        status="published",
        reward_type="monetary",
        reward_amount=1000.0,
        max_testers=10,
    )
    db_session.add(campaign)
    db_session.commit()
    db_session.refresh(campaign)

    app = CampaignApplication(
        campaign_id=campaign.id,
        tester_id=tester.id,
        status=APPLICATION_STATUS_ACCEPTED,
        screening_answers={},
    )
    db_session.add(app)
    db_session.commit()

    # 1. Fetch Escrow balance as founder
    set_auth(test_client, founder)
    res = test_client.get(f"/api/campaigns/{campaign.id}/escrow")
    assert res.status_code == 200
    escrow_data = res.json()
    assert escrow_data["currency"] == "INR"
    assert escrow_data["total_funded"] == 10000.0
    assert escrow_data["remaining_balance"] == 10000.0

    # 2. Fund additional funds into Escrow
    fund_res = test_client.post(
        f"/api/campaigns/{campaign.id}/escrow/fund",
        json={"amount": 5000.0, "payment_method": "simulated_upi"},
    )
    assert fund_res.status_code == 200
    funded_data = fund_res.json()
    assert funded_data["total_funded"] == 15000.0
    assert funded_data["remaining_balance"] == 15000.0
    assert "TRYLO-DEP-" in funded_data["deposit_reference"]

    # 3. Disburse instant simulated UPI payout to tester
    payout_res = test_client.post(
        f"/api/campaigns/{campaign.id}/payouts/disburse",
        json={
            "tester_id": str(tester.id),
            "amount": 1000.0,
            "milestone_type": "task_completion",
            "notes": "Completed onboarding checkout test successfully.",
        },
    )
    assert payout_res.status_code == 201
    payout_data = payout_res.json()
    assert payout_data["amount"] == 1000.0
    assert payout_data["upi_id"] == "karan@okhdfcbank"
    assert "TRYLO-UPI-" in payout_data["reference_id"]
    assert len(payout_data["utr_number"]) == 12
    assert payout_data["status"] == "completed"

    # 4. Verify Escrow deduction
    res_after = test_client.get(f"/api/campaigns/{campaign.id}/escrow")
    assert res_after.json()["disbursed_amount"] == 1000.0
    assert res_after.json()["remaining_balance"] == 14000.0

    # 5. Switch auth to tester & view earnings
    set_auth(test_client, tester)
    earnings_res = test_client.get("/api/payouts/tester/my-earnings")
    assert earnings_res.status_code == 200
    earnings_data = earnings_res.json()
    assert earnings_data["lifetime_earnings"] == 1000.0
    assert earnings_data["completed_payouts_count"] == 1
    assert earnings_data["saved_upi_id"] == "karan@okhdfcbank"
    assert len(earnings_data["payouts"]) == 1
    assert earnings_data["payouts"][0]["utr_number"] == payout_data["utr_number"]

    # 6. Tester updates their preferred UPI ID
    update_upi_res = test_client.put(
        "/api/payouts/tester/upi",
        json={"upi_id": "karan.tester@paytm"},
    )
    assert update_upi_res.status_code == 200
    assert update_upi_res.json()["upi_id"] == "karan.tester@paytm"

    # 7. Switch auth back to founder & check overview
    set_auth(test_client, founder)
    overview_res = test_client.get("/api/founder/escrow/overview")
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["total_escrow_funded"] == 15000.0
    assert overview_data["total_escrow_disbursed"] == 1000.0
    assert overview_data["total_escrow_remaining"] == 14000.0
    assert len(overview_data["recent_disbursements"]) == 1


def test_escrow_insufficient_balance_rejected(test_client: TestClient, db_session: Session):
    founder = create_user(db_session, "Dev Founder", "dev.escrow@trylo.io", "founder")
    tester = create_user(db_session, "Amit Tester", "amit.escrow@trylo.io", "tester")

    startup = Startup(owner_id=founder.id, name="PaySwift", slug="payswift")
    db_session.add(startup)
    db_session.commit()

    campaign = Campaign(
        startup_id=startup.id,
        title="Micro Bounty Test",
        slug="micro-bounty",
        status="published",
        reward_type="monetary",
        reward_amount=500.0,
        max_testers=2,
    )
    db_session.add(campaign)
    db_session.commit()

    app = CampaignApplication(
        campaign_id=campaign.id,
        tester_id=tester.id,
        status=APPLICATION_STATUS_ACCEPTED,
        screening_answers={},
    )
    db_session.add(app)
    db_session.commit()

    set_auth(test_client, founder)
    res = test_client.post(
        f"/api/campaigns/{campaign.id}/payouts/disburse",
        json={
            "tester_id": str(tester.id),
            "amount": 50000.0,
            "milestone_type": "campaign_reward",
        },
    )
    assert res.status_code == 400
    assert "Insufficient escrow balance" in res.json()["detail"]
