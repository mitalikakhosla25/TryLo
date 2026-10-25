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
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    feedback_type: str
    title: str
    description: str
    severity: Optional[str] = None
    status: str
    retest_instructions: Optional[str] = None
    resolution_notes: Optional[str] = None
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
    created_at: datetime
    updated_at: datetime
    internal_notes: List[FeedbackInternalNoteResponse] = []
    status_history: List[FeedbackStatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)
