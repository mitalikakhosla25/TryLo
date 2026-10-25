"""FastAPI Campaign Application and Screening Endpoints for TryLo."""

import logging
import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.application import (
    CampaignApplication,
    APPLICATION_STATUS_ACCEPTED,
    APPLICATION_STATUS_PENDING,
    APPLICATION_STATUS_REJECTED,
    ALLOWED_APPLICATION_STATUSES,
)
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_ARCHIVED,
    CAMPAIGN_STATUS_CLOSED,
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_PUBLISHED,
)
from app.models.startup import Startup
from app.models.user import User
from app.schemas.application import (
    ApplicationStatusChangeResponse,
    ApplicationStatusCheckResponse,
    CampaignAccessInstructionsResponse,
    CampaignApplicationCreateRequest,
    CampaignApplicationDetailResponse,
    CampaignApplicationRejectRequest,
    CampaignApplicationResponse,
    FounderApplicationDetailResponse,
    FounderApplicationItemResponse,
    FounderApplicationListResponse,
    TesterPublicProfile,
)

logger = logging.getLogger("trylo.applications")

router = APIRouter(tags=["Applications"])


def validate_tester_profile_completed(user: User) -> None:
    """Ensure the user is an active tester with a completed onboarding profile."""
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not active.",
        )
    if user.role != "tester":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tester accounts can apply to beta testing campaigns.",
        )
    # Check tester profile
    profile = user.tester_profile
    if not profile or not profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must complete your tester onboarding profile before applying to campaigns.",
        )


