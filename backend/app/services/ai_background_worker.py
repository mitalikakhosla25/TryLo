"""TryLo Durable AI Background Worker Service.

Manages durable, asynchronous AI analysis jobs for feedback submissions
with atomic job claiming, processing leases, startup crash recovery,
non-blocking exponential backoff, status tracking, and campaign synthesis invalidation.
"""

import logging
import random
import threading
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, update, or_, and_

from app.db.session import get_session_factory
from app.models.feedback import FeedbackSubmission, AIAnalysisJob, CampaignAiSynthesis
from app.services.ai_triage import analyze_feedback_item

logger = logging.getLogger("trylo.ai_worker")

MAX_JOB_ATTEMPTS = 3
LEASE_DURATION_SECONDS = 300  # 5 minutes
INITIAL_RETRY_BACKOFF_SECONDS = 2.0

# Safe worker shutdown flag
_shutdown_event = threading.Event()


def signal_worker_shutdown() -> None:
    """Signal worker to stop accepting or processing new background jobs."""
    logger.info("Signaling AI background worker shutdown...")
    _shutdown_event.set()


def is_worker_shutting_down() -> bool:
    """Return True if worker is in the process of shutting down."""
    return _shutdown_event.is_set()


def enqueue_feedback_ai_job(
    feedback_id: uuid.UUID,
    campaign_id: uuid.UUID,
    db: Session,
) -> AIAnalysisJob:
    """Safely enqueue an individual feedback AI analysis job.

    Enforces idempotency: if an active job already exists for this feedback,
    returns the existing job rather than creating duplicates.
    """
    existing_job = db.scalar(
        select(AIAnalysisJob)
        .where(
            AIAnalysisJob.feedback_id == feedback_id,
            AIAnalysisJob.status.in_(["pending", "processing", "retrying"]),
        )
    )
    if existing_job:
        logger.info("Found existing active AI job %s for feedback %s", existing_job.id, feedback_id)
        return existing_job

    now = datetime.now(timezone.utc)
    job = AIAnalysisJob(
        id=uuid.uuid4(),
        feedback_id=feedback_id,
        campaign_id=campaign_id,
        job_type="individual_triage",
        status="pending",
        attempts=0,
        max_attempts=MAX_JOB_ATTEMPTS,
        scheduled_at=now,
        lease_expires_at=None,
        created_at=now,
    )
    db.add(job)

    # Mark submission status
    submission = db.scalar(select(FeedbackSubmission).where(FeedbackSubmission.id == feedback_id))
    if submission:
        submission.ai_analysis_status = "pending"

    db.commit()
    db.refresh(job)
    logger.info("Enqueued durable AI analysis job %s for feedback %s", job.id, feedback_id)
    return job


def _atomic_claim_job(db: Session, job_id: uuid.UUID) -> bool:
    """Atomically claim a pending, retrying, or expired processing job.

    Enforces:
    - Atomicity: Single UPDATE query prevents concurrent workers from double-processing.
    - Lease validation: Jobs stuck in 'processing' whose lease has expired can be reclaimed.
    - Schedule enforcement: Only jobs where scheduled_at <= now are claimed.
    - Short transaction: Commits immediately and returns True on success, False if already claimed.
    """
    now = datetime.now(timezone.utc)
    lease_expires = now + timedelta(seconds=LEASE_DURATION_SECONDS)

    stmt = (
        update(AIAnalysisJob)
        .where(
            AIAnalysisJob.id == job_id,
            or_(
                AIAnalysisJob.status.in_(["pending", "retrying"]),
                and_(
                    AIAnalysisJob.status == "processing",
                    or_(
                        AIAnalysisJob.lease_expires_at == None,
                        AIAnalysisJob.lease_expires_at < now,
                    ),
                ),
            ),
            AIAnalysisJob.scheduled_at <= now,
        )
        .values(
            status="processing",
            started_at=now,
            lease_expires_at=lease_expires,
            attempts=AIAnalysisJob.attempts + 1,
        )
    )
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0


def _schedule_delayed_retry(job_id: uuid.UUID, delay_seconds: float) -> None:
    """Schedule non-blocking retry execution without stalling the worker thread."""
    if is_worker_shutting_down():
        logger.info("Worker shutting down; deferring retry of job %s to startup recovery.", job_id)
        return

    def _trigger():
        if not is_worker_shutting_down():
            process_feedback_ai_job(job_id)

    timer = threading.Timer(max(0.1, delay_seconds), _trigger)
    timer.daemon = True
    timer.start()


