"""Pydantic Schemas for TryLo Beta Campaigns."""

import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.campaign import (
    ALLOWED_CAMPAIGN_STATUSES,
    ALLOWED_PRODUCT_TYPES,
    ALLOWED_REWARD_TYPES,
    REWARD_TYPE_MONETARY,
    REWARD_TYPE_PERK,
    REWARD_TYPE_UNPAID,
)
from app.schemas.application import ScreeningQuestion


class TestingTask(BaseModel):
    """Structured testing task item."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    expected_outcome: Optional[str] = None
    estimated_duration: Optional[str] = None
    is_required: bool = True
    order: int = 1


class TargetAudience(BaseModel):
    """Structured criteria for target beta testers."""
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    devices: List[str] = Field(default_factory=list)
    countries: List[str] = Field(default_factory=list)
    min_age: Optional[int] = None
    notes: Optional[str] = None


def validate_product_url(url: Optional[str]) -> Optional[str]:
    """Validate optional URL starts with http:// or https://."""
    if not url or not url.strip():
        return None
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise ValueError("Product URL must start with http:// or https://")
    return url


def validate_currency_code(code: Optional[str]) -> Optional[str]:
    """Validate optional currency is a 3-letter uppercase ISO code."""
    if not code or not code.strip():
        return None
    cleaned = code.strip().upper()
    if not re.match(r"^[A-Z]{3}$", cleaned):
        raise ValueError("Currency code must be a 3-letter uppercase ISO code (e.g. USD, EUR, GBP, INR).")
    return cleaned


def validate_campaign_dates(
    application_deadline: Optional[datetime],
    testing_start_date: Optional[datetime],
    testing_end_date: Optional[datetime],
) -> None:
    """Validate chronological ordering of campaign dates."""
    if application_deadline and testing_start_date:
        if application_deadline > testing_start_date:
            raise ValueError("Application deadline cannot be after the testing start date.")

    if testing_start_date and testing_end_date:
        if testing_start_date > testing_end_date:
            raise ValueError("Testing start date cannot be after the testing end date.")

    if application_deadline and testing_end_date:
        if application_deadline > testing_end_date:
            raise ValueError("Application deadline cannot be after the testing end date.")


def validate_reward_logic(
    reward_type: str,
    reward_amount: Optional[float],
    reward_currency: Optional[str],
    reward_description: Optional[str],
) -> None:
    """Validate reward type, amount, currency, and perk description rules."""
    if reward_type not in ALLOWED_REWARD_TYPES:
        raise ValueError(f"reward_type must be one of: {ALLOWED_REWARD_TYPES}")

    if reward_amount is not None and reward_amount < 0:
        raise ValueError("Reward amount cannot be negative.")

    if reward_type == REWARD_TYPE_UNPAID:
        if reward_amount is not None and reward_amount > 0:
            raise ValueError("Unpaid campaigns cannot carry a positive monetary reward amount.")

    elif reward_type == REWARD_TYPE_MONETARY:
        if reward_amount is None or reward_amount <= 0:
            raise ValueError("Monetary reward campaigns must specify a positive reward amount greater than zero.")
        if not reward_currency or not reward_currency.strip():
            raise ValueError("Monetary reward campaigns must specify a 3-letter currency code.")

    elif reward_type == REWARD_TYPE_PERK:
        if reward_amount is not None and reward_amount > 0:
            raise ValueError("Perk/gift reward campaigns should not carry a cash amount; describe terms in reward_description.")
        if not reward_description or not reward_description.strip():
            raise ValueError("Perk reward campaigns must describe the perk, license, or gift in reward_description.")


class CampaignCreateRequest(BaseModel):
    """Payload for creating a new campaign draft under an owned startup."""
    title: str = Field(..., min_length=3, max_length=200)
    summary: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    product_type: Optional[str] = None
    product_url: Optional[str] = None
    access_instructions: Optional[str] = None
    testing_tasks: List[TestingTask] = Field(default_factory=list)
    screening_questions: List[ScreeningQuestion] = Field(default_factory=list)
    target_audience: TargetAudience = Field(default_factory=TargetAudience)
    max_testers: Optional[int] = Field(None, gt=0, le=100000)
    application_deadline: Optional[datetime] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    reward_type: str = REWARD_TYPE_UNPAID
    reward_amount: Optional[float] = Field(None, ge=0)
    reward_currency: Optional[str] = None
    reward_description: Optional[str] = None
    reward_eligibility: Optional[str] = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 3:
            raise ValueError("Title must be at least 3 characters.")
        return trimmed

    @field_validator("product_url")
    @classmethod
    def check_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_product_url(v)

    @field_validator("reward_currency")
    @classmethod
    def check_currency(cls, v: Optional[str]) -> Optional[str]:
        return validate_currency_code(v)

    @field_validator("testing_tasks")
    @classmethod
    def check_task_limit(cls, tasks: List[TestingTask]) -> List[TestingTask]:
        if len(tasks) > 20:
            raise ValueError("A campaign cannot have more than 20 testing tasks.")
        return tasks

    @model_validator(mode="after")
    def validate_rules(self) -> "CampaignCreateRequest":
        validate_campaign_dates(
            self.application_deadline,
            self.testing_start_date,
            self.testing_end_date,
        )
        validate_reward_logic(
            self.reward_type,
            self.reward_amount,
            self.reward_currency,
            self.reward_description,
        )
        return self


