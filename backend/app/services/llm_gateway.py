"""TryLo Hybrid LLM Gateway Service.

Provides a unified interface for Google Gemini API integration with automatic,
graceful fallback to TryLo's local deterministic intelligence engine.

Works 100% out-of-the-box without requiring any subscription or API keys,
while allowing founders to connect a free Google Gemini API key
(from Google AI Studio: https://aistudio.google.com/app/apikey) for live LLM reasoning.
"""

import json
import logging
import random
import re
import time
from typing import Dict, Any, Optional

import httpx
from app.core.config import settings

logger = logging.getLogger("trylo.llm_gateway")

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Retry configuration for live LLM queries
MAX_GEMINI_RETRIES = 3
INITIAL_BACKOFF_SECONDS = 1.0
BACKOFF_FACTOR = 2.0
MAX_BACKOFF_SECONDS = 10.0

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
NON_RETRYABLE_STATUS_CODES = {400, 401, 403, 404}


def sanitize_log_text(text: str) -> str:
    """Scrub sensitive API keys and query tokens from log strings."""
    if not text:
        return ""
    # Strip key query parameter
    sanitized = re.sub(r"key=[a-zA-Z0-9_\-]+", "key=[REDACTED]", text)
    # Strip actual API key if present in string
    api_key = settings.GEMINI_API_KEY
    if api_key and isinstance(api_key, str) and len(api_key.strip()) > 5:
        sanitized = sanitized.replace(api_key.strip(), "[REDACTED]")
    return sanitized


def is_gemini_configured() -> bool:
    """Return True if a non-placeholder Gemini API key is configured."""
    key = settings.GEMINI_API_KEY
    if not key or not isinstance(key, str):
        return False
    clean = key.strip()
    return bool(clean and clean != "your_gemini_api_key_here" and len(clean) >= 10)


def get_ai_engine_status() -> Dict[str, Any]:
    """Return current AI engine operational mode and tier information."""
    is_live = is_gemini_configured()
    return {
        "is_live_llm": is_live,
        "provider": "Google Gemini" if is_live else "Local Offline Engine",
        "model": settings.GEMINI_MODEL if is_live else "trylo-deterministic-nlp",
        "subscription_required": False,
        "free_tier_available": True,
        "free_tier_provider_url": "https://aistudio.google.com/app/apikey",
        "notice": (
            f"Connected to live Google Gemini ({settings.GEMINI_MODEL}) model."
            if is_live
            else "Operating on built-in TryLo offline intelligence engine. No subscription or API key required. "
                 "To connect live Gemini LLM for free (15 RPM / 1,500 daily requests free), obtain a key from "
                 "https://aistudio.google.com/app/apikey and add GEMINI_API_KEY to backend/.env."
        ),
    }


def _parse_retry_after(response: httpx.Response) -> Optional[float]:
    """Parse Retry-After header as float seconds if provided."""
    raw = response.headers.get("Retry-After")
    if not raw:
        return None
    try:
        val = float(raw.strip())
        return min(max(val, 0.5), MAX_BACKOFF_SECONDS)
    except (ValueError, TypeError):
        return None


