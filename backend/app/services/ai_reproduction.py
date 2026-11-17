"""TryLo Autonomous Bug Reproduction Service.

Ingests bug reports, tester telemetry, and reproduction steps to auto-generate
executable, production-ready Playwright and Cypress end-to-end (E2E) test scripts.
Enables founders to replicate reported defects locally in headless/headed browsers with 1 click.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from app.models.feedback import FeedbackSubmission


def _sanitize_step_description(step: str) -> str:
    """Strip leading numbers and bullets from step text."""
    return re.sub(r"^\s*(\d+[\.\)]|[-*•])\s*", "", step).strip()


def _deduce_action_from_step(step_text: str, index: int) -> Dict[str, str]:
    """Convert natural language step into a typed test action."""
    s = step_text.lower()
    clean = _sanitize_step_description(step_text)

    # Click actions
    if any(k in s for k in ["click", "tap", "press", "select", "choose"]):
        target = "button"
        if "checkout" in s or "pay" in s:
            target = "button:has-text('Checkout'), button:has-text('Pay'), [data-testid='checkout-button']"
        elif "submit" in s:
            target = "button[type='submit'], button:has-text('Submit')"
        elif "login" in s or "sign in" in s:
            target = "button:has-text('Log In'), button:has-text('Sign In')"
        elif "add to cart" in s or "cart" in s:
            target = "button:has-text('Add to Cart'), [data-testid='add-to-cart']"
        elif "menu" in s or "nav" in s:
            target = "[aria-label='Menu'], nav button"
        else:
            # Extract quoted words if any
            quotes = re.findall(r"['\"]([^'\"]+)['\"]", clean)
            if quotes:
                target = f"button:has-text('{quotes[0]}'), text='{quotes[0]}'"
            else:
                target = f"text='{clean[:30]}'"

        return {
            "type": "click",
            "comment": f"Step {index + 1}: {clean}",
            "playwright": f"await page.locator(\"{target}\").first().click();",
            "cypress": f"cy.get(\"{target}\").first().click();",
        }

    # Input / fill actions
    if any(k in s for k in ["enter", "type", "fill", "input", "write"]):
        field = "input"
        val = "test_value"
        if "email" in s:
            field = "input[type='email'], input[name='email']"
            val = "tester@trylo.io"
        elif "password" in s:
            field = "input[type='password'], input[name='password']"
            val = "Password123!"
        elif "card" in s or "credit" in s:
            field = "input[name='cardnumber'], input[autocomplete='cc-number']"
            val = "4242424242424242"
        elif "search" in s:
            field = "input[type='search'], [placeholder*='Search']"
            val = "test query"
        else:
            field = "input[type='text']:visible"

        return {
            "type": "fill",
            "comment": f"Step {index + 1}: {clean}",
            "playwright": f"await page.locator(\"{field}\").first().fill(\"{val}\");",
            "cypress": f"cy.get(\"{field}\").first().type(\"{val}\");",
        }

    # Navigation actions
    if any(k in s for k in ["navigate", "open", "go to", "visit", "launch"]):
        path = "/"
        if "checkout" in s:
            path = "/checkout"
        elif "login" in s:
            path = "/login"
        elif "dashboard" in s:
            path = "/dashboard"

        return {
            "type": "navigate",
            "comment": f"Step {index + 1}: {clean}",
            "playwright": f"await page.goto(baseURL + '{path}');",
            "cypress": f"cy.visit('{path}');",
        }

    # Default action
    return {
        "type": "action",
        "comment": f"Step {index + 1}: {clean}",
        "playwright": f"// Note: {clean}\n    await page.waitForTimeout(500);",
        "cypress": f"// Note: {clean}\n    cy.wait(500);",
    }


def generate_e2e_reproduction_script(
    feedback: FeedbackSubmission,
    framework: str = "playwright",
    target_base_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate runnable Playwright or Cypress E2E test script from feedback data."""
    clean_framework = "cypress" if framework.lower() == "cypress" else "playwright"
    base_url = target_base_url or "http://localhost:5173"

    # Extract reproduction steps
    raw_steps = feedback.reproduction_steps or ""
    step_lines = [line.strip() for line in raw_steps.splitlines() if line.strip()]

    if not step_lines:
        step_lines = [
            f"1. Navigate to {base_url}",
            f"2. Execute action leading to: {feedback.title or 'reported defect'}",
            "3. Observe failure state",
        ]

    actions = [_deduce_action_from_step(s, idx) for idx, s in enumerate(step_lines)]

    title_safe = re.sub(r"[^a-zA-Z0-9_-]", "_", (feedback.title or "bug_reproduction")[:40]).lower()
    safe_title = (feedback.title or "Defect Reproduction").replace('"', '\\"')
    expected_desc = (feedback.expected_behavior or "Action completes successfully without errors").replace('"', '\\"')
    actual_desc = (feedback.actual_behavior or feedback.description or "Unexpected failure occurred").replace('"', '\\"')

    if clean_framework == "playwright":
        filename = f"reproduce_{title_safe}.spec.ts"

        # Build Playwright script
        action_code = "\n    ".join([
            f"// {a['comment']}\n    {a['playwright']}" for a in actions
        ])

        script_code = f"""import {{ test, expect }} from '@playwright/test';

/**
 * TryLo Autonomous Bug Reproduction Script
 * Target Defect: "{safe_title}"
 * Feedback ID: {feedback.id}
 * Severity: {(feedback.severity or 'medium').upper()}
 *
 * Expected Behavior: {expected_desc}
 * Actual Behavior:   {actual_desc}
 */

test.describe('Automated Defect Reproduction', () => {{
  const baseURL = process.env.TARGET_URL || '{base_url}';

  test.beforeEach(async ({{ page }}) => {{
    // Set desktop standard viewport (adjust to mobile if testing responsive layouts)
    await page.setViewportSize({{ width: 1280, height: 720 }});
    // Listen for uncaught client-side console errors
    page.on('console', (msg) => {{
      if (msg.type() === 'error') {{
        console.error(`[Browser Console Error]: ${{msg.text()}}`);
      }}
    }});
  }});

  test('reproduce: {safe_title}', async ({{ page }}) => {{
    // 1. Initial Navigation
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // 2. Execute Tester Reproduction Sequence
    {action_code}

    // 3. Automated Failure Assertions
    // Verifies whether the reported failure state occurs
    await page.waitForTimeout(1000);

    // Check that expected behavior is NOT satisfied (reproducing the bug)
    // When the bug is fixed, update this assertion to expect success:
    const errorBanner = page.locator('text=/{re.escape(actual_desc[:30])}|error|failed|timeout/i').first();
    const isErrorVisible = await errorBanner.isVisible().catch(() => false);

    console.log(`[Reproduction Verdict]: Defect state observed = ${{isErrorVisible}}`);
    expect(isErrorVisible, 'Defect reproduced: failure state detected').toBe(true);
  }});
}});
"""
        cli_cmd = f"npx playwright test tests/{filename} --headed"
        setup = (
            "# Install Playwright test runner and headless browsers\n"
            "npm install -D @playwright/test\n"
            "npx playwright install\n\n"
            "# Run the reproduction test with visible browser\n"
            f"{cli_cmd}"
        )

    else:
        # Cypress
        filename = f"reproduce_{title_safe}.cy.ts"
        action_code = "\n    ".join([
            f"// {a['comment']}\n    {a['cypress']}" for a in actions
        ])

        script_code = f"""/**
 * TryLo Autonomous Bug Reproduction Script (Cypress)
 * Target Defect: "{safe_title}"
 * Feedback ID: {feedback.id}
 * Severity: {(feedback.severity or 'medium').upper()}
 */

describe('Automated Defect Reproduction: {safe_title}', () => {{
  beforeEach(() => {{
    cy.viewport(1280, 720);
  }});

  it('reproduces reported tester failure', () => {{
    // 1. Initial Visit
    cy.visit('{base_url}');

    // 2. Execute Tester Reproduction Sequence
    {action_code}

    // 3. Failure State Verification
    cy.wait(1000);
    cy.get('body').should('contain', '{actual_desc[:25]}');
  }});
}});
"""
        cli_cmd = f"npx cypress run --spec cypress/e2e/{filename} --headed"
        setup = (
            "# Install Cypress\n"
            "npm install -D cypress\n\n"
            "# Run reproduction script in Cypress\n"
            f"{cli_cmd}"
        )

    return {
        "feedback_id": feedback.id,
        "framework": clean_framework,
        "filename": filename,
        "test_script_code": script_code.strip(),
        "setup_instructions": setup.strip(),
        "cli_command": cli_cmd,
        "generated_at": datetime.now(timezone.utc),
    }

