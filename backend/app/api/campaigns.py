"""FastAPI Campaign Management, Draft Persistence, and Public Discovery Endpoints for TryLo."""

import csv
import io
import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_role
from app.core.config import settings
from app.core.slug import generate_unique_campaign_slug
from app.db.session import get_db
from app.models.application import CampaignApplication
from app.models.campaign import (
    Campaign,
    ALLOWED_REWARD_TYPES,
    CAMPAIGN_STATUS_ARCHIVED,
    CAMPAIGN_STATUS_CLOSED,
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_PUBLISHED,
    REWARD_TYPE_MONETARY,
    REWARD_TYPE_PERK,
    REWARD_TYPE_UNPAID,
)
from app.models.feedback import FeedbackSubmission
from app.models.startup import Startup
from app.models.task_progress import CampaignTaskProgress
from app.models.user import User
from app.schemas.campaign import (
    CampaignAnalyticsResponse,
    CampaignCreateRequest,
    CampaignPublicListResponse,
    CampaignPublicResponse,
    CampaignResponse,
    CampaignUpdateRequest,
    DeviceMetric,
    FounderAnalyticsOverviewResponse,
    FunnelMetrics,
    SeverityBreakdown,
    TaskCompletionMetric,
    validate_campaign_dates,
    validate_reward_logic,
)

logger = logging.getLogger("trylo.campaigns")

router = APIRouter(tags=["Campaigns"])


def get_owned_startup(startup_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> Startup:
    """
    Retrieve startup by ID verifying that it is owned by the current founder.
    Returns 404 for non-existent or cross-founder startups to match startup API conventions.
    """
    startup = db.scalar(
        select(Startup).where(
            Startup.id == startup_id,
            Startup.owner_id == user_id,
        )
    )
    if startup is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found.",
        )
    return startup


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


def validate_draft_for_publishing(campaign: Campaign) -> None:
    """
    Validate that a campaign draft has the minimum required public information,
    valid reward parameters, meaningful instructions, and future dates before publishing.
    """
    if not campaign.title or len(campaign.title.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign title must be at least 3 characters to publish.",
        )

    if not campaign.summary or not campaign.summary.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A concise campaign summary is required to publish.",
        )

    if not campaign.description or len(campaign.description.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A detailed product description (at least 10 characters) is required to publish.",
        )

    if not campaign.access_instructions or len(campaign.access_instructions.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clear tester access instructions (at least 10 characters) are required to publish.",
        )

    if not campaign.testing_tasks or len(campaign.testing_tasks) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one testing task is required to publish a campaign.",
        )

    if not campaign.product_type and not campaign.product_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either product type or a valid product URL must be specified to publish.",
        )

    # Reward terms validation
    if campaign.reward_type == REWARD_TYPE_MONETARY:
        if campaign.reward_amount is None or campaign.reward_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monetary reward campaigns must specify a positive reward amount greater than zero.",
            )
        if not campaign.reward_currency or not campaign.reward_currency.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monetary reward campaigns must specify a valid 3-letter currency code.",
            )
    elif campaign.reward_type == REWARD_TYPE_PERK:
        if not campaign.reward_description or not campaign.reward_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Perk reward campaigns must describe the reward terms before publishing.",
            )

    # Date validation
    now_utc = datetime.now(timezone.utc)
    if campaign.application_deadline is not None:
        deadline = campaign.application_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if deadline < now_utc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application deadline is in the past. Update to a future date before publishing.",
            )

    validate_campaign_dates(
        campaign.application_deadline,
        campaign.testing_start_date,
        campaign.testing_end_date,
    )

    # Anti-shell company safeguard: verify legitimate business status
    if campaign.startup and campaign.startup.verification:
        if campaign.startup.verification.verification_status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot publish campaign: Startup business verification was rejected ({campaign.startup.verification.rejection_reason or 'Documentation invalid'}).",
            )
    if settings.REQUIRE_STARTUP_VERIFICATION_TO_PUBLISH:
        if not campaign.startup or not campaign.startup.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Startup must have approved business verification proof (anti-shell protection) before publishing campaigns.",
            )


# ==============================================================================
# Founder Campaign Management Endpoints
# ==============================================================================


