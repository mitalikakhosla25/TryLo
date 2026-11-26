/**
 * TryLo Founder Feedback & Issue Management API Client
 */

import { apiClient } from './client';
import type { FeedbackStatus, FeedbackType, BugSeverity, TimestampedNote } from './tasks';
export type { TimestampedNote };

export interface FeedbackInternalNote {
  id: string;
  feedback_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface FeedbackStatusHistory {
  id: string;
  feedback_id: string;
  actor_id: string;
  actor_name: string;
  previous_status: FeedbackStatus;
  new_status: FeedbackStatus;
  reason?: string | null;
  created_at: string;
}

export interface FounderFeedbackListItem {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_id: string;
  startup_name: string;
  startup_slug: string;
  tester_id: string;
  tester_name: string;
  tester_experience_level?: string | null;
  tester_verification_tier?: number;
  tester_average_rating?: number | null;
  tester_reviews_count?: number | null;
  task_id?: string | null;
  task_title?: string | null;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  severity?: BugSeverity | null;
  status: FeedbackStatus;
  retest_instructions?: string | null;
  resolution_notes?: string | null;
  video_url?: string | null;
  video_duration_seconds?: number | null;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export interface FounderFeedbackListResponse {
  total: number;
  page: number;
  limit: number;
  items: FounderFeedbackListItem[];
}

export interface FounderFeedbackDetail {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_id: string;
  startup_name: string;
  startup_slug: string;
  tester_id: string;
  tester_name: string;
  tester_experience_level?: string | null;
  tester_verification_tier?: number;
  tester_average_rating?: number | null;
  tester_reviews_count?: number | null;
  task_id?: string | null;
  task_title?: string | null;
  task_description?: string | null;
  task_expected_outcome?: string | null;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  reproduction_steps?: string | null;
  severity?: BugSeverity | null;
  status: FeedbackStatus;
  retest_instructions?: string | null;
  resolution_notes?: string | null;
  video_url?: string | null;
  video_duration_seconds?: number | null;
  video_format?: string | null;
  timestamped_notes?: TimestampedNote[];
  ai_triage?: AiTriageResponse | null;
  created_at: string;
  updated_at: string;
  internal_notes: FeedbackInternalNote[];
  status_history: FeedbackStatusHistory[];
}

export interface DuplicateFeedbackMatch {
  id: string;
  title: string;
  similarity_score: number;
  severity?: BugSeverity | null;
  status: FeedbackStatus;
  tester_name: string;
  created_at: string;
}

export interface AiTriageResponse {
  root_cause_hypothesis: string;
  fix_complexity: string;
  suggested_fix: string;
  technical_tags: string[];
  sentiment_label: string;
  friction_score: number;
  potential_duplicates: DuplicateFeedbackMatch[];
  dev_ticket_markdown: string;
  git_diff_patch?: string | null;
  analyzed_at: string;
  tester_facts?: {
    title: string;
    description: string;
    reproduction_steps?: string | null;
    expected_behavior?: string | null;
    actual_behavior?: string | null;
    reported_severity?: string | null;
    device_info?: Record<string, any> | null;
    has_video_proof?: boolean;
  } | null;
  heuristic_classification?: {
    matched_pattern?: string | null;
    rule_category: string;
    base_friction_score: number;
    rule_tags: string[];
    rule_complexity: string;
    rule_sentiment: string;
  } | null;
  gemini_hypotheses?: {
    bug_category: string;
    suggested_severity: string;
    suggested_priority: string;
    root_cause_hypotheses: string[];
    supporting_evidence: string[];
    affected_components: string[];
    device_browser_observations: string[];
    recommended_debugging_steps: string[];
    suggested_engineering_fixes: string[];
    confidence_score: number;
    uncertainty_notes?: string | null;
  } | null;
  engine_metadata?: {
    provider: string;
    model: string;
    is_live_llm: boolean;
    fallback_used: boolean;
    analyzed_at: string;
  } | null;
}

export interface AIAnalysisJobStatus {
  id: string;
  feedback_id: string;
  campaign_id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  max_attempts: number;
  last_error?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CampaignAiSynthesis {
  id: string;
  campaign_id: string;
  version: number;
  is_outdated: boolean;
  total_reports_analyzed: number;
  feedback_ids_snapshot: string[];
  release_readiness_score: number;
  release_readiness_verdict: string;
  critical_blocker?: {
    headline: string;
    business_impact: string;
    affected_reports_count: number;
    underlying_nexus: string;
    recommended_hotfix: string;
  } | null;
  top_prioritized_actions: Array<{
    priority: number;
    action_title: string;
    rationale: string;
    estimated_effort: string;
    affected_reports_count: number;
  }>;
  duplicate_clusters: Array<{
    cluster_title: string;
    reports_count: number;
    report_ids: string[];
    severities: string[];
  }>;
  recurring_issues: Array<{
    theme: string;
    headline: string;
    affected_count: number;
    nexus: string;
    recommended_fix: string;
  }>;
  device_browser_patterns?: {
    dominant_browsers: Array<{ browser: string; report_count: number }>;
    operating_systems: Array<{ os: string; report_count: number }>;
    video_proof_coverage_pct: number;
  } | null;
  severity_distribution?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null;
  recommendations: Array<{
    title: string;
    category: string;
    description: string;
  }>;
  executive_summary_markdown: string;
  unified_pr_brief_markdown: string;
  provider: string;
  model: string;
  synthesized_at: string;
  created_at: string;
}


export interface TimestampedNoteCreatePayload {
  timestamp_seconds: number;
  timestamp_display: string;
  note: string;
  tag?: string;
}

export interface FeedbackStatusUpdateRequest {
  status: FeedbackStatus;
  retest_instructions?: string | null;
  resolution_notes?: string | null;
  reason?: string | null;
}

export interface FounderFeedbackFilters {
  status?: string;
  feedback_type?: string;
  severity?: string;
  campaign_id?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

/**
 * List all feedback across founder's owned campaigns with filters
 */
export async function listFounderFeedback(
  filters?: FounderFeedbackFilters
): Promise<FounderFeedbackListResponse> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.feedback_type && filters.feedback_type !== 'all') {
    params.append('feedback_type', filters.feedback_type);
  }
  if (filters?.severity && filters.severity !== 'all') {
    params.append('severity', filters.severity);
  }
  if (filters?.campaign_id && filters.campaign_id !== 'all') {
    params.append('campaign_id', filters.campaign_id);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.sort) {
    params.append('sort', filters.sort);
  }
  if (filters?.page) {
    params.append('page', String(filters.page));
  }
  if (filters?.limit) {
    params.append('limit', String(filters.limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<FounderFeedbackListResponse>(`/api/founder/feedback${query}`);
}

/**
 * Retrieve complete feedback details for founder review
 */
export async function getFounderFeedbackDetail(
  feedbackId: string
): Promise<FounderFeedbackDetail> {
  return apiClient<FounderFeedbackDetail>(`/api/founder/feedback/${feedbackId}`);
}

/**
 * Update feedback lifecycle status
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  payload: FeedbackStatusUpdateRequest
): Promise<FounderFeedbackDetail> {
  return apiClient<FounderFeedbackDetail>(`/api/founder/feedback/${feedbackId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Add a private internal note
 */
export async function addFeedbackInternalNote(
  feedbackId: string,
  body: string
): Promise<FeedbackInternalNote> {
  return apiClient<FeedbackInternalNote>(`/api/founder/feedback/${feedbackId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

/**
 * Upload an in-browser WebRTC screen recording video
 */
export async function uploadFeedbackVideo(
  videoBlob: Blob
): Promise<{ video_url: string; filename: string; format: string; size_bytes: number }> {
  const res = await fetch('/api/feedback/upload-video', {
    method: 'POST',
    headers: {
      'Content-Type': videoBlob.type || 'video/webm',
    },
    body: videoBlob,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload video recording.' }));
    throw new Error(err.detail || 'Failed to upload video recording.');
  }

  return res.json();
}

/**
 * Add a timestamped annotation to a feedback video
 */
export async function addTimestampedVideoNote(
  feedbackId: string,
  payload: TimestampedNoteCreatePayload
): Promise<{ message: string; note: TimestampedNote; timestamped_notes: TimestampedNote[] }> {
  return apiClient(`/api/feedback/${feedbackId}/video-notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface SingleMostCriticalBlocker {
  headline: string;
  business_impact: string;
  affected_reports_count: number;
  underlying_nexus: string;
  recommended_hotfix: string;
  revenue_at_risk_monthly?: string | null;
  churn_risk_percentage?: number | null;
  git_diff_patch?: string | null;
}

export interface PrioritizedActionItem {
  priority: number;
  action_title: string;
  rationale: string;
  estimated_effort: string;
  affected_reports_count: number;
}

export interface AiExecutiveSynthesisResponse {
  campaign_id?: string | null;
  campaign_title?: string | null;
  total_reports_analyzed: number;
  critical_bugs_count: number;
  high_bugs_count: number;
  release_readiness_score: number;
  release_readiness_verdict: string;
  single_most_critical_blocker: SingleMostCriticalBlocker;
  top_prioritized_actions: PrioritizedActionItem[];
  executive_summary_markdown: string;
  unified_pr_brief_markdown: string;
  synthesized_at: string;
}

/**
 * Execute AI Automated Bug Triaging & Root-Cause Clustering
 */
export async function runAiFeedbackTriage(feedbackId: string): Promise<AiTriageResponse> {
  return apiClient<AiTriageResponse>(`/api/founder/feedback/${feedbackId}/ai-triage`, {
    method: 'POST',
  });
}

/**
 * Generate Holistic AI Executive Synthesis across All Feedbacks & Logs
 */
export async function generateExecutiveFeedbackSynthesis(
  campaignId?: string
): Promise<AiExecutiveSynthesisResponse> {
  const query = campaignId ? `?campaign_id=${encodeURIComponent(campaignId)}` : '';
  return apiClient<AiExecutiveSynthesisResponse>(
    `/api/founder/feedback/executive-synthesis${query}`,
    {
      method: 'POST',
      timeoutMs: 40000,
    }
  );
}

export interface AiCopilotReferencedFeedback {
  id: string;
  title: string;
  severity?: BugSeverity | null;
  tester_name: string;
}

export interface AiCopilotQueryRequest {
  query: string;
  campaign_id?: string | null;
}

export interface AiCopilotQueryResponse {
  query: string;
  answer_markdown: string;
  key_takeaways: string[];
  suggested_followups: string[];
  referenced_feedbacks: AiCopilotReferencedFeedback[];
  timestamp: string;
}

export interface AiEngineStatusResponse {
  is_live_llm: boolean;
  provider: string;
  model: string;
  subscription_required: boolean;
  free_tier_available: boolean;
  free_tier_provider_url: string;
  notice: string;
}

/**
 * Fetch current operational status of the AI Engine (Hybrid Gemini / Local)
 */
export async function fetchAiEngineStatus(): Promise<AiEngineStatusResponse> {
  return apiClient<AiEngineStatusResponse>('/api/founder/ai-engine/status');
}

/**
 * Send natural language query to TryLo Founder AI Co-Pilot
 */
export async function queryAiCopilot(
  payload: AiCopilotQueryRequest
): Promise<AiCopilotQueryResponse> {
  return apiClient<AiCopilotQueryResponse>('/api/founder/ai-copilot/query', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 60000,
  });
}

export interface AiE2eReproductionRequest {
  framework?: 'playwright' | 'cypress';
  target_base_url?: string | null;
}

export interface AiE2eReproductionResponse {
  feedback_id: string;
  framework: 'playwright' | 'cypress';
  filename: string;
  test_script_code: string;
  setup_instructions: string;
  cli_command: string;
  generated_at: string;
}

/**
 * Generate autonomous Playwright or Cypress E2E reproduction script for feedback
 */
export async function generateE2eReproductionScript(
  feedbackId: string,
  payload?: AiE2eReproductionRequest
): Promise<AiE2eReproductionResponse> {
  return apiClient<AiE2eReproductionResponse>(
    `/api/founder/feedback/${feedbackId}/generate-e2e-script`,
    {
      method: 'POST',
      body: JSON.stringify(payload || { framework: 'playwright' }),
      timeoutMs: 40000,
    }
  );
}

export interface UserJourneyStageItem {
  stage_id: string;
  stage_name: string;
  order: number;
  testers_reached: number;
  pass_rate_percentage: number;
  drop_off_percentage: number;
  status: 'healthy' | 'warning' | 'critical_bottleneck';
  reported_defects_count: number;
  top_defect_headline?: string | null;
  ai_recommendation: string;
}

export interface AiUserJourneyFunnelResponse {
  campaign_id?: string | null;
  campaign_title: string;
  overall_funnel_efficiency_score: number;
  critical_drop_off_stage: string;
  total_testers_evaluated: number;
  stages: UserJourneyStageItem[];
  executive_funnel_takeaway: string;
  reconstructed_at: string;
}

/**
 * Reconstruct interactive AI user journey funnel and drop-off analysis
 */
export async function getUserJourneyFunnel(
  campaignId?: string
): Promise<AiUserJourneyFunnelResponse> {
  const query = campaignId ? `?campaign_id=${encodeURIComponent(campaignId)}` : '';
  return apiClient<AiUserJourneyFunnelResponse>(`/api/founder/feedback/journey-funnel${query}`);
}

export interface FrustrationHeatmapSegment {
  timestamp_seconds: number;
  timestamp_display: string;
  frustration_intensity: number;
  sentiment: 'calm' | 'hesitant' | 'frustrated' | 'blocked';
  spoken_transcript: string;
  ui_friction_flag?: string | null;
}

export interface SynchronizedTelemetryEvent {
  timestamp_seconds: number;
  timestamp_display: string;
  event_type: 'console_error' | 'console_warn' | 'console_info' | 'network_request' | 'user_action' | string;
  level: 'error' | 'warn' | 'info';
  message: string;
  source_component?: string | null;
  http_status?: number | null;
  latency_ms?: number | null;
}

export interface AiVideoIntelligenceResponse {
  feedback_id: string;
  video_url: string;
  video_duration_seconds: number;
  total_segments: number;
  average_frustration_score: number;
  peak_frustration_timestamp: string;
  executive_voice_summary: string;
  segments: FrustrationHeatmapSegment[];
  telemetry_events?: SynchronizedTelemetryEvent[];
  analyzed_at: string;
}

/**
 * Generate multimodal video audio speech-to-text transcript and frustration heatmap
 */
export async function getVideoAiInsights(
  feedbackId: string
): Promise<AiVideoIntelligenceResponse> {
  return apiClient<AiVideoIntelligenceResponse>(
    `/api/founder/feedback/${feedbackId}/video-ai-insights`,
    {
      method: 'POST',
    }
  );
}

export interface AiRetestProtocolResponse {
  feedback_id: string;
  title: string;
  target_failure_condition: string;
  expected_resolution_state: string;
  regression_watchpoints: string[];
  verification_steps: string[];
  retest_instructions_markdown: string;
  generated_at: string;
}

export interface AiIssueExportResponse {
  feedback_id: string;
  title: string;
  labels: string[];
  severity: string;
  github_issue_url: string;
  linear_markdown: string;
  dev_brief_markdown: string;
  generated_at: string;
}

/**
 * Generate AI verification protocol and regression watchpoints for bug retesting
 */
export async function getRetestProtocol(
  feedbackId: string
): Promise<AiRetestProtocolResponse> {
  return apiClient<AiRetestProtocolResponse>(
    `/api/founder/feedback/${feedbackId}/retest-protocol`,
    {
      method: 'POST',
    }
  );
}

/**
 * Export AI-triaged bug report to GitHub Issues and Linear formatted templates
 */
export async function exportFeedbackTicket(
  feedbackId: string,
  targetRepo?: string
): Promise<AiIssueExportResponse> {
  const query = targetRepo ? `?target_repo=${encodeURIComponent(targetRepo)}` : '';
  return apiClient<AiIssueExportResponse>(
    `/api/founder/feedback/${feedbackId}/export-ticket${query}`,
    {
      method: 'POST',
    }
  );
}

export interface FeedbackQualityChecklistItem {
  criterion: string;
  passed: boolean;
  points: number;
  hint: string;
}

export interface FeedbackQualityEvaluationRequest {
  title: string;
  description: string;
  reproduction_steps?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  has_video?: boolean;
  feedback_type?: string;
}

export interface FeedbackQualityEvaluationResponse {
  score: number;
  quality_tier: 'needs_detail' | 'good' | 'stellar';
  summary_label: string;
  checklist: FeedbackQualityChecklistItem[];
  tips: string[];
}

export interface FeedbackPolishRequest {
  title: string;
  description: string;
  reproduction_steps?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  feedback_type?: string;
}

export interface FeedbackPolishResponse {
  polished_title: string;
  polished_description: string;
  polished_reproduction_steps: string;
  polished_expected_behavior: string;
  polished_actual_behavior: string;
  suggested_severity: 'low' | 'medium' | 'high' | 'critical';
  engine_used: string;
}

/**
 * Real-time AI quality scoring and checklist evaluation for tester feedback drafts
 */
export async function evaluateFeedbackQuality(
  payload: FeedbackQualityEvaluationRequest
): Promise<FeedbackQualityEvaluationResponse> {
  return apiClient<FeedbackQualityEvaluationResponse>(
    '/api/tester/feedback/quality-assessment',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Auto-polish rough tester draft into structured, engineer-ready reproduction steps
 */
export async function polishFeedbackReport(
  payload: FeedbackPolishRequest
): Promise<FeedbackPolishResponse> {
  return apiClient<FeedbackPolishResponse>(
    '/api/tester/feedback/polish-report',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export interface SyntheticSimulatedBug {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string;
  expected: string;
  actual: string;
}

export interface SyntheticPersonaFinding {
  persona_id: string;
  persona_name: string;
  persona_avatar: string;
  persona_role: string;
  mindset: string;
  overall_score: number;
  verdict: string;
  key_observations: string[];
  simulated_bug_report?: SyntheticSimulatedBug | null;
  actionable_recommendations: string[];
}

export interface SyntheticAuditResponse {
  campaign_id: string;
  campaign_title: string;
  readiness_score: number;
  personas: SyntheticPersonaFinding[];
  executive_summary: string;
  engine_used: string;
  generated_at: string;
}

/**
 * Execute instant 10-second pre-flight synthetic user testing audit using 3 AI personas
 */
export async function runSyntheticAudit(
  campaignId: string
): Promise<SyntheticAuditResponse> {
  return apiClient<SyntheticAuditResponse>(
    `/api/founder/campaigns/${campaignId}/synthetic-audit`,
    {
      method: 'POST',
      timeoutMs: 60000,
    }
  );
}

export interface HighestLeverageFixItem {
  id: string;
  title: string;
  severity: string;
  marginal_readiness_gain: number;
  marginal_mrr_protection: number;
  marginal_churn_reduction_pct: number;
}

export interface LaunchRoiSimulationRequest {
  campaign_id?: string | null;
  simulated_resolved_ids?: string[];
}

export interface LaunchRoiSimulationResponse {
  total_feedback_count: number;
  simulated_resolved_count: number;
  remaining_open_count: number;
  baseline_readiness_score: number;
  simulated_readiness_score: number;
  readiness_delta: number;
  baseline_revenue_risk_monthly: number;
  protected_revenue_monthly: number;
  remaining_revenue_risk_monthly: number;
  baseline_churn_rate_pct: number;
  simulated_churn_rate_pct: number;
  churn_reduction_pct: number;
  verdict: string;
  highest_leverage_next_fix?: HighestLeverageFixItem | null;
  strategic_advice: string;
}

/**
 * Run interactive What-If release simulation testing hypothetical bug fixes
 */
export async function simulateLaunchRoi(
  payload: LaunchRoiSimulationRequest
): Promise<LaunchRoiSimulationResponse> {
  return apiClient<LaunchRoiSimulationResponse>(
    '/api/founder/feedback/simulate-launch-roi',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 40000,
    }
  );
}

export interface ChangelogGenerateRequest {
  campaign_id?: string | null;
  version_tag?: string;
  selected_feedback_ids?: string[];
}

export interface ChangelogGenerateResponse {
  version_tag: string;
  campaign_title: string;
  total_items_synthesized: number;
  github_markdown: string;
  twitter_thread: string;
  product_hunt_blurb: string;
  engine_used: string;
  generated_at: string;
}

/**
 * Generate multi-channel public release notes and changelog
 */
export async function generateReleaseChangelog(
  payload: ChangelogGenerateRequest
): Promise<ChangelogGenerateResponse> {
  return apiClient<ChangelogGenerateResponse>(
    '/api/founder/feedback/generate-changelog',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 40000,
    }
  );
}

export interface ProofAttestationBadge {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'neutral' | string;
  explanation: string;
}

export interface AiProofAttestationResponse {
  feedback_id: string;
  compliance_score: number;
  human_interaction_score: number;
  overall_trust_score: number;
  fraud_risk: 'low' | 'medium' | 'high' | 'critical_bot' | string;
  trust_tier: string;
  payout_recommendation: string;
  payout_status: 'approve' | 'approve_partial' | 'hold' | 'reject' | string;
  attestation_badges: ProofAttestationBadge[];
  sentinel_audit_summary: string;
  engine_used: string;
  audited_at: string;
}

/**
 * Retrieve or trigger AI Tester Proof Attestation & Anti-Fraud Audit
 */
export async function getTesterProofAttestation(
  feedbackId: string
): Promise<AiProofAttestationResponse> {
  return apiClient<AiProofAttestationResponse>(
    `/api/founder/feedback/${feedbackId}/attestation-audit`,
    {
      method: 'GET',
    }
  );
}

export async function runTesterProofAttestation(
  feedbackId: string
): Promise<AiProofAttestationResponse> {
  return apiClient<AiProofAttestationResponse>(
    `/api/founder/feedback/${feedbackId}/attestation-audit`,
    {
      method: 'POST',
    }
  );
}

export interface FeedbackPayoutStatusResponse {
  feedback_id: string;
  is_disbursed: boolean;
  payout_id?: string | null;
  reference_id?: string | null;
  utr_number?: string | null;
  amount: number;
  currency: string;
  upi_id?: string | null;
  status?: string | null;
  disbursed_at?: string | null;
  digital_certificate_hash?: string | null;
  tester_name?: string | null;
  campaign_title?: string | null;
}

export interface FeedbackPayoutReleaseRequest {
  amount?: number;
  notes?: string;
  upi_id?: string;
}

/**
 * Fetch current payout & escrow status for a feedback submission
 */
export async function getFeedbackPayoutStatus(
  feedbackId: string
): Promise<FeedbackPayoutStatusResponse> {
  return apiClient<FeedbackPayoutStatusResponse>(
    `/api/founder/feedback/${feedbackId}/payout-status`,
    {
      method: 'GET',
    }
  );
}

/**
 * 1-Click Escrow Payout Disbursal to tester via AI Sentinel Attestation
 */
export async function releaseFeedbackPayout(
  feedbackId: string,
  payload: FeedbackPayoutReleaseRequest = {}
): Promise<FeedbackPayoutStatusResponse> {
  return apiClient<FeedbackPayoutStatusResponse>(
    `/api/founder/feedback/${feedbackId}/release-payout`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Fetch latest versioned campaign-wide intelligence synthesis
 */
export async function getCampaignAiSynthesis(
  campaignId: string
): Promise<CampaignAiSynthesis> {
  return apiClient<CampaignAiSynthesis>(
    `/api/founder/campaigns/${campaignId}/ai-synthesis`,
    {
      method: 'GET',
    }
  );
}

/**
 * Force manual resynthesis of campaign-wide intelligence
 */
export async function resynthesizeCampaignAi(
  campaignId: string
): Promise<CampaignAiSynthesis> {
  return apiClient<CampaignAiSynthesis>(
    `/api/founder/campaigns/${campaignId}/ai-synthesis/resynthesize`,
    {
      method: 'POST',
      timeoutMs: 40000,
    }
  );
}

/**
 * Fetch async background AI job status for an individual feedback item
 */
export async function getFeedbackAiJobStatus(
  feedbackId: string
): Promise<AIAnalysisJobStatus | null> {
  return apiClient<AIAnalysisJobStatus | null>(
    `/api/founder/feedback/${feedbackId}/ai-job-status`,
    {
      method: 'GET',
    }
  );
}


