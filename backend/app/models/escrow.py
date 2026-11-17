"""TryLo Campaign Escrow Vault and Tester Payout Database Models."""

import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.user import User
    from app.models.task_progress import CampaignTaskProgress
    from app.models.feedback import FeedbackSubmission

# Controlled Escrow Statuses
ESCROW_STATUS_UNFUNDED = "unfunded"
ESCROW_STATUS_FUNDED = "funded"
ESCROW_STATUS_DEPLETED = "depleted"
ESCROW_STATUS_REFUNDED = "refunded"
ALLOWED_ESCROW_STATUSES = [
    ESCROW_STATUS_UNFUNDED,
    ESCROW_STATUS_FUNDED,
    ESCROW_STATUS_DEPLETED,
    ESCROW_STATUS_REFUNDED,
]

# Controlled Payout Statuses
PAYOUT_STATUS_INITIATED = "initiated"
PAYOUT_STATUS_PROCESSING = "processing"
PAYOUT_STATUS_COMPLETED = "completed"
PAYOUT_STATUS_FAILED = "failed"
ALLOWED_PAYOUT_STATUSES = [
    PAYOUT_STATUS_INITIATED,
    PAYOUT_STATUS_PROCESSING,
    PAYOUT_STATUS_COMPLETED,
    PAYOUT_STATUS_FAILED,
]


class CampaignEscrow(Base):
    """
    1-to-1 Escrow Vault for a published testing campaign.
    Locks the total bounty pool into TryLo trust escrow before disbursement.
    """
    __tablename__ = "campaign_escrows"
    __table_args__ = (
        sa.UniqueConstraint("campaign_id", name="uq_campaign_escrow_campaign_id"),
        sa.CheckConstraint(
            "status IN ('unfunded', 'funded', 'depleted', 'refunded')",
            name="check_valid_escrow_status",
        ),
        sa.Index("ix_campaign_escrows_status", "status"),
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
        unique=True,
        index=True,
    )
    currency: Mapped[str] = mapped_column(
        sa.String(10),
        nullable=False,
        default="INR",
    )
    total_funded: Mapped[float] = mapped_column(
        sa.Numeric(12, 2),
        nullable=False,
        default=0.0,
    )
    disbursed_amount: Mapped[float] = mapped_column(
        sa.Numeric(12, 2),
        nullable=False,
        default=0.0,
    )
    status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        default=ESCROW_STATUS_UNFUNDED,
    )
    deposit_reference: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    funded_at: Mapped[Optional[datetime]] = mapped_column(
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
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="escrow")
    payouts: Mapped[list["TesterPayout"]] = relationship(
        "TesterPayout",
        back_populates="escrow",
        cascade="all, delete-orphan",
    )

    @property
    def remaining_balance(self) -> float:
        return max(0.0, float(self.total_funded) - float(self.disbursed_amount))

    def __repr__(self) -> str:
        return (
            f"<CampaignEscrow id={self.id!r} campaign_id={self.campaign_id!r} "
            f"funded={self.total_funded!r} disbursed={self.disbursed_amount!r} status={self.status!r}>"
        )


class TesterPayout(Base):
    """
    Simulated UPI Instant Disbursal transaction record.
    Tracks NPCI UTR numbers, UPI VPA addresses, and milestone proofs.
    """
    __tablename__ = "tester_payouts"
    __table_args__ = (
        sa.CheckConstraint(
            "status IN ('initiated', 'processing', 'completed', 'failed')",
            name="check_valid_payout_status",
        ),
        sa.Index("ix_tester_payouts_tester_status", "tester_id", "status"),
        sa.Index("ix_tester_payouts_campaign_status", "campaign_id", "status"),
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
    escrow_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("campaign_escrows.id", ondelete="SET NULL"),
        nullable=True,
    )
    task_progress_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("campaign_task_progress.id", ondelete="SET NULL"),
        nullable=True,
    )
    feedback_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("feedback_submissions.id", ondelete="SET NULL"),
        nullable=True,
    )
    amount: Mapped[float] = mapped_column(
        sa.Numeric(10, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        sa.String(10),
        nullable=False,
        default="INR",
    )
    upi_id: Mapped[str] = mapped_column(
        sa.String(100),
        nullable=False,
    )
    reference_id: Mapped[str] = mapped_column(
        sa.String(100),
        nullable=False,
        unique=True,
        index=True,
    )
    utr_number: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        default=PAYOUT_STATUS_COMPLETED,
    )
    milestone_type: Mapped[str] = mapped_column(
        sa.String(50),
        nullable=False,
        default="task_completion",
    )
    notes: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    disbursed_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
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
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="payouts")
    tester: Mapped["User"] = relationship("User", back_populates="payouts")
    escrow: Mapped[Optional["CampaignEscrow"]] = relationship("CampaignEscrow", back_populates="payouts")

    def __repr__(self) -> str:
        return (
            f"<TesterPayout id={self.id!r} campaign_id={self.campaign_id!r} "
            f"tester_id={self.tester_id!r} amount={self.amount!r} utr={self.utr_number!r}>"
        )

