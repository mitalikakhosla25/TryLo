"""TryLo 1-Click Sync to GitHub Issues, Linear & Jira Service.

Transforms AI-triaged bug reports, reproduction steps, video attachments, and Git patches
into standardized issue templates ready for 1-click sync into engineering sprint backlogs.
"""

import urllib.parse
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.models.feedback import FeedbackSubmission


def export_issue_to_backlog(
    feedback: FeedbackSubmission,
    target_repo: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate structured sync payloads and web intents for GitHub and Linear."""
    title = feedback.title or "Defect Report"
    actual = feedback.actual_behavior or feedback.description or "Unexpected failure occurred"
    expected = feedback.expected_behavior or "Workflow completes successfully"
    repro = feedback.reproduction_steps or "1. Open app\n2. Trigger action\n3. Observe defect"
    sev = (feedback.severity or "medium").upper()

    labels = ["bug", "trylo-verified", f"severity-{sev.lower()}"]
    if feedback.video_url:
        labels.append("has-video-proof")

    # Linear Markdown
    linear_md = f"""## [TryLo Bug Report]: {title}

**Severity**: `{sev}`  
**Reported By**: {feedback.tester.full_name if feedback.tester else 'Verified Tester'}  
**Feedback ID**: `{feedback.id}`  
**Video Recording**: {feedback.video_url or 'None'}

### Description & Actual Behavior
{actual}

### Expected Behavior
{expected}

### Reproduction Sequence
{repro}

---
*Generated autonomously via TryLo AI Bug Triaging Engine.*
"""

    # GitHub Issue Prefill URL
    repo = target_repo or "owner/repository"
    encoded_title = urllib.parse.quote(f"[Bug]: {title}")
    encoded_body = urllib.parse.quote(linear_md)
    encoded_labels = urllib.parse.quote(",".join(labels))

    gh_url = f"https://github.com/{repo}/issues/new?title={encoded_title}&body={encoded_body}&labels={encoded_labels}"

    return {
        "feedback_id": feedback.id,
        "title": title,
        "labels": labels,
        "severity": sev,
        "github_issue_url": gh_url,
        "linear_markdown": linear_md.strip(),
        "dev_brief_markdown": linear_md.strip(),
        "generated_at": datetime.now(timezone.utc),
    }

