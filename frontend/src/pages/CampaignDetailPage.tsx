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
  Building2,
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
          <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Draft</span>
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
            <span className="h-2 w-2 rounded-full bg-[#0E7C57] animate-pulse"></span>
            <span>Published</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
            <XCircle className="h-3.5 w-3.5" />
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

  if (isLoading) {
    return (
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6 bg-[#F6F5ED]">
        <div className="h-6 w-32 bg-[#EFEFE5] rounded animate-pulse"></div>
        <div className="h-48 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse"></div>
        <div className="h-40 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse"></div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4 bg-[#F6F5ED]">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#102A35]">Campaign Not Found</h2>
        <p className="text-xs sm:text-sm text-[#52656B]">
          {error?.message || 'The requested campaign could not be loaded or you do not have permission to view it.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] hover:bg-[#F6F5ED] text-[#102A35] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
          <Link
            to="/founder/startups"
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors"
          >
            <span>Back to Startups</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link
                to={`/founder/startups/${campaign.startup_id}/campaigns`}
                className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{startup?.name || 'Startup'} Campaigns</span>
              </Link>
              <span>/</span>
              <span className="text-[#102A35] font-semibold truncate max-w-[200px]">{campaign.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                {campaign.title}
              </h1>
              {getStatusBadge(campaign.status)}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-[#07545A] bg-[#D7EFEB] px-2.5 py-0.5 rounded-full border border-[#BCE1DA] font-semibold">
                slug: {campaign.slug}
              </span>
              {campaign.product_type && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                  {campaign.product_type}
                </span>
              )}
              {startup && (
                <Link
                  to={`/founder/startups/${startup.id}`}
                  className="inline-flex items-center space-x-1 text-xs text-[#52656B] hover:text-[#102A35]"
                >
                  <Building2 className="h-3 w-3 text-[#087C80]" />
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
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Review Applications</span>
              {appsData && appsData.total > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D7EFEB] text-[#07545A]">
                  {appsData.total}
                </span>
              )}
            </Link>
            <Link
              to={`/founder/feedback?campaignId=${campaign.id}`}
              id="view-campaign-feedback-btn"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#087C80]" />
              <span>View Feedback</span>
            </Link>
            {campaign.status !== 'closed' && (
              <Link
                to={`/founder/campaigns/${campaign.id}/edit`}
                id="edit-campaign-btn"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Edit</span>
              </Link>
            )}

            {campaign.status === 'draft' && (
              <button
                id="publish-campaign-trigger"
                onClick={handleOpenPublish}
                disabled={isPublishing}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#0E7C57] text-white hover:bg-[#07545A] shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
              </button>
            )}

            {campaign.status === 'published' && startup && (
              <>
                <Link
                  to={`/campaigns/${startup.slug}/${campaign.slug}`}
                  id="view-public-campaign-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#E6F7F0] text-[#0E7C57] hover:bg-[#d0f3e3] border border-[#B6EDD5] transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Public View</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>

                <button
                  id="close-campaign-trigger"
                  onClick={handleOpenClose}
                  disabled={isClosing}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 disabled:opacity-50 transition-all cursor-pointer"
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
                className="p-2 rounded-full text-[#52656B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Draft"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Operation Notice</p>
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

        {/* Campaign Summary & Overview Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-xs uppercase font-bold tracking-wider text-[#087C80]">
              Campaign Objective
            </h2>
            {campaign.summary && (
              <p className="text-base sm:text-lg font-semibold text-[#102A35]">
                {campaign.summary}
              </p>
            )}
            {campaign.description ? (
              <p className="text-sm text-[#52656B] leading-relaxed whitespace-pre-line pt-3 border-t border-[#DCE7E3]">
                {campaign.description}
              </p>
            ) : (
              <p className="text-xs text-[#52656B] italic">No detailed description provided.</p>
            )}
          </div>

          {/* Product URL */}
          {campaign.product_url && (
            <div className="text-xs pt-2 flex items-center space-x-2">
              <span className="text-[#52656B]">Product Link:</span>
              <a
                href={campaign.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#087C80] hover:text-[#07545A] font-semibold inline-flex items-center space-x-1"
              >
                <span>{campaign.product_url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Structured Testing Tasks */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCE7E3] pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-[#087C80]" />
              <h2 className="text-base font-bold text-[#102A35]">
                Testing Tasks ({campaign.testing_tasks?.length || 0})
              </h2>
            </div>
            <span className="text-xs text-[#52656B]">Instructions for beta testers</span>
          </div>

          {campaign.testing_tasks && campaign.testing_tasks.length > 0 ? (
            <div className="space-y-2.5">
              {campaign.testing_tasks.map((task, idx) => (
                <div
                  key={task.id || idx}
                  className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-[#D7EFEB] text-[#07545A] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-[#102A35]">
                        {task.title}
                      </span>
                      {task.is_required && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Required
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-[#52656B] pl-7">{task.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#52656B] italic">No structured testing tasks defined.</p>
          )}
        </div>

        {/* Target Tester Criteria */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCE7E3] pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-[#0E7C57]" />
              <h2 className="text-base font-bold text-[#102A35]">Target Audience Criteria</h2>
            </div>
            {campaign.max_testers && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                Capacity: {campaign.max_testers} testers max
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52656B]">
            <div>
              <span className="text-[#102A35] block font-semibold mb-1">Experience Level:</span>
              <span>{campaign.target_audience?.experience_level || 'Any'}</span>
            </div>

            <div>
              <span className="text-[#102A35] block font-semibold mb-1">Target Devices:</span>
              <span>{campaign.target_audience?.devices?.join(', ') || 'Any platform'}</span>
            </div>

            {campaign.target_audience?.skills && campaign.target_audience.skills.length > 0 && (
              <div>
                <span className="text-[#102A35] block font-semibold mb-1">Desired Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.target_audience.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {campaign.target_audience?.interests && campaign.target_audience.interests.length > 0 && (
              <div>
                <span className="text-[#102A35] block font-semibold mb-1">Product Interests:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaign.target_audience.interests.map((i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] font-medium"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {campaign.target_audience?.countries && campaign.target_audience.countries.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-[#102A35] block font-semibold mb-1">Geographic Criteria:</span>
                <span>{campaign.target_audience.countries.join(', ')}</span>
              </div>
            )}

            {campaign.target_audience?.notes && (
              <div className="sm:col-span-2">
                <span className="text-[#102A35] block font-semibold mb-1">Screening Notes:</span>
                <p className="text-[#52656B] leading-relaxed">{campaign.target_audience.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Rewards & Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Reward Card */}
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-[#102A35] font-bold text-sm">
              {campaign.reward_type === 'monetary' ? (
                <Coins className="h-4 w-4 text-[#0E7C57]" />
              ) : campaign.reward_type === 'perk' ? (
                <Gift className="h-4 w-4 text-[#087C80]" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[#52656B]" />
              )}
              <span>Reward Terms</span>
            </div>

            <div className="text-xs space-y-2 text-[#52656B]">
              <div>
                <span className="text-[#52656B] block">Type:</span>
                <span className="font-semibold capitalize text-[#102A35]">{campaign.reward_type}</span>
              </div>

              {campaign.reward_type === 'monetary' && (
                <div>
                  <span className="text-[#52656B] block">Amount:</span>
                  <span className="text-[#0E7C57] font-bold text-sm">
                    {campaign.reward_currency || 'USD'} {campaign.reward_amount}
                  </span>
                </div>
              )}

              {campaign.reward_type === 'perk' && campaign.reward_description && (
                <div>
                  <span className="text-[#52656B] block">Perk Details:</span>
                  <span className="text-[#087C80] font-semibold">{campaign.reward_description}</span>
                </div>
              )}

              {campaign.reward_eligibility && (
                <div className="pt-2 border-t border-[#DCE7E3]">
                  <span className="text-[#52656B] block">Fulfillment Criteria:</span>
                  <p className="text-[#102A35] mt-0.5">{campaign.reward_eligibility}</p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Card */}
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-[#102A35] font-bold text-sm">
              <Calendar className="h-4 w-4 text-[#087C80]" />
              <span>Timeline</span>
            </div>

            <div className="text-xs space-y-2 text-[#52656B]">
              <div>
                <span className="text-[#52656B] block">Application Deadline:</span>
                <span className="font-semibold text-[#102A35]">
                  {campaign.application_deadline
                    ? new Date(campaign.application_deadline).toLocaleString()
                    : 'Open (No deadline specified)'}
                </span>
              </div>

              <div>
                <span className="text-[#52656B] block">Testing Start Date:</span>
                <span className="font-semibold text-[#102A35]">
                  {campaign.testing_start_date
                    ? new Date(campaign.testing_start_date).toLocaleDateString()
                    : 'Not specified'}
                </span>
              </div>

              <div>
                <span className="text-[#52656B] block">Testing End Date:</span>
                <span className="font-semibold text-[#102A35]">
                  {campaign.testing_end_date
                    ? new Date(campaign.testing_end_date).toLocaleDateString()
                    : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Private Tester Access Instructions (Founder View Only) */}
        <div className="rounded-3xl bg-white border border-[#B6EDD5] p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#0E7C57] font-bold text-sm">
              <Lock className="h-4 w-4 text-[#0E7C57]" />
              <span>Private Tester Access Instructions</span>
            </div>
            <span className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
              Founder View Only
            </span>
          </div>

          <p className="text-xs text-[#52656B]">
            These instructions are strictly withheld from public visitors. Only testers whose applications you accept will receive access.
          </p>

          {campaign.access_instructions ? (
            <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs font-mono text-[#102A35] whitespace-pre-wrap leading-relaxed">
              {campaign.access_instructions}
            </div>
          ) : (
            <p className="text-xs text-[#52656B] italic">No access instructions provided yet.</p>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#52656B] px-2">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-[#087C80]" />
            <span>Created: {new Date(campaign.created_at).toLocaleString()}</span>
            {campaign.published_at && (
              <span> &bull; Published: {new Date(campaign.published_at).toLocaleString()}</span>
            )}
          </span>
          <span>Campaign ID: <span className="font-mono text-[#102A35]">{campaign.id}</span></span>
        </div>

        {/* Confirmation Modal */}
        {modalConfig.isOpen && (
          <div
            id="campaign-action-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              id="campaign-action-modal"
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
                  id="cancel-modal-btn"
                  onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#102A35] hover:bg-[#F6F5ED] bg-white border border-[#DCE7E3] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-modal-action-btn"
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
