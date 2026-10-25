import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquarePlus,
  Bug,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Send,
} from 'lucide-react';
import { useCampaignTasks, useSubmitFeedback } from '../context/useTasks';
import type { FeedbackType, BugSeverity } from '../api/tasks';

export const FeedbackSubmissionPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: campaignData } = useCampaignTasks(campaignId);
  const submitFeedbackMutation = useSubmitFeedback(campaignId);

  // Form Mode: general_feedback vs bug_report
  const qType = searchParams.get('type');
  const [userSelectedType, setUserSelectedType] = useState<FeedbackType | null>(null);
  const feedbackType: FeedbackType =
    userSelectedType ?? (qType === 'bug_report' ? 'bug_report' : 'general_feedback');

  const setFeedbackType = (type: FeedbackType) => {
    setUserSelectedType(type);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('type', type);
        return next;
      },
      { replace: true }
    );
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskId, setTaskId] = useState<string>('');
  const [severity, setSeverity] = useState<BugSeverity>('medium');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');

  // UI States
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (cleanTitle.length < 3) {
      setErrorMessage('Title must be at least 3 characters long.');
      return;
    }
    if (cleanDesc.length < 10) {
      setErrorMessage('Description must be at least 10 characters long.');
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        feedback_type: feedbackType,
        title: cleanTitle,
        description: cleanDesc,
        task_id: taskId ? taskId : null,
        severity: feedbackType === 'bug_report' ? severity : null,
        reproduction_steps: reproductionSteps.trim() ? reproductionSteps.trim() : null,
        expected_behavior: expectedBehavior.trim() ? expectedBehavior.trim() : null,
        actual_behavior: actualBehavior.trim() ? actualBehavior.trim() : null,
      });

      setIsSubmittedSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to submit feedback.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTaskId('');
    setSeverity('medium');
    setReproductionSteps('');
    setExpectedBehavior('');
    setActualBehavior('');
    setIsSubmittedSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link to="/tester/tasks" className="hover:text-slate-200 transition-colors">
            My Tasks
          </Link>
          <span>/</span>
          <Link
            to={`/tester/campaigns/${campaignId}/tasks`}
            className="hover:text-slate-200 transition-colors truncate max-w-[200px]"
          >
            {campaignData?.campaign_title || 'Workspace'}
          </Link>
          <span>/</span>
          <span className="text-violet-400 font-medium">New Feedback</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {feedbackType === 'bug_report' ? (
                <>
                  <Bug className="h-6 w-6 text-rose-400" />
                  <span>Report a Bug</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-6 w-6 text-violet-400" />
                  <span>Submit Structured Feedback</span>
                </>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Campaign: <span className="text-slate-200 font-semibold">{campaignData?.campaign_title}</span>{' '}
              ({campaignData?.startup_name})
            </p>
          </div>

          <Link
            to={`/tester/campaigns/${campaignId}/tasks`}
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workspace</span>
          </Link>
        </div>

        {/* Success View */}
        {isSubmittedSuccess ? (
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Submission Recorded Successfully!</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your {feedbackType === 'bug_report' ? 'bug report' : 'feedback'} has been recorded with status{' '}
              <span className="font-semibold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                Submitted
              </span>
              . The founder will be able to review your observations.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Submit Another Item
              </button>
              <Link
                to={`/tester/campaigns/${campaignId}/tasks`}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 transition-all"
              >
                Return to Workspace
              </Link>
              <Link
                to={`/tester/feedback?campaignId=${campaignId}`}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-400 border border-slate-700 transition-colors"
              >
                View Feedback History
              </Link>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
          >
            {/* Feedback Type Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Feedback Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackType('general_feedback')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all ${
                    feedbackType === 'general_feedback'
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquarePlus className="h-4 w-4 text-violet-400" />
                  <span>General Feedback</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('bug_report')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all ${
                    feedbackType === 'bug_report'
                      ? 'bg-rose-600/20 border-rose-500 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bug className="h-4 w-4 text-rose-400" />
                  <span>Bug Report</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Associated Task Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="taskSelect" className="text-xs font-semibold text-slate-300 block">
                Associated Task (Optional)
              </label>
              <select
                id="taskSelect"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                <option value="">-- General / Overall Product (No specific task) --</option>
                {campaignData?.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Step {t.order}: {t.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Link this feedback to a specific step from the campaign instructions, or leave unassigned for general comments.
              </p>
            </div>

            {/* Severity (Bug Reports only) */}
            {feedbackType === 'bug_report' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as BugSeverity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium uppercase tracking-wider border transition-all ${
                        severity === level
                          ? level === 'critical'
                            ? 'bg-rose-600 text-white border-rose-500 font-bold'
                            : level === 'high'
                            ? 'bg-orange-600 text-white border-orange-500 font-bold'
                            : level === 'medium'
                            ? 'bg-amber-600 text-white border-amber-500 font-bold'
                            : 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="fbTitle" className="font-semibold text-slate-300">
                  {feedbackType === 'bug_report' ? 'Bug Title' : 'Feedback Title'} *
                </label>
                <span className="text-slate-500">{title.length} / 200</span>
              </div>
              <input
                id="fbTitle"
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  feedbackType === 'bug_report'
                    ? 'e.g. Settings dropdown crashes Safari 17 on click'
                    : 'e.g. Navigation structure feels intuitive and clean'
                }
                className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="fbDesc" className="font-semibold text-slate-300">
                  Detailed Description *
                </label>
                <span className="text-slate-500">{description.length} / 5000</span>
              </div>
              <textarea
                id="fbDesc"
                required
                rows={4}
                maxLength={5000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  feedbackType === 'bug_report'
                    ? 'Describe what happened, what went wrong, and any relevant environmental context (browser version, OS, screen resolution)...'
                    : 'Share your observations, thoughts, usability feedback, or suggestions for improvement...'
                }
                className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 leading-relaxed"
              />
            </div>

            {/* Bug Report Specific Details */}
            {feedbackType === 'bug_report' && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                {/* Steps to Reproduce */}
                <div className="space-y-1.5">
                  <label htmlFor="reproSteps" className="text-xs font-semibold text-slate-300 block">
                    Steps to Reproduce (Optional)
                  </label>
                  <textarea
                    id="reproSteps"
                    rows={3}
                    maxLength={3000}
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    placeholder="1. Go to '/settings'&#10;2. Select language 'French'&#10;3. Click Save button"
                    className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono text-[11px]"
                  />
                </div>

                {/* Expected vs Actual Behavior Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="expected" className="text-xs font-semibold text-slate-300 block">
                      Expected Behavior (Optional)
                    </label>
                    <textarea
                      id="expected"
                      rows={2}
                      maxLength={2000}
                      value={expectedBehavior}
                      onChange={(e) => setExpectedBehavior(e.target.value)}
                      placeholder="What should have happened..."
                      className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="actual" className="text-xs font-semibold text-slate-300 block">
                      Actual Behavior (Optional)
                    </label>
                    <textarea
                      id="actual"
                      rows={2}
                      maxLength={2000}
                      value={actualBehavior}
                      onChange={(e) => setActualBehavior(e.target.value)}
                      placeholder="What actually occurred..."
                      className="w-full text-xs p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Link
                to={`/tester/campaigns/${campaignId}/tasks`}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitFeedbackMutation.isPending}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50"
              >
                {submitFeedbackMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit {feedbackType === 'bug_report' ? 'Bug Report' : 'Feedback'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
