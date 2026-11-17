"""TryLo Structured Feedback and Bug Reporting API Routes."""

import logging
import uuid
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from starlette.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.models.startup import Startup
from app.models.campaign import Campaign
from app.models.feedback import (
    FeedbackSubmission,
    FeedbackInternalNote,
    FeedbackStatusHistory,
    ALLOWED_TRANSITIONS,
    ALLOWED_FEEDBACK_STATUSES,
    ALLOWED_FEEDBACK_TYPES,
    ALLOWED_SEVERITIES,
    FEEDBACK_STATUS_SUBMITTED,
    FEEDBACK_STATUS_IN_REVIEW,
    FEEDBACK_STATUS_RESOLVED,
    FEEDBACK_STATUS_NEEDS_RETEST,
)
from app.schemas.task_execution import (
    FeedbackCreateRequest,
    FeedbackSubmissionResponse,
    FeedbackListResponse,
)
from app.schemas.feedback import (
    FeedbackStatusUpdateRequest,
    FeedbackInternalNoteCreate,
    FeedbackInternalNoteResponse,
    FeedbackStatusHistoryResponse,
    FounderFeedbackListItemResponse,
    FounderFeedbackListResponse,
    FounderFeedbackDetailResponse,
    TimestampedNoteAddRequest,
    AiTriageResponse,
    AiExecutiveSynthesisResponse,
    AiCopilotQueryRequest,
    AiCopilotQueryResponse,
)
from app.services.ai_triage import analyze_feedback_item, synthesize_batch_feedback_insights
from app.services.ai_copilot import query_ai_copilot
from app.api.tasks import (
    validate_tester_profile_completed,
    verify_accepted_tester_for_campaign,
    normalize_and_ensure_task_ids,
)

logger = logging.getLogger("trylo.feedback")

router = APIRouter(tags=["Feedback & Bug Reports"])


