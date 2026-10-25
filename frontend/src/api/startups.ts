/**
 * TryLo Startup API Client & TypeScript Types
 */

import { apiClient } from './client';
import type { CompanyStage } from './profile';

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianStateOrUT = (typeof INDIAN_STATES_AND_UTS)[number];

export interface Startup {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  company_stage: CompanyStage | string | null;
  website_url: string | null;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  founded_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface StartupPublic {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  company_stage: CompanyStage | string | null;
  website_url: string | null;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  founded_year: number | null;
  created_at: string;
  campaign_count?: number;
}

export interface StartupCreateRequest {
  name: string;
  tagline?: string | null;
  description?: string | null;
  industry?: string | null;
  company_stage?: CompanyStage | string | null;
  website_url?: string | null;
  logo_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  founded_year?: number | null;
}

export interface StartupUpdateRequest {
  name?: string;
  tagline?: string | null;
  description?: string | null;
  industry?: string | null;
  company_stage?: CompanyStage | string | null;
  website_url?: string | null;
  logo_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  founded_year?: number | null;
}

export interface StartupPublicListResponse {
  items: StartupPublic[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  state_counts: Record<string, number>;
}

export interface PublicStartupFilters {
  state?: string;
  page?: number;
  page_size?: number;
}

/**
 * List all startups owned by the authenticated founder.
 */
export async function listMyStartups(): Promise<Startup[]> {
  return apiClient<Startup[]>('/api/startups', {
    method: 'GET',
  });
}

/**
 * Retrieve a single startup owned by the authenticated founder by ID.
 */
export async function getStartup(startupId: string): Promise<Startup> {
  return apiClient<Startup>(`/api/startups/${startupId}`, {
    method: 'GET',
  });
}

/**
 * Create a new startup owned by the authenticated founder.
 */
export async function createStartup(payload: StartupCreateRequest): Promise<Startup> {
  return apiClient<Startup>('/api/startups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing startup owned by the authenticated founder.
 */
export async function updateStartup(
  startupId: string,
  payload: StartupUpdateRequest
): Promise<Startup> {
  return apiClient<Startup>(`/api/startups/${startupId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Public discovery endpoint: fetch public startup details by public slug without authentication.
 */
export async function getPublicStartup(slug: string): Promise<StartupPublic> {
  return apiClient<StartupPublic>(`/api/startups/public/${slug}`, {
    method: 'GET',
  });
}

/**
 * Public discovery endpoint: list startups with optional state filtering, pagination, and state counts.
 */
export async function listPublicStartups(
  filters?: PublicStartupFilters
): Promise<StartupPublicListResponse> {
  const params = new URLSearchParams();
  if (filters?.state?.trim()) params.append('state', filters.state.trim());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.page_size) params.append('page_size', filters.page_size.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient<StartupPublicListResponse>(`/api/public/startups${query}`, {
    method: 'GET',
  });
}
