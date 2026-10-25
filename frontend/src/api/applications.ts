/**
 * TryLo Applications API Client & TypeScript Types
 */

import { apiClient } from './client';
import type { RewardType } from './campaigns';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface CampaignApplication {
  id: string;
  campaign_id: string;
  tester_id: string;
  status: ApplicationStatus;
  screening_answers: Record<string, string | boolean | number>;
  motivation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignApplicationDetail extends CampaignApplication {
  campaign_title: string;
  campaign_slug: string;
  campaign_summary?: string | null;
  campaign_product_type?: string | null;
  startup_name: string;
  startup_slug: string;
  startup_logo_url?: string | null;
  reward_type: RewardType | string;
  reward_amount?: number | null;
  reward_currency?: string | null;
  reward_description?: string | null;
  testing_start_date?: string | null;
  testing_end_date?: string | null;
  application_deadline?: string | null;
}

export interface ApplicationCreatePayload {
  screening_answers: Record<string, string | boolean | number>;
  motivation?: string | null;
}

export interface ApplicationStatusCheck {
  applied: boolean;
  application?: CampaignApplication | null;
}

/**
 * Submit an application to a published campaign.
 */
export async function submitApplication(
  campaignId: string,
  payload: ApplicationCreatePayload
): Promise<CampaignApplication> {
  return apiClient<CampaignApplication>(`/api/campaigns/${campaignId}/applications`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * List all applications submitted by the current tester.
 */
export async function listMyApplications(): Promise<CampaignApplicationDetail[]> {
  return apiClient<CampaignApplicationDetail[]>('/api/applications/me', {
    method: 'GET',
  });
}

/**
 * Retrieve one of the current tester's applications by ID.
 */
export async function getApplication(
  applicationId: string
): Promise<CampaignApplicationDetail> {
  return apiClient<CampaignApplicationDetail>(`/api/applications/${applicationId}`, {
    method: 'GET',
  });
}

/**
 * Check whether the current tester has applied to a campaign.
 */
export async function checkApplicationStatus(
  campaignId: string
): Promise<ApplicationStatusCheck> {
  return apiClient<ApplicationStatusCheck>(
    `/api/campaigns/${campaignId}/application-status`,
    {
      method: 'GET',
    }
  );
}

export interface TesterPublicProfile {
  user_id: string;
  full_name: string;
  bio?: string | null;
  skills: string[];
  interests: string[];
  experience_level?: string | null;
  devices: string[];
  city?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
}

export interface FounderApplicationItem {
  id: string;
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string;
  startup_id: string;
  startup_name: string;
  startup_slug: string;
  tester_id: string;
  tester: TesterPublicProfile;
  status: ApplicationStatus;
  screening_answers: Record<string, string | boolean | number>;
  motivation?: string | null;
  rejection_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FounderApplicationListResponse {
  items: FounderApplicationItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  accepted_testers: number;
  max_testers?: number | null;
  is_full: boolean;
}

export interface FounderApplicationDetail extends FounderApplicationItem {
  campaign_status: string;
  screening_questions: Array<{
    id: string;
    prompt: string;
    question_type: string;
    is_required: boolean;
    options?: string[];
  }>;
  accepted_testers: number;
  max_testers?: number | null;
  is_full: boolean;
}

export interface ApplicationStatusChangeResponse {
  id: string;
  campaign_id: string;
  tester_id: string;
  status: ApplicationStatus;
  rejection_note?: string | null;
  accepted_testers: number;
  max_testers?: number | null;
  is_full: boolean;
  updated_at: string;
}

export interface CampaignAccessInstructions {
  campaign_id: string;
  title: string;
  access_instructions?: string | null;
  product_url?: string | null;
}

/**
 * List applications for a specific campaign (founder only).
 */
export async function listCampaignApplications(
  campaignId: string,
  params?: { status?: string; search?: string; page?: number; page_size?: number }
): Promise<FounderApplicationListResponse> {
  const q = new URLSearchParams();
  if (params?.status && params.status !== 'all') q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.page_size) q.set('page_size', String(params.page_size));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return apiClient<FounderApplicationListResponse>(
    `/api/campaigns/${campaignId}/applications${qs}`,
    {
      method: 'GET',
    }
  );
}

/**
 * List applications across all founder campaigns.
 */
export async function listAllFounderApplications(
  params?: { status?: string; campaign_id?: string; search?: string; page?: number; page_size?: number }
): Promise<FounderApplicationListResponse> {
  const q = new URLSearchParams();
  if (params?.status && params.status !== 'all') q.set('status', params.status);
  if (params?.campaign_id) q.set('campaign_id', params.campaign_id);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.page_size) q.set('page_size', String(params.page_size));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return apiClient<FounderApplicationListResponse>(`/api/founder/applications${qs}`, {
    method: 'GET',
  });
}

/**
 * Retrieve detailed applicant evaluation data for a founder.
 */
export async function getFounderApplicationDetail(
  applicationId: string
): Promise<FounderApplicationDetail> {
  return apiClient<FounderApplicationDetail>(`/api/founder/applications/${applicationId}`, {
    method: 'GET',
  });
}

/**
 * Accept a pending application.
 */
export async function acceptApplication(
  applicationId: string
): Promise<ApplicationStatusChangeResponse> {
  return apiClient<ApplicationStatusChangeResponse>(
    `/api/founder/applications/${applicationId}/accept`,
    {
      method: 'POST',
    }
  );
}

/**
 * Reject a pending application with optional internal note.
 */
export async function rejectApplication(
  applicationId: string,
  rejectionNote?: string
): Promise<ApplicationStatusChangeResponse> {
  return apiClient<ApplicationStatusChangeResponse>(
    `/api/founder/applications/${applicationId}/reject`,
    {
      method: 'POST',
      body: rejectionNote ? JSON.stringify({ rejection_note: rejectionNote }) : undefined,
    }
  );
}

/**
 * Retrieve private access instructions for an accepted tester.
 */
export async function getCampaignAccess(
  campaignId: string
): Promise<CampaignAccessInstructions> {
  return apiClient<CampaignAccessInstructions>(`/api/campaigns/${campaignId}/access`, {
    method: 'GET',
  });
}

