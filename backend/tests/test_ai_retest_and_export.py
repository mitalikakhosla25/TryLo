"""Unit tests for AI Retest Protocol & 1-Click Sprint Backlog Exporter."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.models.user import User
from app.services.ai_retest import generate_retest_protocol
from app.services.ai_issue_exporter import export_issue_to_backlog


def make_feedback(title: str, desc: str, severity: str = "critical") -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.campaign_id = uuid.uuid4()
    sub.tester_id = uuid.uuid4()
    sub.title = title
    sub.description = desc
    sub.reproduction_steps = "1. Add item\n2. Open checkout\n3. Click pay"
    sub.expected_behavior = "Payment completes"
    sub.actual_behavior = "Modal hangs forever"
    sub.severity = severity
    sub.feedback_type = "bug"
    tester = User()
    tester.id = sub.tester_id
    tester.full_name = "Marcus Finch"
    sub.tester = tester
    return sub


def test_generate_retest_protocol():
    sub = make_feedback("Checkout modal hangs on submission", "Payment freeze")
    res = generate_retest_protocol(sub)

    assert res["feedback_id"] == sub.id
    assert len(res["verification_steps"]) >= 3
    assert len(res["regression_watchpoints"]) >= 2
    assert "Verification Sequence" in res["retest_instructions_markdown"]
    assert "Regression Watchpoints" in res["retest_instructions_markdown"]


def test_export_issue_to_backlog():
    sub = make_feedback("Stripe element crashes", "Uncaught TypeError")
    res = export_issue_to_backlog(sub, target_repo="trylo-org/core-saas")

    assert res["feedback_id"] == sub.id
    assert "https://github.com/trylo-org/core-saas/issues/new" in res["github_issue_url"]
    assert "bug" in res["labels"]
    assert "Linear Bug Report" in res["linear_markdown"] or "TryLo Bug Report" in res["linear_markdown"]
