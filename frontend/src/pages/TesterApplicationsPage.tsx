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
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link to="/tester/workspace" className="hover:text-[#07545A] transition-colors">
                Tester Workspace
              </Link>
              <span>/</span>
              <span className="text-[#087C80] font-semibold">My Applications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              My Campaign Applications
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B]">
              Track your submitted beta test applications, founder review status, and retrieve authorized product testing instructions.
            </p>
          </div>

          <Link
            to="/tester/discover"
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-all shadow-xs shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Discover Campaigns</span>
          </Link>
        </div>

        {/* Access Error Banner */}
        {accessError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-medium">{accessError}</span>
            </div>
            <button
              onClick={() => setAccessError(null)}
              className="text-rose-700 hover:text-rose-900 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              filter === 'all'
                ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
            }`}
          >
            All Applications ({allApps.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              filter === 'pending'
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
            }`}
          >
            Awaiting Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              filter === 'accepted'
                ? 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA] shadow-xs'
                : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
            }`}
          >
            Accepted ({acceptedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              filter === 'rejected'
                ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
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

        {/* Error state */}
        {isError && (
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#102A35]">Failed to load applications</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              {error?.message || 'An error occurred while retrieving your submitted applications.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredApps.length === 0 && (
          <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center text-[#52656B]">
              <ClipboardList className="h-6 w-6 text-[#07545A]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#102A35]">
                {filter === 'all'
                  ? 'No Applications Submitted Yet'
                  : `No ${filter === 'pending' ? 'pending review' : filter} applications found`}
              </h3>
              <p className="text-xs text-[#52656B] max-w-sm mx-auto">
                {filter === 'all'
                  ? 'Explore active startup beta testing campaigns and submit your first application to earn rewards and test innovative software.'
                  : `You currently have zero applications in the "${filter}" status category.`}
              </p>
            </div>
            <div>
              <Link
                to="/tester/discover"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
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
                  className="rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all p-6 sm:p-7 space-y-4 shadow-xs"
                >
                  {/* Header row: Startup, Title & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      {app.startup_logo_url ? (
                        <img
                          src={app.startup_logo_url}
                          alt={app.startup_name}
                          className="h-11 w-11 rounded-2xl object-cover bg-white border border-[#DCE7E3] shrink-0"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#07545A] font-bold text-sm shrink-0">
                          {app.startup_name ? app.startup_name.slice(0, 2).toUpperCase() : <Building className="h-5 w-5" />}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-[#52656B]">
                            {app.startup_name}
                          </span>
                          {app.campaign_product_type && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFEFE5] text-[#07545A] border border-[#DCE7E3]">
                              {app.campaign_product_type}
                            </span>
                          )}
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-[#102A35] hover:text-[#07545A] transition-colors">
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
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isAccepted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
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
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-[#102A35]">Awaiting Founder Review</span>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          The startup founder has received your application and is reviewing your answers. Once accepted, your private product access instructions will appear here.
                        </p>
                      </div>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start space-x-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#102A35] block">You're Accepted!</span>
                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                            The founder has selected you for this test round. Retrieve your authorized access credentials and testing instructions below.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          to={`/tester/campaigns/${app.campaign_id}/tasks`}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs cursor-pointer"
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          <span>View Tasks</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleFetchAccess(app.campaign_id)}
                          disabled={accessLoading}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-[#EFEFE5] text-[#07545A] border border-[#BCE1DA] transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          <Key className="h-3.5 w-3.5" />
                          <span>{accessLoading ? 'Loading Instructions...' : 'Access Product'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-3.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#52656B] flex items-start space-x-2.5">
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[#102A35] block">Not Selected</span>
                        <p className="text-[11px] text-[#52656B] leading-relaxed">
                          Thank you for applying. The startup founder selected other testers whose profile criteria or device configurations closely matched this specific testing round.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary & Reward Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#52656B] pt-2 border-t border-[#DCE7E3]">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-[#07545A]" />
                      <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                    </span>

                    {app.reward_type === 'monetary' && app.reward_amount && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] font-semibold">
                        <Coins className="h-3 w-3" />
                        <span>
                          {app.reward_currency || '$'}
                          {app.reward_amount} Reward
                        </span>
                      </span>
                    )}

                    {app.reward_type === 'perk' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        <Gift className="h-3 w-3 text-amber-600" />
                        <span>Perk: {app.reward_description || 'Product Access'}</span>
                      </span>
                    )}

                    {answersCount > 0 && (
                      <span className="text-[#52656B]">
                        &bull; {answersCount} screening answer{answersCount > 1 ? 's' : ''} submitted
                      </span>
                    )}
                  </div>

                  {/* Motivation statement quote */}
                  {app.motivation && (
                    <div className="p-3.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#102A35] space-y-1">
                      <span className="font-semibold text-[#07545A] block text-[10px] uppercase tracking-wider">
                        Your Motivation:
                      </span>
                      <p className="italic text-[#102A35]">"{app.motivation}"</p>
                    </div>
                  )}

                  {/* Expandable answers drawer */}
                  {answersCount > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(app.id)}
                        className="inline-flex items-center space-x-1 text-xs text-[#07545A] hover:text-[#087C80] transition-colors font-semibold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Review'} submitted screening answers</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2 text-xs">
                          <div className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider">
                            Submitted Answers
                          </div>
                          {Object.entries(app.screening_answers).map(([qid, ans]) => (
                            <div
                              key={qid}
                              className="p-3 rounded-xl bg-white border border-[#DCE7E3] space-y-1"
                            >
                              <span className="text-[11px] text-[#52656B] font-mono">
                                Question [{qid}]:
                              </span>
                              <p className="text-[#102A35] font-semibold">
                                {typeof ans === 'boolean' ? (ans ? 'Yes' : 'No') : String(ans)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom link */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#DCE7E3]">
                    <span className="text-[11px] text-[#52656B]">
                      Application ID: {app.id.slice(0, 8)}...
                    </span>
                    <Link
                      to={`/campaigns/${app.startup_slug}/${app.campaign_slug}`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#07545A] hover:text-[#087C80] transition-colors"
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
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE7E3] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#DCE7E3] pb-4">
                <div className="flex items-center space-x-3 text-emerald-800">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Key className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#102A35]">Product Access Instructions</h3>
                    <p className="text-xs text-[#52656B]">{activeAccess.title}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveAccess(null)}
                  className="text-[#52656B] hover:text-[#102A35] transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Confidential credentials: These instructions are private and provided solely to authorized beta testers for this campaign.
                </span>
              </div>

              {activeAccess.product_url && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#102A35] block">Product URL:</label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs">
                    <span className="font-mono text-[#102A35] truncate max-w-[280px]">
                      {activeAccess.product_url}
                    </span>
                    <a
                      href={activeAccess.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors shrink-0 shadow-xs"
                    >
                      <span>Launch</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#102A35]">
                    Access &amp; Testing Instructions:
                  </label>
                  {activeAccess.access_instructions && (
                    <button
                      type="button"
                      onClick={() => handleCopyInstructions(activeAccess.access_instructions)}
                      className="inline-flex items-center space-x-1 text-[11px] text-[#07545A] hover:text-[#087C80] font-medium cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied!' : 'Copy Instructions'}</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#102A35] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans">
                  {activeAccess.access_instructions || 'No specific access instructions provided.'}
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAccess(null)}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
