"""TryLo Founder Feedback Management Pydantic Schemas."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.feedback import ALLOWED_FEEDBACK_STATUSES


class FeedbackStatusUpdateRequest(BaseModel):
    """Payload for updating the status of a feedback submission."""
    status: str
    retest_instructions: Optional[str] = Field(None, max_length=3000)
    resolution_notes: Optional[str] = Field(None, max_length=3000)
    reason: Optional[str] = Field(None, max_length=1000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_FEEDBACK_STATUSES:
            raise ValueError(f"Status must be one of: {ALLOWED_FEEDBACK_STATUSES}")
        return clean

    @field_validator("retest_instructions", "resolution_notes", "reason")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class FeedbackInternalNoteCreate(BaseModel):
    """Payload for adding a private founder internal note to a feedback submission."""
    body: str = Field(..., min_length=1, max_length=5000)

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Note body cannot be empty or only whitespace.")
        return trimmed


class FeedbackInternalNoteResponse(BaseModel):
    """Founder-only response for an internal note on a feedback submission."""
    id: uuid.UUID
    feedback_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackStatusHistoryResponse(BaseModel):
    """Audit log record of a feedback lifecycle transition."""
    id: uuid.UUID
    feedback_id: uuid.UUID
    actor_id: uuid.UUID
    actor_name: str
    previous_status: str
    new_status: str
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FounderFeedbackListItemResponse(BaseModel):
    """Summary item for founder feedback dashboard list."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    tester_name: str
    tester_experience_level: Optional[str] = None
    tester_verification_tier: Optional[int] = 1
    tester_average_rating: Optional[float] = None
    tester_reviews_count: Optional[int] = None
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    feedback_type: str
    title: str
    description: str
    severity: Optional[str] = None
    status: str
    retest_instructions: Optional[str] = None
    resolution_notes: Optional[str] = None
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    notes_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FounderFeedbackListResponse(BaseModel):
    """Paginated list of feedback items for founder review."""
    total: int
    page: int
    limit: int
    items: List[FounderFeedbackListItemResponse]


class DuplicateFeedbackMatch(BaseModel):
    """Potential duplicate issue detected via semantic and keyword correlation."""
    id: uuid.UUID
    title: str
    similarity_score: int
    severity: Optional[str] = None
    status: str
    tester_name: str
    created_at: datetime


class AiTriageResponse(BaseModel):
    """AI synthesis of root cause, complexity, user friction, duplicates, and dev ticket."""
    root_cause_hypothesis: str
    fix_complexity: str
    suggested_fix: str
    technical_tags: List[str]
    sentiment_label: str
    friction_score: int
    potential_duplicates: List[DuplicateFeedbackMatch] = []
    dev_ticket_markdown: str
    analyzed_at: datetime


class FounderFeedbackDetailResponse(BaseModel):
    """Complete founder review response for a single feedback submission."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    tester_name: str
    tester_experience_level: Optional[str] = None
    tester_verification_tier: Optional[int] = 1
    tester_average_rating: Optional[float] = None
    tester_reviews_count: Optional[int] = None
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    task_description: Optional[str] = None
    task_expected_outcome: Optional[str] = None
    feedback_type: str
    title: str
    description: str
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    reproduction_steps: Optional[str] = None
    severity: Optional[str] = None
    status: str
    retest_instructions: Optional[str] = None
    resolution_notes: Optional[str] = None
    device_info: Optional[dict] = None
    attachments: List[str] = Field(default_factory=list)
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    video_format: Optional[str] = None
    timestamped_notes: List[dict] = Field(default_factory=list)
    ai_triage: Optional[AiTriageResponse] = None
    created_at: datetime
    updated_at: datetime
    internal_notes: List[FeedbackInternalNoteResponse] = []
    status_history: List[FeedbackStatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TimestampedNoteAddRequest(BaseModel):
    """Payload for adding a timestamped annotation to a feedback video."""
    timestamp_seconds: int = Field(..., ge=0)
    timestamp_display: str = Field(..., min_length=1, max_length=10)
    note: str = Field(..., min_length=2, max_length=1000)
    tag: Optional[str] = Field(None, max_length=50)


class SingleMostCriticalBlocker(BaseModel):
    """The single most critical failure mode or bottleneck derived from all feedback."""
    headline: str
    business_impact: str
    affected_reports_count: int
    underlying_nexus: str
    recommended_hotfix: str
    revenue_at_risk_monthly: Optional[str] = None
    churn_risk_percentage: Optional[int] = None
    git_diff_patch: Optional[str] = None


class PrioritizedActionItem(BaseModel):
    """Ranked high-ROI engineering action item to unblock the product."""
    priority: int
    action_title: str
    rationale: str
    estimated_effort: str
    affected_reports_count: int


class AiExecutiveSynthesisResponse(BaseModel):
    """Holistic AI executive synthesis summarizing dozens of feedbacks into the primary blocker and release verdict."""
    campaign_id: Optional[uuid.UUID] = None
    campaign_title: Optional[str] = None
    total_reports_analyzed: int
    critical_bugs_count: int
    high_bugs_count: int
    release_readiness_score: int
    release_readiness_verdict: str
    single_most_critical_blocker: SingleMostCriticalBlocker
    top_prioritized_actions: List[PrioritizedActionItem]
    executive_summary_markdown: str
    unified_pr_brief_markdown: str
    synthesized_at: datetime


class AiCopilotReferencedFeedback(BaseModel):
    """Feedback item cited in an AI Co-Pilot query response."""
    id: uuid.UUID
    title: str
    severity: Optional[str] = None
    tester_name: str


class AiCopilotQueryRequest(BaseModel):
    """Payload for conversational founder query to the TryLo AI Co-Pilot."""
    query: str = Field(..., min_length=2, max_length=1000)
    campaign_id: Optional[uuid.UUID] = None


class AiCopilotQueryResponse(BaseModel):
    """Conversational intelligence synthesis directly answering the founder's inquiry."""
    query: str
    answer_markdown: str
    key_takeaways: List[str] = []
    suggested_followups: List[str] = []
    referenced_feedbacks: List[AiCopilotReferencedFeedback] = []
    timestamp: datetime


