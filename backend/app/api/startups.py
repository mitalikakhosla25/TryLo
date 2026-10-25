"""FastAPI Startup Management and Public Discovery Endpoints for TryLo."""

import logging
import math
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_role
from app.core.slug import generate_unique_startup_slug
from app.db.session import get_db
from app.models.campaign import CAMPAIGN_STATUS_PUBLISHED
from app.models.startup import Startup
from app.models.user import User
from app.schemas.startup import (
    StartupCreateRequest,
    StartupPublicListResponse,
    StartupPublicResponse,
    StartupResponse,
    StartupUpdateRequest,
)

logger = logging.getLogger("trylo.startups")

router = APIRouter(prefix="/api/startups", tags=["Startups"])
public_startups_router = APIRouter(tags=["Startups"])


@router.post(
    "",
    response_model=StartupResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Create a new startup",
    description="Registers a new startup entity owned by the authenticated founder with an automatic unique public slug.",
)
def create_startup(
    payload: StartupCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupResponse:
    """
    Create startup for authenticated founder:
    1. Derive owner_id exclusively from server-side current_user.id.
    2. Generate collision-resistant unique slug.
    3. Persist startup in PostgreSQL.
    """
    unique_slug = generate_unique_startup_slug(name=payload.name, db=db)

    new_startup = Startup(
        owner_id=current_user.id,
        name=payload.name,
        slug=unique_slug,
        tagline=payload.tagline,
        description=payload.description,
        industry=payload.industry,
        company_stage=payload.company_stage,
        website_url=payload.website_url,
        logo_url=payload.logo_url,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        founded_year=payload.founded_year,
    )

    db.add(new_startup)
    db.commit()
    db.refresh(new_startup)

    logger.info("Founder %s created startup '%s' [id=%s, slug=%s]", current_user.id, new_startup.name, new_startup.id, new_startup.slug)
    return new_startup


@router.get(
    "",
    response_model=List[StartupResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="List startups owned by current founder",
    description="Returns all startups owned by the authenticated founder ordered by newest first.",
)
def list_my_startups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[StartupResponse]:
    """Retrieve all startups owned by current founder."""
    stmt = (
        select(Startup)
        .where(Startup.owner_id == current_user.id)
        .order_by(Startup.created_at.desc())
    )
    startups = db.scalars(stmt).all()
    return list(startups)


def _list_public_startups_impl(
    state: Optional[str],
    page: int,
    page_size: int,
    db: Session,
) -> StartupPublicListResponse:
    """Shared query handler for public startup discovery."""
    # Aggregate startup counts per state for all startups with a recorded state
    count_rows = db.execute(
        select(Startup.state, func.count(Startup.id))
        .where(Startup.state.is_not(None), Startup.state != "")
        .group_by(Startup.state)
    ).all()
    state_counts = {row[0]: int(row[1]) for row in count_rows if row[0]}

    conditions = []
    if state and state.strip():
        clean_state = state.strip()
        conditions.append(Startup.state.ilike(f"%{clean_state}%"))

    # Total count query
    count_stmt = select(func.count(Startup.id))
    if conditions:
        count_stmt = count_stmt.where(*conditions)
    total = db.scalar(count_stmt) or 0

    # Paginated startups query with eager-loaded campaigns
    offset = (page - 1) * page_size
    stmt = (
        select(Startup)
        .options(joinedload(Startup.campaigns))
        .order_by(Startup.created_at.desc())
    )
    if conditions:
        stmt = stmt.where(*conditions)
    stmt = stmt.offset(offset).limit(page_size)
    startups = db.scalars(stmt).unique().all()

    items = []
    for s in startups:
        published_count = sum(1 for c in s.campaigns if c.status == CAMPAIGN_STATUS_PUBLISHED)
        items.append(
            StartupPublicResponse(
                id=s.id,
                name=s.name,
                slug=s.slug,
                tagline=s.tagline,
                description=s.description,
                industry=s.industry,
                company_stage=s.company_stage,
                website_url=s.website_url,
                logo_url=s.logo_url,
                city=s.city,
                state=s.state,
                country=s.country,
                founded_year=s.founded_year,
                created_at=s.created_at,
                campaign_count=published_count,
            )
        )

    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

    return StartupPublicListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        state_counts=state_counts,
    )


@public_startups_router.get(
    "/api/public/startups",
    response_model=StartupPublicListResponse,
    status_code=status.HTTP_200_OK,
    summary="Public discovery of startups with state filtering",
    description="Returns public startup records with state filtering, pagination, and state-level startup count aggregations for the India map.",
)
def list_public_startups(
    state: Optional[str] = Query(None, max_length=100, description="Filter startups by Indian state or region"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(12, ge=1, le=50, description="Page size up to 50 items"),
    db: Session = Depends(get_db),
) -> StartupPublicListResponse:
    return _list_public_startups_impl(state=state, page=page, page_size=page_size, db=db)


@router.get(
    "/public",
    response_model=StartupPublicListResponse,
    status_code=status.HTTP_200_OK,
    summary="Public discovery of startups (alias under /api/startups/public)",
)
def list_public_startups_alias(
    state: Optional[str] = Query(None, max_length=100, description="Filter startups by Indian state or region"),
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(12, ge=1, le=50, description="Page size up to 50 items"),
    db: Session = Depends(get_db),
) -> StartupPublicListResponse:
    return _list_public_startups_impl(state=state, page=page, page_size=page_size, db=db)


@router.get(
    "/public/{slug}",
    response_model=StartupPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Get public startup details by slug",
    description="Publicly discoverable startup information for campaign discovery. Excludes private owner data.",
)
def get_public_startup(
    slug: str,
    db: Session = Depends(get_db),
) -> StartupPublicResponse:
    """Public read-only lookup by slug."""
    clean_slug = slug.strip().lower()
    startup = db.scalar(
        select(Startup)
        .options(joinedload(Startup.campaigns))
        .where(Startup.slug == clean_slug)
    )
    if startup is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup with slug '{slug}' not found.",
        )
    published_count = sum(1 for c in startup.campaigns if c.status == CAMPAIGN_STATUS_PUBLISHED)
    return StartupPublicResponse(
        id=startup.id,
        name=startup.name,
        slug=startup.slug,
        tagline=startup.tagline,
        description=startup.description,
        industry=startup.industry,
        company_stage=startup.company_stage,
        website_url=startup.website_url,
        logo_url=startup.logo_url,
        city=startup.city,
        state=startup.state,
        country=startup.country,
        founded_year=startup.founded_year,
        created_at=startup.created_at,
        campaign_count=published_count,
    )


@router.get(
    "/{startup_id}",
    response_model=StartupResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Get single startup details",
    description="Retrieves a startup owned by the authenticated founder. Returns 404 if not found or unauthorized.",
)
def get_startup(
    startup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupResponse:
    """Retrieve owned startup by ID."""
    startup = db.scalar(
        select(Startup).where(
            Startup.id == startup_id,
            Startup.owner_id == current_user.id,
        )
    )
    if startup is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found.",
        )
    return startup


@router.put(
    "/{startup_id}",
    response_model=StartupResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Update owned startup",
    description="Updates startup metadata. Only the owner founder can update their startup.",
)
def update_startup(
    startup_id: uuid.UUID,
    payload: StartupUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupResponse:
    """Update owned startup by ID."""
    startup = db.scalar(
        select(Startup).where(
            Startup.id == startup_id,
            Startup.owner_id == current_user.id,
        )
    )
    if startup is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found.",
        )

    # If name changed, recalculate unique slug
    if payload.name is not None and payload.name.strip() != startup.name:
        startup.name = payload.name.strip()
        startup.slug = generate_unique_startup_slug(
            name=payload.name,
            db=db,
            exclude_startup_id=startup.id,
        )

    if payload.tagline is not None:
        startup.tagline = payload.tagline
    if payload.description is not None:
        startup.description = payload.description
    if payload.industry is not None:
        startup.industry = payload.industry
    if payload.company_stage is not None:
        startup.company_stage = payload.company_stage
    if payload.website_url is not None:
        startup.website_url = payload.website_url
    if payload.logo_url is not None:
        startup.logo_url = payload.logo_url
    if payload.city is not None:
        startup.city = payload.city
    if payload.state is not None:
        startup.state = payload.state
    if payload.country is not None:
        startup.country = payload.country
    if payload.founded_year is not None:
        startup.founded_year = payload.founded_year

    db.commit()
    db.refresh(startup)

    logger.info("Founder %s updated startup '%s' [id=%s]", current_user.id, startup.name, startup.id)
    return startup

