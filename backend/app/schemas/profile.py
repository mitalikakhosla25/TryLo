"""Pydantic Schemas for Founder and Tester Profiles."""

import uuid
from datetime import datetime
from typing import List, Optional, Union
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.profile import ALLOWED_COMPANY_STAGES, ALLOWED_EXPERIENCE_LEVELS


def validate_web_url(v: Optional[str], field_name: str = "URL") -> Optional[str]:
    """Validate optional web URL; converts empty/whitespace to None."""
    if v is None:
        return None
    trimmed = v.strip()
    if not trimmed:
        return None
    if len(trimmed) > 500:
        raise ValueError(f"{field_name} must not exceed 500 characters.")

    parsed = urlparse(trimmed)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError(f"{field_name} must be a valid URL starting with http:// or https://")

    # Hostname must be present and contain a valid period or be localhost
    hostname = parsed.hostname or ""
    if not hostname or ("." not in hostname and hostname != "localhost"):
        raise ValueError(f"{field_name} must contain a valid domain name.")

    return trimmed


def validate_linkedin_url(v: Optional[str]) -> Optional[str]:
    """Validate optional LinkedIn URL."""
    url = validate_web_url(v, field_name="LinkedIn URL")
    if url is None:
        return None
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if "linkedin.com" not in hostname:
        raise ValueError("LinkedIn URL must be a valid linkedin.com profile URL.")
    return url


class FounderProfileUpdateRequest(BaseModel):
    startup_name: Optional[str] = Field(None, max_length=200, description="Startup or product name")
    professional_title: Optional[str] = Field(None, max_length=100, description="Title, e.g. Founder or Co-founder")
    industry: Optional[str] = Field(None, max_length=100, description="Industry domain")
    company_stage: Optional[str] = Field(None, max_length=50, description="Company stage")
    website_url: Optional[str] = Field(None, max_length=500, description="Company website URL")
    linkedin_url: Optional[str] = Field(None, max_length=500, description="Founder's LinkedIn URL")
    startup_description: Optional[str] = Field(None, max_length=2000, description="Short description of the startup")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")

    @field_validator("startup_name", "professional_title", "industry", "startup_description", "city", "country")
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

    @field_validator("linkedin_url")
    @classmethod
    def check_linkedin_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_linkedin_url(v)


class TesterProfileUpdateRequest(BaseModel):
    bio: Optional[str] = Field(None, max_length=2000, description="Tester bio or intro")
    skills: List[str] = Field(default_factory=list, description="Tester skills")
    interests: List[str] = Field(default_factory=list, description="Categories of interest")
    experience_level: Optional[str] = Field(None, max_length=50, description="Testing experience level")
    devices: List[str] = Field(default_factory=list, description="Testing platforms and devices")
    city: Optional[str] = Field(None, max_length=100, description="City")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    linkedin_url: Optional[str] = Field(None, max_length=500, description="Tester's LinkedIn URL")

    @field_validator("bio", "city", "country")
    @classmethod
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if trimmed not in ALLOWED_EXPERIENCE_LEVELS:
            raise ValueError(
                f"Invalid experience level '{trimmed}'. Allowed levels: {', '.join(ALLOWED_EXPERIENCE_LEVELS)}"
            )
        return trimmed

    @field_validator("skills", "interests", "devices")
    @classmethod
    def sanitize_lists(cls, v: List[str]) -> List[str]:
        if len(v) > 50:
            raise ValueError("List exceeds maximum allowed size of 50 items.")
        cleaned = []
        for item in v:
            if isinstance(item, str):
                s = item.strip()
                if not s:
                    continue
                if len(s) > 100:
                    raise ValueError(f"List item '{s[:20]}...' exceeds maximum length of 100 characters.")
                if s not in cleaned:
                    cleaned.append(s)
        return cleaned

    @field_validator("linkedin_url")
    @classmethod
    def check_linkedin_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_linkedin_url(v)


class FounderProfileResponse(BaseModel):
    user_id: uuid.UUID
    startup_name: Optional[str] = None
    professional_title: Optional[str] = None
    industry: Optional[str] = None
    company_stage: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    startup_description: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TesterProfileResponse(BaseModel):
    user_id: uuid.UUID
    bio: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None
    devices: List[str] = Field(default_factory=list)
    city: Optional[str] = None
    country: Optional[str] = None
    linkedin_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileMeResponse(BaseModel):
    role: str
    is_complete: bool
    profile: Optional[Union[FounderProfileResponse, TesterProfileResponse]] = None

    model_config = ConfigDict(from_attributes=True)
