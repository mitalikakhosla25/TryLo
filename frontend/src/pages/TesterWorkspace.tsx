import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useProfile } from '../context/useProfile';
import {
  ShieldCheck,
  LogOut,
  Sparkles,
  ArrowRight,
  Edit3,
  MapPin,
  ExternalLink,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  MessageSquare,
} from 'lucide-react';
import type { TesterProfile } from '../api/profile';

export const TesterWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const { profileData } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const testerProfile = profileData?.profile as TesterProfile | null;

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] capitalize">
                Tester Workspace
              </span>
              <span className="text-xs text-[#52656B]">&bull;</span>
              <span className="text-xs text-emerald-700 flex items-center space-x-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Active Tester</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              Welcome, {user?.full_name}
            </h1>
            <p className="text-xs text-[#52656B]">
              Account Email: <span className="text-[#102A35] font-mono font-medium">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#07545A]" />
              <span>Profile Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              id="tester-logout-btn"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 transition-all shadow-xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tester Profile Summary Card */}
        {testerProfile && (
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-3">
                <div className="h-11 w-11 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#07545A]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#102A35]">Beta Tester Profile</h2>
                  <p className="text-xs text-[#52656B]">
                    Level: <span className="text-[#07545A] font-bold">{testerProfile.experience_level || 'Intermediate'}</span>
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Onboarding Complete</span>
              </span>
            </div>

            {testerProfile.bio && (
              <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed bg-[#F6F5ED] p-4 rounded-2xl border border-[#DCE7E3]">
                "{testerProfile.bio}"
              </p>
            )}

            {/* Skills Chips */}
            {testerProfile.skills && testerProfile.skills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider block">
                  Testing Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {testerProfile.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Chips */}
            {testerProfile.interests && testerProfile.interests.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider block">
                  Product Interests
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {testerProfile.interests.map((it) => (
                    <span
                      key={it}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Devices Chips */}
            {testerProfile.devices && testerProfile.devices.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#52656B] uppercase tracking-wider block">
                  Hardware &amp; Platforms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {testerProfile.devices.map((d) => (
                    <span
                      key={d}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location and Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#52656B] pt-3 border-t border-[#DCE7E3]">
              {(testerProfile.city || testerProfile.country) && (
                <span className="flex items-center space-x-1 text-[#102A35]">
                  <MapPin className="h-3.5 w-3.5 text-[#07545A]" />
                  <span>{[testerProfile.city, testerProfile.country].filter(Boolean).join(', ')}</span>
                </span>
              )}

              {testerProfile.linkedin_url && (
                <a
                  href={testerProfile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#07545A] hover:text-[#087C80] font-medium transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Discover Campaigns CTA Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07545A] to-[#087C80] p-6 sm:p-8 space-y-4 shadow-md text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#FFC928]" />
                <span>Live Opportunities</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Discover Published Beta Testing Campaigns
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Explore live testing opportunities from verified startups, filter by your devices and reward criteria, and inspect full product testing specifications.
              </p>
            </div>

            <Link
              to="/tester/discover"
              id="tester-discover-campaigns-btn"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-white text-[#07545A] hover:bg-[#F6F5ED] transition-all shadow-md shrink-0 self-start sm:self-center"
            >
              <span>Browse Campaigns</span>
              <ArrowRight className="h-4 w-4 text-[#07545A]" />
            </Link>
          </div>
        </div>

        {/* Early Access Hub Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center space-x-3 text-[#07545A]">
            <div className="h-10 w-10 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#07545A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#102A35]">Tester Early Access Hub</h2>
              <p className="text-xs text-[#52656B]">Milestone: Discovery &amp; Profile active</p>
            </div>
          </div>

          <p className="text-sm text-[#52656B] leading-relaxed max-w-2xl">
            Your tester profile is active. Browse published campaigns to review testing tasks, reward models, and device requirements before submitting applications.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <Link
              to="/tester/discover"
              className="p-5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 space-y-2 transition-all group block shadow-xs"
            >
              <div className="flex items-center justify-between text-[#07545A] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-[#087C80]" />
                  <span className="text-[#102A35] group-hover:text-[#07545A] transition-colors">Browse Apps</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#52656B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                Discover and inspect active startup beta testing campaigns.
              </p>
            </Link>

            <Link
              to="/tester/applications"
              className="p-5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 space-y-2 transition-all group block shadow-xs"
            >
              <div className="flex items-center justify-between text-[#07545A] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-4 w-4 text-[#087C80]" />
                  <span className="text-[#102A35] group-hover:text-[#07545A] transition-colors">Applications</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#52656B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                Track submitted applications, screening responses, and status.
              </p>
            </Link>

            <Link
              to="/tester/tasks"
              className="p-5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 space-y-2 transition-all group block shadow-xs"
            >
              <div className="flex items-center justify-between text-[#07545A] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <ListChecks className="h-4 w-4 text-[#087C80]" />
                  <span className="text-[#102A35] group-hover:text-[#07545A] transition-colors">Testing Tasks</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#52656B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                Execute test instructions, track progress, and submit bug reports.
              </p>
            </Link>

            <Link
              to="/tester/feedback"
              className="p-5 rounded-2xl bg-[#F6F5ED] hover:bg-white border border-[#DCE7E3] hover:border-[#087C80]/50 space-y-2 transition-all group block shadow-xs"
            >
              <div className="flex items-center justify-between text-[#07545A] text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-[#087C80]" />
                  <span className="text-[#102A35] group-hover:text-[#07545A] transition-colors">My Feedback</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#52656B] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-[#52656B]">
                View your submitted feedback history and bug reports across campaigns.
              </p>
            </Link>
          </div>

          <div className="pt-4 flex items-center space-x-4 border-t border-[#DCE7E3]">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-[#07545A] hover:text-[#087C80] font-semibold"
            >
              <span>Return to Landing Page &amp; Live Diagnostics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
