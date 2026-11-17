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
  analyzed_at: string;
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

/**
 * Send natural language query to TryLo Founder AI Co-Pilot
 */
export async function queryAiCopilot(
  payload: AiCopilotQueryRequest
): Promise<AiCopilotQueryResponse> {
  return apiClient<AiCopilotQueryResponse>('/api/founder/ai-copilot/query', {
    method: 'POST',
    body: JSON.stringify(payload),
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

export interface AiVideoIntelligenceResponse {
  feedback_id: string;
  video_url: string;
  video_duration_seconds: number;
  total_segments: number;
  average_frustration_score: number;
  peak_frustration_timestamp: string;
  executive_voice_summary: string;
  segments: FrustrationHeatmapSegment[];
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
