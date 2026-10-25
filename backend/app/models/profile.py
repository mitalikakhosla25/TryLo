"""TryLo Founder and Tester Profile Database Models."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Controlled values for company stages and experience levels
ALLOWED_COMPANY_STAGES = ["Idea", "Prototype", "MVP", "Early Traction", "Growth"]
ALLOWED_EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"]

# JSON list type that seamlessly falls back to sa.JSON on SQLite (for test suite isolation)
JsonListType = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")


class FounderProfile(Base):
    """
    1-to-1 profile record for users with the 'founder' role.
    Linked to the users table via user_id foreign key.
    """
    __tablename__ = "founder_profiles"
    __table_args__ = (
        sa.CheckConstraint(
            "company_stage IS NULL OR company_stage IN ('Idea', 'Prototype', 'MVP', 'Early Traction', 'Growth')",
            name="check_valid_company_stage",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    startup_name: Mapped[Optional[str]] = mapped_column(
        sa.String(200),
        nullable=True,
    )
    professional_title: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    industry: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    company_stage: Mapped[Optional[str]] = mapped_column(
        sa.String(50),
        nullable=True,
    )
    website_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    linkedin_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    startup_description: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    city: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    country: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
    )

    # Relationship back to User
    user: Mapped["User"] = relationship("User", back_populates="founder_profile")

    @property
    def is_complete(self) -> bool:
        """Profile is complete when startup_name is valid and non-empty."""
        return bool(self.startup_name and self.startup_name.strip())

    def __repr__(self) -> str:
        return f"<FounderProfile user_id={self.user_id!r} startup_name={self.startup_name!r}>"


class TesterProfile(Base):
    """
    1-to-1 profile record for users with the 'tester' role.
    Linked to the users table via user_id foreign key.
    """
    __tablename__ = "tester_profiles"
    __table_args__ = (
        sa.CheckConstraint(
            "experience_level IS NULL OR experience_level IN ('Beginner', 'Intermediate', 'Advanced')",
            name="check_valid_experience_level",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    bio: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    skills: Mapped[List[str]] = mapped_column(
        JsonListType,
        nullable=False,
        default=list,
    )
    interests: Mapped[List[str]] = mapped_column(
        JsonListType,
        nullable=False,
        default=list,
    )
    experience_level: Mapped[Optional[str]] = mapped_column(
        sa.String(50),
        nullable=True,
    )
    devices: Mapped[List[str]] = mapped_column(
        JsonListType,
        nullable=False,
        default=list,
    )
    city: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    country: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    linkedin_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
    )

    # Relationship back to User
    user: Mapped["User"] = relationship("User", back_populates="tester_profile")

    @property
    def is_complete(self) -> bool:
        """Profile is complete when bio is provided and at least 1 skill and 1 interest are selected."""
        has_bio = bool(self.bio and self.bio.strip())
        has_skills = bool(self.skills and len(self.skills) >= 1)
        has_interests = bool(self.interests and len(self.interests) >= 1)
        return has_bio and has_skills and has_interests

    def __repr__(self) -> str:
        return f"<TesterProfile user_id={self.user_id!r} experience_level={self.experience_level!r}>"
