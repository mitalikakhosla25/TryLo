"""Pydantic Schemas for Tester Verification, Resume, Certificates, Endorsements, and Employer Reviews."""

import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.tester_verification import (
    ALLOWED_CERT_STATUSES,
    ALLOWED_TESTER_SPECIALIZATIONS,
    CERT_STATUS_PENDING,
)
from app.schemas.profile import validate_web_url


class TesterResumeUpdateRequest(BaseModel):
    resume_url: Optional[str] = Field(None, max_length=500, description="Resume PDF or document URL")
    file_name: Optional[str] = Field(None, max_length=255, description="File name of the resume")
    github_url: Optional[str] = Field(None, max_length=500, description="GitHub profile URL")
    portfolio_url: Optional[str] = Field(None, max_length=500, description="Personal portfolio or QA blog URL")
    bug_bounty_url: Optional[str] = Field(None, max_length=500, description="Bugcrowd, HackerOne, or Testlio profile")
    specializations: List[str] = Field(default_factory=list, description="Testing specializations")
    latex_source: Optional[str] = Field(None, description="Full LaTeX resume source code (.tex)")

    @field_validator("resume_url", "github_url", "portfolio_url", "bug_bounty_url")
    @classmethod
    def check_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v)

    @field_validator("specializations")
    @classmethod
    def sanitize_specializations(cls, v: List[str]) -> List[str]:
        cleaned = []
        for item in v:
            if isinstance(item, str) and item.strip():
                trimmed = item.strip()
                if trimmed not in cleaned:
                    cleaned.append(trimmed)
        return cleaned


class AtsScorePreviewRequest(BaseModel):
    latex_source: str = Field(..., description="LaTeX source code to parse and calculate ATS score")


class AtsScorePreviewResponse(BaseModel):
    ats_score: int
    is_latex_verified: bool
    breakdown: dict
    feedback: List[str] = Field(default_factory=list)
    detected_keywords: List[str] = Field(default_factory=list)
    metrics_found: int = 0


class TesterResumeResponse(BaseModel):
    id: uuid.UUID
    tester_id: uuid.UUID
    resume_url: Optional[str] = None
    file_name: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bug_bounty_url: Optional[str] = None
    specializations: List[str] = Field(default_factory=list)
    ats_score: Optional[int] = None
    ats_breakdown: Optional[dict] = None
    ats_feedback: Optional[List[str]] = None
    latex_source: Optional[str] = None
    is_latex_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TesterCertificationCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Certification or credential title")
    issuing_organization: str = Field(..., min_length=2, max_length=200, description="Organization that issued the certificate")
    credential_id: Optional[str] = Field(None, max_length=100, description="Unique credential ID")
    credential_url: Optional[str] = Field(None, max_length=500, description="Online verification URL or document link")
    issue_date: Optional[date] = Field(None, description="Date certificate was issued")
    expiry_date: Optional[date] = Field(None, description="Date certificate expires, if applicable")

    @field_validator("name", "issuing_organization")
    @classmethod
    def sanitize_required(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Field must contain at least 2 non-whitespace characters.")
        return trimmed

    @field_validator("credential_url")
    @classmethod
    def check_cred_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v, "Credential URL")


class TesterCertificationResponse(BaseModel):
    id: uuid.UUID
    tester_id: uuid.UUID
    name: str
    issuing_organization: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    verification_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TesterEndorsementCreateRequest(BaseModel):
    skill_name: str = Field(..., min_length=2, max_length=100, description="Skill being endorsed")
    endorsement_note: Optional[str] = Field(None, max_length=500, description="Short endorsement testimonial or note")

    @field_validator("skill_name")
    @classmethod
    def sanitize_skill(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Skill name must be at least 2 characters.")
        return trimmed


class TesterEndorsementResponse(BaseModel):
    id: uuid.UUID
    tester_id: uuid.UUID
    endorser_id: uuid.UUID
    endorser_name: Optional[str] = None
    skill_name: str
    endorsement_note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TesterEmployerReviewCreateRequest(BaseModel):
    campaign_id: Optional[uuid.UUID] = Field(None, description="Optional associated campaign ID")
    reviewer_name: str = Field(..., min_length=2, max_length=200, description="Name of the founder/employer leaving feedback")
    reviewer_title: Optional[str] = Field(None, max_length=100, description="Title, e.g. 'Engineering Lead' or 'Founder'")
    company_name: str = Field(..., min_length=2, max_length=200, description="Company or Startup name")
    overall_rating: int = Field(..., ge=1, le=5, description="Overall performance rating (1 to 5 stars)")
    thoroughness_rating: Optional[int] = Field(None, ge=1, le=5, description="Rating for bug report depth and detail")
    responsiveness_rating: Optional[int] = Field(None, ge=1, le=5, description="Rating for speed and communication")
    bug_report_quality_rating: Optional[int] = Field(None, ge=1, le=5, description="Rating for reproducibility and accuracy")
    review_text: str = Field(..., min_length=10, max_length=3000, description="Written feedback or testimonial")
    project_scope: Optional[str] = Field(None, max_length=255, description="Scope or release tested, e.g. 'Beta V2.1 iOS'")

    @field_validator("reviewer_name", "company_name", "review_text")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be blank.")
        return trimmed


class TesterEmployerReviewResponse(BaseModel):
    id: uuid.UUID
    tester_id: uuid.UUID
    reviewer_id: Optional[uuid.UUID] = None
    campaign_id: Optional[uuid.UUID] = None
    reviewer_name: str
    reviewer_title: Optional[str] = None
    company_name: str
    overall_rating: int
    thoroughness_rating: Optional[int] = None
    responsiveness_rating: Optional[int] = None
    bug_report_quality_rating: Optional[int] = None
    review_text: str
    project_scope: Optional[str] = None
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TesterVerificationOverviewResponse(BaseModel):
    tester_id: uuid.UUID
    verification_tier: int = Field(description="Tier 1: Basic, Tier 2: Certified, Tier 3: Top-Rated Vetted")
    tier_label: str
    has_resume: bool
    ats_score: Optional[int] = None
    is_latex_verified: bool = False
    resume: Optional[TesterResumeResponse] = None
    certifications_count: int
    certifications: List[TesterCertificationResponse] = Field(default_factory=list)
    endorsements_count: int
    endorsements: List[TesterEndorsementResponse] = Field(default_factory=list)
    reviews_count: int
    average_rating: float
    reviews: List[TesterEmployerReviewResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
