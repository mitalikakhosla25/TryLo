"""TryLo Core Configuration Module."""

from typing import List, Union, Optional
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "TryLo API"
    APP_ENV: str = "development"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Database Configuration
    DATABASE_URL: str = ""
    DB_TIMEOUT_SECONDS: int = 5

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = "trylo-dev-secret-key-change-in-production-min-32-bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Cookie & CSRF Configuration
    COOKIE_NAME: str = "trylo_access_token"
    CSRF_COOKIE_NAME: str = "trylo_csrf_token"
    CSRF_HEADER_NAME: str = "X-CSRF-Token"
    COOKIE_SECURE: Optional[bool] = None  # None -> auto-set to True if APP_ENV == "production"
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None

    # Rate Limiting for Login Attempts (in-memory, per IP/email)
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 300

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[List[str], str]) -> List[str]:
        if isinstance(value, str):
            # Support comma-separated strings as well as JSON string arrays
            stripped = value.strip()
            if stripped.startswith("[") and stripped.endswith("]"):
                import json
                try:
                    return json.loads(stripped)
                except Exception:
                    pass
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """Fail safely if required production security settings are weak or default."""
        if self.APP_ENV == "production":
            insecure_defaults = [
                "trylo-dev-secret-key-change-in-production-min-32-bytes",
                "secret",
                "changeme",
                "password",
            ]
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY in insecure_defaults or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL: JWT_SECRET_KEY must be configured with at least 32 cryptographically secure random bytes in production!"
                )
        return self

    @property
    def is_cookie_secure(self) -> bool:
        """Determines if the cookie should have the 'Secure' flag (HTTPS-only)."""
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.APP_ENV == "production"

    @property
    def is_database_configured(self) -> bool:
        """Check whether a realistic database URL has been provided."""
        if not self.DATABASE_URL:
            return False
        # Guard against placeholder values from .env.example
        placeholders = ["[YOUR-PASSWORD]", "[PROJECT-REF]", "YOUR-PASSWORD", "PROJECT-REF"]
        for ph in placeholders:
            if ph in self.DATABASE_URL:
                return False
        return True

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """
        Return SQLAlchemy-compatible database URI using psycopg 3 driver.
        Supabase provides URLs starting with 'postgresql://' or 'postgres://'.
        We normalize them to 'postgresql+psycopg://'.
        """
        url = self.DATABASE_URL.strip()
        if not url:
            return ""

        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://"):]
        return url


settings = Settings()
