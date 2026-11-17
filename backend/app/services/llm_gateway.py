"""TryLo Hybrid LLM Gateway Service.

Provides a unified interface for Google Gemini API integration with automatic,
graceful fallback to TryLo's local deterministic intelligence engine.

Works 100% out-of-the-box without requiring any subscription or API keys,
while allowing founders to connect a free Google Gemini API key
(from Google AI Studio: https://aistudio.google.com/app/apikey) for live LLM reasoning.
"""

import logging
from typing import Dict, Any, Optional

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


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
            "Connected to live Google Gemini 1.5 Flash model."
            if is_live
            else "Operating on built-in TryLo offline intelligence engine. No subscription or API key required. "
                 "To connect live Gemini LLM for free (15 RPM / 1,500 daily requests free), obtain a key from "
                 "https://aistudio.google.com/app/apikey and add GEMINI_API_KEY to backend/.env."
        ),
    }


def generate_text_with_gemini(
    prompt: str,
    system_instruction: Optional[str] = None,
    timeout_seconds: float = 10.0,
) -> Optional[str]:
    """Call Google Gemini 1.5 Flash API with timeout and safe fallback.

    Returns:
        Generated text string on success, or None if Gemini is unconfigured or unavailable.
    """
    if not is_gemini_configured():
        return None

    api_key = settings.GEMINI_API_KEY.strip()
    model = settings.GEMINI_MODEL or "gemini-1.5-flash"
    url = f"{GEMINI_API_BASE_URL}/{model}:generateContent?key={api_key}"

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

    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        if response.status_code != 200:
            logger.warning(
                "Gemini API returned status code %s: %s. Falling back to local intelligence.",
                response.status_code,
                response.text[:200],
            )
            return None

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
        logger.warning(
            "Gemini API request failed (%s). Falling back gracefully to local intelligence.",
            exc,
        )
        return None
