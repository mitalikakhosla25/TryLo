import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquarePlus,
  Bug,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Eye,
  X,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useMyFeedback } from '../context/useTasks';
import type { FeedbackSubmissionResponse, FeedbackType, FeedbackStatus } from '../api/tasks';

export const TesterFeedbackHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignFilter = searchParams.get('campaignId') || undefined;

  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackSubmissionResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useMyFeedback(
    campaignFilter,
    typeFilter === 'all' ? undefined : typeFilter
  );

  const submissions = data?.items || [];

  const filteredSubmissions = submissions.filter((sub) => {
    return (
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const renderStatusBadge = (status: FeedbackStatus | string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Status: Submitted
          </span>
        );
      case 'in_review':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            <span>Status: In Review</span>
          </span>
        );
      case 'needs_retest':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30 flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-orange-400" />
            <span>Status: Retest Requested</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Status: Resolved</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            Status: {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <Link to="/tester" className="hover:text-slate-200 transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-violet-400 font-medium">Feedback History</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6 text-violet-400" />
              <span>My Submitted Feedback</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review your recorded observations, feature suggestions, and bug reports across all beta campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/tester/tasks"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>Go to Testing Tasks</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Type Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Items ({submissions.length})
            </button>
            <button
              onClick={() => setTypeFilter('bug_report')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                typeFilter === 'bug_report'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bugs Only
            </button>
            <button
              onClick={() => setTypeFilter('general_feedback')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                typeFilter === 'general_feedback'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              General Feedback
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Campaign Filter Active Banner */}
        {campaignFilter && (
          <div className="p-2.5 px-3.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-300 flex items-center justify-between">
            <span>Filtering feedback for specific campaign ID: {campaignFilter}</span>
            <button
              onClick={() => {
                searchParams.delete('campaignId');
                setSearchParams(searchParams);
              }}
              className="font-semibold underline hover:text-white"
            >
              Clear Campaign Filter
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {error instanceof Error ? error.message : 'Failed to load feedback history.'}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredSubmissions.length === 0 && (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <MessageSquarePlus className="h-7 w-7 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No feedback recorded</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
              You haven&apos;t submitted any feedback or bug reports yet. Open your assigned campaign tasks to record your observations!
            </p>
            <Link
              to="/tester/tasks"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>Go to Testing Tasks</span>
            </Link>
          </div>
        )}

        {/* Submissions List */}
        {!isLoading && !isError && filteredSubmissions.length > 0 && (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-all shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          sub.feedback_type === 'bug_report'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {sub.feedback_type === 'bug_report' ? (
                          <>
                            <Bug className="h-3 w-3" />
                            <span>BUG REPORT</span>
                          </>
                        ) : (
                          <>
                            <MessageSquarePlus className="h-3 w-3" />
                            <span>GENERAL FEEDBACK</span>
                          </>
                        )}
                      </span>

                      {/* Severity Pill (if bug) */}
                      {sub.severity && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                            sub.severity === 'critical'
                              ? 'bg-rose-600/20 text-rose-400 border-rose-500/40'
                              : sub.severity === 'high'
                              ? 'bg-orange-600/20 text-orange-400 border-orange-500/40'
                              : sub.severity === 'medium'
                              ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          {sub.severity} severity
                        </span>
                      )}

                      {/* Real Review Status Pill */}
                      {renderStatusBadge(sub.status)}

                      {/* Campaign & Startup context */}
                      <span className="text-xs text-slate-400">
                        for <span className="text-slate-200 font-semibold">{sub.campaign_title}</span>{' '}
                        ({sub.startup_name})
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-white pt-1">{sub.title}</h2>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{sub.description}</p>
                  </div>

                  {/* Right: Date & Details Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-violet-400" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* Retest Request Callout if status is needs_retest */}
                {sub.status === 'needs_retest' && (
                  <div className="p-3.5 rounded-lg bg-orange-500/10 border border-orange-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs text-orange-300 font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-orange-400" />
                        <span>Retest Requested by Founder</span>
                      </div>
                      <Link
                        to={`/tester/campaigns/${sub.campaign_id}/tasks`}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-orange-200 hover:text-white underline"
                      >
                        <span>Open Testing Tasks</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {sub.retest_instructions ? (
                      <p className="text-xs text-orange-200 leading-relaxed whitespace-pre-wrap">
                        {sub.retest_instructions}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-200/80 italic">
                        The founder has requested that you revisit this task or verify a fix. Open your testing workspace to update your findings.
                      </p>
                    )}
                  </div>
                )}

                {/* Resolution Message if status is resolved */}
                {sub.status === 'resolved' && sub.resolution_notes && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Issue Resolved:</span>
                    </div>
                    <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                      {sub.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Task Context footer if associated */}
                {sub.task_title && (
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-300">Linked Step:</span>
                      <span className="text-violet-300">{sub.task_title}</span>
                    </div>
                    {sub.updated_at && (
                      <span className="text-[10px] text-slate-500">
                        Updated {new Date(sub.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                {selectedSubmission.feedback_type === 'bug_report' ? (
                  <Bug className="h-5 w-5 text-rose-400" />
                ) : (
                  <MessageSquarePlus className="h-5 w-5 text-violet-400" />
                )}
                <h3 className="text-lg font-bold text-white truncate max-w-[340px]">
                  {selectedSubmission.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/60">
                <span className="text-slate-400">
                  Campaign: <strong className="text-white">{selectedSubmission.campaign_title}</strong> (
                  {selectedSubmission.startup_name})
                </span>
                {selectedSubmission.task_title && (
                  <span className="text-slate-400">
                    &bull; Step: <strong className="text-violet-300">{selectedSubmission.task_title}</strong>
                  </span>
                )}
                {selectedSubmission.severity && (
                  <span className="text-amber-300 font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {selectedSubmission.severity} severity
                  </span>
                )}
                {renderStatusBadge(selectedSubmission.status)}
              </div>

              {/* Retest Instructions in modal */}
              {selectedSubmission.status === 'needs_retest' && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/25 space-y-2">
                  <div className="flex items-center justify-between text-xs text-orange-300 font-semibold">
                    <div className="flex items-center space-x-1">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retest Instructions:</span>
                    </div>
                    <Link
                      to={`/tester/campaigns/${selectedSubmission.campaign_id}/tasks`}
                      className="text-[11px] text-orange-200 hover:text-white underline font-bold"
                    >
                      Open Tasks Workspace
                    </Link>
                  </div>
                  <p className="text-xs text-orange-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.retest_instructions || 'Please revisit the task and test again.'}
                  </p>
                </div>
              )}

              {/* Resolution Notes in modal */}
              {selectedSubmission.status === 'resolved' && selectedSubmission.resolution_notes && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                  <span className="font-semibold text-emerald-300 text-xs block">
                    Resolution Message from Founder:
                  </span>
                  <p className="text-xs text-emerald-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.resolution_notes}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.description}
                </div>
              </div>

              {/* Steps to Reproduce */}
              {selectedSubmission.reproduction_steps && (
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                    Steps to Reproduce
                  </label>
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.reproduction_steps}
                  </div>
                </div>
              )}

              {/* Expected vs Actual */}
              {(selectedSubmission.expected_behavior || selectedSubmission.actual_behavior) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSubmission.expected_behavior && (
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                        Expected Behavior
                      </label>
                      <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.expected_behavior}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.actual_behavior && (
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                        Actual Behavior
                      </label>
                      <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.actual_behavior}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}</span>
                {selectedSubmission.updated_at && (
                  <span>Last updated {new Date(selectedSubmission.updated_at).toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {selectedSubmission.status === 'needs_retest' ? (
                <Link
                  to={`/tester/campaigns/${selectedSubmission.campaign_id}/tasks`}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Go to Testing Tasks</span>
                </Link>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
