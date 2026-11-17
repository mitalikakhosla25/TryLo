import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listFounderFeedback,
  getFounderFeedbackDetail,
  updateFeedbackStatus,
  addFeedbackInternalNote,
  addTimestampedVideoNote,
  runAiFeedbackTriage,
  generateExecutiveFeedbackSynthesis,
  queryAiCopilot,
  generateE2eReproductionScript,
  getUserJourneyFunnel,
  getVideoAiInsights,
  getRetestProtocol,
  exportFeedbackTicket,
  type FounderFeedbackFilters,
  type FounderFeedbackListResponse,
  type FounderFeedbackDetail,
  type FeedbackStatusUpdateRequest,
  type FeedbackInternalNote,
  type TimestampedNote,
  type TimestampedNoteCreatePayload,
  type AiTriageResponse,
  type AiExecutiveSynthesisResponse,
  type AiCopilotQueryRequest,
  type AiCopilotQueryResponse,
  type AiE2eReproductionRequest,
  type AiE2eReproductionResponse,
  type AiUserJourneyFunnelResponse,
  type AiVideoIntelligenceResponse,
  type AiRetestProtocolResponse,
  type AiIssueExportResponse,
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

export function useRunAiFeedbackTriage(feedbackId?: string) {
  const queryClient = useQueryClient();

  return useMutation<AiTriageResponse, Error, string | undefined>({
    mutationFn: (targetId) => {
      const id = targetId || feedbackId;
      if (!id) throw new Error('Feedback ID is required to run AI triage.');
      return runAiFeedbackTriage(id);
    },
    onSuccess: (_, targetId) => {
      const id = targetId || feedbackId;
      queryClient.invalidateQueries({
        queryKey: ['founder-feedback-detail', id],
      });
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

export function useAddTimestampedVideoNote(feedbackId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; note: TimestampedNote; timestamped_notes: TimestampedNote[] },
    Error,
    { feedbackId: string; payload: TimestampedNoteCreatePayload }
  >({
    mutationFn: ({ feedbackId: targetId, payload }) =>
      addTimestampedVideoNote(targetId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['founder-feedback-detail', variables.feedbackId || feedbackId],
      });
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
    },
  });
}

export function useExecutiveFeedbackSynthesis(campaignId?: string) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<AiExecutiveSynthesisResponse, Error>({
    queryKey: ['executive-feedback-synthesis', campaignId || 'all'],
    queryFn: () => generateExecutiveFeedbackSynthesis(campaignId),
    enabled: !!user && isFounder,
    staleTime: 30000,
    retry: 1,
  });
}

export function useGenerateExecutiveFeedbackSynthesis() {
  const queryClient = useQueryClient();

  return useMutation<AiExecutiveSynthesisResponse, Error, string | undefined>({
    mutationFn: (campaignId) => generateExecutiveFeedbackSynthesis(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({
        queryKey: ['executive-feedback-synthesis', campaignId || 'all'],
      });
      queryClient.invalidateQueries({ queryKey: ['founder-feedback'] });
    },
  });
}

export function useQueryAiCopilot() {
  return useMutation<AiCopilotQueryResponse, Error, AiCopilotQueryRequest>({
    mutationFn: (payload) => queryAiCopilot(payload),
  });
}

export function useGenerateE2eReproductionScript() {
  return useMutation<
    AiE2eReproductionResponse,
    Error,
    { feedbackId: string; payload?: AiE2eReproductionRequest }
  >({
    mutationFn: ({ feedbackId, payload }) => generateE2eReproductionScript(feedbackId, payload),
  });
}

export function useUserJourneyFunnel(campaignId?: string) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<AiUserJourneyFunnelResponse, Error>({
    queryKey: ['user-journey-funnel', campaignId || 'all'],
    queryFn: () => getUserJourneyFunnel(campaignId),
    enabled: !!user && isFounder,
    staleTime: 30000,
    retry: 1,
  });
}

export function useVideoAiInsights(feedbackId?: string) {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';

  return useQuery<AiVideoIntelligenceResponse, Error>({
    queryKey: ['video-ai-insights', feedbackId],
    queryFn: () => getVideoAiInsights(feedbackId!),
    enabled: !!user && isFounder && !!feedbackId,
    staleTime: 60000,
    retry: 1,
  });
}

export function useRetestProtocol() {
  return useMutation<AiRetestProtocolResponse, Error, string>({
    mutationFn: (feedbackId) => getRetestProtocol(feedbackId),
  });
}

export function useExportFeedbackTicket() {
  return useMutation<
    AiIssueExportResponse,
    Error,
    { feedbackId: string; targetRepo?: string }
  >({
    mutationFn: ({ feedbackId, targetRepo }) => exportFeedbackTicket(feedbackId, targetRepo),
  });
}
