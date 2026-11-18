"""TryLo Founder Feedback Management Pydantic Schemas."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.feedback import ALLOWED_FEEDBACK_STATUSES


class FeedbackStatusUpdateRequest(BaseModel):
    """Payload for updating the status of a feedback submission."""
    status: str
    retest_instructions: Optional[str] = Field(None, max_length=3000)
    resolution_notes: Optional[str] = Field(None, max_length=3000)
    reason: Optional[str] = Field(None, max_length=1000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ALLOWED_FEEDBACK_STATUSES:
            raise ValueError(f"Status must be one of: {ALLOWED_FEEDBACK_STATUSES}")
        return clean

    @field_validator("retest_instructions", "resolution_notes", "reason")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class FeedbackInternalNoteCreate(BaseModel):
    """Payload for adding a private founder internal note to a feedback submission."""
    body: str = Field(..., min_length=1, max_length=5000)

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Note body cannot be empty or only whitespace.")
        return trimmed


class FeedbackInternalNoteResponse(BaseModel):
    """Founder-only response for an internal note on a feedback submission."""
    id: uuid.UUID
    feedback_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackStatusHistoryResponse(BaseModel):
    """Audit log record of a feedback lifecycle transition."""
    id: uuid.UUID
    feedback_id: uuid.UUID
    actor_id: uuid.UUID
    actor_name: str
    previous_status: str
    new_status: str
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FounderFeedbackListItemResponse(BaseModel):
    """Summary item for founder feedback dashboard list."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    tester_name: str
    tester_experience_level: Optional[str] = None
    tester_verification_tier: Optional[int] = 1
    tester_average_rating: Optional[float] = None
    tester_reviews_count: Optional[int] = None
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    feedback_type: str
    title: str
    description: str
    severity: Optional[str] = None
    status: str
    retest_instructions: Optional[str] = None
    resolution_notes: Optional[str] = None
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    notes_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FounderFeedbackListResponse(BaseModel):
    """Paginated list of feedback items for founder review."""
    total: int
    page: int
    limit: int
    items: List[FounderFeedbackListItemResponse]


class DuplicateFeedbackMatch(BaseModel):
    """Potential duplicate issue detected via semantic and keyword correlation."""
    id: uuid.UUID
    title: str
    similarity_score: int
    severity: Optional[str] = None
    status: str
    tester_name: str
    created_at: datetime


class AiTriageResponse(BaseModel):
    """AI synthesis of root cause, complexity, user friction, duplicates, and dev ticket."""
    root_cause_hypothesis: str
    fix_complexity: str
    suggested_fix: str
    technical_tags: List[str]
    sentiment_label: str
    friction_score: int
    potential_duplicates: List[DuplicateFeedbackMatch] = []
    dev_ticket_markdown: str
    analyzed_at: datetime


