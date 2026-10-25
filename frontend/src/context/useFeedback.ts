import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listFounderFeedback,
  getFounderFeedbackDetail,
  updateFeedbackStatus,
  addFeedbackInternalNote,
  type FounderFeedbackFilters,
  type FounderFeedbackListResponse,
  type FounderFeedbackDetail,
  type FeedbackStatusUpdateRequest,
  type FeedbackInternalNote,
} from '../api/feedback';
import { useAuth } from './useAuth';

export function useFounderFeedback(filters?: FounderFeedbackFilters) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<FounderFeedbackListResponse, Error>({
    queryKey: ['founder-feedback', filters],
    queryFn: () => listFounderFeedback(filters),
    enabled: !!user && isFounder,
    staleTime: 10000,
    retry: 1,
  });
}

export function useFounderFeedbackDetail(feedbackId: string | undefined) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<FounderFeedbackDetail, Error>({
    queryKey: ['founder-feedback-detail', feedbackId],
    queryFn: () => getFounderFeedbackDetail(feedbackId!),
    enabled: !!user && isFounder && !!feedbackId,
    staleTime: 10000,
    retry: 1,
  });
}

export function useUpdateFeedbackStatus(feedbackId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    FounderFeedbackDetail,
    Error,
    { feedbackId: string; payload: FeedbackStatusUpdateRequest }
  >({
    mutationFn: ({ feedbackId: targetId, payload }) =>
      updateFeedbackStatus(targetId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['founder-feedback'] });
      queryClient.invalidateQueries({
        queryKey: ['founder-feedback-detail', variables.feedbackId || feedbackId],
      });
      // Also invalidate tester feedback queries in case tester is active
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
    },
  });
}

export function useAddFeedbackInternalNote(feedbackId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    FeedbackInternalNote,
    Error,
    { feedbackId: string; body: string }
  >({
    mutationFn: ({ feedbackId: targetId, body }) =>
      addFeedbackInternalNote(targetId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['founder-feedback-detail', variables.feedbackId || feedbackId],
      });
      queryClient.invalidateQueries({ queryKey: ['founder-feedback'] });
    },
  });
}
