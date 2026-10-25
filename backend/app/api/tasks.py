"""TryLo Tester Task Execution and Progress API Routes."""

import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.models.campaign import (
    Campaign,
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_ARCHIVED,
)
from app.models.application import (
    CampaignApplication,
    APPLICATION_STATUS_ACCEPTED,
)
from app.models.task_progress import (
    CampaignTaskProgress,
    TASK_PROGRESS_NOT_STARTED,
    TASK_PROGRESS_IN_PROGRESS,
    TASK_PROGRESS_COMPLETED,
    ALLOWED_TASK_PROGRESS_STATUSES,
)
from app.schemas.task_execution import (
    CampaignTasksResponse,
    TestingTaskDetail,
    TaskProgressUpdateRequest,
    TaskProgressResponse,
    TesterTaskListResponse,
    TesterCampaignAssignmentItem,
)

logger = logging.getLogger("trylo.tasks")

router = APIRouter(tags=["Tester Task Execution"])


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
            detail="Only tester accounts can access testing tasks.",
        )
    profile = user.tester_profile
    if not profile or not profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must complete your tester onboarding profile before accessing campaign tasks.",
        )


def normalize_and_ensure_task_ids(campaign: Campaign, db: Session) -> List[Dict[str, Any]]:
    """
    Ensures every task in campaign.testing_tasks has a persistent, stable task ID.
    If a legacy task lacks an 'id', generates a deterministic ID and persists it back to the database.
    """
    raw_tasks = campaign.testing_tasks or []
    modified = False
    normalized: List[Dict[str, Any]] = []

    for idx, t in enumerate(raw_tasks):
        task_dict = dict(t)
        tid = task_dict.get("id")
        if not tid or not str(tid).strip():
            # Derive deterministic ID using campaign id + initial order/title
            seed = f"{campaign.id}:{task_dict.get('order', idx + 1)}:{task_dict.get('title', '')}"
            digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:8]
            tid = f"task_{digest}"
            task_dict["id"] = tid
            modified = True
        normalized.append(task_dict)

    if modified:
        campaign.testing_tasks = normalized
        db.commit()
        db.refresh(campaign)

    return normalized


def verify_accepted_tester_for_campaign(
    campaign_id: uuid.UUID,
    user: User,
    db: Session,
) -> Tuple[Campaign, CampaignApplication]:
    """
    Verifies tester eligibility and accepted application for the campaign.
    """
    validate_tester_profile_completed(user)

    campaign = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    if campaign.status in (CAMPAIGN_STATUS_DRAFT, CAMPAIGN_STATUS_ARCHIVED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Campaign is in '{campaign.status}' status and cannot provide testing access.",
        )

    application = db.scalar(
        select(CampaignApplication).where(
            CampaignApplication.campaign_id == campaign.id,
            CampaignApplication.tester_id == user.id,
        )
    )
    if application is None or application.status != APPLICATION_STATUS_ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Task execution is available exclusively to accepted testers for this campaign.",
        )

    return campaign, application


