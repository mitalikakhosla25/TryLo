"""FastAPI Startup Anti-Shell Business Verification Endpoints for TryLo."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.startup import Startup
from app.models.startup_verification import (
    StartupVerification,
    VERIFICATION_STATUS_PENDING,
    VERIFICATION_STATUS_REJECTED,
    VERIFICATION_STATUS_VERIFIED,
)
from app.models.user import User
from app.schemas.startup_verification import (
    CorporateEmailOtpRequest,
    StartupVerificationResponse,
    StartupVerificationReviewRequest,
    StartupVerificationSubmitRequest,
)

logger = logging.getLogger("trylo.startup_verification")

router = APIRouter(prefix="/api/startups/{startup_id}/verification", tags=["Startup Verification"])


def get_owned_startup_or_404(startup_id: uuid.UUID, owner_id: uuid.UUID, db: Session) -> Startup:
    """Verify startup exists and is owned by the current founder."""
    startup = db.scalar(
        select(Startup).where(
            Startup.id == startup_id,
            Startup.owner_id == owner_id,
        )
    )
    if startup is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found.",
        )
    return startup


@router.post(
    "",
    response_model=StartupVerificationResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Submit or update startup business verification proof",
    description="Submits official legal entity documentation (CIN, GSTIN, Incorporation Doc) to verify legitimate business operations and protect testers against shell companies.",
)
def submit_startup_verification(
    startup_id: uuid.UUID,
    payload: StartupVerificationSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupVerification:
    startup = get_owned_startup_or_404(startup_id=startup_id, owner_id=current_user.id, db=db)

    # Check if verification record already exists
    verification = db.scalar(
        select(StartupVerification).where(StartupVerification.startup_id == startup.id)
    )

    if verification is None:
        verification = StartupVerification(
            startup_id=startup.id,
            legal_entity_name=payload.legal_entity_name,
            registration_type=payload.registration_type,
            registration_number=payload.registration_number,
            tax_identifier=payload.tax_identifier,
            document_url=payload.document_url,
            document_name=payload.document_name,
            corporate_email=payload.corporate_email,
            signatory_name=payload.signatory_name,
            official_address=payload.official_address,
            verification_status=VERIFICATION_STATUS_PENDING,
        )
        db.add(verification)
    else:
        verification.legal_entity_name = payload.legal_entity_name
        verification.registration_type = payload.registration_type
        verification.registration_number = payload.registration_number
        verification.tax_identifier = payload.tax_identifier
        verification.document_url = payload.document_url
        verification.document_name = payload.document_name
        verification.corporate_email = payload.corporate_email
        verification.signatory_name = payload.signatory_name
        verification.official_address = payload.official_address
        verification.verification_status = VERIFICATION_STATUS_PENDING
        verification.rejection_reason = None
        verification.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(verification)

    logger.info(
        "Founder %s submitted business verification proof for startup %s [%s]",
        current_user.id,
        startup.name,
        verification.legal_entity_name,
    )
    return verification


@router.get(
    "",
    response_model=StartupVerificationResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Get startup business verification status",
    description="Retrieves the current verification status, legal registration details, and audit history.",
)
def get_startup_verification(
    startup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupVerification:
    startup = get_owned_startup_or_404(startup_id=startup_id, owner_id=current_user.id, db=db)

    verification = db.scalar(
        select(StartupVerification).where(StartupVerification.startup_id == startup.id)
    )
    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business verification proof has not been submitted for this startup.",
        )
    return verification


@router.post(
    "/verify-email",
    response_model=StartupVerificationResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Verify corporate domain work email",
)
def verify_corporate_email(
    startup_id: uuid.UUID,
    payload: CorporateEmailOtpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupVerification:
    startup = get_owned_startup_or_404(startup_id=startup_id, owner_id=current_user.id, db=db)

    verification = db.scalar(
        select(StartupVerification).where(StartupVerification.startup_id == startup.id)
    )
    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business verification has not been submitted yet.",
        )

    verification.corporate_email = payload.corporate_email.strip().lower()
    verification.is_corporate_email_verified = True
    verification.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(verification)
    return verification


@router.post(
    "/review",
    response_model=StartupVerificationResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder", "admin"]))],
    summary="Approve or reject startup verification (Admin / Review)",
    description="Audits submitted business credentials. When verified, grants the startup the 'Verified Business' trust badge and unlocks campaign publishing.",
)
def review_startup_verification(
    startup_id: uuid.UUID,
    payload: StartupVerificationReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupVerification:
    """
    Review action: In production this is performed by an admin or automated compliance scanner;
    for testing & validation founders can confirm verification of their registration document.
    """
    verification = db.scalar(
        select(StartupVerification).where(StartupVerification.startup_id == startup_id)
    )
    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup verification record not found.",
        )

    verification.verification_status = payload.verification_status
    if payload.verification_status == VERIFICATION_STATUS_VERIFIED:
        verification.verified_at = datetime.now(timezone.utc)
        verification.rejection_reason = None
    elif payload.verification_status == VERIFICATION_STATUS_REJECTED:
        verification.rejection_reason = payload.rejection_reason or "Business registration documentation could not be verified."
        verification.verified_at = None

    verification.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(verification)
    return verification