def find_task_info(campaign: Optional[Campaign], task_id: Optional[str]) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Helper to look up a task title, description, and expected outcome from campaign.testing_tasks by task_id."""
    if not campaign or not task_id or not campaign.testing_tasks:
        return None, None, None
    for t in campaign.testing_tasks:
        if str(t.get("id")) == str(task_id):
            return t.get("title"), t.get("description"), t.get("expected_outcome")
    return None, None, None


# ==============================================================================
# Tester Feedback Submission & Review Endpoints
# ==============================================================================


@router.post(
    "/api/campaigns/{campaign_id}/feedback",
    response_model=FeedbackSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Submit structured feedback or bug report",
    description="Allows an accepted tester to record a bug report or general feedback for a campaign.",
)
def submit_campaign_feedback(
    campaign_id: uuid.UUID,
    payload: FeedbackCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackSubmissionResponse:
    """
    Submits structured feedback or a bug report:
    - Verifies current tester is accepted for the campaign.
    - If task_id is supplied, validates that it belongs to this campaign.
    - Enforces server-managed status='submitted' and tester_id=current_user.id.
    - Sanitizes and safely renders text contents.
    """
    campaign, _ = verify_accepted_tester_for_campaign(campaign_id, current_user, db)

    # 1. Validate optional task_id belongs to the campaign
    task_title: Optional[str] = None
    if payload.task_id:
        tasks_data = normalize_and_ensure_task_ids(campaign, db)
        matched_task = next((t for t in tasks_data if str(t.get("id")) == str(payload.task_id)), None)
        if matched_task is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task ID '{payload.task_id}' does not belong to this campaign.",
            )
        task_title = matched_task.get("title")

    # 2. Construct feedback submission with server-controlled fields
    now = datetime.now(timezone.utc)
    submission = FeedbackSubmission(
        id=uuid.uuid4(),
        campaign_id=campaign.id,
        tester_id=current_user.id,
        task_id=payload.task_id,
        feedback_type=payload.feedback_type,
        title=payload.title,
        description=payload.description,
        expected_behavior=payload.expected_behavior,
        actual_behavior=payload.actual_behavior,
        reproduction_steps=payload.reproduction_steps,
        severity=payload.severity,
        status=FEEDBACK_STATUS_SUBMITTED,
        device_info=payload.device_info,
        attachments=payload.attachments or [],
        video_url=payload.video_url,
        video_duration_seconds=payload.video_duration_seconds,
        video_format=payload.video_format,
        timestamped_notes=payload.timestamped_notes or [],
        created_at=now,
        updated_at=now,
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    logger.info(
        "Tester %s submitted %s [id=%s] for campaign %s",
        current_user.id,
        payload.feedback_type,
        submission.id,
        campaign.id,
    )

    return FeedbackSubmissionResponse(
        id=submission.id,
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        campaign_slug=campaign.slug,
        startup_name=campaign.startup.name if campaign.startup else "",
        startup_slug=campaign.startup.slug if campaign.startup else "",
        tester_id=submission.tester_id,
        task_id=submission.task_id,
        task_title=task_title,
        feedback_type=submission.feedback_type,
        title=submission.title,
        description=submission.description,
        expected_behavior=submission.expected_behavior,
        actual_behavior=submission.actual_behavior,
        reproduction_steps=submission.reproduction_steps,
        severity=submission.severity,
        status=submission.status,
        retest_instructions=submission.retest_instructions,
        resolution_notes=submission.resolution_notes,
        device_info=submission.device_info,
        attachments=submission.attachments or [],
        video_url=submission.video_url,
        video_duration_seconds=submission.video_duration_seconds,
        video_format=submission.video_format,
        timestamped_notes=submission.timestamped_notes or [],
        created_at=submission.created_at,
        updated_at=submission.updated_at,
    )


@router.get(
    "/api/feedback/me",
    response_model=FeedbackListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="List tester's feedback submissions",
    description="Returns all feedback submissions authored by the authenticated tester.",
)
def list_my_feedback(
    campaign_id: Optional[uuid.UUID] = Query(None, description="Filter by campaign ID"),
    feedback_type: Optional[str] = Query(None, description="Filter by feedback type"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackListResponse:
    """
    Returns submissions authored by the current tester with campaign & task titles.
    Never exposes other testers' feedback, private access instructions, or internal notes.
    """
    validate_tester_profile_completed(current_user)

    stmt = (
        select(FeedbackSubmission)
        .options(joinedload(FeedbackSubmission.campaign).joinedload(Campaign.startup))
        .where(FeedbackSubmission.tester_id == current_user.id)
    )

    if campaign_id:
        stmt = stmt.where(FeedbackSubmission.campaign_id == campaign_id)

    if feedback_type:
        clean_type = feedback_type.strip().lower()
        if clean_type in ALLOWED_FEEDBACK_TYPES:
            stmt = stmt.where(FeedbackSubmission.feedback_type == clean_type)

    stmt = stmt.order_by(FeedbackSubmission.created_at.desc())
    submissions = db.scalars(stmt).all()

    items: List[FeedbackSubmissionResponse] = []
    for sub in submissions:
        camp = sub.campaign
        task_title, _, _ = find_task_info(camp, sub.task_id)

        items.append(
            FeedbackSubmissionResponse(
                id=sub.id,
                campaign_id=sub.campaign_id,
                campaign_title=camp.title if camp else "",
                campaign_slug=camp.slug if camp else "",
                startup_name=camp.startup.name if (camp and camp.startup) else "",
                startup_slug=camp.startup.slug if (camp and camp.startup) else "",
                tester_id=sub.tester_id,
                task_id=sub.task_id,
                task_title=task_title,
                feedback_type=sub.feedback_type,
                title=sub.title,
                description=sub.description,
                expected_behavior=sub.expected_behavior,
                actual_behavior=sub.actual_behavior,
                reproduction_steps=sub.reproduction_steps,
                severity=sub.severity,
                status=sub.status,
                retest_instructions=sub.retest_instructions,
                resolution_notes=sub.resolution_notes,
                device_info=sub.device_info,
                attachments=sub.attachments or [],
                video_url=sub.video_url,
                video_duration_seconds=sub.video_duration_seconds,
                video_format=sub.video_format,
                timestamped_notes=sub.timestamped_notes or [],
                created_at=sub.created_at,
                updated_at=sub.updated_at,
            )
        )

    return FeedbackListResponse(
        total=len(items),
        items=items,
    )


@router.get(
    "/api/feedback/{feedback_id}",
    response_model=FeedbackSubmissionResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Retrieve single feedback submission",
    description="Returns a specific feedback submission if owned by the current tester.",
)
def get_feedback_submission(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackSubmissionResponse:
    """
    Returns a single feedback submission owned by the current tester.
    Returns 404 for submissions belonging to other testers or non-existent IDs.
    """
    validate_tester_profile_completed(current_user)

    submission = db.scalar(
        select(FeedbackSubmission)
        .options(joinedload(FeedbackSubmission.campaign).joinedload(Campaign.startup))
        .where(
            FeedbackSubmission.id == feedback_id,
            FeedbackSubmission.tester_id == current_user.id,
        )
    )

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    camp = submission.campaign
    task_title, _, _ = find_task_info(camp, submission.task_id)

    return FeedbackSubmissionResponse(
        id=submission.id,
        campaign_id=submission.campaign_id,
        campaign_title=camp.title if camp else "",
        campaign_slug=camp.slug if camp else "",
        startup_name=camp.startup.name if (camp and camp.startup) else "",
        startup_slug=camp.startup.slug if (camp and camp.startup) else "",
        tester_id=submission.tester_id,
        task_id=submission.task_id,
        task_title=task_title,
        feedback_type=submission.feedback_type,
        title=submission.title,
        description=submission.description,
        expected_behavior=submission.expected_behavior,
        actual_behavior=submission.actual_behavior,
        reproduction_steps=submission.reproduction_steps,
        severity=submission.severity,
        status=submission.status,
        retest_instructions=submission.retest_instructions,
        resolution_notes=submission.resolution_notes,
        device_info=submission.device_info,
        attachments=submission.attachments or [],
        video_url=submission.video_url,
        video_duration_seconds=submission.video_duration_seconds,
        video_format=submission.video_format,
        timestamped_notes=submission.timestamped_notes or [],
        created_at=submission.created_at,
        updated_at=submission.updated_at,
    )


# ==============================================================================
# Founder Feedback Review & Issue Management Endpoints
# ==============================================================================


@router.get(
    "/api/founder/feedback",
    response_model=FounderFeedbackListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="List feedback across founder campaigns",
    description="Returns feedback submissions for all campaigns owned by the authenticated founder.",
)
def list_founder_feedback(
    status: Optional[str] = Query(None, description="Filter by status: submitted, in_review, needs_retest, resolved"),
    feedback_type: Optional[str] = Query(None, description="Filter by feedback type: general_feedback, bug_report"),
    severity: Optional[str] = Query(None, description="Filter by severity: low, medium, high, critical"),
    campaign_id: Optional[uuid.UUID] = Query(None, description="Filter by campaign ID"),
    search: Optional[str] = Query(None, description="Search by title, campaign, or startup"),
    sort: Optional[str] = Query("newest", description="Sort order: newest or oldest"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderFeedbackListResponse:
    """
    Returns feedback submitted across all campaigns owned by the authenticated founder.
    Scopes ownership strictly in the database query.
    Never exposes passwords, tokens, unrelated tester data, or access instructions.
    """
    # Base query joins Campaign and Startup, scoping to current founder
    stmt = (
        select(FeedbackSubmission)
        .join(Campaign, FeedbackSubmission.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(Startup.owner_id == current_user.id)
        .options(
            joinedload(FeedbackSubmission.campaign).joinedload(Campaign.startup),
            joinedload(FeedbackSubmission.tester).joinedload(User.tester_profile),
            selectinload(FeedbackSubmission.internal_notes),
        )
    )

    count_stmt = (
        select(func.count(FeedbackSubmission.id))
        .join(Campaign, FeedbackSubmission.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(Startup.owner_id == current_user.id)
    )

    if status and status.strip():
        clean_status = status.strip().lower()
        if clean_status in ALLOWED_FEEDBACK_STATUSES:
            stmt = stmt.where(FeedbackSubmission.status == clean_status)
            count_stmt = count_stmt.where(FeedbackSubmission.status == clean_status)

    if feedback_type and feedback_type.strip():
        clean_type = feedback_type.strip().lower()
        if clean_type in ALLOWED_FEEDBACK_TYPES:
            stmt = stmt.where(FeedbackSubmission.feedback_type == clean_type)
            count_stmt = count_stmt.where(FeedbackSubmission.feedback_type == clean_type)

    if severity and severity.strip():
        clean_sev = severity.strip().lower()
        if clean_sev in ALLOWED_SEVERITIES:
            stmt = stmt.where(FeedbackSubmission.severity == clean_sev)
            count_stmt = count_stmt.where(FeedbackSubmission.severity == clean_sev)

    if campaign_id:
        stmt = stmt.where(FeedbackSubmission.campaign_id == campaign_id)
        count_stmt = count_stmt.where(FeedbackSubmission.campaign_id == campaign_id)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        search_filter = or_(
            FeedbackSubmission.title.ilike(search_pattern),
            Campaign.title.ilike(search_pattern),
            Startup.name.ilike(search_pattern),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    # Sort
    if sort and sort.strip().lower() == "oldest":
        stmt = stmt.order_by(FeedbackSubmission.created_at.asc())
    else:
        stmt = stmt.order_by(FeedbackSubmission.created_at.desc())

    total = db.scalar(count_stmt) or 0
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    submissions = db.scalars(stmt).all()

    items: List[FounderFeedbackListItemResponse] = []
    for sub in submissions:
        camp = sub.campaign
        task_title, _, _ = find_task_info(camp, sub.task_id)
        tester = sub.tester
        tester_exp = (
            tester.tester_profile.experience_level
            if (tester and tester.tester_profile)
            else None
        )

        items.append(
            FounderFeedbackListItemResponse(
                id=sub.id,
                campaign_id=sub.campaign_id,
                campaign_title=camp.title if camp else "",
                campaign_slug=camp.slug if camp else "",
                startup_id=camp.startup.id if (camp and camp.startup) else uuid.UUID(int=0),
                startup_name=camp.startup.name if (camp and camp.startup) else "",
                startup_slug=camp.startup.slug if (camp and camp.startup) else "",
                tester_id=sub.tester_id,
                tester_name=tester.full_name if tester else "Tester",
                tester_experience_level=tester_exp,
                task_id=sub.task_id,
                task_title=task_title,
                feedback_type=sub.feedback_type,
                title=sub.title,
                description=sub.description,
                severity=sub.severity,
                status=sub.status,
                retest_instructions=sub.retest_instructions,
                resolution_notes=sub.resolution_notes,
                video_url=sub.video_url,
                video_duration_seconds=sub.video_duration_seconds,
                notes_count=len(sub.internal_notes) if sub.internal_notes else 0,
                created_at=sub.created_at,
                updated_at=sub.updated_at,
            )
        )

    return FounderFeedbackListResponse(
        total=total,
        page=page,
        limit=limit,
        items=items,
    )


@router.get(
    "/api/founder/feedback/{feedback_id}",
    response_model=FounderFeedbackDetailResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Retrieve single feedback submission for founder review",
    description="Returns detailed feedback submission with internal notes and status transition history. Scoped strictly to founder ownership.",
)
def get_founder_feedback_detail(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderFeedbackDetailResponse:
    """
    Returns complete feedback submission, including internal notes and audit history.
    Enforces strict ownership check: campaign's startup owner must be current_user.
    Returns 404 for unowned or non-existent items.
    """
    stmt = (
        select(FeedbackSubmission)
        .join(Campaign, FeedbackSubmission.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            FeedbackSubmission.id == feedback_id,
            Startup.owner_id == current_user.id,
        )
        .options(
            joinedload(FeedbackSubmission.campaign).joinedload(Campaign.startup),
            joinedload(FeedbackSubmission.tester).joinedload(User.tester_profile),
            selectinload(FeedbackSubmission.internal_notes).joinedload(FeedbackInternalNote.author),
            selectinload(FeedbackSubmission.status_history).joinedload(FeedbackStatusHistory.actor),
        )
    )
    submission = db.scalar(stmt)
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    camp = submission.campaign
    task_title, task_desc, task_expected = find_task_info(camp, submission.task_id)
    tester = submission.tester
    tester_exp = (
        tester.tester_profile.experience_level
        if (tester and tester.tester_profile)
        else None
    )
    tester_tier = (
        tester.tester_profile.verification_tier
        if (tester and tester.tester_profile)
        else 1
    )
    tester_avg_rating = (
        tester.tester_profile.average_rating
        if (tester and tester.tester_profile)
        else None
    )
    tester_reviews_count = (
        tester.tester_profile.reviews_count
        if (tester and tester.tester_profile)
        else None
    )

    notes_response = [
        FeedbackInternalNoteResponse(
            id=n.id,
            feedback_id=n.feedback_id,
            author_id=n.author_id,
            author_name=n.author.full_name if n.author else "Founder",
            body=n.body,
            created_at=n.created_at,
        )
        for n in (submission.internal_notes or [])
    ]

    history_response = [
        FeedbackStatusHistoryResponse(
            id=h.id,
            feedback_id=h.feedback_id,
            actor_id=h.actor_id,
            actor_name=h.actor.full_name if h.actor else "User",
            previous_status=h.previous_status,
            new_status=h.new_status,
            reason=h.reason,
            created_at=h.created_at,
        )
        for h in (submission.status_history or [])
    ]

    ai_triage_obj = None
    if submission.ai_triage_data:
        try:
            ai_triage_obj = AiTriageResponse(**submission.ai_triage_data)
        except Exception:
            ai_triage_obj = None

    return FounderFeedbackDetailResponse(
        id=submission.id,
        campaign_id=submission.campaign_id,
        campaign_title=camp.title if camp else "",
        campaign_slug=camp.slug if camp else "",
        startup_id=camp.startup.id if (camp and camp.startup) else uuid.UUID(int=0),
        startup_name=camp.startup.name if (camp and camp.startup) else "",
        startup_slug=camp.startup.slug if (camp and camp.startup) else "",
        tester_id=submission.tester_id,
        tester_name=tester.full_name if tester else "Tester",
        tester_experience_level=tester_exp,
        tester_verification_tier=tester_tier,
        tester_average_rating=tester_avg_rating,
        tester_reviews_count=tester_reviews_count,
        task_id=submission.task_id,
        task_title=task_title,
        task_description=task_desc,
        task_expected_outcome=task_expected,
        feedback_type=submission.feedback_type,
        title=submission.title,
        description=submission.description,
        expected_behavior=submission.expected_behavior,
        actual_behavior=submission.actual_behavior,
        reproduction_steps=submission.reproduction_steps,
        severity=submission.severity,
        status=submission.status,
        retest_instructions=submission.retest_instructions,
        resolution_notes=submission.resolution_notes,
        device_info=submission.device_info,
        attachments=submission.attachments or [],
        video_url=submission.video_url,
        video_duration_seconds=submission.video_duration_seconds,
        video_format=submission.video_format,
        timestamped_notes=submission.timestamped_notes or [],
        ai_triage=ai_triage_obj,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
        internal_notes=notes_response,
        status_history=history_response,
    )


@router.patch(
    "/api/founder/feedback/{feedback_id}/status",
    response_model=FounderFeedbackDetailResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Update feedback lifecycle status",
    description="Transitions feedback status according to allowed lifecycle rules. Scoped strictly to founder ownership.",
)
def update_feedback_status(
    feedback_id: uuid.UUID,
    payload: FeedbackStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FounderFeedbackDetailResponse:
    """
    Updates the lifecycle status of a feedback submission:
    - Verifies ownership (404 if not found or cross-founder).
    - Validates state transition against ALLOWED_TRANSITIONS.
    - Updates updated_at.
    - Appends an audit entry to FeedbackStatusHistory.
    """
    stmt = (
        select(FeedbackSubmission)
        .join(Campaign, FeedbackSubmission.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            FeedbackSubmission.id == feedback_id,
            Startup.owner_id == current_user.id,
        )
    )
    submission = db.scalar(stmt)
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    current_status = submission.status
    target_status = payload.status

    if current_status == target_status:
        # Same status: allow updating retest instructions or resolution notes without duplicate history transition
        if payload.retest_instructions is not None:
            submission.retest_instructions = payload.retest_instructions
        if payload.resolution_notes is not None:
            submission.resolution_notes = payload.resolution_notes
        submission.updated_at = datetime.now(timezone.utc)
        db.commit()
        return get_founder_feedback_detail(feedback_id=feedback_id, current_user=current_user, db=db)

    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition from '{current_status}' to '{target_status}'. "
                f"Allowed transitions for '{current_status}': {allowed}"
            ),
        )

    # Apply updates based on target status
    if target_status == FEEDBACK_STATUS_NEEDS_RETEST:
        if payload.retest_instructions:
            submission.retest_instructions = payload.retest_instructions
    elif target_status == FEEDBACK_STATUS_RESOLVED:
        if payload.resolution_notes:
            submission.resolution_notes = payload.resolution_notes

    submission.status = target_status
    now = datetime.now(timezone.utc)
    submission.updated_at = now

    # Record history
    history_reason = payload.reason or payload.retest_instructions or payload.resolution_notes
    history_entry = FeedbackStatusHistory(
        id=uuid.uuid4(),
        feedback_id=submission.id,
        actor_id=current_user.id,
        previous_status=current_status,
        new_status=target_status,
        reason=history_reason,
        created_at=now,
    )
    db.add(history_entry)
    db.commit()

    logger.info(
        "Founder %s moved feedback %s from '%s' to '%s'",
        current_user.id,
        submission.id,
        current_status,
        target_status,
    )

    return get_founder_feedback_detail(feedback_id=feedback_id, current_user=current_user, db=db)


@router.post(
    "/api/founder/feedback/{feedback_id}/notes",
    response_model=FeedbackInternalNoteResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Add private internal note to feedback submission",
    description="Records a private internal note visible exclusively to the owning founder.",
)
def add_feedback_internal_note(
    feedback_id: uuid.UUID,
    payload: FeedbackInternalNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FeedbackInternalNoteResponse:
    """
    Creates a private internal note on a feedback submission.
    Notes are strictly founder-only and never exposed to testers.
    """
    stmt = (
        select(FeedbackSubmission)
        .join(Campaign, FeedbackSubmission.campaign_id == Campaign.id)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(
            FeedbackSubmission.id == feedback_id,
            Startup.owner_id == current_user.id,
        )
    )
    submission = db.scalar(stmt)
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    now = datetime.now(timezone.utc)
    note = FeedbackInternalNote(
        id=uuid.uuid4(),
        feedback_id=submission.id,
        author_id=current_user.id,
        body=payload.body,
        created_at=now,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    logger.info(
        "Founder %s added internal note to feedback %s",
        current_user.id,
        feedback_id,
    )

    return FeedbackInternalNoteResponse(
        id=note.id,
        feedback_id=note.feedback_id,
        author_id=note.author_id,
        author_name=current_user.full_name,
        body=note.body,
        created_at=note.created_at,
    )


# ==============================================================================
# Screen Recording Video Upload, Streaming & Timestamped Annotation Endpoints
# ==============================================================================

VIDEOS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "videos"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/api/feedback/upload-video",
    status_code=status.HTTP_201_CREATED,
    summary="Upload in-browser screen recording video",
    description="Accepts video binary stream from tester MediaRecorder and persists it securely.",
)
async def upload_feedback_video(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Saves an in-browser WebRTC / MediaRecorder screen recording.
    Enforces a 100MB max payload limit and generates a collision-free filename.
    """
    body = await request.body()
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video binary payload received.",
        )

    # 100MB max limit
    MAX_SIZE = 100 * 1024 * 1024
    if len(body) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Screen recording video exceeds maximum allowed size of 100MB.",
        )

    content_type = request.headers.get("content-type", "video/webm")
    ext = "mp4" if "mp4" in content_type else "webm"
    filename = f"repro_{uuid.uuid4().hex}.{ext}"
    target_path = VIDEOS_DIR / filename

    with open(target_path, "wb") as f:
        f.write(body)

    logger.info(
        "User %s uploaded screen recording [%s, %d bytes]",
        current_user.id,
        filename,
        len(body),
    )

    return {
        "video_url": f"/api/feedback/videos/{filename}",
        "filename": filename,
        "format": ext,
        "size_bytes": len(body),
    }


