"""TryLo Startup Verification & Anti-Shell Business Legitimacy Database Model."""

import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.startup import Startup

VERIFICATION_STATUS_UNVERIFIED = "unverified"
VERIFICATION_STATUS_PENDING = "pending"
VERIFICATION_STATUS_VERIFIED = "verified"
VERIFICATION_STATUS_REJECTED = "rejected"

ALLOWED_VERIFICATION_STATUSES = [
    VERIFICATION_STATUS_UNVERIFIED,
    VERIFICATION_STATUS_PENDING,
    VERIFICATION_STATUS_VERIFIED,
    VERIFICATION_STATUS_REJECTED,
]

ALLOWED_REGISTRATION_TYPES = [
    "Private Limited (Pvt Ltd)",
    "Limited Liability Company (LLC)",
    "Corporation (C-Corp / S-Corp)",
    "Limited Liability Partnership (LLP)",
    "Registered Sole Proprietorship",
    "Partnership Firm",
    "Other Recognized Legal Entity",
]


class StartupVerification(Base):
    """
    Business legitimacy verification record for a Startup to prevent shell companies
    from launching fraudulent or malicious beta testing campaigns.
    """
    __tablename__ = "startup_verifications"
    __table_args__ = (
        sa.CheckConstraint(
            "verification_status IN ('unverified', 'pending', 'verified', 'rejected')",
            name="check_valid_verification_status",
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
        unique=True,
        nullable=False,
        index=True,
    )
    legal_entity_name: Mapped[str] = mapped_column(
        sa.String(255),
        nullable=False,
    )
    registration_type: Mapped[str] = mapped_column(
        sa.String(100),
        nullable=False,
        default="Private Limited (Pvt Ltd)",
    )
    registration_number: Mapped[str] = mapped_column(
        sa.String(100),
        nullable=False,
        index=True,
    )
    tax_identifier: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    document_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    document_name: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    corporate_email: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    is_corporate_email_verified: Mapped[bool] = mapped_column(
        sa.Boolean,
        nullable=False,
        default=False,
        server_default=sa.text("false"),
    )
    signatory_name: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    official_address: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    verification_status: Mapped[str] = mapped_column(
        sa.String(50),
        nullable=False,
        default=VERIFICATION_STATUS_PENDING,
        server_default=sa.text("'pending'"),
        index=True,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
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
    startup: Mapped["Startup"] = relationship(
        "Startup",
        back_populates="verification",
    )

    def __repr__(self) -> str:
        return (
            f"<StartupVerification startup_id={self.startup_id!r} "
            f"legal_entity={self.legal_entity_name!r} status={self.verification_status!r}>"
        )
