/**
 * TryLo Verification & Trust API Client
 * Anti-shell company employer proofs & verified tester credibility.
 */

import { apiClient } from './client';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface StartupVerification {
  id: string;
  startup_id: string;
  legal_entity_name: string;
  registration_type: string;
  registration_number: string;
  tax_identifier: string | null;
  document_url: string | null;
  document_name: string | null;
  corporate_email: string | null;
  is_corporate_email_verified: boolean;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartupVerificationSubmitRequest {
  legal_entity_name: string;
  registration_type: string;
  registration_number: string;
  tax_identifier?: string | null;
  document_url?: string | null;
  document_name?: string | null;
  corporate_email?: string | null;
}

export interface AtsBreakdown {
  structure: number;
  keywords: number;
  metrics: number;
  readability: number;
  keyword_categories?: Record<string, number>;
}

export interface AtsScorePreviewResponse {
  ats_score: number;
  is_latex_verified: boolean;
  breakdown: AtsBreakdown;
  feedback: string[];
  detected_keywords: string[];
  metrics_found: number;
}

export interface TesterResume {
  id: string;
  tester_id: string;
  resume_url: string | null;
  file_name: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  bug_bounty_url: string | null;
  specializations: string[];
  ats_score?: number | null;
  ats_breakdown?: AtsBreakdown | null;
  ats_feedback?: string[] | null;
  latex_source?: string | null;
  is_latex_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TesterResumeUpdateRequest {
  resume_url?: string | null;
  file_name?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  bug_bounty_url?: string | null;
  specializations?: string[];
  latex_source?: string | null;
}

export interface TesterCertification {
  id: string;
  tester_id: string;
  name: string;
  issuing_organization: string;
  credential_id: string | null;
  credential_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface TesterCertificationCreateRequest {
  name: string;
  issuing_organization: string;
  credential_id?: string | null;
  credential_url?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
}

export interface TesterEndorsement {
  id: string;
  tester_id: string;
  endorser_id: string;
  endorser_name?: string;
  skill_name: string;
  endorsement_note: string | null;
  created_at: string;
}

export interface TesterEmployerReview {
  id: string;
  tester_id: string;
  reviewer_id: string | null;
  campaign_id: string | null;
  reviewer_name: string;
  reviewer_title: string | null;
  company_name: string;
  overall_rating: number;
  thoroughness_rating: number | null;
  responsiveness_rating: number | null;
  bug_report_quality_rating: number | null;
  review_text: string;
  project_scope: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TesterEmployerReviewCreateRequest {
  campaign_id?: string | null;
  reviewer_name: string;
  reviewer_title?: string | null;
  company_name: string;
  overall_rating: number;
  thoroughness_rating?: number | null;
  responsiveness_rating?: number | null;
  bug_report_quality_rating?: number | null;
  review_text: string;
  project_scope?: string | null;
}

export interface TesterVerificationOverview {
  tester_id: string;
  verification_tier: number;
  tier_label: string;
  has_resume: boolean;
  ats_score?: number | null;
  is_latex_verified?: boolean;
  resume: TesterResume | null;
  certifications_count: number;
  certifications: TesterCertification[];
  endorsements_count: number;
  endorsements: TesterEndorsement[];
  reviews_count: number;
  average_rating: number;
  reviews: TesterEmployerReview[];
}

export const REGISTRATION_TYPES = [
  'Private Limited (Pvt Ltd)',
  'Limited Liability Company (LLC)',
  'Corporation (C-Corp / S-Corp)',
  'Limited Liability Partnership (LLP)',
  'Registered Sole Proprietorship',
  'Partnership Firm',
  'Other Recognized Legal Entity',
];

export const TESTER_SPECIALIZATIONS = [
  'Manual Functional Testing',
  'Automated Testing (Playwright/Cypress/Selenium)',
  'API & Backend Testing (Postman/REST/GraphQL)',
  'Mobile App Testing (iOS / Android)',
  'Performance & Load Testing (k6/JMeter)',
  'Security & Vulnerability Assessment',
  'Accessibility & WCAG Compliance',
  'Usability & UX Exploratory Testing',
];

// Startup Verification API Calls
export async function getStartupVerification(startupId: string): Promise<StartupVerification> {
  return apiClient<StartupVerification>(`/api/startups/${startupId}/verification`);
}

export async function submitStartupVerification(
  startupId: string,
  payload: StartupVerificationSubmitRequest
): Promise<StartupVerification> {
  return apiClient<StartupVerification>(`/api/startups/${startupId}/verification`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyCorporateEmail(
  startupId: string,
  payload: { corporate_email: string; otp_code?: string }
): Promise<StartupVerification> {
  return apiClient<StartupVerification>(`/api/startups/${startupId}/verification/verify-email`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reviewStartupVerification(
  startupId: string,
  payload: { verification_status: string; rejection_reason?: string }
): Promise<StartupVerification> {
  return apiClient<StartupVerification>(`/api/startups/${startupId}/verification/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Tester Verification API Calls
export async function getMyVerificationOverview(): Promise<TesterVerificationOverview> {
  return apiClient<TesterVerificationOverview>('/api/testers/me/overview');
}

export async function getTesterVerificationOverview(
  testerId: string
): Promise<TesterVerificationOverview> {
  return apiClient<TesterVerificationOverview>(`/api/testers/${testerId}/overview`);
}

export async function updateTesterResume(
  payload: TesterResumeUpdateRequest
): Promise<TesterResume> {
  return apiClient<TesterResume>('/api/testers/me/resume', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function previewAtsScore(
  latex_source: string
): Promise<AtsScorePreviewResponse> {
  return apiClient<AtsScorePreviewResponse>('/api/testers/me/resume/ats-preview', {
    method: 'POST',
    body: JSON.stringify({ latex_source }),
  });
}

export async function addTesterCertification(
  payload: TesterCertificationCreateRequest
): Promise<TesterCertification> {
  return apiClient<TesterCertification>('/api/testers/me/certifications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteTesterCertification(certId: string): Promise<void> {
  return apiClient<void>(`/api/testers/me/certifications/${certId}`, {
    method: 'DELETE',
  });
}

export async function endorseTesterSkill(
  testerId: string,
  payload: { skill_name: string; endorsement_note?: string }
): Promise<TesterEndorsement> {
  return apiClient<TesterEndorsement>(`/api/testers/${testerId}/endorse`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createTesterReview(
  testerId: string,
  payload: TesterEmployerReviewCreateRequest
): Promise<TesterEmployerReview> {
  return apiClient<TesterEmployerReview>(`/api/testers/${testerId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listTesterReviews(testerId: string): Promise<TesterEmployerReview[]> {
  return apiClient<TesterEmployerReview[]>(`/api/testers/${testerId}/reviews`);
}