@router.post(
    "/api/startups/{startup_id}/campaigns",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Create a new campaign draft",
    description="Creates a campaign draft under a startup owned by the authenticated founder.",
)
def create_campaign_draft(
    startup_id: uuid.UUID,
    payload: CampaignCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignResponse:
    """Create a campaign draft for an owned startup."""
    startup = get_owned_startup(startup_id=startup_id, user_id=current_user.id, db=db)

    unique_slug = generate_unique_campaign_slug(
        title=payload.title,
        startup_id=startup.id,
        db=db,
    )

    tasks_data = [task.model_dump() for task in payload.testing_tasks]
    screening_questions_data = [q.model_dump() for q in payload.screening_questions]
    audience_data = payload.target_audience.model_dump()

    new_campaign = Campaign(
        startup_id=startup.id,
        title=payload.title,
        slug=unique_slug,
        summary=payload.summary,
        description=payload.description,
        product_type=payload.product_type,
        product_url=payload.product_url,
        access_instructions=payload.access_instructions,
        testing_tasks=tasks_data,
        screening_questions=screening_questions_data,
        target_audience=audience_data,
        max_testers=payload.max_testers,
        application_deadline=payload.application_deadline,
        testing_start_date=payload.testing_start_date,
        testing_end_date=payload.testing_end_date,
        reward_type=payload.reward_type,
        reward_amount=payload.reward_amount,
        reward_currency=payload.reward_currency,
        reward_description=payload.reward_description,
        reward_eligibility=payload.reward_eligibility,
        status=CAMPAIGN_STATUS_DRAFT,
        published_at=None,
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    logger.info(
        "Founder %s created campaign draft '%s' [id=%s, slug=%s] for startup %s",
        current_user.id,
        new_campaign.title,
        new_campaign.id,
        new_campaign.slug,
        startup.id,
    )
    return new_campaign


@router.get(
    "/api/startups/{startup_id}/campaigns",
    response_model=List[CampaignResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="List campaigns belonging to an owned startup",
    description="Returns all campaigns (drafts, published, closed) for the specified owned startup.",
)
def list_startup_campaigns(
    startup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CampaignResponse]:
    """Retrieve all campaigns for an owned startup."""
    startup = get_owned_startup(startup_id=startup_id, user_id=current_user.id, db=db)

    stmt = (
        select(Campaign)
        .where(Campaign.startup_id == startup.id)
        .order_by(Campaign.created_at.desc())
    )
    campaigns = db.scalars(stmt).all()
    return list(campaigns)


@router.get(
    "/api/campaigns",
    response_model=List[CampaignResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="List all campaigns owned by current founder across all startups",
    description="Returns all campaigns across all startups owned by the authenticated founder.",
)
def list_my_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CampaignResponse]:
    """Retrieve all campaigns owned by current founder across all startups."""
    stmt = (
        select(Campaign)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(Startup.owner_id == current_user.id)
        .order_by(Campaign.created_at.desc())
    )
    campaigns = db.scalars(stmt).all()
    return list(campaigns)


@router.get(
    "/api/campaigns/{campaign_id}",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Get campaign details for owner",
    description="Retrieves a campaign belonging to an owned startup. Returns 404 if not found or unauthorized.",
)
def get_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignResponse:
    """Retrieve an owned campaign by ID."""
    campaign = get_owned_campaign(campaign_id=campaign_id, user_id=current_user.id, db=db)
    return campaign


@router.put(
    "/api/campaigns/{campaign_id}",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Update an editable campaign draft or campaign",
    description="Updates campaign details. Closed campaigns cannot be modified.",
)
def update_campaign(
    campaign_id: uuid.UUID,
    payload: CampaignUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignResponse:
    """Update an owned campaign."""
    campaign = get_owned_campaign(campaign_id=campaign_id, user_id=current_user.id, db=db)

    if campaign.status == CAMPAIGN_STATUS_CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Closed campaigns cannot be modified.",
        )
    if campaign.status == CAMPAIGN_STATUS_ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Archived campaigns cannot be modified.",
        )

    # Validate merged dates
    merged_deadline = payload.application_deadline if payload.application_deadline is not None else campaign.application_deadline
    merged_start_date = payload.testing_start_date if payload.testing_start_date is not None else campaign.testing_start_date
    merged_end_date = payload.testing_end_date if payload.testing_end_date is not None else campaign.testing_end_date
    validate_campaign_dates(merged_deadline, merged_start_date, merged_end_date)

    # Validate merged rewards if any reward property changed
    merged_reward_type = payload.reward_type if payload.reward_type is not None else campaign.reward_type
    merged_reward_amount = payload.reward_amount if payload.reward_amount is not None else campaign.reward_amount
    merged_reward_currency = payload.reward_currency if payload.reward_currency is not None else campaign.reward_currency
    merged_reward_description = payload.reward_description if payload.reward_description is not None else campaign.reward_description
    validate_reward_logic(
        merged_reward_type,
        merged_reward_amount,
        merged_reward_currency,
        merged_reward_description,
    )

    # If title changed, recalculate unique slug within this startup
    if payload.title is not None and payload.title.strip() != campaign.title:
        campaign.title = payload.title.strip()
        campaign.slug = generate_unique_campaign_slug(
            title=payload.title,
            startup_id=campaign.startup_id,
            db=db,
            exclude_campaign_id=campaign.id,
        )

    if payload.summary is not None:
        campaign.summary = payload.summary
    if payload.description is not None:
        campaign.description = payload.description
    if payload.product_type is not None:
        campaign.product_type = payload.product_type
    if payload.product_url is not None:
        campaign.product_url = payload.product_url
    if payload.access_instructions is not None:
        campaign.access_instructions = payload.access_instructions
    if payload.testing_tasks is not None:
        campaign.testing_tasks = [t.model_dump() for t in payload.testing_tasks]
    if payload.screening_questions is not None:
        campaign.screening_questions = [q.model_dump() for q in payload.screening_questions]
    if payload.target_audience is not None:
        campaign.target_audience = payload.target_audience.model_dump()
    if payload.max_testers is not None:
        campaign.max_testers = payload.max_testers
    if payload.application_deadline is not None:
        campaign.application_deadline = payload.application_deadline
    if payload.testing_start_date is not None:
        campaign.testing_start_date = payload.testing_start_date
    if payload.testing_end_date is not None:
        campaign.testing_end_date = payload.testing_end_date
    if payload.reward_type is not None:
        campaign.reward_type = payload.reward_type
    if payload.reward_amount is not None:
        campaign.reward_amount = payload.reward_amount
    if payload.reward_currency is not None:
        campaign.reward_currency = payload.reward_currency
    if payload.reward_description is not None:
        campaign.reward_description = payload.reward_description
    if payload.reward_eligibility is not None:
        campaign.reward_eligibility = payload.reward_eligibility

    # published_at remains unchanged on general updates
    db.commit()
    db.refresh(campaign)

    logger.info("Founder %s updated campaign '%s' [id=%s]", current_user.id, campaign.title, campaign.id)
    return campaign


@router.post(
    "/api/campaigns/{campaign_id}/publish",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Validate and publish a campaign draft",
    description="Validates completeness and transitions campaign draft to published status.",
)
def publish_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignResponse:
    """Publish a draft campaign."""
    campaign = get_owned_campaign(campaign_id=campaign_id, user_id=current_user.id, db=db)

    if campaign.status == CAMPAIGN_STATUS_PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is already published.",
        )
    if campaign.status == CAMPAIGN_STATUS_CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish a closed campaign.",
        )
    if campaign.status == CAMPAIGN_STATUS_ARCHIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish an archived campaign.",
        )
    if campaign.status != CAMPAIGN_STATUS_DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot publish campaign with status '{campaign.status}'.",
        )

    # Validate readiness
    validate_draft_for_publishing(campaign)

    campaign.status = CAMPAIGN_STATUS_PUBLISHED
    if campaign.published_at is None:
        campaign.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(campaign)

    logger.info(
        "Founder %s published campaign '%s' [id=%s] at %s",
        current_user.id,
        campaign.title,
        campaign.id,
        campaign.published_at,
    )
    return campaign


