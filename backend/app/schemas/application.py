"""Pydantic Schemas for TryLo Campaign Applications and Screening."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

QUESTION_TYPE_TEXT = "text"
QUESTION_TYPE_CHOICE = "single_choice"
QUESTION_TYPE_BOOLEAN = "boolean"
ALLOWED_QUESTION_TYPES = [
    QUESTION_TYPE_TEXT,
    QUESTION_TYPE_CHOICE,
    QUESTION_TYPE_BOOLEAN,
]


class ScreeningQuestion(BaseModel):
    """Configurable screening question on a campaign."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    prompt: str = Field(..., min_length=3, max_length=300)
    question_type: str = Field(default=QUESTION_TYPE_TEXT)
    is_required: bool = True
    options: List[str] = Field(default_factory=list)

    @field_validator("prompt")
    @classmethod
    def clean_prompt(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 3:
            raise ValueError("Question prompt must be at least 3 characters.")
        if "<script" in trimmed.lower() or "</script" in trimmed.lower():
            raise ValueError("HTML script tags are not permitted in question prompts.")
        return trimmed

    @field_validator("question_type")
    @classmethod
    def check_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_QUESTION_TYPES:
            raise ValueError(f"question_type must be one of: {ALLOWED_QUESTION_TYPES}")
        return clean

    @model_validator(mode="after")
    def validate_options(self) -> "ScreeningQuestion":
        if self.question_type == QUESTION_TYPE_CHOICE:
            cleaned_opts = [opt.strip() for opt in self.options if opt and opt.strip()]
            if len(cleaned_opts) < 2:
                raise ValueError("Single choice questions must provide at least 2 distinct options.")
            if len(cleaned_opts) > 10:
                raise ValueError("Single choice questions cannot have more than 10 options.")
            self.options = cleaned_opts
        elif self.question_type == QUESTION_TYPE_BOOLEAN:
            # Booleans don't need custom options; default to Yes/No
            self.options = ["Yes", "No"]
        else:
            self.options = []
        return self


class CampaignApplicationCreateRequest(BaseModel):
    """Payload for submitting a tester application to a campaign."""
    screening_answers: Dict[str, Any] = Field(default_factory=dict)
    motivation: Optional[str] = Field(None, max_length=1000)

    @field_validator("motivation")
    @classmethod
    def clean_motivation(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if "<script" in trimmed.lower() or "</script" in trimmed.lower():
            raise ValueError("HTML script tags are not permitted in motivation.")
        return trimmed or None


class CampaignApplicationResponse(BaseModel):
    """Basic campaign application response returned upon submission or status check."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    tester_id: uuid.UUID
    status: str
    screening_answers: Dict[str, Any] = Field(default_factory=dict)
    motivation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignApplicationDetailResponse(BaseModel):
    """Enriched application response returned to the tester in 'My Applications'."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    tester_id: uuid.UUID
    status: str
    screening_answers: Dict[str, Any] = Field(default_factory=dict)
    motivation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Associated Campaign & Startup Details (Public data only)
    campaign_title: str
    campaign_slug: str
    campaign_summary: Optional[str] = None
    campaign_product_type: Optional[str] = None
    startup_name: str
    startup_slug: str
    startup_logo_url: Optional[str] = None
    reward_type: str
    reward_amount: Optional[float] = None
    reward_currency: Optional[str] = None
    reward_description: Optional[str] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    application_deadline: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationStatusCheckResponse(BaseModel):
    """Lightweight check to verify whether the authenticated tester has applied to a campaign."""
    applied: bool
    application: Optional[CampaignApplicationResponse] = None


class TesterPublicProfile(BaseModel):
    """Sanitized tester profile details visible to founders reviewing applications."""
    user_id: uuid.UUID
    full_name: str
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    devices: List[str] = Field(default_factory=list)
    city: Optional[str] = None
    country: Optional[str] = None
    linkedin_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FounderApplicationItemResponse(BaseModel):
    """Application item returned to founder in application lists."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    tester: TesterPublicProfile
    status: str
    screening_answers: Dict[str, Any] = Field(default_factory=dict)
    motivation: Optional[str] = None
    rejection_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FounderApplicationListResponse(BaseModel):
    """Paginated applications response for founder campaign review."""
    items: List[FounderApplicationItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    accepted_testers: int
    max_testers: Optional[int] = None
    is_full: bool


class FounderApplicationDetailResponse(BaseModel):
    """Detailed application response for a founder reviewing an applicant."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    campaign_status: str
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    tester: TesterPublicProfile
    status: str
    screening_answers: Dict[str, Any] = Field(default_factory=dict)
    screening_questions: List[Dict[str, Any]] = Field(default_factory=list)
    motivation: Optional[str] = None
    rejection_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    accepted_testers: int
    max_testers: Optional[int] = None
    is_full: bool

    model_config = ConfigDict(from_attributes=True)


class CampaignApplicationRejectRequest(BaseModel):
    """Optional rejection payload allowing an internal rejection note."""
    rejection_note: Optional[str] = Field(None, max_length=1000)

    @field_validator("rejection_note")
    @classmethod
    def clean_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if "<script" in trimmed.lower() or "</script" in trimmed.lower():
            raise ValueError("HTML script tags are not permitted in rejection note.")
        return trimmed or None


class ApplicationStatusChangeResponse(BaseModel):
    """Response returned upon accepting or rejecting an application."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    tester_id: uuid.UUID
    status: str
    rejection_note: Optional[str] = None
    accepted_testers: int
    max_testers: Optional[int] = None
    is_full: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignAccessInstructionsResponse(BaseModel):
    """Confidential access instructions returned exclusively to accepted testers."""
    campaign_id: uuid.UUID
    title: str
    access_instructions: Optional[str] = None
    product_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

