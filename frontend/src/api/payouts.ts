/**
 * TryLo Escrow Vault and Simulated UPI Payout API Module
 */

import { apiClient } from './client';

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
