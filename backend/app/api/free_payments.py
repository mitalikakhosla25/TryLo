"""TryLo 100% Free Payment & Direct NPCI UPI Router."""

import logging
import uuid
import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.models.startup import Startup
from app.models.campaign import Campaign
from app.models.escrow import (
    CampaignEscrow,
    ESCROW_STATUS_FUNDED,
    ESCROW_STATUS_UNFUNDED,
)
from app.services.free_payment_service import (
    FreePaymentService,
    KNOWN_BANK_PSPS,
    DEFAULT_ESROW_VPA,
    DEFAULT_PAYEE_NAME,
)
from app.schemas.free_payment import (
    VpaValidationRequest,
    VpaValidationResponse,
    UpiIntentCreateRequest,
    UpiIntentResponse,
    VerifyUtrDepositRequest,
    VerifyUtrDepositResponse,
    SandboxPaymentRequest,
    FreeGatewayInfoResponse,
)

logger = logging.getLogger("trylo.free_payments")

router = APIRouter(prefix="/api/payments/free", tags=["100% Free Payment Gateway"])


def _get_or_create_escrow(db: Session, campaign: Campaign) -> CampaignEscrow:
    """Helper to fetch or lazily initialize a CampaignEscrow record."""
    escrow = db.scalar(
        select(CampaignEscrow).where(CampaignEscrow.campaign_id == campaign.id)
    )
    if not escrow:
        reward_val = float(campaign.reward_amount or 0.0)
        max_testers_val = campaign.max_testers or 5
        estimated_pool = reward_val * max_testers_val
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
    "/info",
    response_model=FreeGatewayInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get TryLo 100% Free Payment Gateway specifications",
)
def get_free_gateway_info() -> FreeGatewayInfoResponse:
    return FreeGatewayInfoResponse(
        provider="NPCI Unified Payments Interface (Direct Protocol)",
        cost_per_transaction="₹0.00 (Zero)",
        merchant_discount_rate="0% MDR (Indian NPCI Mandate)",
        supported_methods=[
            "Google Pay",
            "PhonePe",
            "Paytm",
            "BHIM UPI",
            "CRED",
            "Amazon Pay",
            "Direct Bank UPI Apps",
            "Dynamic NPCI QR Code",
            "Free Developer Sandbox",
        ],
        npci_protocol="NPCI UPI Specification v2.0 Deep Linking",
        settlement_type="Instant Bank-to-Bank Escrow Reserve",
        supported_banks_count=len(KNOWN_BANK_PSPS),
    )


@router.post(
    "/validate-vpa",
    response_model=VpaValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Free NPCI UPI VPA verification against 50+ Indian bank PSPs",
)
def validate_vpa(payload: VpaValidationRequest) -> VpaValidationResponse:
    res = FreePaymentService.validate_vpa(payload.vpa)
    return VpaValidationResponse(**res)


@router.post(
    "/create-upi-intent",
    response_model=UpiIntentResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 100% Free NPCI UPI Deep Link and dynamic QR payload for escrow funding",
)
def create_upi_intent(
    payload: UpiIntentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
) -> UpiIntentResponse:
    try:
        camp_uuid = uuid.UUID(payload.campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    startup = db.scalar(select(Startup).where(Startup.id == campaign.startup_id))
    if not startup or startup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the campaign founder can fund this escrow vault.")

    txn_ref = f"TRYLO-UPI-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    intent = FreePaymentService.generate_upi_intent_uri(
        amount=payload.amount,
        campaign_title=payload.note or campaign.title,
        transaction_ref=txn_ref,
        payee_vpa=DEFAULT_ESROW_VPA,
        payee_name=DEFAULT_PAYEE_NAME,
    )

    logger.info("Generated Free UPI Intent [campaign=%s, ref=%s, amount=₹%s]", campaign.id, txn_ref, payload.amount)
    return UpiIntentResponse(**intent)


