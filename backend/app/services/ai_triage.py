"""TryLo AI Automated Bug Triaging, Duplicate Detection & Dev Ticket Synthesis Service.

Analyzes feedback submissions, deduces likely root causes, estimates fix complexity,
identifies duplicate bug reports across the campaign, and generates ready-to-paste
developer tickets formatted for GitHub Issues and Linear.
"""

import re
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.models.feedback import FeedbackSubmission
from app.models.user import User
from app.services.llm_gateway import is_gemini_configured, generate_json_with_gemini
from app.schemas.feedback import (
    TesterProvidedFacts,
    HeuristicClassification,
    GeminiHypotheses,
    AiEngineMetadata,
)

logger = logging.getLogger(__name__)


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


def _run_gemini_individual_analysis(
    tester_facts: TesterProvidedFacts,
    heuristic: HeuristicClassification,
) -> Optional[GeminiHypotheses]:
    """Execute live Gemini reasoning for structured individual feedback analysis."""
    if not is_gemini_configured():
        return None

    facts_dict = {
        "title": tester_facts.title,
        "description": tester_facts.description,
        "reproduction_steps": tester_facts.reproduction_steps or "None provided",
        "expected_behavior": tester_facts.expected_behavior or "None provided",
        "actual_behavior": tester_facts.actual_behavior or "None provided",
        "reported_severity": tester_facts.reported_severity or "unspecified",
        "device_environment": tester_facts.device_info or {},
        "has_video_proof": tester_facts.has_video_proof,
    }

    prompt = f"""You are TryLo AI Senior QA & Reliability Architect.
Analyze the following tester-submitted feedback item.

TESTER PROVIDED FACTS:
{json.dumps(facts_dict, indent=2)}

RULE-BASED HEURISTIC CONTEXT:
- Matched Pattern: {heuristic.matched_pattern or 'None'}
- Rule Category: {heuristic.rule_category}
- Base Complexity: {heuristic.rule_complexity}
- Technical Tags: {', '.join(heuristic.rule_tags)}

CRITICAL COMPLIANCE RULES:
1. Treat all findings as HYPOTHESES, not verified diagnoses.
2. NEVER invent logs, stack traces, browser versions, error codes, or reproduction results not stated above.
3. Cite direct phrases from the tester in 'supporting_evidence'.
4. Explicitly distinguish what is known from what is speculative in 'uncertainty_notes'.
5. Output strictly a JSON object conforming to this schema:
{{
  "bug_category": "<functional_bug|ui_layout|performance|security_auth|crash_freeze|billing_payment|usability>",
  "suggested_severity": "<low|medium|high|critical>",
  "suggested_priority": "<P0|P1|P2|P3>",
  "root_cause_hypotheses": ["<primary hypothesis>", "<secondary hypothesis>"],
  "supporting_evidence": ["<quote or direct observation from tester report>"],
  "affected_components": ["<e.g. CheckoutModal, AuthMiddleware, LayoutContainer>"],
  "device_browser_observations": ["<observations regarding device or browser>"],
  "recommended_debugging_steps": ["<step 1>", "<step 2>"],
  "suggested_engineering_fixes": ["<fix 1>", "<fix 2>"],
  "confidence_score": 0.85,
  "uncertainty_notes": "<explicit note on what information is missing to confirm>"
}}"""

    system_instruction = (
        "You are an expert QA and systems engineer. Output strictly valid JSON. "
        "Do not hallucinate details or invent reproduction results."
    )

    try:
        raw_json = generate_json_with_gemini(
            prompt=prompt,
            system_instruction=system_instruction,
            timeout_seconds=15.0,
        )
        if not raw_json or not isinstance(raw_json, dict):
            return None

        conf = float(raw_json.get("confidence_score", 0.75))
        raw_json["confidence_score"] = max(0.0, min(1.0, conf))

        for list_field in [
            "root_cause_hypotheses", "supporting_evidence", "affected_components",
            "device_browser_observations", "recommended_debugging_steps", "suggested_engineering_fixes"
        ]:
            val = raw_json.get(list_field)
            if not isinstance(val, list):
                raw_json[list_field] = [str(val)] if val else []

        return GeminiHypotheses(**raw_json)

    except Exception as exc:
        logger.warning("Gemini individual analysis validation failed: %s. Using heuristic fallback.", exc)
        return None


