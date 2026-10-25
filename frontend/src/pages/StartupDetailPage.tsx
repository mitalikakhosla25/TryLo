import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStartup } from '../context/useStartups';
import { useStartupCampaigns } from '../context/useCampaigns';
import {
  Building,
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

export const StartupDetailPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { data: startup, isLoading, isError, error, refetch } = useStartup(startupId);
  const { data: campaigns } = useStartupCampaigns(startupId);

  const getStageBadgeColor = (stage: string | null) => {
    switch (stage) {
      case 'Idea':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Prototype':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'MVP':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Early Traction':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Growth':
        return 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
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

  if (isError || !startup) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Startup Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {error?.message || 'The requested startup could not be loaded or you do not have permission to view it.'}
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
            <span>Back to My Startups</span>
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
              to="/founder/startups"
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>My Startups</span>
            </Link>
            <span>/</span>
            <span className="text-slate-300 font-medium truncate max-w-[200px]">{startup.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>{startup.name}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono text-[#a88bff] bg-[#6338E8]/10 px-2.5 py-0.5 rounded-md border border-[#6338E8]/30">
              public slug: {startup.slug}
            </span>
            {startup.company_stage && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStageBadgeColor(
                  startup.company_stage
                )}`}
              >
                {startup.company_stage}
              </span>
            )}
            {startup.industry && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {startup.industry}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/founder/startups/${startup.id}/edit`}
            id="edit-startup-btn"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#a88bff]" />
            <span>Edit Startup</span>
          </Link>
        </div>
      </div>

      {/* Main Overview Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              Venture Overview
            </h2>
            {startup.tagline ? (
              <p className="text-base sm:text-lg font-medium text-slate-200">
                {startup.tagline}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No tagline provided.</p>
            )}
          </div>

          <div className="h-12 w-12 rounded-xl bg-[#6338E8]/10 border border-[#6338E8]/30 flex items-center justify-center text-[#a88bff] shrink-0">
            {startup.logo_url ? (
              <img
                src={startup.logo_url}
                alt={startup.name}
                className="h-10 w-10 object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Building className="h-6 w-6" />
            )}
          </div>
        </div>

        {startup.description && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              About the Product
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {startup.description}
            </p>
          </div>
        )}

        {/* Startup Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center space-x-1">
              <Globe className="h-3.5 w-3.5" />
              <span>Website</span>
            </span>
            {startup.website_url ? (
              <a
                href={startup.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#a88bff] hover:text-[#c4b5fd] font-medium flex items-center space-x-1 truncate"
              >
                <span className="truncate">{startup.website_url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-slate-500">Not provided</span>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Location</span>
            </span>
            <span className="text-slate-300 font-medium">
              {[startup.city, startup.country].filter(Boolean).join(', ') || 'Global / Remote'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Founded Year</span>
            </span>
            <span className="text-slate-300 font-medium">
              {startup.founded_year ? `Est. ${startup.founded_year}` : 'Not provided'}
            </span>
          </div>
        </div>
      </div>

      {/* Beta Testing Campaigns Section */}
      <div className="rounded-2xl bg-gradient-to-br from-[#6338E8]/10 via-slate-900/90 to-slate-900/60 border border-[#6338E8]/25 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-[#a88bff]">
            <div className="h-10 w-10 rounded-xl bg-[#6338E8]/15 border border-[#6338E8]/30 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Beta Campaigns</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#a88bff] border border-[#6338E8]/30">
                  {campaigns?.length || 0}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Launch and manage structured beta testing campaigns under this startup.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to={`/founder/startups/${startup.id}/campaigns/new`}
              id="detail-create-campaign-btn"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] shadow-md shadow-[#6338E8]/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Campaign</span>
            </Link>

            {campaigns && campaigns.length > 0 && (
              <Link
                to={`/founder/startups/${startup.id}/campaigns`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
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
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/founder/campaigns/${camp.id}`}
                      className="text-xs sm:text-sm font-bold text-white hover:text-[#a88bff] transition-colors"
                    >
                      {camp.title}
                    </Link>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        camp.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : camp.status === 'closed'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    slug: <span className="font-mono text-slate-300">{camp.slug}</span>
                    {camp.application_deadline && (
                      <span> &bull; Deadline: {new Date(camp.application_deadline).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {camp.reward_type === 'monetary' && (
                    <span className="text-xs text-emerald-300 font-semibold flex items-center space-x-1">
                      <Coins className="h-3 w-3" />
                      <span>{camp.reward_currency || 'USD'} {camp.reward_amount}</span>
                    </span>
                  )}
                  {camp.reward_type === 'perk' && (
                    <span className="text-xs text-purple-300 font-medium flex items-center space-x-1">
                      <Gift className="h-3 w-3" />
                      <span>Perk</span>
                    </span>
                  )}
                  <Link
                    to={`/founder/campaigns/${camp.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Manage"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-300 font-medium">No campaigns created yet for this startup.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Create your first draft, define tasks, and invite testers to provide valuable product feedback.
            </p>
          </div>
        )}
      </div>

      {/* Timestamps footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
        <span className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Created: {new Date(startup.created_at).toLocaleDateString()}</span>
        </span>
        <span>Startup ID: <span className="font-mono">{startup.id}</span></span>
      </div>
    </div>
  );
};
