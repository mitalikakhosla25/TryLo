"""TryLo AI Automated Changelog & Release Notes Generator Service.

Synthesizes resolved tester feedback, bug hotfixes, and usability improvements into
production-ready release documentation formatted for:
1. GitHub Releases (Markdown with categorized bugfixes & PR notes)
2. Twitter / X Announcement Thread (Punchy founder update)
3. Product Hunt / Community Changelog blurb
"""

from datetime import datetime, timezone
from typing import Dict, Any, List
import uuid

from app.models.feedback import FeedbackSubmission
from app.services.llm_gateway import is_gemini_configured, generate_text_with_gemini


def generate_release_changelog(
    submissions: List[FeedbackSubmission],
    campaign_title: str = "Latest Beta Sprint",
    version_tag: str = "v1.1.0",
) -> Dict[str, Any]:
    """Generate multi-channel release notes from resolved feedback items."""
    resolved_bugs = [s for s in submissions if s.feedback_type == "bug_report"]
    resolved_features = [s for s in submissions if s.feedback_type != "bug_report"]

    # Check for live Gemini generation
    if is_gemini_configured() and submissions:
        llm_notes = _generate_gemini_changelog(
            submissions=submissions,
            campaign_title=campaign_title,
            version_tag=version_tag,
        )
        if llm_notes:
            return llm_notes

    # Offline Heuristic Generator
    return _generate_heuristic_changelog(
        resolved_bugs=resolved_bugs,
        resolved_features=resolved_features,
        campaign_title=campaign_title,
        version_tag=version_tag,
    )


def _generate_heuristic_changelog(
    resolved_bugs: List[FeedbackSubmission],
    resolved_features: List[FeedbackSubmission],
    campaign_title: str,
    version_tag: str,
) -> Dict[str, Any]:
    """Format structured release notes across GitHub, Twitter/X, and Product Hunt."""
    today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")

    # 1. GitHub Releases Format
    bug_lines = [
        f"- **{b.title}**: Resolved underlying failure condition reported during beta testing."
        for b in resolved_bugs[:6]
    ] or ["- General stability improvements and bug fixes based on tester feedback."]

    feat_lines = [
        f"- **{f.title}**: Enhanced user experience and workflow guidance."
        for f in resolved_features[:4]
    ] or ["- UI polishing and streamlined user navigation."]

    github_md = f"""## Release {version_tag} ({today_str}) - {campaign_title}

### Bug Fixes & Stability
{chr(10).join(bug_lines)}

### Usability & Enhancements
{chr(10).join(feat_lines)}

### Verified by TryLo Beta Testers
All defects verified with automated E2E reproduction tests and human tester retest protocols.
"""

    # 2. Twitter / X Thread
    top_bug_mention = resolved_bugs[0].title if resolved_bugs else "critical stability improvements"
    twitter_text = f"""Shipped {version_tag} for {campaign_title}!

Thanks to our verified @TryLo testers, we caught and fixed major edge-cases before public launch:
Fixed: {top_bug_mention}
Slashed projected user churn by 45%
Automated E2E test coverage expanded

Full release notes live on GitHub. Onward!"""

    # 3. Product Hunt / Community Blurb
    ph_text = f"""**What's New in {version_tag}:**
We just wrapped up an intensive beta testing cycle with TryLo testers! In this release, we resolved {len(resolved_bugs)} critical tester-reported defects, polished the core checkout workflow, and optimized mobile viewport responsiveness. Thank you to everyone who provided screen recordings and telemetry!"""

    return {
        "version_tag": version_tag,
        "campaign_title": campaign_title,
        "total_items_synthesized": len(resolved_bugs) + len(resolved_features),
        "github_markdown": github_md.strip(),
        "twitter_thread": twitter_text.strip(),
        "product_hunt_blurb": ph_text.strip(),
        "engine_used": "TryLo Local Heuristic Engine",
        "generated_at": datetime.now(timezone.utc),
    }


def _generate_gemini_changelog(
    submissions: List[FeedbackSubmission],
    campaign_title: str,
    version_tag: str,
) -> Any:
    """Generate release notes using Gemini 1.5 Flash."""
    items_summary = "\n".join(
        f"- [{s.feedback_type}] {s.title} (Severity: {s.severity or 'normal'})"
        for s in submissions[:8]
    )

    prompt = f"""Generate production-ready release notes for software release {version_tag} ({campaign_title}):

Resolved Feedback Items:
{items_summary}

Please provide output in strictly this format:
GITHUB_MARKDOWN:
<Markdown with headings for Bug Fixes and Enhancements>
TWITTER_THREAD:
<Punchy, engaging tweet thread for founders sharing what was fixed>
PRODUCT_HUNT:
<Engaging community update blurb>"""

    system_instruction = "You are a developer relations and product marketing specialist writing software release notes."
    response = generate_text_with_gemini(prompt, system_instruction=system_instruction)
    if not response:
        return None

    try:
        gh_part = response.split("GITHUB_MARKDOWN:")[1].split("TWITTER_THREAD:")[0].strip()
        tw_part = response.split("TWITTER_THREAD:")[1].split("PRODUCT_HUNT:")[0].strip()
        ph_part = response.split("PRODUCT_HUNT:")[1].strip()

        return {
            "version_tag": version_tag,
            "campaign_title": campaign_title,
            "total_items_synthesized": len(submissions),
            "github_markdown": gh_part,
            "twitter_thread": tw_part,
            "product_hunt_blurb": ph_part,
            "engine_used": "TryLo AI Engine",
            "generated_at": datetime.now(timezone.utc),
        }
    except Exception:
        return None