@router.post(
    "/api/campaigns/{campaign_id}/applications",
    response_model=CampaignApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Submit an application to a published campaign",
    description="Allows an authenticated tester with a completed profile to apply to an active published campaign.",
)
def submit_campaign_application(
    campaign_id: uuid.UUID,
    payload: CampaignApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignApplicationResponse:
    """Submit a new campaign application."""
    validate_tester_profile_completed(current_user)

    # 1. Look up campaign
    campaign = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    # 2. Check campaign status
    if campaign.status == CAMPAIGN_STATUS_DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply to draft campaigns. Only published campaigns accept applications.",
        )
    if campaign.status == CAMPAIGN_STATUS_CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This campaign is closed and no longer accepting applications.",
        )
    if campaign.status == CAMPAIGN_STATUS_ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This campaign is archived and no longer accepting applications.",
        )
    if campaign.status != CAMPAIGN_STATUS_PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot apply to campaign with status '{campaign.status}'. Only published campaigns accept applications.",
        )

    # 3. Check application deadline
    if campaign.application_deadline is not None:
        deadline = campaign.application_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if deadline < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The application deadline for this campaign has expired.",
            )

    # 4. Check for duplicate application
    existing_app = db.scalar(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.tester_id == current_user.id,
        )
    )
    if existing_app is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted an application to this campaign.",
        )

    # 5. Validate screening answers against campaign's configured questions
    configured_questions = campaign.screening_questions or []
    q_map = {q["id"]: q for q in configured_questions if "id" in q}

    # Reject unknown question IDs
    for ans_qid in payload.screening_answers.keys():
        if ans_qid not in q_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid screening question ID '{ans_qid}'. It is not configured for this campaign.",
            )

    # Validate each configured question
    for qid, q in q_map.items():
        ans = payload.screening_answers.get(qid)
        is_required = q.get("is_required", True)
        q_type = q.get("question_type", "text")
        prompt = q.get("prompt", "Question")

        # Check required
        if ans is None or (isinstance(ans, str) and not ans.strip()):
            if is_required:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Answer is required for screening question: '{prompt}'.",
                )
            continue

        # Type-specific validation
        if q_type == "text":
            if not isinstance(ans, str):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Answer for '{prompt}' must be a text string.",
                )
            if len(ans) > 2000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Answer for '{prompt}' exceeds the maximum allowed length of 2000 characters.",
                )
            if "<script" in ans.lower() or "</script" in ans.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="HTML script tags are not permitted in screening answers.",
                )

        elif q_type == "single_choice":
            options = q.get("options", [])
            if str(ans) not in options:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Answer for '{prompt}' must be one of the configured choices: {options}.",
                )

        elif q_type == "boolean":
            valid_bool_strings = ["true", "false", "yes", "no"]
            if not isinstance(ans, bool) and str(ans).lower() not in valid_bool_strings:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Answer for '{prompt}' must be a boolean (yes/no).",
                )

    # 6. Create application
    application = CampaignApplication(
        campaign_id=campaign.id,
        tester_id=current_user.id,
        status=APPLICATION_STATUS_PENDING,
        screening_answers=payload.screening_answers,
        motivation=payload.motivation,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    logger.info(
        "Tester %s submitted application [id=%s] for campaign %s",
        current_user.id,
        application.id,
        campaign.id,
    )
    return application


@router.get(
    "/api/applications/me",
    response_model=List[CampaignApplicationDetailResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="List all applications submitted by the authenticated tester",
    description="Returns all campaign applications submitted by the current tester with associated public campaign details.",
)
def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CampaignApplicationDetailResponse]:
    """Retrieve all applications submitted by the current tester."""
    stmt = (
        select(CampaignApplication)
        .options(
            joinedload(CampaignApplication.campaign).joinedload(Campaign.startup)
        )
        .where(CampaignApplication.tester_id == current_user.id)
        .order_by(CampaignApplication.created_at.desc())
    )
    applications = db.scalars(stmt).unique().all()

    result = []
    for app in applications:
        camp = app.campaign
        startup = camp.startup if camp else None
        result.append(
            CampaignApplicationDetailResponse(
                id=app.id,
                campaign_id=app.campaign_id,
                tester_id=app.tester_id,
                status=app.status,
                screening_answers=app.screening_answers or {},
                motivation=app.motivation,
                created_at=app.created_at,
                updated_at=app.updated_at,
                campaign_title=camp.title if camp else "",
                campaign_slug=camp.slug if camp else "",
                campaign_summary=camp.summary if camp else None,
                campaign_product_type=camp.product_type if camp else None,
                startup_name=startup.name if startup else "",
                startup_slug=startup.slug if startup else "",
                startup_logo_url=startup.logo_url if startup else None,
                reward_type=camp.reward_type if camp else "unpaid",
                reward_amount=float(camp.reward_amount) if (camp and camp.reward_amount is not None) else None,
                reward_currency=camp.reward_currency if camp else None,
                reward_description=camp.reward_description if camp else None,
                testing_start_date=camp.testing_start_date if camp else None,
                testing_end_date=camp.testing_end_date if camp else None,
                application_deadline=camp.application_deadline if camp else None,
            )
        )
    return result


@router.get(
    "/api/applications/{application_id}",
    response_model=CampaignApplicationDetailResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Get single application by ID for current tester",
    description="Retrieves a specific application belonging to the current tester. Returns 404 for non-existent or other testers' applications.",
)
def get_my_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignApplicationDetailResponse:
    """Retrieve an application belonging to the current tester."""
    stmt = (
        select(CampaignApplication)
        .options(
            joinedload(CampaignApplication.campaign).joinedload(Campaign.startup)
        )
        .where(
            CampaignApplication.id == application_id,
            CampaignApplication.tester_id == current_user.id,
        )
    )
    app = db.scalar(stmt)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    camp = app.campaign
    startup = camp.startup if camp else None
    return CampaignApplicationDetailResponse(
        id=app.id,
        campaign_id=app.campaign_id,
        tester_id=app.tester_id,
        status=app.status,
        screening_answers=app.screening_answers or {},
        motivation=app.motivation,
        created_at=app.created_at,
        updated_at=app.updated_at,
        campaign_title=camp.title if camp else "",
        campaign_slug=camp.slug if camp else "",
        campaign_summary=camp.summary if camp else None,
        campaign_product_type=camp.product_type if camp else None,
        startup_name=startup.name if startup else "",
        startup_slug=startup.slug if startup else "",
        startup_logo_url=startup.logo_url if startup else None,
        reward_type=camp.reward_type if camp else "unpaid",
        reward_amount=float(camp.reward_amount) if (camp and camp.reward_amount is not None) else None,
        reward_currency=camp.reward_currency if camp else None,
        reward_description=camp.reward_description if camp else None,
        testing_start_date=camp.testing_start_date if camp else None,
        testing_end_date=camp.testing_end_date if camp else None,
        application_deadline=camp.application_deadline if camp else None,
    )


@router.get(
    "/api/campaigns/{campaign_id}/application-status",
    response_model=ApplicationStatusCheckResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Check if current tester has applied to a campaign",
    description="Returns whether the current tester has applied to this campaign, and if so, returns the application record.",
)
def check_campaign_application_status(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationStatusCheckResponse:
    """Check application status for current tester on a specific campaign."""
    app = db.scalar(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign_id,
            CampaignApplication.tester_id == current_user.id,
        )
    )
    if app is not None:
        return ApplicationStatusCheckResponse(applied=True, application=app)
    return ApplicationStatusCheckResponse(applied=False, application=None)


# ==============================================================================
# Helper Functions for Founder Application Management
# ==============================================================================


def get_owned_campaign(campaign_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> Campaign:
    """
    Retrieve campaign by ID verifying that it belongs to a startup owned by the current founder.
    Returns 404 for non-existent or cross-founder campaigns to prevent resource enumeration.
    """
    stmt = (
        select(Campaign)
        .options(joinedload(Campaign.startup))
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            Campaign.id == campaign_id,
            Startup.owner_id == user_id,
        )
    )
    campaign = db.scalar(stmt)
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )
    return campaign


