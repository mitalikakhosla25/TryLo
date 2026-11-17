"""TryLo AI Automated Bug Triaging, Duplicate Detection & Dev Ticket Synthesis Service.

Analyzes feedback submissions, deduces likely root causes, estimates fix complexity,
identifies duplicate bug reports across the campaign, and generates ready-to-paste
developer tickets formatted for GitHub Issues and Linear.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.feedback import FeedbackSubmission
from app.models.user import User


TECHNICAL_PATTERNS = [
    {
        "keywords": ["freeze", "hang", "unresponsive", "stuck", "infinite loop", "spinner"],
        "root_cause": "Unhandled async Promise loop or blocking thread in main UI rendering cycle",
        "suggested_fix": "Audit useEffect / reactive subscriptions for missing dependency arrays or unhandled reject cases; ensure loading state resets on error.",
        "tags": ["Frontend", "State Machine", "UI Thread", "Async"],
        "complexity": "Medium (half-day)",
        "base_friction": 9,
        "default_sentiment": "frustrated",
    },
    {
        "keywords": ["crash", "white screen", "blank", "uncaught", "typeerror", "cannot read property", "undefined"],
        "root_cause": "Uncaught Null/Undefined Reference in client-side component lifecycle",
        "suggested_fix": "Add optional chaining (?.) and wrap critical data access in React ErrorBoundary or fallback guards with schema validation.",
        "tags": ["Frontend", "Exception Guard", "Null Safety", "React"],
        "complexity": "Low (1-2 hrs)",
        "base_friction": 9,
        "default_sentiment": "frustrated",
    },
    {
        "keywords": ["timeout", "504", "502", "bad gateway", "network", "slow", "failed to fetch", "econnrefused"],
        "root_cause": "API Gateway connection drop, downstream worker timeout, or unreachable upstream service",
        "suggested_fix": "Verify reverse proxy routing, increase worker timeout or implement exponential backoff retry with user-friendly retry buttons.",
        "tags": ["Backend", "Gateway", "Network", "Resilience"],
        "complexity": "Medium (half-day)",
        "base_friction": 8,
        "default_sentiment": "frustrated",
    },
    {
        "keywords": ["login", "token", "401", "403", "unauthorized", "forbidden", "logged out", "cookie", "session"],
        "root_cause": "Authentication token expiration or CORS / SameSite cookie transmission mismatch",
        "suggested_fix": "Inspect token refresh cycle, cookie SameSite=Lax/None credentials flag, and API role authorization middleware.",
        "tags": ["Security", "Auth", "JWT", "Session"],
        "complexity": "Medium (half-day)",
        "base_friction": 8,
        "default_sentiment": "frustrated",
    },
    {
        "keywords": ["button", "click", "tap", "modal", "overlay", "dropdown", "z-index", "behind", "invisible"],
        "root_cause": "CSS Stacking Context or pointer-events interception by overlapping backdrop",
        "suggested_fix": "Inspect z-index hierarchy, portal modal overlays to document body, and check pointer-events: none on passive wrappers.",
        "tags": ["UI/UX", "CSS", "Stacking Context", "Interactivity"],
        "complexity": "Low (1-2 hrs)",
        "base_friction": 7,
        "default_sentiment": "confused",
    },
    {
        "keywords": ["mobile", "safari", "ios", "iphone", "android", "responsive", "overflow", "scroll", "viewport"],
        "root_cause": "Viewport calculation or WebKit-specific touch/CSS layout rendering divergence",
        "suggested_fix": "Test with 100dvh instead of 100vh, verify touch-action and -webkit-overflow-scrolling behavior.",
        "tags": ["Mobile", "Cross-Browser", "WebKit", "Responsive"],
        "complexity": "Medium (half-day)",
        "base_friction": 6,
        "default_sentiment": "confused",
    },
    {
        "keywords": ["payment", "stripe", "checkout", "card", "billing", "invoice", "price"],
        "root_cause": "Payment gateway client-side element initialization or webhook idempotency mismatch",
        "suggested_fix": "Verify Stripe public key configuration, element mount lifecycle, and server-side payment intent confirmation handler.",
        "tags": ["Billing", "Stripe API", "Monetization", "Critical Flow"],
        "complexity": "High (1-2 days)",
        "base_friction": 10,
        "default_sentiment": "frustrated",
    },
    {
        "keywords": ["confusing", "unclear", "hard to find", "where is", "expected", "intuitive", "navigation"],
        "root_cause": "Information architecture mismatch and low discoverability in primary user journey",
        "suggested_fix": "Add contextual empty-state guidance, streamline primary CTA prominence, and conduct user onboarding tooltip walkthrough.",
        "tags": ["UX", "Discoverability", "Information Architecture"],
        "complexity": "Low (1-2 hrs)",
        "base_friction": 4,
        "default_sentiment": "constructive",
    },
]


def extract_keywords(text: str) -> set[str]:
    """Extract lowercased alphanumeric word tokens."""
    return set(re.findall(r"[a-z0-9_]{3,}", text.lower()))


def calculate_text_similarity(tokens1: set[str], tokens2: set[str]) -> float:
    """Compute Jaccard similarity index between token sets."""
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union) if union else 0.0


def analyze_feedback_item(
    feedback: FeedbackSubmission,
    all_campaign_feedback: List[FeedbackSubmission],
) -> Dict[str, Any]:
    """
    Execute AI heuristic triaging, root cause analysis, duplicate detection,
    and developer ticket markdown synthesis.
    """
    corpus = " ".join([
        feedback.title or "",
        feedback.description or "",
        feedback.reproduction_steps or "",
        feedback.actual_behavior or "",
        feedback.expected_behavior or "",
        " ".join(n.get("note", "") for n in (feedback.timestamped_notes or []))
    ]).lower()

    tokens = extract_keywords(corpus)
    title_tokens = extract_keywords(feedback.title or "")

    # 1. Match Root Cause & Technical Patterns
    best_pattern = None
    best_score = 0
    for pat in TECHNICAL_PATTERNS:
        match_count = sum(1 for kw in pat["keywords"] if kw in corpus)
        if match_count > best_score:
            best_score = match_count
            best_pattern = pat

    if best_pattern and best_score > 0:
        root_cause = best_pattern["root_cause"]
        suggested_fix = best_pattern["suggested_fix"]
        tags = list(best_pattern["tags"])
        complexity = best_pattern["complexity"]
        base_friction = best_pattern["base_friction"]
        sentiment = best_pattern["default_sentiment"]
    else:
        root_cause = "Edge case logic divergence or unhandled boundary state in application workflow"
        suggested_fix = "Review state transitions in the affected component and verify test coverage for missing edge branches."
        tags = ["General Bug", "Logic Flow"]
        complexity = "Medium (half-day)"
        base_friction = 5
        sentiment = "neutral"

    # Adjust friction based on severity
    if feedback.severity == "critical":
        friction_score = min(10, max(base_friction, 9))
        sentiment = "frustrated"
    elif feedback.severity == "high":
        friction_score = min(10, max(base_friction, 7))
    elif feedback.severity == "low":
        friction_score = max(2, min(base_friction, 4))
        sentiment = "constructive" if sentiment == "neutral" else sentiment
    else:
        friction_score = base_friction

    # 2. Duplicate Detection (Weighted Title Overlap + Body Overlap + Context)
    potential_duplicates: List[Dict[str, Any]] = []
    for other in all_campaign_feedback:
        if str(other.id) == str(feedback.id):
            continue

        other_title_tokens = extract_keywords(other.title or "")
        other_corpus = " ".join([
            other.title or "",
            other.description or "",
            other.reproduction_steps or "",
        ]).lower()
        other_tokens = extract_keywords(other_corpus)

        title_sim = calculate_text_similarity(title_tokens, other_title_tokens)
        body_sim = calculate_text_similarity(tokens, other_tokens)

        # Weighted combination: 55% title similarity + 45% body similarity
        sim = (0.55 * title_sim) + (0.45 * body_sim)

        # Context bonuses
        if feedback.severity and other.severity and feedback.severity == other.severity:
            sim += 0.10
        if feedback.task_id and other.task_id and feedback.task_id == other.task_id:
            sim += 0.15

        score_pct = int(min(98, round(sim * 100)))

        # Threshold for duplicate candidate is 25%
        if score_pct >= 25:
            tester_name = other.tester.full_name if other.tester else "Tester"
            potential_duplicates.append({
                "id": str(other.id),
                "title": other.title,
                "similarity_score": score_pct,
                "severity": other.severity,
                "status": other.status,
                "tester_name": tester_name,
                "created_at": other.created_at.isoformat() if other.created_at else datetime.now(timezone.utc).isoformat(),
            })

    # Sort duplicates by descending similarity score
    potential_duplicates.sort(key=lambda d: d["similarity_score"], reverse=True)
    potential_duplicates = potential_duplicates[:5]

    # 3. Generate Ready-to-Paste Developer Ticket Markdown (Clean ASCII, no decorative emojis)
    repro = feedback.reproduction_steps.strip() if feedback.reproduction_steps else "1. Launch application\n2. Navigate to affected area\n3. Execute action"
    expected = feedback.expected_behavior.strip() if feedback.expected_behavior else "Action completes smoothly without errors."
    actual = feedback.actual_behavior.strip() if feedback.actual_behavior else feedback.description.strip()
    sev = (feedback.severity or "medium").upper()
    tags_formatted = " ".join(f"`{t}`" for t in tags)

    video_proof_md = ""
    if feedback.video_url:
        notes_summary = ""
        if feedback.timestamped_notes:
            notes_summary = "\n**Reproduction Timestamps:**\n" + "\n".join(
                f"- **{n.get('timestamp_display', '0:00')}**: {n.get('note', '')}"
                for n in feedback.timestamped_notes
            )
        video_proof_md = f"\n**Screen Recording Proof:** [Watch Recording]({feedback.video_url}){notes_summary}\n"

    ticket_md = f"""### [Bug]: {feedback.title}

**Reported via TryLo Product Testing**
- **Severity**: `{sev}`
- **Suspected Root Cause**: {root_cause}
- **Estimated Complexity**: `{complexity}`
- **User Friction Score**: `{friction_score}/10` ({sentiment.capitalize()})
{video_proof_md}
---

#### Steps to Reproduce
{repro}

#### Expected Behavior
{expected}

#### Actual Behavior
{actual}

#### Suggested Fix
> {suggested_fix}

#### Technical Tags
{tags_formatted}
"""

    return {
        "root_cause_hypothesis": root_cause,
        "fix_complexity": complexity,
        "suggested_fix": suggested_fix,
        "technical_tags": tags,
        "sentiment_label": sentiment,
        "friction_score": friction_score,
        "potential_duplicates": potential_duplicates,
        "dev_ticket_markdown": ticket_md.strip(),
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
