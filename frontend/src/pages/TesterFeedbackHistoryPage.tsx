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
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Status: Submitted
          </span>
        );
      case 'in_review':
        return (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#087C80] animate-pulse"></span>
            <span>Status: In Review</span>
          </span>
        );
      case 'needs_retest':
        return (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-orange-600" />
            <span>Status: Retest Requested</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Status: Resolved</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
            Status: {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Breadcrumb Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#52656B] mb-1">
              <Link to="/tester" className="hover:text-[#07545A] transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-[#087C80] font-semibold">Feedback History</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#102A35] flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6 text-[#07545A]" />
              <span>My Submitted Feedback</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B] mt-1">
              Review your recorded observations, feature suggestions, and bug reports across all beta campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/tester/tasks"
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>Go to Testing Tasks</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-[#DCE7E3] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
          {/* Type Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                typeFilter === 'all'
                  ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              All Items ({submissions.length})
            </button>
            <button
              onClick={() => setTypeFilter('bug_report')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                typeFilter === 'bug_report'
                  ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              Bugs Only
            </button>
            <button
              onClick={() => setTypeFilter('general_feedback')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors border ${
                typeFilter === 'general_feedback'
                  ? 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA] shadow-xs'
                  : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
              }`}
            >
              General Feedback
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#52656B]" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-white border border-[#DCE7E3] rounded-xl text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
            />
          </div>
        </div>

        {/* Campaign Filter Active Banner */}
        {campaignFilter && (
          <div className="p-3 px-4 bg-[#D7EFEB] border border-[#BCE1DA] rounded-2xl text-xs text-[#07545A] flex items-center justify-between">
            <span>Filtering feedback for specific campaign ID: <strong className="font-mono">{campaignFilter}</strong></span>
            <button
              onClick={() => {
                searchParams.delete('campaignId');
                setSearchParams(searchParams);
              }}
              className="font-bold underline hover:text-[#087C80] cursor-pointer"
            >
              Clear Campaign Filter
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-[#DCE7E3] rounded-3xl animate-pulse shadow-xs" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
              <span className="text-sm font-medium">
                {error instanceof Error ? error.message : 'Failed to load feedback history.'}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="text-xs px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredSubmissions.length === 0 && (
          <div className="text-center py-16 px-4 bg-white border border-dashed border-[#DCE7E3] rounded-3xl shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center mb-4">
              <MessageSquarePlus className="h-7 w-7 text-[#07545A]" />
            </div>
            <h3 className="text-lg font-bold text-[#102A35]">No feedback recorded</h3>
            <p className="text-sm text-[#52656B] max-w-md mx-auto mt-1 mb-6">
              You haven&apos;t submitted any feedback or bug reports yet. Open your assigned campaign tasks to record your observations!
            </p>
            <Link
              to="/tester/tasks"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>Go to Testing Tasks</span>
            </Link>
          </div>
        )}

        {/* Submissions List */}
        {!isLoading && !isError && filteredSubmissions.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white border border-[#DCE7E3] rounded-3xl p-6 sm:p-7 hover:border-[#087C80]/50 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          sub.feedback_type === 'bug_report'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA]'
                        }`}
                      >
                        {sub.feedback_type === 'bug_report' ? (
                          <>
                            <Bug className="h-3 w-3 text-rose-600" />
                            <span>BUG REPORT</span>
                          </>
                        ) : (
                          <>
                            <MessageSquarePlus className="h-3 w-3 text-[#07545A]" />
                            <span>GENERAL FEEDBACK</span>
                          </>
                        )}
                      </span>

                      {/* Severity Pill (if bug) */}
                      {sub.severity && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                            sub.severity === 'critical'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : sub.severity === 'high'
                              ? 'bg-orange-100 text-orange-900 border-orange-300'
                              : sub.severity === 'medium'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {sub.severity} severity
                        </span>
                      )}

                      {/* Real Review Status Pill */}
                      {renderStatusBadge(sub.status)}

                      {/* Campaign & Startup context */}
                      <span className="text-xs text-[#52656B]">
                        for <span className="text-[#102A35] font-semibold">{sub.campaign_title}</span>{' '}
                        ({sub.startup_name})
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-[#102A35] pt-1">{sub.title}</h2>
                    <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">{sub.description}</p>
                  </div>

                  {/* Right: Date & Details Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                    <span className="text-[11px] text-[#52656B] flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#07545A]" />
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-white hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer shadow-xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#07545A]" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* Retest Request Callout if status is needs_retest */}
                {sub.status === 'needs_retest' && (
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2">
                    <div className="flex items-center justify-between text-xs text-orange-900 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                        <span>Retest Requested by Founder</span>
                      </div>
                      <Link
                        to={`/tester/campaigns/${sub.campaign_id}/tasks`}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-orange-900 hover:underline"
                      >
                        <span>Open Testing Tasks</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {sub.retest_instructions ? (
                      <p className="text-xs text-orange-800 leading-relaxed whitespace-pre-wrap">
                        {sub.retest_instructions}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-800/80 italic">
                        The founder has requested that you revisit this task or verify a fix. Open your testing workspace to update your findings.
                      </p>
                    )}
                  </div>
                )}

                {/* Resolution Message if status is resolved */}
                {sub.status === 'resolved' && sub.resolution_notes && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Issue Resolved:</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-wrap">
                      {sub.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Task Context footer if associated */}
                {sub.task_title && (
                  <div className="text-[11px] text-[#52656B] pt-2 border-t border-[#DCE7E3] flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-[#102A35]">Linked Step:</span>
                      <span className="text-[#07545A] font-medium">{sub.task_title}</span>
                    </div>
                    {sub.updated_at && (
                      <span className="text-[10px] text-[#52656B]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-2">
                {selectedSubmission.feedback_type === 'bug_report' ? (
                  <Bug className="h-5 w-5 text-rose-600" />
                ) : (
                  <MessageSquarePlus className="h-5 w-5 text-[#07545A]" />
                )}
                <h3 className="text-lg font-bold text-[#102A35] truncate max-w-[340px]">
                  {selectedSubmission.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-[#52656B] hover:text-[#102A35] p-1 rounded-full hover:bg-[#EFEFE5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              {/* Meta tags */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#DCE7E3]">
                <span className="text-[#52656B]">
                  Campaign: <strong className="text-[#102A35]">{selectedSubmission.campaign_title}</strong> (
                  {selectedSubmission.startup_name})
                </span>
                {selectedSubmission.task_title && (
                  <span className="text-[#52656B]">
                    &bull; Step: <strong className="text-[#07545A]">{selectedSubmission.task_title}</strong>
                  </span>
                )}
                {selectedSubmission.severity && (
                  <span className="text-amber-900 font-semibold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300">
                    {selectedSubmission.severity} severity
                  </span>
                )}
                {renderStatusBadge(selectedSubmission.status)}
              </div>

              {/* Retest Instructions in modal */}
              {selectedSubmission.status === 'needs_retest' && (
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-orange-900 font-bold">
                    <div className="flex items-center space-x-1">
                      <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                      <span>Retest Instructions:</span>
                    </div>
                    <Link
                      to={`/tester/campaigns/${selectedSubmission.campaign_id}/tasks`}
                      className="text-[11px] text-orange-900 hover:underline font-bold"
                    >
                      Open Tasks Workspace
                    </Link>
                  </div>
                  <p className="text-xs text-orange-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.retest_instructions || 'Please revisit the task and test again.'}
                  </p>
                </div>
              )}

              {/* Resolution Notes in modal */}
              {selectedSubmission.status === 'resolved' && selectedSubmission.resolution_notes && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 text-xs block">
                    Resolution Message from Founder:
                  </span>
                  <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.resolution_notes}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-[#52656B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <div className="p-4 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] text-[#102A35] leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.description}
                </div>
              </div>

              {/* Steps to Reproduce */}
              {selectedSubmission.reproduction_steps && (
                <div>
                  <label className="text-[#52656B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                    Steps to Reproduce
                  </label>
                  <div className="p-4 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] text-[#102A35] font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.reproduction_steps}
                  </div>
                </div>
              )}

              {/* Expected vs Actual */}
              {(selectedSubmission.expected_behavior || selectedSubmission.actual_behavior) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSubmission.expected_behavior && (
                    <div>
                      <label className="text-[#52656B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                        Expected Behavior
                      </label>
                      <div className="p-3 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] text-[#102A35] leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.expected_behavior}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.actual_behavior && (
                    <div>
                      <label className="text-[#52656B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                        Actual Behavior
                      </label>
                      <div className="p-3 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] text-[#102A35] leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.actual_behavior}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[#52656B] pt-1">
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
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Go to Testing Tasks</span>
                </Link>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2 text-xs font-semibold rounded-full bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
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
