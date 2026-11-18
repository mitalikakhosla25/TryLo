"""TryLo Predictive Launch & Revenue ROI Simulator Service.

Enables founders to run interactive "What-If" release planning simulations:
Toggling hypothetical bug fixes recalculates release readiness, protected MRR,
churn reduction, and pinpoints the single highest-leverage next defect to resolve.
"""

from typing import Dict, Any, List, Set
import uuid
from app.models.feedback import FeedbackSubmission


def simulate_launch_readiness_and_roi(
    submissions: List[FeedbackSubmission],
    simulated_resolved_ids: List[uuid.UUID],
) -> Dict[str, Any]:
    """Recalculate launch readiness, protected revenue, and churn risk given resolved bug IDs."""
    resolved_set: Set[str] = {str(i) for i in simulated_resolved_ids}
    total_count = len(submissions)

    if total_count == 0:
        return {
            "total_feedback_count": 0,
            "simulated_resolved_count": 0,
            "remaining_open_count": 0,
            "baseline_readiness_score": 100,
            "simulated_readiness_score": 100,
            "readiness_delta": 0,
            "baseline_revenue_risk_monthly": 0,
            "protected_revenue_monthly": 0,
            "remaining_revenue_risk_monthly": 0,
            "baseline_churn_rate_pct": 5,
            "simulated_churn_rate_pct": 5,
            "churn_reduction_pct": 0,
            "verdict": "READY FOR RELEASE",
            "highest_leverage_next_fix": None,
            "strategic_advice": "No defects recorded. Product is clear for launch.",
        }

    # Baseline calculation (all currently open)
    baseline_critical = sum(1 for s in submissions if s.severity == "critical")
    baseline_high = sum(1 for s in submissions if s.severity == "high")
    baseline_med = sum(1 for s in submissions if s.severity == "medium")

    baseline_score = max(10, 100 - (baseline_critical * 30 + baseline_high * 15 + baseline_med * 5))
    baseline_mrr_risk = baseline_critical * 4200 + baseline_high * 1800 + baseline_med * 600
    baseline_churn = min(85, max(10, baseline_critical * 30 + baseline_high * 16 + baseline_med * 4))

    # Simulated remaining items
    remaining_submissions = [s for s in submissions if str(s.id) not in resolved_set]
    resolved_count = total_count - len(remaining_submissions)

    sim_critical = sum(1 for s in remaining_submissions if s.severity == "critical")
    sim_high = sum(1 for s in remaining_submissions if s.severity == "high")
    sim_med = sum(1 for s in remaining_submissions if s.severity == "medium")

    sim_score = max(10, min(100, 100 - (sim_critical * 30 + sim_high * 15 + sim_med * 5)))
    sim_mrr_risk = sim_critical * 4200 + sim_high * 1800 + sim_med * 600
    sim_churn = min(85, max(8, sim_critical * 30 + sim_high * 16 + sim_med * 4))

    protected_mrr = max(0, baseline_mrr_risk - sim_mrr_risk)
    churn_reduction = max(0, baseline_churn - sim_churn)
    readiness_delta = sim_score - baseline_score

    # Verdict
    if sim_critical > 0 or sim_score < 60:
        verdict = "BLOCKING - DO NOT SHIP"
    elif sim_score < 80:
        verdict = "PROCEED WITH CAUTION"
    else:
        verdict = "READY FOR RELEASE"

    # Find highest leverage next defect to fix
    highest_leverage: Any = None
    if remaining_submissions:
        # Sort remaining by severity weight
        def sev_weight(sub: FeedbackSubmission) -> int:
            if sub.severity == "critical":
                return 3
            if sub.severity == "high":
                return 2
            return 1

        top_remaining = sorted(remaining_submissions, key=sev_weight, reverse=True)[0]
        potential_gain = 30 if top_remaining.severity == "critical" else (15 if top_remaining.severity == "high" else 5)
        potential_mrr = 4200 if top_remaining.severity == "critical" else (1800 if top_remaining.severity == "high" else 600)

        highest_leverage = {
            "id": top_remaining.id,
            "title": top_remaining.title,
            "severity": top_remaining.severity or "medium",
            "marginal_readiness_gain": potential_gain,
            "marginal_mrr_protection": potential_mrr,
            "marginal_churn_reduction_pct": 20 if top_remaining.severity == "critical" else 10,
        }

    # Strategic advice
    if resolved_count == 0:
        advice = f"Select items below to simulate the revenue, churn, and readiness impact of fixing specific defects."
    elif sim_critical == 0 and sim_score >= 80:
        advice = f"Resolving these {resolved_count} items eliminates all critical blockers! Protected ${protected_mrr:,}/mo MRR and reduced projected churn by {churn_reduction}%."
    else:
        advice = f"Good progress ({resolved_count} simulated fixes). However, {sim_critical} critical blocker(s) still remain before public launch."

    return {
        "total_feedback_count": total_count,
        "simulated_resolved_count": resolved_count,
        "remaining_open_count": len(remaining_submissions),
        "baseline_readiness_score": baseline_score,
        "simulated_readiness_score": sim_score,
        "readiness_delta": readiness_delta,
        "baseline_revenue_risk_monthly": baseline_mrr_risk,
        "protected_revenue_monthly": protected_mrr,
        "remaining_revenue_risk_monthly": sim_mrr_risk,
        "baseline_churn_rate_pct": baseline_churn,
        "simulated_churn_rate_pct": sim_churn,
        "churn_reduction_pct": churn_reduction,
        "verdict": verdict,
        "highest_leverage_next_fix": highest_leverage,
        "strategic_advice": advice,
    }

