"""Pydantic Schemas for Startup Anti-Shell Verification & Corporate Validation."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.startup_verification import (
    ALLOWED_REGISTRATION_TYPES,
    ALLOWED_VERIFICATION_STATUSES,
)
from app.schemas.profile import validate_web_url


class StartupVerificationSubmitRequest(BaseModel):
    legal_entity_name: str = Field(..., min_length=2, max_length=255, description="Registered legal entity name")
    registration_type: str = Field(..., max_length=100, description="Business structure type")
    registration_number: str = Field(..., min_length=2, max_length=100, description="CIN, GSTIN, EIN or official reg number")
    tax_identifier: Optional[str] = Field(None, max_length=100, description="Tax ID / PAN / VAT (optional)")
    document_url: Optional[str] = Field(None, max_length=500, description="Certificate of Incorporation / Registration document URL")
    document_name: Optional[str] = Field(None, max_length=255, description="File name of the uploaded document")
    corporate_email: Optional[str] = Field(None, max_length=255, description="Corporate domain email address")
    signatory_name: Optional[str] = Field(None, max_length=255, description="Authorized director / founder signatory")
    official_address: Optional[str] = Field(None, description="Registered legal office address")

    @field_validator("legal_entity_name", "registration_number")
    @classmethod
    def sanitize_required_strings(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Field must contain at least 2 non-whitespace characters.")
        return trimmed

    @field_validator("registration_type")
    @classmethod
    def validate_reg_type(cls, v: str) -> str:
        trimmed = v.strip()
        if trimmed not in ALLOWED_REGISTRATION_TYPES:
            raise ValueError(
                f"Invalid registration type '{trimmed}'. Allowed: {', '.join(ALLOWED_REGISTRATION_TYPES)}"
            )
        return trimmed

    @field_validator("document_url")
    @classmethod
    def check_doc_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_web_url(v, "Document URL")

    @field_validator("corporate_email")
    @classmethod
    def check_corp_email(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        trimmed = v.strip().lower()
        if "@" not in trimmed or "." not in trimmed.split("@")[-1]:
            raise ValueError("Must be a valid email address.")
        return trimmed


class StartupVerificationReviewRequest(BaseModel):
    verification_status: str = Field(..., description="verified or rejected")
    rejection_reason: Optional[str] = Field(None, max_length=1000, description="Reason if rejected")

    @field_validator("verification_status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        trimmed = v.strip().lower()
        if trimmed not in ("verified", "rejected", "pending"):
            raise ValueError("Status must be 'verified', 'rejected', or 'pending'.")
        return trimmed


class CorporateEmailOtpRequest(BaseModel):
    corporate_email: str = Field(..., max_length=255, description="Work email to verify")
    otp_code: Optional[str] = Field(None, min_length=4, max_length=10, description="OTP code for confirmation")


class StartupVerificationResponse(BaseModel):
    id: uuid.UUID
    startup_id: uuid.UUID
    legal_entity_name: str
    registration_type: str
    registration_number: str
    tax_identifier: Optional[str] = None
    document_url: Optional[str] = None
    document_name: Optional[str] = None
    corporate_email: Optional[str] = None
    signatory_name: Optional[str] = None
    official_address: Optional[str] = None
    is_corporate_email_verified: bool
    verification_status: str
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
