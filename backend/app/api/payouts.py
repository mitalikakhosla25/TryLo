"""TryLo Escrow Vault and Simulated UPI Payout Router."""

import logging
import random
import uuid
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.models.startup import Startup
from app.models.campaign import Campaign
from app.models.profile import TesterProfile
from app.models.application import CampaignApplication, APPLICATION_STATUS_ACCEPTED
from app.models.escrow import (
    CampaignEscrow,
    TesterPayout,
    ESCROW_STATUS_UNFUNDED,
    ESCROW_STATUS_FUNDED,
    ESCROW_STATUS_DEPLETED,
    PAYOUT_STATUS_COMPLETED,
)
from app.schemas.payout import (
    EscrowResponse,
    FundEscrowRequest,
    DisbursePayoutRequest,
    PayoutResponse,
    TesterEarningsOverviewResponse,
    FounderEscrowOverviewResponse,
    UpdateUpiRequest,
    EscrowAnalyticsResponse,
)

logger = logging.getLogger("trylo.payouts")

router = APIRouter(prefix="/api", tags=["Escrow & Payouts"])


def _generate_utr() -> str:
    """Generate a realistic 12-digit simulated NPCI UPI UTR."""
    return f"{random.randint(400, 499)}{random.randint(100000000, 999999999)}"


def _get_or_create_escrow(db: Session, campaign: Campaign) -> CampaignEscrow:
    """Helper to fetch or lazily initialize a CampaignEscrow record."""
    escrow = db.scalar(
        select(CampaignEscrow).where(CampaignEscrow.campaign_id == campaign.id)
    )
    if not escrow:
        reward_val = float(campaign.reward_amount or 0.0)
        max_testers_val = campaign.max_testers or 5
        estimated_pool = reward_val * max_testers_val

        # Auto-fund if monetary campaign is already published
        is_funded = campaign.status == "published" and estimated_pool > 0
        escrow = CampaignEscrow(
            campaign_id=campaign.id,
            currency="INR",
            total_funded=estimated_pool if is_funded else 0.0,
            disbursed_amount=0.0,
            status=ESCROW_STATUS_FUNDED if is_funded else ESCROW_STATUS_UNFUNDED,
            deposit_reference=f"TRYLO-DEP-{uuid.uuid4().hex[:8].upper()}" if is_funded else None,
            funded_at=datetime.now(timezone.utc) if is_funded else None,
        )
        db.add(escrow)
        db.commit()
        db.refresh(escrow)
    return escrow


