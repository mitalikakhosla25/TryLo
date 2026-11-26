"""TryLo Campaign-Wide AI Intelligence & Executive Synthesis Service.

Analyzes all feedback for a campaign to deduce recurring failure modes,
duplicate issue clusters, browser/device failure patterns, release readiness verdicts,
and synthesized developer action items.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.models.feedback import FeedbackSubmission, CampaignAiSynthesis
from app.models.campaign import Campaign
from app.services.llm_gateway import is_gemini_configured, generate_json_with_gemini
from app.services.ai_triage import (
    CLUSTER_DEFINITIONS,
    extract_keywords,
    calculate_text_similarity,
)

logger = logging.getLogger("trylo.campaign_synthesis")

# Minimum cooldown seconds before auto-resynthesizing unless forced
DEBOUNCE_COOLDOWN_SECONDS = 30


def get_latest_campaign_synthesis(
    campaign_id: uuid.UUID,
    db: Session,
) -> Optional[CampaignAiSynthesis]:
    """Retrieve the most recent campaign synthesis record."""
    return db.scalar(
        select(CampaignAiSynthesis)
        .where(CampaignAiSynthesis.campaign_id == campaign_id)
        .order_by(CampaignAiSynthesis.version.desc())
    )


def synthesize_campaign_intelligence(
    campaign_id: uuid.UUID,
    db: Session,
    force_refresh: bool = False,
) -> CampaignAiSynthesis:
    """
    Synthesize campaign-wide intelligence across all submitted feedback.
    Honors debouncing cooldown unless force_refresh=True.
    Uses Gemini for holistic reasoning when configured; falls back gracefully.
    """
    now = datetime.now(timezone.utc)

    # 1. Check debounce / cache
    latest = get_latest_campaign_synthesis(campaign_id, db)
    if latest and not force_refresh and not latest.is_outdated:
        age_seconds = (now - latest.synthesized_at).total_seconds()
        if age_seconds < DEBOUNCE_COOLDOWN_SECONDS:
            logger.info("Returning debounced campaign synthesis v%d for campaign %s", latest.version, campaign_id)
            return latest

    # 2. Fetch all feedback for this campaign
    submissions = db.scalars(
        select(FeedbackSubmission)
        .where(FeedbackSubmission.campaign_id == campaign_id)
        .order_by(FeedbackSubmission.created_at.desc())
    ).all()

    total = len(submissions)
    snapshot_ids = [str(s.id) for s in submissions]

    # Calculate severity counts
    critical_count = sum(1 for s in submissions if s.severity == "critical")
    high_count = sum(1 for s in submissions if s.severity == "high")
    medium_count = sum(1 for s in submissions if s.severity == "medium")
    low_count = sum(1 for s in submissions if s.severity == "low")
    video_count = sum(1 for s in submissions if s.video_url)

    severity_dist = {
        "critical": critical_count,
        "high": high_count,
        "medium": medium_count,
        "low": low_count,
    }

    # 3. Calculate Release Readiness Score (0-100) strictly from defect counts
    if total == 0:
        score = 100
        verdict = "READY FOR RELEASE"
    else:
        deductions = (critical_count * 35) + (high_count * 18) + (medium_count * 6) + (low_count * 2)
        score = max(5, min(100, 100 - deductions))
        if score < 50 or critical_count >= 1:
            verdict = "BLOCKING - DO NOT SHIP"
        elif score < 80 or high_count >= 2:
            verdict = "PROCEED WITH CAUTION"
        else:
            verdict = "READY FOR RELEASE"

    # 4. Device and Browser Pattern Analysis
    browser_counts: Dict[str, int] = {}
    os_counts: Dict[str, int] = {}
    for s in submissions:
        if s.device_info and isinstance(s.device_info, dict):
            b = s.device_info.get("browser", "Unknown")
            o = s.device_info.get("os", "Unknown")
            browser_counts[b] = browser_counts.get(b, 0) + 1
            os_counts[o] = os_counts.get(o, 0) + 1

    device_patterns = {
        "dominant_browsers": [
            {"browser": b, "report_count": cnt}
            for b, cnt in sorted(browser_counts.items(), key=lambda x: x[1], reverse=True)[:4]
        ],
        "operating_systems": [
            {"os": o, "report_count": cnt}
            for o, cnt in sorted(os_counts.items(), key=lambda x: x[1], reverse=True)[:4]
        ],
        "video_proof_coverage_pct": int(round((video_count / total) * 100)) if total else 0,
    }

    # 5. Duplicate Clusters (Jaccard similarity grouping)
    duplicate_clusters = []
    processed_ids = set()
    for s in submissions:
        if s.id in processed_ids:
            continue
        cluster_members = [s]
        tokens_s = extract_keywords(f"{s.title} {s.description}")
        for other in submissions:
            if other.id == s.id or other.id in processed_ids:
                continue
            tokens_o = extract_keywords(f"{other.title} {other.description}")
            sim = calculate_text_similarity(tokens_s, tokens_o)
            if sim >= 0.28:
                cluster_members.append(other)
                processed_ids.add(other.id)

        if len(cluster_members) > 1:
            duplicate_clusters.append({
                "cluster_title": s.title,
                "reports_count": len(cluster_members),
                "report_ids": [str(m.id) for m in cluster_members],
                "severities": list(set(m.severity for m in cluster_members if m.severity)),
            })
        processed_ids.add(s.id)

    # 6. Recurring Issues / Failure Modes via Heuristic Matching
    cluster_scores = []
    for cdef in CLUSTER_DEFINITIONS:
        matched = []
        for s in submissions:
            text = f"{s.title or ''} {s.description or ''} {s.reproduction_steps or ''}".lower()
            if any(kw in text for kw in cdef["keywords"]):
                matched.append(s)
        if matched:
            c_crit = sum(1 for m in matched if m.severity == "critical")
            c_high = sum(1 for m in matched if m.severity == "high")
            weighted = ((c_crit * 12) + (c_high * 7) + (len(matched) * 3)) * cdef["multiplier"]
            cluster_scores.append({
                "definition": cdef,
                "matched_count": len(matched),
                "weighted_risk": weighted,
                "reports": matched,
            })
    cluster_scores.sort(key=lambda x: x["weighted_risk"], reverse=True)

    recurring_issues = [
        {
            "theme": item["definition"]["name"],
            "headline": item["definition"]["headline"],
            "affected_count": item["matched_count"],
            "nexus": item["definition"]["nexus"],
            "recommended_fix": item["definition"]["hotfix"],
        }
        for item in cluster_scores[:4]
    ]

    # 7. Critical Blocker & Recommendations (Gemini or Fallback)
    provider_name = "Local Offline Engine"
    model_name = "trylo-deterministic-nlp"
    critical_blocker = None
    top_actions = []
    recommendations = []
    exec_md = ""
    unified_pr_md = ""

    campaign_obj = db.scalar(select(Campaign).where(Campaign.id == campaign_id))
    campaign_title = campaign_obj.title if campaign_obj else "Product Campaign"

    # Try Gemini reasoning
    if is_gemini_configured() and total > 0:
        reports_summary = [
            {
                "id": str(s.id),
                "title": s.title,
                "severity": s.severity or "medium",
                "description": s.description[:250],
                "category": s.feedback_type,
            }
            for s in submissions[:12]
        ]

        gemini_prompt = f"""You are TryLo AI Senior Product Quality Architect.
