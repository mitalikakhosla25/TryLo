import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyApplications } from '../context/useApplications';
import { getCampaignAccess, type CampaignAccessInstructions } from '../api/applications';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  Coins,
  Gift,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Key,
  Copy,
  Check,
  X,
  Lock,
  ListChecks,
} from 'lucide-react';

export const TesterApplicationsPage: React.FC = () => {
  const { data: applications, isLoading, isError, error, refetch } = useMyApplications();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Confidential access instructions modal state
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [activeAccess, setActiveAccess] = useState<CampaignAccessInstructions | null>(null);
  const [copied, setCopied] = useState(false);

  const allApps = applications || [];
  const pendingCount = allApps.filter((a) => a.status === 'pending').length;
  const acceptedCount = allApps.filter((a) => a.status === 'accepted').length;
  const rejectedCount = allApps.filter((a) => a.status === 'rejected').length;

  const filteredApps = allApps.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const toggleExpand = (id: string) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  const handleFetchAccess = async (campaignId: string) => {
    setAccessLoading(true);
    setAccessError(null);
    try {
      const data = await getCampaignAccess(campaignId);
      setActiveAccess(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve access instructions.';
      setAccessError(msg);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleCopyInstructions = (text?: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link to="/tester/workspace" className="hover:text-white transition-colors">
              Tester Workspace
            </Link>
            <span>/</span>
            <span className="text-violet-400 font-semibold">My Applications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            My Campaign Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track your submitted beta test applications, founder review status, and retrieve authorized product testing instructions.
          </p>
        </div>

        <Link
          to="/tester/discover"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-all shadow-md shadow-[#6338E8]/20 shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>Discover Campaigns</span>
        </Link>
      </div>

      {/* Access Error Banner */}
      {accessError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{accessError}</span>
          </div>
          <button
            onClick={() => setAccessError(null)}
            className="text-rose-400 hover:text-rose-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
          All Applications ({allApps.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            filter === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Awaiting Review ({pendingCount})
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
          Not Selected ({rejectedCount})
        </button>
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

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Failed to load applications</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            {error?.message || 'An error occurred while retrieving your submitted applications.'}
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
      {!isLoading && !isError && filteredApps.length === 0 && (
        <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {filter === 'all'
                ? 'No Applications Submitted Yet'
                : `No ${filter === 'pending' ? 'pending review' : filter} applications found`}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'all'
                ? 'Explore active startup beta testing campaigns and submit your first application to earn rewards and test innovative software.'
                : `You currently have zero applications in the "${filter}" status category.`}
            </p>
          </div>
          <div>
            <Link
              to="/tester/discover"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-colors"
            >
              <span>Explore Open Campaigns</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Application Cards List */}
      {!isLoading && !isError && filteredApps.length > 0 && (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isPending = app.status === 'pending';
            const isAccepted = app.status === 'accepted';
            const isRejected = app.status === 'rejected';
            const isExpanded = expandedAppId === app.id;
            const answersCount = Object.keys(app.screening_answers || {}).length;

            return (
              <div
                key={app.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all p-5 sm:p-6 space-y-4 shadow-lg"
              >
                {/* Header row: Startup, Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    {app.startup_logo_url ? (
                      <img
                        src={app.startup_logo_url}
                        alt={app.startup_name}
                        className="h-11 w-11 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#6338E8]/20 to-slate-800 border border-[#6338E8]/30 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                        {app.startup_name ? app.startup_name.slice(0, 2).toUpperCase() : <Building className="h-5 w-5" />}
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {app.startup_name}
                        </span>
                        {app.campaign_product_type && (
                          <span className="px-2 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {app.campaign_product_type}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white hover:text-violet-300 transition-colors">
                        <Link to={`/campaigns/${app.startup_slug}/${app.campaign_slug}`}>
                          {app.campaign_title}
                        </Link>
                      </h2>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                        isPending
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : isAccepted
                          ? 'bg-[#17865B]/15 text-emerald-300 border-[#17865B]/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {isPending && <Clock className="h-3.5 w-3.5" />}
                      {isAccepted && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {isRejected && <XCircle className="h-3.5 w-3.5" />}
                      <span>
                        {isPending ? 'Awaiting founder review' : isAccepted ? 'Accepted' : 'Not selected'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Status-specific Callout / Explanation */}
                {isPending && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2.5">
                    <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-white">Awaiting Founder Review</span>
                      <p className="text-[11px] text-amber-200/80">
                        The startup founder has received your application and is reviewing your answers. Once accepted, your private product access instructions will appear here.
                      </p>
                    </div>
                  </div>
                )}

                {isAccepted && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">You're Accepted!</span>
                        <p className="text-[11px] text-emerald-200/80">
                          The founder has selected you for this test round. Retrieve your authorized access credentials and testing instructions below.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        to={`/tester/campaigns/${app.campaign_id}/tasks`}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#6338E8] hover:bg-[#522ecc] text-white transition-all shadow-md cursor-pointer"
                      >
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>View Tasks</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleFetchAccess(app.campaign_id)}
                        disabled={accessLoading}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#17865B] hover:bg-[#126b48] text-white transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span>{accessLoading ? 'Loading Instructions...' : 'Access Product'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2.5">
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-300 block">Not Selected</span>
                      <p className="text-[11px] text-slate-400">
                        Thank you for applying. The startup founder selected other testers whose profile criteria or device configurations closely matched this specific testing round.
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary & Reward Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                  </span>

                  {app.reward_type === 'monetary' && app.reward_amount && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      <Coins className="h-3 w-3" />
                      <span>
                        {app.reward_currency || '$'}
                        {app.reward_amount} Reward
                      </span>
                    </span>
                  )}

                  {app.reward_type === 'perk' && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 font-semibold">
                      <Gift className="h-3 w-3" />
                      <span>Perk: {app.reward_description || 'Product Access'}</span>
                    </span>
                  )}

                  {answersCount > 0 && (
                    <span className="text-slate-400">
                      &bull; {answersCount} screening answer{answersCount > 1 ? 's' : ''} submitted
                    </span>
                  )}
                </div>

                {/* Motivation statement quote */}
                {app.motivation && (
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 space-y-0.5">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wider">
                      Your Motivation:
                    </span>
                    <p className="italic text-slate-300">"{app.motivation}"</p>
                  </div>
                )}

                {/* Expandable answers drawer */}
                {answersCount > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(app.id)}
                      className="inline-flex items-center space-x-1 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'Review'} submitted screening answers</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase">
                          Submitted Answers
                        </div>
                        {Object.entries(app.screening_answers).map(([qid, ans]) => (
                          <div
                            key={qid}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1"
                          >
                            <span className="text-[11px] text-slate-400 font-mono">
                              Question [{qid}]:
                            </span>
                            <p className="text-white font-medium">
                              {typeof ans === 'boolean' ? (ans ? 'Yes' : 'No') : String(ans)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom link */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400">
                    Application ID: {app.id.slice(0, 8)}...
                  </span>
                  <Link
                    to={`/campaigns/${app.startup_slug}/${app.campaign_slug}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <span>View Campaign Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confidential Product Access Modal (Accepted Testers Only) */}
      {activeAccess && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3 text-emerald-400">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Product Access Instructions</h3>
                  <p className="text-xs text-slate-400">{activeAccess.title}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAccess(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-300 flex items-start space-x-2">
              <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Confidential credentials: These instructions are private and provided solely to authorized beta testers for this campaign.
              </span>
            </div>

            {activeAccess.product_url && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Product URL:</label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-mono text-white truncate max-w-[280px]">
                    {activeAccess.product_url}
                  </span>
                  <a
                    href={activeAccess.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white transition-colors shrink-0"
                  >
                    <span>Launch</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Access & Testing Instructions:
                </label>
                {activeAccess.access_instructions && (
                  <button
                    type="button"
                    onClick={() => handleCopyInstructions(activeAccess.access_instructions)}
                    className="inline-flex items-center space-x-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Instructions'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans">
                {activeAccess.access_instructions || 'No specific access instructions provided.'}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveAccess(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
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
