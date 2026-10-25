"""Unit Tests for Password Hashing and Security Utilities."""

import pytest
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_length,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
)


def test_hash_password_produces_argon2id():
    """Verify that hash_password creates a valid Argon2id hash."""
    plain = "SuperSecret123!"
    hashed = hash_password(plain)

    assert hashed is not None
    assert hashed != plain
    assert hashed.startswith("$argon2id$")


def test_hash_password_is_salted():
    """Verify that hashing identical passwords generates different hashes (salting)."""
    plain = "MySecretPassword123"
    hash1 = hash_password(plain)
    hash2 = hash_password(plain)

    assert hash1 != hash2
    assert verify_password(plain, hash1) is True
    assert verify_password(plain, hash2) is True


def test_verify_password_correct():
    """Verify that verify_password returns True for matching plaintext password."""
    plain = "CorrectHorseBatteryStaple99"
    hashed = hash_password(plain)

    assert verify_password(plain, hashed) is True


def test_verify_password_incorrect():
    """Verify that verify_password returns False for non-matching plaintext password."""
    plain = "CorrectPassword123"
    hashed = hash_password(plain)

    assert verify_password("WrongPassword456", hashed) is False


def test_verify_password_empty_or_malformed():
    """Verify that verify_password safely handles empty strings or malformed hashes."""
    assert verify_password("", "some_hash") is False
    assert verify_password("some_pass", "") is False
    assert verify_password("some_pass", "malformed_not_a_hash") is False


def test_validate_password_length_valid():
    """Verify valid password lengths do not raise errors."""
    validate_password_length("a" * MIN_PASSWORD_LENGTH)
    validate_password_length("a" * 32)
    validate_password_length("a" * MAX_PASSWORD_LENGTH)


def test_validate_password_length_empty():
    """Verify empty password raises ValueError with empty error message."""
    with pytest.raises(ValueError, match="cannot be empty"):
        validate_password_length("")


@pytest.mark.parametrize("invalid_password", [
    "short",
    "1234567",
    "a",
])
def test_validate_password_length_too_short(invalid_password):
    """Verify short passwords raise ValueError."""
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_length(invalid_password)


def test_validate_password_length_too_long():
    """Verify excessively long passwords (>128 chars) raise ValueError."""
    long_pass = "x" * 129
    with pytest.raises(ValueError, match="must not exceed 128 characters"):
        validate_password_length(long_pass)


def test_hash_password_rejects_empty_or_short():
    """Verify hash_password propagates validation error for short passwords."""
    with pytest.raises(ValueError):
        hash_password("short")
