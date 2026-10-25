import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listStartupCampaigns,
  listMyCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  publishCampaign,
  closeCampaign,
  getPublicCampaignById,
  getPublicCampaignBySlug,
  listPublicCampaigns,
  type Campaign,
  type CampaignPublic,
  type CampaignPublicListResponse,
  type PublicCampaignFilters,
  type CampaignCreatePayload,
  type CampaignUpdatePayload,
} from '../api/campaigns';
import { useAuth } from './useAuth';

export function useStartupCampaigns(startupId: string | undefined) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<Campaign[], Error>({
    queryKey: ['campaigns', 'startup', startupId],
    queryFn: () => listStartupCampaigns(startupId!),
    enabled: !!user && isFounder && !!startupId,
    staleTime: 10000,
    retry: 1,
  });
}

export function useMyCampaigns() {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<Campaign[], Error>({
    queryKey: ['campaigns', 'my', user?.id],
    queryFn: listMyCampaigns,
    enabled: !!user && isFounder,
    staleTime: 10000,
    retry: 1,
  });
}

export function useCampaign(campaignId: string | undefined) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<Campaign, Error>({
    queryKey: ['campaign', campaignId],
    queryFn: () => getCampaign(campaignId!),
    enabled: !!user && isFounder && !!campaignId,
    staleTime: 10000,
    retry: 1,
  });
}

export function usePublicCampaignById(campaignId: string | undefined) {
  return useQuery<CampaignPublic, Error>({
    queryKey: ['public-campaign', 'id', campaignId],
    queryFn: () => getPublicCampaignById(campaignId!),
    enabled: !!campaignId,
    staleTime: 30000,
    retry: 1,
  });
}

export function usePublicCampaignBySlug(
  startupSlug: string | undefined,
  campaignSlug: string | undefined
) {
  return useQuery<CampaignPublic, Error>({
    queryKey: ['public-campaign', 'slug', startupSlug, campaignSlug],
    queryFn: () => getPublicCampaignBySlug(startupSlug!, campaignSlug!),
    enabled: !!startupSlug && !!campaignSlug,
    staleTime: 30000,
    retry: 1,
  });
}

export function usePublicCampaigns(filters?: PublicCampaignFilters) {
  return useQuery<CampaignPublicListResponse, Error>({
    queryKey: ['public-campaigns', filters],
    queryFn: () => listPublicCampaigns(filters),
    staleTime: 15000,
    retry: 1,
  });
}

export function useCreateCampaign(startupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, CampaignCreatePayload>({
    mutationFn: (payload) => createCampaign(startupId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'startup', startupId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'my'] });
    },
  });
}

export function useUpdateCampaign(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, CampaignUpdatePayload>({
    mutationFn: (payload) => updateCampaign(campaignId!, payload),
    onSuccess: (updatedCampaign) => {
      queryClient.setQueryData(['campaign', campaignId], updatedCampaign);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'startup', updatedCampaign.startup_id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
}

export function useDeleteCampaign(startupId?: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (campaignId) => deleteCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.removeQueries({ queryKey: ['campaign', campaignId] });
      if (startupId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', 'startup', startupId] });
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'my'] });
    },
  });
}

export function usePublishCampaign(defaultCampaignId?: string) {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string | void>({
    mutationFn: (targetId) => {
      const id = typeof targetId === 'string' && targetId ? targetId : defaultCampaignId;
      if (!id) throw new Error('Campaign ID is required to publish.');
      return publishCampaign(id);
    },
    onSuccess: (published) => {
      queryClient.setQueryData(['campaign', published.id], published);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'startup', published.startup_id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', published.id] });
    },
  });
}

export function useCloseCampaign(defaultCampaignId?: string) {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string | void>({
    mutationFn: (targetId) => {
      const id = typeof targetId === 'string' && targetId ? targetId : defaultCampaignId;
      if (!id) throw new Error('Campaign ID is required to close.');
      return closeCampaign(id);
    },
    onSuccess: (closed) => {
      queryClient.setQueryData(['campaign', closed.id], closed);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'startup', closed.startup_id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', closed.id] });
    },
  });
}
