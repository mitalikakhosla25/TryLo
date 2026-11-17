"""Unit tests for TryLo AI User Journey Funnel & Drop-Off Reconstruction."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.services.ai_funnel import reconstruct_user_journey_funnel


def make_submission(title: str, desc: str, severity: str = "medium") -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.campaign_id = uuid.uuid4()
    sub.tester_id = uuid.uuid4()
    sub.title = title
    sub.description = desc
    sub.severity = severity
    sub.feedback_type = "bug"
    return sub


def test_reconstruct_user_journey_funnel_empty():
    res = reconstruct_user_journey_funnel(submissions=[], campaign_title="Empty Beta")
    assert res["overall_funnel_efficiency_score"] > 0
    assert len(res["stages"]) == 5
    assert res["stages"][0]["stage_id"] == "discovery"
    assert res["stages"][4]["stage_id"] == "checkout"


def test_reconstruct_user_journey_funnel_with_checkout_critical_bottleneck():
    subs = [
        make_submission("Checkout payment modal spins forever", "Cannot enter credit card", "critical"),
        make_submission("Stripe webhook 500 error on charge", "Payment failure", "high"),
        make_submission("Minor padding issue on landing page hero", "CSS spacing", "low"),
    ]

    res = reconstruct_user_journey_funnel(submissions=subs, campaign_title="SaaS Checkout Beta")
    assert len(res["stages"]) == 5
    checkout_stage = next(s for s in res["stages"] if s["stage_id"] == "checkout")
    assert checkout_stage["status"] == "critical_bottleneck"
    assert checkout_stage["reported_defects_count"] >= 2
    assert "Monetization & Checkout" in res["critical_drop_off_stage"]
    assert "bottleneck" in res["executive_funnel_takeaway"].lower()
