"""Automated Tests for TryLo Escrow Vault, Simulated UPI Payouts, Analytics & CSV Export."""

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
from app.models.profile import TesterProfile, FounderProfile
from app.models.escrow import CampaignEscrow, TesterPayout

TesterProfile.__test__ = False
TesterPayout.__test__ = False


def seed_test_user(db: Session, full_name: str, email: str, role: str) -> User:
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


def test_escrow_deposit_and_upi_disbursal_flow(test_client: TestClient, db_session: Session):
    # 1. Create Founder & Tester
    founder = seed_test_user(db_session, "Aarav Founder", f"founder_{uuid.uuid4().hex[:6]}@test.io", "founder")
    tester = seed_test_user(db_session, "Rohan Tester", f"tester_{uuid.uuid4().hex[:6]}@test.io", "tester")

    tester_profile = TesterProfile(user_id=tester.id, upi_id="rohan@okaxis", bio="QA Tester")
    db_session.add(tester_profile)

    startup = Startup(owner_id=founder.id, name="FinTech Labs", slug=f"fintech-{uuid.uuid4().hex[:6]}")
    db_session.add(startup)
    db_session.commit()

    campaign = Campaign(
        startup_id=startup.id,
        title="Payment Gateway Beta",
        slug=f"pay-beta-{uuid.uuid4().hex[:6]}",
        status=CAMPAIGN_STATUS_PUBLISHED,
        summary="Test UPI checkout",
        description="Detailed description",
        access_instructions="Go to staging.pay.io",
        reward_amount=1500,
        reward_currency="INR",
        max_testers=10,
    )
    db_session.add(campaign)
    db_session.commit()

    # Create accepted application
    app = CampaignApplication(
        campaign_id=campaign.id,
        tester_id=tester.id,
        status=APPLICATION_STATUS_ACCEPTED,
    )
    db_session.add(app)
    db_session.commit()

    set_auth(test_client, founder)

    # 2. Check initial auto-initialized escrow (1500 * 10 = 15,000)
    res = test_client.get(f"/api/campaigns/{campaign.id}/escrow")
    assert res.status_code == 200
    assert res.json()["total_funded"] == 15000
    assert res.json()["remaining_balance"] == 15000

    # 3. Fund escrow with an extra ₹5,000
    res_fund = test_client.post(f"/api/campaigns/{campaign.id}/escrow/fund", json={"amount": 5000})
    assert res_fund.status_code == 200
    data_fund = res_fund.json()
    assert data_fund["total_funded"] == 20000
    assert data_fund["remaining_balance"] == 20000
    assert data_fund["status"] == "funded"

    # 4. Disburse payout of ₹1,500 to accepted tester
    res_disburse = test_client.post(
        f"/api/campaigns/{campaign.id}/payouts/disburse",
        json={
            "tester_id": str(tester.id),
            "amount": 1500,
            "milestone_type": "task_completion",
            "notes": "Approved milestone 1",
        },
    )
    assert res_disburse.status_code == 201
    payout_data = res_disburse.json()
    assert payout_data["amount"] == 1500
    assert payout_data["upi_id"] == "rohan@okaxis"
    assert len(payout_data["utr_number"]) == 12  # Simulated 12-digit NPCI UTR
    assert payout_data["status"] == "completed"

    # 5. Check updated escrow balance (20,000 - 1,500 = 18,500)
    res_check = test_client.get(f"/api/campaigns/{campaign.id}/escrow")
    assert res_check.status_code == 200
    assert res_check.json()["disbursed_amount"] == 1500
    assert res_check.json()["remaining_balance"] == 18500

    # 6. Check campaign analytics
    res_an = test_client.get(f"/api/campaigns/{campaign.id}/escrow/analytics")
    assert res_an.status_code == 200
    an_data = res_an.json()
    assert an_data["burn_rate_pct"] == 7.5  # 1500 / 20000 = 7.5%
    assert an_data["milestone_breakdown"]["task_completion"]["amount"] == 1500
    assert len(an_data["payouts"]) == 1

    # 7. Check CSV export
    res_csv = test_client.get(f"/api/campaigns/{campaign.id}/export/payouts-csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "rohan@okaxis" in res_csv.text

    # 8. Check Founder overview & macro CSV
    res_macro = test_client.get("/api/founder/escrow/overview")
    assert res_macro.status_code == 200
    assert res_macro.json()["total_escrow_funded"] == 20000
    assert res_macro.json()["total_escrow_disbursed"] == 1500

    res_macro_csv = test_client.get("/api/founder/export/payouts-csv")
    assert res_macro_csv.status_code == 200
    assert "TryLo Executive Portfolio Financial" in res_macro_csv.text

    # 9. Log in as Tester to check earnings
    set_auth(test_client, tester)
    res_earnings = test_client.get("/api/payouts/tester/my-earnings")
    assert res_earnings.status_code == 200
    earn_data = res_earnings.json()
    assert earn_data["lifetime_earnings"] == 1500
    assert earn_data["completed_payouts_count"] == 1
    assert earn_data["saved_upi_id"] == "rohan@okaxis"

    # 10. Update tester UPI VPA
    res_upi = test_client.put("/api/payouts/tester/upi", json={"upi_id": "rohan.new@okhdfcbank"})
    assert res_upi.status_code == 200
    assert res_upi.json()["upi_id"] == "rohan.new@okhdfcbank"
