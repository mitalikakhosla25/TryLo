"""Authentication, Registration, Session, and Protected Endpoints for TryLo."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_csrf_token,
)
from app.core.rate_limiter import login_rate_limiter
from app.db.session import get_db
from app.models.user import User, ALLOWED_REGISTRATION_ROLES
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    MessageResponse,
)
from app.api.deps import get_current_user, require_role, validate_csrf

logger = logging.getLogger("trylo.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description=(
        "Registers a new platform user with the 'founder' or 'tester' role. "
        "Passwords are encrypted with Argon2id before storage and never returned in responses."
    ),
)
def register_user(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Handle secure user registration:
    1. Validates inputs via UserRegisterRequest schema.
    2. Validates role against allowed self-registration roles (founder, tester).
    3. Normalizes email address.
    4. Pre-checks for duplicate email (returns 409 Conflict).
    5. Hashes password using Argon2id.
    6. Safely commits transaction; catches database uniqueness violations to prevent race conditions.
    7. Returns sanitized user record without password hash.
    """
    if payload.role not in ALLOWED_REGISTRATION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration role '{payload.role}' is not allowed. Choose 'founder' or 'tester'.",
        )

    normalized_email = payload.email.strip().lower()

    # Pre-check email existence
    existing_user = db.scalar(select(User).where(User.email == normalized_email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Securely hash the password with Argon2id
    try:
        hashed_password = hash_password(payload.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # Construct user entity
    new_user = User(
        full_name=payload.full_name,
        email=normalized_email,
        password_hash=hashed_password,
        role=payload.role,
        is_active=True,
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )
    except Exception as exc:
        db.rollback()
        logger.error("Unexpected database error during user registration: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the account. Please try again later.",
        )

    logger.info("Successfully registered user account with role '%s' [id=%s]", new_user.role, new_user.id)
    return new_user


@router.post(
    "/login",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="User login with HttpOnly session cookie",
    description="Authenticates credentials and sets a secure HttpOnly session cookie and CSRF token cookie.",
)
def login_user(
    payload: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Authenticate user:
    1. Check rate limiter to mitigate brute-force attacks.
    2. Normalize email.
    3. Look up user by email in PostgreSQL.
    4. Verify password with Argon2id. Generic error on failure.
    5. Check active status.
    6. Issue short-lived JWT in HttpOnly cookie and CSRF token in readable cookie.
    7. Return sanitized UserResponse.
    """
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{payload.email}:{client_ip}"

    if login_rate_limiter.is_rate_limited(rate_limit_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again later.",
        )

    # Query user by normalized email
    user = db.scalar(select(User).where(User.email == payload.email))

    # Reject if user does not exist or password does not match
    if user is None or not verify_password(payload.password, user.password_hash):
        login_rate_limiter.record_failed_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject inactive accounts
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive. Please contact support.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Credentials valid -> reset rate limit counter
    login_rate_limiter.reset_attempts(rate_limit_key)

    # Generate access token and CSRF token
    access_token = create_access_token(user_id=user.id, role=user.role)
    csrf_token = generate_csrf_token()

    max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # Set HttpOnly Access Token Cookie
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age_seconds,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )

    # Set Client-Readable CSRF Cookie for double-submit verification
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age_seconds,
        path="/",
        domain=settings.COOKIE_DOMAIN,
    )

    logger.info("User successfully logged in [id=%s, role=%s]", user.id, user.role)
    return user


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Resolves identity from validated HttpOnly session cookie and checks user active status in DB.",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="User logout and session cookie clearing",
    description="Clears authentication and CSRF cookies to terminate the browser session.",
)
def logout_user(
    request: Request,
    response: Response,
) -> MessageResponse:
    """
    Log out user:
    1. Validates CSRF token if cookie is present.
    2. Clears both access token and CSRF token cookies.
    3. Idempotently returns success.
    """
    # If the user has a CSRF cookie, validate the CSRF token on logout
    if request.cookies.get(settings.CSRF_COOKIE_NAME):
        validate_csrf(request)

    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=settings.CSRF_COOKIE_NAME,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
    )

    return MessageResponse(message="Successfully logged out.")


# Role-protected endpoints to verify authorization foundation
@router.get(
    "/founder-workspace",
    response_model=MessageResponse,
    dependencies=[Depends(require_role(["founder"]))],
    summary="Founder-only workspace access test",
)
def founder_workspace(current_user: User = Depends(get_current_user)):
    return MessageResponse(message=f"Welcome to Founder Workspace, {current_user.full_name}!")


@router.get(
    "/tester-workspace",
    response_model=MessageResponse,
    dependencies=[Depends(require_role(["tester"]))],
    summary="Tester-only workspace access test",
)
def tester_workspace(current_user: User = Depends(get_current_user)):
    return MessageResponse(message=f"Welcome to Tester Workspace, {current_user.full_name}!")
