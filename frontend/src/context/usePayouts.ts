/**
 * React Query Hooks for TryLo Escrow Vault and Simulated UPI Payouts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaignEscrow,
  fundCampaignEscrow,
  disbursePayout,
  getTesterEarnings,
  updateTesterUpi,
  getFounderEscrowOverview,
  getCampaignEscrowAnalytics,
  type EscrowResponse,
  type FundEscrowRequest,
  type DisbursePayoutRequest,
  type PayoutResponse,
  type TesterEarningsOverviewResponse,
  type FounderEscrowOverviewResponse,
  type UpdateUpiRequest,
  type EscrowAnalyticsResponse,
} from '../api/payouts';
import { useAuth } from './useAuth';

export function useCampaignEscrow(campaignId?: string) {
  return useQuery<EscrowResponse, Error>({
    queryKey: ['campaign-escrow', campaignId],
    queryFn: () => getCampaignEscrow(campaignId!),
    enabled: Boolean(campaignId),
    staleTime: 10000,
  });
}

export function useFundCampaignEscrow(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<EscrowResponse, Error, FundEscrowRequest>({
    mutationFn: (payload) => fundCampaignEscrow(campaignId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['founder-escrow-overview'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-analytics', campaignId] });
    },
  });
}

export function useDisbursePayout(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation<PayoutResponse, Error, DisbursePayoutRequest>({
    mutationFn: (payload) => disbursePayout(campaignId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['founder-escrow-overview'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-analytics', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['tester-earnings'] });
    },
  });
}

export function useTesterEarnings() {
  const { user } = useAuth();
  return useQuery<TesterEarningsOverviewResponse, Error>({
    queryKey: ['tester-earnings', user?.id],
    queryFn: getTesterEarnings,
    enabled: user?.role === 'tester',
    staleTime: 10000,
  });
}

export function useUpdateTesterUpi() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<{ message: string; upi_id: string }, Error, UpdateUpiRequest>({
    mutationFn: updateTesterUpi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-earnings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useFounderEscrowOverview() {
  const { user } = useAuth();
  return useQuery<FounderEscrowOverviewResponse, Error>({
    queryKey: ['founder-escrow-overview', user?.id],
    queryFn: getFounderEscrowOverview,
    enabled: user?.role === 'founder',
    staleTime: 10000,
  });
}

export function useCampaignEscrowAnalytics(campaignId?: string) {
  return useQuery<EscrowAnalyticsResponse, Error>({
    queryKey: ['campaign-escrow-analytics', campaignId],
    queryFn: () => getCampaignEscrowAnalytics(campaignId!),
    enabled: Boolean(campaignId),
    staleTime: 10000,
  });
}

