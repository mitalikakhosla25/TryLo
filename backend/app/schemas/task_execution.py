"""Pydantic Schemas for Tester Task Execution and Structured Feedback."""

import re
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.task_progress import (
    ALLOWED_TASK_PROGRESS_STATUSES,
    TASK_PROGRESS_NOT_STARTED,
)
from app.models.feedback import (
    ALLOWED_FEEDBACK_TYPES,
    ALLOWED_SEVERITIES,
    FEEDBACK_TYPE_BUG,
    FEEDBACK_TYPE_GENERAL,
    FEEDBACK_STATUS_SUBMITTED,
)


class TestingTaskDetail(BaseModel):
    """Structured testing task with execution progress."""
    id: str
    title: str
    description: Optional[str] = None
    expected_outcome: Optional[str] = None
    estimated_duration: Optional[str] = None
    is_required: bool = True
    order: int = 1
    status: str = TASK_PROGRESS_NOT_STARTED
    completion_note: Optional[str] = None
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CampaignTasksResponse(BaseModel):
    """Response containing campaign tasks and tester's progress."""
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_name: str
    startup_slug: str
    product_type: Optional[str] = None
    product_url: Optional[str] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    campaign_status: str
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    tasks: List[TestingTaskDetail]

    model_config = ConfigDict(from_attributes=True)


class TaskProgressUpdateRequest(BaseModel):
    """Payload for updating a tester's task progress."""
    status: str
    completion_note: Optional[str] = Field(None, max_length=1000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_TASK_PROGRESS_STATUSES:
            raise ValueError(f"Status must be one of: {ALLOWED_TASK_PROGRESS_STATUSES}")
        return clean

    @field_validator("completion_note")
    @classmethod
    def sanitize_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class TaskProgressResponse(BaseModel):
    """Response returned when task progress is updated or retrieved."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    task_id: str
    tester_id: uuid.UUID
    status: str
    completion_note: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TesterCampaignAssignmentItem(BaseModel):
    """Summary of an accepted campaign and its task progress for the tester."""
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_name: str
    startup_slug: str
    product_type: Optional[str] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    campaign_status: str
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    assignment_status: str  # not_started, in_progress, completed
    accepted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TesterTaskListResponse(BaseModel):
    """List of all testing assignments for the current tester."""
    total_campaigns: int
    items: List[TesterCampaignAssignmentItem]


class FeedbackCreateRequest(BaseModel):
    """Payload for submitting structured feedback or bug reports."""
    feedback_type: str
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    task_id: Optional[str] = Field(None, max_length=100)
    expected_behavior: Optional[str] = Field(None, max_length=2000)
    actual_behavior: Optional[str] = Field(None, max_length=2000)
    reproduction_steps: Optional[str] = Field(None, max_length=3000)
    severity: Optional[str] = None

    @field_validator("feedback_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_FEEDBACK_TYPES:
            raise ValueError(f"feedback_type must be one of: {ALLOWED_FEEDBACK_TYPES}")
        return clean

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 3:
            raise ValueError("Title must contain at least 3 non-whitespace characters.")
        return trimmed

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 10:
            raise ValueError("Description must contain at least 10 non-whitespace characters.")
        return trimmed

    @field_validator("task_id")
    @classmethod
    def sanitize_task_id(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None

    @field_validator("expected_behavior", "actual_behavior", "reproduction_steps")
    @classmethod
    def sanitize_optional_text(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        clean = v.strip().lower()
        if clean not in ALLOWED_SEVERITIES:
            raise ValueError(f"Severity must be one of: {ALLOWED_SEVERITIES}")
        return clean

    @model_validator(mode="after")
    def apply_defaults_and_cross_field_rules(self) -> "FeedbackCreateRequest":
        # For bug reports, default severity to medium if not specified
        if self.feedback_type == FEEDBACK_TYPE_BUG and not self.severity:
            self.severity = "medium"
        return self


class FeedbackSubmissionResponse(BaseModel):
    """Response representing a recorded feedback submission."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    task_id: Optional[str] = None
    task_title: Optional[str] = None
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

    model_config = ConfigDict(from_attributes=True)


class FeedbackListResponse(BaseModel):
    """List of feedback submissions authored by the tester."""
    total: int
    items: List[FeedbackSubmissionResponse]