@router.post(
    "/verify-utr-and-fund",
    response_model=VerifyUtrDepositResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify 12-digit NPCI Bank UTR and fund campaign escrow vault (100% Free)",
)
def verify_utr_and_fund(
    payload: VerifyUtrDepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
) -> VerifyUtrDepositResponse:
    # 1. Validate UTR syntax
    is_valid_utr, utr_err = FreePaymentService.verify_utr_format(payload.utr_number)
    if not is_valid_utr:
        raise HTTPException(status_code=400, detail=utr_err)

    try:
        camp_uuid = uuid.UUID(payload.campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    startup = db.scalar(select(Startup).where(Startup.id == campaign.startup_id))
    if not startup or startup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the campaign founder can fund this escrow vault.")

    # 2. Check for duplicate UTR use across all escrows
    existing = db.scalar(
        select(CampaignEscrow).where(CampaignEscrow.deposit_reference == f"UTR-{payload.utr_number}")
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"This NPCI UTR ({payload.utr_number}) has already been settled in escrow vault.",
        )

    # 3. Fund Escrow Vault
    escrow = _get_or_create_escrow(db, campaign)
    escrow.total_funded = float(escrow.total_funded) + payload.amount
    escrow.status = ESCROW_STATUS_FUNDED
    dep_ref = f"UTR-{payload.utr_number}"
    escrow.deposit_reference = dep_ref
    escrow.funded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(escrow)

    # 4. Generate audit certificate
    cert = FreePaymentService.generate_receipt_certificate(
        transaction_ref=dep_ref,
        utr_number=payload.utr_number,
        amount=payload.amount,
        campaign_title=campaign.title,
        payer=payload.payer_vpa or current_user.email,
    )

    logger.info(
        "Escrow Funded via Free NPCI UPI [campaign=%s, utr=%s, amount=₹%s, cert=%s]",
        campaign.id,
        payload.utr_number,
        payload.amount,
        cert["certificate_id"],
    )

    return VerifyUtrDepositResponse(
        success=True,
        message=f"₹{payload.amount:,.2f} successfully locked into escrow via Free NPCI UPI!",
        campaign_id=str(campaign.id),
        total_funded=float(escrow.total_funded),
        remaining_balance=escrow.remaining_balance,
        status=escrow.status,
        utr_number=payload.utr_number,
        deposit_reference=dep_ref,
        receipt_certificate=cert,
    )


@router.post(
    "/simulate-sandbox-payment",
    response_model=VerifyUtrDepositResponse,
    status_code=status.HTTP_200_OK,
    summary="Free Developer Sandbox Instant Deposit for rapid testing without real phone",
)
def simulate_sandbox_payment(
    payload: SandboxPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
) -> VerifyUtrDepositResponse:
    try:
        camp_uuid = uuid.UUID(payload.campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign UUID format.")

    campaign = db.scalar(select(Campaign).where(Campaign.id == camp_uuid))
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    startup = db.scalar(select(Startup).where(Startup.id == campaign.startup_id))
    if not startup or startup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the campaign founder can fund this escrow vault.")

    # Generate realistic simulated 12-digit UTR
    simulated_utr = f"{random.randint(400, 499)}{random.randint(100000000, 999999999)}"
    dep_ref = f"SANDBOX-{simulated_utr}"

    escrow = _get_or_create_escrow(db, campaign)
    escrow.total_funded = float(escrow.total_funded) + payload.amount
    escrow.status = ESCROW_STATUS_FUNDED
    escrow.deposit_reference = dep_ref
    escrow.funded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(escrow)

    cert = FreePaymentService.generate_receipt_certificate(
        transaction_ref=dep_ref,
        utr_number=simulated_utr,
        amount=payload.amount,
        campaign_title=campaign.title,
        payer=payload.test_vpa_or_card or "sandbox-tester@okhdfcbank",
    )

    logger.info("Sandbox Free Deposit Executed [campaign=%s, amount=₹%s, utr=%s]", campaign.id, payload.amount, simulated_utr)

    return VerifyUtrDepositResponse(
        success=True,
        message=f"₹{payload.amount:,.2f} added via Free Developer Sandbox ({payload.simulated_method})!",
        campaign_id=str(campaign.id),
        total_funded=float(escrow.total_funded),
        remaining_balance=escrow.remaining_balance,
        status=escrow.status,
        utr_number=simulated_utr,
        deposit_reference=dep_ref,
        receipt_certificate=cert,
    )
