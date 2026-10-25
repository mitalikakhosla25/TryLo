import React from 'react';
import { Link } from 'react-router-dom';
import { useMyStartups } from '../context/useStartups';
import {
  Building,
  Plus,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const StartupListPage: React.FC = () => {
  const { data: startups, isLoading, isError, error, refetch } = useMyStartups();

  const getStageBadgeColor = (stage: string | null) => {
    switch (stage) {
      case 'Idea':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Prototype':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'MVP':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Early Traction':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Growth':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#a88bff] border border-[#6338E8]/40">
              Founder Ventures
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">Multi-Startup Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Startups
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your companies, configure public startup profiles, and prepare beta testing campaigns.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/founder/startups/new"
            id="create-startup-btn"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] shadow-lg shadow-[#6338E8]/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Startup</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-6 w-1/3 bg-slate-800 rounded"></div>
              <div className="h-4 w-2/3 bg-slate-800/60 rounded"></div>
              <div className="flex space-x-3 pt-2">
                <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
                <div className="h-6 w-24 bg-slate-800 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-800/50 flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-rose-200">Failed to load startups</h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {error?.message || 'A network error occurred while retrieving your startups.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && startups && startups.length === 0 && (
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-10 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#6338E8]/10 border border-[#6338E8]/30 flex items-center justify-center text-[#a88bff]">
            <Building className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">No startups yet</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              You haven&apos;t added any startups yet. Create your first startup profile to prepare
              for launching beta campaigns and recruiting targeted testers.
            </p>
          </div>
          <div>
            <Link
              to="/founder/startups/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] shadow-lg shadow-[#6338E8]/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Startup</span>
            </Link>
          </div>
        </div>
      )}

      {/* Startups List */}
      {!isLoading && !isError && startups && startups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing {startups.length} {startups.length === 1 ? 'startup' : 'startups'}</span>
            <span className="flex items-center space-x-1 text-[#a88bff]">
              <Sparkles className="h-3 w-3" />
              <span>Ready for Campaign Creation</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {startups.map((startup) => (
              <div
                key={startup.id}
                className="group rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 p-6 transition-all duration-200 shadow-md hover:shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        <Link to={`/founder/startups/${startup.id}`}>
                          {startup.name}
                        </Link>
                      </h2>
                      <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                        slug: {startup.slug}
                      </span>
                    </div>

                    {startup.tagline && (
                      <p className="text-xs sm:text-sm text-slate-300 font-medium">
                        {startup.tagline}
                      </p>
                    )}

                    {startup.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {startup.description}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
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
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        {startup.industry}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata & Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-4">
                    {(startup.city || startup.country) && (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <MapPin className="h-3 w-3" />
                        <span>{[startup.city, startup.country].filter(Boolean).join(', ')}</span>
                      </span>
                    )}

                    {startup.founded_year && (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>Est. {startup.founded_year}</span>
                      </span>
                    )}

                    {startup.website_url && (
                      <a
                        href={startup.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-[#a88bff] hover:text-[#c4b5fd] transition-colors"
                      >
                        <span>Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/founder/startups/${startup.id}/edit`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                    >
                      Edit
                    </Link>

                    <Link
                      to={`/founder/startups/${startup.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#a88bff] hover:text-[#c4b5fd] transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Campaign Readiness Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/50 rounded-xl px-3.5 py-2 border border-slate-800/50">
                    <span className="flex items-center space-x-1.5 text-slate-400">
                      <Layers className="h-3 w-3 text-[#a88bff]" />
                      <span>Beta Campaigns</span>
                    </span>
                    <span className="text-[#17865B] font-semibold">
                      0 Active &bull; Ready to connect
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