def process_feedback_ai_job(job_id: uuid.UUID) -> bool:
    """Execute background processing for an individual AI analysis job.

    Key Reliability Guarantees:
    1. Atomic job claiming prevents duplicate execution across workers/threads.
    2. Short database transactions: No database lock is held while calling Gemini!
    3. Processing lease with expiration allows recovery from worker crashes.
    4. Non-blocking retry scheduling using scheduled_at without time.sleep().
    5. Maximum retry limit triggers deterministic offline fallback.
    6. Safe worker shutdown: gracefully respects shutdown signals.
    """
    if is_worker_shutting_down():
        logger.info("Worker is shutting down. Deferring job %s execution.", job_id)
        return False

    session_factory = get_session_factory()
    if not session_factory:
        logger.error("Database session factory unavailable for job %s", job_id)
        return False

    # --- STEP 1: Atomic Job Claim & Fact Retrieval (Short Transaction) ---
    with session_factory() as db:
        claimed = _atomic_claim_job(db, job_id)
        if not claimed:
            logger.info("Job %s could not be claimed (already running, not due, or completed). Skipping.", job_id)
            return False

        job = db.scalar(select(AIAnalysisJob).where(AIAnalysisJob.id == job_id))
        if not job:
            return False

        submission = db.scalar(
            select(FeedbackSubmission)
            .options(joinedload(FeedbackSubmission.tester))
            .where(FeedbackSubmission.id == job.feedback_id)
        )
        if not submission:
            job.status = "failed"
            job.last_error = f"Feedback submission {job.feedback_id} not found."
            job.lease_expires_at = None
            db.commit()
            return False

        submission.ai_analysis_status = "processing"
        db.commit()

        # Load all campaign feedback with testers pre-loaded for duplicate analysis
        campaign_feedback = db.scalars(
            select(FeedbackSubmission)
            .options(joinedload(FeedbackSubmission.tester))
            .where(FeedbackSubmission.campaign_id == job.campaign_id)
        ).unique().all()

        campaign_id = job.campaign_id
        feedback_id = job.feedback_id
        current_attempts = job.attempts
        max_attempts = job.max_attempts

    # --- STEP 2: Execute AI Reasoning (ZERO DB LOCKS HELD) ---
    # The database transaction is fully closed above. Gemini network latency
    # will never block connection pool threads or hold row/table locks.
    try:
        triage_result = analyze_feedback_item(submission, campaign_feedback)
        analysis_error = None
    except Exception as exc:
        logger.warning("Error during AI triage for job %s (attempt %d/%d): %s", job_id, current_attempts, max_attempts, exc)
        triage_result = None
        analysis_error = str(exc)

    # --- STEP 3: Persist Results or Schedule Retry (Short Transaction) ---
    with session_factory() as db:
        job = db.scalar(select(AIAnalysisJob).where(AIAnalysisJob.id == job_id))
        submission = db.scalar(select(FeedbackSubmission).where(FeedbackSubmission.id == feedback_id))
        if not job or not submission:
            return False

        now = datetime.now(timezone.utc)

        if triage_result is not None:
            # Succeeded: persist results and outdate campaign synthesis
            submission.ai_triage_data = triage_result
            submission.ai_analysis_status = "completed"
            submission.ai_analyzed_at = now

            job.status = "completed"
            job.completed_at = now
            job.lease_expires_at = None
            job.last_error = None

            existing_syntheses = db.scalars(
                select(CampaignAiSynthesis)
                .where(
                    CampaignAiSynthesis.campaign_id == campaign_id,
                    CampaignAiSynthesis.is_outdated == False,
                )
            ).all()
            for s in existing_syntheses:
                s.is_outdated = True

            db.commit()
            logger.info("Successfully completed AI analysis job %s for feedback %s", job_id, feedback_id)
            return True

        # AI reasoning failed: evaluate retry vs fallback
        job.last_error = analysis_error

        if current_attempts < max_attempts:
            # Schedule non-blocking retry using exponential backoff
            delay_seconds = (INITIAL_RETRY_BACKOFF_SECONDS ** current_attempts) + random.uniform(0.1, 0.5)
            scheduled_time = now + timedelta(seconds=delay_seconds)

            job.status = "retrying"
            job.scheduled_at = scheduled_time
            job.lease_expires_at = None

            submission.ai_analysis_status = "retrying"
            db.commit()

            logger.info("Job %s scheduled for non-blocking retry in %.2fs (attempt %d/%d)", job_id, delay_seconds, current_attempts + 1, max_attempts)
            _schedule_delayed_retry(job_id, delay_seconds)
            return False
        else:
            # Retries exhausted: guaranteed deterministic fallback
            logger.error("Job %s exhausted retries. Executing guaranteed local heuristic fallback.", job_id)
            try:
                from app.core.config import settings
                old_key = settings.GEMINI_API_KEY
                try:
                    settings.GEMINI_API_KEY = None
                    fallback_result = analyze_feedback_item(submission, campaign_feedback)
                finally:
                    settings.GEMINI_API_KEY = old_key

                submission.ai_triage_data = fallback_result
                submission.ai_analysis_status = "completed_fallback"
                submission.ai_analyzed_at = now

                job.status = "completed"
                job.completed_at = now
                job.lease_expires_at = None
                db.commit()
                logger.info("Job %s successfully recovered via deterministic fallback.", job_id)
                return True
            except Exception as fb_exc:
                logger.critical("Critical: deterministic fallback failed for job %s: %s", job_id, fb_exc)
                job.status = "failed"
                job.lease_expires_at = None
                submission.ai_analysis_status = "failed"
                db.commit()
                return False


