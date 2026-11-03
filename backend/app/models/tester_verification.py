"""TryLo Tester Verification, Resume, Certifications, Endorsements & Employer Reviews Database Models."""

import uuid
from datetime import date, datetime, timezone
from typing import List, Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.campaign import Campaign

# JSON list type that seamlessly falls back to sa.JSON on SQLite
JsonListType = postgresql.JSONB().with_variant(sa.JSON(), "sqlite")

ALLOWED_TESTER_SPECIALIZATIONS = [
    "Manual Functional Testing",
    "Automated Testing (Playwright/Cypress/Selenium)",
    "API & Backend Testing (Postman/REST/GraphQL)",
    "Mobile App Testing (iOS / Android)",
    "Performance & Load Testing (k6/JMeter)",
    "Security & Vulnerability Assessment",
    "Accessibility & WCAG Compliance",
    "Usability & UX Exploratory Testing",
]

CERT_STATUS_PENDING = "pending"
CERT_STATUS_VERIFIED = "verified"
CERT_STATUS_REJECTED = "rejected"
ALLOWED_CERT_STATUSES = [CERT_STATUS_PENDING, CERT_STATUS_VERIFIED, CERT_STATUS_REJECTED]


class TesterResume(Base):
    """
    Resume and portfolio assets for a verified beta tester.
    """
    __tablename__ = "tester_resumes"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    tester_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    resume_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    file_name: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    github_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    portfolio_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    bug_bounty_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    specializations: Mapped[List[str]] = mapped_column(
        JsonListType,
        nullable=False,
        default=list,
    )
    ats_score: Mapped[Optional[int]] = mapped_column(
        sa.Integer,
        nullable=True,
        index=True,
    )
    ats_breakdown: Mapped[Optional[dict]] = mapped_column(
        JsonListType,
        nullable=True,
    )
    ats_feedback: Mapped[Optional[list]] = mapped_column(
        JsonListType,
        nullable=True,
    )
    latex_source: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    is_latex_verified: Mapped[bool] = mapped_column(
        sa.Boolean,
        nullable=False,
        default=False,
        server_default=sa.text("false"),
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
    tester: Mapped["User"] = relationship("User", back_populates="tester_resume")

    def __repr__(self) -> str:
        return f"<TesterResume tester_id={self.tester_id!r} file_name={self.file_name!r}>"


class TesterCertification(Base):
    """
    Experience certificates, QA credentials, and verified achievements for testers.
    """
    __tablename__ = "tester_certifications"
    __table_args__ = (
        sa.CheckConstraint(
            "verification_status IN ('pending', 'verified', 'rejected')",
            name="check_valid_cert_verification_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    tester_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        sa.String(255),
        nullable=False,
    )
    issuing_organization: Mapped[str] = mapped_column(
        sa.String(200),
        nullable=False,
    )
    credential_id: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    credential_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    issue_date: Mapped[Optional[date]] = mapped_column(
        sa.Date,
        nullable=True,
    )
    expiry_date: Mapped[Optional[date]] = mapped_column(
        sa.Date,
        nullable=True,
    )
    verification_status: Mapped[str] = mapped_column(
        sa.String(50),
        nullable=False,
        default=CERT_STATUS_PENDING,
        server_default=sa.text("'pending'"),
        index=True,
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
    tester: Mapped["User"] = relationship("User", back_populates="tester_certifications")

    def __repr__(self) -> str:
        return f"<TesterCertification tester_id={self.tester_id!r} name={self.name!r}>"


class TesterEndorsement(Base):
    """
    Skill endorsements granted to a tester by founders or senior peers.
    """
    __tablename__ = "tester_endorsements"
    __table_args__ = (
        sa.UniqueConstraint("tester_id", "endorser_id", "skill_name", name="uq_tester_endorser_skill"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    tester_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    endorser_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_name: Mapped[str] = mapped_column(
        sa.String(100),
        nullable=False,
    )
    endorsement_note: Mapped[Optional[str]] = mapped_column(
        sa.Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=sa.func.now(),
    )

    # Relationships
    tester: Mapped["User"] = relationship(
        "User",
        foreign_keys=[tester_id],
        back_populates="received_endorsements",
    )
    endorser: Mapped["User"] = relationship(
        "User",
        foreign_keys=[endorser_id],
        back_populates="given_endorsements",
    )

    def __repr__(self) -> str:
        return f"<TesterEndorsement tester_id={self.tester_id!r} skill={self.skill_name!r}>"


class TesterEmployerReview(Base):
    """
    Ratings and feedback left by previous founders or employers for a tester's work.
    """
    __tablename__ = "tester_employer_reviews"
    __table_args__ = (
        sa.CheckConstraint(
            "overall_rating >= 1 AND overall_rating <= 5",
            name="check_valid_overall_rating",
        ),
        sa.CheckConstraint(
            "thoroughness_rating IS NULL OR (thoroughness_rating >= 1 AND thoroughness_rating <= 5)",
            name="check_valid_thoroughness_rating",
        ),
        sa.CheckConstraint(
            "responsiveness_rating IS NULL OR (responsiveness_rating >= 1 AND responsiveness_rating <= 5)",
            name="check_valid_responsiveness_rating",
        ),
        sa.CheckConstraint(
            "bug_report_quality_rating IS NULL OR (bug_report_quality_rating >= 1 AND bug_report_quality_rating <= 5)",
            name="check_valid_bug_report_quality_rating",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    tester_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewer_name: Mapped[str] = mapped_column(
        sa.String(200),
        nullable=False,
    )
    reviewer_title: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    company_name: Mapped[str] = mapped_column(
        sa.String(200),
        nullable=False,
    )
    overall_rating: Mapped[int] = mapped_column(
        sa.Integer,
        nullable=False,
    )
    thoroughness_rating: Mapped[Optional[int]] = mapped_column(
        sa.Integer,
        nullable=True,
    )
    responsiveness_rating: Mapped[Optional[int]] = mapped_column(
        sa.Integer,
        nullable=True,
    )
    bug_report_quality_rating: Mapped[Optional[int]] = mapped_column(
        sa.Integer,
        nullable=True,
    )
    review_text: Mapped[str] = mapped_column(
        sa.Text,
        nullable=False,
    )
    project_scope: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    is_verified: Mapped[bool] = mapped_column(
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

    # Relationships
    tester: Mapped["User"] = relationship(
        "User",
        foreign_keys=[tester_id],
        back_populates="received_reviews",
    )
    reviewer: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reviewer_id],
        back_populates="given_reviews",
    )
    campaign: Mapped[Optional["Campaign"]] = relationship("Campaign")

    def __repr__(self) -> str:
        return (
            f"<TesterEmployerReview tester_id={self.tester_id!r} "
            f"company={self.company_name!r} rating={self.overall_rating!r}>"
        )
