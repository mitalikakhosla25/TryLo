"""Tests for TryLo Launch & Revenue ROI Simulator Service."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.services.ai_simulator import simulate_launch_readiness_and_roi


def make_dummy_sub(title: str, severity: str = "medium") -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.title = title
    sub.severity = severity
    sub.status = "submitted"
    return sub


def test_simulate_empty_submissions():
    res = simulate_launch_readiness_and_roi(submissions=[], simulated_resolved_ids=[])
    assert res["baseline_readiness_score"] == 100
    assert res["protected_revenue_monthly"] == 0
    assert res["verdict"] == "READY FOR RELEASE"


def test_simulate_what_if_resolves_critical_blocker():
    bug1 = make_dummy_sub("Stripe checkout payment crash", severity="critical")
    bug2 = make_dummy_sub("Login form credentials error", severity="high")
    bug3 = make_dummy_sub("Footer spacing misalignment", severity="low")

    subs = [bug1, bug2, bug3]

    # Baseline simulation
    base = simulate_launch_readiness_and_roi(submissions=subs, simulated_resolved_ids=[])
    assert base["baseline_readiness_score"] < 60
    assert base["verdict"] == "BLOCKING - DO NOT SHIP"
    assert base["baseline_revenue_risk_monthly"] >= 6000

    # What if we resolve the critical bug?
    sim = simulate_launch_readiness_and_roi(submissions=subs, simulated_resolved_ids=[bug1.id])
    assert sim["simulated_resolved_count"] == 1
    assert sim["remaining_open_count"] == 2
    assert sim["simulated_readiness_score"] > base["baseline_readiness_score"]
    assert sim["protected_revenue_monthly"] == 4200
    assert sim["churn_reduction_pct"] >= 20
    assert sim["highest_leverage_next_fix"]["id"] == bug2.id

