import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useCampaign,
  usePublishCampaign,
  useCloseCampaign,
  useDeleteCampaign,
} from '../context/useCampaigns';
import { useCampaignApplications } from '../context/useApplications';
import { useStartup } from '../context/useStartups';
import {
  ArrowLeft,
  Edit3,
  ExternalLink,
  Lock,
  Calendar,
  Gift,
  Coins,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Send,
  XCircle,
  Trash2,
  Eye,
  ShieldCheck,
  Building,
  Users,
  MessageSquare,
} from 'lucide-react';
import type { CampaignStatus } from '../api/campaigns';

export const CampaignDetailPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const { data: campaign, isLoading, isError, error, refetch } = useCampaign(campaignId);
  const { data: startup } = useStartup(campaign?.startup_id);
  const { data: appsData } = useCampaignApplications(campaignId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'publish' | 'close' | 'delete' | null;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
    checklist?: string[];
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
    confirmLabel: '',
  });

  const publishMutation = usePublishCampaign(campaignId);
  const closeMutation = useCloseCampaign(campaignId);
  const deleteMutation = useDeleteCampaign(campaign?.startup_id);

  const handleOpenPublish = () => {
    if (!campaign) return;
    setModalConfig({
      isOpen: true,
      type: 'publish',
      title: 'Publish Beta Campaign',
      description: `You are about to publish "${campaign.title}". This will make the campaign publicly discoverable by beta testers on TryLo.`,
      confirmLabel: 'Confirm & Publish Campaign',
      checklist: [
        'Campaign details and testing tasks are complete',
        'Reward terms are accurate and clear',
        'Private access instructions will remain protected',
      ],
    });
  };

  const handleOpenClose = () => {
    if (!campaign) return;
    setModalConfig({
      isOpen: true,
      type: 'close',
      title: 'Close Campaign',
      description: `Are you sure you want to close "${campaign.title}"? Closing this campaign permanently removes it from active tester discovery.`,
      confirmLabel: 'Confirm & Close Campaign',
      isDestructive: true,
    });
  };

  const handleOpenDelete = () => {
    if (!campaign) return;
    setModalConfig({
      isOpen: true,
      type: 'delete',
      title: 'Delete Campaign Draft',
      description: `Are you sure you want to permanently delete the draft "${campaign.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Draft',
      isDestructive: true,
    });
  };

  const handleExecuteModal = async () => {
    if (!campaign || !modalConfig.type) return;
    setActionError(null);
    const type = modalConfig.type;
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

    if (type === 'publish') {
      setIsPublishing(true);
      try {
        await publishMutation.mutateAsync();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to publish campaign.';
        setActionError(msg);
      } finally {
        setIsPublishing(false);
      }
    } else if (type === 'close') {
      setIsClosing(true);
      try {
        await closeMutation.mutateAsync();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to close campaign.';
        setActionError(msg);
      } finally {
        setIsClosing(false);
      }
    } else if (type === 'delete') {
      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync(campaign.id);
        navigate(`/founder/startups/${campaign.startup_id}/campaigns`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete campaign draft.';
        setActionError(msg);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusBadge = (status: CampaignStatus | string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span>Draft</span>
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Published</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="h-3.5 w-3.5" />
            <span>Closed</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="h-6 w-32 bg-slate-800/80 rounded animate-pulse"></div>
        <div className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
        <div className="h-40 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Campaign Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {error?.message || 'The requested campaign could not be loaded or you do not have permission to view it.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
          <Link
            to="/founder/startups"
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-colors"
          >
            <span>Back to Startups</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link
              to={`/founder/startups/${campaign.startup_id}/campaigns`}
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{startup?.name || 'Startup'} Campaigns</span>
            </Link>
            <span>/</span>
            <span className="text-slate-300 font-medium truncate max-w-[200px]">{campaign.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {campaign.title}
            </h1>
            {getStatusBadge(campaign.status)}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono text-[#a88bff] bg-[#6338E8]/10 px-2.5 py-0.5 rounded-md border border-[#6338E8]/30">
              slug: {campaign.slug}
            </span>
            {campaign.product_type && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {campaign.product_type}
              </span>
            )}
            {startup && (
              <Link
                to={`/founder/startups/${startup.id}`}
                className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
              >
                <Building className="h-3 w-3" />
                <span>{startup.name}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/founder/campaigns/${campaign.id}/applications`}
            id="review-applications-btn"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#6338E8] hover:bg-[#522ecc] text-white transition-all shadow-md shadow-[#6338E8]/20"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Review Applications</span>
            {appsData && appsData.total > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-[#6338E8]">
                {appsData.total}
              </span>
            )}
          </Link>
          <Link
            to={`/founder/feedback?campaignId=${campaign.id}`}
            id="view-campaign-feedback-btn"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
            <span>View Feedback</span>
          </Link>
          {campaign.status !== 'closed' && (
            <Link
              to={`/founder/campaigns/${campaign.id}/edit`}
              id="edit-campaign-btn"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#a88bff]" />
              <span>Edit Campaign</span>
            </Link>
          )}

          {campaign.status === 'draft' && (
            <button
              id="publish-campaign-trigger"
              onClick={handleOpenPublish}
              disabled={isPublishing}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#17865B] text-white hover:bg-[#126b48] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish Campaign'}</span>
            </button>
          )}

          {campaign.status === 'published' && startup && (
            <>
              <Link
                to={`/campaigns/${startup.slug}/${campaign.slug}`}
                id="view-public-campaign-link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View Public Page</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <button
                id="close-campaign-trigger"
                onClick={handleOpenClose}
                disabled={isClosing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-rose-300 hover:bg-rose-950/40 hover:border-rose-800 border border-slate-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>{isClosing ? 'Closing...' : 'Close Campaign'}</span>
              </button>
            </>
          )}

          {campaign.status === 'draft' && (
            <button
              id="delete-campaign-trigger"
              onClick={handleOpenDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Delete Draft"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Operation Notice</p>
              <p className="mt-0.5">{actionError}</p>
            </div>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Campaign Summary & Overview Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-2">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
            Campaign Objective
          </h2>
          {campaign.summary && (
            <p className="text-base sm:text-lg font-medium text-slate-200">
              {campaign.summary}
            </p>
          )}
          {campaign.description ? (
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line pt-2 border-t border-slate-800/80">
              {campaign.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No detailed description provided.</p>
          )}
        </div>

        {/* Product URL */}
        {campaign.product_url && (
          <div className="text-xs pt-2 flex items-center space-x-2">
            <span className="text-slate-400">Product Link:</span>
            <a
              href={campaign.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a88bff] hover:text-[#c4b5fd] font-medium inline-flex items-center space-x-1"
            >
              <span>{campaign.product_url}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Structured Testing Tasks */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-[#a88bff]" />
            <h2 className="text-base font-bold text-white">
              Testing Tasks ({campaign.testing_tasks?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Instructions for beta testers</span>
        </div>

        {campaign.testing_tasks && campaign.testing_tasks.length > 0 ? (
          <div className="space-y-2.5">
            {campaign.testing_tasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="h-5 w-5 rounded-full bg-[#6338E8]/20 text-[#a88bff] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {task.title}
                    </span>
                    {task.is_required && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Required
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-300 pl-7">{task.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No structured testing tasks defined.</p>
        )}
      </div>

      {/* Target Tester Criteria */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Target Audience Criteria</h2>
          </div>
          {campaign.max_testers && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              Capacity: {campaign.max_testers} testers max
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Experience Level:</span>
            <span>{campaign.target_audience?.experience_level || 'Any'}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">Target Devices:</span>
            <span>{campaign.target_audience?.devices?.join(', ') || 'Any platform'}</span>
          </div>

          {campaign.target_audience?.skills && campaign.target_audience.skills.length > 0 && (
            <div>
              <span className="text-slate-400 block font-semibold mb-1">Desired Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.target_audience.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#6338E8]/20 text-[#c4b5fd] border border-[#6338E8]/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {campaign.target_audience?.interests && campaign.target_audience.interests.length > 0 && (
            <div>
              <span className="text-slate-400 block font-semibold mb-1">Product Interests:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.target_audience.interests.map((i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {campaign.target_audience?.countries && campaign.target_audience.countries.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-semibold mb-1">Geographic Criteria:</span>
              <span>{campaign.target_audience.countries.join(', ')}</span>
            </div>
          )}

          {campaign.target_audience?.notes && (
            <div className="sm:col-span-2">
              <span className="text-slate-400 block font-semibold mb-1">Screening Notes:</span>
              <p className="text-slate-300 leading-relaxed">{campaign.target_audience.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rewards & Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Reward Card */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            {campaign.reward_type === 'monetary' ? (
              <Coins className="h-4 w-4 text-emerald-400" />
            ) : campaign.reward_type === 'perk' ? (
              <Gift className="h-4 w-4 text-purple-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
            )}
            <span>Reward Terms</span>
          </div>

          <div className="text-xs space-y-2 text-slate-300">
            <div>
              <span className="text-slate-400 block">Type:</span>
              <span className="font-semibold capitalize text-white">{campaign.reward_type}</span>
            </div>

            {campaign.reward_type === 'monetary' && (
              <div>
                <span className="text-slate-400 block">Amount:</span>
                <span className="text-emerald-300 font-bold text-sm">
                  {campaign.reward_currency || 'USD'} {campaign.reward_amount}
                </span>
              </div>
            )}

            {campaign.reward_type === 'perk' && campaign.reward_description && (
              <div>
                <span className="text-slate-400 block">Perk Details:</span>
                <span className="text-purple-300 font-medium">{campaign.reward_description}</span>
              </div>
            )}

            {campaign.reward_eligibility && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 block">Fulfillment Criteria:</span>
                <p className="text-slate-300 mt-0.5">{campaign.reward_eligibility}</p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Card */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>Timeline</span>
          </div>

          <div className="text-xs space-y-2 text-slate-300">
            <div>
              <span className="text-slate-400 block">Application Deadline:</span>
              <span className="font-medium text-white">
                {campaign.application_deadline
                  ? new Date(campaign.application_deadline).toLocaleString()
                  : 'Open (No deadline specified)'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Testing Start Date:</span>
              <span className="font-medium text-white">
                {campaign.testing_start_date
                  ? new Date(campaign.testing_start_date).toLocaleDateString()
                  : 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Testing End Date:</span>
              <span className="font-medium text-white">
                {campaign.testing_end_date
                  ? new Date(campaign.testing_end_date).toLocaleDateString()
                  : 'Not specified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Private Tester Access Instructions (Founder View Only) */}
      <div className="rounded-2xl bg-slate-950/80 border border-amber-500/30 p-6 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
            <Lock className="h-4 w-4 text-amber-400" />
            <span>Private Tester Access Instructions</span>
          </div>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Founder View Only
          </span>
        </div>

        <p className="text-xs text-slate-400">
          These instructions are strictly withheld from public visitors. Only testers whose applications you accept will receive access.
        </p>

        {campaign.access_instructions ? (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
            {campaign.access_instructions}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No access instructions provided yet.</p>
        )}
      </div>

      {/* Metadata Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400 px-2">
        <span className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Created: {new Date(campaign.created_at).toLocaleString()}</span>
          {campaign.published_at && (
            <span> &bull; Published: {new Date(campaign.published_at).toLocaleString()}</span>
          )}
        </span>
        <span>Campaign ID: <span className="font-mono">{campaign.id}</span></span>
      </div>

      {/* Confirmation Modal */}
      {modalConfig.isOpen && (
        <div
          id="campaign-action-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="campaign-action-modal"
            className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-5"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{modalConfig.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {modalConfig.description}
              </p>
            </div>

            {modalConfig.checklist && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                <span className="font-semibold text-slate-200 block text-[11px] uppercase tracking-wider">
                  Verification Checklist
                </span>
                {modalConfig.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                id="cancel-modal-btn"
                onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-modal-action-btn"
                onClick={handleExecuteModal}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-lg transition-all cursor-pointer ${
                  modalConfig.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-[#17865B] hover:bg-[#126b48]'
                }`}
              >
                {modalConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
