"""FastAPI Tester Credibility, Resume, Certifications, Endorsements, and Employer Reviews Endpoints."""

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_role
from app.core.latex_ats import calculate_ats_score, validate_latex_source
from app.db.session import get_db
from app.models.profile import TesterProfile
from app.models.tester_verification import (
    CERT_STATUS_PENDING,
    CERT_STATUS_VERIFIED,
    TesterCertification,
    TesterEmployerReview,
    TesterEndorsement,
    TesterResume,
)
from app.models.user import User
from app.schemas.tester_verification import (
    AtsScorePreviewRequest,
    AtsScorePreviewResponse,
    TesterCertificationCreateRequest,
    TesterCertificationResponse,
    TesterEmployerReviewCreateRequest,
    TesterEmployerReviewResponse,
    TesterEndorsementCreateRequest,
    TesterEndorsementResponse,
    TesterResumeResponse,
    TesterResumeUpdateRequest,
    TesterVerificationOverviewResponse,
)

logger = logging.getLogger("trylo.tester_verification")

router = APIRouter(prefix="/api/testers", tags=["Tester Verification & Credibility"])


def _build_overview_response(tester: User) -> TesterVerificationOverviewResponse:
    """Helper to assemble a comprehensive verification overview for a tester."""
    profile = tester.tester_profile
    tier = profile.verification_tier if profile else 1
    tier_labels = {
        0: "Tier 0: Profile Incomplete",
        1: "Tier 1: Basic Profile",
        2: "Tier 2: Certified Tester",
        3: "Tier 3: Top-Rated Vetted Tester",
    }
    tier_label = tier_labels.get(tier, "Tier 1: Basic Profile")

    # Reviews and ratings
    reviews = [r for r in tester.received_reviews if r.is_verified]
    avg_rating = (
        round(sum(r.overall_rating for r in reviews) / len(reviews), 1)
        if reviews
        else 0.0
    )

    resume_resp = (
        TesterResumeResponse.model_validate(tester.tester_resume)
        if tester.tester_resume
        else None
    )

    cert_resps = [
        TesterCertificationResponse.model_validate(c)
        for c in tester.tester_certifications
    ]

    endorsement_resps = [
        TesterEndorsementResponse(
            id=e.id,
            tester_id=e.tester_id,
            endorser_id=e.endorser_id,
            endorser_name=e.endorser.full_name if e.endorser else "Anonymous User",
            skill_name=e.skill_name,
            endorsement_note=e.endorsement_note,
            created_at=e.created_at,
        )
        for e in tester.received_endorsements
    ]

    review_resps = [
        TesterEmployerReviewResponse.model_validate(r) for r in reviews
    ]

    ats_score = tester.tester_resume.ats_score if tester.tester_resume else None
    is_latex_verified = bool(tester.tester_resume.is_latex_verified) if tester.tester_resume else False

    return TesterVerificationOverviewResponse(
        tester_id=tester.id,
        verification_tier=tier,
        tier_label=tier_label,
        has_resume=bool(tester.tester_resume and tester.tester_resume.resume_url),
        ats_score=ats_score,
        is_latex_verified=is_latex_verified,
        resume=resume_resp,
        certifications_count=len(cert_resps),
        certifications=cert_resps,
        endorsements_count=len(endorsement_resps),
        endorsements=endorsement_resps,
        reviews_count=len(review_resps),
        average_rating=avg_rating,
        reviews=review_resps,
    )


@router.get(
    "/me/overview",
    response_model=TesterVerificationOverviewResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Get current tester verification overview",
    description="Retrieves the authenticated tester's complete verification status, resume, certificates, endorsements, and employer ratings.",
)
def get_my_verification_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TesterVerificationOverviewResponse:
    tester = db.scalar(
        select(User)
        .options(
            joinedload(User.tester_profile),
            joinedload(User.tester_resume),
            joinedload(User.tester_certifications),
            joinedload(User.received_endorsements).joinedload(TesterEndorsement.endorser),
            joinedload(User.received_reviews),
        )
        .where(User.id == current_user.id)
    )
    if tester is None:
        raise HTTPException(status_code=404, detail="Tester user not found.")
    return _build_overview_response(tester)