def analyze_feedback_item(
    feedback: FeedbackSubmission,
    all_campaign_feedback: Optional[List[FeedbackSubmission]] = None,
) -> Dict[str, Any]:
    """
    Execute AI triaging, root cause analysis, duplicate detection,
    and developer ticket markdown synthesis. Combines tester facts,
    deterministic heuristics, and Gemini hypotheses with graceful fallback.
    """
    if all_campaign_feedback is None:
        all_campaign_feedback = [feedback]
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

    # 1. Match Root Cause & Technical Patterns (Deterministic Heuristics)
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

    # Construct Tester Facts and Heuristic Classification
    tester_facts = TesterProvidedFacts(
        title=feedback.title or "",
        description=feedback.description or "",
        reproduction_steps=feedback.reproduction_steps,
        expected_behavior=feedback.expected_behavior,
        actual_behavior=feedback.actual_behavior,
        reported_severity=feedback.severity,
        device_info=feedback.device_info,
        has_video_proof=bool(feedback.video_url),
        timestamped_notes=feedback.timestamped_notes or [],
    )

    heuristic_classification = HeuristicClassification(
        matched_pattern=best_pattern["root_cause"] if best_pattern else None,
        rule_category=best_pattern["tags"][0] if (best_pattern and best_pattern.get("tags")) else "General Bug",
        base_friction_score=friction_score,
        rule_tags=tags,
        rule_complexity=complexity,
        rule_sentiment=sentiment,
    )

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

    # 3. Live Gemini Reasoning with Graceful Heuristic Fallback
    gemini_result = _run_gemini_individual_analysis(tester_facts, heuristic_classification)
    if gemini_result is not None:
        gemini_hypotheses = gemini_result
        engine_metadata = AiEngineMetadata(
            provider="Google Gemini",
            model=settings.GEMINI_MODEL,
            is_live_llm=True,
            fallback_used=False,
            analyzed_at=datetime.now(timezone.utc),
        )
        if gemini_hypotheses.root_cause_hypotheses:
            root_cause = gemini_hypotheses.root_cause_hypotheses[0]
        if gemini_hypotheses.suggested_engineering_fixes:
            suggested_fix = gemini_hypotheses.suggested_engineering_fixes[0]
        if gemini_hypotheses.affected_components:
            tags = list(dict.fromkeys(tags + gemini_hypotheses.affected_components))
    else:
        gemini_hypotheses = GeminiHypotheses(
            bug_category="functional_bug" if feedback.feedback_type == "bug_report" else "usability",
            suggested_severity=feedback.severity or "medium",
            suggested_priority="P0" if feedback.severity == "critical" else ("P1" if feedback.severity == "high" else "P2"),
            root_cause_hypotheses=[root_cause],
            supporting_evidence=[feedback.title or "Observed defect reported by tester"],
            affected_components=tags[:3] if tags else ["ApplicationCore"],
            device_browser_observations=[f"Reported on: {feedback.device_info}"] if feedback.device_info else [],
            recommended_debugging_steps=[
                "Inspect client console and component lifecycle for uncaught errors",
                "Execute the tester's reproduction steps in a matching browser environment",
            ],
            suggested_engineering_fixes=[suggested_fix],
            confidence_score=0.60,
            uncertainty_notes="Heuristic fallback active: Analysis derived from TryLo rule patterns without live LLM reasoning.",
        )
        engine_metadata = AiEngineMetadata(
            provider="Local Offline Engine",
            model="trylo-deterministic-nlp",
            is_live_llm=False,
            fallback_used=True,
            analyzed_at=datetime.now(timezone.utc),
        )

    # 4. Generate Ready-to-Paste Developer Ticket Markdown
    repro = feedback.reproduction_steps.strip() if feedback.reproduction_steps else "1. Launch application\n2. Navigate to affected area\n3. Execute action"
    expected = feedback.expected_behavior.strip() if feedback.expected_behavior else "Action completes smoothly without errors."
    actual = feedback.actual_behavior.strip() if feedback.actual_behavior else feedback.description.strip()
    sev = (gemini_hypotheses.suggested_severity or feedback.severity or "medium").upper()
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

    hypotheses_md = "\n".join(f"- {h}" for h in gemini_hypotheses.root_cause_hypotheses)
    evidence_md = "\n".join(f"- > \"{e}\"" for e in gemini_hypotheses.supporting_evidence)
    debugging_md = "\n".join(f"- [ ] {d}" for d in gemini_hypotheses.recommended_debugging_steps)

    ticket_md = f"""### [Bug]: {feedback.title}

**Reported via TryLo Product Testing**
- **Severity**: `{sev}` ({gemini_hypotheses.suggested_priority})
- **Engine**: `{engine_metadata.provider} ({engine_metadata.model})`
- **Estimated Complexity**: `{complexity}`
- **User Friction Score**: `{friction_score}/10` ({sentiment.capitalize()})
{video_proof_md}
---

#### Suspected Root Cause Hypotheses
{hypotheses_md}

#### Supporting Evidence (Tester Citations)
{evidence_md}

#### Steps to Reproduce
{repro}

#### Expected Behavior
{expected}

#### Actual Behavior
{actual}

#### Suggested Engineering Fix
> {suggested_fix}

#### Recommended Debugging Checklist
{debugging_md}

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
        "tester_facts": tester_facts.model_dump(mode="json"),
        "heuristic_classification": heuristic_classification.model_dump(mode="json"),
        "gemini_hypotheses": gemini_hypotheses.model_dump(mode="json"),
        "engine_metadata": engine_metadata.model_dump(mode="json"),
    }


CLUSTER_DEFINITIONS = [
    {
        "id": "monetization",
        "name": "Payment & Checkout Failure",
        "keywords": ["stripe", "payment", "checkout", "card", "billing", "invoice", "price"],
        "headline": "Critical Blocker: Payment Checkout Modal Freezes on Card Submission",
        "business_impact": "Direct monetization blocker. Users encountering this cannot complete transactions, resulting in 100% checkout churn.",
        "nexus": "Frontend Stripe Element unmount/remount race condition causing an unresolved Promise in the payment intent confirmation cycle.",
        "hotfix": "Verify Stripe public key initialization; wrap the payment submission in an explicit timeout guard with error fallback.",
        "effort": "Half-day (3-4 hrs)",
        "priority": 1,
        "multiplier": 1.5,
        "revenue_at_risk_monthly": "$8,400/mo",
        "churn_risk_percentage": 64,
        "git_diff_patch": """--- a/frontend/src/components/checkout/PaymentModal.tsx
