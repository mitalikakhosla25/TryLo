"""TryLo Feedback Submission Database Model."""

import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.user import User

# Controlled feedback types
FEEDBACK_TYPE_GENERAL = "general_feedback"
FEEDBACK_TYPE_BUG = "bug_report"
ALLOWED_FEEDBACK_TYPES = [
    FEEDBACK_TYPE_GENERAL,
    FEEDBACK_TYPE_BUG,
]

# Controlled severities for bug reports
SEVERITY_LOW = "low"
SEVERITY_MEDIUM = "medium"
SEVERITY_HIGH = "high"
SEVERITY_CRITICAL = "critical"
ALLOWED_SEVERITIES = [
    SEVERITY_LOW,
    SEVERITY_MEDIUM,
    SEVERITY_HIGH,
    SEVERITY_CRITICAL,
]

# Controlled feedback statuses
FEEDBACK_STATUS_SUBMITTED = "submitted"
FEEDBACK_STATUS_IN_REVIEW = "in_review"
FEEDBACK_STATUS_RESOLVED = "resolved"
FEEDBACK_STATUS_NEEDS_RETEST = "needs_retest"
ALLOWED_FEEDBACK_STATUSES = [
    FEEDBACK_STATUS_SUBMITTED,
    FEEDBACK_STATUS_IN_REVIEW,
    FEEDBACK_STATUS_RESOLVED,
    FEEDBACK_STATUS_NEEDS_RETEST,
]


class FeedbackSubmission(Base):
    """
    SQLAlchemy 2.x FeedbackSubmission entity.
    Stores structured general observations and bug reports submitted by accepted testers.
    """
    __tablename__ = "feedback_submissions"
    __table_args__ = (
        sa.CheckConstraint(
            "feedback_type IN ('general_feedback', 'bug_report')",
            name="check_valid_feedback_type",
        ),
        sa.CheckConstraint(
            "severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')",
            name="check_valid_feedback_severity",
        ),
        sa.CheckConstraint(
            "status IN ('submitted', 'in_review', 'resolved', 'needs_retest')",
            name="check_valid_feedback_status",
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
    task_id: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
        index=True,
    )
    feedback_type: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        sa.String(255),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        sa.Text,
        nullable=False,
    )
    expected_behavior: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    actual_behavior: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    reproduction_steps: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    severity: Mapped[Optional[str]] = mapped_column(
        sa.String(20),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
        default=FEEDBACK_STATUS_SUBMITTED,
        index=True,
    )
    retest_instructions: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
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
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="feedback_submissions")
    tester: Mapped["User"] = relationship("User", back_populates="feedback_submissions")
    internal_notes: Mapped[list["FeedbackInternalNote"]] = relationship(
        "FeedbackInternalNote",
        back_populates="feedback",
        cascade="all, delete-orphan",
        order_by="FeedbackInternalNote.created_at.asc()",
    )
    status_history: Mapped[list["FeedbackStatusHistory"]] = relationship(
        "FeedbackStatusHistory",
        back_populates="feedback",
        cascade="all, delete-orphan",
        order_by="FeedbackStatusHistory.created_at.asc()",
    )

    def __repr__(self) -> str:
        return (
            f"<FeedbackSubmission id={self.id!r} campaign_id={self.campaign_id!r} "
            f"tester_id={self.tester_id!r} type={self.feedback_type!r} status={self.status!r}>"
        )


class FeedbackInternalNote(Base):
    """
    SQLAlchemy 2.x FeedbackInternalNote entity.
    Stores founder-only internal notes for a feedback submission.
    Never exposed to testers or external observers.
    """
    __tablename__ = "feedback_internal_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    feedback_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("feedback_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    body: Mapped[str] = mapped_column(
        sa.Text,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
        index=True,
    )

    # Relationships
    feedback: Mapped["FeedbackSubmission"] = relationship("FeedbackSubmission", back_populates="internal_notes")
    author: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<FeedbackInternalNote id={self.id!r} feedback_id={self.feedback_id!r} author_id={self.author_id!r}>"


class FeedbackStatusHistory(Base):
    """
    SQLAlchemy 2.x FeedbackStatusHistory entity.
    Maintains an audit trail of feedback lifecycle status transitions.
    """
    __tablename__ = "feedback_status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    feedback_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("feedback_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    previous_status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
    )
    new_status: Mapped[str] = mapped_column(
        sa.String(30),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
        index=True,
    )

    # Relationships
    feedback: Mapped["FeedbackSubmission"] = relationship("FeedbackSubmission", back_populates="status_history")
    actor: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return (
            f"<FeedbackStatusHistory id={self.id!r} feedback_id={self.feedback_id!r} "
            f"from={self.previous_status!r} to={self.new_status!r}>"
        )


# Transition state machine rules
ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    FEEDBACK_STATUS_SUBMITTED: [
        FEEDBACK_STATUS_IN_REVIEW,
        FEEDBACK_STATUS_RESOLVED,
        FEEDBACK_STATUS_NEEDS_RETEST,
    ],
    FEEDBACK_STATUS_IN_REVIEW: [
        FEEDBACK_STATUS_RESOLVED,
        FEEDBACK_STATUS_NEEDS_RETEST,
    ],
    FEEDBACK_STATUS_NEEDS_RETEST: [
        FEEDBACK_STATUS_IN_REVIEW,
        FEEDBACK_STATUS_RESOLVED,
    ],
    FEEDBACK_STATUS_RESOLVED: [
        FEEDBACK_STATUS_IN_REVIEW,  # Reopen
    ],
}
