/**
 * TryLo Escrow Vault and Simulated UPI Payout API Module
 */

import { apiClient, API_BASE_URL } from './client';

export interface EscrowAnalyticsResponse {
  campaign_id: string;
  total_funded: number;
  disbursed_amount: number;
  remaining_balance: number;
  burn_rate_pct: number;
  milestone_breakdown: Record<string, { count: number; amount: number }>;
  daily_velocity: Array<{ date: string; amount: number; count: number }>;
  payouts: PayoutResponse[];
}

export interface EscrowResponse {
  id: string;
  campaign_id: string;
  currency: string;
  total_funded: number;
  disbursed_amount: number;
  remaining_balance: number;
  status: 'unfunded' | 'funded' | 'depleted' | 'refunded' | string;
  deposit_reference?: string | null;
  funded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundEscrowRequest {
  amount: number;
  payment_method?: string;
  simulated_account?: string;
}

export interface DisbursePayoutRequest {
  tester_id: string;
  amount: number;
  upi_id?: string;
  milestone_type?: 'task_completion' | 'bug_bounty' | 'campaign_reward' | string;
  task_progress_id?: string;
  feedback_id?: string;
  notes?: string;
}

export interface PayoutResponse {
  id: string;
  campaign_id: string;
  campaign_title?: string | null;
  startup_name?: string | null;
  tester_id: string;
  tester_name?: string | null;
  amount: number;
  currency: string;
  upi_id: string;
  reference_id: string;
  utr_number: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed' | string;
  milestone_type: string;
  notes?: string | null;
  disbursed_at: string;
  created_at: string;
}

export interface TesterEarningsOverviewResponse {
  lifetime_earnings: number;
  completed_payouts_count: number;
  saved_upi_id?: string | null;
  payouts: PayoutResponse[];
}

export interface FounderEscrowOverviewResponse {
  total_escrow_funded: number;
  total_escrow_disbursed: number;
  total_escrow_remaining: number;
  active_escrow_campaigns_count: number;
  recent_disbursements: PayoutResponse[];
}

export interface UpdateUpiRequest {
  upi_id: string;
}

/**
 * Fetch escrow vault balance and status for a campaign.
 */
export async function getCampaignEscrow(campaignId: string): Promise<EscrowResponse> {
  return apiClient<EscrowResponse>(`/api/campaigns/${campaignId}/escrow`, {
    method: 'GET',
  });
}

/**
 * Deposit and lock funds into a campaign's escrow vault.
 */
export async function fundCampaignEscrow(
  campaignId: string,
  payload: FundEscrowRequest
): Promise<EscrowResponse> {
  return apiClient<EscrowResponse>(`/api/campaigns/${campaignId}/escrow/fund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Disburse instant simulated UPI reward to an accepted tester.
 */
export async function disbursePayout(
  campaignId: string,
  payload: DisbursePayoutRequest
): Promise<PayoutResponse> {
  return apiClient<PayoutResponse>(`/api/campaigns/${campaignId}/payouts/disburse`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch tester's lifetime earnings and UPI payout ledger.
 */
export async function getTesterEarnings(): Promise<TesterEarningsOverviewResponse> {
  return apiClient<TesterEarningsOverviewResponse>('/api/payouts/tester/my-earnings', {
    method: 'GET',
  });
}

/**
 * Update tester's primary UPI ID for instant rewards.
 */
export async function updateTesterUpi(
  payload: UpdateUpiRequest
): Promise<{ message: string; upi_id: string }> {
  return apiClient<{ message: string; upi_id: string }>('/api/payouts/tester/upi', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch founder portfolio escrow overview and recent disbursements.
 */
export async function getFounderEscrowOverview(): Promise<FounderEscrowOverviewResponse> {
  return apiClient<FounderEscrowOverviewResponse>('/api/founder/escrow/overview', {
    method: 'GET',
  });
}

/**
 * Fetch campaign escrow financial analytics, burn rate, and velocity chart data.
 */
export async function getCampaignEscrowAnalytics(campaignId: string): Promise<EscrowAnalyticsResponse> {
  return apiClient<EscrowAnalyticsResponse>(`/api/campaigns/${campaignId}/escrow/analytics`, {
    method: 'GET',
  });
}

/**
 * Download campaign financial payout audit ledger CSV.
 */
export async function downloadCampaignPayoutsCsv(campaignId: string, campaignSlug: string): Promise<void> {
  const url = `${API_BASE_URL}/api/campaigns/${campaignId}/export/payouts-csv`;
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to download payouts CSV');
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `trylo_payouts_${campaignSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Download founder portfolio financial payout audit ledger CSV.
 */
export async function downloadFounderPayoutsCsv(): Promise<void> {
  const url = `${API_BASE_URL}/api/founder/export/payouts-csv`;
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to download portfolio payouts CSV');
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `trylo_portfolio_payouts_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

