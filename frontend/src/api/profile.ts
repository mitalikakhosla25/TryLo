/**
 * TryLo Profile API Client & Shared Types
 */

import { apiClient } from './client';

export type CompanyStage = 'Idea' | 'Prototype' | 'MVP' | 'Early Traction' | 'Growth';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export const COMPANY_STAGES: CompanyStage[] = [
  'Idea',
  'Prototype',
  'MVP',
  'Early Traction',
  'Growth',
];

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const SUGGESTED_SKILLS = [
  'UI/UX',
  'Frontend Development',
  'Backend Development',
  'AI/ML',
  'Manual Testing',
  'Automated Testing',
  'Security Testing',
  'Product Management',
  'Marketing & Growth',
  'Performance Testing',
];

export const SUGGESTED_INTERESTS = [
  'FinTech',
  'EdTech',
  'HealthTech',
  'Productivity',
  'E-commerce',
  'Developer Tools',
  'Artificial Intelligence',
  'Crypto / Web3',
  'Social & Community',
  'Gaming',
];

export const SUGGESTED_DEVICES = [
  'Web Browser',
  'iOS (iPhone)',
  'iOS (iPad)',
  'Android Phone',
  'Android Tablet',
  'macOS',
  'Windows',
  'Linux',
];

export interface FounderProfile {
  user_id: string;
  startup_name: string | null;
  professional_title: string | null;
  industry: string | null;
  company_stage: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  startup_description: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface TesterProfile {
  user_id: string;
  bio: string | null;
  skills: string[];
  interests: string[];
  experience_level: string | null;
  devices: string[];
  city: string | null;
  country: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileMeResponse {
  role: 'founder' | 'tester' | string;
  is_complete: boolean;
  profile: FounderProfile | TesterProfile | null;
}

export interface FounderProfileUpdateRequest {
  startup_name?: string | null;
  professional_title?: string | null;
  industry?: string | null;
  company_stage?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  startup_description?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface TesterProfileUpdateRequest {
  bio?: string | null;
  skills?: string[];
  interests?: string[];
  experience_level?: string | null;
  devices?: string[];
  city?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
}

/**
 * Fetch current user's profile and completion status.
 */
export async function getMyProfile(): Promise<ProfileMeResponse> {
  return apiClient<ProfileMeResponse>('/api/profiles/me', {
    method: 'GET',
  });
}

/**
 * Create or update current user's role-specific profile.
 */
export async function updateMyProfile(
  payload: FounderProfileUpdateRequest | TesterProfileUpdateRequest
): Promise<ProfileMeResponse> {
  return apiClient<ProfileMeResponse>('/api/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Validate URL string (optional or must be valid http/https URL)
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate LinkedIn URL string
 */
export function isValidLinkedInUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  if (!isValidUrl(url)) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}
