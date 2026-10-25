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
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            <span>Submitted</span>
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#c4b5fd] border border-[#6338E8]/40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a88bff] animate-pulse"></span>
            <span>In Review</span>
          </span>
        );
      case 'needs_retest':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <RotateCcw className="h-3 w-3" />
            <span>Needs Retest</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#17865B]/20 text-emerald-300 border border-[#17865B]/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Resolved</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link to="/founder" className="hover:text-white transition-colors">
              Founder Workspace
            </Link>
            <span>/</span>
            <span className="text-[#a88bff] font-semibold">Feedback &amp; Issue Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>Feedback Review &amp; Issues</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#6338E8]/20 text-[#c4b5fd] border border-[#6338E8]/30 font-normal">
              Issue Tracking
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review bug reports and observations submitted by accepted testers across your startups and campaigns.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => refetch()}
            id="refresh-feedback-btn"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/founder/applications"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Building className="h-3.5 w-3.5" />
            <span>Applications</span>
          </Link>
        </div>
      </div>

      {/* AI Feedback Intelligence Notice (Explicitly marked Coming Soon per V1 scope) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#6338E8]/10 via-slate-900/90 to-slate-900/60 border border-[#6338E8]/25 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#6338E8]/20 text-[#a88bff] border border-[#6338E8]/30 shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-sm font-bold text-white">AI Feedback Intelligence &amp; Clustering</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Automated bug pattern clustering, sentiment aggregation, and reproduction step summarization are coming soon. All feedback triage, note-taking, and retest decisions are founder-reviewed and verified.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-lg">
        {/* Top Controls: Search and Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              id="founder-feedback-search-input"
              placeholder="Search by title, campaign, or startup..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1 text-xs text-slate-400">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <span>Sort:</span>
            </div>
            <select
              id="founder-feedback-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#6338E8]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Status:
            </span>
            {(['all', 'submitted', 'in_review', 'needs_retest', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all border ${
                  statusFilter === st
                    ? 'bg-[#6338E8] text-white border-[#6338E8] shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Type:
            </span>
            {(['all', 'bug_report', 'general_feedback'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => {
                  setTypeFilter(tp);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  typeFilter === tp
                    ? 'bg-slate-800 text-white border-slate-600'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
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
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Severity:
            </span>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as 'all' | BugSeverity);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#6338E8]"
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
          <div className="p-2.5 px-3 rounded-xl bg-[#6338E8]/10 border border-[#6338E8]/20 flex items-center justify-between text-xs text-[#c4b5fd]">
            <span>
              Filtering feedback by campaign ID: <strong className="font-mono">{selectedCampaignId}</strong>
            </span>
            <button
              onClick={() => handleCampaignChange('')}
              className="font-bold underline hover:text-white transition-colors"
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
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-48 bg-slate-800 rounded"></div>
                <div className="h-5 w-24 bg-slate-800 rounded"></div>
              </div>
              <div className="h-4 w-72 bg-slate-800/60 rounded"></div>
              <div className="h-8 w-full bg-slate-800/40 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Failed to load feedback</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            {error?.message || 'An error occurred while loading feedback records.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && allFeedback.length === 0 && (
        <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {statusFilter === 'all' && typeFilter === 'all' && !searchTerm && !selectedCampaignId
                ? 'No Feedback Submissions Yet'
                : 'No Feedback Matches Filters'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'all' && typeFilter === 'all' && !searchTerm && !selectedCampaignId
                ? 'When accepted testers execute tasks and report bugs or observations, they will appear here for review.'
                : 'Try adjusting your filters, searching for a different keyword, or clearing the current selection.'}
            </p>
          </div>
          {(statusFilter !== 'all' || typeFilter !== 'all' || severityFilter !== 'all' || searchTerm || selectedCampaignId) && (
            <div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Filter className="h-3 w-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feedback List */}
      {!isLoading && !isError && allFeedback.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
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
              className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all p-5 sm:p-6 space-y-4 shadow-md group"
            >
              {/* Header row: Type badge, severity, title, status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Feedback Type Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        item.feedback_type === 'bug_report'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {item.feedback_type === 'bug_report' ? (
                        <>
                          <Bug className="h-3 w-3" />
                          <span>BUG REPORT</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3 w-3" />
                          <span>OBSERVATION</span>
                        </>
                      )}
                    </span>

                    {/* Severity Pill (if bug) */}
                    {item.severity && (
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                          item.severity === 'critical'
                            ? 'bg-rose-600/20 text-rose-400 border-rose-500/40'
                            : item.severity === 'high'
                            ? 'bg-orange-600/20 text-orange-400 border-orange-500/40'
                            : item.severity === 'medium'
                            ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {item.severity} severity
                      </span>
                    )}

                    {/* Status Badge */}
                    {getStatusBadge(item.status)}

                    {/* Notes count badge if present */}
                    {item.notes_count > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1">
                        <StickyNote className="h-3 w-3 text-[#a88bff]" />
                        <span>{item.notes_count} note{item.notes_count > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-[#c4b5fd] transition-colors pt-0.5">
                    <Link to={`/founder/feedback/${item.id}`}>{item.title}</Link>
                  </h2>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Right: Date & Action Link */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0">
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <Link
                    to={`/founder/feedback/${item.id}`}
                    id={`review-feedback-btn-${item.id}`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white shadow-sm shadow-[#6338E8]/20 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Review Issue</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Context Footer: Campaign, Startup, Tester, Task */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <span className="text-slate-500">Campaign:</span>
                    <Link
                      to={`/founder/campaigns/${item.campaign_id}`}
                      className="font-semibold text-[#a88bff] hover:underline"
                    >
                      {item.campaign_title}
                    </Link>
                    {item.startup_name && (
                      <span className="text-slate-500">({item.startup_name})</span>
                    )}
                  </span>

                  {item.task_title && (
                    <span className="flex items-center space-x-1 text-slate-400">
                      <span>&bull;</span>
                      <span className="text-slate-500">Task:</span>
                      <span className="text-slate-300">{item.task_title}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-slate-500">Tester:</span>
                  <span className="font-semibold text-slate-300">{item.tester_name}</span>
                  {item.tester_experience_level && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
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
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
