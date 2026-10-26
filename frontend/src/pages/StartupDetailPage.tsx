import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStartup } from '../context/useStartups';
import { useStartupCampaigns } from '../context/useCampaigns';
import {
  ArrowLeft,
  Edit3,
  Globe,
  MapPin,
  Calendar,
  Layers,
  ExternalLink,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Coins,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { StartupAvatar } from '../components/ui/StartupAvatar';

export const StartupDetailPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { data: startup, isLoading, isError, error, refetch } = useStartup(startupId);
  const { data: campaigns } = useStartupCampaigns(startupId);

  const getStageBadgeColor = (stage: string | null) => {
    switch (stage) {
      case 'Idea':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Prototype':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'MVP':
        return 'bg-[#D7EFEB] text-[#07545A] border-[#BCE1DA] font-semibold';
      case 'Early Traction':
        return 'bg-[#E6F7F0] text-[#0E7C57] border-[#B6EDD5] font-semibold';
      case 'Growth':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold';
      default:
        return 'bg-[#EFEFE5] text-[#52656B] border-[#DCE7E3]';
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

  if (isError || !startup) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4 bg-[#F6F5ED]">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#102A35]">Startup Not Found</h2>
        <p className="text-xs sm:text-sm text-[#52656B]">
          {error?.message || 'The requested startup could not be loaded or you do not have permission to view it.'}
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
            <span>Back to My Startups</span>
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
                to="/founder/startups"
                className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>My Startups</span>
              </Link>
              <span>/</span>
              <span className="text-[#102A35] font-semibold truncate max-w-[200px]">{startup.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight flex items-center space-x-3">
              <span>{startup.name}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-[#07545A] bg-[#D7EFEB] px-2.5 py-0.5 rounded-full border border-[#BCE1DA] font-semibold">
                public slug: {startup.slug}
              </span>
              {startup.company_stage && (
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getStageBadgeColor(
                    startup.company_stage
                  )}`}
                >
                  {startup.company_stage}
                </span>
              )}
              {startup.industry && (
                <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                  {startup.industry}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to={`/founder/startups/${startup.id}/edit`}
              id="edit-startup-btn"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#087C80]" />
              <span>Edit Startup</span>
            </Link>
          </div>
        </div>

        {/* Main Overview Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xs uppercase font-bold tracking-wider text-[#087C80]">
                Venture Overview
              </h2>
              {startup.tagline ? (
                <p className="text-base sm:text-lg font-semibold text-[#102A35]">
                  {startup.tagline}
                </p>
              ) : (
                <p className="text-sm text-[#52656B] italic">No tagline provided.</p>
              )}
            </div>

            <StartupAvatar
              name={startup.name}
              logoUrl={startup.logo_url}
              size="lg"
              shape="rounded"
            />
          </div>

          {startup.description && (
            <div className="space-y-1.5 pt-3 border-t border-[#DCE7E3]">
              <h3 className="text-xs font-bold text-[#52656B] uppercase tracking-wider">
                About the Product
              </h3>
              <p className="text-sm text-[#52656B] leading-relaxed whitespace-pre-line">
                {startup.description}
              </p>
            </div>
          )}

          {/* Startup Metadata Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#DCE7E3] text-xs">
            <div className="space-y-1">
              <span className="text-[#52656B] flex items-center space-x-1">
                <Globe className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Website</span>
              </span>
              {startup.website_url ? (
                <a
                  href={startup.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#087C80] hover:text-[#07545A] font-semibold flex items-center space-x-1 truncate"
                >
                  <span className="truncate">{startup.website_url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="text-[#52656B]/70">Not provided</span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[#52656B] flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Location</span>
              </span>
              <span className="text-[#102A35] font-medium">
                {[startup.city, startup.country].filter(Boolean).join(', ') || 'Global / Remote'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[#52656B] flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Founded Year</span>
              </span>
              <span className="text-[#102A35] font-medium">
                {startup.founded_year ? `Est. ${startup.founded_year}` : 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Beta Testing Campaigns Section */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5 text-[#087C80]">
              <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-[#102A35]">Beta Campaigns</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                    {campaigns?.length || 0}
                  </span>
                </div>
                <p className="text-xs text-[#52656B]">
                  Launch and manage structured beta testing campaigns under this startup.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <Link
                to={`/founder/startups/${startup.id}/campaigns/new`}
                id="detail-create-campaign-btn"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Campaign</span>
              </Link>

              {campaigns && campaigns.length > 0 && (
                <Link
                  to={`/founder/startups/${startup.id}/campaigns`}
                  className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-full text-xs font-semibold text-[#102A35] hover:bg-[#EFEFE5] bg-white border border-[#DCE7E3] transition-colors"
                >
                  <span>View Dashboard</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Campaign List / Empty State */}
          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.slice(0, 3).map((camp) => (
                <div
                  key={camp.id}
                  className="p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-center justify-between gap-3 hover:border-[#087C80]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/founder/campaigns/${camp.id}`}
                        className="text-xs sm:text-sm font-bold text-[#102A35] hover:text-[#087C80] transition-colors"
                      >
                        {camp.title}
                      </Link>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          camp.status === 'published'
                            ? 'bg-[#E6F7F0] text-[#0E7C57] border-[#B6EDD5]'
                            : camp.status === 'closed'
                            ? 'bg-[#EFEFE5] text-[#52656B] border-[#DCE7E3]'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#52656B]">
                      slug: <span className="font-mono text-[#102A35]">{camp.slug}</span>
                      {camp.application_deadline && (
                        <span> &bull; Deadline: {new Date(camp.application_deadline).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {camp.reward_type === 'monetary' && (
                      <span className="text-xs text-[#0E7C57] font-semibold flex items-center space-x-1">
                        <Coins className="h-3.5 w-3.5" />
                        <span>{camp.reward_currency || 'USD'} {camp.reward_amount}</span>
                      </span>
                    )}
                    {camp.reward_type === 'perk' && (
                      <span className="text-xs text-[#087C80] font-semibold flex items-center space-x-1">
                        <Gift className="h-3.5 w-3.5" />
                        <span>Perk</span>
                      </span>
                    )}
                    <Link
                      to={`/founder/campaigns/${camp.id}`}
                      className="p-2 rounded-full text-[#52656B] hover:text-[#102A35] hover:bg-white transition-colors"
                      title="Manage"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#F6F5ED] border border-dashed border-[#DCE7E3] text-center space-y-2">
              <p className="text-xs text-[#102A35] font-semibold">No campaigns created yet for this startup.</p>
              <p className="text-[11px] text-[#52656B] max-w-sm mx-auto">
                Create your first draft, define tasks, and invite testers to provide valuable product feedback.
              </p>
            </div>
          )}
        </div>

        {/* Timestamps footer */}
        <div className="flex items-center justify-between text-[11px] text-[#52656B] px-2">
          <span className="flex items-center space-x-1">
            <Clock className="h-3.5 w-3.5 text-[#087C80]" />
            <span>Created: {new Date(startup.created_at).toLocaleDateString()}</span>
          </span>
          <span>Startup ID: <span className="font-mono text-[#102A35]">{startup.id}</span></span>
        </div>
      </div>
    </div>
  );
};