@router.get(
    "/campaigns/{campaign_id}/escrow",
    response_model=EscrowResponse,
    status_code=status.HTTP_200_OK,
    summary="Get campaign escrow vault balance and status",
)
def get_campaign_escrow(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EscrowResponse:
    try:
        camp_uuid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    escrow = _get_or_create_escrow(db, campaign)
    return EscrowResponse(
        id=str(escrow.id),
        campaign_id=str(escrow.campaign_id),
        currency=escrow.currency,
        total_funded=float(escrow.total_funded),
        disbursed_amount=float(escrow.disbursed_amount),
        remaining_balance=escrow.remaining_balance,
        status=escrow.status,
        deposit_reference=escrow.deposit_reference,
        funded_at=escrow.funded_at,
        created_at=escrow.created_at,
        updated_at=escrow.updated_at,
    )


@router.post(
    "/campaigns/{campaign_id}/escrow/fund",
    response_model=EscrowResponse,
    status_code=status.HTTP_200_OK,
    summary="Deposit funds into campaign escrow vault",
)
def fund_campaign_escrow(
    campaign_id: str,
    payload: FundEscrowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
) -> EscrowResponse:
    try:
        camp_uuid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    # Founder permission check
    startup = db.scalar(select(Startup).where(Startup.id == campaign.startup_id))
    if not startup or startup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the startup founder can fund this escrow vault.")

    escrow = _get_or_create_escrow(db, campaign)
    escrow.total_funded = float(escrow.total_funded) + payload.amount
    escrow.status = ESCROW_STATUS_FUNDED
    escrow.deposit_reference = f"TRYLO-DEP-{uuid.uuid4().hex[:8].upper()}"
    escrow.funded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(escrow)

    logger.info("Escrow vault funded [campaign_id=%s, amount=₹%s, reference=%s]", campaign.id, payload.amount, escrow.deposit_reference)
    return EscrowResponse(
        id=str(escrow.id),
        campaign_id=str(escrow.campaign_id),
        currency=escrow.currency,
        total_funded=float(escrow.total_funded),
        disbursed_amount=float(escrow.disbursed_amount),
        remaining_balance=escrow.remaining_balance,
        status=escrow.status,
        deposit_reference=escrow.deposit_reference,
        funded_at=escrow.funded_at,
        created_at=escrow.created_at,
        updated_at=escrow.updated_at,
    )


@router.post(
    "/campaigns/{campaign_id}/payouts/disburse",
    response_model=PayoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Disburse instant simulated UPI payout to a tester",
)
def disburse_payout(
    campaign_id: str,
    payload: DisbursePayoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
) -> PayoutResponse:
    try:
        camp_uuid = uuid.UUID(campaign_id)
        tester_uuid = uuid.UUID(payload.tester_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign or tester UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    # Founder permission check
    startup = db.scalar(select(Startup).where(Startup.id == campaign.startup_id))
    if not startup or startup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the campaign founder can disburse rewards.")

    # Verify tester
    tester = db.scalar(select(User).where(User.id == tester_uuid))
    if not tester or tester.role != "tester":
        raise HTTPException(status_code=404, detail="Tester user not found.")

    # Verify tester application status
    app = db.scalar(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == camp_uuid,
            CampaignApplication.tester_id == tester_uuid,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    )
    if not app:
        raise HTTPException(
            status_code=400,
            detail="Payout can only be disbursed to accepted testers of this campaign.",
        )

    # Check and lock escrow
    escrow = _get_or_create_escrow(db, campaign)
    if escrow.remaining_balance < payload.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient escrow balance. Available: ₹{escrow.remaining_balance:,.2f}, Requested: ₹{payload.amount:,.2f}. Please fund the escrow pool first.",
        )

    # Resolve UPI VPA
    tester_profile = db.scalar(select(TesterProfile).where(TesterProfile.user_id == tester_uuid))
    resolved_upi = (
        payload.upi_id
        or (tester_profile.upi_id if tester_profile and tester_profile.upi_id else None)
        or f"{tester.full_name.lower().replace(' ', '')}@oktrylo"
    )

    # Generate reference and 12-digit simulated NPCI UTR
    ref_id = f"TRYLO-UPI-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    utr_num = _generate_utr()

    # Deduct from escrow
    escrow.disbursed_amount = float(escrow.disbursed_amount) + payload.amount
    if escrow.remaining_balance <= 0:
        escrow.status = ESCROW_STATUS_DEPLETED

    # Create payout record
    task_progress_uuid = uuid.UUID(payload.task_progress_id) if payload.task_progress_id else None
    feedback_uuid = uuid.UUID(payload.feedback_id) if payload.feedback_id else None

    payout = TesterPayout(
        campaign_id=campaign.id,
        tester_id=tester.id,
        escrow_id=escrow.id,
        task_progress_id=task_progress_uuid,
        feedback_id=feedback_uuid,
        amount=payload.amount,
        currency="INR",
        upi_id=resolved_upi,
        reference_id=ref_id,
        utr_number=utr_num,
        status=PAYOUT_STATUS_COMPLETED,
        milestone_type=payload.milestone_type,
        notes=payload.notes,
        disbursed_at=datetime.now(timezone.utc),
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)

    logger.info("Simulated UPI Payout Disbursed [ref=%s, utr=%s, amount=₹%s, to=%s]", ref_id, utr_num, payload.amount, resolved_upi)

    return PayoutResponse(
        id=str(payout.id),
        campaign_id=str(payout.campaign_id),
        campaign_title=campaign.title,
        startup_name=startup.name,
        tester_id=str(payout.tester_id),
        tester_name=tester.full_name,
        amount=float(payout.amount),
        currency=payout.currency,
        upi_id=payout.upi_id,
        reference_id=payout.reference_id,
        utr_number=payout.utr_number,
        status=payout.status,
        milestone_type=payout.milestone_type,
        notes=payout.notes,
        disbursed_at=payout.disbursed_at,
        created_at=payout.created_at,
    )


@router.get(
    "/payouts/tester/my-earnings",
    response_model=TesterEarningsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get tester lifetime earnings and UPI payout history",
)
def get_tester_earnings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tester")),
) -> TesterEarningsOverviewResponse:
    payouts = db.scalars(
        select(TesterPayout)
        .where(TesterPayout.tester_id == current_user.id)
        .order_by(TesterPayout.disbursed_at.desc())
    ).all()

    profile = db.scalar(select(TesterProfile).where(TesterProfile.user_id == current_user.id))
    saved_upi = profile.upi_id if profile else None

    payout_responses = []
    total_earned = 0.0

    for p in payouts:
        total_earned += float(p.amount)
        camp = db.scalar(select(Campaign).where(Campaign.id == p.campaign_id))
        startup_name = camp.startup.name if camp and camp.startup else None
        camp_title = camp.title if camp else None

        payout_responses.append(
            PayoutResponse(
                id=str(p.id),
                campaign_id=str(p.campaign_id),
                campaign_title=camp_title,
                startup_name=startup_name,
                tester_id=str(p.tester_id),
                tester_name=current_user.full_name,
                amount=float(p.amount),
                currency=p.currency,
                upi_id=p.upi_id,
                reference_id=p.reference_id,
                utr_number=p.utr_number,
                status=p.status,
                milestone_type=p.milestone_type,
                notes=p.notes,
                disbursed_at=p.disbursed_at,
                created_at=p.created_at,
            )
        )

    return TesterEarningsOverviewResponse(
        lifetime_earnings=round(total_earned, 2),
        completed_payouts_count=len(payouts),
        saved_upi_id=saved_upi,
        payouts=payout_responses,
    )


