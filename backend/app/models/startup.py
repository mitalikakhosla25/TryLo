"""TryLo Startup Database Model."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.profile import ALLOWED_COMPANY_STAGES

INDIAN_STATES_AND_UTS = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
]

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.campaign import Campaign


class Startup(Base):
    """
    SQLAlchemy 2.x Startup entity.
    Represents a startup or product owned by a founder.
    A single founder can own and manage multiple startups.
    """
    __tablename__ = "startups"
    __table_args__ = (
        sa.CheckConstraint(
            "company_stage IS NULL OR company_stage IN ('Idea', 'Prototype', 'MVP', 'Early Traction', 'Growth')",
            name="check_valid_startup_company_stage",
        ),
        sa.CheckConstraint(
            "founded_year IS NULL OR (founded_year >= 1900 AND founded_year <= 2100)",
            name="check_valid_startup_founded_year",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid,
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        sa.String(200),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        sa.String(220),
        unique=True,
        index=True,
        nullable=False,
    )
    tagline: Mapped[Optional[str]] = mapped_column(
        sa.String(255),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        sa.Text,
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
    logo_url: Mapped[Optional[str]] = mapped_column(
        sa.String(500),
        nullable=True,
    )
    city: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    state: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
        index=True,
    )
    country: Mapped[Optional[str]] = mapped_column(
        sa.String(100),
        nullable=True,
    )
    founded_year: Mapped[Optional[int]] = mapped_column(
        sa.Integer,
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
    owner: Mapped["User"] = relationship("User", back_populates="startups")
    campaigns: Mapped[List["Campaign"]] = relationship(
        "Campaign",
        back_populates="startup",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Startup id={self.id!r} name={self.name!r} slug={self.slug!r} owner_id={self.owner_id!r}>"
