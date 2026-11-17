/**
 * TryLo Campaign API Client & TypeScript Types
 */

import { apiClient, API_BASE_URL } from './client';

export type RewardType = 'unpaid' | 'monetary' | 'perk';
export type CampaignStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface TestingTask {
  id?: string;
  title: string;
  description?: string | null;
  is_required?: boolean;
  order?: number;
}

export interface TargetAudience {
  skills?: string[];
  interests?: string[];
  experience_level?: string | null;
  devices?: string[];
  countries?: string[];
  min_age?: number | null;
  notes?: string | null;
}

export type QuestionType = 'text' | 'single_choice' | 'boolean';

export interface ScreeningQuestion {
  id: string;
  prompt: string;
  question_type: QuestionType | string;
  is_required: boolean;
  options?: string[];
}

export interface Campaign {
  id: string;
  startup_id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  product_type: string | null;
  product_url: string | null;
  access_instructions: string | null;
  testing_tasks: TestingTask[];
  target_audience: TargetAudience;
  screening_questions?: ScreeningQuestion[];
  max_testers: number | null;
  application_deadline: string | null;
  testing_start_date: string | null;
  testing_end_date: string | null;
  reward_type: RewardType | string;
  reward_amount: number | null;
  reward_currency: string | null;
  reward_description: string | null;
  reward_eligibility: string | null;
  status: CampaignStatus | string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPublic {
  id: string;
  startup_id: string;
  startup_name: string;
  startup_slug: string;
  startup_logo_url: string | null;
  startup_is_verified?: boolean;
  startup_verification_status?: string;
  startup?: {
    is_verified?: boolean;
    verification_status?: string;
  };
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  product_type: string | null;
  product_url: string | null;
  testing_tasks: TestingTask[];
  target_audience: TargetAudience;
  screening_questions?: ScreeningQuestion[];
  max_testers: number | null;
  application_deadline: string | null;
  testing_start_date: string | null;
  testing_end_date: string | null;
  reward_type: RewardType | string;
  reward_amount: number | null;
  reward_currency: string | null;
  reward_description: string | null;
  reward_eligibility: string | null;
  status: CampaignStatus | string;
  published_at: string | null;
  created_at: string;
}

export interface CampaignCreatePayload {
  title: string;
  summary?: string | null;
  description?: string | null;
  product_type?: string | null;
  product_url?: string | null;
  access_instructions?: string | null;
  testing_tasks?: TestingTask[];
  target_audience?: TargetAudience;
  screening_questions?: ScreeningQuestion[];
  max_testers?: number | null;
  application_deadline?: string | null;
  testing_start_date?: string | null;
  testing_end_date?: string | null;
  reward_type?: RewardType | string;
  reward_amount?: number | null;
  reward_currency?: string | null;
  reward_description?: string | null;
  reward_eligibility?: string | null;
}

export interface CampaignUpdatePayload {
  title?: string;
  summary?: string | null;
  description?: string | null;
  product_type?: string | null;
  product_url?: string | null;
  access_instructions?: string | null;
  testing_tasks?: TestingTask[];
  target_audience?: TargetAudience;
  screening_questions?: ScreeningQuestion[];
  max_testers?: number | null;
  application_deadline?: string | null;
  testing_start_date?: string | null;
  testing_end_date?: string | null;
  reward_type?: RewardType | string;
  reward_amount?: number | null;
  reward_currency?: string | null;
  reward_description?: string | null;
  reward_eligibility?: string | null;
}

/**
 * List all campaigns for a specific startup owned by current founder.
 */
export async function listStartupCampaigns(startupId: string): Promise<Campaign[]> {
  return apiClient<Campaign[]>(`/api/startups/${startupId}/campaigns`, {
    method: 'GET',
  });
}

/**
 * List all campaigns owned by current founder across all their startups.
 */
export async function listMyCampaigns(): Promise<Campaign[]> {
  return apiClient<Campaign[]>('/api/campaigns', {
    method: 'GET',
  });
}

/**
 * Retrieve a single campaign owned by current founder by ID.
 */
export async function getCampaign(campaignId: string): Promise<Campaign> {
  return apiClient<Campaign>(`/api/campaigns/${campaignId}`, {
    method: 'GET',
  });
}

/**
 * Create a new campaign draft under an owned startup.
 */
export async function createCampaign(
  startupId: string,
  payload: CampaignCreatePayload
): Promise<Campaign> {
  return apiClient<Campaign>(`/api/startups/${startupId}/campaigns`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing owned campaign draft or editable campaign.
 */
export async function updateCampaign(
  campaignId: string,
  payload: CampaignUpdatePayload
): Promise<Campaign> {
  return apiClient<Campaign>(`/api/campaigns/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a draft campaign.
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  return apiClient<void>(`/api/campaigns/${campaignId}`, {
    method: 'DELETE',
  });
}

/**
 * Validate and publish an owned campaign draft.
 */
export async function publishCampaign(campaignId: string): Promise<Campaign> {
  return apiClient<Campaign>(`/api/campaigns/${campaignId}/publish`, {
    method: 'POST',
  });
}

/**
 * Close a published campaign.
 */
export async function closeCampaign(campaignId: string): Promise<Campaign> {
  return apiClient<Campaign>(`/api/campaigns/${campaignId}/close`, {
    method: 'POST',
  });
}

export interface CampaignPublicListResponse {
  items: CampaignPublic[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PublicCampaignFilters {
  q?: string;
  category?: string;
  reward_type?: string;
  experience_level?: string;
  device?: string;
  country?: string;
  sort?: 'newest' | 'deadline';
  page?: number;
  page_size?: number;
}

/**
 * Public discovery endpoint: fetch public published campaign by ID.
 */
export async function getPublicCampaignById(campaignId: string): Promise<CampaignPublic> {
  return apiClient<CampaignPublic>(`/api/campaigns/public/${campaignId}`, {
    method: 'GET',
  });
}

/**
 * Public discovery endpoint: fetch public published campaign by startup and campaign slug.
 */
export async function getPublicCampaignBySlug(
  startupSlug: string,
  campaignSlug: string
): Promise<CampaignPublic> {
  return apiClient<CampaignPublic>(`/api/campaigns/public/${startupSlug}/${campaignSlug}`, {
    method: 'GET',
  });
}

/**
 * Public discovery endpoint: list and filter active published campaigns with search and pagination.
 */
export async function listPublicCampaigns(
  filters?: PublicCampaignFilters
): Promise<CampaignPublicListResponse> {
  const params = new URLSearchParams();
  if (filters?.q?.trim()) params.append('q', filters.q.trim());
  if (filters?.category?.trim()) params.append('category', filters.category.trim());
  if (filters?.reward_type?.trim()) params.append('reward_type', filters.reward_type.trim());
  if (filters?.experience_level?.trim()) params.append('experience_level', filters.experience_level.trim());
  if (filters?.device?.trim()) params.append('device', filters.device.trim());
  if (filters?.country?.trim()) params.append('country', filters.country.trim());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.page_size) params.append('page_size', filters.page_size.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiClient<CampaignPublicListResponse>(`/api/public/campaigns${queryString}`, {
    method: 'GET',
  });
}

// ==============================================================================
// Founder Intelligence & Analytics Types & Endpoints (Version 2)
// ==============================================================================

export interface FunnelMetrics {
  applicants_total: number;
  applicants_accepted: number;
  applicants_pending: number;
  applicants_rejected: number;
  testers_in_progress: number;
  testers_completed: number;
  acceptance_rate: number;
  completion_rate: number;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total_bugs: number;
  resolution_rate: number;
  resolved_count: number;
  open_count: number;
}

export interface DeviceMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface TaskCompletionMetric {
  task_id: string;
  title: string;
  is_required: boolean;
  completed_count: number;
  in_progress_count: number;
  completion_percentage: number;
}

export interface CampaignAnalytics {
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_name: string;
  startup_slug: string;
  status: string;
  product_type: string | null;
  quota_target: number;
  quota_filled: number;
  quota_percentage: number;
  total_reward_allocated: number;
  total_reward_currency: string;
  reward_per_tester: number;
  payout_disbursed: number;
  payout_pending: number;
  funnel: FunnelMetrics;
  severity: SeverityBreakdown;
  feedback_types: Record<string, number>;
  device_matrix: DeviceMetric[];
  os_matrix: DeviceMetric[];
  browser_matrix: DeviceMetric[];
  task_velocity: TaskCompletionMetric[];
  average_ats_score: number | null;
  dpiit_registered: boolean;
  cin_number: string | null;
  generated_at: string;
}

export interface FounderAnalyticsOverview {
  total_campaigns: number;
  active_campaigns: number;
  total_testers_engaged: number;
  total_bugs_reported: number;
  critical_bugs_count: number;
  overall_resolution_rate: number;
  total_payout_pool: number;
  average_tester_ats: number;
  top_performing_campaigns: {
    id: string;
    title: string;
    status: string;
    testers_count: number;
    bugs_count: number;
  }[];
}

/**
 * Fetch detailed QA intelligence, funnel, and environment metrics for a campaign.
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  return apiClient<CampaignAnalytics>(`/api/campaigns/${campaignId}/analytics`, {
    method: 'GET',
  });
}

/**
 * Fetch macro founder intelligence overview across all owned campaigns.
 */
export async function getFounderAnalyticsOverview(): Promise<FounderAnalyticsOverview> {
  return apiClient<FounderAnalyticsOverview>('/api/founder/analytics/overview', {
    method: 'GET',
  });
}

/**
 * Download the comprehensive campaign QA audit and compliance summary in CSV format.
 */
export async function downloadCampaignAuditCsv(campaignId: string, campaignSlug: string): Promise<void> {
  const url = `${API_BASE_URL}/api/campaigns/${campaignId}/export/audit-summary`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to export campaign audit summary');
  }
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `TryLo_Audit_Summary_${campaignSlug || 'campaign'}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}