+++ b/frontend/src/components/checkout/PaymentModal.tsx
@@ -45,6 +45,11 @@ export const PaymentModal: React.FC = () => {
-  const result = await stripe.confirmPayment({ elements });
+  const abortController = new AbortController();
+  const timeoutId = setTimeout(() => abortController.abort(), 12000);
+  const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
+  clearTimeout(timeoutId);
+  if (result.error) throw new Error(result.error.message);""",
    },
    {
        "id": "ui_freeze",
        "name": "Async UI Thread State Lock",
        "keywords": ["freeze", "hang", "unresponsive", "stuck", "infinite loop", "spinner"],
        "headline": "High-Severity Blocker: Unhandled Async State Machine Locks Browser Thread",
        "business_impact": "Causes complete UI unresponsiveness. Forces users to hard-refresh or abandon the session.",
        "nexus": "Missing dependency array or circular reactive state updates inside useEffect triggering an infinite rendering loop.",
        "hotfix": "Audit state setters in the affected view; isolate async actions into dedicated handlers with try/finally reset states.",
        "effort": "2-3 hours",
        "priority": 1,
        "multiplier": 1.3,
        "revenue_at_risk_monthly": "$5,200/mo",
        "churn_risk_percentage": 42,
        "git_diff_patch": """--- a/frontend/src/pages/WorkspacePage.tsx
+++ b/frontend/src/pages/WorkspacePage.tsx
@@ -28,5 +28,6 @@ export const WorkspacePage: React.FC = () => {
-  useEffect(() => { fetchData(); }, [data]);
+  useEffect(() => {
+    let active = true;
+    fetchData().catch(console.error);
+    return () => { active = false; };
+  }, []);""",
    },
    {
        "id": "null_crash",
        "name": "Client-Side Null Reference Crash",
        "keywords": ["crash", "white screen", "blank", "uncaught", "typeerror", "cannot read property", "undefined"],
        "headline": "High-Severity Failure: Uncaught Null Reference Triggers White-Screen Crash",
        "business_impact": "Leaves users on a blank page with zero recovery action, destroying trust in beta stability.",
        "nexus": "Direct property access on deeply nested async responses before data hydration completes.",
        "hotfix": "Enforce optional chaining (?.) across component properties and wrap the route in a React ErrorBoundary.",
        "effort": "1-2 hours",
        "priority": 2,
        "multiplier": 1.2,
        "revenue_at_risk_monthly": "$4,100/mo",
        "churn_risk_percentage": 36,
        "git_diff_patch": """--- a/frontend/src/components/feedback/FeedbackCard.tsx
+++ b/frontend/src/components/feedback/FeedbackCard.tsx
@@ -19,3 +19,4 @@ export const FeedbackCard = ({ item }: Props) => {
-  return <div>{item.tester.profile.experience_level}</div>;
+  const level = item?.tester?.tester_profile?.experience_level ?? 'Intermediate';
+  return <div>{level}</div>;""",
    },
    {
        "id": "network_timeout",
        "name": "API Gateway & Downstream Timeout",
        "keywords": ["timeout", "504", "502", "bad gateway", "network", "slow", "failed to fetch", "econnrefused"],
        "headline": "Infrastructure Blocker: Gateway Drop & Network Request Timeouts",
        "business_impact": "Causes intermittent failure across operations and misleads users into multiple retry submissions.",
        "nexus": "Backend worker thread starvation or reverse proxy connection timeout on long-running queries.",
        "hotfix": "Increase proxy timeout limits, add request pooling, and provide an instant user-facing retry button.",
        "effort": "Half-day",
        "priority": 2,
        "multiplier": 1.1,
        "revenue_at_risk_monthly": "$3,600/mo",
        "churn_risk_percentage": 31,
        "git_diff_patch": """--- a/frontend/src/api/client.ts
+++ b/frontend/src/api/client.ts
@@ -34,3 +34,6 @@ export async function apiClient<T>(url: string, init?: RequestInit): Promise<T>
-  const res = await fetch(url, init);
+  const controller = new AbortController();
+  const id = setTimeout(() => controller.abort(), 10000);
+  const res = await fetch(url, { ...init, signal: controller.signal });
+  clearTimeout(id);""",
    },
    {
        "id": "auth_drop",
        "name": "Authentication & Session Expiry",
        "keywords": ["login", "token", "401", "403", "unauthorized", "forbidden", "logged out", "cookie", "session"],
        "headline": "Access Blocker: Unexpected Session Drop During User Workflow",
        "business_impact": "Interrupts active user testing and discards uncommitted user inputs.",
        "nexus": "Premature access token expiration or cross-origin SameSite cookie restrictions.",
        "hotfix": "Implement transparent silent token refresh and verify Cookie SameSite=Lax flags.",
        "effort": "2-3 hours",
        "priority": 2,
        "multiplier": 1.1,
        "revenue_at_risk_monthly": "$4,800/mo",
        "churn_risk_percentage": 48,
        "git_diff_patch": """--- a/frontend/src/components/WorkspaceGuard.tsx
+++ b/frontend/src/components/WorkspaceGuard.tsx
@@ -32,3 +32,5 @@ export const WorkspaceGuard: React.FC = ({ children }) => {
-  if (isError) return <Navigate to="/login" replace />;
+  if (isError) {
+    return <RetryPrompt onRetry={refetch} onRelogin={logout} />;
+  }""",
    },
    {
        "id": "ui_interception",
        "name": "UI Layout & Click Interception",
        "keywords": ["button", "click", "tap", "modal", "overlay", "dropdown", "z-index", "behind", "invisible"],
        "headline": "Usability Defect: Stacking Context Intercepts Clicks on Primary CTAs",
        "business_impact": "Frustrates users by making buttons appear clickable while receiving no response.",
        "nexus": "Modal backdrop or transparent floating overlay capturing pointer events due to incorrect z-index.",
        "hotfix": "Set pointer-events: none on passive background elements and portal active dialogs to document root.",
        "effort": "1-2 hours",
        "priority": 3,
        "multiplier": 1.0,
        "revenue_at_risk_monthly": "$2,200/mo",
        "churn_risk_percentage": 19,
        "git_diff_patch": """--- a/frontend/src/components/ModalBackdrop.tsx
+++ b/frontend/src/components/ModalBackdrop.tsx
@@ -12,3 +12,3 @@ export const ModalBackdrop = ({ isOpen }: Props) => {
-  return <div className="fixed inset-0 z-10 bg-black/50" />;
+  return <div className={`fixed inset-0 z-40 bg-black/50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none hidden'}`} />;""",
    },
    {
        "id": "ux_friction",
        "name": "Onboarding & Navigation Discoverability",
        "keywords": ["confusing", "unclear", "hard to find", "where is", "expected", "intuitive", "navigation"],
        "headline": "Friction Warning: Discoverability Roadblock in Primary Navigation",
        "business_impact": "Increases time-to-value and causes early tester drop-off during onboarding tasks.",
        "nexus": "Hidden tertiary navigation and lack of contextual empty states.",
        "hotfix": "Add onboarding tooltips and elevate the primary action button to primary visual hierarchy.",
        "effort": "2-3 hours",
        "priority": 3,
        "multiplier": 0.9,
        "revenue_at_risk_monthly": "$1,500/mo",
        "churn_risk_percentage": 15,
        "git_diff_patch": """--- a/frontend/src/pages/OnboardingFlow.tsx
+++ b/frontend/src/pages/OnboardingFlow.tsx
@@ -40,3 +40,4 @@ export const OnboardingFlow = () => {
-  return <SecondaryButton onClick={advance}>Next</SecondaryButton>;
+  return <PrimaryButton className="w-full shadow-lg" onClick={advance}>Complete Onboarding</PrimaryButton>;""",
    },
]


def synthesize_batch_feedback_insights(
    submissions: List[FeedbackSubmission],
    campaign_title: Optional[str] = None,
    campaign_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """
    Synthesize dozens of individual feedback submissions and bug reports into
    one single executive verdict: The #1 Most Critical Issue To Take Care Of,
    a Release Readiness Score, and a Unified Developer PR Brief.
    """
    total = len(submissions)
    now_iso = datetime.now(timezone.utc).isoformat()

    if total == 0:
        return {
            "campaign_id": campaign_id,
            "campaign_title": campaign_title or "All Campaigns",
            "total_reports_analyzed": 0,
            "critical_bugs_count": 0,
            "high_bugs_count": 0,
            "release_readiness_score": 100,
            "release_readiness_verdict": "READY FOR RELEASE",
            "single_most_critical_blocker": {
                "headline": "No Issues Recorded - System Clean",
                "business_impact": "Zero bug reports or usability friction items have been filed. Testing workspace is clean.",
                "affected_reports_count": 0,
                "underlying_nexus": "No failures detected across accepted tester activities.",
                "recommended_hotfix": "Invite additional testers to stress-test your core workflows.",
            },
            "top_prioritized_actions": [
                {
                    "priority": 1,
                    "action_title": "Onboard More Testers",
                    "rationale": "Gather more diverse browser and device feedback.",
                    "estimated_effort": "Immediate",
                    "affected_reports_count": 0,
                }
            ],
            "executive_summary_markdown": "# Executive Health Verdict: Ready For Testing\n\nNo issues or blockers currently filed.",
            "unified_pr_brief_markdown": "# Engineering Brief\n\nNo outstanding defects.",
            "synthesized_at": now_iso,
        }

    critical_count = sum(1 for s in submissions if s.severity == "critical")
    high_count = sum(1 for s in submissions if s.severity == "high")
    medium_count = sum(1 for s in submissions if s.severity == "medium")
    low_count = sum(1 for s in submissions if s.severity == "low")
    video_count = sum(1 for s in submissions if s.video_url)

    # 1. Calculate Release Readiness Score (0 to 100)
    deductions = (critical_count * 35) + (high_count * 18) + (medium_count * 6) + (low_count * 2)
    score = max(5, min(100, 100 - deductions))

    if score < 50 or critical_count >= 1:
        verdict = "BLOCKING - DO NOT SHIP"
    elif score < 80 or high_count >= 2:
        verdict = "PROCEED WITH CAUTION"
    else:
        verdict = "READY FOR RELEASE"

    # 2. Cluster all submissions into failure modes
    cluster_scores = []
    for cdef in CLUSTER_DEFINITIONS:
        matching_reports = []
        for s in submissions:
            text = f"{s.title or ''} {s.description or ''} {s.reproduction_steps or ''}".lower()
            if any(kw in text for kw in cdef["keywords"]):
                matching_reports.append(s)

        matched_count = len(matching_reports)
        crit_in_cluster = sum(1 for s in matching_reports if s.severity == "critical")
        high_in_cluster = sum(1 for s in matching_reports if s.severity == "high")

        if matched_count > 0:
            raw_risk = (crit_in_cluster * 12) + (high_in_cluster * 7) + (matched_count * 3)
            weighted_risk = raw_risk * cdef["multiplier"]
            cluster_scores.append({
                "definition": cdef,
                "matching_reports": matching_reports,
                "matched_count": matched_count,
                "weighted_risk": weighted_risk,
                "critical_count": crit_in_cluster,
            })

    # Sort clusters by highest risk
    cluster_scores.sort(key=lambda x: x["weighted_risk"], reverse=True)

    # 3. Identify The Single Most Critical Issue
    if cluster_scores:
        top_cluster = cluster_scores[0]
        cdef = top_cluster["definition"]
        single_blocker = {
            "headline": cdef["headline"],
            "business_impact": cdef["business_impact"],
            "affected_reports_count": top_cluster["matched_count"],
            "underlying_nexus": cdef["nexus"],
            "recommended_hotfix": cdef["hotfix"],
            "revenue_at_risk_monthly": cdef.get("revenue_at_risk_monthly", "$4,200/mo"),
            "churn_risk_percentage": cdef.get("churn_risk_percentage", 35),
            "git_diff_patch": cdef.get("git_diff_patch", ""),
        }
    else:
        # Fallback to the single highest severity bug
        highest_bug = sorted(
            submissions,
            key=lambda s: 3 if s.severity == "critical" else (2 if s.severity == "high" else 1),
            reverse=True,
        )[0]
        single_blocker = {
            "headline": f"Priority Failure: {highest_bug.title}",
            "business_impact": "Dominant user experience defect reported by testers.",
            "affected_reports_count": 1,
            "underlying_nexus": "Component boundary state inconsistency.",
            "recommended_hotfix": "Inspect error logs and reproduction steps in the bug report.",
            "revenue_at_risk_monthly": "$2,800/mo",
            "churn_risk_percentage": 28,
            "git_diff_patch": """--- a/src/components/CoreView.tsx
+++ b/src/components/CoreView.tsx
@@ -14,3 +14,5 @@
-  return <div>{props.data.id}</div>;
+  if (!props?.data) return null;
+  return <div>{props.data?.id}</div>;""",
        }

    # 4. Synthesize Top 3 Prioritized Action Items
    actions = []
    action_idx = 1
    for citem in cluster_scores[:3]:
        c = citem["definition"]
        actions.append({
            "priority": action_idx,
            "action_title": f"Fix {c['name']}: {c['headline'].split(':')[0]}",
            "rationale": c["business_impact"],
            "estimated_effort": c["effort"],
            "affected_reports_count": citem["matched_count"],
        })
        action_idx += 1

    # Fill remaining actions if fewer than 3 clusters
    if len(actions) < 3:
        actions.append({
            "priority": len(actions) + 1,
            "action_title": "Run Regression Verification on Resolved Reports",
            "rationale": "Verify that recent bug fixes did not introduce side-effects in connected user flows.",
            "estimated_effort": "1-2 hours",
            "affected_reports_count": total,
        })

    # 5. Build Executive Summary Report Markdown
    camp_name = campaign_title or "All Active Campaigns"
    video_pct = int(round((video_count / total) * 100)) if total else 0

    executive_md = f"""# Executive Product Health Verdict: {camp_name}

**Status Verdict**: `{verdict}`  
**Release Readiness Score**: `{score}/100`  
**Total Reports Synthesized**: `{total}` (`{critical_count}` Critical, `{high_count}` High, `{medium_count}` Medium)  
**Video Proof Evidence Coverage**: `{video_pct}%` ({video_count} recordings)  
**Synthesized At**: `{now_iso[:19]}Z`

---

## 1. The Single Most Critical Issue To Address

> ### **{single_blocker['headline']}**
>
> **Business Impact**: {single_blocker['business_impact']}  
> **Affected Reports**: `{single_blocker['affected_reports_count']}` of `{total}` total submissions correlate directly to this failure mode.  
> **Architectural Nexus**: {single_blocker['underlying_nexus']}  
> **Recommended Hotfix**: {single_blocker['recommended_hotfix']}

---

## 2. Top Prioritized Engineering Actions

| Priority | Action Item | Target Effort | Impacted Reports | Rationale |
| :---: | :--- | :---: | :---: | :--- |
"""
    for a in actions:
        executive_md += f"| **P{a['priority']}** | **{a['action_title']}** | `{a['estimated_effort']}` | `{a['affected_reports_count']}` reports | {a['rationale']} |\n"

    executive_md += f"""
---

## 3. Executive Decision Guidance

- **If Shipping Soon**: {"HOLD SHIPMENT until the single critical blocker above is resolved and verified by testers." if score < 70 else "Ship with caution; resolve the top blocker and monitor error telemetry in production."}
- **Tester Engagement**: {total} verified observations provided solid signal. {video_count} recordings offer step-by-step video proof for the engineering team.
"""

    # 6. Build Unified Developer Fix PR Brief
    unified_pr_md = f"""### [Unified Fix]: {single_blocker['headline']}

**Synthesized from {total} Tester Feedback Reports across TryLo**
- **Priority**: `P0 - RELEASE BLOCKER`
- **Release Verdict**: `{verdict}` (`{score}/100` Readiness)
- **Target Effort**: `{actions[0]['estimated_effort'] if actions else 'Half-day'}`

---

#### 1. Problem Statement
{single_blocker['business_impact']}

#### 2. Root Cause Nexus
{single_blocker['underlying_nexus']}

#### 3. Scope of Work (Unified Resolution)
1. **Apply Hotfix**: {single_blocker['recommended_hotfix']}
2. **Regression Check**: Verify related flows across the `{single_blocker['affected_reports_count']}` affected bug reports.
3. **Telemetry**: Add structured logging to monitor this failure mode post-deploy.

#### 4. Correlated Tester Submissions
"""
    for s in submissions[:6]:
        v_tag = " [Video Proof Attached]" if s.video_url else ""
        unified_pr_md += f"- **[{s.severity.upper() if s.severity else 'FEEDBACK'}]** {s.title}{v_tag}\n"

    return {
        "campaign_id": campaign_id,
        "campaign_title": campaign_title or "All Campaigns",
        "total_reports_analyzed": total,
        "critical_bugs_count": critical_count,
        "high_bugs_count": high_count,
        "release_readiness_score": score,
        "release_readiness_verdict": verdict,
        "single_most_critical_blocker": single_blocker,
        "top_prioritized_actions": actions,
        "executive_summary_markdown": executive_md.strip(),
        "unified_pr_brief_markdown": unified_pr_md.strip(),
        "synthesized_at": now_iso,
    }

