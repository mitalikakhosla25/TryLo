"""Tests for TryLo AI Release Notes & Changelog Generator Service."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.services.ai_changelog import generate_release_changelog


def test_generate_release_changelog_heuristic():
    sub1 = FeedbackSubmission()
    sub1.id = uuid.uuid4()
    sub1.title = "Stripe checkout modal hangs on confirmation"
    sub1.feedback_type = "bug_report"
    sub1.severity = "critical"

    sub2 = FeedbackSubmission()
    sub2.id = uuid.uuid4()
    sub2.title = "Dashboard quick stats tooltip guidance"
    sub2.feedback_type = "general_feedback"
    sub2.severity = "low"

    res = generate_release_changelog(
        submissions=[sub1, sub2],
        campaign_title="SaaS Payment Beta",
        version_tag="v1.2.0",
    )
    assert res["version_tag"] == "v1.2.0"
    assert res["total_items_synthesized"] == 2
    assert "## Release v1.2.0" in res["github_markdown"]
    assert "Stripe checkout" in res["github_markdown"]
    assert "Shipped v1.2.0" in res["twitter_thread"]
    assert "What's New in v1.2.0" in res["product_hunt_blurb"]


def test_generate_release_changelog_gemini_mock(monkeypatch):
    from app.services import ai_changelog

    monkeypatch.setattr(ai_changelog, "is_gemini_configured", lambda: True)
    mock_llm_output = """GITHUB_MARKDOWN:
### Bug Fixes
- Fixed payment modal race condition
TWITTER_THREAD:
Shipped v1.2.0 with critical hotfixes!
PRODUCT_HUNT:
Super excited to release v1.2.0 based on tester reviews."""
    monkeypatch.setattr(ai_changelog, "generate_text_with_gemini", lambda *args, **kwargs: mock_llm_output)

    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.title = "Fixed payment modal race condition"
    sub.feedback_type = "bug_report"

    res = generate_release_changelog([sub], campaign_title="Launch", version_tag="v1.2.0")
    assert "Google Gemini 1.5 Flash" in res["engine_used"]
    assert "payment modal" in res["github_markdown"]
