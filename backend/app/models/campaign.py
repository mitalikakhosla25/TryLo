"""TryLo Campaign Database Model."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.startup import Startup
    from app.models.application import CampaignApplication
    from app.models.task_progress import CampaignTaskProgress
    from app.models.feedback import FeedbackSubmission

# Controlled lifecycle statuses
CAMPAIGN_STATUS_DRAFT = "draft"
CAMPAIGN_STATUS_PUBLISHED = "published"
CAMPAIGN_STATUS_CLOSED = "closed"
CAMPAIGN_STATUS_ARCHIVED = "archived"
ALLOWED_CAMPAIGN_STATUSES = [
    CAMPAIGN_STATUS_DRAFT,
    CAMPAIGN_STATUS_PUBLISHED,
    CAMPAIGN_STATUS_CLOSED,
    CAMPAIGN_STATUS_ARCHIVED,
]

# Controlled reward types
REWARD_TYPE_UNPAID = "unpaid"
REWARD_TYPE_MONETARY = "monetary"
REWARD_TYPE_PERK = "perk"
ALLOWED_REWARD_TYPES = [
    REWARD_TYPE_UNPAID,
    REWARD_TYPE_MONETARY,
    REWARD_TYPE_PERK,
]

# Controlled product types
ALLOWED_PRODUCT_TYPES = [
    "Web App",
    "iOS App",
    "Android App",
    "Desktop App",
    "API / Developer Tool",
    "Other",
]

# JSON structure type that seamlessly falls back to sa.JSON on SQLite for tests
JsonStructureType = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")


class Campaign(Base):
    """
    SQLAlchemy 2.x Campaign entity.
    Represents a beta-testing campaign for a specific startup.
    A campaign can be draft, published, closed, or archived.
    """
    __tablename__ = "campaigns"
    __table_args__ = (
        sa.UniqueConstraint("startup_id", "slug", name="uq_campaigns_startup_id_slug"),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'closed', 'archived')",
            name="check_valid_campaign_status",
        ),
        sa.CheckConstraint(
            "reward_type IN ('unpaid', 'monetary', 'perk')",
            name="check_valid_campaign_reward_type",
        ),
        sa.CheckConstraint(
            "max_testers IS NULL OR max_testers > 0",
            name="check_valid_campaign_max_testers",
        ),
        sa.CheckConstraint(
            "reward_amount IS NULL OR reward_amount >= 0",
            name="check_valid_campaign_reward_amount",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    startup_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("startups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        sa.String(200),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        sa.String(220),
        nullable=False,
        index=True,
    )
    summary: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    product_type: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    product_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    access_instructions: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    testing_tasks: Mapped[List[Dict[str, Any]]] = mapped_column(
        JsonStructureType,
        nullable=False,
        default=list,
    )
    screening_questions: Mapped[List[Dict[str, Any]]] = mapped_column(
        JsonStructureType,
        nullable=False,
        default=list,
    )
    target_audience: Mapped[Dict[str, Any]] = mapped_column(
        JsonStructureType,
        nullable=False,
        default=dict,
    )
    max_testers: Mapped[Optional[int]] = mapped_column(
        sa.Integer,
        nullable=True,
    )
    application_deadline: Mapped[Optional[datetime]] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=True,
    )
    testing_start_date: Mapped[Optional[datetime]] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=True,
    )
    testing_end_date: Mapped[Optional[datetime]] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=True,
    )
    reward_type: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        default=REWARD_TYPE_UNPAID,
    )
    reward_amount: Mapped[Optional[float]] = mapped_column(
        sa.Numeric(10, 2),
        nullable=True,
    )
    reward_currency: Mapped[Optional[str]] = mapped_column(
        sa.String(3),
        nullable=True,
    )
    reward_description: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    reward_eligibility: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        default=CAMPAIGN_STATUS_DRAFT,
        index=True,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(
        sa.DateTime(timezone=True),
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

    # Relationships
    startup: Mapped["Startup"] = relationship("Startup", back_populates="campaigns")
    applications: Mapped[List["CampaignApplication"]] = relationship(
        "CampaignApplication",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    task_progresses: Mapped[List["CampaignTaskProgress"]] = relationship(
        "CampaignTaskProgress",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    feedback_submissions: Mapped[List["FeedbackSubmission"]] = relationship(
        "FeedbackSubmission",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    @property
    def startup_name(self) -> str:
        return self.startup.name if self.startup else ""

    @property
    def startup_slug(self) -> str:
        return self.startup.slug if self.startup else ""

    @property
    def startup_logo_url(self) -> Optional[str]:
        return self.startup.logo_url if self.startup else None

    def __repr__(self) -> str:
        return f"<Campaign id={self.id!r} title={self.title!r} startup_id={self.startup_id!r} status={self.status!r}>"
