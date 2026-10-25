"""In-Memory Rate Limiter for Login Attempts.

Tracks consecutive failed attempts per key (IP / email) without requiring external dependencies like Redis.
Thread-safe and prunes expired timestamps automatically.
"""

import time
import threading
from typing import Dict, List
from app.core.config import settings


class InMemoryLoginRateLimiter:
    def __init__(self):
        self._attempts: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def _cleanup_old_attempts(self, now: float) -> None:
        """Prune timestamps older than the configured sliding window."""
        cutoff = now - settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
        keys_to_delete = []
        for key, timestamps in self._attempts.items():
            valid_timestamps = [t for t in timestamps if t > cutoff]
            if valid_timestamps:
                self._attempts[key] = valid_timestamps
            else:
                keys_to_delete.append(key)
        for key in keys_to_delete:
            del self._attempts[key]

    def is_rate_limited(self, key: str) -> bool:
        """Check if the key has exceeded the maximum allowed failed attempts."""
        now = time.time()
        with self._lock:
            self._cleanup_old_attempts(now)
            timestamps = self._attempts.get(key, [])
            return len(timestamps) >= settings.LOGIN_RATE_LIMIT_MAX_ATTEMPTS

    def record_failed_attempt(self, key: str) -> None:
        """Record a failed login attempt for the key."""
        now = time.time()
        with self._lock:
            self._cleanup_old_attempts(now)
            if key not in self._attempts:
                self._attempts[key] = []
            self._attempts[key].append(now)

    def reset_attempts(self, key: str) -> None:
        """Clear recorded failed attempts after a successful login."""
        with self._lock:
            if key in self._attempts:
                del self._attempts[key]

    def clear_all(self) -> None:
        """Clear all rate limiter state (useful for tests)."""
        with self._lock:
            self._attempts.clear()


login_rate_limiter = InMemoryLoginRateLimiter()
