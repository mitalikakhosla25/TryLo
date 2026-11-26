"""TryLo AI Feedback Quality Meter & Auto-Polisher Service.

Evaluates tester feedback in real-time to compute a 0-100 quality score,
provides immediate actionable improvement tips, and offers a 1-click
AI Auto-Polisher that turns raw tester drafts into structured, engineer-ready
reproduction reports.
"""

import re
from typing import Dict, Any, List, Optional
from app.services.llm_gateway import is_gemini_configured, generate_text_with_gemini


def evaluate_feedback_quality(
    title: str,
    description: str,
    reproduction_steps: Optional[str] = None,
    expected_behavior: Optional[str] = None,
    actual_behavior: Optional[str] = None,
    has_video: bool = False,
    feedback_type: str = "bug_report",
) -> Dict[str, Any]:
    """Calculate quality score (0-100) and actionable tips for tester feedback."""
    clean_title = (title or "").strip()
    clean_desc = (description or "").strip()
    clean_steps = (reproduction_steps or "").strip()
    clean_exp = (expected_behavior or "").strip()
    clean_act = (actual_behavior or "").strip()

    score = 0
    checklist: List[Dict[str, Any]] = []
    tips: List[str] = []

    # 1. Title Assessment (up to 20 pts)
    title_score = 0
    if len(clean_title) >= 6:
        title_score += 10
    if len(clean_title) >= 15:
        title_score += 5
    component_keywords = [
        "page", "button", "modal", "checkout", "auth", "login", "signup",
        "nav", "form", "dropdown", "api", "table", "card", "mobile", "ios", "android"
    ]
    if any(k in clean_title.lower() for k in component_keywords):
        title_score += 5

    checklist.append({
        "criterion": "Descriptive Title",
        "passed": title_score >= 15,
        "points": min(title_score, 20),
        "hint": "Mention the specific component or action (e.g. 'Checkout modal fails to submit').",
    })
    score += min(title_score, 20)

    # 2. Detailed Description (up to 25 pts)
    desc_score = 0
    desc_len = len(clean_desc)
    if desc_len >= 20:
        desc_score += 10
    if desc_len >= 50:
        desc_score += 10
    if desc_len >= 100:
        desc_score += 5

    checklist.append({
        "criterion": "Clear Context & Description",
        "passed": desc_score >= 20,
        "points": min(desc_score, 25),
        "hint": "Provide environmental context (device, browser, or screen state).",
    })
    score += min(desc_score, 25)

    if feedback_type == "bug_report":
        # 3. Itemized Reproduction Steps (up to 25 pts)
        steps_score = 0
        numbered_steps = re.findall(r"(?:^\s*\d+[\.\)]\s*|^\s*[-*]\s*)", clean_steps, re.MULTILINE)
        if len(clean_steps) >= 15:
            steps_score += 10
        if len(numbered_steps) >= 2:
            steps_score += 10
        if len(numbered_steps) >= 3:
            steps_score += 5

        checklist.append({
            "criterion": "Step-by-Step Reproduction",
            "passed": steps_score >= 20,
            "points": min(steps_score, 25),
            "hint": "Number each step sequentially (e.g. '1. Open cart, 2. Click checkout').",
        })
        score += min(steps_score, 25)

        # 4. Expected vs. Actual Separation (up to 20 pts)
        exp_act_score = 0
        if len(clean_exp) >= 10:
            exp_act_score += 10
        if len(clean_act) >= 10:
            exp_act_score += 10

        checklist.append({
            "criterion": "Expected vs. Actual Outcome",
            "passed": exp_act_score >= 20,
            "points": min(exp_act_score, 20),
            "hint": "Contrast what you expected to see versus what actually happened.",
        })
        score += min(exp_act_score, 20)
    else:
        # General feedback weighting (45 pts redistributed)
        general_bonus = 0
        if desc_len >= 80:
            general_bonus += 25
        if desc_len >= 150:
            general_bonus += 20
        checklist.append({
            "criterion": "Actionable Usability Suggestions",
            "passed": general_bonus >= 25,
            "points": min(general_bonus, 45),
            "hint": "Elaborate on how the workflow felt and propose specific UX improvements.",
        })
        score += min(general_bonus, 45)

    # 5. Media & Proof Bonus (up to 10 pts)
    video_score = 10 if has_video else 0
    checklist.append({
        "criterion": "Screen Recording / Video Attached",
        "passed": has_video,
        "points": video_score,
        "hint": "Attach a screen recording to help founders see the exact glitch.",
    })
    score += video_score

    # Normalize total score to 100 max
    score = min(max(score, 5), 100)

    if score < 50:
        quality_tier = "needs_detail"
        summary_label = "Needs More Detail"
    elif score < 80:
        quality_tier = "good"
        summary_label = "Good Quality"
    else:
        quality_tier = "stellar"
        summary_label = "Founder-Ready (5-Star)"

    # Formulate quick tips
    for item in checklist:
        if not item["passed"]:
            tips.append(item["hint"])

    return {
        "score": score,
        "quality_tier": quality_tier,
        "summary_label": summary_label,
        "checklist": checklist,
        "tips": tips[:3],
    }