@router.get(
    "/{tester_id}/overview",
    response_model=TesterVerificationOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get public verification overview of a tester",
    description="Allows founders and viewers to verify a tester's credentials, experience certificates, endorsements, and past employer ratings before accepting their application.",
)
def get_tester_verification_overview(
    tester_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TesterVerificationOverviewResponse:
    tester = db.scalar(
        select(User)
        .options(
            joinedload(User.tester_profile),
            joinedload(User.tester_resume),
            joinedload(User.tester_certifications),
            joinedload(User.received_endorsements).joinedload(TesterEndorsement.endorser),
            joinedload(User.received_reviews),
        )
        .where(User.id == tester_id)
    )
    if tester is None or tester.role != "tester":
        raise HTTPException(status_code=404, detail="Tester not found.")
    return _build_overview_response(tester)


@router.put(
    "/me/resume",
    response_model=TesterResumeResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Update or upload resume & portfolio links",
)
def update_tester_resume(
    payload: TesterResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TesterResume:
    resume = db.scalar(
        select(TesterResume).where(TesterResume.tester_id == current_user.id)
    )

    ats_score = None
    ats_breakdown = None
    ats_feedback = None
    is_latex_verified = False

    # Strictly enforce LaTeX format for resumes:
    if payload.latex_source is not None and payload.latex_source.strip():
        is_valid, error_msg = validate_latex_source(payload.latex_source)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_msg or "Invalid LaTeX format. Only LaTeX-based resumes are accepted.",
            )
        try:
            ats_res = calculate_ats_score(payload.latex_source)
            ats_score = ats_res["ats_score"]
            ats_breakdown = ats_res["breakdown"]
            ats_feedback = ats_res["feedback"]
            is_latex_verified = True
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"LaTeX Resume ATS calculation failed: {str(e)}",
            )
    elif payload.file_name is not None and not payload.file_name.lower().endswith(".tex"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only LaTeX-based resumes (.tex) are accepted for ATS scoring and verification.",
        )
    elif (payload.resume_url is not None or payload.file_name is not None) and (resume is None or not resume.is_latex_verified):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume source must be valid LaTeX code. Please upload a .tex file or provide LaTeX source code.",
        )

    if resume is None:
        resume = TesterResume(
            tester_id=current_user.id,
            resume_url=payload.resume_url,
            file_name=payload.file_name,
            github_url=payload.github_url,
            portfolio_url=payload.portfolio_url,
            bug_bounty_url=payload.bug_bounty_url,
            specializations=payload.specializations,
            latex_source=payload.latex_source,
            ats_score=ats_score,
            ats_breakdown=ats_breakdown,
            ats_feedback=ats_feedback,
            is_latex_verified=is_latex_verified,
        )
        db.add(resume)
    else:
        if payload.resume_url is not None:
            resume.resume_url = payload.resume_url
        if payload.file_name is not None:
            resume.file_name = payload.file_name
        if payload.github_url is not None:
            resume.github_url = payload.github_url
        if payload.portfolio_url is not None:
            resume.portfolio_url = payload.portfolio_url
        if payload.bug_bounty_url is not None:
            resume.bug_bounty_url = payload.bug_bounty_url
        if payload.specializations is not None:
            resume.specializations = payload.specializations
        if payload.latex_source is not None and payload.latex_source.strip():
            resume.latex_source = payload.latex_source
            resume.ats_score = ats_score
            resume.ats_breakdown = ats_breakdown
            resume.ats_feedback = ats_feedback
            resume.is_latex_verified = is_latex_verified
        resume.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(resume)
    return resume


@router.post(
    "/me/resume/ats-preview",
    response_model=AtsScorePreviewResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Preview ATS score and feedback for a LaTeX resume without saving",
)
def preview_ats_score(payload: AtsScorePreviewRequest) -> AtsScorePreviewResponse:
    is_valid, err = validate_latex_source(payload.latex_source)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=err or "Invalid LaTeX source code. Ensure \\documentclass and \\begin{document} are present.",
        )
    result = calculate_ats_score(payload.latex_source)
    return AtsScorePreviewResponse(**result)