@router.get(
    "/api/campaigns/{campaign_id}/tasks",
    response_model=CampaignTasksResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="List tasks for an accepted tester",
    description="Returns campaign tasks merged with the authenticated tester's recorded progress.",
)
def get_campaign_tasks(
    campaign_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignTasksResponse:
    """
    Retrieve all tasks for a campaign with the current tester's execution progress.
    Excludes confidential access instructions and other testers' data.
    """
    campaign, _ = verify_accepted_tester_for_campaign(campaign_id, current_user, db)

    # 1. Ensure stable task IDs
    tasks_data = normalize_and_ensure_task_ids(campaign, db)

    # 2. Query tester's existing progress records for this campaign
    progress_records = db.scalars(
        select(CampaignTaskProgress).where(
            CampaignTaskProgress.campaign_id == campaign.id,
            CampaignTaskProgress.tester_id == current_user.id,
        )
    ).all()
    progress_map = {p.task_id: p for p in progress_records}

    # 3. Merge task definitions with progress
    task_details: List[TestingTaskDetail] = []
    completed_count = 0
    in_progress_count = 0

    for idx, t in enumerate(tasks_data):
        tid = str(t.get("id"))
        p = progress_map.get(tid)

        task_status = p.status if p else TASK_PROGRESS_NOT_STARTED
        completion_note = p.completion_note if p else None
        completed_at = p.completed_at if p else None
        updated_at = p.updated_at if p else None

        if task_status == TASK_PROGRESS_COMPLETED:
            completed_count += 1
        elif task_status == TASK_PROGRESS_IN_PROGRESS:
            in_progress_count += 1

        task_details.append(
            TestingTaskDetail(
                id=tid,
                title=t.get("title", f"Task {idx + 1}"),
                description=t.get("description"),
                expected_outcome=t.get("expected_outcome"),
                estimated_duration=t.get("estimated_duration"),
                is_required=t.get("is_required", True),
                order=t.get("order", idx + 1),
                status=task_status,
                completion_note=completion_note,
                completed_at=completed_at,
                updated_at=updated_at,
            )
        )

    # Sort tasks by order
    task_details.sort(key=lambda x: x.order)

    return CampaignTasksResponse(
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        campaign_slug=campaign.slug,
        startup_name=campaign.startup.name if campaign.startup else "",
        startup_slug=campaign.startup.slug if campaign.startup else "",
        product_type=campaign.product_type,
        product_url=campaign.product_url,
        testing_start_date=campaign.testing_start_date,
        testing_end_date=campaign.testing_end_date,
        campaign_status=campaign.status,
        total_tasks=len(task_details),
        completed_tasks=completed_count,
        in_progress_tasks=in_progress_count,
        tasks=task_details,
    )


@router.put(
    "/api/campaigns/{campaign_id}/tasks/{task_id}/progress",
    response_model=TaskProgressResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Update task execution progress",
    description="Updates the current tester's progress for a specific campaign task.",
)
def update_task_progress(
    campaign_id: uuid.UUID,
    task_id: str,
    payload: TaskProgressUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskProgressResponse:
    """
    Updates the tester's progress for a task:
    - Verifies campaign eligibility and accepted application.
    - Validates task belongs to campaign.
    - Manages completed_at timestamp (set on completed, cleared on reopen).
    - Persists progress atomically.
    """
    campaign, _ = verify_accepted_tester_for_campaign(campaign_id, current_user, db)

    # Ensure stable task IDs and verify task_id belongs to campaign
    tasks_data = normalize_and_ensure_task_ids(campaign, db)
    valid_task_ids = {str(t.get("id")) for t in tasks_data}

    if task_id not in valid_task_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found in this campaign's tasks.",
        )

    now = datetime.now(timezone.utc)

    # Find or create progress record
    progress = db.scalar(
        select(CampaignTaskProgress).where(
            CampaignTaskProgress.campaign_id == campaign.id,
            CampaignTaskProgress.task_id == task_id,
            CampaignTaskProgress.tester_id == current_user.id,
        )
    )

    if progress is None:
        completed_at = now if payload.status == TASK_PROGRESS_COMPLETED else None
        progress = CampaignTaskProgress(
            id=uuid.uuid4(),
            campaign_id=campaign.id,
            task_id=task_id,
            tester_id=current_user.id,
            status=payload.status,
            completion_note=payload.completion_note,
            completed_at=completed_at,
            created_at=now,
            updated_at=now,
        )
        db.add(progress)
    else:
        # Update existing record
        progress.status = payload.status
        progress.completion_note = payload.completion_note
        progress.updated_at = now

        if payload.status == TASK_PROGRESS_COMPLETED:
            if progress.completed_at is None:
                progress.completed_at = now
        else:
            # Reopening or in-progress clears completed_at
            progress.completed_at = None

    db.commit()
    db.refresh(progress)

    logger.info(
        "Tester %s updated task %s for campaign %s to status '%s'",
        current_user.id,
        task_id,
        campaign.id,
        payload.status,
    )

    return TaskProgressResponse(
        id=progress.id,
        campaign_id=progress.campaign_id,
        task_id=progress.task_id,
        tester_id=progress.tester_id,
        status=progress.status,
        completion_note=progress.completion_note,
        completed_at=progress.completed_at,
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )


@router.get(
    "/api/tester/tasks",
    response_model=TesterTaskListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="List tester's campaign task assignments",
    description="Returns all accepted campaigns and task progress metrics for the current tester.",
)
def list_tester_campaign_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TesterTaskListResponse:
    """
    Returns all campaigns where current tester has an accepted application,
    along with task counts and overall assignment progress.
    """
    validate_tester_profile_completed(current_user)

    # 1. Fetch all accepted applications for current tester
    accepted_apps = db.scalars(
        select(CampaignApplication).where(
            CampaignApplication.tester_id == current_user.id,
            CampaignApplication.status == APPLICATION_STATUS_ACCEPTED,
        ).order_by(CampaignApplication.updated_at.desc())
    ).all()

    items: List[TesterCampaignAssignmentItem] = []

    for app in accepted_apps:
        campaign = app.campaign
        if campaign is None or campaign.status in (CAMPAIGN_STATUS_DRAFT, CAMPAIGN_STATUS_ARCHIVED):
            continue

        tasks_data = normalize_and_ensure_task_ids(campaign, db)
        total_tasks = len(tasks_data)

        # Query progress counts for this campaign & tester
        progress_records = db.scalars(
            select(CampaignTaskProgress).where(
                CampaignTaskProgress.campaign_id == campaign.id,
                CampaignTaskProgress.tester_id == current_user.id,
            )
        ).all()

        completed_count = sum(1 for p in progress_records if p.status == TASK_PROGRESS_COMPLETED)
        in_progress_count = sum(1 for p in progress_records if p.status == TASK_PROGRESS_IN_PROGRESS)

        if total_tasks > 0 and completed_count >= total_tasks:
            assignment_status = "completed"
        elif completed_count > 0 or in_progress_count > 0:
            assignment_status = "in_progress"
        else:
            assignment_status = "not_started"

        items.append(
            TesterCampaignAssignmentItem(
                campaign_id=campaign.id,
                campaign_title=campaign.title,
                campaign_slug=campaign.slug,
                startup_name=campaign.startup.name if campaign.startup else "",
                startup_slug=campaign.startup.slug if campaign.startup else "",
                product_type=campaign.product_type,
                testing_start_date=campaign.testing_start_date,
                testing_end_date=campaign.testing_end_date,
                campaign_status=campaign.status,
                total_tasks=total_tasks,
                completed_tasks=completed_count,
                in_progress_tasks=in_progress_count,
                assignment_status=assignment_status,
                accepted_at=app.updated_at,
            )
        )

    return TesterTaskListResponse(
        total_campaigns=len(items),
        items=items,
    )