class CampaignUpdateRequest(BaseModel):
    """
    Payload for updating an existing campaign draft.
    Explicitly does NOT accept status changes to prevent arbitrary lifecycle jumps.
    """
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    summary: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    product_type: Optional[str] = None
    product_url: Optional[str] = None
    access_instructions: Optional[str] = None
    testing_tasks: Optional[List[TestingTask]] = None
    screening_questions: Optional[List[ScreeningQuestion]] = None
    target_audience: Optional[TargetAudience] = None
    max_testers: Optional[int] = Field(None, gt=0, le=100000)
    application_deadline: Optional[datetime] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    reward_type: Optional[str] = None
    reward_amount: Optional[float] = Field(None, ge=0)
    reward_currency: Optional[str] = None
    reward_description: Optional[str] = None
    reward_eligibility: Optional[str] = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if len(trimmed) < 3:
            raise ValueError("Title must be at least 3 characters.")
        return trimmed

    @field_validator("product_url")
    @classmethod
    def check_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_product_url(v)

    @field_validator("reward_currency")
    @classmethod
    def check_currency(cls, v: Optional[str]) -> Optional[str]:
        return validate_currency_code(v)

    @field_validator("testing_tasks")
    @classmethod
    def check_task_limit(cls, tasks: Optional[List[TestingTask]]) -> Optional[List[TestingTask]]:
        if tasks is not None and len(tasks) > 20:
            raise ValueError("A campaign cannot have more than 20 testing tasks.")
        return tasks

    @model_validator(mode="after")
    def validate_rules(self) -> "CampaignUpdateRequest":
        validate_campaign_dates(
            self.application_deadline,
            self.testing_start_date,
            self.testing_end_date,
        )
        if self.reward_type is not None:
            validate_reward_logic(
                self.reward_type,
                self.reward_amount,
                self.reward_currency,
                self.reward_description,
            )
        return self


class CampaignResponse(BaseModel):
    """Complete campaign response returned to the authorized founder."""
    id: uuid.UUID
    startup_id: uuid.UUID
    title: str
    slug: str
    summary: Optional[str] = None
    description: Optional[str] = None
    product_type: Optional[str] = None
    product_url: Optional[str] = None
    access_instructions: Optional[str] = None
    testing_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    screening_questions: List[Dict[str, Any]] = Field(default_factory=list)
    target_audience: Dict[str, Any] = Field(default_factory=dict)
    max_testers: Optional[int] = None
    application_deadline: Optional[datetime] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    reward_type: str
    reward_amount: Optional[float] = None
    reward_currency: Optional[str] = None
    reward_description: Optional[str] = None
    reward_eligibility: Optional[str] = None
    status: str
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignPublicResponse(BaseModel):
    """
    Sanitized public discovery campaign response.
    NEVER exposes access_instructions or founder personal account info.
    """
    id: uuid.UUID
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    startup_logo_url: Optional[str] = None
    title: str
    slug: str
    summary: Optional[str] = None
    description: Optional[str] = None
    product_type: Optional[str] = None
    product_url: Optional[str] = None
    testing_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    screening_questions: List[Dict[str, Any]] = Field(default_factory=list)
    target_audience: Dict[str, Any] = Field(default_factory=dict)
    max_testers: Optional[int] = None
    application_deadline: Optional[datetime] = None
    testing_start_date: Optional[datetime] = None
    testing_end_date: Optional[datetime] = None
    reward_type: str
    reward_amount: Optional[float] = None
    reward_currency: Optional[str] = None
    reward_description: Optional[str] = None
    reward_eligibility: Optional[str] = None
    status: str
    published_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignPublicListResponse(BaseModel):
    """
    Paginated response for public campaign discovery feed.
    Excludes private access instructions, founder user identifiers, and internal metadata.
    """
    items: List[CampaignPublicResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