@router.put(
    "/payouts/tester/upi",
    status_code=status.HTTP_200_OK,
    summary="Update tester's primary UPI ID for instant rewards",
)
def update_tester_upi(
    payload: UpdateUpiRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tester")),
):
    profile = db.scalar(select(TesterProfile).where(TesterProfile.user_id == current_user.id))
    if not profile:
        profile = TesterProfile(user_id=current_user.id, upi_id=payload.upi_id)
        db.add(profile)
    else:
        profile.upi_id = payload.upi_id

    db.commit()
    logger.info("Updated tester UPI ID [user_id=%s, upi=%s]", current_user.id, payload.upi_id)
    return {"message": "UPI ID updated successfully.", "upi_id": payload.upi_id}


@router.get(
    "/founder/escrow/overview",
    response_model=FounderEscrowOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get founder escrow portfolio and recent disbursements",
)
def get_founder_escrow_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
) -> FounderEscrowOverviewResponse:
    # Get all startups owned by this founder
    startups = db.scalars(select(Startup).where(Startup.owner_id == current_user.id)).all()
    startup_ids = [s.id for s in startups]

    if not startup_ids:
        return FounderEscrowOverviewResponse(
            total_escrow_funded=0.0,
            total_escrow_disbursed=0.0,
            total_escrow_remaining=0.0,
            active_escrow_campaigns_count=0,
            recent_disbursements=[],
        )

    campaigns = db.scalars(select(Campaign).where(Campaign.startup_id.in_(startup_ids))).all()
    campaign_ids = [c.id for c in campaigns]

    total_funded = 0.0
    total_disbursed = 0.0
    active_escrows_count = 0

    for camp in campaigns:
        escrow = db.scalar(select(CampaignEscrow).where(CampaignEscrow.campaign_id == camp.id))
        if escrow:
            total_funded += float(escrow.total_funded)
            total_disbursed += float(escrow.disbursed_amount)
            if escrow.status == ESCROW_STATUS_FUNDED:
                active_escrows_count += 1

    # Recent disbursements across founder's campaigns
    recent_payouts = db.scalars(
        select(TesterPayout)
        .where(TesterPayout.campaign_id.in_(campaign_ids))
        .order_by(TesterPayout.disbursed_at.desc())
        .limit(10)
    ).all()

    payout_responses = []
    for p in recent_payouts:
        camp = next((c for c in campaigns if c.id == p.campaign_id), None)
        startup = next((s for s in startups if camp and s.id == camp.startup_id), None)
        tester = db.scalar(select(User).where(User.id == p.tester_id))

        payout_responses.append(
            PayoutResponse(
                id=str(p.id),
                campaign_id=str(p.campaign_id),
                campaign_title=camp.title if camp else None,
                startup_name=startup.name if startup else None,
                tester_id=str(p.tester_id),
                tester_name=tester.full_name if tester else None,
                amount=float(p.amount),
                currency=p.currency,
                upi_id=p.upi_id,
                reference_id=p.reference_id,
                utr_number=p.utr_number,
                status=p.status,
                milestone_type=p.milestone_type,
                notes=p.notes,
                disbursed_at=p.disbursed_at,
                created_at=p.created_at,
            )
        )

    return FounderEscrowOverviewResponse(
        total_escrow_funded=round(total_funded, 2),
        total_escrow_disbursed=round(total_disbursed, 2),
        total_escrow_remaining=round(max(0.0, total_funded - total_disbursed), 2),
        active_escrow_campaigns_count=active_escrows_count,
        recent_disbursements=payout_responses,
    )


