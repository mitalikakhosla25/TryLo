"""Security, Password Hashing, JWT and CSRF Utilities for TryLo.

Uses pwdlib with Argon2id for state-of-the-art password hashing.
Uses PyJWT with HS256 for short-lived access token encoding and verification.
Never logs plain passwords, password hashes, JWT tokens, or security secrets.
"""

import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.core.config import settings

# Initialize Argon2id password hasher with secure defaults
_password_hash = PasswordHash((Argon2Hasher(),))

# Minimum and maximum length constraints for passwords
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128


def validate_password_length(password: str) -> None:
    """
    Validate that a password meets length requirements.
    Raises ValueError if empty, too short, or excessively long.
    """
    if not password or not isinstance(password, str):
        raise ValueError("Password cannot be empty.")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
        )
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(
            f"Password must not exceed {MAX_PASSWORD_LENGTH} characters."
        )


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Argon2id.
    Validates password length prior to hashing.
    Never logs the password or hash.
    """
    validate_password_length(password)
    return _password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against an Argon2id hash.
    Returns True if match, False otherwise.
    Safely handles malformed hashes without crashing or leaking details.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        return _password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(
    user_id: uuid.UUID,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generate a signed short-lived JWT access token for an authenticated user.
    Claims:
      - sub: String representation of the user's immutable UUID.
      - role: Platform role (founder or tester).
      - iat: Issued at timestamp (UTC).
      - exp: Expiration timestamp (UTC).
      - jti: Unique token identifier (UUID).
    """
    now = datetime.now(timezone.utc)
    if expires_delta is not None:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT access token.
    Enforces algorithm matching, signature verification, and expiration check.
    Raises jwt.PyJWTError subclasses on invalid, expired, or tampered tokens.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat"]},
    )


def generate_csrf_token() -> str:
    """Generate a cryptographically secure random token for CSRF protection."""
    return secrets.token_urlsafe(32)


def verify_csrf_token(cookie_csrf: Optional[str], header_csrf: Optional[str]) -> bool:
    """
    Compare CSRF tokens using constant-time comparison to prevent timing attacks.
    Returns True if both exist and match.
    """
    if not cookie_csrf or not header_csrf:
        return False
    return hmac.compare_digest(cookie_csrf, header_csrf)
