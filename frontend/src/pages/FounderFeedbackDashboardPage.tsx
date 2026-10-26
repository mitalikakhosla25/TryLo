import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Bug,
  Filter,
  Search,
  ArrowUpDown,
  Building,
  Clock,
  RefreshCw,
  AlertCircle,
  Eye,
  StickyNote,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useFounderFeedback } from '../context/useFeedback';
import type { FeedbackStatus, FeedbackType, BugSeverity } from '../api/tasks';

export const FounderFeedbackDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignParam = searchParams.get('campaignId') || '';

  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | BugSeverity>('all');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const {
    data: feedbackData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFounderFeedback({
    status: statusFilter === 'all' ? undefined : statusFilter,
    feedback_type: typeFilter === 'all' ? undefined : typeFilter,
    severity: severityFilter === 'all' ? undefined : severityFilter,
    campaign_id: selectedCampaignId && selectedCampaignId !== 'all' ? selectedCampaignId : undefined,
    search: searchTerm.trim() || undefined,
    sort: sortOrder,
    page: currentPage,
    limit: pageSize,
  });

  const allFeedback = feedbackData?.items || [];
  const totalFeedbackCount = feedbackData?.total ?? 0;
  const totalPages = Math.ceil(totalFeedbackCount / pageSize) || 1;

  const handleCampaignChange = (newCampId: string) => {
    setSelectedCampaignId(newCampId);
    setCurrentPage(1);
    if (newCampId && newCampId !== 'all') {
      searchParams.set('campaignId', newCampId);
    } else {
      searchParams.delete('campaignId');
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSeverityFilter('all');
    setSelectedCampaignId('');
    setSearchTerm('');
    setSortOrder('newest');
    setCurrentPage(1);
    searchParams.delete('campaignId');
    setSearchParams(searchParams);
  };

  const getStatusBadge = (status: FeedbackStatus | string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span>Submitted</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#087C80] animate-pulse"></span>
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
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

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link to="/founder" className="hover:text-[#07545A] transition-colors">
                Founder Workspace
              </Link>
              <span>/</span>
              <span className="text-[#087C80] font-semibold">Feedback &amp; Issue Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight flex items-center space-x-3">
              <span>Feedback Review &amp; Issues</span>
              <span className="text-xs px-3 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] font-medium">
                Issue Tracking
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B]">
              Review bug reports and observations submitted by accepted testers across your startups and campaigns.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => refetch()}
              id="refresh-feedback-btn"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer shadow-xs"
              title="Refresh submissions"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#07545A]" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/founder/applications"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors shadow-xs"
            >
              <Building className="h-3.5 w-3.5 text-[#07545A]" />
              <span>Applications</span>
            </Link>
          </div>
        </div>

        {/* AI Feedback Intelligence Notice (Explicitly marked Coming Soon per V1 scope) */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-sm font-bold text-[#102A35]">AI Feedback Intelligence &amp; Clustering</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-[#52656B] leading-relaxed max-w-3xl">
                Automated bug pattern clustering, sentiment aggregation, and reproduction step summarization are coming soon. All feedback triage, note-taking, and retest decisions are founder-reviewed and verified.
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-5 sm:p-6 space-y-4 shadow-xs">
          {/* Top Controls: Search and Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#52656B]" />
              <input
                type="text"
                id="founder-feedback-search-input"
                placeholder="Search by title, campaign, or startup..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80]"
              />
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1 text-xs text-[#52656B]">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#07545A]" />
                <span>Sort:</span>
              </div>
              <select
                id="founder-feedback-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter Pills / Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#DCE7E3]">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider mr-1">
                Status:
              </span>
              {(['all', 'submitted', 'in_review', 'needs_retest', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                    statusFilter === st
                      ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                      : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Type Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider mr-1">
                Type:
              </span>
              {(['all', 'bug_report', 'general_feedback'] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() => {
                    setTypeFilter(tp);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    typeFilter === tp
                      ? 'bg-[#EFEFE5] text-[#102A35] border-[#DCE7E3] font-bold'
                      : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                  }`}
                >
                  {tp === 'all'
                    ? 'All'
                    : tp === 'bug_report'
                    ? 'Bug Reports'
                    : 'General Feedback'}
                </button>
              ))}
            </div>

            {/* Severity Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider">
                Severity:
              </span>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value as 'all' | BugSeverity);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
              >
                <option value="all">Any Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Campaign Filter Banner if selected */}
          {selectedCampaignId && (
            <div className="p-3 px-4 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-between text-xs text-[#07545A]">
              <span>
                Filtering feedback by campaign ID: <strong className="font-mono">{selectedCampaignId}</strong>
              </span>
              <button
                onClick={() => handleCampaignChange('')}
                className="font-bold underline hover:text-[#087C80] transition-colors cursor-pointer"
              >
                Clear Campaign Filter
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-[#DCE7E3] space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-48 bg-[#EFEFE5] rounded-md"></div>
                  <div className="h-5 w-24 bg-[#EFEFE5] rounded-md"></div>
                </div>
                <div className="h-4 w-72 bg-[#EFEFE5] rounded-md"></div>
                <div className="h-8 w-full bg-[#EFEFE5]/60 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#102A35]">Failed to load feedback</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {error?.message || 'An error occurred while loading feedback records.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && allFeedback.length === 0 && (
          <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center text-[#52656B]">
              <MessageSquare className="h-6 w-6 text-[#07545A]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#102A35]">
                {statusFilter === 'all' && typeFilter === 'all' && !searchTerm && !selectedCampaignId
                  ? 'No Feedback Submissions Yet'
                  : 'No Feedback Matches Filters'}
              </h3>
              <p className="text-xs text-[#52656B] max-w-sm mx-auto">
                {statusFilter === 'all' && typeFilter === 'all' && !searchTerm && !selectedCampaignId
                  ? 'When accepted testers execute tasks and report bugs or observations, they will appear here for review.'
                  : 'Try adjusting your filters, searching for a different keyword, or clearing the current selection.'}
              </p>
            </div>
            {(statusFilter !== 'all' || typeFilter !== 'all' || severityFilter !== 'all' || searchTerm || selectedCampaignId) && (
              <div>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer"
                >
                  <Filter className="h-3 w-3 text-[#07545A]" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback List */}
        {!isLoading && !isError && allFeedback.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#52656B] px-1">
              <span>
                Showing {allFeedback.length} of {totalFeedbackCount} total submissions
              </span>
              {totalPages > 1 && (
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>

            {allFeedback.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all p-6 sm:p-7 space-y-4 shadow-xs group"
              >
                {/* Header row: Type badge, severity, title, status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Feedback Type Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          item.feedback_type === 'bug_report'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA]'
                        }`}
                      >
                        {item.feedback_type === 'bug_report' ? (
                          <>
                            <Bug className="h-3 w-3 text-rose-600" />
                            <span>BUG REPORT</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3 w-3 text-[#07545A]" />
                            <span>OBSERVATION</span>
                          </>
                        )}
                      </span>

                      {/* Severity Pill (if bug) */}
                      {item.severity && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                            item.severity === 'critical'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : item.severity === 'high'
                              ? 'bg-orange-100 text-orange-900 border-orange-300'
                              : item.severity === 'medium'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {item.severity} severity
                        </span>
                      )}

                      {/* Status Badge */}
                      {getStatusBadge(item.status)}

                      {/* Notes count badge if present */}
                      {item.notes_count > 0 && (
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3] flex items-center space-x-1">
                          <StickyNote className="h-3 w-3 text-[#07545A]" />
                          <span>{item.notes_count} note{item.notes_count > 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-base sm:text-lg font-bold text-[#102A35] group-hover:text-[#07545A] transition-colors pt-0.5">
                      <Link to={`/founder/feedback/${item.id}`}>{item.title}</Link>
                    </h2>
                    <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Right: Date & Action Link */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0">
                    <div className="flex items-center space-x-1 text-[11px] text-[#52656B]">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>

                    <Link
                      to={`/founder/feedback/${item.id}`}
                      id={`review-feedback-btn-${item.id}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review Issue</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Context Footer: Campaign, Startup, Tester, Task */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#DCE7E3] text-xs text-[#52656B]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center space-x-1 text-[#102A35]">
                      <span className="text-[#52656B]">Campaign:</span>
                      <Link
                        to={`/founder/campaigns/${item.campaign_id}`}
                        className="font-semibold text-[#07545A] hover:underline"
                      >
                        {item.campaign_title}
                      </Link>
                      {item.startup_name && (
                        <span className="text-[#52656B]">({item.startup_name})</span>
                      )}
                    </span>

                    {item.task_title && (
                      <span className="flex items-center space-x-1 text-[#52656B]">
                        <span>&bull;</span>
                        <span>Task:</span>
                        <span className="text-[#102A35] font-medium">{item.task_title}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span>Tester:</span>
                    <span className="font-semibold text-[#102A35]">{item.tester_name}</span>
                    {item.tester_experience_level && (
                      <span className="px-2 py-0.5 rounded-full bg-[#EFEFE5] text-[10px] text-[#07545A] border border-[#DCE7E3]">
                        {item.tester_experience_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-3 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-[#52656B]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
