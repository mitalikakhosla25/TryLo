import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useCampaignApplications,
  useAcceptApplication,
  useRejectApplication,
} from '../context/useApplications';
import { useCampaign } from '../context/useCampaigns';
import { useStartup } from '../context/useStartups';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Smartphone,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { FounderApplicationItem } from '../api/applications';

export const CampaignApplicationsPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  const { data: campaign } = useCampaign(campaignId);
  const { data: startup } = useStartup(campaign?.startup_id);

  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Modals state
  const [acceptModalApp, setAcceptModalApp] = useState<FounderApplicationItem | null>(null);
  const [rejectModalApp, setRejectModalApp] = useState<FounderApplicationItem | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: applicationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCampaignApplications(campaignId, {
    status: filter,
    search: searchQuery || undefined,
  });

  const acceptMutation = useAcceptApplication(campaignId);
  const rejectMutation = useRejectApplication(campaignId);

  const allItems = applicationsData?.items || [];
  const acceptedCount = applicationsData?.accepted_testers ?? 0;
  const maxTesters = applicationsData?.max_testers ?? campaign?.max_testers ?? null;
  const isFull = applicationsData?.is_full ?? (maxTesters !== null && acceptedCount >= maxTesters);

  // Question lookup map from campaign config
  const questionMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (campaign?.screening_questions) {
      for (const q of campaign.screening_questions) {
        if (q.id && q.prompt) {
          map[q.id] = q.prompt;
        }
      }
    }
    return map;
  }, [campaign]);

  const toggleExpand = (id: string) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  const handleOpenAccept = (app: FounderApplicationItem) => {
    setActionError(null);
    setAcceptModalApp(app);
  };

  const handleConfirmAccept = async () => {
    if (!acceptModalApp) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await acceptMutation.mutateAsync(acceptModalApp.id);
      setSuccessMessage(`Successfully accepted ${acceptModalApp.tester.full_name} for this campaign.`);
      setAcceptModalApp(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept application.';
      setActionError(msg);
    }
  };

  const handleOpenReject = (app: FounderApplicationItem) => {
    setActionError(null);
    setRejectionNote('');
    setRejectModalApp(app);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalApp) return;
    setActionError(null);
    setSuccessMessage(null);
    try {
      await rejectMutation.mutateAsync({
        applicationId: rejectModalApp.id,
        rejectionNote: rejectionNote.trim() || undefined,
      });
      setSuccessMessage(`Application for ${rejectModalApp.tester.full_name} marked as Not Selected.`);
      setRejectModalApp(null);
      setRejectionNote('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject application.';
      setActionError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              {startup ? (
                <Link
                  to={`/founder/startups/${startup.id}/campaigns`}
                  className="hover:text-[#102A35] transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>{startup.name} Campaigns</span>
                </Link>
              ) : (
                <Link to="/founder/startups" className="hover:text-[#102A35] transition-colors">
                  Startups
                </Link>
              )}
              <span>/</span>
              {campaign && (
                <Link
                  to={`/founder/campaigns/${campaign.id}`}
                  className="hover:text-[#102A35] transition-colors truncate max-w-[180px]"
                >
                  {campaign.title}
                </Link>
              )}
              <span>/</span>
              <span className="text-[#087C80] font-semibold">Applications</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                Review Tester Applications
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                {campaign?.title || 'Campaign'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#52656B]">
              Inspect applicant profiles and screening responses, accept qualified testers within capacity, and manage selection decisions.
            </p>
          </div>

          {campaign && (
            <Link
              to={`/founder/campaigns/${campaign.id}`}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-colors shrink-0 shadow-xs"
            >
              <span>Back to Campaign</span>
            </Link>
          )}
        </div>

        {/* Success Notification */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] text-[#0E7C57] text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-[#0E7C57] shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-[#0E7C57] hover:text-[#07545A] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Action Error Notification */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-700 hover:text-rose-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Capacity & Quota Header Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[#087C80]">
                <Users className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Campaign Tester Capacity</h2>
              </div>
              <p className="text-xs text-[#52656B]">
                Accepted applicants immediately receive confidential access instructions to begin testing.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {maxTesters !== null ? (
                <span
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isFull
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-[#E6F7F0] text-[#0E7C57] border-[#B6EDD5]'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isFull ? 'bg-amber-500' : 'bg-[#0E7C57] animate-pulse'
                    }`}
                  ></span>
                  <span>{isFull ? 'Capacity Reached' : `${maxTesters - acceptedCount} Slots Remaining`}</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
                  <Sparkles className="h-3 w-3 text-[#087C80]" />
                  <span>Unlimited Tester Quota</span>
                </span>
              )}
            </div>
          </div>

          {/* Capacity Progress Bar */}
          {maxTesters !== null && (
            <div className="space-y-2 pt-2 border-t border-[#DCE7E3]">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#52656B]">
                  Accepted Testers: <strong className="text-[#102A35]">{acceptedCount}</strong> of{' '}
                  <strong className="text-[#102A35]">{maxTesters}</strong> maximum
                </span>
                <span className="text-[#52656B] font-mono">
                  {Math.min(100, Math.round((acceptedCount / maxTesters) * 100))}% Filled
                </span>
              </div>

              <div className="h-2.5 w-full bg-[#EFEFE5] rounded-full overflow-hidden p-0.5 border border-[#DCE7E3]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-[#087C80] to-[#0E7C57]'
                  }`}
                  style={{ width: `${Math.min(100, (acceptedCount / maxTesters) * 100)}%` }}
                ></div>
              </div>

              {isFull && (
                <p className="text-[11px] text-amber-800 pt-1 flex items-center space-x-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>
                    This campaign has reached its max tester quota. Acceptance buttons are disabled until quota is adjusted or slots become available.
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="inline-flex items-center p-1 bg-[#EFEFE5] rounded-full border border-[#DCE7E3]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-[#087C80] text-white shadow-xs'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              All Applications
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === 'pending'
                  ? 'bg-[#087C80] text-white shadow-xs'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === 'accepted'
                  ? 'bg-[#087C80] text-white shadow-xs'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === 'rejected'
                  ? 'bg-[#087C80] text-white shadow-xs'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              Not Selected
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#52656B]" />
            <input
              type="text"
              placeholder="Search by tester name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-[#DCE7E3] space-y-3 animate-pulse shadow-xs"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-48 bg-[#EFEFE5] rounded"></div>
                  <div className="h-5 w-24 bg-[#EFEFE5] rounded"></div>
                </div>
                <div className="h-4 w-72 bg-[#EFEFE5]/70 rounded"></div>
                <div className="h-8 w-full bg-[#EFEFE5]/40 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Failed to load applications</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {error?.message || 'An error occurred while loading applicants for this campaign.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4.5 py-2 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && allItems.length === 0 && (
          <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#102A35]">
                {filter === 'all'
                  ? 'No Applications Received Yet'
                  : `No ${filter} applications found`}
              </h3>
              <p className="text-xs text-[#52656B] max-w-sm mx-auto">
                {filter === 'all'
                  ? 'Testers can discover your campaign and submit screening answers once your campaign is published.'
                  : `There are currently no applications matching the "${filter}" filter criteria.`}
              </p>
            </div>
          </div>
        )}

        {/* Applicants List */}
        {!isLoading && !isError && allItems.length > 0 && (
          <div className="space-y-4">
            {allItems.map((app) => {
              const isPending = app.status === 'pending';
              const isAccepted = app.status === 'accepted';
              const isRejected = app.status === 'rejected';
              const isExpanded = expandedAppId === app.id;
              const answersCount = Object.keys(app.screening_answers || {}).length;
              const tester = app.tester;

              return (
                <div
                  key={app.id}
                  className="rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all p-5 sm:p-6 space-y-4 shadow-xs hover:shadow-sm"
                >
                  {/* Header row: Tester name, experience badge, location, status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] font-bold text-sm shrink-0 shadow-xs">
                        {tester.full_name ? tester.full_name.slice(0, 2).toUpperCase() : 'TT'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-[#102A35]">
                            {tester.full_name}
                          </h2>
                          {tester.experience_level && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                              {tester.experience_level}
                            </span>
                          )}
                          {(tester.city || tester.country) && (
                            <span className="text-[11px] text-[#52656B]">
                              {[tester.city, tester.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-[#52656B]">
                          <span>Submitted {new Date(app.created_at).toLocaleDateString()}</span>
                          {tester.linkedin_url && (
                            <>
                              <span>&bull;</span>
                              <a
                                href={tester.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#087C80] hover:text-[#07545A] inline-flex items-center space-x-1 font-medium"
                              >
                                <span>LinkedIn</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isAccepted
                            ? 'bg-[#E6F7F0] text-[#0E7C57] border-[#B6EDD5]'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isPending && <Clock className="h-3.5 w-3.5" />}
                        {isAccepted && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {isRejected && <XCircle className="h-3.5 w-3.5" />}
                        <span>{isPending ? 'Pending Review' : isAccepted ? 'Accepted' : 'Not Selected'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bio text if provided */}
                  {tester.bio && (
                    <p className="text-xs text-[#52656B] leading-relaxed pt-2 border-t border-[#DCE7E3]">
                      {tester.bio}
                    </p>
                  )}

                  {/* Skills & Devices tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {tester.devices && tester.devices.length > 0 && (
                      <div className="flex items-center space-x-1 mr-2 text-[#52656B]">
                        <Smartphone className="h-3.5 w-3.5 text-[#087C80]" />
                        <span className="text-[11px] font-medium">{tester.devices.join(', ')}</span>
                      </div>
                    )}

                    {tester.skills && tester.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tester.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Motivation statement */}
                  {app.motivation && (
                    <div className="p-3.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs space-y-1">
                      <span className="font-bold text-[#52656B] block text-[10px] uppercase tracking-wider flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3 text-[#087C80]" />
                        <span>Applicant's Motivation:</span>
                      </span>
                      <p className="italic text-[#102A35] whitespace-pre-line">"{app.motivation}"</p>
                    </div>
                  )}

                  {/* Rejection note if internal note exists */}
                  {app.rejection_note && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-0.5 text-rose-800">
                      <span className="font-bold text-rose-900 text-[10px] uppercase tracking-wider block">
                        Internal Founder Note:
                      </span>
                      <p>{app.rejection_note}</p>
                    </div>
                  )}

                  {/* Screening Answers Drawer */}
                  {answersCount > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(app.id)}
                        className="inline-flex items-center space-x-1.5 text-xs text-[#087C80] hover:text-[#07545A] transition-colors font-semibold cursor-pointer"
                      >
                        <span>
                          {isExpanded ? 'Hide' : 'Inspect'} screening answers ({answersCount})
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-3 animate-in fade-in">
                          <div className="text-[11px] font-bold text-[#52656B] uppercase tracking-wider">
                            Screening Question Answers
                          </div>
                          <div className="space-y-2.5">
                            {Object.entries(app.screening_answers).map(([qid, ans]) => {
                              const promptText = questionMap[qid] || `Question ID: ${qid}`;
                              return (
                                <div
                                  key={qid}
                                  className="p-3 rounded-xl bg-white border border-[#DCE7E3] space-y-1"
                                >
                                  <span className="text-xs text-[#52656B] font-medium block">
                                    {promptText}
                                  </span>
                                  <p className="text-xs text-[#102A35] font-semibold">
                                    {typeof ans === 'boolean'
                                      ? ans
                                        ? 'Yes'
                                        : 'No'
                                      : String(ans)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Controls Footer */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE7E3]">
                    <span className="text-[11px] text-[#52656B]">
                      App ID: {app.id.slice(0, 8)}...
                    </span>

                    {isPending && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenReject(app)}
                          disabled={rejectMutation.isPending || acceptMutation.isPending}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleOpenAccept(app)}
                          disabled={isFull || acceptMutation.isPending || rejectMutation.isPending}
                          title={isFull ? 'Capacity reached. Cannot accept more testers.' : undefined}
                          className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{isFull ? 'Capacity Full' : 'Accept Tester'}</span>
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <span className="text-xs text-[#0E7C57] font-semibold inline-flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Product Access Instructions Granted</span>
                      </span>
                    )}

                    {isRejected && (
                      <span className="text-xs text-[#52656B] font-medium inline-flex items-center space-x-1">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Application Decision Finalized</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accept Confirmation Modal */}
        {acceptModalApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-[#0E7C57]">
                <div className="h-10 w-10 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Accept Beta Tester</h3>
                  <p className="text-xs text-[#52656B]">Confirm tester onboarding into your campaign</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                Are you sure you want to accept{' '}
                <strong className="text-[#102A35]">{acceptModalApp.tester.full_name}</strong> for{' '}
                <strong className="text-[#102A35]">{campaign?.title || 'this campaign'}</strong>?
              </p>

              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#52656B] space-y-1">
                <div className="font-bold text-[#102A35]">Selection Summary:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[#52656B] text-[11px]">
                  <li>Confidential product access instructions will be immediately unlocked for this tester.</li>
                  <li>Consumes 1 of your {maxTesters !== null ? `${maxTesters} campaign capacity slots` : 'testing slots'}.</li>
                  <li>This decision is permanent and cannot be reversed.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAcceptModalApp(null)}
                  disabled={acceptMutation.isPending}
                  className="px-4.5 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAccept}
                  disabled={acceptMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {acceptMutation.isPending ? (
                    <span>Accepting...</span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirm &amp; Accept</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectModalApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102A35]">Decline Application</h3>
                  <p className="text-xs text-[#52656B]">Mark applicant as not selected</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                Are you sure you want to mark the application from{' '}
                <strong className="text-[#102A35]">{rejectModalApp.tester.full_name}</strong> as Not Selected?
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#102A35] block">
                  Internal Note (Optional &amp; private to your team):
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Device criteria not matching iOS focus, or screened out for timezone..."
                  rows={3}
                  maxLength={500}
                  className="w-full p-3 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                />
                <span className="text-[10px] text-[#52656B]">
                  This internal note is never shared with testers.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  disabled={rejectMutation.isPending}
                  className="px-4.5 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={rejectMutation.isPending}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  {rejectMutation.isPending ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span>Confirm &amp; Decline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
