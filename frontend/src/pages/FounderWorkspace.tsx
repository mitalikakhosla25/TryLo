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
  Building2,
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
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] capitalize">
                Founder Workspace
              </span>
              <span className="text-xs text-[#52656B]">&bull;</span>
              <span className="text-xs text-[#0E7C57] flex items-center space-x-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Active Founder</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-xs text-[#52656B]">
              Account Email: <span className="text-[#102A35] font-mono font-medium">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#087C80]" />
              <span>Profile Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              id="founder-logout-btn"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold text-rose-700 hover:bg-rose-50 bg-white border border-rose-200 transition-all shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Startup Profile Summary Card */}
        {founderProfile && (
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-3.5">
                <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] shadow-xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#102A35]">
                    {founderProfile.startup_name || 'Your Startup'}
                  </h2>
                  <p className="text-xs text-[#52656B]">
                    {founderProfile.professional_title || 'Founder'} &bull; {founderProfile.industry || 'Tech'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {founderProfile.company_stage && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                    {founderProfile.company_stage}
                  </span>
                )}
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Onboarding Complete</span>
                </span>
              </div>
            </div>

            {founderProfile.startup_description && (
              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                {founderProfile.startup_description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#52656B] pt-1">
              {(founderProfile.city || founderProfile.country) && (
                <span className="flex items-center space-x-1 text-[#102A35]">
                  <MapPin className="h-3.5 w-3.5 text-[#087C80]" />
                  <span>{[founderProfile.city, founderProfile.country].filter(Boolean).join(', ')}</span>
                </span>
              )}

              {founderProfile.website_url && (
                <a
                  href={founderProfile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#087C80] hover:text-[#07545A] font-medium transition-colors"
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
                  className="inline-flex items-center space-x-1 text-[#102A35] hover:text-[#087C80] transition-colors"
                >
                  <ExternalLink className="h-3 w-3 text-[#52656B]" />
                  <span>LinkedIn Profile</span>
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
                <h2 className="text-xl font-bold text-[#102A35]">My Startups</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                  {isLoadingStartups ? '...' : startups?.length || 0}
                </span>
              </div>
              <p className="text-xs text-[#52656B] mt-0.5">
                Manage your companies and configure them for targeted beta testing campaigns.
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <Link
                to="/founder/startups/new"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Startup</span>
              </Link>

              {startups && startups.length > 0 && (
                <Link
                  to="/founder/startups"
                  className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-full text-xs font-semibold text-[#102A35] hover:bg-[#EFEFE5] bg-white border border-[#DCE7E3] transition-colors"
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
                  className="h-36 rounded-2xl bg-white border border-[#DCE7E3] animate-pulse p-5 shadow-xs"
                />
              ))}
            </div>
          )}

          {!isLoadingStartups && startups && startups.length === 0 && (
            <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[#D7EFEB] flex items-center justify-center text-[#087C80]">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#102A35]">No startups created yet</h3>
                <p className="text-xs text-[#52656B] max-w-sm mx-auto">
                  Add your startup entity to establish public presence and launch beta campaigns.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/founder/startups/new"
                  className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs"
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
                  className="rounded-2xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 p-5 space-y-3 transition-all shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-[#102A35] hover:text-[#087C80] transition-colors">
                        <Link to={`/founder/startups/${startup.id}`}>
                          {startup.name}
                        </Link>
                      </h3>
                      <p className="text-xs font-mono text-[#52656B]">
                        slug: {startup.slug}
                      </p>
                    </div>
                    {startup.company_stage && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shrink-0">
                        {startup.company_stage}
                      </span>
                    )}
                  </div>

                  {startup.tagline && (
                    <p className="text-xs text-[#52656B] line-clamp-1">
                      {startup.tagline}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#DCE7E3] text-xs">
                    <span className="text-[11px] text-[#52656B]">
                      {startup.industry || 'Tech'} {startup.city ? `• ${startup.city}` : ''}
                    </span>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/founder/startups/${startup.id}/campaigns`}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#102A35] hover:bg-[#EFEFE5] bg-[#F6F5ED] border border-[#DCE7E3] transition-colors"
                        title="View Campaigns"
                      >
                        Campaigns
                      </Link>
                      <Link
                        to={`/founder/startups/${startup.id}/edit`}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#102A35] hover:bg-[#EFEFE5] bg-[#F6F5ED] border border-[#DCE7E3] transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/founder/startups/${startup.id}`}
                        className="inline-flex items-center space-x-0.5 text-[11px] font-semibold text-[#087C80] hover:text-[#07545A] transition-colors"
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
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-3 text-[#087C80]">
            <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] shadow-xs">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#102A35]">Founder Beta Testing Hub</h2>
              <p className="text-xs text-[#52656B]">Complete end-to-end beta campaign lifecycle</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed max-w-2xl">
            Your founder workspace is active. Launch beta campaigns, review applicant screening answers, track structured task execution, and manage bug reports with issue tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <Link
              to={startups && startups.length > 0 ? `/founder/startups/${startups[0].id}/campaigns` : '/founder/startups/new'}
              className="p-4.5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all space-y-1.5 block group shadow-2xs"
            >
              <div className="flex items-center justify-between text-[#087C80] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span className="group-hover:text-[#07545A] transition-colors">Launch Campaigns</span>
                </div>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                Create, configure testing tasks, and publish beta campaigns.
              </p>
            </Link>

            <Link
              to="/founder/applications"
              className="p-4.5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all space-y-1.5 block group shadow-2xs"
            >
              <div className="flex items-center justify-between text-[#07545A] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span className="group-hover:text-[#087C80] transition-colors">Review Applications</span>
                </div>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                Inspect applicant screening responses and accept beta testers within capacity.
              </p>
            </Link>

            <Link
              to="/founder/feedback"
              id="founder-workspace-review-feedback-btn"
              className="p-4.5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 transition-all space-y-1.5 block group shadow-2xs"
            >
              <div className="flex items-center justify-between text-[#0E7C57] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="group-hover:text-[#102A35] transition-colors">Review Feedback</span>
                </div>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                Inspect structured bug reports, manage issue lifecycle, and request retesting.
              </p>
            </Link>
          </div>

          <div className="pt-4 flex items-center space-x-4 border-t border-[#DCE7E3]">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-[#087C80] hover:text-[#07545A] font-semibold"
            >
              <span>Return to Landing Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
