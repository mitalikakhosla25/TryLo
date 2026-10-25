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
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            {startup ? (
              <Link
                to={`/founder/startups/${startup.id}/campaigns`}
                className="hover:text-white transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>{startup.name} Campaigns</span>
              </Link>
            ) : (
              <Link to="/founder/startups" className="hover:text-white transition-colors">
                Startups
              </Link>
            )}
            <span>/</span>
            {campaign && (
              <Link
                to={`/founder/campaigns/${campaign.id}`}
                className="hover:text-white transition-colors truncate max-w-[180px]"
              >
                {campaign.title}
              </Link>
            )}
            <span>/</span>
            <span className="text-violet-400 font-semibold">Applications</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Review Tester Applications
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#a88bff] border border-[#6338E8]/40">
              {campaign?.title || 'Campaign'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Inspect applicant profiles and screening responses, accept qualified testers within capacity, and manage selection decisions.
          </p>
        </div>

        {campaign && (
          <Link
            to={`/founder/campaigns/${campaign.id}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 shrink-0"
          >
            <span>Back to Campaign</span>
          </Link>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Action Error Notification */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Capacity & Quota Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#a88bff]" />
              <h2 className="text-base font-bold text-white">Campaign Tester Capacity</h2>
            </div>
            <p className="text-xs text-slate-400">
              Accepted applicants immediately receive confidential access instructions to begin testing.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {maxTesters !== null ? (
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isFull
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isFull ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                ></span>
                <span>{isFull ? 'Capacity Reached' : `${maxTesters - acceptedCount} Slots Remaining`}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <Sparkles className="h-3 w-3 text-violet-400" />
                <span>Unlimited Tester Quota</span>
              </span>
            )}
          </div>
        </div>

        {/* Capacity Progress Bar */}
        {maxTesters !== null && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">
                Accepted Testers: <strong className="text-white">{acceptedCount}</strong> of{' '}
                <strong className="text-white">{maxTesters}</strong> maximum
              </span>
              <span className="text-slate-400 font-mono">
                {Math.min(100, Math.round((acceptedCount / maxTesters) * 100))}% Filled
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-[#6338E8] to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (acceptedCount / maxTesters) * 100)}%` }}
              ></div>
            </div>

            {isFull && (
              <p className="text-[11px] text-amber-300/90 pt-1 flex items-center space-x-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filter === 'all'
                ? 'bg-[#6338E8] text-white border-[#6338E8]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Applications
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filter === 'accepted'
                ? 'bg-[#17865B]/20 text-emerald-300 border-[#17865B]/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Accepted ({acceptedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filter === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Not Selected
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by tester name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
          />
        </div>
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
          <h3 className="text-sm font-bold text-white">Failed to load applications</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            {error?.message || 'An error occurred while loading applicants for this campaign.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && allItems.length === 0 && (
        <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {filter === 'all'
                ? 'No Applications Received Yet'
                : `No ${filter} applications found`}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/90 transition-all p-5 sm:p-6 space-y-4 shadow-lg"
              >
                {/* Header row: Tester name, experience badge, location, status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#6338E8]/30 to-slate-800 border border-[#6338E8]/40 flex items-center justify-center text-violet-300 font-bold text-sm shrink-0">
                      {tester.full_name ? tester.full_name.slice(0, 2).toUpperCase() : 'TT'}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-white">
                          {tester.full_name}
                        </h2>
                        {tester.experience_level && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                            {tester.experience_level}
                          </span>
                        )}
                        {(tester.city || tester.country) && (
                          <span className="text-[11px] text-slate-400">
                            {[tester.city, tester.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span>Submitted {new Date(app.created_at).toLocaleDateString()}</span>
                        {tester.linkedin_url && (
                          <>
                            <span>&bull;</span>
                            <a
                              href={tester.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-400 hover:text-violet-300 inline-flex items-center space-x-1"
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
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : isAccepted
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
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
                  <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/60">
                    {tester.bio}
                  </p>
                )}

                {/* Skills & Devices tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {tester.devices && tester.devices.length > 0 && (
                    <div className="flex items-center space-x-1 mr-2 text-slate-400">
                      <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-[11px]">{tester.devices.join(', ')}</span>
                    </div>
                  )}

                  {tester.skills && tester.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tester.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 text-[10px]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Motivation statement */}
                {app.motivation && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wider flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>Applicant's Motivation:</span>
                    </span>
                    <p className="italic text-slate-300 whitespace-pre-line">"{app.motivation}"</p>
                  </div>
                )}

                {/* Rejection note if internal note exists */}
                {app.rejection_note && (
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs space-y-0.5 text-rose-300">
                    <span className="font-semibold text-rose-400 text-[10px] uppercase tracking-wider block">
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
                      className="inline-flex items-center space-x-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium cursor-pointer"
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
                      <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Screening Question Answers
                        </div>
                        <div className="space-y-2.5">
                          {Object.entries(app.screening_answers).map(([qid, ans]) => {
                            const promptText = questionMap[qid] || `Question ID: ${qid}`;
                            return (
                              <div
                                key={qid}
                                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1"
                              >
                                <span className="text-xs text-slate-400 font-medium block">
                                  {promptText}
                                </span>
                                <p className="text-xs text-white font-semibold">
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
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    App ID: {app.id.slice(0, 8)}...
                  </span>

                  {isPending && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenReject(app)}
                        disabled={rejectMutation.isPending || acceptMutation.isPending}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 hover:border-rose-800/80 text-rose-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleOpenAccept(app)}
                        disabled={isFull || acceptMutation.isPending || rejectMutation.isPending}
                        title={isFull ? 'Capacity reached. Cannot accept more testers.' : undefined}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#17865B] hover:bg-[#126b48] text-white shadow-md shadow-[#17865B]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isFull ? 'Capacity Full' : 'Accept Tester'}</span>
                      </button>
                    </div>
                  )}

                  {isAccepted && (
                    <span className="text-xs text-emerald-400 font-medium inline-flex items-center space-x-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Product Access Instructions Granted</span>
                    </span>
                  )}

                  {isRejected && (
                    <span className="text-xs text-slate-400 font-medium inline-flex items-center space-x-1">
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-emerald-400">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Accept Beta Tester</h3>
                <p className="text-xs text-slate-400">Confirm tester onboarding into your campaign</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to accept{' '}
              <strong className="text-white">{acceptModalApp.tester.full_name}</strong> for{' '}
              <strong className="text-white">{campaign?.title || 'this campaign'}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-[#a88bff]">Selection Summary:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={acceptMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#17865B] hover:bg-[#126b48] text-white transition-colors flex items-center space-x-1.5 shadow-md"
              >
                {acceptMutation.isPending ? (
                  <span>Accepting...</span>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Confirm & Accept</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Decline Application</h3>
                <p className="text-xs text-slate-400">Mark applicant as not selected</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to mark the application from{' '}
              <strong className="text-white">{rejectModalApp.tester.full_name}</strong> as Not Selected?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Internal Note (Optional & private to your team):
              </label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="e.g. Device criteria not matching iOS focus, or screened out for timezone..."
                rows={3}
                maxLength={500}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8]"
              />
              <span className="text-[10px] text-slate-400">
                This internal note is never shared with testers.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center space-x-1.5 shadow-md"
              >
                {rejectMutation.isPending ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5" />
                    <span>Confirm & Decline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
