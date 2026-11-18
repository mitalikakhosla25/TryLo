"""Tests for TryLo AI Tester Proof Attestation & Anti-Fraud Sentinel Service."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.models.campaign import Campaign
from app.services.ai_proof_sentinel import audit_tester_proof_and_fraud


def test_audit_tester_proof_high_quality_human():
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.title = "Stripe multi-currency checkout modal race condition on credit card input"
    sub.description = (
        "When attempting to checkout with an Indian credit card in USD currency, the processing modal hangs "
        "indefinitely without rendering payment error response or success confirmation toast."
    )
    sub.reproduction_steps = (
        "1. Add item to cart\n2. Change currency to USD\n3. Click proceed to checkout\n"
        "4. Fill out test card credentials and submit form"
    )
    sub.expected_behavior = "Card payment confirms in 2 seconds or shows clear validation decline."
    sub.actual_behavior = "Screen stays locked on spinning loader; console emits 409 conflict error."
    sub.video_url = "https://cdn.trylo.io/recordings/test12345.webm"
    sub.video_duration_seconds = 45
    sub.device_info = {
        "browser": "Chrome 122.0",
        "os": "macOS Sonoma",
        "screen_resolution": "1920x1080",
    }
    sub.timestamped_notes = [
        {"id": "n1", "timestamp_seconds": 12, "note": "Filled card details"},
        {"id": "n2", "timestamp_seconds": 35, "note": "Spinning loader freeze"},
    ]

    camp = Campaign()
    camp.title = "SaaS Storefront Checkout Beta"

    res = audit_tester_proof_and_fraud(sub, camp)

    assert res["feedback_id"] == sub.id
    assert res["overall_trust_score"] >= 80
    assert res["fraud_risk"] == "low"
    assert res["payout_status"] == "approve"
    assert "Approve Full Bounty" in res["payout_recommendation"]
    assert len(res["attestation_badges"]) == 4
    assert any(b["id"] == "telemetry_human" and b["status"] == "pass" for b in res["attestation_badges"])
    assert any(b["id"] == "task_adherence" and b["status"] == "pass" for b in res["attestation_badges"])


def test_audit_tester_proof_low_effort_bot():
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.title = "bad button"
    sub.description = "it broke"
    sub.reproduction_steps = ""
    sub.expected_behavior = ""
    sub.actual_behavior = ""
    sub.video_url = None
    sub.video_duration_seconds = 0
    sub.device_info = {}
    sub.timestamped_notes = []

    res = audit_tester_proof_and_fraud(sub)

    assert res["overall_trust_score"] < 60
    assert res["payout_status"] in ["hold", "reject"]
    assert any(b["id"] == "telemetry_human" and b["status"] in ["warn", "fail"] for b in res["attestation_badges"])


def test_audit_tester_proof_gemini_mock(monkeypatch):
    from app.services import ai_proof_sentinel

    monkeypatch.setattr(ai_proof_sentinel, "is_gemini_configured", lambda: True)
    mock_json = """{
      "compliance_score": 95,
      "human_interaction_score": 90,
      "overall_trust_score": 92,
      "fraud_risk": "low",
      "trust_tier": "Tier 1 Verified Human Tester",
      "payout_recommendation": "Approve Full Bounty ($25.00)",
      "payout_status": "approve",
      "sentinel_audit_summary": "Authentic tester with complete reproduction steps and natural keystroke telemetry.",
      "attestation_badges": [
        {"id": "telemetry_human", "label": "Human Telemetry Signature", "status": "pass", "explanation": "Natural mouse trajectory"},
        {"id": "task_adherence", "label": "Campaign Task Compliance", "status": "pass", "explanation": "Met 100% criteria"}
      ]
    }"""
    monkeypatch.setattr(ai_proof_sentinel, "generate_text_with_gemini", lambda *args, **kwargs: mock_json)

    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.title = "Verified issue"
    sub.description = "Detailed report"

    res = audit_tester_proof_and_fraud(sub)
    assert res["overall_trust_score"] == 92
    assert "Google Gemini 1.5 Flash" in res["engine_used"]
    assert res["payout_status"] == "approve"
