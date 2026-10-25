"""Slug Generation and Collision Resolution Utility for TryLo."""

import re
import unicodedata
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select


def slugify(text: str) -> str:
    """
    Generate an ASCII URL-friendly slug from arbitrary string.
    Normalizes unicode, converts to lowercase, replaces non-alphanumeric characters with hyphens.
    """
    if not text:
        return "startup"

    # Normalize unicode characters
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    # Lowercase and replace non-alphanumeric characters with hyphens
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[-\s]+", "-", text)
    # Trim to 180 chars to leave ample room for collision suffixes
    trimmed = text[:180].strip("-")
    return trimmed or "startup"


def generate_unique_startup_slug(
    name: str,
    db: Session,
    exclude_startup_id: Optional[uuid.UUID] = None,
) -> str:
    """
    Generate a guaranteed unique slug for a startup entity in the database.
    If the base slug is taken, appends incremental numeric suffix (e.g. -2, -3)
    or short random hex to avoid collisions.
    """
    from app.models.startup import Startup

    base_slug = slugify(name)
    candidate = base_slug
    counter = 1

    while True:
        query = select(Startup.id).where(Startup.slug == candidate)
        if exclude_startup_id is not None:
            query = query.where(Startup.id != exclude_startup_id)

        existing = db.scalar(query)
        if existing is None:
            return candidate

        counter += 1
        if counter <= 50:
            candidate = f"{base_slug}-{counter}"
        else:
            # High collision fallback
            candidate = f"{base_slug}-{uuid.uuid4().hex[:6]}"


def generate_unique_campaign_slug(
    title: str,
    startup_id: uuid.UUID,
    db: Session,
    exclude_campaign_id: Optional[uuid.UUID] = None,
) -> str:
    """
    Generate a unique slug for a campaign within the scope of its startup.
    If the base slug already exists for the given startup, appends -2, -3, etc.
    """
    from app.models.campaign import Campaign

    base_slug = slugify(title)
    if base_slug == "startup":
        base_slug = "campaign"
    candidate = base_slug
    counter = 1

    while True:
        query = select(Campaign.id).where(
            Campaign.startup_id == startup_id,
            Campaign.slug == candidate,
        )
        if exclude_campaign_id is not None:
            query = query.where(Campaign.id != exclude_campaign_id)

        existing = db.scalar(query)
        if existing is None:
            return candidate

        counter += 1
        if counter <= 50:
            candidate = f"{base_slug}-{counter}"
        else:
            candidate = f"{base_slug}-{uuid.uuid4().hex[:6]}"

