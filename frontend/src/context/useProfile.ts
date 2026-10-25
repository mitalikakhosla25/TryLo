import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateMyProfile,
  type ProfileMeResponse,
  type FounderProfileUpdateRequest,
  type TesterProfileUpdateRequest,
} from '../api/profile';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<ProfileMeResponse, Error>({
    queryKey: ['profile', user?.id],
    queryFn: getMyProfile,
    enabled: !!user,
    staleTime: 10000,
    retry: 1,
  });

  const mutation = useMutation<
    ProfileMeResponse,
    Error,
    FounderProfileUpdateRequest | TesterProfileUpdateRequest
  >({
    mutationFn: updateMyProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    profileData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
