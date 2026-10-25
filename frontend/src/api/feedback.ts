/**
 * TryLo Founder Feedback & Issue Management API Client
 */

import { apiClient } from './client';
import type { FeedbackStatus, FeedbackType, BugSeverity } from './tasks';

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
  task_id?: string | null;
  task_title?: string | null;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  severity?: BugSeverity | null;
  status: FeedbackStatus;
  retest_instructions?: string | null;
  resolution_notes?: string | null;
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
  created_at: string;
  updated_at: string;
  internal_notes: FeedbackInternalNote[];
  status_history: FeedbackStatusHistory[];
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
