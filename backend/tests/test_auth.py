"""Automated Tests for User Registration API (/api/auth/register)."""

from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.core.security import verify_password


def test_register_founder_success(test_client: TestClient, db_session: Session):
    """Test successful registration of a Founder account."""
    payload = {
        "full_name": "Alice Founder",
        "email": "alice@startup.io",
        "password": "StrongPassword123!",
        "role": "founder",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert "id" in data
    assert data["full_name"] == "Alice Founder"
    assert data["email"] == "alice@startup.io"
    assert data["role"] == "founder"
    assert data["is_active"] is True
    assert "created_at" in data

    # Security check: Password and hash must never be returned in API response
    assert "password" not in data
    assert "password_hash" not in data

    # Verify database persistence and Argon2id hash storage
    user_in_db = db_session.scalar(select(User).where(User.email == "alice@startup.io"))
    assert user_in_db is not None
    assert user_in_db.full_name == "Alice Founder"
    assert user_in_db.password_hash.startswith("$argon2id$")
    assert user_in_db.password_hash != payload["password"]
    assert verify_password(payload["password"], user_in_db.password_hash) is True


def test_register_tester_success(test_client: TestClient, db_session: Session):
    """Test successful registration of a Tester account."""
    payload = {
        "full_name": "Bob Tester",
        "email": "bob@testers.org",
        "password": "TesterSecurePass123!",
        "role": "tester",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["full_name"] == "Bob Tester"
    assert data["email"] == "bob@testers.org"
    assert data["role"] == "tester"
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data


def test_register_email_normalization(test_client: TestClient, db_session: Session):
    """Verify that email addresses are trimmed and lowercased upon registration."""
    payload = {
        "full_name": "Charlie Normalizer",
        "email": "  CHARLIE.Dev@Example.Com  ",
        "password": "Password1234!",
        "role": "tester",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "charlie.dev@example.com"

    # Query DB with normalized email
    user = db_session.scalar(select(User).where(User.email == "charlie.dev@example.com"))
    assert user is not None


def test_register_duplicate_email_rejected(test_client: TestClient):
    """Verify duplicate email registration is rejected with 409 Conflict."""
    payload = {
        "full_name": "First User",
        "email": "duplicate@test.com",
        "password": "Password123!",
        "role": "founder",
    }
    # Initial registration
    res1 = test_client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt second registration with same email (different casing)
    duplicate_payload = {
        "full_name": "Second User",
        "email": "DUPLICATE@TEST.COM",
        "password": "DifferentPassword123!",
        "role": "tester",
    }
    res2 = test_client.post("/api/auth/register", json=duplicate_payload)
    assert res2.status_code == 409
    error_data = res2.json()
    assert "already exists" in error_data["detail"].lower()


@pytest.mark.parametrize("invalid_email", [
    "not-an-email",
    "missingat.com",
    "@missingusername.com",
    "user@.com",
    "user@domain",
])
def test_register_invalid_email_format(test_client: TestClient, invalid_email):
    """Verify malformed email formats are rejected with 422 Unprocessable Entity."""
    payload = {
        "full_name": "Test User",
        "email": invalid_email,
        "password": "ValidPassword123!",
        "role": "tester",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_register_admin_role_forbidden(test_client: TestClient):
    """
    Critical Security Test: Public registration must NEVER permit creation of an admin account.
    """
    payload = {
        "full_name": "Sneaky Attacker",
        "email": "attacker@hack.com",
        "password": "Password123!",
        "role": "admin",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    assert "admin" in response.text.lower()


@pytest.mark.parametrize("invalid_role", [
    "superuser",
    "moderator",
    "root",
    "",
    "founder,admin",
])
def test_register_arbitrary_roles_rejected(test_client: TestClient, invalid_role):
    """Verify arbitrary or malicious roles are rejected."""
    payload = {
        "full_name": "Test User",
        "email": "testrole@example.com",
        "password": "Password123!",
        "role": invalid_role,
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize("missing_field", [
    "full_name",
    "email",
    "password",
    "role",
])
def test_register_missing_required_fields(test_client: TestClient, missing_field):
    """Verify missing required fields return 422 Unprocessable Entity."""
    payload = {
        "full_name": "Valid Name",
        "email": "valid@example.com",
        "password": "ValidPassword123!",
        "role": "tester",
    }
    del payload[missing_field]
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_register_password_too_short(test_client: TestClient):
    """Verify passwords shorter than 8 characters are rejected."""
    payload = {
        "full_name": "Short Pass User",
        "email": "shortpass@example.com",
        "password": "1234567",  # 7 chars
        "role": "tester",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_response_never_exposes_password_hash_keys(test_client: TestClient):
    """Strict verification that no response payload contains password or hash fields."""
    payload = {
        "full_name": "Audit User",
        "email": "audit@example.com",
        "password": "SecurePassword123!",
        "role": "founder",
    }
    response = test_client.post("/api/auth/register", json=payload)
    assert response.status_code == 201

    response_keys = list(response.json().keys())
    for key in response_keys:
        assert "password" not in key.lower()
        assert "hash" not in key.lower()
        assert "secret" not in key.lower()


def test_race_condition_integrity_error_triggers_rollback(test_client: TestClient):
    """
    Verify that if a database race condition raises IntegrityError on commit,
    the transaction is rolled back and HTTP 409 Conflict is returned safely.
    """
    payload = {
        "full_name": "Race User",
        "email": "race@example.com",
        "password": "SecurePassword123!",
        "role": "founder",
    }

    # Simulate IntegrityError on db.commit
    with patch("sqlalchemy.orm.Session.commit", side_effect=IntegrityError("mock", "mock", Exception("UniqueViolation"))):
        with patch("sqlalchemy.orm.Session.rollback") as mock_rollback:
            response = test_client.post("/api/auth/register", json=payload)
            assert response.status_code == 409
            assert "already exists" in response.json()["detail"].lower()
            mock_rollback.assert_called_once()
