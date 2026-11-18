"""Tests for TryLo Synthetic AI Tester Personas Service."""

import uuid
from app.models.campaign import Campaign
from app.services.ai_synthetic_testers import run_synthetic_persona_audit


def test_run_synthetic_persona_audit_heuristic():
    camp = Campaign()
    camp.id = uuid.uuid4()
    camp.title = "FinTech SaaS Webhook Gateway"
    camp.description = "Test our payment processing webhooks and checkout API integration."
    camp.tasks = [
        {"id": str(uuid.uuid4()), "title": "Connect Stripe Webhook", "order": 1},
        {"id": str(uuid.uuid4()), "title": "Simulate Checkout Charge", "order": 2},
        {"id": str(uuid.uuid4()), "title": "Verify Refund Idempotency", "order": 3},
    ]
    camp.target_audience = "FinTech Engineers & Product Managers"

    audit = run_synthetic_persona_audit(camp)
    assert audit["campaign_id"] == camp.id
    assert audit["campaign_title"] == "FinTech SaaS Webhook Gateway"
    assert 50 <= audit["readiness_score"] <= 100
    assert len(audit["personas"]) == 3

    persona_roles = [p["persona_role"] for p in audit["personas"]]
    assert any("First-Time" in r for r in persona_roles)
    assert any("Power User" in r for r in persona_roles)
    assert any("Accessibility" in r for r in persona_roles)

    for p in audit["personas"]:
        assert len(p["key_observations"]) > 0
        assert p["simulated_bug_report"] is not None
        assert p["simulated_bug_report"]["severity"] in ["low", "medium", "high", "critical"]
        assert len(p["actionable_recommendations"]) > 0


def test_run_synthetic_persona_audit_gemini_mock(monkeypatch):
    from app.services import ai_synthetic_testers

    monkeypatch.setattr(ai_synthetic_testers, "is_gemini_configured", lambda: True)
    mock_llm_response = (
        "EXECUTIVE_SUMMARY: Synthetic pre-flight audit indicates high conversion readiness with minor touch target warnings.\n"
        "SCORE: 86\n"
        "PERSONA_JORDAN: 88/100 | Clean onboarding | BUG: Minor padding shift on iPad (low)"
    )
    monkeypatch.setattr(ai_synthetic_testers, "generate_text_with_gemini", lambda *args, **kwargs: mock_llm_response)

    camp = Campaign()
    camp.id = uuid.uuid4()
    camp.title = "HealthTrack Telehealth"
    camp.description = "Video consultations between patients and doctors."
    camp.tasks = []

    audit = run_synthetic_persona_audit(camp)
    assert "Google Gemini 1.5 Flash" in audit["engine_used"]
    assert len(audit["personas"]) == 3