def build_tester_public_profile(user: Optional[User]) -> TesterPublicProfile:
    """Safely extracts public tester attributes for founder evaluation without exposing private auth data."""
    if user is None:
        return TesterPublicProfile(
            user_id=uuid.UUID(int=0),
            full_name="Unknown Tester",
        )
    profile = user.tester_profile
    return TesterPublicProfile(
        user_id=user.id,
        full_name=user.full_name,
        bio=profile.bio if profile else None,
        skills=profile.skills if profile else [],
        interests=profile.interests if profile else [],
        experience_level=profile.experience_level if profile else None,
        devices=profile.devices if profile else [],
        city=profile.city if profile else None,
        country=profile.country if profile else None,
        linkedin_url=profile.linkedin_url if profile else None,
    )


# ==============================================================================
# Founder Application Review & Management Endpoints
# ==============================================================================


@router.get(
    "/api/campaigns/{campaign_id}/applications",
    response_model=FounderApplicationListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="List applications for a specific campaign (founder only)",
    description="Returns submitted applications, applicant profiles, and campaign capacity for a campaign owned by the founder.",
)
def list_campaign_applications(
    campaign_id: uuid.UUID,
    status: Optional[str] = Query(None, description="Filter by pending, accepted, rejected"),
    search: Optional[str] = Query(None, description="Search by tester name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderApplicationListResponse:
    """Retrieve applications submitted for an owned campaign with filtering, search, and capacity calculation."""
    campaign = get_owned_campaign(campaign_id=campaign_id, user_id=current_user.id, db=db)

    accepted_testers = db.scalar(
        select(func.count(CampaignApplication.id)).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    ) or 0
    is_full = bool(campaign.max_testers is not None and accepted_testers >= campaign.max_testers)

    # Base query for applications joined with tester and tester_profile
    stmt = (
        select(CampaignApplication)
        .options(
            joinedload(CampaignApplication.tester).joinedload(User.tester_profile),
            joinedload(CampaignApplication.campaign).joinedload(Campaign.startup),
        )
        .join(User, CampaignApplication.tester_id == User.id)
        .where(CampaignApplication.campaign_id == campaign.id)
    )

    count_stmt = (
        select(func.count(CampaignApplication.id))
        .join(User, CampaignApplication.tester_id == User.id)
        .where(CampaignApplication.campaign_id == campaign.id)
    )

    if status and status.strip():
        clean_status = status.strip().lower()
        if clean_status in ALLOWED_APPLICATION_STATUSES:
            stmt = stmt.where(CampaignApplication.status == clean_status)
            count_stmt = count_stmt.where(CampaignApplication.status == clean_status)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(User.full_name.ilike(search_pattern))
        count_stmt = count_stmt.where(User.full_name.ilike(search_pattern))

    total = db.scalar(count_stmt) or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    apps = db.scalars(
        stmt.order_by(CampaignApplication.created_at.desc()).offset(offset).limit(page_size)
    ).unique().all()

    items = []
    for app in apps:
        camp = app.campaign
        startup = camp.startup if camp else None
        items.append(
            FounderApplicationItemResponse(
                id=app.id,
                campaign_id=app.campaign_id,
                campaign_title=camp.title if camp else "",
                campaign_slug=camp.slug if camp else "",
                startup_id=startup.id if startup else uuid.UUID(int=0),
                startup_name=startup.name if startup else "",
                startup_slug=startup.slug if startup else "",
                tester_id=app.tester_id,
                tester=build_tester_public_profile(app.tester),
                status=app.status,
                screening_answers=app.screening_answers or {},
                motivation=app.motivation,
                rejection_note=app.rejection_note,
                created_at=app.created_at,
                updated_at=app.updated_at,
            )
        )

    return FounderApplicationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        accepted_testers=accepted_testers,
        max_testers=campaign.max_testers,
        is_full=is_full,
    )


@router.get(
    "/api/founder/applications",
    response_model=FounderApplicationListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="List applications across all founder campaigns",
    description="Returns submitted applications across all campaigns and startups owned by the authenticated founder.",
)
def list_all_founder_applications(
    status: Optional[str] = Query(None, description="Filter by pending, accepted, rejected"),
    campaign_id: Optional[uuid.UUID] = Query(None, description="Filter by campaign ID"),
    search: Optional[str] = Query(None, description="Search by tester or campaign name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderApplicationListResponse:
    """Retrieve all applications for the founder's campaigns with filtering and search."""
    stmt = (
        select(CampaignApplication)
        .options(
            joinedload(CampaignApplication.tester).joinedload(User.tester_profile),
            joinedload(CampaignApplication.campaign).joinedload(Campaign.startup),
        )
        .join(Campaign, CampaignApplication.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .join(User, CampaignApplication.tester_id == User.id)
        .where(Startup.owner_id == current_user.id)
    )

    count_stmt = (
        select(func.count(CampaignApplication.id))
        .join(Campaign, CampaignApplication.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .join(User, CampaignApplication.tester_id == User.id)
        .where(Startup.owner_id == current_user.id)
    )

    if campaign_id:
        stmt = stmt.where(CampaignApplication.campaign_id == campaign_id)
        count_stmt = count_stmt.where(CampaignApplication.campaign_id == campaign_id)

    if status and status.strip():
        clean_status = status.strip().lower()
        if clean_status in ALLOWED_APPLICATION_STATUSES:
            stmt = stmt.where(CampaignApplication.status == clean_status)
            count_stmt = count_stmt.where(CampaignApplication.status == clean_status)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                User.full_name.ilike(search_pattern),
                Campaign.title.ilike(search_pattern),
            )
        )
        count_stmt = count_stmt.where(
            or_(
                User.full_name.ilike(search_pattern),
                Campaign.title.ilike(search_pattern),
            )
        )

    total = db.scalar(count_stmt) or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    apps = db.scalars(
        stmt.order_by(CampaignApplication.created_at.desc()).offset(offset).limit(page_size)
    ).unique().all()

    items = []
    for app in apps:
        camp = app.campaign
        startup = camp.startup if camp else None
        items.append(
            FounderApplicationItemResponse(
                id=app.id,
                campaign_id=app.campaign_id,
                campaign_title=camp.title if camp else "",
                campaign_slug=camp.slug if camp else "",
                startup_id=startup.id if startup else uuid.UUID(int=0),
                startup_name=startup.name if startup else "",
                startup_slug=startup.slug if startup else "",
                tester_id=app.tester_id,
                tester=build_tester_public_profile(app.tester),
                status=app.status,
                screening_answers=app.screening_answers or {},
                motivation=app.motivation,
                rejection_note=app.rejection_note,
                created_at=app.created_at,
                updated_at=app.updated_at,
            )
        )

    total_accepted = db.scalar(
        select(func.count(CampaignApplication.id))
        .join(Campaign, CampaignApplication.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            Startup.owner_id == current_user.id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    ) or 0

    return FounderApplicationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        accepted_testers=total_accepted,
        max_testers=None,
        is_full=False,
    )


@router.get(
    "/api/founder/applications/{application_id}",
    response_model=FounderApplicationDetailResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Get single application details for founder review",
    description="Returns detailed applicant evaluation data, screening answers, campaign questions, and capacity information.",
)
def get_founder_application_detail(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderApplicationDetailResponse:
    """Retrieve application details verifying founder startup ownership."""
    stmt = (
        select(CampaignApplication)
        .options(
            joinedload(CampaignApplication.tester).joinedload(User.tester_profile),
            joinedload(CampaignApplication.campaign).joinedload(Campaign.startup),
        )
        .join(Campaign, CampaignApplication.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            CampaignApplication.id == application_id,
            Startup.owner_id == current_user.id,
        )
    )
    app = db.scalar(stmt)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    camp = app.campaign
    startup = camp.startup if camp else None

    accepted_testers = db.scalar(
        select(func.count(CampaignApplication.id)).where(
            CampaignApplication.campaign_id == camp.id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    ) or 0
    is_full = bool(camp.max_testers is not None and accepted_testers >= camp.max_testers)

    return FounderApplicationDetailResponse(
        id=app.id,
        campaign_id=app.campaign_id,
        campaign_title=camp.title if camp else "",
        campaign_slug=camp.slug if camp else "",
        campaign_status=camp.status if camp else "",
        startup_id=startup.id if startup else uuid.UUID(int=0),
        startup_name=startup.name if startup else "",
        startup_slug=startup.slug if startup else "",
        tester_id=app.tester_id,
        tester=build_tester_public_profile(app.tester),
        status=app.status,
        screening_answers=app.screening_answers or {},
        screening_questions=camp.screening_questions or [] if camp else [],
        motivation=app.motivation,
        rejection_note=app.rejection_note,
        created_at=app.created_at,
        updated_at=app.updated_at,
        accepted_testers=accepted_testers,
        max_testers=camp.max_testers if camp else None,
        is_full=is_full,
    )


@router.post(
    "/api/founder/applications/{application_id}/accept",
    response_model=ApplicationStatusChangeResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Accept a tester application",
    description="Accepts a pending application, enforcing max_testers capacity under transactional concurrency lock.",
)
def accept_campaign_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationStatusChangeResponse:
    """
    Accepts a pending application:
    1. Verifies that the current founder owns the campaign's startup.
    2. Validates that the application is currently in 'pending' status.
    3. Acquires a concurrency lock on the campaign row.
    4. Confirms that the campaign is still published.
    5. Counts accepted applications and enforces max_testers capacity limit.
    6. Updates application status to 'accepted' atomically.
    """
    # 1. Retrieve application with ownership check
    stmt = (
        select(CampaignApplication)
        .join(Campaign, CampaignApplication.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            CampaignApplication.id == application_id,
            Startup.owner_id == current_user.id,
        )
    )
    application = db.scalar(stmt)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    # 2. Check current application status
    if application.status == APPLICATION_STATUS_ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has already been accepted.",
        )
    if application.status == APPLICATION_STATUS_REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot accept a rejected application.",
        )
    if application.status != APPLICATION_STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only pending applications may be accepted. Current status is '{application.status}'.",
        )

    # 3. Lock campaign row for update
    campaign = db.scalar(
        select(Campaign).where(Campaign.id == application.campaign_id).with_for_update()
    )
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )
    if campaign.status != CAMPAIGN_STATUS_PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept applications for a campaign with status '{campaign.status}'. Only published campaigns are eligible.",
        )

    # 4. Count accepted applications inside the locked transaction
    accepted_count = db.scalar(
        select(func.count(CampaignApplication.id)).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    ) or 0

    # 5. Check capacity limit
    if campaign.max_testers is not None and accepted_count >= campaign.max_testers:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign has reached maximum capacity ({campaign.max_testers} testers). Cannot accept more applicants.",
        )

    # 6. Apply status transition atomically
    application.status = APPLICATION_STATUS_ACCEPTED
    application.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)

    new_accepted_count = accepted_count + 1
    logger.info(
        "Founder %s accepted application %s for campaign %s (now %s/%s testers)",
        current_user.id,
        application.id,
        campaign.id,
        new_accepted_count,
        campaign.max_testers or "unlimited",
    )

    return ApplicationStatusChangeResponse(
        id=application.id,
        campaign_id=application.campaign_id,
        tester_id=application.tester_id,
        status=application.status,
        rejection_note=application.rejection_note,
        accepted_testers=new_accepted_count,
        max_testers=campaign.max_testers,
        is_full=bool(campaign.max_testers is not None and new_accepted_count >= campaign.max_testers),
        updated_at=application.updated_at,
    )


