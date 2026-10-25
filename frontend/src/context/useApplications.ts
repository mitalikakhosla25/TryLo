import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMyApplications,
  getApplication,
  checkApplicationStatus,
  submitApplication,
  listCampaignApplications,
  listAllFounderApplications,
  getFounderApplicationDetail,
  acceptApplication,
  rejectApplication,
  getCampaignAccess,
  type CampaignApplication,
  type CampaignApplicationDetail,
  type ApplicationCreatePayload,
  type ApplicationStatusCheck,
  type FounderApplicationListResponse,
  type FounderApplicationDetail,
  type ApplicationStatusChangeResponse,
  type CampaignAccessInstructions,
} from '../api/applications';
import { useAuth } from './useAuth';

export function useMyApplications() {
  const { user } = useAuth();
  const isTester = user?.role === 'tester';

  return useQuery<CampaignApplicationDetail[], Error>({
    queryKey: ['applications', 'me', user?.id],
    queryFn: listMyApplications,
    enabled: !!user && isTester,
    staleTime: 15000,
    retry: 1,
  });
}

export function useApplication(applicationId: string | undefined) {
  const { user } = useAuth();
  const isTester = user?.role === 'tester';

  return useQuery<CampaignApplicationDetail, Error>({
    queryKey: ['application', applicationId],
    queryFn: () => getApplication(applicationId!),
    enabled: !!user && isTester && !!applicationId,
    staleTime: 15000,
    retry: 1,
  });
}

export function useApplicationStatus(campaignId: string | undefined) {
  const { user } = useAuth();
  const isTester = user?.role === 'tester';

  return useQuery<ApplicationStatusCheck, Error>({
    queryKey: ['application-status', campaignId, user?.id],
    queryFn: () => checkApplicationStatus(campaignId!),
    enabled: !!user && isTester && !!campaignId,
    staleTime: 15000,
    retry: false, // Don't aggressively retry if unapplied
  });
}

export function useSubmitApplication(campaignId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<CampaignApplication, Error, ApplicationCreatePayload>({
    mutationFn: (payload) => submitApplication(campaignId, payload),
    onSuccess: () => {
      // Invalidate relevant queries so UI immediately updates
      queryClient.invalidateQueries({ queryKey: ['application-status', campaignId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'me', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['public-campaigns'] });
    },
  });
}

export function useCampaignApplications(
  campaignId: string | undefined,
  filters?: { status?: string; search?: string; page?: number; page_size?: number }
) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<FounderApplicationListResponse, Error>({
    queryKey: ['campaign-applications', campaignId, filters],
    queryFn: () => listCampaignApplications(campaignId!, filters),
    enabled: !!user && isFounder && !!campaignId,
    staleTime: 5000,
    retry: 1,
  });
}

export function useFounderApplications(
  filters?: { status?: string; campaign_id?: string; search?: string; page?: number; page_size?: number }
) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<FounderApplicationListResponse, Error>({
    queryKey: ['founder-applications', filters],
    queryFn: () => listAllFounderApplications(filters),
    enabled: !!user && isFounder,
    staleTime: 5000,
    retry: 1,
  });
}

export function useFounderApplicationDetailQuery(applicationId: string | undefined) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<FounderApplicationDetail, Error>({
    queryKey: ['founder-application', applicationId],
    queryFn: () => getFounderApplicationDetail(applicationId!),
    enabled: !!user && isFounder && !!applicationId,
    staleTime: 5000,
    retry: 1,
  });
}

export function useAcceptApplication(campaignId?: string) {
  const queryClient = useQueryClient();

  return useMutation<ApplicationStatusChangeResponse, Error, string>({
    mutationFn: (applicationId: string) => acceptApplication(applicationId),
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaign-applications', campaignId] });
        queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      }
      queryClient.invalidateQueries({ queryKey: ['campaign-applications'] });
      queryClient.invalidateQueries({ queryKey: ['founder-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'me'] });
    },
  });
}

export function useRejectApplication(campaignId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationStatusChangeResponse,
    Error,
    { applicationId: string; rejectionNote?: string }
  >({
    mutationFn: ({ applicationId, rejectionNote }) =>
      rejectApplication(applicationId, rejectionNote),
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaign-applications', campaignId] });
        queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      }
      queryClient.invalidateQueries({ queryKey: ['campaign-applications'] });
      queryClient.invalidateQueries({ queryKey: ['founder-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'me'] });
    },
  });
}

export function useCampaignAccess(campaignId: string | undefined, enabled: boolean = false) {
  const { user } = useAuth();
  const isTester = user?.role === 'tester';

  return useQuery<CampaignAccessInstructions, Error>({
    queryKey: ['campaign-access', campaignId],
    queryFn: () => getCampaignAccess(campaignId!),
    enabled: !!user && isTester && !!campaignId && enabled,
    staleTime: 60000, // Safe query cache duration for active session
    retry: false,
  });
}

