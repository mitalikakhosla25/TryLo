import React from 'react';
import { Link } from 'react-router-dom';
import { useMyStartups } from '../context/useStartups';
import {
  Building2,
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
import { StartupAvatar } from '../components/ui/StartupAvatar';

export const StartupListPage: React.FC = () => {
  const { data: startups, isLoading, isError, error, refetch } = useMyStartups();

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

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                Founder Ventures
              </span>
              <span className="text-xs text-[#52656B]">&bull;</span>
              <span className="text-xs text-[#52656B]">Multi-Startup Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              My Startups
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B] mt-1">
              Manage your companies, configure public startup profiles, and prepare beta testing campaigns.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/founder/startups/new"
              id="create-startup-btn"
              className="inline-flex items-center space-x-2 px-4.5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
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
                className="p-6 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse space-y-4 shadow-xs"
              >
                <div className="h-6 w-1/3 bg-[#EFEFE5] rounded"></div>
                <div className="h-4 w-2/3 bg-[#EFEFE5]/70 rounded"></div>
                <div className="flex space-x-3 pt-2">
                  <div className="h-6 w-20 bg-[#EFEFE5] rounded-full"></div>
                  <div className="h-6 w-24 bg-[#EFEFE5] rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-rose-800">Failed to load startups</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  {error?.message || 'A network error occurred while retrieving your startups.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-700 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && startups && startups.length === 0 && (
          <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-10 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80]">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-[#102A35]">No startups yet</h2>
              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                You haven&apos;t added any startups yet. Create your first startup profile to prepare
                for launching beta campaigns and recruiting targeted testers.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/founder/startups/new"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
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
            <div className="flex items-center justify-between text-xs text-[#52656B] px-1">
              <span>Showing {startups.length} {startups.length === 1 ? 'startup' : 'startups'}</span>
              <span className="flex items-center space-x-1 text-[#087C80] font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ready for Campaign Creation</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {startups.map((startup) => (
                <div
                  key={startup.id}
                  className="group rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 p-6 transition-all duration-200 shadow-xs hover:shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <StartupAvatar
                        name={startup.name}
                        logoUrl={startup.logo_url}
                        category={startup.industry}
                        size="md"
                        shape="rounded"
                      />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-[#102A35] group-hover:text-[#087C80] transition-colors">
                            <Link to={`/founder/startups/${startup.id}`}>
                              {startup.name}
                            </Link>
                          </h2>
                          <span className="text-xs text-[#52656B] font-mono bg-[#F6F5ED] px-2.5 py-0.5 rounded-md border border-[#DCE7E3]">
                            slug: {startup.slug}
                          </span>
                        </div>

                      {startup.tagline && (
                        <p className="text-xs sm:text-sm text-[#102A35] font-medium">
                          {startup.tagline}
                        </p>
                      )}

                      {startup.description && (
                        <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">
                          {startup.description}
                        </p>
                      )}
                    </div>
                  </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
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

                  {/* Metadata & Actions row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DCE7E3] text-xs text-[#52656B]">
                    <div className="flex flex-wrap items-center gap-4">
                      {(startup.city || startup.country) && (
                        <span className="flex items-center space-x-1 text-[#52656B]">
                          <MapPin className="h-3 w-3 text-[#087C80]" />
                          <span>{[startup.city, startup.country].filter(Boolean).join(', ')}</span>
                        </span>
                      )}

                      {startup.founded_year && (
                        <span className="flex items-center space-x-1 text-[#52656B]">
                          <Calendar className="h-3 w-3" />
                          <span>Est. {startup.founded_year}</span>
                        </span>
                      )}

                      {startup.website_url && (
                        <a
                          href={startup.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-[#087C80] hover:text-[#07545A] font-medium transition-colors"
                        >
                          <span>Website</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/founder/startups/${startup.id}/edit`}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#102A35] hover:bg-[#F6F5ED] bg-white border border-[#DCE7E3] transition-colors"
                      >
                        Edit
                      </Link>

                      <Link
                        to={`/founder/startups/${startup.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-[#087C80] hover:text-[#07545A] transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Campaign Readiness Bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#52656B] bg-[#F6F5ED] rounded-2xl px-4 py-2 border border-[#DCE7E3]">
                      <span className="flex items-center space-x-1.5 text-[#102A35] font-medium">
                        <Layers className="h-3.5 w-3.5 text-[#087C80]" />
                        <span>Beta Campaigns</span>
                      </span>
                      <span className="text-[#0E7C57] font-semibold">
                        Ready to connect &amp; launch
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
