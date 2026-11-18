"""Tests for TryLo AI Feedback Quality Meter & Auto-Polisher Service."""

from app.services.ai_feedback_polisher import evaluate_feedback_quality, polish_feedback_report


def test_evaluate_feedback_quality_vague_draft():
    res = evaluate_feedback_quality(
        title="broken",
        description="it fails",
        reproduction_steps=None,
        expected_behavior=None,
        actual_behavior=None,
        has_video=False,
        feedback_type="bug_report",
    )
    assert res["score"] < 50
    assert res["quality_tier"] == "needs_detail"
    assert len(res["tips"]) > 0
    passed_criteria = [c for c in res["checklist"] if c["passed"]]
    assert len(passed_criteria) <= 1


def test_evaluate_feedback_quality_five_star_report():
    res = evaluate_feedback_quality(
        title="Checkout payment modal hangs on credit card submission",
        description="During the checkout flow in Chrome 122 on macOS Sonoma, clicking submit causes an infinite spinner.",
        reproduction_steps="1. Add item to cart\n2. Navigate to /checkout\n3. Enter valid test card\n4. Click Pay Now",
        expected_behavior="Order confirmation page should appear with receipt details.",
        actual_behavior="Spinner runs forever and console shows unhandled promise rejection.",
        has_video=True,
        feedback_type="bug_report",
    )
    assert res["score"] >= 80
    assert res["quality_tier"] == "stellar"
    assert res["summary_label"] == "Founder-Ready (5-Star)"
    assert len(res["tips"]) == 0


def test_polish_feedback_report_heuristic():
    res = polish_feedback_report(
        title="checkout stuck",
        description="i put my card in and the spinner never stopped when i clicked buy",
        feedback_type="bug_report",
    )
    assert "checkout" in res["polished_title"].lower()
    assert "1." in res["polished_reproduction_steps"]
    assert len(res["polished_expected_behavior"]) > 0
    assert len(res["polished_actual_behavior"]) > 0
    assert res["suggested_severity"] in ["high", "critical", "medium"]


def test_polish_feedback_report_gemini_mock(monkeypatch):
    from app.services import ai_feedback_polisher

    monkeypatch.setattr(ai_feedback_polisher, "is_gemini_configured", lambda: True)
    mock_llm_output = """POLISHED_TITLE: Stripe Checkout Modal Hangs on Card Confirmation
POLISHED_DESCRIPTION: The payment modal freezes with an unhandled 500 error when submitting card credentials.
POLISHED_STEPS:
1. Navigate to checkout page
2. Enter credit card number
3. Click Complete Purchase
POLISHED_EXPECTED: Transaction resolves with success receipt
POLISHED_ACTUAL: Spinner freezes indefinitely
SUGGESTED_SEVERITY: critical"""
    monkeypatch.setattr(ai_feedback_polisher, "generate_text_with_gemini", lambda *args, **kwargs: mock_llm_output)

    res = polish_feedback_report(
        title="stripe hangs",
        description="spinner freezes",
        feedback_type="bug_report",
    )
    assert res["polished_title"] == "Stripe Checkout Modal Hangs on Card Confirmation"
    assert res["suggested_severity"] == "critical"
    assert res["engine_used"] == "Google Gemini 1.5 Flash"