@router.get(
    "/api/feedback/videos/{filename}",
    summary="Stream feedback screen recording video",
    description="Serves recorded video files with HTTP byte-range seeking support.",
)
async def stream_feedback_video(filename: str):
    """
    Streams screen recording video with Starlette FileResponse (supporting HTTP 206 Partial Content).
    Prevents path traversal via strict regex validation.
    """
    if not re.match(r"^repro_[a-f0-9]{32}\.(webm|mp4)$", filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video filename format.",
        )

    target_path = VIDEOS_DIR / filename
    if not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video recording not found.",
        )

    media_type = "video/mp4" if filename.endswith(".mp4") else "video/webm"
    return FileResponse(target_path, media_type=media_type)


@router.post(
    "/api/feedback/{feedback_id}/video-notes",
    status_code=status.HTTP_201_CREATED,
    summary="Add a timestamped annotation to a feedback video",
    description="Allows founders and testers to attach chronological reproduction notes to a video.",
)
def add_timestamped_video_note(
    feedback_id: uuid.UUID,
    payload: TimestampedNoteAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Appends a timestamped note to a feedback submission's recording.
    Permitted for either:
    - The author tester who filed the submission.
    - The founder who owns the campaign.
    """
    submission = db.scalar(
        select(FeedbackSubmission)
        .options(joinedload(FeedbackSubmission.campaign).joinedload(Campaign.startup))
        .where(FeedbackSubmission.id == feedback_id)
    )

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    is_author_tester = submission.tester_id == current_user.id
    is_owner_founder = (
        submission.campaign
        and submission.campaign.startup
        and submission.campaign.startup.owner_id == current_user.id
    )

    if not is_author_tester and not is_owner_founder:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to annotate this feedback recording.",
        )

    new_note = {
        "id": uuid.uuid4().hex[:8],
        "timestamp_seconds": payload.timestamp_seconds,
        "timestamp_display": payload.timestamp_display,
        "note": payload.note.strip(),
        "tag": payload.tag.strip() if payload.tag else "repro_marker",
        "author_id": str(current_user.id),
        "author_name": current_user.full_name,
        "author_role": current_user.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    current_notes = list(submission.timestamped_notes or [])
    current_notes.append(new_note)
    # Maintain chronological order by timestamp_seconds
    current_notes.sort(key=lambda x: x.get("timestamp_seconds", 0))

    submission.timestamped_notes = current_notes
    db.commit()

    logger.info(
        "User %s added timestamped note [%s at %s] to feedback %s",
        current_user.id,
        new_note["id"],
        payload.timestamp_display,
        feedback_id,
    )

    return {
        "message": "Timestamped note added successfully.",
        "note": new_note,
        "timestamped_notes": current_notes,
    }


@router.post(
    "/api/founder/feedback/{feedback_id}/ai-triage",
    response_model=AiTriageResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Run AI Bug Triaging & Root-Cause Clustering",
    description="Synthesizes root causes, complexity, user friction, duplicate detection, and dev ticket markdown.",
)
def run_ai_feedback_triage(
    feedback_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AiTriageResponse:
    """Executes heuristic and AI bug triaging on the feedback submission."""
    submission = db.scalar(
        select(FeedbackSubmission)
        .options(
            joinedload(FeedbackSubmission.campaign).joinedload(Campaign.startup),
            joinedload(FeedbackSubmission.tester),
        )
        .where(FeedbackSubmission.id == feedback_id)
    )

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback submission not found.",
        )

    camp = submission.campaign
    if not camp or not camp.startup or camp.startup.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to triage feedback for this campaign.",
        )

    # Fetch all campaign feedback for semantic duplicate detection
    all_campaign_feedback = db.scalars(
        select(FeedbackSubmission)
        .options(joinedload(FeedbackSubmission.tester))
        .where(FeedbackSubmission.campaign_id == submission.campaign_id)
    ).all()

    triage_result = analyze_feedback_item(submission, all_campaign_feedback)
    submission.ai_triage_data = triage_result
    db.commit()

    logger.info(
        "Founder %s ran AI triage on feedback %s (complexity=%s, duplicates=%d)",
        current_user.id,
        feedback_id,
        triage_result.get("fix_complexity"),
        len(triage_result.get("potential_duplicates", [])),
    )

    return AiTriageResponse(**triage_result)


@router.post(
    "/api/founder/feedback/executive-synthesis",
    response_model=AiExecutiveSynthesisResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Generate Holistic AI Executive Synthesis across All Feedback",
    description="Aggregates and synthesizes dozens of feedback reports, deriving the #1 single most critical issue, readiness verdict, and PR brief.",
)
def generate_executive_feedback_synthesis(
    campaign_id: Optional[uuid.UUID] = Query(None, description="Scope synthesis to a specific campaign"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AiExecutiveSynthesisResponse:
    """Aggregates all feedback submissions into one holistic executive report and derives the #1 critical blocker."""
    # Query campaigns owned by founder
    camp_stmt = (
        select(Campaign)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(Startup.owner_id == current_user.id)
    )
    if campaign_id:
        camp_stmt = camp_stmt.where(Campaign.id == campaign_id)

    campaigns = db.scalars(camp_stmt).all()
    if not campaigns:
        return AiExecutiveSynthesisResponse(
            campaign_id=campaign_id,
            campaign_title="No campaigns found",
            total_reports_analyzed=0,
            critical_bugs_count=0,
            high_bugs_count=0,
            release_readiness_score=100,
            release_readiness_verdict="READY FOR RELEASE",
            single_most_critical_blocker={
                "headline": "No Campaigns or Submissions Available",
                "business_impact": "Create and publish a campaign to start gathering tester feedback.",
                "affected_reports_count": 0,
                "underlying_nexus": "N/A",
                "recommended_hotfix": "Launch a beta test campaign on TryLo.",
            },
            top_prioritized_actions=[],
            executive_summary_markdown="# Executive Health Verdict\n\nNo campaigns or submissions found.",
            unified_pr_brief_markdown="# PR Brief\n\nNo issues found.",
            synthesized_at=datetime.now(timezone.utc),
        )

    campaign_ids = [c.id for c in campaigns]
    campaign_title = campaigns[0].title if len(campaigns) == 1 else "All Active Campaigns"

    # Fetch all feedback across these campaigns
    stmt = (
        select(FeedbackSubmission)
        .options(
            joinedload(FeedbackSubmission.campaign),
            joinedload(FeedbackSubmission.tester),
        )
        .where(FeedbackSubmission.campaign_id.in_(campaign_ids))
        .order_by(FeedbackSubmission.created_at.desc())
    )
    submissions = db.scalars(stmt).all()

    synthesis_dict = synthesize_batch_feedback_insights(
        submissions=submissions,
        campaign_title=campaign_title,
        campaign_id=campaign_id if len(campaigns) == 1 else None,
    )

    logger.info(
        "Founder %s generated AI executive synthesis for %d submissions (verdict=%s, score=%d)",
        current_user.id,
        len(submissions),
        synthesis_dict.get("release_readiness_verdict"),
        synthesis_dict.get("release_readiness_score"),
    )

    return AiExecutiveSynthesisResponse(**synthesis_dict)


@router.post(
    "/api/founder/ai-copilot/query",
    response_model=AiCopilotQueryResponse,
    summary="Ask TryLo AI Co-Pilot a conversational query across campaign feedback",
)
def query_founder_ai_copilot(
    payload: AiCopilotQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("founder")),
):
    """
    Synthesize natural language answers to founder inquiries across all
    campaign feedback submissions, bug reports, and video proof notes.
    """
    # 1. Resolve accessible campaigns
    camp_stmt = (
        select(Campaign)
        .join(Startup, Campaign.startup_id == Startup.id)
        .where(Startup.owner_id == current_user.id)
    )
    if payload.campaign_id:
        camp_stmt = camp_stmt.where(Campaign.id == payload.campaign_id)

    campaigns = db.scalars(camp_stmt).all()
    if payload.campaign_id and not campaigns:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or not owned by founder",
        )

    if not campaigns:
        copilot_dict = query_ai_copilot(
            query=payload.query,
            submissions=[],
            campaign_title=None,
        )
        return AiCopilotQueryResponse(**copilot_dict)

    campaign_ids = [c.id for c in campaigns]
    campaign_title = campaigns[0].title if len(campaigns) == 1 else "All Active Campaigns"

    # Fetch submissions
    stmt = (
        select(FeedbackSubmission)
        .options(
            joinedload(FeedbackSubmission.campaign),
            joinedload(FeedbackSubmission.tester),
        )
        .where(FeedbackSubmission.campaign_id.in_(campaign_ids))
        .order_by(FeedbackSubmission.created_at.desc())
    )
    submissions = db.scalars(stmt).all()

    copilot_dict = query_ai_copilot(
        query=payload.query,
        submissions=submissions,
        campaign_title=campaign_title,
    )

    logger.info(
        "Founder %s queried AI Co-Pilot (query='%s', matches=%d)",
        current_user.id,
        payload.query[:60],
        len(copilot_dict.get("referenced_feedbacks", [])),
    )

    return AiCopilotQueryResponse(**copilot_dict)