@router.post(
    "/me/certifications",
    response_model=TesterCertificationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Add an experience certificate or QA credential",
)
def add_certification(
    payload: TesterCertificationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TesterCertification:
    # Auto-verify credentials with a verifiable link, else pending
    initial_status = CERT_STATUS_VERIFIED if payload.credential_url else CERT_STATUS_PENDING

    cert = TesterCertification(
        tester_id=current_user.id,
        name=payload.name,
        issuing_organization=payload.issuing_organization,
        credential_id=payload.credential_id,
        credential_url=payload.credential_url,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        verification_status=initial_status,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete(
    "/me/certifications/{cert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Delete a certification",
)
def delete_certification(
    cert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cert = db.scalar(
        select(TesterCertification).where(
            TesterCertification.id == cert_id,
            TesterCertification.tester_id == current_user.id,
        )
    )
    if cert is None:
        raise HTTPException(status_code=404, detail="Certification not found.")
    db.delete(cert)
    db.commit()
    return None


@router.post(
    "/{tester_id}/endorse",
    response_model=TesterEndorsementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Endorse a tester for a skill",
)
def endorse_tester_skill(
    tester_id: uuid.UUID,
    payload: TesterEndorsementCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TesterEndorsementResponse:
    if current_user.id == tester_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot endorse your own skills.",
        )

    tester = db.scalar(select(User).where(User.id == tester_id))
    if tester is None or tester.role != "tester":
        raise HTTPException(status_code=404, detail="Tester not found.")

    # Check for existing endorsement
    existing = db.scalar(
        select(TesterEndorsement).where(
            TesterEndorsement.tester_id == tester_id,
            TesterEndorsement.endorser_id == current_user.id,
            TesterEndorsement.skill_name == payload.skill_name,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already endorsed this tester for '{payload.skill_name}'.",
        )

    endorsement = TesterEndorsement(
        tester_id=tester_id,
        endorser_id=current_user.id,
        skill_name=payload.skill_name,
        endorsement_note=payload.endorsement_note,
    )
    db.add(endorsement)
    db.commit()
    db.refresh(endorsement)

    return TesterEndorsementResponse(
        id=endorsement.id,
        tester_id=endorsement.tester_id,
        endorser_id=endorsement.endorser_id,
        endorser_name=current_user.full_name,
        skill_name=endorsement.skill_name,
        endorsement_note=endorsement.endorsement_note,
        created_at=endorsement.created_at,
    )


@router.post(
    "/{tester_id}/reviews",
    response_model=TesterEmployerReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an employer or founder review for a tester",
    description="Leaves an official performance rating and feedback review for a tester who completed testing tasks.",
)
def create_tester_review(
    tester_id: uuid.UUID,
    payload: TesterEmployerReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TesterEmployerReview:
    if current_user.id == tester_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot review your own tester profile.",
        )

    tester = db.scalar(select(User).where(User.id == tester_id))
    if tester is None or tester.role != "tester":
        raise HTTPException(status_code=404, detail="Tester not found.")

    review = TesterEmployerReview(
        tester_id=tester_id,
        reviewer_id=current_user.id,
        campaign_id=payload.campaign_id,
        reviewer_name=payload.reviewer_name,
        reviewer_title=payload.reviewer_title,
        company_name=payload.company_name,
        overall_rating=payload.overall_rating,
        thoroughness_rating=payload.thoroughness_rating,
        responsiveness_rating=payload.responsiveness_rating,
        bug_report_quality_rating=payload.bug_report_quality_rating,
        review_text=payload.review_text,
        project_scope=payload.project_scope,
        is_verified=True,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get(
    "/{tester_id}/reviews",
    response_model=List[TesterEmployerReviewResponse],
    status_code=status.HTTP_200_OK,
    summary="List all verified employer reviews for a tester",
)
def list_tester_reviews(
    tester_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> List[TesterEmployerReview]:
    stmt = (
        select(TesterEmployerReview)
        .where(
            TesterEmployerReview.tester_id == tester_id,
            TesterEmployerReview.is_verified == True,
        )
        .order_by(TesterEmployerReview.created_at.desc())
    )
    reviews = db.scalars(stmt).all()
    return list(reviews)

