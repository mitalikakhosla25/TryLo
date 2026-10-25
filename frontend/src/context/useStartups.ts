import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMyStartups,
  getStartup,
  createStartup,
  updateStartup,
  listPublicStartups,
  getPublicStartup,
  type Startup,
  type StartupPublic,
  type StartupPublicListResponse,
  type PublicStartupFilters,
  type StartupCreateRequest,
  type StartupUpdateRequest,
} from '../api/startups';
import { useAuth } from './useAuth';

export function useMyStartups() {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<Startup[], Error>({
    queryKey: ['startups', user?.id],
    queryFn: listMyStartups,
    enabled: !!user && isFounder,
    staleTime: 10000,
    retry: 1,
  });
}

export function useStartup(startupId: string | undefined) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<Startup, Error>({
    queryKey: ['startup', startupId],
    queryFn: () => getStartup(startupId!),
    enabled: !!user && isFounder && !!startupId,
    staleTime: 10000,
    retry: 1,
  });
}

export function usePublicStartups(filters?: PublicStartupFilters) {
  return useQuery<StartupPublicListResponse, Error>({
    queryKey: ['public-startups', filters?.state, filters?.page, filters?.page_size],
    queryFn: () => listPublicStartups(filters),
    staleTime: 30000,
    retry: 1,
  });
}

export function usePublicStartup(slug: string | undefined) {
  return useQuery<StartupPublic, Error>({
    queryKey: ['public-startup', slug],
    queryFn: () => getPublicStartup(slug!),
    enabled: !!slug,
    staleTime: 30000,
    retry: 1,
  });
}

export function useCreateStartup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Startup, Error, StartupCreateRequest>({
    mutationFn: createStartup,
    onSuccess: (newStartup) => {
      queryClient.setQueryData<Startup[]>(['startups', user?.id], (old) => {
        return old ? [newStartup, ...old] : [newStartup];
      });
      queryClient.invalidateQueries({ queryKey: ['startups', user?.id] });
    },
  });
}

export function useUpdateStartup(startupId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<Startup, Error, StartupUpdateRequest>({
    mutationFn: (payload) => updateStartup(startupId!, payload),
    onSuccess: (updatedStartup) => {
      queryClient.setQueryData(['startup', startupId], updatedStartup);
      queryClient.setQueryData<Startup[]>(['startups', user?.id], (old) => {
        if (!old) return [updatedStartup];
        return old.map((s) => (s.id === updatedStartup.id ? updatedStartup : s));
      });
      queryClient.invalidateQueries({ queryKey: ['startups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['startup', startupId] });
    },
  });
}

