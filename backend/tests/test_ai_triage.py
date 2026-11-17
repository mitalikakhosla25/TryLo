"""Automated Tests for AI Bug Triaging, Duplicate Detection & Developer Ticket Synthesis."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.models.user import User
from app.services.ai_triage import analyze_feedback_item, synthesize_batch_feedback_insights


def create_submission(title: str, desc: str, steps: str = "", severity: str = "medium", video_url: str = None) -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.campaign_id = uuid.uuid4()
    sub.tester_id = uuid.uuid4()
    sub.title = title
    sub.description = desc
    sub.reproduction_steps = steps
    sub.actual_behavior = "Failure observed in workflow"
    sub.expected_behavior = "Success expected in workflow"
    sub.severity = severity
    sub.feedback_type = "bug"
    sub.status = "submitted"
    sub.video_url = video_url
    tester = User()
    tester.id = sub.tester_id
    tester.full_name = "Rohan Sharma"
    tester.email = "rohan@trylo.io"
    sub.tester = tester
    return sub


def test_ai_bug_triaging_and_duplicate_detection():
    existing_bug = create_submission(
        title="Checkout modal freezes on credit card submission",
        desc="When entering credit card details in checkout modal, the submit spinner spins indefinitely.",
        severity="critical",
    )

    target_bug = create_submission(
        title="Checkout modal hangs on card submission",
        desc="Card details entered, clicked pay button, nothing happens and modal is stuck.",
        steps="1. Add item to cart\n2. Open checkout\n3. Click Pay with Card",
        severity="critical",
        video_url="/api/feedback/videos/test.webm",
    )
    target_bug.timestamped_notes = [{"timestamp_seconds": 15, "timestamp_display": "0:15", "note": "Spinner stuck"}]

    all_subs = [existing_bug, target_bug]

    triage_data = analyze_feedback_item(target_bug, all_subs)

    assert "root_cause_hypothesis" in triage_data
    assert "suggested_fix" in triage_data
    assert "fix_complexity" in triage_data
    assert "friction_score" in triage_data
    assert triage_data["friction_score"] >= 8
    assert "potential_duplicates" in triage_data

    # Verify duplicate detection
    duplicates = triage_data["potential_duplicates"]
    assert len(duplicates) >= 1
    assert duplicates[0]["title"] == existing_bug.title
    assert duplicates[0]["similarity_score"] >= 40

    # Verify Dev Ticket Markdown
    dev_ticket = triage_data["dev_ticket_markdown"]
    assert "### [Bug]:" in dev_ticket
    assert "CRITICAL" in dev_ticket
    assert "Screen Recording Proof" in dev_ticket
    assert "0:15" in dev_ticket
    assert "Suggested Fix" in dev_ticket


def test_ai_batch_synthesis_and_financial_risk():
    subs = [
        create_submission("Payment checkout modal freezes", "Stuck on card charge", severity="critical"),
        create_submission("Stripe element fails to mount", "Blank card input", severity="high"),
        create_submission("Typo in FAQ footer", "Minor spelling", severity="low"),
    ]

    synthesis = synthesize_batch_feedback_insights(subs, campaign_title="FinTech MVP")

    assert synthesis["total_reports_analyzed"] == 3
    assert synthesis["critical_bugs_count"] == 1
    assert synthesis["release_readiness_score"] < 80
    assert "BLOCKING" in synthesis["release_readiness_verdict"]

    blocker = synthesis["single_most_critical_blocker"]
    assert "payment" in blocker["headline"].lower() or "checkout" in blocker["headline"].lower()
    assert blocker["revenue_at_risk_monthly"] is not None
    assert blocker["churn_risk_percentage"] is not None
    assert blocker["git_diff_patch"] is not None
    assert "diff" in blocker["git_diff_patch"] or "---" in blocker["git_diff_patch"]