class FounderFeedbackDetailResponse(BaseModel):
    """Complete founder review response for a single feedback submission."""
    id: uuid.UUID
    campaign_id: uuid.UUID
    campaign_title: str
    campaign_slug: str
    startup_id: uuid.UUID
    startup_name: str
    startup_slug: str
    tester_id: uuid.UUID
    tester_name: str
    tester_experience_level: Optional[str] = None
    tester_verification_tier: Optional[int] = 1
    tester_average_rating: Optional[float] = None
    tester_reviews_count: Optional[int] = None
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    task_description: Optional[str] = None
    task_expected_outcome: Optional[str] = None
    feedback_type: str
    title: str
    description: str
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    reproduction_steps: Optional[str] = None
    severity: Optional[str] = None
    status: str
    retest_instructions: Optional[str] = None
    resolution_notes: Optional[str] = None
    device_info: Optional[dict] = None
    attachments: List[str] = Field(default_factory=list)
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    video_format: Optional[str] = None
    timestamped_notes: List[dict] = Field(default_factory=list)
    ai_triage: Optional[AiTriageResponse] = None
    created_at: datetime
    updated_at: datetime
    internal_notes: List[FeedbackInternalNoteResponse] = []
    status_history: List[FeedbackStatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TimestampedNoteAddRequest(BaseModel):
    """Payload for adding a timestamped annotation to a feedback video."""
    timestamp_seconds: int = Field(..., ge=0)
    timestamp_display: str = Field(..., min_length=1, max_length=10)
    note: str = Field(..., min_length=2, max_length=1000)
    tag: Optional[str] = Field(None, max_length=50)


class SingleMostCriticalBlocker(BaseModel):
    """The single most critical failure mode or bottleneck derived from all feedback."""
    headline: str
    business_impact: str
    affected_reports_count: int
    underlying_nexus: str
    recommended_hotfix: str
    revenue_at_risk_monthly: Optional[str] = None
    churn_risk_percentage: Optional[int] = None
    git_diff_patch: Optional[str] = None


class PrioritizedActionItem(BaseModel):
    """Ranked high-ROI engineering action item to unblock the product."""
    priority: int
    action_title: str
    rationale: str
    estimated_effort: str
    affected_reports_count: int


class AiExecutiveSynthesisResponse(BaseModel):
    """Holistic AI executive synthesis summarizing dozens of feedbacks into the primary blocker and release verdict."""
    campaign_id: Optional[uuid.UUID] = None
    campaign_title: Optional[str] = None
    total_reports_analyzed: int
    critical_bugs_count: int
    high_bugs_count: int
    release_readiness_score: int
    release_readiness_verdict: str
    single_most_critical_blocker: SingleMostCriticalBlocker
    top_prioritized_actions: List[PrioritizedActionItem]
    executive_summary_markdown: str
    unified_pr_brief_markdown: str
    synthesized_at: datetime


class AiCopilotReferencedFeedback(BaseModel):
    """Feedback item cited in an AI Co-Pilot query response."""
    id: uuid.UUID
    title: str
    severity: Optional[str] = None
    tester_name: str


class AiCopilotQueryRequest(BaseModel):
    """Payload for conversational founder query to the TryLo AI Co-Pilot."""
    query: str = Field(..., min_length=2, max_length=1000)
    campaign_id: Optional[uuid.UUID] = None


class AiCopilotQueryResponse(BaseModel):
    """Conversational intelligence synthesis directly answering the founder's inquiry."""
    query: str
    answer_markdown: str
    key_takeaways: List[str] = []
    suggested_followups: List[str] = []
    referenced_feedbacks: List[AiCopilotReferencedFeedback] = []
    timestamp: datetime


class AiEngineStatusResponse(BaseModel):
    """Status metadata indicating whether live Gemini LLM is active or local engine."""
    is_live_llm: bool
    provider: str
    model: str
    subscription_required: bool = False
    free_tier_available: bool = True
    free_tier_provider_url: str
    notice: str


class AiE2eReproductionRequest(BaseModel):
    """Payload for generating an autonomous E2E reproduction script."""
    framework: str = Field(default="playwright", pattern="^(playwright|cypress)$")
    target_base_url: Optional[str] = Field(None, max_length=500)


class AiE2eReproductionResponse(BaseModel):
    """Generated autonomous reproduction test code for local headless execution."""
    feedback_id: uuid.UUID
    framework: str
    filename: str
    test_script_code: str
    setup_instructions: str
    cli_command: str
    generated_at: datetime


class UserJourneyStageItem(BaseModel):
    """A distinct milestone in the tester user journey with telemetry drop-off metrics."""
    stage_id: str
    stage_name: str
    order: int
    testers_reached: int
    pass_rate_percentage: int
    drop_off_percentage: int
    status: str  # healthy | warning | critical_bottleneck
    reported_defects_count: int
    top_defect_headline: Optional[str] = None
    ai_recommendation: str


class AiUserJourneyFunnelResponse(BaseModel):
    """Synthesized end-to-end user journey drop-off and conversion funnel."""
    campaign_id: Optional[uuid.UUID] = None
    campaign_title: str
    overall_funnel_efficiency_score: int
    critical_drop_off_stage: str
    total_testers_evaluated: int
    stages: List[UserJourneyStageItem]
    executive_funnel_takeaway: str
    reconstructed_at: datetime


class FrustrationHeatmapSegment(BaseModel):
    """Timestamped audio window with speech transcript, vocal hesitation, and friction score."""
    timestamp_seconds: int
    timestamp_display: str
    frustration_intensity: int  # 1 to 10
    sentiment: str  # calm | hesitant | frustrated | blocked
    spoken_transcript: str
    ui_friction_flag: Optional[str] = None


class SynchronizedTelemetryEvent(BaseModel):
    """Console log or network request timestamped to match video playback."""
    timestamp_seconds: int
    timestamp_display: str
    event_type: str  # console_error | console_warn | console_info | network_request | user_action
    level: str  # error | warn | info
    message: str
    source_component: Optional[str] = None
    http_status: Optional[int] = None
    latency_ms: Optional[int] = None


class AiVideoIntelligenceResponse(BaseModel):
    """Synthesized multimodal video transcription, voice tone analysis, and frustration heatmap."""
    feedback_id: uuid.UUID
    video_url: str
    video_duration_seconds: int
    total_segments: int
    average_frustration_score: float
    peak_frustration_timestamp: str
    executive_voice_summary: str
    segments: List[FrustrationHeatmapSegment]
    telemetry_events: List[SynchronizedTelemetryEvent] = []
    analyzed_at: datetime



class AiRetestProtocolResponse(BaseModel):
    """Synthesized quality control verification checklist and false-positive prevention protocol."""
    feedback_id: uuid.UUID
    title: str
    target_failure_condition: str
    expected_resolution_state: str
    regression_watchpoints: List[str]
    verification_steps: List[str]
    retest_instructions_markdown: str
    generated_at: datetime


class AiIssueExportResponse(BaseModel):
    """Structured export payload for 1-click synchronization to GitHub Issues and Linear."""
    feedback_id: uuid.UUID
    title: str
    labels: List[str]
    severity: str
    github_issue_url: str
    linear_markdown: str
    dev_brief_markdown: str
    generated_at: datetime


class FeedbackQualityChecklistItem(BaseModel):
    criterion: str
    passed: bool
    points: int
    hint: str


class FeedbackQualityEvaluationRequest(BaseModel):
    title: str = ""
    description: str = ""
    reproduction_steps: Optional[str] = None
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    has_video: bool = False
    feedback_type: str = "bug_report"


class FeedbackQualityEvaluationResponse(BaseModel):
    score: int
    quality_tier: str
    summary_label: str
    checklist: List[FeedbackQualityChecklistItem]
    tips: List[str]


class FeedbackPolishRequest(BaseModel):
    title: str = ""
    description: str = ""
    reproduction_steps: Optional[str] = None
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    feedback_type: str = "bug_report"


class FeedbackPolishResponse(BaseModel):
    polished_title: str
    polished_description: str
    polished_reproduction_steps: str
    polished_expected_behavior: str
    polished_actual_behavior: str
    suggested_severity: str
    engine_used: str


class SyntheticSimulatedBug(BaseModel):
    title: str
    severity: str
    steps: str
    expected: str
    actual: str


class SyntheticPersonaFinding(BaseModel):
    persona_id: str
    persona_name: str
    persona_avatar: str
    persona_role: str
    mindset: str
    overall_score: int
    verdict: str
    key_observations: List[str]
    simulated_bug_report: Optional[SyntheticSimulatedBug] = None
    actionable_recommendations: List[str]


class SyntheticAuditResponse(BaseModel):
    campaign_id: uuid.UUID
    campaign_title: str
    readiness_score: int
    personas: List[SyntheticPersonaFinding]
    executive_summary: str
    engine_used: str
    generated_at: datetime


class HighestLeverageFixItem(BaseModel):
    id: uuid.UUID
    title: str
    severity: str
    marginal_readiness_gain: int
    marginal_mrr_protection: int
    marginal_churn_reduction_pct: int


class LaunchRoiSimulationRequest(BaseModel):
    campaign_id: Optional[uuid.UUID] = None
    simulated_resolved_ids: List[uuid.UUID] = []


class LaunchRoiSimulationResponse(BaseModel):
    total_feedback_count: int
    simulated_resolved_count: int
    remaining_open_count: int
    baseline_readiness_score: int
    simulated_readiness_score: int
    readiness_delta: int
    baseline_revenue_risk_monthly: int
    protected_revenue_monthly: int
    remaining_revenue_risk_monthly: int
    baseline_churn_rate_pct: int
    simulated_churn_rate_pct: int
    churn_reduction_pct: int
    verdict: str
    highest_leverage_next_fix: Optional[HighestLeverageFixItem] = None
    strategic_advice: str


class ChangelogGenerateRequest(BaseModel):
    campaign_id: Optional[uuid.UUID] = None
    version_tag: str = "v1.1.0"
    selected_feedback_ids: Optional[List[uuid.UUID]] = None


class ChangelogGenerateResponse(BaseModel):
    version_tag: str
    campaign_title: str
    total_items_synthesized: int
    github_markdown: str
    twitter_thread: str
    product_hunt_blurb: str
    engine_used: str
    generated_at: datetime


class CampaignArchitectTaskItem(BaseModel):
    id: str
    title: str
    description: str
    is_required: bool = True
    order: int = 1


class CampaignArchitectScreeningItem(BaseModel):
    id: str
    prompt: str
    question_type: str = "text"
    is_required: bool = True
    options: List[str] = []


class CampaignArchitectAudienceItem(BaseModel):
    skills: List[str] = []
    interests: List[str] = []
    experience_level: str = "Intermediate"
    devices: List[str] = []
    countries: List[str] = []
    notes: str = ""


class CampaignAiArchitectRequest(BaseModel):
    prompt: str
    product_url: Optional[str] = None
    startup_name: Optional[str] = None


class CampaignAiArchitectResponse(BaseModel):
    title: str
    summary: str
    description: str
    product_type: str
    product_url: str
    access_instructions: str
    testing_tasks: List[CampaignArchitectTaskItem]
    screening_questions: List[CampaignArchitectScreeningItem]
    target_audience: CampaignArchitectAudienceItem
    max_testers: int = 25
    reward_type: str = "monetary"
    reward_amount: Optional[int] = 25
    reward_currency: Optional[str] = "$"
    reward_description: Optional[str] = None
    engine_used: str
    architected_at: datetime


class ProofAttestationBadge(BaseModel):
    id: str
    label: str
    status: str  # "pass" | "warn" | "fail" | "neutral"
    explanation: str


class AiProofAttestationResponse(BaseModel):
    feedback_id: uuid.UUID
    compliance_score: int
    human_interaction_score: int
    overall_trust_score: int
    fraud_risk: str
    trust_tier: str
    payout_recommendation: str
    payout_status: str  # "approve" | "approve_partial" | "hold" | "reject"
    attestation_badges: List[ProofAttestationBadge]
    sentinel_audit_summary: str
    engine_used: str
    audited_at: datetime


class FeedbackPayoutReleaseRequest(BaseModel):
    amount: Optional[float] = None
    notes: Optional[str] = None
    upi_id: Optional[str] = None


class FeedbackPayoutStatusResponse(BaseModel):
    feedback_id: uuid.UUID
    is_disbursed: bool
    payout_id: Optional[uuid.UUID] = None
    reference_id: Optional[str] = None
    utr_number: Optional[str] = None
    amount: float
    currency: str = "INR"
    upi_id: Optional[str] = None
    status: Optional[str] = None
    disbursed_at: Optional[datetime] = None
    digital_certificate_hash: Optional[str] = None
    tester_name: Optional[str] = None
    campaign_title: Optional[str] = None