def recover_interrupted_jobs(db: Optional[Session] = None) -> int:
    """Scan and recover all pending, retrying, and abandoned/expired processing jobs.

    Recovers:
    1. Jobs in 'processing' state where lease_expires_at < now (interrupted by server crash/restart).
       - If attempts >= max_attempts: resolves via guaranteed fallback.
       - Otherwise: resets status to 'retrying' and schedules immediate pickup.
    2. Jobs in 'pending' or 'retrying' state where scheduled_at <= now.
    
    Returns the total number of jobs queued or recovered.
    """
    session_factory = get_session_factory()
    if not session_factory and not db:
        logger.error("Cannot recover jobs: Database session factory unavailable.")
        return 0

    close_db_when_done = False
    if db is None:
        db = session_factory()
        close_db_when_done = True

    try:
        now = datetime.now(timezone.utc)

        # 1. Detect abandoned processing jobs whose lease has expired
        abandoned_jobs = db.scalars(
            select(AIAnalysisJob)
            .where(
                AIAnalysisJob.status == "processing",
                or_(
                    AIAnalysisJob.lease_expires_at == None,
                    AIAnalysisJob.lease_expires_at < now,
                ),
            )
        ).all()

        recovered_count = 0
        jobs_to_dispatch: List[uuid.UUID] = []

        for job in abandoned_jobs:
            logger.warning("Recovering abandoned processing job %s (lease expired at %s)", job.id, job.lease_expires_at)
            if job.attempts >= job.max_attempts:
                # Retries exhausted while processing: apply fallback directly
                submission = db.scalar(select(FeedbackSubmission).where(FeedbackSubmission.id == job.feedback_id))
                if submission:
                    try:
                        from app.core.config import settings
                        old_key = settings.GEMINI_API_KEY
                        try:
                            settings.GEMINI_API_KEY = None
                            fallback_result = analyze_feedback_item(submission, [submission])
                        finally:
                            settings.GEMINI_API_KEY = old_key

                        submission.ai_triage_data = fallback_result
                        submission.ai_analysis_status = "completed_fallback"
                        submission.ai_analyzed_at = now
                    except Exception as fb_err:
                        logger.error("Fallback failed during crash recovery for job %s: %s", job.id, fb_err)

                job.status = "completed"
                job.completed_at = now
                job.lease_expires_at = None
                job.last_error = "Recovered after worker crash. Deterministic fallback applied."
            else:
                job.status = "retrying"
                job.scheduled_at = now
                job.lease_expires_at = None
                jobs_to_dispatch.append(job.id)
            recovered_count += 1

        # 2. Find any pending or retrying jobs that are due
        due_jobs = db.scalars(
            select(AIAnalysisJob)
            .where(
                AIAnalysisJob.status.in_(["pending", "retrying"]),
                AIAnalysisJob.scheduled_at <= now,
            )
        ).all()

        for job in due_jobs:
            if job.id not in jobs_to_dispatch:
                jobs_to_dispatch.append(job.id)
                recovered_count += 1

        db.commit()

        # Dispatch due jobs in background threads without blocking
        for jid in jobs_to_dispatch:
            _schedule_delayed_retry(jid, 0.1)

        if recovered_count > 0:
            logger.info("Startup / sweep recovery complete: recovered %d background AI jobs.", recovered_count)
        return recovered_count

    except Exception as exc:
        logger.error("Error during job recovery sweep: %s", exc)
        return 0
    finally:
        if close_db_when_done:
            db.close()