@router.get(
    "/campaigns/{campaign_id}/escrow/analytics",
    response_model=EscrowAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get campaign escrow financial analytics, burn rate, and velocity chart data",
)
def get_campaign_escrow_analytics(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EscrowAnalyticsResponse:
    try:
        camp_uuid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    escrow = _get_or_create_escrow(db, campaign)
    payouts = db.scalars(
        select(TesterPayout)
        .where(TesterPayout.campaign_id == camp_uuid)
        .order_by(TesterPayout.disbursed_at.desc())
    ).all()

    total_funded = float(escrow.total_funded)
    disbursed = float(escrow.disbursed_amount)
    remaining = escrow.remaining_balance
    burn_rate_pct = round((disbursed / total_funded * 100), 1) if total_funded > 0 else 0.0

    # Milestone breakdown
    milestones: Dict[str, Dict[str, Any]] = {
        "task_completion": {"count": 0, "amount": 0.0},
        "bug_bounty": {"count": 0, "amount": 0.0},
        "campaign_reward": {"count": 0, "amount": 0.0},
    }
    # Daily velocity
    daily_map: Dict[str, Dict[str, Any]] = {}

    payout_responses: List[PayoutResponse] = []
    startup_name = campaign.startup.name if campaign.startup else None

    for p in payouts:
        m_type = p.milestone_type if p.milestone_type in milestones else "task_completion"
        milestones[m_type]["count"] += 1
        milestones[m_type]["amount"] += float(p.amount)

        day_str = p.disbursed_at.strftime("%Y-%m-%d")
        if day_str not in daily_map:
            daily_map[day_str] = {"date": day_str, "amount": 0.0, "count": 0}
        daily_map[day_str]["amount"] += float(p.amount)
        daily_map[day_str]["count"] += 1

        tester = db.scalar(select(User).where(User.id == p.tester_id))
        payout_responses.append(
            PayoutResponse(
                id=str(p.id),
                campaign_id=str(p.campaign_id),
                campaign_title=campaign.title,
                startup_name=startup_name,
                tester_id=str(p.tester_id),
                tester_name=tester.full_name if tester else None,
                amount=float(p.amount),
                currency=p.currency,
                upi_id=p.upi_id,
                reference_id=p.reference_id,
                utr_number=p.utr_number,
                status=p.status,
                milestone_type=p.milestone_type,
                notes=p.notes,
                disbursed_at=p.disbursed_at,
                created_at=p.created_at,
            )
        )

    # Sort daily velocity chronologically
    daily_velocity = sorted(daily_map.values(), key=lambda x: x["date"])

    return EscrowAnalyticsResponse(
        campaign_id=str(campaign.id),
        total_funded=total_funded,
        disbursed_amount=disbursed,
        remaining_balance=remaining,
        burn_rate_pct=burn_rate_pct,
        milestone_breakdown=milestones,
        daily_velocity=daily_velocity,
        payouts=payout_responses,
    )


@router.get(
    "/campaigns/{campaign_id}/export/payouts-csv",
    summary="Download campaign financial payout audit ledger CSV",
)
def export_campaign_payouts_csv(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
):
    try:
        camp_uuid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    payouts = db.scalars(
        select(TesterPayout)
        .where(TesterPayout.campaign_id == camp_uuid)
        .order_by(TesterPayout.disbursed_at.desc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "TryLo Simulated NPCI UPI Payout Audit Report",
        f"Campaign: {campaign.title}",
        f"Exported At: {datetime.now(timezone.utc).isoformat()}",
    ])
    writer.writerow([])
    writer.writerow([
        "Transaction Reference",
        "Disbursed At (UTC)",
        "Milestone Reason",
        "Amount (INR)",
        "Recipient Name",
        "Recipient UPI VPA",
        "NPCI 12-Digit UTR",
        "Status",
        "Internal Notes",
    ])

    for p in payouts:
        tester = db.scalar(select(User).where(User.id == p.tester_id))
        writer.writerow([
            p.reference_id,
            p.disbursed_at.strftime("%Y-%m-%d %H:%M:%S"),
            p.milestone_type,
            f"{float(p.amount):.2f}",
            tester.full_name if tester else "N/A",
            p.upi_id,
            p.utr_number,
            p.status.upper(),
            p.notes or "",
        ])

    output.seek(0)
    filename = f"trylo_payouts_{campaign.slug}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/founder/export/payouts-csv",
    summary="Download founder portfolio financial payout audit ledger CSV",
)
def export_founder_payouts_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
):
    startups = db.scalars(select(Startup).where(Startup.owner_id == current_user.id)).all()
    startup_ids = [s.id for s in startups]
    campaigns = db.scalars(select(Campaign).where(Campaign.startup_id.in_(startup_ids))).all() if startup_ids else []
    camp_map = {c.id: c for c in campaigns}
    startup_map = {s.id: s for s in startups}

    payouts = db.scalars(
        select(TesterPayout)
        .where(TesterPayout.campaign_id.in_(list(camp_map.keys())))
        .order_by(TesterPayout.disbursed_at.desc())
    ).all() if camp_map else []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "TryLo Executive Portfolio Financial & UPI Settlement Audit Report",
        f"Founder: {current_user.full_name} ({current_user.email})",
        f"Exported At: {datetime.now(timezone.utc).isoformat()}",
    ])
    writer.writerow([])
    writer.writerow([
        "Startup",
        "Campaign Title",
        "Transaction Reference",
        "Disbursed At (UTC)",
        "Milestone Reason",
        "Amount (INR)",
        "Recipient Name",
        "Recipient UPI VPA",
        "NPCI 12-Digit UTR",
        "Settlement Status",
        "Notes",
    ])

    for p in payouts:
        camp = camp_map.get(p.campaign_id)
        startup = startup_map.get(camp.startup_id) if camp else None
        tester = db.scalar(select(User).where(User.id == p.tester_id))
        writer.writerow([
            startup.name if startup else "N/A",
            camp.title if camp else "N/A",
            p.reference_id,
            p.disbursed_at.strftime("%Y-%m-%d %H:%M:%S"),
            p.milestone_type,
            f"{float(p.amount):.2f}",
            tester.full_name if tester else "N/A",
            p.upi_id,
            p.utr_number,
            p.status.upper(),
            p.notes or "",
        ])

    output.seek(0)
    filename = f"trylo_portfolio_payouts_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


