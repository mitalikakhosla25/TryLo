"""TryLo Campaign Application Database Model."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.user import User

# Controlled application statuses
APPLICATION_STATUS_PENDING = "pending"
APPLICATION_STATUS_ACCEPTED = "accepted"
APPLICATION_STATUS_REJECTED = "rejected"
ALLOWED_APPLICATION_STATUSES = [
    APPLICATION_STATUS_PENDING,
    APPLICATION_STATUS_ACCEPTED,
    APPLICATION_STATUS_REJECTED,
]

# JSON structure type that seamlessly falls back to sa.JSON on SQLite for tests
JsonStructureType = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")


class CampaignApplication(Base):
    """
    SQLAlchemy 2.x CampaignApplication entity.
    Represents a beta-tester's application to a specific published campaign.
    A tester may apply to a campaign only once.
    """
    __tablename__ = "campaign_applications"
    __table_args__ = (
        sa.UniqueConstraint("campaign_id", "tester_id", name="uq_campaign_applications_campaign_tester"),
        sa.CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name="check_valid_application_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tester_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        default=APPLICATION_STATUS_PENDING,
        index=True,
    )
    screening_answers: Mapped[Dict[str, Any]] = mapped_column(
        JsonStructureType,
        nullable=False,
        default=dict,
    )
    motivation: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    rejection_note: Mapped[Optional[str]] = mapped_column(
        sa.Text,
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
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="applications")
    tester: Mapped["User"] = relationship("User", back_populates="applications")

    def __repr__(self) -> str:
        return f"<CampaignApplication id={self.id!r} campaign_id={self.campaign_id!r} tester_id={self.tester_id!r} status={self.status!r}>"