@router.post(
    "/api/founder/applications/{application_id}/reject",
    response_model=ApplicationStatusChangeResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Reject a tester application",
    description="Rejects a pending application, optionally recording a private internal note.",
)
def reject_campaign_application(
    application_id: uuid.UUID,
    payload: Optional[CampaignApplicationRejectRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationStatusChangeResponse:
    """
    Rejects a pending application:
    1. Verifies that the current founder owns the campaign's startup.
    2. Validates that the application is currently in 'pending' status.
    3. Rejects terminal transitions from accepted or already rejected applications.
    4. Updates status to 'rejected' and persists optional internal note.
    """
    # 1. Retrieve application with ownership check
    stmt = (
        select(CampaignApplication)
        .join(Campaign, CampaignApplication.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            CampaignApplication.id == application_id,
            Startup.owner_id == current_user.id,
        )
    )
    application = db.scalar(stmt)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    # 2. Check current status
    if application.status == APPLICATION_STATUS_REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has already been rejected.",
        )
    if application.status == APPLICATION_STATUS_ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an already accepted application.",
        )
    if application.status != APPLICATION_STATUS_PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only pending applications may be rejected. Current status is '{application.status}'.",
        )

    # 3. Update status to rejected
    application.status = APPLICATION_STATUS_REJECTED
    if payload and payload.rejection_note:
        application.rejection_note = payload.rejection_note.strip()
    application.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)

    # Count accepted testers for capacity reporting
    accepted_count = db.scalar(
        select(func.count(CampaignApplication.id)).where(
            CampaignApplication.campaign_id == application.campaign_id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        )
    ) or 0

    camp = db.scalar(select(Campaign).where(Campaign.id == application.campaign_id))
    max_testers = camp.max_testers if camp else None

    logger.info(
        "Founder %s rejected application %s for campaign %s",
        current_user.id,
        application.id,
        application.campaign_id,
    )

    return ApplicationStatusChangeResponse(
        id=application.id,
        campaign_id=application.campaign_id,
        tester_id=application.tester_id,
        status=application.status,
        rejection_note=application.rejection_note,
        accepted_testers=accepted_count,
        max_testers=max_testers,
        is_full=bool(max_testers is not None and accepted_count >= max_testers),
        updated_at=application.updated_at,
    )


