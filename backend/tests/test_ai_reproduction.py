"""Unit tests for TryLo Autonomous Bug Reproduction Generator."""

import uuid
from app.models.feedback import FeedbackSubmission
from app.services.ai_reproduction import generate_e2e_reproduction_script


def make_test_submission(title: str, steps: str, expected: str, actual: str) -> FeedbackSubmission:
    sub = FeedbackSubmission()
    sub.id = uuid.uuid4()
    sub.campaign_id = uuid.uuid4()
    sub.tester_id = uuid.uuid4()
    sub.title = title
    sub.description = "Test description"
    sub.reproduction_steps = steps
    sub.expected_behavior = expected
    sub.actual_behavior = actual
    sub.severity = "critical"
    sub.feedback_type = "bug"
    return sub


def test_generate_playwright_e2e_script():
    steps = (
        "1. Open checkout page\n"
        "2. Enter credit card details\n"
        "3. Click Pay with Card button\n"
        "4. Observe infinite spinner"
    )
    sub = make_test_submission(
        title="Checkout modal hangs on card submission",
        steps=steps,
        expected="Success notification and receipt modal appear",
        actual="Modal freezes and submit spinner hangs forever",
    )

    result = generate_e2e_reproduction_script(
        feedback=sub,
        framework="playwright",
        target_base_url="https://app.trylo.io",
    )

    assert result["feedback_id"] == sub.id
    assert result["framework"] == "playwright"
    assert result["filename"].endswith(".spec.ts")
    assert "import { test, expect } from '@playwright/test'" in result["test_script_code"]
    assert "page.goto" in result["test_script_code"]
    assert "npx playwright test" in result["cli_command"]
    assert "npm install -D @playwright/test" in result["setup_instructions"]


def test_generate_cypress_e2e_script():
    sub = make_test_submission(
        title="Login button does not respond on mobile view",
        steps="1. Click login\n2. Enter email",
        expected="Redirects to dashboard",
        actual="No response on click",
    )

    result = generate_e2e_reproduction_script(
        feedback=sub,
        framework="cypress",
        target_base_url="https://app.trylo.io",
    )

    assert result["framework"] == "cypress"
    assert result["filename"].endswith(".cy.ts")
    assert "describe('Automated Defect Reproduction" in result["test_script_code"]
    assert "cy.visit" in result["test_script_code"]
    assert "npx cypress run" in result["cli_command"]

