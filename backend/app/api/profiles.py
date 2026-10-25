import json
import logging
from typing import Any, Dict
from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.profile import FounderProfile, TesterProfile
from app.models.user import User
from app.schemas.profile import (
    FounderProfileResponse,
    FounderProfileUpdateRequest,
    ProfileMeResponse,
    TesterProfileResponse,
    TesterProfileUpdateRequest,
)

logger = logging.getLogger("trylo.profiles")

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

# Fields unique to founder and tester profiles for cross-role validation
FOUNDER_SPECIFIC_FIELDS = {
    "startup_name",
    "professional_title",
    "industry",
    "company_stage",
    "website_url",
    "startup_description",
}
TESTER_SPECIFIC_FIELDS = {
    "bio",
    "skills",
    "interests",
    "experience_level",
    "devices",
}


@router.get(
    "/me",
    response_model=ProfileMeResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user's profile and completion status",
    description="Returns the role-specific profile and completion status of the authenticated founder or tester.",
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileMeResponse:
    """
    Retrieve profile for the authenticated user.
    - If user is a founder: loads FounderProfile
    - If user is a tester: loads TesterProfile
    - Rejects unsupported roles (e.g. admin) with 403 Forbidden.
    """
    if current_user.role == "founder":
        profile = db.scalar(select(FounderProfile).where(FounderProfile.user_id == current_user.id))
        if profile is None:
            return ProfileMeResponse(role="founder", is_complete=False, profile=None)
        return ProfileMeResponse(
            role="founder",
            is_complete=profile.is_complete,
            profile=FounderProfileResponse.model_validate(profile),
        )

    if current_user.role == "tester":
        profile = db.scalar(select(TesterProfile).where(TesterProfile.user_id == current_user.id))
        if profile is None:
            return ProfileMeResponse(role="tester", is_complete=False, profile=None)
        return ProfileMeResponse(
            role="tester",
            is_complete=profile.is_complete,
            profile=TesterProfileResponse.model_validate(profile),
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"User role '{current_user.role}' is not supported for profile management.",
    )


@router.put(
    "/me",
    response_model=ProfileMeResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update current user's profile",
    description="Idempotently creates or updates the authenticated user's role-specific profile.",
)
def update_my_profile(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileMeResponse:
    """
    Update or create role-specific profile:
    1. Authenticate user from session context.
    2. Guard against cross-user modification attempts if user_id is provided in body.
    3. Guard against unauthorized role changes.
    4. Enforce role boundaries (founders cannot submit tester fields and vice versa).
    5. Validate input with role-specific Pydantic schema.
    6. Upsert profile idempotently.
    7. Return updated ProfileMeResponse with is_complete status.
    """
    # Guard: Attempt to modify another user's profile
    supplied_user_id = payload.get("user_id")
    if supplied_user_id is not None and str(supplied_user_id).strip() != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify another user's profile.",
        )

    # Guard: Attempt to change account role through profile update
    supplied_role = payload.get("role")
    if supplied_role is not None and str(supplied_role).strip().lower() != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change account role through profile updates.",
        )

    if current_user.role == "founder":
        # Check cross-role payload contamination
        provided_tester_fields = TESTER_SPECIFIC_FIELDS.intersection(payload.keys())
        if provided_tester_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Founders cannot submit tester profile data ({', '.join(provided_tester_fields)}).",
            )

        # Validate with Founder schema
        try:
            validated = FounderProfileUpdateRequest.model_validate(payload)
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=json.loads(e.json()),
            )

        # Upsert FounderProfile
        profile = db.scalar(select(FounderProfile).where(FounderProfile.user_id == current_user.id))
        if profile is None:
            profile = FounderProfile(user_id=current_user.id)
            db.add(profile)

        profile.startup_name = validated.startup_name
        profile.professional_title = validated.professional_title
        profile.industry = validated.industry
        profile.company_stage = validated.company_stage
        profile.website_url = validated.website_url
        profile.linkedin_url = validated.linkedin_url
        profile.startup_description = validated.startup_description
        profile.city = validated.city
        profile.country = validated.country

        db.commit()
        db.refresh(profile)

        return ProfileMeResponse(
            role="founder",
            is_complete=profile.is_complete,
            profile=FounderProfileResponse.model_validate(profile),
        )

    if current_user.role == "tester":
        # Check cross-role payload contamination
        provided_founder_fields = FOUNDER_SPECIFIC_FIELDS.intersection(payload.keys())
        if provided_founder_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Testers cannot submit founder profile data ({', '.join(provided_founder_fields)}).",
            )

        # Validate with Tester schema
        try:
            validated = TesterProfileUpdateRequest.model_validate(payload)
        except ValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=json.loads(e.json()),
            )

        # Upsert TesterProfile
        profile = db.scalar(select(TesterProfile).where(TesterProfile.user_id == current_user.id))
        if profile is None:
            profile = TesterProfile(user_id=current_user.id)
            db.add(profile)

        profile.bio = validated.bio
        profile.skills = validated.skills
        profile.interests = validated.interests
        profile.experience_level = validated.experience_level
        profile.devices = validated.devices
        profile.city = validated.city
        profile.country = validated.country
        profile.linkedin_url = validated.linkedin_url

        db.commit()
        db.refresh(profile)

        return ProfileMeResponse(
            role="tester",
            is_complete=profile.is_complete,
            profile=TesterProfileResponse.model_validate(profile),
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"User role '{current_user.role}' is not authorized for profile management.",
    )


# Explicit role-guarded endpoints to reject unauthorized cross-role access
@router.get(
    "/founder",
    response_model=ProfileMeResponse,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Founder profile access",
)
def get_founder_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileMeResponse:
    return get_my_profile(current_user=current_user, db=db)


@router.put(
    "/founder",
    response_model=ProfileMeResponse,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Founder profile update",
)
def update_founder_profile(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileMeResponse:
    return update_my_profile(payload=payload, current_user=current_user, db=db)


@router.get(
    "/tester",
    response_model=ProfileMeResponse,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Tester profile access",
)
def get_tester_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileMeResponse:
    return get_my_profile(current_user=current_user, db=db)


@router.put(
    "/tester",
    response_model=ProfileMeResponse,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Tester profile update",
)
def update_tester_profile(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileMeResponse:
    return update_my_profile(payload=payload, current_user=current_user, db=db)
