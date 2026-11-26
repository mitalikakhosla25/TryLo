import React, { useState } from 'react';
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
  TrendingUp,
  Bug,
  Coins,
  ShieldCheck,
  Download,
} from 'lucide-react';
import type { FounderProfile } from '../api/profile';
import { useFounderAnalyticsOverview } from '../context/useCampaigns';
import { useFounderEscrowOverview } from '../context/usePayouts';
import { downloadFounderPayoutsCsv } from '../api/payouts';
import { DonutChart } from '../components/ui/ChartWidgets';
import { FounderAiCopilotDrawer } from '../components/feedback/FounderAiCopilotDrawer';

export const FounderWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const { profileData } = useProfile();
  const { data: startups, isLoading: isLoadingStartups } = useMyStartups();
  const { data: analyticsOverview } = useFounderAnalyticsOverview();
  const { data: escrowOverview } = useFounderEscrowOverview();
  const navigate = useNavigate();

  const [isExportingMacroCsv, setIsExportingMacroCsv] = useState(false);
  const [macroExportMsg, setMacroExportMsg] = useState<string | null>(null);

  const handleExportMacroCsv = async () => {
    try {
      setIsExportingMacroCsv(true);
      setMacroExportMsg(null);
      await downloadFounderPayoutsCsv();
      setMacroExportMsg('Portfolio financial audit CSV exported successfully.');
      setTimeout(() => setMacroExportMsg(null), 3500);
    } catch {
      setMacroExportMsg('Failed to export portfolio CSV.');
    } finally {
      setIsExportingMacroCsv(false);
    }
  };

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              Welcome back, {user?.full_name}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <span>Account Email: <span className="text-[#102A35] font-mono font-medium">{user?.email}</span></span>
              <span>&bull;</span>
              <span className="text-[#0E7C57] flex items-center space-x-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Active Founder</span>
              </span>
            </div>
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

        {/* Founder Intelligence & Portfolio Analytics (Version 2) */}
        {analyticsOverview && (
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] shadow-xs">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#102A35]">
                      Founder QA Intelligence Overview
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#07545A] text-white">
                      V2 Suite
                    </span>
                  </div>
                  <p className="text-xs text-[#52656B]">
                    Macro analytics across all your registered startups and beta campaigns.
                  </p>
                </div>
              </div>

              {startups && startups.length > 0 && (
                <Link
                  to={`/founder/startups/${startups[0].id}/campaigns`}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F6F5ED] hover:bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3] transition-colors"
                >
                  <span>Campaign Reports</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#087C80]" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                <div className="flex items-center justify-between text-xs text-[#52656B]">
                  <span>Vetted Testers</span>
                  <Users className="h-4 w-4 text-[#087C80]" />
                </div>
                <div className="text-2xl font-black text-[#102A35]">
                  {analyticsOverview.total_testers_engaged}
                </div>
                <div className="text-[11px] text-[#52656B]">
                  Across {analyticsOverview.active_campaigns} active campaigns
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                <div className="flex items-center justify-between text-xs text-[#52656B]">
                  <span>Bugs Triaged</span>
                  <Bug className="h-4 w-4 text-[#087C80]" />
                </div>
                <div className="text-2xl font-black text-[#102A35]">
                  {analyticsOverview.total_bugs_reported}
                </div>
                <div className="text-[11px] text-rose-600 font-semibold">
                  {analyticsOverview.critical_bugs_count} critical priority
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                <div className="flex items-center justify-between text-xs text-[#52656B]">
                  <span>Resolution Rate</span>
                  <CheckCircle2 className="h-4 w-4 text-[#0E7C57]" />
                </div>
                <div className="text-2xl font-black text-[#0E7C57]">
                  {analyticsOverview.overall_resolution_rate}%
                </div>
                <div className="text-[11px] text-[#52656B]">
                  QA resolution velocity
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                <div className="flex items-center justify-between text-xs text-[#52656B]">
                  <span>Reward Capital</span>
                  <Coins className="h-4 w-4 text-[#087C80]" />
                </div>
                <div className="text-2xl font-black text-[#102A35]">
                  ₹{analyticsOverview.total_payout_pool.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#07545A] font-semibold">
                  Avg Tester ATS: {analyticsOverview.average_tester_ats}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Founder Escrow Vault Portfolio Summary (Version 2) */}
        {escrowOverview && (
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-[#E6F4F1] border border-[#BCE1D8] flex items-center justify-center text-[#07545A] shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[#102A35]">
                      Escrow Vault &amp; UPI Payout Ledger
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#087C80] text-white">
                      Fintech V2
                    </span>
                  </div>
                  <p className="text-xs text-[#52656B]">
                    Live trust escrow accounting and simulated NPCI instant UPI disbursements.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleExportMacroCsv}
                  disabled={isExportingMacroCsv}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] border border-[#DCE7E3] text-[#102A35] transition-colors cursor-pointer"
                  title="Export Portfolio Payouts Audit CSV"
                >
                  <Download className="h-3.5 w-3.5 text-[#087C80]" />
                  <span>{isExportingMacroCsv ? 'Exporting...' : 'Export Audit CSV'}</span>
                </button>

                {startups && startups.length > 0 && (
                  <Link
                    to={`/founder/startups/${startups[0].id}/campaigns`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#E6F4F1] hover:bg-[#D4EBE7] border border-[#BCE1D8] text-[#07545A] transition-colors"
                  >
                    <Coins className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>Manage Campaign Vaults</span>
                  </Link>
                )}
              </div>
            </div>

            {macroExportMsg && (
              <div className="p-3 rounded-xl bg-[#E6F4F1] border border-[#BCE1D8] text-[#07545A] text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{macroExportMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
                <span className="text-[11px] font-bold text-[#52656B]">Total Escrow Funded</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                  ₹{escrowOverview.total_escrow_funded.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#52656B]">{escrowOverview.active_escrow_campaigns_count} active escrow pools</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#E6F4F1]/60 border border-[#BCE1D8] space-y-1">
                <span className="text-[11px] font-bold text-[#07545A]">Vault Liquidity</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#07545A]">
                  ₹{escrowOverview.total_escrow_remaining.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#07545A]">Available for disbursements</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
                <span className="text-[11px] font-bold text-[#52656B]">Disbursed to Testers</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                  ₹{escrowOverview.total_escrow_disbursed.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#52656B]">Instant settled rewards</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-1">
                <span className="text-[11px] font-bold text-[#52656B]">Recent Payouts</span>
                <p className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                  {escrowOverview.recent_disbursements.length}
                </p>
                <p className="text-[10px] text-[#52656B]">100% verified settlement</p>
              </div>
            </div>

            {/* Visual Portfolio Liquidity Distribution and Receipts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F6F5ED]/60 border border-[#DCE7E3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#102A35]">Portfolio Capital Allocation</span>
                  <span className="text-[11px] font-semibold text-[#07545A] bg-[#E6F4F1] px-2 py-0.5 rounded-full border border-[#BCE1D8]">
                    {escrowOverview.total_escrow_funded > 0
                      ? Math.round((escrowOverview.total_escrow_disbursed / escrowOverview.total_escrow_funded) * 100)
                      : 0}% Burn Rate
                  </span>
                </div>
                <DonutChart
                  data={[
                    {
                      label: 'Disbursed to Testers',
                      value: escrowOverview.total_escrow_disbursed,
                      color: '#087C80',
                    },
                    {
                      label: 'Available Vault Liquidity',
                      value: escrowOverview.total_escrow_remaining,
                      color: '#10B981',
                    },
                  ]}
                  centerLabel="Vault"
                  centerValue={`₹${escrowOverview.total_escrow_funded.toLocaleString()}`}
                  size={140}
                  strokeWidth={18}
                />
              </div>

              {escrowOverview.recent_disbursements.length > 0 ? (
                <div className="p-4 rounded-2xl bg-[#F6F5ED]/40 border border-[#DCE7E3] space-y-2">
                  <span className="text-xs font-bold text-[#102A35]">Recent Simulated UPI Receipts</span>
                  <div className="divide-y divide-[#DCE7E3] border border-[#DCE7E3] rounded-xl overflow-hidden bg-white max-h-40 overflow-y-auto">
                    {escrowOverview.recent_disbursements.map((d) => (
                      <div key={d.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-[#F6F5ED]/40 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#102A35]">{d.tester_name || 'Tester'}</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#E6F4F1] text-[#07545A]">
                              {d.milestone_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#52656B]">
                            To: <span className="font-mono">{d.upi_id}</span> • UTR: <span className="font-mono font-medium">{d.utr_number}</span>
                          </p>
                        </div>
                        <span className="font-bold text-[#07545A] text-xs">
                          ₹{d.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#F6F5ED]/40 border border-[#DCE7E3] flex items-center justify-center text-xs text-[#52656B]">
                  No disbursements recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Floating Ask TryLo AI Co-Pilot Assistant */}
      <FounderAiCopilotDrawer />
    </div>
  );
};