def polish_feedback_report(
    title: str,
    description: str,
    reproduction_steps: Optional[str] = None,
    expected_behavior: Optional[str] = None,
    actual_behavior: Optional[str] = None,
    feedback_type: str = "bug_report",
) -> Dict[str, Any]:
    """Polish raw, colloquial tester feedback into structured, engineer-ready documentation."""
    clean_title = (title or "").strip()
    clean_desc = (description or "").strip()
    clean_steps = (reproduction_steps or "").strip()
    clean_exp = (expected_behavior or "").strip()
    clean_act = (actual_behavior or "").strip()

    # If Gemini is configured, use live LLM for intelligent rewriting
    if is_gemini_configured() and (clean_desc or clean_title):
        prompt = f"""You are TryLo AI Tester Assistant. Polish the following raw tester feedback into a pristine, professional bug report:

Feedback Type: {feedback_type}
Raw Title: {clean_title}
Raw Description: {clean_desc}
Raw Reproduction Steps: {clean_steps}
Raw Expected: {clean_exp}
Raw Actual: {clean_act}

Please output in strictly this format:
POLISHED_TITLE: <crisp title with component and action>
POLISHED_DESCRIPTION: <clear technical description without jargon or slang>
POLISHED_STEPS:
1. <step 1>
2. <step 2>
3. <step 3>
POLISHED_EXPECTED: <what should happen>
POLISHED_ACTUAL: <what actually happens>
SUGGESTED_SEVERITY: <low|medium|high|critical>"""

        system_instruction = "You are a professional software QA engineer rewriting tester bug reports into clear, reproducible steps."
        response_text = generate_text_with_gemini(prompt, system_instruction=system_instruction)
        if response_text:
            parsed = _parse_llm_polished_response(response_text)
            if parsed:
                return parsed

    # Deterministic Heuristic Polisher fallback
    return _heuristic_polish_report(
        clean_title=clean_title,
        clean_desc=clean_desc,
        clean_steps=clean_steps,
        clean_exp=clean_exp,
        clean_act=clean_act,
        feedback_type=feedback_type,
    )