def _execute_gemini_request(
    payload: Dict[str, Any],
    timeout_seconds: float = 25.0,
) -> Optional[httpx.Response]:
    """Execute Gemini REST API request with bounded retry and backoff.

    Features:
    - Bounded retries (up to 3 retries) on HTTP 429, 500, 502, 503, 504.
    - Exponential backoff with random jitter.
    - Honors Retry-After headers when provided.
    - Immediate abort without retry on 400 (Bad Request), 401/403 (Invalid Key), 404 (Model Not Found).
    - Uses x-goog-api-key header and scrubs all log output to prevent secret leakage.
    - Returns None on exhaustion or non-retryable error to invoke graceful fallback.
    """
    if not is_gemini_configured():
        return None

    api_key = settings.GEMINI_API_KEY.strip()
    model = settings.GEMINI_MODEL or "gemini-1.5-flash"
    url = f"{GEMINI_API_BASE_URL}/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    attempt = 0
    while attempt <= MAX_GEMINI_RETRIES:
        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                response = client.post(url, json=payload, headers=headers)

            if response.status_code == 200:
                return response

            # Non-retryable client errors (invalid key, bad payload, missing model)
            if response.status_code in NON_RETRYABLE_STATUS_CODES:
                logger.warning(
                    "Gemini API returned non-retryable status %d: %s. Aborting retries and using local fallback.",
                    response.status_code,
                    sanitize_log_text(response.text[:200]),
                )
                return None

            # Retryable server or rate limit errors
            if response.status_code in RETRYABLE_STATUS_CODES:
                if attempt >= MAX_GEMINI_RETRIES:
                    logger.warning(
                        "Gemini API returned retryable status %d on final attempt (%d/%d): %s. Exhausted retries.",
                        response.status_code,
                        attempt + 1,
                        MAX_GEMINI_RETRIES + 1,
                        sanitize_log_text(response.text[:200]),
                    )
                    return None

                retry_after = _parse_retry_after(response)
                if retry_after is not None:
                    delay = retry_after + random.uniform(0.1, 0.4)
                else:
                    delay = min(MAX_BACKOFF_SECONDS, INITIAL_BACKOFF_SECONDS * (BACKOFF_FACTOR ** attempt)) + random.uniform(0.1, 0.4)

                logger.warning(
                    "Gemini API returned status %d on attempt %d/%d. Retrying in %.2fs...",
                    response.status_code,
                    attempt + 1,
                    MAX_GEMINI_RETRIES + 1,
                    delay,
                )
                time.sleep(delay)
                attempt += 1
                continue

            # Unhandled status codes
            logger.warning(
                "Gemini API returned unexpected status %d: %s. Aborting.",
                response.status_code,
                sanitize_log_text(response.text[:200]),
            )
            return None

        except (httpx.TransportError, httpx.TimeoutException) as net_err:
            if attempt >= MAX_GEMINI_RETRIES:
                logger.warning(
                    "Gemini API network error on final attempt (%d/%d): %s. Exhausted retries.",
                    attempt + 1,
                    MAX_GEMINI_RETRIES + 1,
                    sanitize_log_text(str(net_err)),
                )
                return None

            delay = min(MAX_BACKOFF_SECONDS, INITIAL_BACKOFF_SECONDS * (BACKOFF_FACTOR ** attempt)) + random.uniform(0.1, 0.4)
            logger.warning(
                "Gemini API transient network failure (%s) on attempt %d/%d. Retrying in %.2fs...",
                sanitize_log_text(str(net_err)),
                attempt + 1,
                MAX_GEMINI_RETRIES + 1,
                delay,
            )
            time.sleep(delay)
            attempt += 1

        except Exception as exc:
            logger.warning(
                "Gemini API unexpected error: %s. Aborting retries.",
                sanitize_log_text(str(exc)),
            )
            return None

    return None


def generate_text_with_gemini(
    prompt: str,
    system_instruction: Optional[str] = None,
    timeout_seconds: float = 25.0,
) -> Optional[str]:
    """Call Google Gemini API with timeout, retry resilience, and safe fallback.

    Returns:
        Generated text string on success (HTTP 200), or None if Gemini is unconfigured or unavailable.
    """
    payload: Dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
        },
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    response = _execute_gemini_request(payload, timeout_seconds=timeout_seconds)
    if not response or response.status_code != 200:
        return None

    try:
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None

        text = parts[0].get("text", "")
        return text.strip() if text else None
    except Exception as exc:
        logger.warning("Failed to parse Gemini text response: %s", sanitize_log_text(str(exc)))
        return None


def generate_json_with_gemini(
    prompt: str,
    system_instruction: Optional[str] = None,
    timeout_seconds: float = 25.0,
) -> Optional[Dict[str, Any]]:
    """Call Google Gemini API expecting a structured JSON response.

    Enforces application/json response MIME type with automatic JSON parsing
    and safe fallback if the response cannot be parsed or if the API is unavailable.
    """
    payload: Dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json",
        },
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    response = _execute_gemini_request(payload, timeout_seconds=timeout_seconds)
    if not response or response.status_code != 200:
        return None

    try:
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None

        raw_text = parts[0].get("text", "").strip()
        if not raw_text:
            return None

        # Clean any potential accidental markdown wrapping
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        return json.loads(raw_text)

    except json.JSONDecodeError as jde:
        logger.warning("Gemini returned invalid JSON: %s. Falling back to local intelligence.", jde)
        return None
    except Exception as exc:
        logger.warning("Gemini API JSON request processing failed (%s). Falling back to local intelligence.", sanitize_log_text(str(exc)))
        return None



