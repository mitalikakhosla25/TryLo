"""FastAPI Authentication, Role Authorization, and CSRF Dependencies for TryLo."""

import uuid
import logging
from typing import List, Optional
from urllib.parse import urlparse
import jwt
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.security import decode_access_token, verify_csrf_token
from app.db.session import get_db
from app.models.user import User

logger = logging.getLogger("trylo.auth.deps")


def get_token_from_request(request: Request) -> Optional[str]:
    """
    Extract JWT access token from HttpOnly cookie first.
    Falls back to 'Authorization: Bearer <token>' header if cookie is absent.
    """
    logger.debug(
        "Auth check - Host: %s, Origin: %s, Cookie keys: %s",
        request.headers.get("host"),
        request.headers.get("origin"),
        list(request.cookies.keys()),
    )
    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    if cookie_token:
        return cookie_token

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[len("Bearer "):].strip()

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate the current request:
    1. Extracts JWT access token from HttpOnly cookie or Authorization header.
    2. Validates token signature, structure, and expiration.
    3. Resolves user from the database by immutable UUID.
    4. Confirms that the user exists and is active.
    Raises HTTP 401 Unauthorized for missing, expired, tampered, or inactive sessions.
    """
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as exc:
        logger.warning("Session token validation failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tampered session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is missing subject identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token contains malformed user identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(select(User).where(User.id == user_uuid))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this session no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive. Please contact support.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_role(allowed_roles: List[str]):
    """
    Factory creating a dependency that verifies the authenticated user possesses
    one of the allowed platform roles.
    Raises HTTP 403 Forbidden if user lacks necessary permissions.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{current_user.role}' is not authorized for this resource.",
            )
        return current_user

    return role_checker


def validate_csrf(request: Request) -> None:
    """
    Validate CSRF protection for state-changing authenticated requests.
    Validates Origin/Referer header and verifies that the double-submit cookie matches the header.
    """
    # 1. Verify Origin / Referer header if present
    origin = request.headers.get("Origin") or request.headers.get("Referer")
    if origin:
        parsed_origin = urlparse(origin)
        origin_base = f"{parsed_origin.scheme}://{parsed_origin.netloc}"
        allowed_origins = [o.rstrip("/") for o in settings.CORS_ORIGINS]
        if origin_base not in allowed_origins and not (settings.APP_ENV == "development" and parsed_origin.hostname in ("localhost", "127.0.0.1")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Untrusted request origin.",
            )

    # 2. Check Double Submit Cookie matching
    cookie_csrf = request.cookies.get(settings.CSRF_COOKIE_NAME)
    header_csrf = request.headers.get(settings.CSRF_HEADER_NAME)

    if not cookie_csrf or not header_csrf or not verify_csrf_token(cookie_csrf, header_csrf):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed or missing.",
        )