Synthesize campaign-wide intelligence for '{campaign_title}' based on {total} tester feedback reports.

SUBMISSION METRICS:
- Total reports: {total}
- Critical: {critical_count}, High: {high_count}, Medium: {medium_count}, Low: {low_count}
- Release Readiness Score: {score}/100 ({verdict})

REPORTS SAMPLE:
{json.dumps(reports_summary, indent=2)}

RECURRING THEMES IDENTIFIED:
{json.dumps(recurring_issues, indent=2)}

CRITICAL RULES:
1. Treat all findings as hypotheses and recommendations, NOT absolute stack diagnoses.
2. NEVER fabricate numerical metrics or invent reports not in the data.
3. Identify the single most critical blocker to resolve before shipping.
4. Output strictly valid JSON conforming to this schema:
{{
  "critical_blocker": {{
    "headline": "<concise title of the #1 critical blocker>",
    "business_impact": "<real-world user impact>",
    "affected_reports_count": <number of correlated reports>,
    "underlying_nexus": "<hypothesized technical architectural failure point>",
    "recommended_hotfix": "<concrete engineering fix>"
  }},
  "top_prioritized_actions": [
    {{
      "priority": 1,
      "action_title": "<action 1>",
      "rationale": "<why>",
      "estimated_effort": "<e.g. 2-3 hours, 1 day>",
      "affected_reports_count": <count>
    }}
  ],
  "product_recommendations": [
    {{
      "title": "<recommendation title>",
      "category": "<stability|ux_clarity|performance|mobile_support>",
      "description": "<actionable recommendation>"
    }}
  ],
  "executive_summary_markdown": "<complete markdown executive report with status and next steps>",
  "unified_pr_brief_markdown": "<clean markdown PR brief summarizing changes needed>"
}}"""

        gemini_json = generate_json_with_gemini(
            prompt=gemini_prompt,
            system_instruction="You are an expert software architect synthesizing QA reports into executive intelligence. Return strictly valid JSON.",
            timeout_seconds=20.0,
        )

        if gemini_json and isinstance(gemini_json, dict) and "critical_blocker" in gemini_json:
            provider_name = "TryLo AI Engine"
            model_name = "trylo-ai-frontier"
            critical_blocker = gemini_json.get("critical_blocker")
            top_actions = gemini_json.get("top_prioritized_actions", [])
            recommendations = gemini_json.get("product_recommendations", [])
            exec_md = gemini_json.get("executive_summary_markdown", "")
            unified_pr_md = gemini_json.get("unified_pr_brief_markdown", "")

    # Fallback if Gemini was unavailable or returned None
    if not critical_blocker:
        if cluster_scores:
            top_c = cluster_scores[0]["definition"]
            critical_blocker = {
                "headline": top_c["headline"],
                "business_impact": top_c["business_impact"],
                "affected_reports_count": cluster_scores[0]["matched_count"],
                "underlying_nexus": top_c["nexus"],
                "recommended_hotfix": top_c["hotfix"],
            }
        elif submissions:
            top_s = submissions[0]
            critical_blocker = {
                "headline": f"Priority Issue: {top_s.title}",
                "business_impact": "Primary defect reported by beta testers.",
                "affected_reports_count": 1,
                "underlying_nexus": "Component boundary state inconsistency.",
                "recommended_hotfix": "Inspect error logs and reproduce with tester instructions.",
            }
        else:
            critical_blocker = {
                "headline": "No Active Defects Reported",
                "business_impact": "All systems operational. No blockers identified.",
                "affected_reports_count": 0,
                "underlying_nexus": "N/A",
                "recommended_hotfix": "Invite additional testers to stress-test secondary workflows.",
            }

        top_actions = [
            {
                "priority": 1,
                "action_title": f"Resolve {critical_blocker['headline'].split(':')[0]}",
                "rationale": critical_blocker["business_impact"],
                "estimated_effort": "Half-day",
                "affected_reports_count": critical_blocker["affected_reports_count"],
            },
            {
                "priority": 2,
                "action_title": "Run Regression Verification Across Beta Feedback",
                "rationale": "Ensure bug fixes do not introduce side-effects in connected user flows.",
                "estimated_effort": "2-3 hours",
                "affected_reports_count": total,
            },
        ]

        recommendations = [
            {
                "title": "Establish Automated Error Boundary Telemetry",
                "category": "stability",
                "description": "Capture unhandled UI crashes in production before users encounter blank screens.",
            },
            {
                "title": "Add Responsive Viewport Guards for Mobile Browsers",
                "category": "mobile_support",
                "description": "Ensure CSS layout boundaries are clamped with dvh units on iOS WebKit and Android.",
            },
        ]

        exec_md = f"""# Executive Product Health Verdict: {campaign_title}

