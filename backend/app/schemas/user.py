"""Pydantic Schemas for User Registration, Login, and Public Profile Responses."""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import ALLOWED_REGISTRATION_ROLES


class UserRegisterRequest(BaseModel):
    """
    Request schema for user registration.
    Enforces strict input validation, email normalization, and allowed registration roles.
    """
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="User's full name",
        examples=["Jane Doe"],
    )
    email: EmailStr = Field(
        ...,
        description="User's unique email address",
        examples=["jane.doe@example.com"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Account password (minimum 8 characters)",
    )
    role: str = Field(
        ...,
        description="Account role: founder or tester only",
        examples=["founder", "tester"],
    )

    @field_validator("full_name")
    @classmethod
    def sanitize_full_name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Full name must contain at least 2 non-whitespace characters.")
        return trimmed

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        # Standardize email: lowercase and strip whitespace
        return v.strip().lower()

    @field_validator("role")
    @classmethod
    def validate_registration_role(cls, v: str) -> str:
        normalized_role = v.strip().lower()
        if normalized_role not in ALLOWED_REGISTRATION_ROLES:
            raise ValueError(
                f"Invalid registration role '{v}'. Public registration only permits 'founder' or 'tester'."
            )
        return normalized_role


class UserLoginRequest(BaseModel):
    """
    Request schema for user login.
    Enforces email normalization and rejects empty passwords.
    """
    email: EmailStr = Field(
        ...,
        description="User's registered email address",
        examples=["jane.doe@example.com"],
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Account password",
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    """
    Sanitized user response schema.
    Strictly excludes password_hash and internal authentication secrets.
    """
    id: uuid.UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Standard generic success message response."""
    message: str