def _parse_llm_polished_response(text: str) -> Optional[Dict[str, Any]]:
    """Parse key-value format from LLM output safely."""
    try:
        title_m = re.search(r"POLISHED_TITLE:\s*(.+)", text)
        desc_m = re.search(r"POLISHED_DESCRIPTION:\s*([\s\S]+?)(?=POLISHED_STEPS:|$)", text)
        steps_m = re.search(r"POLISHED_STEPS:\s*([\s\S]+?)(?=POLISHED_EXPECTED:|$)", text)
        exp_m = re.search(r"POLISHED_EXPECTED:\s*(.+)", text)
        act_m = re.search(r"POLISHED_ACTUAL:\s*(.+)", text)
        sev_m = re.search(r"SUGGESTED_SEVERITY:\s*(low|medium|high|critical)", text, re.IGNORECASE)

        if title_m:
            return {
                "polished_title": title_m.group(1).strip(),
                "polished_description": desc_m.group(1).strip() if desc_m else "",
                "polished_reproduction_steps": steps_m.group(1).strip() if steps_m else "",
                "polished_expected_behavior": exp_m.group(1).strip() if exp_m else "",
                "polished_actual_behavior": act_m.group(1).strip() if act_m else "",
                "suggested_severity": sev_m.group(1).lower() if sev_m else "medium",
                "engine_used": "TryLo AI Engine",
            }
    except Exception:
        pass
    return None


def _heuristic_polish_report(
    clean_title: str,
    clean_desc: str,
    clean_steps: str,
    clean_exp: str,
    clean_act: str,
    feedback_type: str,
) -> Dict[str, Any]:
    """Deterministic NLP heuristic polisher for offline reliability."""
    combined_text = f"{clean_title} {clean_desc}".lower()

    # 1. Title polishing
    if not clean_title or len(clean_title) < 10:
        if "checkout" in combined_text or "stripe" in combined_text:
            polished_title = "Checkout payment flow fails during order finalization"
        elif "login" in combined_text or "auth" in combined_text:
            polished_title = "Authentication form error on credentials submission"
        elif "button" in combined_text or "click" in combined_text:
            polished_title = "Interactive button element becomes unclickable"
        else:
            polished_title = f"{clean_title.capitalize()} - Unexpected application behavior" if clean_title else "Observed functional defect during user flow"
    else:
        # Capitalize and strip trailing period
        polished_title = clean_title[0].upper() + clean_title[1:].rstrip(".")

    # 2. Reproduction Steps polishing
    if clean_steps and ("1." in clean_steps or "-" in clean_steps):
        polished_steps = clean_steps
    else:
        # Synthesize steps from raw text
        if "checkout" in combined_text or "payment" in combined_text:
            polished_steps = "1. Navigate to target workspace flow\n2. Add items to checkout cart\n3. Click confirmation payment button\n4. Observe failure trigger"
        elif "login" in combined_text:
            polished_steps = "1. Open authentication modal\n2. Enter tester user credentials\n3. Click Submit\n4. Observe error response banner"
        else:
            first_clause = clean_desc.split(".")[0] if clean_desc else "Initiate target feature"
            polished_steps = f"1. Open target screen in browser\n2. Trigger action: {first_clause.strip()}\n3. Inspect console logs and observe UI response"

    # 3. Expected & Actual
    if not clean_exp:
        polished_exp = "The user interaction should execute seamlessly and transition to the expected view state."
    else:
        polished_exp = clean_exp[0].upper() + clean_exp[1:].rstrip(".")

    if not clean_act:
        polished_act = clean_desc if clean_desc else "Application halts execution or displays unhandled error state."
    else:
        polished_act = clean_act[0].upper() + clean_act[1:].rstrip(".")

    # 4. Severity detection
    suggested_severity = "medium"
    if any(k in combined_text for k in ["crash", "500", "fatal", "freeze", "white screen", "hang"]):
        suggested_severity = "critical"
    elif any(k in combined_text for k in ["payment", "stripe", "data loss", "cannot submit", "blocked"]):
        suggested_severity = "high"
    elif any(k in combined_text for k in ["typo", "color", "padding", "alignment", "cosmetic"]):
        suggested_severity = "low"

    polished_desc = clean_desc if clean_desc else "Detailed telemetry captured during tester session."

    return {
        "polished_title": polished_title,
        "polished_description": polished_desc,
        "polished_reproduction_steps": polished_steps,
        "polished_expected_behavior": polished_exp,
        "polished_actual_behavior": polished_act,
        "suggested_severity": suggested_severity,
        "engine_used": "TryLo Local Heuristic Engine",
    }

