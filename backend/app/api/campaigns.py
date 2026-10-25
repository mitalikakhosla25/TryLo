"""FastAPI Campaign Management, Draft Persistence, and Public Discovery Endpoints for TryLo."""

import logging
import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_role
from app.core.slug import generate_unique_campaign_slug
from app.db.session import get_db
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
from app.models.startup import Startup
from app.models.user import User
from app.schemas.campaign import (
    CampaignCreateRequest,
    CampaignPublicListResponse,
    CampaignPublicResponse,
    CampaignResponse,
    CampaignUpdateRequest,
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
