import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useProfile } from '../context/useProfile';
import { useMyStartups } from '../context/useStartups';
import {
  Rocket,
  LogOut,
  Sparkles,
  Layers,
  ArrowRight,
  Building,
  Edit3,
  Globe,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Plus,
  Users,
} from 'lucide-react';
import type { FounderProfile } from '../api/profile';

export const FounderWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const { profileData } = useProfile();
  const { data: startups, isLoading: isLoadingStartups } = useMyStartups();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const founderProfile = profileData?.profile as FounderProfile | null;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
              Founder Workspace
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Active Founder</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400">
            Account Email: <span className="text-slate-300 font-mono">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700/80 transition-all shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Profile Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            id="founder-logout-btn"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Startup Profile Summary Card */}
      {founderProfile && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {founderProfile.startup_name || 'Your Startup'}
                </h2>
                <p className="text-xs text-slate-400">
                  {founderProfile.professional_title || 'Founder'} &bull; {founderProfile.industry || 'Tech'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {founderProfile.company_stage && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {founderProfile.company_stage}
                </span>
              )}
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>Onboarding Complete</span>
              </span>
            </div>
          </div>

          {founderProfile.startup_description && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {founderProfile.startup_description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            {(founderProfile.city || founderProfile.country) && (
              <span className="flex items-center space-x-1 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{[founderProfile.city, founderProfile.country].filter(Boolean).join(', ')}</span>
              </span>
            )}

            {founderProfile.website_url && (
              <a
                href={founderProfile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">{founderProfile.website_url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {founderProfile.linkedin_url && (
              <a
                href={founderProfile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
              >
                <ExternalLink className="h-3 w-3 text-slate-400" />
                <span>LinkedIn</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* My Startups Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">My Startups</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#a88bff] border border-[#6338E8]/30">
                {isLoadingStartups ? '...' : startups?.length || 0}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage your companies and configure them for upcoming beta testing campaigns.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to="/founder/startups/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] shadow-md shadow-[#6338E8]/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Startup</span>
            </Link>

            {startups && startups.length > 0 && (
              <Link
                to="/founder/startups"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Startups List / Cards in Workspace */}
        {isLoadingStartups && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-5"
              />
            ))}
          </div>
        )}

        {!isLoadingStartups && startups && startups.length === 0 && (
          <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-8 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Building className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No startups created yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add your startup entity to establish public presence and launch beta campaigns.
              </p>
            </div>
            <div>
              <Link
                to="/founder/startups/new"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Your First Startup</span>
              </Link>
            </div>
          </div>
        )}

        {!isLoadingStartups && startups && startups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startups.map((startup) => (
              <div
                key={startup.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 p-5 space-y-3 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white hover:text-[#a88bff] transition-colors">
                      <Link to={`/founder/startups/${startup.id}`}>
                        {startup.name}
                      </Link>
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      slug: {startup.slug}
                    </p>
                  </div>
                  {startup.company_stage && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#6338E8]/15 text-[#a88bff] border border-[#6338E8]/30 shrink-0">
                      {startup.company_stage}
                    </span>
                  )}
                </div>

                {startup.tagline && (
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {startup.tagline}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-400">
                    {startup.industry || 'Tech'} {startup.city ? `• ${startup.city}` : ''}
                  </span>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/founder/startups/${startup.id}/campaigns`}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      title="View Campaigns"
                    >
                      Campaigns
                    </Link>
                    <Link
                      to={`/founder/startups/${startup.id}/edit`}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/founder/startups/${startup.id}`}
                      className="inline-flex items-center space-x-0.5 text-[11px] font-semibold text-[#a88bff] hover:text-[#c4b5fd] transition-colors"
                    >
                      <span>Manage</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Showcase Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900/40 border border-indigo-500/20 p-8 space-y-6">
        <div className="flex items-center space-x-3 text-indigo-400">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Founder Beta Testing Portal</h2>
            <p className="text-xs text-slate-400">Complete end-to-end beta campaign lifecycle</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Your founder profile is active. Launch beta campaigns, review applicant screening answers, track structured task execution, and manage bug reports with issue tracking.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Link
            to={startups && startups.length > 0 ? `/founder/startups/${startups[0].id}/campaigns` : '/founder/startups/new'}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-[#6338E8]/50 transition-all space-y-1.5 block group"
          >
            <div className="flex items-center justify-between text-[#a88bff] text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-[#a88bff]" />
                <span className="group-hover:text-white transition-colors">Launch Campaigns</span>
              </div>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Create, configure testing tasks, and publish beta campaigns.
            </p>
          </Link>

          <Link
            to="/founder/applications"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-[#6338E8]/50 transition-all space-y-1.5 block group"
          >
            <div className="flex items-center justify-between text-violet-400 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="group-hover:text-white transition-colors">Review Applications</span>
              </div>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Inspect applicant screening responses and accept beta testers within capacity.
            </p>
          </Link>

          <Link
            to="/founder/feedback"
            id="founder-workspace-review-feedback-btn"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-[#6338E8]/50 transition-all space-y-1.5 block group"
          >
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span className="group-hover:text-white transition-colors">Review Feedback</span>
              </div>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Inspect structured bug reports, manage issue lifecycle, and request retesting.
            </p>
          </Link>
        </div>

        <div className="pt-4 flex items-center space-x-4 border-t border-slate-800/60">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <span>Return to Landing Page &amp; Live Diagnostics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
