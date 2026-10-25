"""Pydantic Schemas for Startup Entity Management and Public Details."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.profile import ALLOWED_COMPANY_STAGES
from app.schemas.profile import validate_web_url


class StartupCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Startup or product name")
    tagline: Optional[str] = Field(None, max_length=255, description="One-line elevator pitch")
    description: Optional[str] = Field(None, max_length=5000, description="Detailed startup summary")
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector")
    company_stage: Optional[str] = Field(None, max_length=50, description="Current development stage")
    website_url: Optional[str] = Field(None, max_length=500, description="Official website URL")
    logo_url: Optional[str] = Field(None, max_length=500, description="Logo image URL")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State or province (e.g., Karnataka, Maharashtra)")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    founded_year: Optional[int] = Field(None, ge=1900, le=2100, description="Year founded")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Startup name must contain at least 2 non-whitespace characters.")
        return trimmed

    @field_validator("tagline", "description", "industry", "city", "state", "country")
    @classmethod
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None

    @field_validator("company_stage")
    @classmethod
    def validate_company_stage(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if trimmed not in ALLOWED_COMPANY_STAGES:
            raise ValueError(
                f"Invalid company stage '{trimmed}'. Allowed stages: {', '.join(ALLOWED_COMPANY_STAGES)}"
            )
        return trimmed

    @field_validator("website_url")
    @classmethod
    def check_website_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v, "Website URL")

    @field_validator("logo_url")
    @classmethod
    def check_logo_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v, "Logo URL")


class StartupUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200, description="Startup or product name")
    tagline: Optional[str] = Field(None, max_length=255, description="One-line elevator pitch")
    description: Optional[str] = Field(None, max_length=5000, description="Detailed startup summary")
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector")
    company_stage: Optional[str] = Field(None, max_length=50, description="Current development stage")
    website_url: Optional[str] = Field(None, max_length=500, description="Official website URL")
    logo_url: Optional[str] = Field(None, max_length=500, description="Logo image URL")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State or province")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    founded_year: Optional[int] = Field(None, ge=1900, le=2100, description="Year founded")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Startup name must contain at least 2 non-whitespace characters.")
        return trimmed

    @field_validator("tagline", "description", "industry", "city", "state", "country")
    @classmethod
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None

    @field_validator("company_stage")
    @classmethod
    def validate_company_stage(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if trimmed not in ALLOWED_COMPANY_STAGES:
            raise ValueError(
                f"Invalid company stage '{trimmed}'. Allowed stages: {', '.join(ALLOWED_COMPANY_STAGES)}"
            )
        return trimmed

    @field_validator("website_url")
    @classmethod
    def check_website_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v, "Website URL")

    @field_validator("logo_url")
    @classmethod
    def check_logo_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v, "Logo URL")


class StartupResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    company_stage: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    founded_year: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StartupPublicResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    company_stage: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    founded_year: Optional[int] = None
    created_at: datetime
    campaign_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class StartupPublicListResponse(BaseModel):
    items: list[StartupPublicResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    state_counts: dict[str, int] = Field(default_factory=dict, description="State-level counts of startups")

