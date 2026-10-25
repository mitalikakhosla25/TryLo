/**
 * TryLo Tester Task Execution & Feedback Submission API Client
 */

import { apiClient } from './client';

export type TaskProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type FeedbackType = 'general_feedback' | 'bug_report';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'submitted' | 'in_review' | 'resolved' | 'needs_retest';

export interface TestingTaskDetail {
  id: string;
  title: string;
  description?: string | null;
  expected_outcome?: string | null;
  estimated_duration?: string | null;
  is_required: boolean;
  order: number;
  status: TaskProgressStatus;
  completion_note?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface CampaignTasksResponse {
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_name: string;
  startup_slug: string;
  product_type?: string | null;
  product_url?: string | null;
  testing_start_date?: string | null;
  testing_end_date?: string | null;
  campaign_status: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  tasks: TestingTaskDetail[];
}

export interface TaskProgressUpdateRequest {
  status: TaskProgressStatus;
  completion_note?: string | null;
}

export interface TaskProgressResponse {
  id: string;
  campaign_id: string;
  task_id: string;
  tester_id: string;
  status: TaskProgressStatus;
  completion_note?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TesterCampaignAssignmentItem {
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_name: string;
  startup_slug: string;
  product_type?: string | null;
  testing_start_date?: string | null;
  testing_end_date?: string | null;
  campaign_status: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  assignment_status: 'not_started' | 'in_progress' | 'completed';
  accepted_at?: string | null;
}

export interface TesterTaskListResponse {
  total_campaigns: number;
  items: TesterCampaignAssignmentItem[];
}

export interface FeedbackCreateRequest {
  feedback_type: FeedbackType;
  title: string;
  description: string;
  task_id?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  reproduction_steps?: string | null;
  severity?: BugSeverity | null;
}

export interface FeedbackSubmissionResponse {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_name: string;
  startup_slug: string;
  tester_id: string;
  task_id?: string | null;
  task_title?: string | null;
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
}

export interface FeedbackListResponse {
  total: number;
  items: FeedbackSubmissionResponse[];
}

/**
 * Retrieve tasks and progress for a campaign (accepted tester only)
 */
export async function getCampaignTasks(campaignId: string): Promise<CampaignTasksResponse> {
  return apiClient<CampaignTasksResponse>(`/api/campaigns/${campaignId}/tasks`);
}

/**
 * Update task progress for a specific task
 */
export async function updateTaskProgress(
  campaignId: string,
  taskId: string,
  payload: TaskProgressUpdateRequest
): Promise<TaskProgressResponse> {
  return apiClient<TaskProgressResponse>(
    `/api/campaigns/${campaignId}/tasks/${taskId}/progress`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * List all campaign assignments for current tester
 */
export async function listTesterTasks(): Promise<TesterTaskListResponse> {
  return apiClient<TesterTaskListResponse>('/api/tester/tasks');
}

/**
 * Submit structured feedback or bug report
 */
export async function submitCampaignFeedback(
  campaignId: string,
  payload: FeedbackCreateRequest
): Promise<FeedbackSubmissionResponse> {
  return apiClient<FeedbackSubmissionResponse>(
    `/api/campaigns/${campaignId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * List tester's feedback submissions
 */
export async function listMyFeedback(
  campaignId?: string,
  feedbackType?: string
): Promise<FeedbackListResponse> {
  const params = new URLSearchParams();
  if (campaignId) params.append('campaign_id', campaignId);
  if (feedbackType) params.append('feedback_type', feedbackType);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<FeedbackListResponse>(`/api/feedback/me${query}`);
}

/**
 * Retrieve a single feedback submission by ID
 */
export async function getFeedbackDetail(feedbackId: string): Promise<FeedbackSubmissionResponse> {
  return apiClient<FeedbackSubmissionResponse>(`/api/feedback/${feedbackId}`);
}