**Status Verdict**: `{verdict}`  
**Release Readiness Score**: `{score}/100`  
**Total Reports Synthesized**: `{total}` (`{critical_count}` Critical, `{high_count}` High, `{medium_count}` Medium)  
**Provider**: `{provider_name} ({model_name})`

---

## 1. The Single Most Critical Issue To Address
> ### **{critical_blocker['headline']}**
>
> **Business Impact**: {critical_blocker['business_impact']}  
> **Underlying Nexus**: {critical_blocker['underlying_nexus']}  
> **Recommended Hotfix**: {critical_blocker['recommended_hotfix']}
"""

        unified_pr_md = f"""### [Unified Fix]: {critical_blocker['headline']}

- **Priority**: `P0 - RELEASE BLOCKER`
- **Release Verdict**: `{verdict}` (`{score}/100` Readiness)

#### 1. Scope of Work
1. **Apply Hotfix**: {critical_blocker['recommended_hotfix']}
2. **Regression Verification**: Validate against the `{critical_blocker['affected_reports_count']}` affected bug reports.
"""

    # 8. Create versioned synthesis record
    new_version = (latest.version + 1) if latest else 1

    synthesis_record = CampaignAiSynthesis(
        id=uuid.uuid4(),
        campaign_id=campaign_id,
        version=new_version,
        is_outdated=False,
        total_reports_analyzed=total,
        feedback_ids_snapshot=snapshot_ids,
        release_readiness_score=score,
        release_readiness_verdict=verdict,
        critical_blocker=critical_blocker,
        top_prioritized_actions=top_actions,
        duplicate_clusters=duplicate_clusters,
        recurring_issues=recurring_issues,
        device_browser_patterns=device_patterns,
        severity_distribution=severity_dist,
        recommendations=recommendations,
        executive_summary_markdown=exec_md.strip(),
        unified_pr_brief_markdown=unified_pr_md.strip(),
        provider=provider_name,
        model=model_name,
        synthesized_at=now,
    )

    db.add(synthesis_record)
    db.commit()
    db.refresh(synthesis_record)

    logger.info(
        "Persisted CampaignAiSynthesis v%d for campaign %s (score=%d, verdict=%s, provider=%s)",
        new_version,
        campaign_id,
        score,
        verdict,
        provider_name,
    )
    return synthesis_record
