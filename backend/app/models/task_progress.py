"""TryLo Campaign Task Progress Database Model."""

import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.user import User

# Controlled task progress statuses
TASK_PROGRESS_NOT_STARTED = "not_started"
TASK_PROGRESS_IN_PROGRESS = "in_progress"
TASK_PROGRESS_COMPLETED = "completed"
ALLOWED_TASK_PROGRESS_STATUSES = [
    TASK_PROGRESS_NOT_STARTED,
    TASK_PROGRESS_IN_PROGRESS,
    TASK_PROGRESS_COMPLETED,
]


class CampaignTaskProgress(Base):
    """
    SQLAlchemy 2.x CampaignTaskProgress entity.
    Tracks a beta-tester's execution progress on a specific campaign task.
    Enforces a unique constraint on (campaign_id, task_id, tester_id).
    """
    __tablename__ = "campaign_task_progress"
    __table_args__ = (
        sa.UniqueConstraint(
            "campaign_id",
            "task_id",
            "tester_id",
            name="uq_campaign_task_progress_campaign_task_tester",
        ),
        sa.CheckConstraint(
            "status IN ('not_started', 'in_progress', 'completed')",
            name="check_valid_task_progress_status",
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
    task_id: Mapped[str] = mapped_column(
        sa.String(100),
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
        default=TASK_PROGRESS_NOT_STARTED,
        index=True,
    )
    completion_note: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
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
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="task_progresses")
    tester: Mapped["User"] = relationship("User", back_populates="task_progresses")

    def __repr__(self) -> str:
        return (
            f"<CampaignTaskProgress id={self.id!r} campaign_id={self.campaign_id!r} "
            f"task_id={self.task_id!r} tester_id={self.tester_id!r} status={self.status!r}>"
        )
