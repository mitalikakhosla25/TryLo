"""Tests for TryLo Founder AI Co-Pilot Service."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.models.user import User
from app.services.ai_copilot import query_ai_copilot


def make_dummy_submission(title: str, desc: str, severity: str = "medium", video_url: str = None) -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.campaign_id = uuid.uuid4()
    sub.tester_id = uuid.uuid4()
    sub.title = title
    sub.description = desc
    sub.severity = severity
    sub.feedback_type = "bug"
    sub.status = "submitted"
    sub.video_url = video_url
    tester = User()
    tester.id = sub.tester_id
    tester.full_name = "Alex Vance"
    tester.email = "alex@trylo.io"
    sub.tester = tester
    return sub


def test_query_ai_copilot_empty():
    result = query_ai_copilot(query="What are the top bugs?", submissions=[])
    assert result["query"] == "What are the top bugs?"
    assert "no feedback submissions" in result["answer_markdown"].lower()
    assert len(result["suggested_followups"]) > 0
    assert result["referenced_feedbacks"] == []


def test_query_ai_copilot_critical_blocker():
    subs = [
        make_dummy_submission("Stripe checkout hangs on submission", "Payment modal is stuck forever on credit card confirmation", "critical"),
        make_dummy_submission("Typo on landing page header", "The subheadline has a spelling error", "low"),
    ]
    result = query_ai_copilot(query="Why is checkout failing?", submissions=subs, campaign_title="SaaS Launch Beta")
    assert "checkout" in result["answer_markdown"].lower() or "stripe" in result["answer_markdown"].lower()
    assert len(result["referenced_feedbacks"]) >= 1
    assert result["referenced_feedbacks"][0]["title"] == "Stripe checkout hangs on submission"
    assert len(result["key_takeaways"]) > 0


def test_query_ai_copilot_readiness_verdict():
    subs = [
        make_dummy_submission("Minor CSS padding alignment on mobile", "Small gap under navbar", "low"),
    ]
    result = query_ai_copilot(query="Is the app ready for release?", submissions=subs)
    assert "release readiness synthesis" in result["answer_markdown"].lower()
    assert len(result["suggested_followups"]) >= 2


def test_ai_engine_status_and_free_tier():
    from app.services.llm_gateway import get_ai_engine_status
    status = get_ai_engine_status()
    assert status["subscription_required"] is False
    assert status["free_tier_available"] is True
    assert "aistudio.google.com" in status["free_tier_provider_url"]


def test_query_ai_copilot_with_gemini_mock(monkeypatch):
    from app.services import ai_copilot

    monkeypatch.setattr(ai_copilot, "is_gemini_configured", lambda: True)
    monkeypatch.setattr(ai_copilot, "generate_text_with_gemini", lambda *args, **kwargs: "### Gemini Live Synthesis\n\nAll checkout paths are unblocked.")

    subs = [
        make_dummy_submission("Stripe checkout hangs on submission", "Payment modal is stuck", "critical"),
    ]
    result = query_ai_copilot(query="Synthesize latest feedback", submissions=subs)
    assert "gemini live synthesis" in result["answer_markdown"].lower()
    assert "Google Gemini 1.5 Flash" in result["key_takeaways"][0]