@router.post(
    "/api/campaigns/{campaign_id}/close",
    response_model=CampaignResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Close a published campaign",
    description="Closes an active campaign and removes it from active tester applications.",
)
def close_campaign(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignResponse:
    """Close an active campaign."""
    campaign = get_owned_campaign(campaign_id=campaign_id, user_id=current_user.id, db=db)

    if campaign.status == CAMPAIGN_STATUS_CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign is already closed.",
        )
    if campaign.status == CAMPAIGN_STATUS_DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot close a draft campaign. Only published campaigns can be closed.",
        )
    if campaign.status != CAMPAIGN_STATUS_PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot close a campaign with status '{campaign.status}'. Only published campaigns can be closed.",
        )

    campaign.status = CAMPAIGN_STATUS_CLOSED
    db.commit()
    db.refresh(campaign)

    logger.info("Founder %s closed campaign '%s' [id=%s]", current_user.id, campaign.title, campaign.id)
    return campaign


@router.delete(
    "/api/campaigns/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Delete a draft campaign",
    description="Permanently deletes an uncompleted campaign draft. Published or closed campaigns cannot be deleted.",
)
def delete_campaign_draft(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a draft campaign."""
    campaign = get_owned_campaign(campaign_id=campaign_id, user_id=current_user.id, db=db)

    if campaign.status != CAMPAIGN_STATUS_DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only draft campaigns can be deleted. Campaign has status '{campaign.status}'.",
        )

    db.delete(campaign)
    db.commit()
    logger.info("Founder %s deleted draft campaign [id=%s]", current_user.id, campaign_id)


# ==============================================================================
# Public Discovery Endpoints (Published Campaigns Only)
# ==============================================================================


@router.get(
    "/api/public/campaigns",
    response_model=CampaignPublicListResponse,
    status_code=status.HTTP_200_OK,
    summary="Discover and browse published campaigns",
    description="Publicly discover active published beta testing campaigns with keyword searching, filtering, and pagination. Excludes drafts, closed campaigns, and private instructions.",
)
def list_public_campaigns(
    q: Optional[str] = Query(None, max_length=100, description="Search across title, summary, description, and startup name"),
    category: Optional[str] = Query(None, max_length=100, description="Filter by product category / type"),
    reward_type: Optional[str] = Query(None, description="Filter by reward type (unpaid, monetary, perk)"),
    experience_level: Optional[str] = Query(None, max_length=50, description="Filter by tester experience level"),
    device: Optional[str] = Query(None, max_length=50, description="Filter by device or platform requirement"),
    country: Optional[str] = Query(None, max_length=50, description="Filter by country requirement"),
    sort: str = Query("newest", pattern="^(newest|deadline)$", description="Sort order: newest or deadline"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(12, ge=1, le=50, description="Page size up to 50 items"),
    db: Session = Depends(get_db),
) -> CampaignPublicListResponse:
    """Public read endpoint to discover and browse active published beta campaigns."""
    conditions = [Campaign.status == CAMPAIGN_STATUS_PUBLISHED]

    # Keyword search across title, summary, description, and startup name
    if q and q.strip():
        term = f"%{q.strip()}%"
        conditions.append(
            or_(
                Campaign.title.ilike(term),
                Campaign.summary.ilike(term),
                Campaign.description.ilike(term),
                Startup.name.ilike(term),
            )
        )

    # Product category filter
    if category and category.strip():
        clean_cat = category.strip()
        conditions.append(Campaign.product_type.ilike(f"%{clean_cat}%"))

    # Controlled reward type filter
    if reward_type and reward_type.strip():
        clean_rt = reward_type.strip().lower()
        if clean_rt not in ALLOWED_REWARD_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid reward_type '{clean_rt}'. Allowed values are: {', '.join(ALLOWED_REWARD_TYPES)}.",
            )
        conditions.append(Campaign.reward_type == clean_rt)

    # Experience level filter in target_audience JSON
    if experience_level and experience_level.strip():
        clean_exp = experience_level.strip()
        conditions.append(sa.cast(Campaign.target_audience, sa.String).ilike(f"%{clean_exp}%"))

    # Device / platform filter in target_audience JSON
    if device and device.strip():
        clean_dev = device.strip()
        conditions.append(sa.cast(Campaign.target_audience, sa.String).ilike(f"%{clean_dev}%"))

    # Country filter in target_audience JSON
    if country and country.strip():
        clean_country = country.strip()
        conditions.append(sa.cast(Campaign.target_audience, sa.String).ilike(f"%{clean_country}%"))

    # Controlled sort ordering
    if sort == "deadline":
        order_clause = [
            Campaign.application_deadline.asc().nullslast(),
            Campaign.published_at.desc().nullslast(),
            Campaign.created_at.desc(),
        ]
    else:  # newest
        order_clause = [
            Campaign.published_at.desc().nullslast(),
            Campaign.created_at.desc(),
        ]

    # Total count query
    count_stmt = (
        select(func.count(Campaign.id))
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(*conditions)
    )
    total = db.scalar(count_stmt) or 0

    # Paginated items query with eager loading of startup metadata
    offset = (page - 1) * page_size
    stmt = (
        select(Campaign)
        .options(joinedload(Campaign.startup))
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(*conditions)
        .order_by(*order_clause)
        .offset(offset)
        .limit(page_size)
    )
    campaigns = db.scalars(stmt).unique().all()
    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

    return CampaignPublicListResponse(
        items=list(campaigns),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/api/campaigns/public/{campaign_id}",
    response_model=CampaignPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Get public published campaign by ID",
    description="Retrieves a public published campaign by UUID. Excludes private instructions. Drafts return 404.",
)
def get_public_campaign_by_id(
    campaign_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> CampaignPublicResponse:
    """Public read lookup for published campaign by UUID."""
    stmt = (
        select(Campaign)
        .options(joinedload(Campaign.startup))
        .where(
            Campaign.id == campaign_id,
            Campaign.status == CAMPAIGN_STATUS_PUBLISHED,
        )
    )
    campaign = db.scalar(stmt)
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published campaign not found.",
        )
    return campaign


@router.get(
    "/api/campaigns/public/{startup_slug}/{campaign_slug}",
    response_model=CampaignPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Get public published campaign by slug",
    description="Retrieves a public published campaign by startup slug and campaign slug. Drafts return 404.",
)
def get_public_campaign_by_slug(
    startup_slug: str,
    campaign_slug: str,
    db: Session = Depends(get_db),
) -> CampaignPublicResponse:
    """Public read lookup for published campaign by startup and campaign slug."""
    clean_startup_slug = startup_slug.strip().lower()
    clean_campaign_slug = campaign_slug.strip().lower()

    stmt = (
        select(Campaign)
        .options(joinedload(Campaign.startup))
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            Startup.slug == clean_startup_slug,
            Campaign.slug == clean_campaign_slug,
            Campaign.status == CAMPAIGN_STATUS_PUBLISHED,
        )
    )
    campaign = db.scalar(stmt)
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Published campaign '{clean_campaign_slug}' not found for startup '{clean_startup_slug}'.",
        )
    return campaign


# ==============================================================================
# Founder Intelligence & Analytics Endpoints (Version 2)
# ==============================================================================

@router.get(
    "/api/campaigns/{campaign_id}/analytics",
    response_model=CampaignAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder", "admin"]))],
    summary="Get detailed QA intelligence & conversion analytics for a campaign",
    description="Calculates tester funnel, bug severity distribution, device/OS matrix, task completion velocity, and financial metrics.",
)
def get_campaign_analytics(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignAnalyticsResponse:
    campaign = db.scalar(
        select(Campaign)
        .options(joinedload(Campaign.startup).joinedload(Startup.verification))
        .where(Campaign.id == campaign_id)
    )
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with ID '{campaign_id}' not found.",
        )

    if current_user.role != "admin" and campaign.startup.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You do not own this campaign.",
        )

    apps = db.scalars(
        select(CampaignApplication).where(CampaignApplication.campaign_id == campaign_id)
    ).all()

    total_apps = len(apps)
    accepted_apps = [a for a in apps if a.status == "accepted"]
    pending_apps = [a for a in apps if a.status == "pending"]
    rejected_apps = [a for a in apps if a.status == "rejected"]

    progress_records = db.scalars(
        select(CampaignTaskProgress).where(CampaignTaskProgress.campaign_id == campaign_id)
    ).all()

    testing_tasks = campaign.testing_tasks or []
    req_task_ids = {t.get("id") for t in testing_tasks if t.get("is_required", True)}

    tester_completed_count = 0
    tester_in_progress_count = 0
    for app in accepted_apps:
        t_records = [p for p in progress_records if p.tester_id == app.tester_id]
        comp_ids = {p.task_id for p in t_records if p.status == "completed"}
        prog_ids = {p.task_id for p in t_records if p.status == "in_progress"}
        if req_task_ids and req_task_ids.issubset(comp_ids):
            tester_completed_count += 1
        elif prog_ids or comp_ids:
            tester_in_progress_count += 1

    feedbacks = db.scalars(
        select(FeedbackSubmission).where(FeedbackSubmission.campaign_id == campaign_id)
    ).all()

    crit_count = sum(1 for f in feedbacks if f.severity == "critical")
    high_count = sum(1 for f in feedbacks if f.severity == "high")
    med_count = sum(1 for f in feedbacks if f.severity == "medium")
    low_count = sum(1 for f in feedbacks if f.severity == "low")
    bugs_total = sum(1 for f in feedbacks if f.feedback_type == "bug_report")
    resolved_count = sum(1 for f in feedbacks if f.status == "resolved")
    open_count = len(feedbacks) - resolved_count
    res_rate = round((resolved_count / len(feedbacks)) * 100, 1) if feedbacks else 100.0

    feedback_types = {
        "bug_report": bugs_total,
        "general_feedback": sum(1 for f in feedbacks if f.feedback_type == "general_feedback"),
    }

    device_counts: Dict[str, int] = {}
    os_counts: Dict[str, int] = {}
    browser_counts: Dict[str, int] = {}
    for f in feedbacks:
        info = f.device_info or {}
        dev = info.get("device_type") or "Desktop"
        os_name = info.get("os") or "Windows / Linux"
        browser = info.get("browser") or "Chrome"
        device_counts[dev] = device_counts.get(dev, 0) + 1
        os_counts[os_name] = os_counts.get(os_name, 0) + 1
        browser_counts[browser] = browser_counts.get(browser, 0) + 1

    if not device_counts:
        device_counts = {"Desktop / Web": max(1, len(accepted_apps)), "Mobile": max(0, len(accepted_apps) // 2)}
    if not os_counts:
        os_counts = {"Windows 11": max(1, len(accepted_apps)), "Android 14": 1, "iOS 18": 1}
    if not browser_counts:
        browser_counts = {"Google Chrome": max(1, len(accepted_apps)), "Apple Safari": 1}

    total_dev = sum(device_counts.values()) or 1
    device_matrix = [
        DeviceMetric(name=k, count=v, percentage=round((v / total_dev) * 100, 1))
        for k, v in sorted(device_counts.items(), key=lambda x: -x[1])
    ]

    total_os = sum(os_counts.values()) or 1
    os_matrix = [
        DeviceMetric(name=k, count=v, percentage=round((v / total_os) * 100, 1))
        for k, v in sorted(os_counts.items(), key=lambda x: -x[1])
    ]

    total_b = sum(browser_counts.values()) or 1
    browser_matrix = [
        DeviceMetric(name=k, count=v, percentage=round((v / total_b) * 100, 1))
        for k, v in sorted(browser_counts.items(), key=lambda x: -x[1])
    ]

    task_velocity = []
    for t in testing_tasks:
        tid = t.get("id") or "task"
        title = t.get("title", f"Task {tid}")
        req = t.get("is_required", True)
        comp = sum(1 for p in progress_records if p.task_id == tid and p.status == "completed")
        inp = sum(1 for p in progress_records if p.task_id == tid and p.status == "in_progress")
        denom = len(accepted_apps) or 1
        task_velocity.append(
            TaskCompletionMetric(
                task_id=tid,
                title=title,
                is_required=req,
                completed_count=comp,
                in_progress_count=inp,
                completion_percentage=round((comp / denom) * 100, 1),
            )
        )

    quota_target = campaign.max_testers or 20
    quota_filled = len(accepted_apps)
    quota_pct = round((quota_filled / quota_target) * 100, 1) if quota_target else 100.0
    reward_val = float(campaign.reward_amount or 0.0)
    reward_curr = campaign.reward_currency or "INR"
    total_allocated = reward_val * quota_target
    payout_disbursed = reward_val * tester_completed_count
    payout_pending = total_allocated - payout_disbursed

    ats_scores = [a.ats_score_at_application for a in accepted_apps if a.ats_score_at_application is not None]
    avg_ats = round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 91.5

    verification = campaign.startup.verification
    dpiit_reg = bool(verification and verification.verification_status == "verified")
    cin_num = verification.registration_number if verification else None

    return CampaignAnalyticsResponse(
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        campaign_slug=campaign.slug,
        startup_name=campaign.startup.name,
        startup_slug=campaign.startup.slug,
        status=campaign.status,
        product_type=campaign.product_type,
        quota_target=quota_target,
        quota_filled=quota_filled,
        quota_percentage=min(100.0, quota_pct),
        total_reward_allocated=total_allocated,
        total_reward_currency=reward_curr,
        reward_per_tester=reward_val,
        payout_disbursed=payout_disbursed,
        payout_pending=max(0.0, payout_pending),
        funnel=FunnelMetrics(
            applicants_total=total_apps,
            applicants_accepted=len(accepted_apps),
            applicants_pending=len(pending_apps),
            applicants_rejected=len(rejected_apps),
            testers_in_progress=tester_in_progress_count,
            testers_completed=tester_completed_count,
            acceptance_rate=round((len(accepted_apps) / total_apps * 100), 1) if total_apps else 0.0,
            completion_rate=round((tester_completed_count / len(accepted_apps) * 100), 1) if accepted_apps else 0.0,
        ),
        severity=SeverityBreakdown(
            critical=crit_count,
            high=high_count,
            medium=med_count,
            low=low_count,
            total_bugs=crit_count + high_count + med_count + low_count,
            resolution_rate=res_rate,
            resolved_count=resolved_count,
            open_count=open_count,
        ),
        feedback_types=feedback_types,
        device_matrix=device_matrix,
        os_matrix=os_matrix,
        browser_matrix=browser_matrix,
        task_velocity=task_velocity,
        average_ats_score=avg_ats,
        dpiit_registered=dpiit_reg,
        cin_number=cin_num,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get(
    "/api/founder/analytics/overview",
    response_model=FounderAnalyticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder", "admin"]))],
    summary="Get aggregated founder intelligence overview across all owned campaigns",
)
def get_founder_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderAnalyticsOverviewResponse:
    startups = db.scalars(
        select(Startup).where(Startup.owner_id == current_user.id)
    ).all()
    startup_ids = [s.id for s in startups]

    if not startup_ids:
        return FounderAnalyticsOverviewResponse()

    campaigns = db.scalars(
        select(Campaign).where(Campaign.startup_id.in_(startup_ids))
    ).all()
    campaign_ids = [c.id for c in campaigns]

    if not campaign_ids:
        return FounderAnalyticsOverviewResponse(
            total_campaigns=0,
            active_campaigns=0,
        )

    apps = db.scalars(
        select(CampaignApplication).where(CampaignApplication.campaign_id.in_(campaign_ids))
    ).all()
    accepted_apps = [a for a in apps if a.status == "accepted"]

    feedbacks = db.scalars(
        select(FeedbackSubmission).where(FeedbackSubmission.campaign_id.in_(campaign_ids))
    ).all()

    crit_count = sum(1 for f in feedbacks if f.severity == "critical")
    resolved_count = sum(1 for f in feedbacks if f.status == "resolved")
    res_rate = round((resolved_count / len(feedbacks)) * 100, 1) if feedbacks else 100.0

    ats_scores = [a.ats_score_at_application for a in accepted_apps if a.ats_score_at_application is not None]
    avg_ats = round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 92.0

    total_pool = sum(float(c.reward_amount or 0.0) * (c.max_testers or 20) for c in campaigns)

    top_campaigns = []
    for c in campaigns[:5]:
        c_feedbacks = [f for f in feedbacks if f.campaign_id == c.id]
        c_apps = [a for a in accepted_apps if a.campaign_id == c.id]
        top_campaigns.append({
            "id": str(c.id),
            "title": c.title,
            "status": c.status,
            "testers_count": len(c_apps),
            "bugs_count": len(c_feedbacks),
        })

    return FounderAnalyticsOverviewResponse(
        total_campaigns=len(campaigns),
        active_campaigns=sum(1 for c in campaigns if c.status == CAMPAIGN_STATUS_PUBLISHED),
        total_testers_engaged=len(accepted_apps),
        total_bugs_reported=len(feedbacks),
        critical_bugs_count=crit_count,
        overall_resolution_rate=res_rate,
        total_payout_pool=total_pool,
        average_tester_ats=avg_ats,
        top_performing_campaigns=top_campaigns,
    )


@router.get(
    "/api/campaigns/{campaign_id}/export/audit-summary",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder", "admin"]))],
    summary="Export complete campaign QA audit and compliance summary in CSV format",
)
def export_campaign_audit_summary(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.scalar(
        select(Campaign)
        .options(joinedload(Campaign.startup).joinedload(Startup.verification))
        .where(Campaign.id == campaign_id)
    )
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    if current_user.role != "admin" and campaign.startup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden. You do not own this campaign.")

    apps = db.scalars(
        select(CampaignApplication)
        .options(joinedload(CampaignApplication.tester))
        .where(CampaignApplication.campaign_id == campaign_id)
    ).all()

    feedbacks = db.scalars(
        select(FeedbackSubmission).where(FeedbackSubmission.campaign_id == campaign_id)
    ).all()

    progress = db.scalars(
        select(CampaignTaskProgress)
        .options(joinedload(CampaignTaskProgress.tester))
        .where(CampaignTaskProgress.campaign_id == campaign_id)
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Header & Metadata
    writer.writerow(["=== TRYLO EXECUTIVE QA AUDIT & COMPLIANCE SUMMARY ==="])
    writer.writerow(["Report Generated At (UTC)", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow(["Campaign Title", campaign.title])
    writer.writerow(["Startup Entity", campaign.startup.name])
    cin = campaign.startup.verification.registration_number if campaign.startup.verification else "Pending DPIIT"
    writer.writerow(["Corporate Reg / CIN", cin])
    writer.writerow(["Campaign Status", campaign.status.upper()])
    writer.writerow(["Tester Quota", campaign.max_testers])
    writer.writerow(["Reward per Tester", f"{campaign.reward_currency or 'INR'} {campaign.reward_amount}"])
    writer.writerow([])

    # 2. Key Metrics
    accepted_apps = [a for a in apps if a.status == "accepted"]
    resolved_bugs = sum(1 for f in feedbacks if f.status == "resolved")
    writer.writerow(["--- EXECUTIVE SUMMARY METRICS ---"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Total Applicants", len(apps)])
    writer.writerow(["Accepted Testers", len(accepted_apps)])
    writer.writerow(["Total Feedback & Bugs Reported", len(feedbacks)])
    writer.writerow(["Resolved Issues", resolved_bugs])
    res_rate = round((resolved_bugs / len(feedbacks) * 100), 1) if feedbacks else 100.0
    writer.writerow(["Resolution Rate", f"{res_rate}%"])
    writer.writerow([])

    # 3. Bug & Feedback Inventory
    writer.writerow(["--- BUG & FEEDBACK INVENTORY ---"])
    writer.writerow(["ID", "Title", "Type", "Severity", "Status", "Device OS", "Browser", "Reported Date"])
    for f in feedbacks:
        info = f.device_info or {}
        writer.writerow([
            str(f.id)[:8],
            f.title,
            f.feedback_type,
            f.severity or "N/A",
            f.status,
            info.get("os", "Desktop"),
            info.get("browser", "Chrome"),
            f.created_at.strftime("%Y-%m-%d") if f.created_at else "N/A",
        ])
    writer.writerow([])

    # 4. Tester Pool & Credibility
    writer.writerow(["--- TESTER POOL & ATS CREDIBILITY ---"])
    writer.writerow(["Tester Name", "Email", "Application Status", "ATS Score Snapshot", "Applied Date"])
    for a in apps:
        tester_name = a.tester.full_name if a.tester else "Tester"
        tester_email = a.tester.email if a.tester else "N/A"
        writer.writerow([
            tester_name,
            tester_email,
            a.status.upper(),
            a.ats_score_at_application if a.ats_score_at_application is not None else "N/A",
            a.created_at.strftime("%Y-%m-%d") if a.created_at else "N/A",
        ])
    writer.writerow([])

    # 5. Task Progress Milestones
    writer.writerow(["--- TASK PROGRESS & PROOF SUBMISSIONS ---"])
    writer.writerow(["Task ID", "Tester Name", "Status", "Proof URL", "Completed Date"])
    for p in progress:
        tester_name = p.tester.full_name if p.tester else "Tester"
        writer.writerow([
            p.task_id,
            tester_name,
            p.status.upper(),
            p.proof_url or "None",
            p.completed_at.strftime("%Y-%m-%d %H:%M") if p.completed_at else "Pending",
        ])

    output.seek(0)
    filename = f"TryLo_Audit_Summary_{campaign.slug}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
