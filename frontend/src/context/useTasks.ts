/**
 * TanStack Query hooks for Tester Task Execution and Feedback Submission
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCampaignTasks,
  updateTaskProgress,
  listTesterTasks,
  submitCampaignFeedback,
  listMyFeedback,
  getFeedbackDetail,
  type TaskProgressUpdateRequest,
  type FeedbackCreateRequest,
} from '../api/tasks';

export function useTesterTasks() {
  return useQuery({
    queryKey: ['tester-tasks'],
    queryFn: listTesterTasks,
  });
}

export function useCampaignTasks(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-tasks', campaignId],
    queryFn: () => getCampaignTasks(campaignId!),
    enabled: Boolean(campaignId),
  });
}

export function useUpdateTaskProgress(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: TaskProgressUpdateRequest }) =>
      updateTaskProgress(campaignId!, taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['tester-tasks'] });
    },
  });
}

export function useSubmitFeedback(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FeedbackCreateRequest) => submitCampaignFeedback(campaignId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-tasks', campaignId] });
    },
  });
}

export function useMyFeedback(campaignId?: string, feedbackType?: string) {
  return useQuery({
    queryKey: ['tester-feedback', campaignId, feedbackType],
    queryFn: () => listMyFeedback(campaignId, feedbackType),
  });
}

export function useFeedbackDetail(feedbackId: string | undefined) {
  return useQuery({
    queryKey: ['feedback-detail', feedbackId],
    queryFn: () => getFeedbackDetail(feedbackId!),
    enabled: Boolean(feedbackId),
  });
}
