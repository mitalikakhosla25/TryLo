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
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = errObj.response?.data?.detail || errObj.message || 'Failed to submit feedback.';
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
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-[#52656B]">
          <Link to="/tester/tasks" className="hover:text-[#07545A] transition-colors">
            My Tasks
          </Link>
          <span>/</span>
          <Link
            to={`/tester/campaigns/${campaignId}/tasks`}
            className="hover:text-[#07545A] transition-colors truncate max-w-[200px]"
          >
            {campaignData?.campaign_title || 'Workspace'}
          </Link>
          <span>/</span>
          <span className="text-[#087C80] font-semibold">New Feedback</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#102A35] flex items-center gap-2">
              {feedbackType === 'bug_report' ? (
                <>
                  <Bug className="h-6 w-6 text-rose-600" />
                  <span>Report a Bug</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-6 w-6 text-[#07545A]" />
                  <span>Submit Structured Feedback</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B] mt-1">
              Campaign: <span className="text-[#102A35] font-semibold">{campaignData?.campaign_title}</span>{' '}
              ({campaignData?.startup_name})
            </p>
          </div>

          <Link
            to={`/tester/campaigns/${campaignId}/tasks`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workspace</span>
          </Link>
        </div>

        {/* Success View */}
        {isSubmittedSuccess ? (
          <div className="bg-white border border-[#DCE7E3] rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-[#102A35]">Submission Recorded Successfully!</h2>
            <p className="text-xs sm:text-sm text-[#52656B] max-w-md mx-auto leading-relaxed">
              Your {feedbackType === 'bug_report' ? 'bug report' : 'feedback'} has been recorded with status{' '}
              <span className="font-semibold text-[#07545A] bg-[#D7EFEB] px-2.5 py-0.5 rounded-full border border-[#BCE1DA]">
                Submitted
              </span>
              . The founder will be able to review your observations.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 text-xs font-semibold rounded-full bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer"
              >
                Submit Another Item
              </button>
              <Link
                to={`/tester/campaigns/${campaignId}/tasks`}
                className="px-5 py-2.5 text-xs font-semibold rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
              >
                Return to Workspace
              </Link>
              <Link
                to={`/tester/feedback?campaignId=${campaignId}`}
                className="px-5 py-2.5 text-xs font-semibold rounded-full bg-white hover:bg-[#EFEFE5] text-[#07545A] border border-[#DCE7E3] transition-colors"
              >
                View Feedback History
              </Link>
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#DCE7E3] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
          >
            {/* Feedback Type Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#102A35] block">Feedback Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackType('general_feedback')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    feedbackType === 'general_feedback'
                      ? 'bg-[#D7EFEB] border-[#BCE1DA] text-[#07545A] shadow-xs'
                      : 'bg-white border-[#DCE7E3] text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  <MessageSquarePlus className="h-4 w-4 text-[#07545A]" />
                  <span>General Feedback</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('bug_report')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    feedbackType === 'bug_report'
                      ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-xs'
                      : 'bg-white border-[#DCE7E3] text-[#52656B] hover:text-[#102A35]'
                  }`}
                >
                  <Bug className="h-4 w-4 text-rose-600" />
                  <span>Bug Report</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Associated Task Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="taskSelect" className="text-xs font-semibold text-[#102A35] block">
                Associated Task (Optional)
              </label>
              <select
                id="taskSelect"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] focus:outline-none focus:border-[#087C80]"
              >
                <option value="">-- General / Overall Product (No specific task) --</option>
                {campaignData?.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Step {t.order}: {t.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#52656B]">
                Link this feedback to a specific step from the campaign instructions, or leave unassigned for general comments.
              </p>
            </div>

            {/* Severity (Bug Reports only) */}
            {feedbackType === 'bug_report' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#102A35] block">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as BugSeverity[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                        severity === level
                          ? level === 'critical'
                            ? 'bg-rose-600 text-white border-rose-600 font-bold'
                            : level === 'high'
                            ? 'bg-orange-600 text-white border-orange-600 font-bold'
                            : level === 'medium'
                            ? 'bg-amber-600 text-white border-amber-600 font-bold'
                            : 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : 'bg-white border-[#DCE7E3] text-[#52656B] hover:text-[#102A35]'
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
                <label htmlFor="fbTitle" className="font-semibold text-[#102A35]">
                  {feedbackType === 'bug_report' ? 'Bug Title' : 'Feedback Title'} *
                </label>
                <span className="text-[#52656B]">{title.length} / 200</span>
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
                className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="fbDesc" className="font-semibold text-[#102A35]">
                  Detailed Description *
                </label>
                <span className="text-[#52656B]">{description.length} / 5000</span>
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
                className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] leading-relaxed"
              />
            </div>

            {/* Bug Report Specific Details */}
            {feedbackType === 'bug_report' && (
              <div className="space-y-4 pt-4 border-t border-[#DCE7E3]">
                {/* Steps to Reproduce */}
                <div className="space-y-1.5">
                  <label htmlFor="reproSteps" className="text-xs font-semibold text-[#102A35] block">
                    Steps to Reproduce (Optional)
                  </label>
                  <textarea
                    id="reproSteps"
                    rows={3}
                    maxLength={3000}
                    value={reproductionSteps}
                    onChange={(e) => setReproductionSteps(e.target.value)}
                    placeholder="1. Go to '/settings'&#10;2. Select language 'French'&#10;3. Click Save button"
                    className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] font-mono text-[11px]"
                  />
                </div>

                {/* Expected vs Actual Behavior Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="expected" className="text-xs font-semibold text-[#102A35] block">
                      Expected Behavior (Optional)
                    </label>
                    <textarea
                      id="expected"
                      rows={2}
                      maxLength={2000}
                      value={expectedBehavior}
                      onChange={(e) => setExpectedBehavior(e.target.value)}
                      placeholder="What should have happened..."
                      className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="actual" className="text-xs font-semibold text-[#102A35] block">
                      Actual Behavior (Optional)
                    </label>
                    <textarea
                      id="actual"
                      rows={2}
                      maxLength={2000}
                      value={actualBehavior}
                      onChange={(e) => setActualBehavior(e.target.value)}
                      placeholder="What actually occurred..."
                      className="w-full text-xs p-3 bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-[#DCE7E3] flex items-center justify-between">
              <Link
                to={`/tester/campaigns/${campaignId}/tasks`}
                className="text-xs font-semibold text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitFeedbackMutation.isPending}
                className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-semibold rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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