# ==============================================================================
# Private Access Instructions for Accepted Testers
# ==============================================================================


@router.get(
    "/api/campaigns/{campaign_id}/access",
    response_model=CampaignAccessInstructionsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Retrieve private access instructions (accepted testers only)",
    description="Returns confidential product access instructions exclusively to testers whose application has been accepted.",
)
def get_campaign_access_instructions(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignAccessInstructionsResponse:
    """
    Returns private product access instructions:
    - Tester must have a completed profile.
    - Campaign must exist and be eligible (not draft or archived).
    - Tester must have an accepted application for this exact campaign.
    """
    validate_tester_profile_completed(current_user)

    # 1. Look up campaign
    campaign = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    # 2. Verify campaign eligibility
    if campaign.status in (CAMPAIGN_STATUS_DRAFT, CAMPAIGN_STATUS_ARCHIVED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Campaign is in '{campaign.status}' status and cannot provide tester access.",
        )

    # 3. Check that the tester has an accepted application for this campaign
    app = db.scalar(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.tester_id == current_user.id,
        )
    )
    if app is None or app.status != APPLICATION_STATUS_ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access instructions are available exclusively to accepted testers for this campaign.",
        )

    return CampaignAccessInstructionsResponse(
        campaign_id=campaign.id,
        title=campaign.title,
        access_instructions=campaign.access_instructions,
        product_url=campaign.product_url,
    )

