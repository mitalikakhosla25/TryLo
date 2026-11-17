"""TryLo AI Retest & Quality Verification Protocol Service.

Synthesizes tailored quality control verification protocols and regression watchpoints
when founders mark reported defects for retesting. Prevents false-positive closures
and guarantees rigorous tester verification.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

from app.models.feedback import FeedbackSubmission


def generate_retest_protocol(feedback: FeedbackSubmission) -> Dict[str, Any]:
    """Generate structured retest verification protocol for reported bug."""
    title = feedback.title or "Reported Defect"
    actual = feedback.actual_behavior or feedback.description or "Reported malfunction"
    expected = feedback.expected_behavior or "Workflow completes cleanly without exceptions"
    sev = (feedback.severity or "medium").upper()

    t_lower = title.lower()
    is_payment = any(k in t_lower for k in ["stripe", "payment", "card", "checkout", "billing"])
    is_freeze = any(k in t_lower for k in ["freeze", "hang", "unresponsive", "spinner", "stuck"])
    is_auth = any(k in t_lower for k in ["login", "token", "auth", "session", "401", "403"])

    if is_payment:
        watchpoints = [
            "Verify that checkout modal dismisses cleanly if the user cancels.",
            "Confirm that double-clicking the pay button does not trigger duplicate charges.",
            "Verify that error notifications appear if an invalid card number is supplied.",
        ]
        steps = [
            "Clear local browser cache or test in Incognito window.",
            "Navigate to the checkout flow and select the target tier.",
            "Submit credit card details and confirm that payment intent resolves within 3 seconds.",
            "Verify receipt modal or order confirmation screen renders completely.",
        ]
    elif is_freeze:
        watchpoints = [
            "Check browser console to ensure zero infinite loop warnings or memory leaks.",
            "Test rapid consecutive clicks on interactive elements.",
            "Verify that state persists without requiring a hard manual refresh.",
        ]
        steps = [
            "Open browser developer tools (F12) to monitor Console and Network tabs.",
            "Navigate to the affected view and trigger the primary interactive action.",
            "Verify that UI controls remain responsive and the loading spinner dismisses on completion.",
        ]
    elif is_auth:
        watchpoints = [
            "Verify that expired tokens trigger a silent refresh or redirect to login.",
            "Confirm that user profile credentials load without 401 unauthorized errors.",
            "Test cross-tab session logout synchronization.",
        ]
        steps = [
            "Log out of active session and re-authenticate with credentials.",
            "Perform actions requiring founder/tester role privileges.",
            "Leave session idle for 5 minutes and verify that subsequent actions succeed seamlessly.",
        ]
    else:
        watchpoints = [
            "Verify adjacent navigation links and button hover states.",
            "Confirm mobile viewport layout remains aligned.",
            "Check for unhandled exceptions in browser telemetry.",
        ]
        steps = [
            "Follow the original reproduction steps outlined in the bug report.",
            "Verify that the defect state no longer occurs.",
            "Confirm that expected behavior is fully achieved.",
        ]

    retest_md = f"""### AI Retest Protocol: {title} (Severity: {sev})

#### Target Failure State
> {actual}

#### Expected Success Criteria
> {expected}

#### Verification Sequence
{chr(10).join(f"{idx+1}. {s}" for idx, s in enumerate(steps))}

#### Regression Watchpoints
{chr(10).join(f"- {w}" for w in watchpoints)}
"""

    return {
        "feedback_id": feedback.id,
        "title": title,
        "target_failure_condition": actual,
        "expected_resolution_state": expected,
        "regression_watchpoints": watchpoints,
        "verification_steps": steps,
        "retest_instructions_markdown": retest_md.strip(),
        "generated_at": datetime.now(timezone.utc),
    }

