/**
 * TryLo Campaign API Client & TypeScript Types
 */

import { apiClient } from './client';

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
