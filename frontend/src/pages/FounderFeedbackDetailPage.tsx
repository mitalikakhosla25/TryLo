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
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Submitted</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#c4b5fd] border border-[#6338E8]/40">
            <span className="h-2 w-2 rounded-full bg-[#a88bff] animate-pulse"></span>
            <span>In Review</span>
          </span>
        );
      case 'needs_retest':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <RotateCcw className="h-3 w-3" />
            <span>Needs Retest</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#17865B]/20 text-emerald-300 border border-[#17865B]/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Resolved</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="h-6 w-32 bg-slate-800/80 rounded animate-pulse"></div>
        <div className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
        <div className="h-40 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
      </div>
    );
  }

  if (isError || !feedback) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Feedback Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {error?.message || 'This feedback record could not be loaded or belongs to another founder.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <span>Retry</span>
          </button>
          <Link
            to="/founder/feedback"
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-colors"
          >
            <span>Back to Feedback</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = feedback.status;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link
              to="/founder/feedback"
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Feedback Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-300 font-medium truncate max-w-[200px]">{feedback.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {feedback.title}
            </h1>
            {getStatusBadge(feedback.status)}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-slate-500">Campaign:</span>
            <Link
              to={`/founder/campaigns/${feedback.campaign_id}`}
              className="font-semibold text-[#a88bff] hover:underline"
            >
              {feedback.campaign_title}
            </Link>
            {feedback.startup_name && (
              <span className="text-slate-500">({feedback.startup_name})</span>
            )}
            <span>&bull;</span>
            <span>Tester: <strong className="text-slate-300">{feedback.tester_name}</strong></span>
            {feedback.tester_experience_level && (
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
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
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white transition-all shadow-md shadow-[#6338E8]/20 disabled:opacity-50"
              >
                <span>Move to In Review</span>
              </button>
              <button
                id="request-retest-btn"
                onClick={handleOpenRetestModal}
                disabled={statusMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-orange-300 border border-slate-700 transition-all disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Request Retest</span>
              </button>
              <button
                id="resolve-issue-btn"
                onClick={handleOpenResolveModal}
                disabled={statusMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#17865B] hover:bg-[#126b48] text-white transition-all shadow-sm disabled:opacity-50"
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
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-orange-300 border border-slate-700 transition-all disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Request Retest</span>
              </button>
              <button
                id="resolve-issue-btn"
                onClick={handleOpenResolveModal}
                disabled={statusMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#17865B] hover:bg-[#126b48] text-white transition-all shadow-sm disabled:opacity-50"
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
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white transition-all shadow-md shadow-[#6338E8]/20 disabled:opacity-50"
              >
                <span>Return to In Review</span>
              </button>
              <button
                id="resolve-issue-btn"
                onClick={handleOpenResolveModal}
                disabled={statusMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#17865B] hover:bg-[#126b48] text-white transition-all shadow-sm disabled:opacity-50"
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
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-[#c4b5fd] border border-slate-700 transition-all disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reopen Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Retest Instructions Callout (if present) */}
      {feedback.retest_instructions && (
        <div className="rounded-2xl bg-orange-950/30 border border-orange-500/30 p-5 space-y-2">
          <div className="flex items-center space-x-2 text-orange-300 font-bold text-xs uppercase tracking-wider">
            <RotateCcw className="h-4 w-4" />
            <span>Active Retest Request Instructions</span>
          </div>
          <p className="text-xs text-orange-200 leading-relaxed whitespace-pre-wrap">
            {feedback.retest_instructions}
          </p>
        </div>
      )}

      {/* Resolution Notes Callout (if present) */}
      {feedback.resolution_notes && (
        <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/30 p-5 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            <span>Issue Resolution Message</span>
          </div>
          <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
            {feedback.resolution_notes}
          </p>
        </div>
      )}

      {/* Primary Details Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800/80 text-xs">
          <span
            className={`font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
              feedback.feedback_type === 'bug_report'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            }`}
          >
            {feedback.feedback_type === 'bug_report' ? (
              <>
                <Bug className="h-3.5 w-3.5" />
                <span>Bug Report</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Observation</span>
              </>
            )}
          </span>

          {feedback.severity && (
            <span
              className={`font-semibold uppercase px-2.5 py-0.5 rounded-md border ${
                feedback.severity === 'critical'
                  ? 'bg-rose-600/20 text-rose-400 border-rose-500/40'
                  : feedback.severity === 'high'
                  ? 'bg-orange-600/20 text-orange-400 border-orange-500/40'
                  : feedback.severity === 'medium'
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {feedback.severity} severity
            </span>
          )}

          <span className="text-slate-500 ml-auto flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Submitted: {new Date(feedback.created_at).toLocaleString()}</span>
          </span>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Observation Description
          </h2>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {feedback.description}
          </div>
        </div>

        {/* Reproduction steps if present */}
        {feedback.reproduction_steps && (
          <div className="space-y-2">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              Steps to Reproduce
            </h2>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
              {feedback.reproduction_steps}
            </div>
          </div>
        )}

        {/* Expected vs Actual behavior */}
        {(feedback.expected_behavior || feedback.actual_behavior) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {feedback.expected_behavior && (
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block">
                  Expected Behavior
                </span>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {feedback.expected_behavior}
                </div>
              </div>
            )}

            {feedback.actual_behavior && (
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block">
                  Actual Behavior
                </span>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {feedback.actual_behavior}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Associated testing task if present */}
        {feedback.task_title && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs text-[#a88bff] font-semibold">
              <Layers className="h-4 w-4" />
              <span>Associated Campaign Task: {feedback.task_title}</span>
            </div>
            {feedback.task_description && (
              <p className="text-xs text-slate-400 pl-6">{feedback.task_description}</p>
            )}
            {feedback.task_expected_outcome && (
              <p className="text-[11px] text-slate-500 pl-6">
                <strong>Expected Outcome:</strong> {feedback.task_expected_outcome}
              </p>
            )}
          </div>
        )}
      </div>

      {/* AI Automated Synthesis Card (Explicitly marked Coming Soon per V1 scope) */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs">
            <Sparkles className="h-4 w-4 text-[#a88bff]" />
            <span>AI Automated Root Cause &amp; Sentiment Analysis</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Coming Soon
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Automated root cause clustering, error categorization, and duplicate detection are coming soon. Current feedback review is conducted directly by founders.
        </p>
      </div>

      {/* Private Founder Internal Notes Section */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <StickyNote className="h-5 w-5 text-[#a88bff]" />
            <h2 className="text-base font-bold text-white">
              Private Internal Notes ({feedback.internal_notes?.length || 0})
            </h2>
          </div>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#6338E8]/15 text-[#c4b5fd] border border-[#6338E8]/30">
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
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-200">{note.author_name}</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">
              No private internal notes added yet. Use internal notes to coordinate investigation, root cause analysis, or decisions.
            </p>
          )}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Add Internal Note:
            </label>
            <textarea
              id="founder-internal-note-input"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Record private engineering observations, ticket links, or triage findings..."
              rows={3}
              maxLength={5000}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{noteBody.length} / 5000 characters</span>
              {noteError && <span className="text-rose-400 font-medium">{noteError}</span>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              id="submit-internal-note-btn"
              disabled={noteMutation.isPending || !noteBody.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white shadow-md shadow-[#6338E8]/20 transition-all disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{noteMutation.isPending ? 'Saving...' : 'Add Note'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Review History Audit Trail */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <History className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Lifecycle Transition History</h2>
        </div>

        {feedback.status_history && feedback.status_history.length > 0 ? (
          <div className="space-y-3">
            {feedback.status_history.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 font-semibold">
                    <span className="capitalize text-slate-400">{h.previous_status.replace('_', ' ')}</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="capitalize text-[#c4b5fd]">{h.new_status.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Updated by: <strong className="text-slate-300">{h.actor_name}</strong>
                  {h.reason && (
                    <span className="block pt-1 text-slate-300 italic">
                      &quot;{h.reason}&quot;
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Initial submission recorded. No status transitions have been performed yet.
          </p>
        )}
      </div>

      {/* Retest Request Modal */}
      {modalType === 'retest' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-orange-400">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Retesting</h3>
                <p className="text-xs text-slate-400">
                  Ask the submitting tester to verify a fix or test on a different environment
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When you request retesting, the tester will see this status update and instructions in their Feedback History, with a direct shortcut to their assigned testing tasks.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Retest Instructions for Tester (Optional):
              </label>
              <textarea
                id="retest-instructions-textarea"
                value={retestInstructions}
                onChange={(e) => setRetestInstructions(e.target.value)}
                placeholder="Explain what has been updated or what steps to verify (e.g., 'Deployed patch to staging. Please repeat step 2 on Chrome and confirm button responds')."
                rows={4}
                maxLength={3000}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
              />
              <span className="text-[11px] text-slate-500 text-right block">
                {retestInstructions.length} / 3000
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-retest-action-btn"
                onClick={handleConfirmModalAction}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center space-x-1.5 shadow-md"
              >
                {statusMutation.isPending ? <span>Updating...</span> : <span>Confirm &amp; Request Retest</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Issue Modal */}
      {modalType === 'resolve' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-emerald-400">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Mark Issue as Resolved</h3>
                <p className="text-xs text-slate-400">
                  Confirm resolution of this tester feedback submission
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Marking this issue as resolved completes the feedback lifecycle for this item. You may optionally include a resolution note that will be visible to the tester.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Resolution Message for Tester (Optional):
              </label>
              <textarea
                id="resolution-notes-textarea"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., 'Fixed in version 1.2.4. Thank you for the detailed reproduction steps!'"
                rows={3}
                maxLength={3000}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-resolve-action-btn"
                onClick={handleConfirmModalAction}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#17865B] hover:bg-[#126b48] text-white transition-colors flex items-center space-x-1.5 shadow-md"
              >
                {statusMutation.isPending ? <span>Resolving...</span> : <span>Confirm Resolution</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Issue Modal */}
      {modalType === 'reopen' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-indigo-400">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reopen Resolved Issue</h3>
                <p className="text-xs text-slate-400">Move this issue back to In Review</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to reopen &quot;{feedback.title}&quot;? This will return the submission to active review.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Reason for Reopening (Optional):
              </label>
              <input
                type="text"
                id="reopen-reason-input"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="E.g., 'Regression detected in latest build'"
                maxLength={500}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reopen-action-btn"
                onClick={handleConfirmModalAction}
                disabled={statusMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white transition-colors flex items-center space-x-1.5 shadow-md"
              >
                {statusMutation.isPending ? <span>Reopening...</span> : <span>Confirm &amp; Reopen</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
