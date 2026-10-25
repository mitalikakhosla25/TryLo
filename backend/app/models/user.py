"""User Database Model for TryLo."""

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.profile import FounderProfile, TesterProfile
    from app.models.startup import Startup
    from app.models.application import CampaignApplication
    from app.models.task_progress import CampaignTaskProgress
    from app.models.feedback import FeedbackSubmission


class UserRole(str, enum.Enum):
    """User roles supported by the TryLo platform."""
    FOUNDER = "founder"
    TESTER = "tester"
    ADMIN = "admin"


# Set of roles permitted for self-registration via the public API
ALLOWED_REGISTRATION_ROLES = {UserRole.FOUNDER.value, UserRole.TESTER.value}


class User(Base):
    """
    SQLAlchemy 2.x User model representing platform accounts.
    Stores user profile, role, security credentials (hashes only), and timestamps in UTC.
    """
    __tablename__ = "users"
    __table_args__ = (
        sa.CheckConstraint(
            "role IN ('founder', 'tester', 'admin')",
            name="check_valid_user_role",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    full_name: Mapped[str] = mapped_column(
        sa.String(255),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        sa.String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        sa.String(255),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        sa.String(20),
        nullable=False,
        default=UserRole.TESTER.value,
    )
    is_active: Mapped[bool] = mapped_column(
        sa.Boolean,
        nullable=False,
        default=True,
        server_default=sa.text("true"),
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
    # Role-specific 1-to-1 profile relationships
    founder_profile: Mapped[Optional["FounderProfile"]] = relationship(
        "FounderProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    tester_profile: Mapped[Optional["TesterProfile"]] = relationship(
        "TesterProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    startups: Mapped[List["Startup"]] = relationship(
        "Startup",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    applications: Mapped[List["CampaignApplication"]] = relationship(
        "CampaignApplication",
        back_populates="tester",
        cascade="all, delete-orphan",
    )
    task_progresses: Mapped[List["CampaignTaskProgress"]] = relationship(
        "CampaignTaskProgress",
        back_populates="tester",
        cascade="all, delete-orphan",
    )
    feedback_submissions: Mapped[List["FeedbackSubmission"]] = relationship(
        "FeedbackSubmission",
        back_populates="tester",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        """Safe representation that NEVER exposes sensitive fields such as password_hash."""
        return (
            f"<User id={self.id!r} "
            f"email={self.email!r} "
            f"role={self.role!r} "
            f"is_active={self.is_active!r}>"
        )
