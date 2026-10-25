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
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
              Tester Workspace
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Active Tester</span>
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
            <Edit3 className="h-3.5 w-3.5 text-violet-400" />
            <span>Profile Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            id="tester-logout-btn"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Tester Profile Summary Card */}
      {testerProfile && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Beta Tester Profile</h2>
                <p className="text-xs text-slate-400">
                  Level: <span className="text-violet-300 font-semibold">{testerProfile.experience_level || 'Intermediate'}</span>
                </p>
              </div>
            </div>

            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
              <CheckCircle2 className="h-3 w-3" />
              <span>Onboarding Complete</span>
            </span>
          </div>

          {testerProfile.bio && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              "{testerProfile.bio}"
            </p>
          )}

          {/* Skills Chips */}
          {testerProfile.skills && testerProfile.skills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Testing Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {testerProfile.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25"
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
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Product Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {testerProfile.interests.map((it) => (
                  <span
                    key={it}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
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
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Hardware &amp; Platforms
              </span>
              <div className="flex flex-wrap gap-1.5">
                {testerProfile.devices.map((d) => (
                  <span
                    key={d}
                    className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location and Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            {(testerProfile.city || testerProfile.country) && (
              <span className="flex items-center space-x-1 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{[testerProfile.city, testerProfile.country].filter(Boolean).join(', ')}</span>
              </span>
            )}

            {testerProfile.linkedin_url && (
              <a
                href={testerProfile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
              >
                <ExternalLink className="h-3 w-3 text-slate-400" />
                <span>LinkedIn Profile</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Discover Campaigns CTA Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 via-purple-900/40 to-slate-900/90 border border-violet-500/30 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Opportunities</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Discover Published Beta Testing Campaigns
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore live testing opportunities from verified startups, filter by your devices and reward criteria, and inspect full product testing specifications.
            </p>
          </div>

          <Link
            to="/tester/discover"
            id="tester-discover-campaigns-btn"
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-all shadow-lg shadow-violet-900/40 shrink-0 self-start sm:self-center"
          >
            <span>Browse Campaigns</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Early Access Hub Card */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-900/40 border border-violet-500/20 p-8 space-y-6">
        <div className="flex items-center space-x-3 text-violet-400">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Tester Early Access Hub</h2>
            <p className="text-xs text-slate-400">Milestone: Discovery &amp; Profile active</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Your tester profile is active. Browse published campaigns to review testing tasks, reward models, and device requirements before submitting applications.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <Link
            to="/tester/discover"
            className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-violet-500/30 hover:border-violet-500/50 space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between text-violet-400 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-[#FFC928]" />
                <span className="text-white group-hover:text-violet-300 transition-colors">Browse Apps</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Discover and inspect active startup beta testing campaigns.
            </p>
          </Link>

          <Link
            to="/tester/applications"
            className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-violet-500/30 hover:border-violet-500/50 space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between text-violet-400 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-4 w-4 text-[#a88bff]" />
                <span className="text-white group-hover:text-violet-300 transition-colors">Applications</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Track submitted applications, screening responses, and status.
            </p>
          </Link>

          <Link
            to="/tester/tasks"
            className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-violet-500/30 hover:border-violet-500/50 space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between text-violet-400 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <ListChecks className="h-4 w-4 text-emerald-400" />
                <span className="text-white group-hover:text-violet-300 transition-colors">Testing Tasks</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Execute test instructions, track progress, and submit bug reports.
            </p>
          </Link>

          <Link
            to="/tester/feedback"
            className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-violet-500/30 hover:border-violet-500/50 space-y-1.5 transition-all group block"
          >
            <div className="flex items-center justify-between text-violet-400 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-[#FFC928]" />
                <span className="text-white group-hover:text-violet-300 transition-colors">My Feedback</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              View your submitted feedback history and bug reports across campaigns.
            </p>
          </Link>
        </div>

        <div className="pt-4 flex items-center space-x-4 border-t border-slate-800/60">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold"
          >
            <span>Return to Landing Page &amp; Live Diagnostics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
