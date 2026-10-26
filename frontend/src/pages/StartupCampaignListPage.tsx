import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStartup } from '../context/useStartups';
import {
  useStartupCampaigns,
  usePublishCampaign,
  useCloseCampaign,
  useDeleteCampaign,
} from '../context/useCampaigns';
import {
  Layers,
  ArrowLeft,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Calendar,
  Gift,
  Coins,
  CheckCircle2,
  Trash2,
  Clock,
  XCircle,
  Eye,
  Sliders,
  Send,
  Users,
} from 'lucide-react';
import type { Campaign, CampaignStatus } from '../api/campaigns';

export const StartupCampaignListPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { data: startup, isLoading: isLoadingStartup } = useStartup(startupId);
  const {
    data: campaigns,
    isLoading: isLoadingCampaigns,
    isError,
    error,
    refetch,
  } = useStartupCampaigns(startupId);

  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'publish' | 'close' | 'delete' | null;
    campaign: Campaign | null;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
    checklist?: string[];
  }>({
    isOpen: false,
    type: null,
    campaign: null,
    title: '',
    description: '',
    confirmLabel: '',
  });

  const publishMutation = usePublishCampaign();
  const closeMutation = useCloseCampaign();
  const deleteMutation = useDeleteCampaign(startupId);

  const handleOpenPublish = (campaign: Campaign) => {
    setModalConfig({
      isOpen: true,
      type: 'publish',
      campaign,
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

  const handleOpenClose = (campaign: Campaign) => {
    setModalConfig({
      isOpen: true,
      type: 'close',
      campaign,
      title: 'Close Campaign',
      description: `Are you sure you want to close "${campaign.title}"? Closing this campaign permanently removes it from active tester applications.`,
      confirmLabel: 'Confirm & Close Campaign',
      isDestructive: true,
    });
  };

  const handleOpenDelete = (campaign: Campaign) => {
    setModalConfig({
      isOpen: true,
      type: 'delete',
      campaign,
      title: 'Delete Campaign Draft',
      description: `Are you sure you want to permanently delete the draft "${campaign.title}"? This cannot be undone.`,
      confirmLabel: 'Delete Draft',
      isDestructive: true,
    });
  };

  const handleExecuteModal = async () => {
    const { type, campaign } = modalConfig;
    if (!campaign || !type) return;
    setActionError(null);
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

    if (type === 'publish') {
      setPublishingId(campaign.id);
      try {
        await publishMutation.mutateAsync(campaign.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to publish campaign.';
        setActionError(msg);
      } finally {
        setPublishingId(null);
      }
    } else if (type === 'close') {
      setClosingId(campaign.id);
      try {
        await closeMutation.mutateAsync(campaign.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to close campaign.';
        setActionError(msg);
      } finally {
        setClosingId(null);
      }
    } else if (type === 'delete') {
      setDeletingId(campaign.id);
      try {
        await deleteMutation.mutateAsync(campaign.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete campaign draft.';
        setActionError(msg);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getStatusBadge = (status: CampaignStatus | string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span>Draft</span>
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0E7C57] animate-pulse"></span>
            <span>Published</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
            <XCircle className="h-3 w-3" />
            <span>Closed</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
            {status}
          </span>
        );
    }
  };

  const filteredCampaigns = (campaigns || []).filter((c) => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  const draftCount = (campaigns || []).filter((c) => c.status === 'draft').length;
  const publishedCount = (campaigns || []).filter((c) => c.status === 'published').length;
  const closedCount = (campaigns || []).filter((c) => c.status === 'closed').length;

  const isLoading = isLoadingStartup || isLoadingCampaigns;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link
                to="/founder/startups"
                className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>My Startups</span>
              </Link>
              <span>/</span>
              {startup ? (
                <Link
                  to={`/founder/startups/${startup.id}`}
                  className="text-[#52656B] hover:text-[#102A35] transition-colors truncate max-w-[150px]"
                >
                  {startup.name}
                </Link>
              ) : (
                <span>Startup</span>
              )}
              <span>/</span>
              <span className="text-[#102A35] font-semibold">Campaigns</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight flex items-center space-x-3">
              <span>{startup ? `${startup.name} Campaigns` : 'Startup Campaigns'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B]">
              Create, configure, publish, and track beta testing campaigns for your venture.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {startupId && (
              <Link
                to={`/founder/startups/${startupId}/campaigns/new`}
                id="create-campaign-btn"
                className="inline-flex items-center space-x-2 px-4.5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campaign</span>
              </Link>
            )}
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Operation Error</p>
                <p className="mt-0.5">{actionError}</p>
              </div>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex items-center p-1 bg-[#EFEFE5] rounded-full border border-[#DCE7E3]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-[#087C80] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35]'
            }`}
          >
            All ({campaigns?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'draft'
                ? 'bg-[#087C80] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35]'
            }`}
          >
            Drafts ({draftCount})
          </button>

          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'published'
                ? 'bg-[#087C80] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35]'
            }`}
          >
            Published ({publishedCount})
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'closed'
                ? 'bg-[#087C80] text-white shadow-xs'
                : 'text-[#52656B] hover:text-[#102A35]'
            }`}
          >
            Closed ({closedCount})
          </button>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse p-6 shadow-xs"
              />
            ))}
          </div>
        )}

        {/* Network / Retrieval Error */}
        {isError && (
          <div className="rounded-3xl bg-white border border-rose-200 p-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A35]">Failed to load campaigns</h3>
            <p className="text-xs text-[#52656B] max-w-sm mx-auto">
              {error?.message || 'Could not retrieve campaigns for this startup.'}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] hover:bg-[#F6F5ED] text-[#102A35] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State: No campaigns at all */}
        {!isLoading && !isError && campaigns && campaigns.length === 0 && (
          <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
              <Layers className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#102A35]">No campaigns created yet</h3>
              <p className="text-xs sm:text-sm text-[#52656B] max-w-md mx-auto">
                Prepare a testing campaign for {startup?.name || 'your startup'}, define structured tasks,
                and invite qualified testers to try your product.
              </p>
            </div>
            {startupId && (
              <div>
                <Link
                  to={`/founder/startups/${startupId}/campaigns/new`}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Launch Your First Campaign</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty State: Filter produced 0 */}
        {!isLoading && !isError && campaigns && campaigns.length > 0 && filteredCampaigns.length === 0 && (
          <div className="rounded-2xl bg-white border border-[#DCE7E3] p-8 text-center text-[#52656B] text-xs">
            No {activeTab} campaigns found.
          </div>
        )}

        {/* Campaign Cards List */}
        {!isLoading && !isError && filteredCampaigns.length > 0 && (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 p-6 space-y-4 transition-all shadow-xs hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/founder/campaigns/${campaign.id}`}
                        className="text-base sm:text-lg font-bold text-[#102A35] hover:text-[#087C80] transition-colors"
                      >
                        {campaign.title}
                      </Link>
                      {getStatusBadge(campaign.status)}
                      {campaign.product_type && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                          {campaign.product_type}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-[#52656B]">
                      slug: {campaign.slug}
                    </p>

                    {campaign.summary && (
                      <p className="text-xs sm:text-sm text-[#52656B] line-clamp-2 pt-0.5">
                        {campaign.summary}
                      </p>
                    )}
                  </div>

                  {/* Right side reward pill */}
                  <div className="shrink-0 flex items-center space-x-2">
                    {campaign.reward_type === 'monetary' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                        <Coins className="h-3.5 w-3.5 text-[#0E7C57]" />
                        <span>{campaign.reward_currency || 'USD'} {campaign.reward_amount}</span>
                      </span>
                    )}
                    {campaign.reward_type === 'perk' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                        <Gift className="h-3.5 w-3.5 text-[#087C80]" />
                        <span>Perk Reward</span>
                      </span>
                    )}
                    {campaign.reward_type === 'unpaid' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
                        <span>Unpaid Testing</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-[#DCE7E3] text-xs text-[#52656B]">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>Tasks: {campaign.testing_tasks?.length || 0} testing items</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>
                      {campaign.application_deadline
                        ? `Deadline: ${new Date(campaign.application_deadline).toLocaleDateString()}`
                        : 'No deadline set'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>
                      {campaign.published_at
                        ? `Published: ${new Date(campaign.published_at).toLocaleDateString()}`
                        : `Created: ${new Date(campaign.created_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#DCE7E3]">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/founder/campaigns/${campaign.id}`}
                      className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] hover:bg-[#F6F5ED] text-[#102A35] transition-colors"
                    >
                      <Sliders className="h-3.5 w-3.5 text-[#087C80]" />
                      <span>Manage</span>
                    </Link>

                    <Link
                      to={`/founder/campaigns/${campaign.id}/applications`}
                      className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#D7EFEB] hover:bg-[#bde5df] text-[#07545A] border border-[#BCE1DA] transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Applications</span>
                    </Link>

                    {/* Edit allowed for Draft and Published */}
                    {campaign.status !== 'closed' && (
                      <Link
                        to={`/founder/campaigns/${campaign.id}/edit`}
                        className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-[#F6F5ED] border border-[#DCE7E3] text-[#102A35] transition-colors"
                      >
                        <span>Edit</span>
                      </Link>
                    )}

                    {/* Public Link for Published */}
                    {campaign.status === 'published' && startup && (
                      <Link
                        to={`/campaigns/${startup.slug}/${campaign.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#E6F7F0] text-[#0E7C57] hover:bg-[#d0f3e3] border border-[#B6EDD5] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Public Page</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Publish action for Draft */}
                    {campaign.status === 'draft' && (
                      <button
                        id={`publish-btn-${campaign.id}`}
                        onClick={() => handleOpenPublish(campaign)}
                        disabled={publishingId === campaign.id}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                        <span>{publishingId === campaign.id ? 'Publishing...' : 'Publish'}</span>
                      </button>
                    )}

                    {/* Close action for Published */}
                    {campaign.status === 'published' && (
                      <button
                        id={`close-btn-${campaign.id}`}
                        onClick={() => handleOpenClose(campaign)}
                        disabled={closingId === campaign.id}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>{closingId === campaign.id ? 'Closing...' : 'Close Campaign'}</span>
                      </button>
                    )}

                    {/* Delete action for Draft */}
                    {campaign.status === 'draft' && (
                      <button
                        id={`delete-btn-${campaign.id}`}
                        onClick={() => handleOpenDelete(campaign)}
                        disabled={deletingId === campaign.id}
                        className="p-1.5 rounded-full text-[#52656B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Draft"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {modalConfig.isOpen && (
          <div
            id="list-campaign-action-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              id="list-campaign-action-modal"
              className="relative w-full max-w-md rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#102A35] tracking-tight">{modalConfig.title}</h3>
                <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                  {modalConfig.description}
                </p>
              </div>

              {modalConfig.checklist && (
                <div className="space-y-2 p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#52656B]">
                  <span className="font-bold text-[#102A35] block text-[11px] uppercase tracking-wider">
                    Verification Checklist
                  </span>
                  {modalConfig.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#0E7C57] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  id="cancel-list-modal-btn"
                  onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#102A35] hover:bg-[#F6F5ED] bg-white border border-[#DCE7E3] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-list-modal-action-btn"
                  onClick={handleExecuteModal}
                  className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold text-white shadow-xs transition-all cursor-pointer ${
                    modalConfig.isDestructive
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#07545A] hover:bg-[#087C80]'
                  }`}
                >
                  {modalConfig.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
