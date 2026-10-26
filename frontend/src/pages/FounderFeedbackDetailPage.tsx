import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Bug,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
  StickyNote,
  History,
  Shield,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  useFounderFeedbackDetail,
  useUpdateFeedbackStatus,
  useAddFeedbackInternalNote,
} from '../context/useFeedback';
import type { FeedbackStatus } from '../api/tasks';

export const FounderFeedbackDetailPage: React.FC = () => {
  const { feedbackId } = useParams<{ feedbackId: string }>();

  const {
    data: feedback,
    isLoading,
    isError,
    error,
    refetch,
  } = useFounderFeedbackDetail(feedbackId);

  const statusMutation = useUpdateFeedbackStatus(feedbackId);
  const noteMutation = useAddFeedbackInternalNote(feedbackId);

  // Status Action Modals
  const [modalType, setModalType] = useState<'retest' | 'resolve' | 'reopen' | null>(null);
  const [retestInstructions, setRetestInstructions] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Internal Note form state
  const [noteBody, setNoteBody] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  const handleOpenRetestModal = () => {
    setActionError(null);
    setRetestInstructions(feedback?.retest_instructions || '');
    setModalType('retest');
  };

  const handleOpenResolveModal = () => {
    setActionError(null);
    setResolutionNotes(feedback?.resolution_notes || '');
    setModalType('resolve');
  };

  const handleOpenReopenModal = () => {
    setActionError(null);
    setReopenReason('');
    setModalType('reopen');
  };

  const handleDirectStatusChange = async (targetStatus: FeedbackStatus, reason?: string) => {
    if (!feedbackId) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await statusMutation.mutateAsync({
        feedbackId,
        payload: { status: targetStatus, reason },
      });
      setActionSuccess(`Issue status successfully moved to ${targetStatus.replace('_', ' ')}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update feedback status.';
      setActionError(msg);
    }
  };

  const handleConfirmModalAction = async () => {
    if (!feedbackId || !modalType) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      if (modalType === 'retest') {
        const cleanInstructions = retestInstructions.trim();
        await statusMutation.mutateAsync({
          feedbackId,
          payload: {
            status: 'needs_retest',
            retest_instructions: cleanInstructions || undefined,
            reason: cleanInstructions || 'Founder requested retesting',
          },
        });
        setActionSuccess('Retesting instructions submitted and issue marked as Needs Retest.');
      } else if (modalType === 'resolve') {
        const cleanNotes = resolutionNotes.trim();
        await statusMutation.mutateAsync({
          feedbackId,
          payload: {
            status: 'resolved',
            resolution_notes: cleanNotes || undefined,
            reason: cleanNotes || 'Issue addressed and resolved by founder',
          },
        });
        setActionSuccess('Issue marked as Resolved.');
      } else if (modalType === 'reopen') {
        const cleanReason = reopenReason.trim();
        await statusMutation.mutateAsync({
          feedbackId,
          payload: {
            status: 'in_review',
            reason: cleanReason || 'Issue explicitly reopened by founder',
          },
        });
        setActionSuccess('Issue reopened and moved back to In Review.');
      }
      setModalType(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete status update.';
      setActionError(msg);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackId) return;
    setNoteError(null);
    const cleanBody = noteBody.trim();
    if (!cleanBody) {
      setNoteError('Note content cannot be empty.');
      return;
    }

    try {
      await noteMutation.mutateAsync({
        feedbackId,
        body: cleanBody,
      });
      setNoteBody('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save internal note.';
      setNoteError(msg);
    }
  };

  const getStatusBadge = (status: FeedbackStatus | string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Submitted</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
            <span className="h-2 w-2 rounded-full bg-[#087C80] animate-pulse"></span>
            <span>In Review</span>
          </span>
        );
      case 'needs_retest':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
            <RotateCcw className="h-3 w-3 text-orange-600" />
            <span>Needs Retest</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Resolved</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-6 w-32 bg-[#EFEFE5] rounded-md animate-pulse"></div>
          <div className="h-48 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse"></div>
          <div className="h-40 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isError || !feedback) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-[#DCE7E3] rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[#102A35]">Feedback Not Found</h2>
          <p className="text-xs sm:text-sm text-[#52656B]">
            {error?.message || 'This feedback record could not be loaded or belongs to another founder.'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
            >
              <span>Retry</span>
            </button>
            <Link
              to="/founder/feedback"
              className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
            >
              <span>Back to Feedback</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = feedback.status;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link
                to="/founder/feedback"
                className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#07545A] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Feedback Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-[#102A35] font-medium truncate max-w-[200px]">{feedback.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                {feedback.title}
              </h1>
              {getStatusBadge(feedback.status)}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#52656B]">
              <span>Campaign:</span>
              <Link
                to={`/founder/campaigns/${feedback.campaign_id}`}
                className="font-semibold text-[#07545A] hover:underline"
              >
                {feedback.campaign_title}
              </Link>
              {feedback.startup_name && (
                <span className="text-[#52656B]">({feedback.startup_name})</span>
              )}
              <span>&bull;</span>
              <span>Tester: <strong className="text-[#102A35]">{feedback.tester_name}</strong></span>
              {feedback.tester_experience_level && (
                <span className="px-2 py-0.5 rounded-full bg-[#EFEFE5] text-[10px] text-[#07545A] border border-[#DCE7E3]">
                  {feedback.tester_experience_level}
                </span>
              )}
            </div>
          </div>

          {/* Action Controls for Status Transitions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {currentStatus === 'submitted' && (
              <>
                <button
                  id="move-to-in-review-btn"
                  onClick={() => handleDirectStatusChange('in_review', 'Founder opened investigation')}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <span>Move to In Review</span>
                </button>
                <button
                  id="request-retest-btn"
                  onClick={handleOpenRetestModal}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-orange-50 text-orange-800 border border-orange-200 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                  <span>Request Retest</span>
                </button>
                <button
                  id="resolve-issue-btn"
                  onClick={handleOpenResolveModal}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </>
            )}

            {currentStatus === 'in_review' && (
              <>
                <button
                  id="request-retest-btn"
                  onClick={handleOpenRetestModal}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-orange-50 text-orange-800 border border-orange-200 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                  <span>Request Retest</span>
                </button>
                <button
                  id="resolve-issue-btn"
                  onClick={handleOpenResolveModal}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </>
            )}

            {currentStatus === 'needs_retest' && (
              <>
                <button
                  id="return-to-in-review-btn"
                  onClick={() => handleDirectStatusChange('in_review', 'Tester repeated task')}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <span>Return to In Review</span>
                </button>
                <button
                  id="resolve-issue-btn"
                  onClick={handleOpenResolveModal}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </>
            )}

            {currentStatus === 'resolved' && (
              <button
                id="reopen-issue-btn"
                onClick={handleOpenReopenModal}
                disabled={statusMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#EFEFE5] text-[#07545A] border border-[#DCE7E3] transition-all disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reopen Issue</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-medium">{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-700 hover:text-rose-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Retest Instructions Callout (if present) */}
        {feedback.retest_instructions && (
          <div className="rounded-3xl bg-orange-50 border border-orange-200 p-6 space-y-2">
            <div className="flex items-center space-x-2 text-orange-900 font-bold text-xs uppercase tracking-wider">
              <RotateCcw className="h-4 w-4 text-orange-600" />
              <span>Active Retest Request Instructions</span>
            </div>
            <p className="text-xs text-orange-800 leading-relaxed whitespace-pre-wrap">
              {feedback.retest_instructions}
            </p>
          </div>
        )}

        {/* Resolution Notes Callout (if present) */}
        {feedback.resolution_notes && (
          <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-6 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Issue Resolution Message</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-wrap">
              {feedback.resolution_notes}
            </p>
          </div>
        )}

        {/* Primary Details Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#DCE7E3] text-xs">
            <span
              className={`font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                feedback.feedback_type === 'bug_report'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA]'
              }`}
            >
              {feedback.feedback_type === 'bug_report' ? (
                <>
                  <Bug className="h-3.5 w-3.5 text-rose-600" />
                  <span>Bug Report</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-3.5 w-3.5 text-[#07545A]" />
                  <span>Observation</span>
                </>
              )}
            </span>

            {feedback.severity && (
              <span
                className={`font-semibold uppercase px-3 py-1 rounded-full border ${
                  feedback.severity === 'critical'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : feedback.severity === 'high'
                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                    : feedback.severity === 'medium'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                {feedback.severity} severity
              </span>
            )}

            <span className="text-[#52656B] ml-auto flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5 text-[#07545A]" />
              <span>Submitted: {new Date(feedback.created_at).toLocaleString()}</span>
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-[#52656B]">
              Observation Description
            </h2>
            <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs sm:text-sm text-[#102A35] leading-relaxed whitespace-pre-wrap">
              {feedback.description}
            </div>
          </div>

          {/* Reproduction steps if present */}
          {feedback.reproduction_steps && (
            <div className="space-y-2">
              <h2 className="text-xs uppercase font-semibold tracking-wider text-[#52656B]">
                Steps to Reproduce
              </h2>
              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs font-mono text-[#102A35] leading-relaxed whitespace-pre-wrap">
                {feedback.reproduction_steps}
              </div>
            </div>
          )}

          {/* Expected vs Actual behavior */}
          {(feedback.expected_behavior || feedback.actual_behavior) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {feedback.expected_behavior && (
                <div className="space-y-1.5">
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#52656B] block">
                    Expected Behavior
                  </span>
                  <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#102A35] leading-relaxed whitespace-pre-wrap">
                    {feedback.expected_behavior}
                  </div>
                </div>
              )}

              {feedback.actual_behavior && (
                <div className="space-y-1.5">
                  <span className="text-xs uppercase font-semibold tracking-wider text-[#52656B] block">
                    Actual Behavior
                  </span>
                  <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#102A35] leading-relaxed whitespace-pre-wrap">
                    {feedback.actual_behavior}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Associated testing task if present */}
          {feedback.task_title && (
            <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[#07545A] font-semibold">
                <Layers className="h-4 w-4" />
                <span>Associated Campaign Task: {feedback.task_title}</span>
              </div>
              {feedback.task_description && (
                <p className="text-xs text-[#52656B] pl-6">{feedback.task_description}</p>
              )}
              {feedback.task_expected_outcome && (
                <p className="text-[11px] text-[#52656B] pl-6">
                  <strong>Expected Outcome:</strong> {feedback.task_expected_outcome}
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI Automated Synthesis Card (Explicitly marked Coming Soon per V1 scope) */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#102A35] font-semibold text-xs">
              <Sparkles className="h-4 w-4 text-[#07545A]" />
              <span>AI Automated Root Cause &amp; Sentiment Analysis</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-[#52656B] leading-relaxed">
            Automated root cause clustering, error categorization, and duplicate detection are coming soon. Current feedback review is conducted directly by founders.
          </p>
        </div>

        {/* Private Founder Internal Notes Section */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCE7E3] pb-4">
            <div className="flex items-center space-x-2.5">
              <StickyNote className="h-5 w-5 text-[#07545A]" />
              <h2 className="text-base font-bold text-[#102A35]">
                Private Internal Notes ({feedback.internal_notes?.length || 0})
              </h2>
            </div>
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
              <Shield className="h-3 w-3" />
              <span>Founder View Only &bull; Hidden from Tester</span>
            </span>
          </div>

          {/* Existing notes */}
          <div className="space-y-3">
            {feedback.internal_notes && feedback.internal_notes.length > 0 ? (
              feedback.internal_notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#52656B]">
                    <span className="font-semibold text-[#102A35]">{note.author_name}</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#102A35] leading-relaxed whitespace-pre-wrap">
                    {note.body}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#52656B] italic">
                No private internal notes added yet. Use internal notes to coordinate investigation, root cause analysis, or decisions.
              </p>
            )}
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-3 pt-3 border-t border-[#DCE7E3]">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#102A35] block">
                Add Internal Note:
              </label>
              <textarea
                id="founder-internal-note-input"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Record private engineering observations, ticket links, or triage findings..."
                rows={3}
                maxLength={5000}
                className="w-full p-3.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
              />
              <div className="flex items-center justify-between text-[11px] text-[#52656B]">
                <span>{noteBody.length} / 5000 characters</span>
                {noteError && <span className="text-rose-600 font-medium">{noteError}</span>}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                id="submit-internal-note-btn"
                disabled={noteMutation.isPending || !noteBody.trim()}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{noteMutation.isPending ? 'Saving...' : 'Add Note'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Review History Audit Trail */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2.5 border-b border-[#DCE7E3] pb-4">
            <History className="h-5 w-5 text-[#07545A]" />
            <h2 className="text-base font-bold text-[#102A35]">Lifecycle Transition History</h2>
          </div>

          {feedback.status_history && feedback.status_history.length > 0 ? (
            <div className="space-y-3">
              {feedback.status_history.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 font-semibold">
                      <span className="capitalize text-[#52656B]">{h.previous_status.replace('_', ' ')}</span>
                      <span className="text-[#52656B]">&rarr;</span>
                      <span className="capitalize text-[#07545A] font-bold">{h.new_status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[11px] text-[#52656B]">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#52656B]">
                    Updated by: <strong className="text-[#102A35]">{h.actor_name}</strong>
                    {h.reason && (
                      <span className="block pt-1 text-[#102A35] italic">
                        &quot;{h.reason}&quot;
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#52656B] italic">
              Initial submission recorded. No status transitions have been performed yet.
            </p>
          )}
        </div>

        {/* Retest Request Modal */}
        {modalType === 'retest' && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-orange-800">
                <div className="h-10 w-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Request Retesting</h3>
                  <p className="text-xs text-[#52656B]">
                    Ask the submitting tester to verify a fix or test on a different environment
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#52656B] leading-relaxed">
                When you request retesting, the tester will see this status update and instructions in their Feedback History, with a direct shortcut to their assigned testing tasks.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#102A35] block">
                  Retest Instructions for Tester (Optional):
                </label>
                <textarea
                  id="retest-instructions-textarea"
                  value={retestInstructions}
                  onChange={(e) => setRetestInstructions(e.target.value)}
                  placeholder="Explain what has been updated or what steps to verify (e.g., 'Deployed patch to staging. Please repeat step 2 on Chrome and confirm button responds')."
                  rows={4}
                  maxLength={3000}
                  className="w-full p-3.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                />
                <span className="text-[11px] text-[#52656B] text-right block">
                  {retestInstructions.length} / 3000
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  disabled={statusMutation.isPending}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-retest-action-btn"
                  onClick={handleConfirmModalAction}
                  disabled={statusMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {statusMutation.isPending ? <span>Updating...</span> : <span>Confirm &amp; Request Retest</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve Issue Modal */}
        {modalType === 'resolve' && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-emerald-800">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Mark Issue as Resolved</h3>
                  <p className="text-xs text-[#52656B]">
                    Confirm resolution of this tester feedback submission
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#52656B] leading-relaxed">
                Marking this issue as resolved completes the feedback lifecycle for this item. You may optionally include a resolution note that will be visible to the tester.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#102A35] block">
                  Resolution Message for Tester (Optional):
                </label>
                <textarea
                  id="resolution-notes-textarea"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="E.g., 'Fixed in version 1.2.4. Thank you for the detailed reproduction steps!'"
                  rows={3}
                  maxLength={3000}
                  className="w-full p-3.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  disabled={statusMutation.isPending}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-resolve-action-btn"
                  onClick={handleConfirmModalAction}
                  disabled={statusMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {statusMutation.isPending ? <span>Resolving...</span> : <span>Confirm Resolution</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Issue Modal */}
        {modalType === 'reopen' && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-[#07545A]">
                <div className="h-10 w-10 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-[#07545A]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Reopen Resolved Issue</h3>
                  <p className="text-xs text-[#52656B]">Move this issue back to In Review</p>
                </div>
              </div>

              <p className="text-xs text-[#52656B] leading-relaxed">
                Are you sure you want to reopen &quot;{feedback.title}&quot;? This will return the submission to active review.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#102A35] block">
                  Reason for Reopening (Optional):
                </label>
                <input
                  type="text"
                  id="reopen-reason-input"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="E.g., 'Regression detected in latest build'"
                  maxLength={500}
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  disabled={statusMutation.isPending}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-reopen-action-btn"
                  onClick={handleConfirmModalAction}
                  disabled={statusMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {statusMutation.isPending ? <span>Reopening...</span> : <span>Confirm &amp; Reopen</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
