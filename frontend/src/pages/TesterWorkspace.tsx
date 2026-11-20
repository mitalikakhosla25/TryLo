/**
 * TryLo Beta Tester Mission Control & Intelligence Dashboard
 * Unified hub for active testing missions, real-time task progress,
 * AI Sentinel bug verification status, and simulated NPCI UPI payout vault.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useProfile } from '../context/useProfile';
import { useTesterEarnings, useUpdateTesterUpi } from '../context/usePayouts';
import { useTesterTasks, useMyFeedback } from '../context/useTasks';
import { useMyApplications } from '../context/useApplications';
import { usePublicCampaigns } from '../context/useCampaigns';
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
  Coins,
  Bug,
  Video,
  Clock,
  AlertTriangle,
  Check,
  Copy,
  ChevronRight,
  Play,
  FileCheck,
  Activity,
  Award,
  Zap,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';
import type { TesterProfile } from '../api/profile';
import { TesterTierBadge } from '../components/ui/VerificationBadge';
import { TesterCredibilityHub } from '../components/tester/TesterCredibilityHub';
import { TesterEarningsModal } from '../components/tester/TesterEarningsModal';

type DashboardTab = 'overview' | 'missions' | 'feedback' | 'payouts' | 'applications' | 'credibility';

export const TesterWorkspace: React.FC = () => {
  const { user, logout } = useAuth();
  const { profileData } = useProfile();
  const { data: earnings } = useTesterEarnings();
  const { mutateAsync: updateUpi, isPending: isUpdatingUpi } = useUpdateTesterUpi();
  const { data: tasksData, isLoading: isTasksLoading } = useTesterTasks();
  const { data: feedbackData, isLoading: isFeedbackLoading } = useMyFeedback();
  const { data: applications, isLoading: isAppsLoading } = useMyApplications();
  const { data: publicCampaignsData } = usePublicCampaigns();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showEarningsModal, setShowEarningsModal] = useState<boolean>(false);
  const [isEditingUpiInline, setIsEditingUpiInline] = useState<boolean>(false);
  const [inlineUpiText, setInlineUpiText] = useState<string>('');
  const [upiToast, setUpiToast] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const testerProfile = profileData?.profile as TesterProfile | null;
  const activeAssignments = tasksData?.items || [];
  const feedbackItems = feedbackData?.items || [];
  const myApps = applications || [];
  const recommendedCampaigns = publicCampaignsData?.items?.slice(0, 3) || [];

  // Metric Computations
  const totalCompletedTasks = activeAssignments.reduce((acc, curr) => acc + (curr.completed_tasks || 0), 0);
  const totalTasks = activeAssignments.reduce((acc, curr) => acc + (curr.total_tasks || 0), 0);
  const resolvedFeedbackCount = feedbackItems.filter((f) => f.status === 'resolved').length;
  const inReviewFeedbackCount = feedbackItems.filter((f) => f.status === 'in_review' || f.status === 'submitted').length;
  const completedAssignmentsCount = activeAssignments.filter((a) => a.assignment_status === 'completed').length;

  const handleSaveInlineUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inlineUpiText.trim().toLowerCase();
    if (!trimmed.includes('@') || trimmed.length < 5) {
      alert('Please enter a valid UPI VPA (e.g. username@okhdfcbank)');
      return;
    }
    try {
      await updateUpi({ upi_id: trimmed });
      setUpiToast('UPI ID updated successfully!');
      setIsEditingUpiInline(false);
      setInlineUpiText('');
      setTimeout(() => setUpiToast(null), 3000);
    } catch {
      alert('Failed to update UPI ID. Please try again.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(id);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* TOP WELCOME HERO & QUICK ACTIONS */}
        <div className="bg-white rounded-3xl border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                  Welcome, {user?.full_name}
                </h1>
                <TesterTierBadge
                  tier={testerProfile?.verification_tier || 1}
                  rating={testerProfile?.average_rating || 4.9}
                  reviewsCount={testerProfile?.reviews_count || 12}
                  size="md"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#52656B]">
                <span className="font-mono text-[#102A35]">{user?.email}</span>
                <span>&bull;</span>
                <span className="text-emerald-700 flex items-center space-x-1 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Verified Tester</span>
                </span>
                <span>&bull;</span>
                <span>Level: <strong className="text-[#07545A]">{testerProfile?.experience_level || 'Intermediate QA'}</strong></span>
              </div>
            </div>

            {/* Quick Header CTA buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/tester/discover"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#FFC928]" />
                <span>Browse Campaigns</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowEarningsModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#E6F7F0] hover:bg-[#D7EFEB] text-[#07545A] border border-[#B6EDD5] transition-all cursor-pointer shadow-xs"
              >
                <Coins className="h-3.5 w-3.5 text-[#07545A]" />
                <span>UPI Vault</span>
              </button>

              <Link
                to="/profile"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#FAF9F5] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#52656B]" />
                <span>Settings</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer shadow-xs"
                title="Log out of account"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* REAL-TIME KPI METRICS RIBBON (4 Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: Lifetime Disbursed Earnings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2 hover:border-[#087C80]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                  Lifetime Earnings
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E6F4F1] text-[#07545A] border border-[#BCE1D8]">
                  Simulated UPI
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-[#07545A]">
                  ₹{(earnings?.lifetime_earnings || 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#52656B]">INR</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#52656B] pt-1 border-t border-[#DCE7E3]/60">
                <span>{earnings?.completed_payouts_count || 0} rewards settled</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('payouts')}
                  className="font-bold text-[#087C80] hover:underline cursor-pointer"
                >
                  View Vault &rarr;
                </button>
              </div>
            </div>

            {/* Tile 2: Active Missions & Progress */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2 hover:border-[#087C80]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                  Active Missions
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {activeAssignments.length} Enrolled
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-[#102A35]">
                  {activeAssignments.length}
                </span>
                <span className="text-xs text-[#52656B]">campaigns</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#52656B] pt-1 border-t border-[#DCE7E3]/60">
                <span>{totalCompletedTasks} of {totalTasks} tasks done</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('missions')}
                  className="font-bold text-[#087C80] hover:underline cursor-pointer"
                >
                  Manage &rarr;
                </button>
              </div>
            </div>

            {/* Tile 3: Verified Bug Bounties */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2 hover:border-[#087C80]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                  Bounties Reported
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  AI Sentinel
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-[#102A35]">
                  {feedbackItems.length}
                </span>
                <span className="text-xs text-emerald-700 font-bold">
                  ({resolvedFeedbackCount} settled)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#52656B] pt-1 border-t border-[#DCE7E3]/60">
                <span>{inReviewFeedbackCount} in review</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className="font-bold text-[#087C80] hover:underline cursor-pointer"
                >
                  History &rarr;
                </button>
              </div>
            </div>

            {/* Tile 4: AI Sentinel Trust Score */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2 hover:border-[#087C80]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                  Sentinel Trust Rating
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-emerald-700">96%</span>
                <span className="text-xs font-extrabold text-[#102A35]">Top 5%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-[#DCE7E3]/60 font-semibold">
                <span>Entropy &amp; Telemetry Verified</span>
                <Award className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Inline Primary UPI Quick Bar */}
          <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#DCE7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#E6F4F1] text-[#07545A] flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[#52656B]">Settlement UPI VPA: </span>
                <span className="font-mono font-bold text-[#102A35]">
                  {earnings?.saved_upi_id || 'tester.official@paytm'}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Auto-Disbursal Active
                </span>
              </div>
            </div>

            {!isEditingUpiInline ? (
              <button
                type="button"
                onClick={() => {
                  setInlineUpiText(earnings?.saved_upi_id || '');
                  setIsEditingUpiInline(true);
                }}
                className="inline-flex items-center space-x-1 font-semibold text-[#07545A] hover:underline cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Change UPI ID</span>
              </button>
            ) : (
              <form onSubmit={handleSaveInlineUpi} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inlineUpiText}
                  onChange={(e) => setInlineUpiText(e.target.value)}
                  placeholder="e.g. name@okhdfcbank"
                  className="px-3 py-1 bg-white border border-[#087C80] rounded-lg text-xs font-mono text-[#102A35] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingUpi}
                  className="px-3 py-1 bg-[#07545A] text-white rounded-lg font-bold text-xs hover:bg-[#087C80] cursor-pointer"
                >
                  {isUpdatingUpi ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUpiInline(false)}
                  className="px-2 py-1 text-[#52656B] hover:text-[#102A35]"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
          {upiToast && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>{upiToast}</span>
            </div>
          )}
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-[#DCE7E3]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
            }`}
          >
            Mission Control
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'missions'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
            }`}
          >
            <span>Active Missions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {activeAssignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'feedback'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
            }`}
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Bug Reports &amp; Sentinel</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {feedbackItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'payouts'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>UPI Payout Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'applications'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Applications ({myApps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credibility')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'credibility'
                ? 'bg-[#07545A] text-white shadow-xs'
                : 'bg-white text-[#52656B] hover:text-[#102A35] border border-[#DCE7E3]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Credibility Hub</span>
          </button>
        </div>

        {/* TAB 1: MISSION CONTROL OVERVIEW */}
        {(activeTab === 'overview' || activeTab === 'missions') && (
          <div className="space-y-6">
            {/* Active Testing Missions Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#102A35] flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-[#07545A]" />
                  <span>Enrolled Testing Missions ({activeAssignments.length})</span>
                </h2>
                <p className="text-xs text-[#52656B]">
                  Accepted campaigns ready for task execution, screen recording reproduction, and bounty submission.
                </p>
              </div>

              <Link
                to="/tester/tasks"
                className="text-xs font-bold text-[#07545A] hover:underline self-start sm:self-auto"
              >
                View Full Task Workspace &rarr;
              </Link>
            </div>

            {/* List of Active Campaign Assignments */}
            {activeAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeAssignments.map((assignment) => {
                  const pct = assignment.total_tasks > 0
                    ? Math.round((assignment.completed_tasks / assignment.total_tasks) * 100)
                    : 0;

                  return (
                    <div
                      key={assignment.campaign_id}
                      className="bg-white rounded-3xl border border-[#DCE7E3] p-5 sm:p-6 space-y-4 shadow-xs hover:border-[#087C80]/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                            {assignment.startup_name}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              assignment.assignment_status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {assignment.assignment_status === 'completed' ? 'Tasks Finished' : 'In Progress'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-[#102A35] leading-snug">
                            {assignment.campaign_title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#DCE7E3] text-[10px] font-semibold text-[#52656B]">
                              {assignment.product_type || 'Web Application'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[#E6F4F1] border border-[#BCE1D8] text-[10px] font-bold text-[#07545A]">
                              ₹1,500 Reward
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] font-semibold text-[#52656B]">
                            <span>Task Progress</span>
                            <span>{assignment.completed_tasks} / {assignment.total_tasks} completed ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#FAF9F5] rounded-full overflow-hidden border border-[#DCE7E3]">
                            <div
                              className="h-full bg-[#087C80] rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(5, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-[#DCE7E3] flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/tester/campaigns/${assignment.campaign_id}/tasks`}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors shadow-xs"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Resume Testing Tasks</span>
                        </Link>

                        <Link
                          to={`/tester/campaigns/${assignment.campaign_id}/feedback/new`}
                          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
                        >
                          <Bug className="h-3.5 w-3.5" />
                          <span>Report Bug</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-[#DCE7E3] space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-[#E6F4F1] text-[#07545A] flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#102A35]">No Active Testing Missions Yet</h3>
                <p className="text-xs text-[#52656B] max-w-sm mx-auto">
                  Apply to live beta campaigns to receive test accounts, execute structured tasks, and earn instant escrow bounties.
                </p>
                <div className="pt-2">
                  <Link
                    to="/tester/discover"
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all"
                  >
                    <span>Browse Open Beta Campaigns</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUG REPORTS & AI SENTINEL VERIFICATION FEED */}
        {(activeTab === 'overview' || activeTab === 'feedback') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-[#102A35] flex items-center gap-2">
                  <Bug className="h-5 w-5 text-rose-600" />
                  <span>My Reported Defects &amp; AI Sentinel Audits</span>
                </h2>
                <p className="text-xs text-[#52656B]">
                  Real-time status of your submitted bugs, screen recording evidence, and verified escrow releases.
                </p>
              </div>

              <Link
                to="/tester/feedback"
                className="text-xs font-bold text-[#07545A] hover:underline self-start sm:self-auto"
              >
                Full Feedback History &rarr;
              </Link>
            </div>

            {feedbackItems.length > 0 ? (
              <div className="bg-white rounded-3xl border border-[#DCE7E3] overflow-hidden shadow-xs divide-y divide-[#DCE7E3]">
                {feedbackItems.slice(0, 5).map((item) => {
                  const isResolved = item.status === 'resolved';
                  const hasVideo = !!item.video_url;

                  return (
                    <div key={item.id} className="p-4 sm:p-5 space-y-2 hover:bg-[#FAF9F5] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.severity === 'critical'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : item.severity === 'high'
                                ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {item.severity || 'Medium'}
                          </span>
                          <span className="text-xs font-extrabold text-[#102A35] hover:text-[#07545A]">
                            {item.title}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {isResolved ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Bounty Disbursed &bull; Verified</span>
                            </span>
                          ) : item.status === 'needs_retest' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                              <RotateCcw className="h-3 w-3 text-orange-600" />
                              <span>Founder Requested Retest</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Analyzing Telemetry (Under Review)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#52656B] line-clamp-1">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#52656B] pt-1">
                        <div className="flex items-center space-x-3">
                          <span>Campaign: <strong>{item.campaign_title}</strong></span>
                          <span>&bull;</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          {hasVideo && (
                            <span className="inline-flex items-center space-x-1 text-[#07545A] font-semibold bg-[#E6F4F1] px-2 py-0.5 rounded border border-[#BCE1D8]">
                              <Video className="h-3 w-3" />
                              <span>{item.video_duration_seconds ? `${item.video_duration_seconds}s Video Proof` : 'Video Attached'}</span>
                            </span>
                          )}
                        </div>

                        {item.resolution_notes && (
                          <span className="text-emerald-800 font-mono text-[10px] truncate max-w-xs">
                            {item.resolution_notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-white rounded-3xl border border-[#DCE7E3] text-center text-xs text-[#52656B]">
                No bug reports submitted yet. Launch an active mission to capture video proofs.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SIMULATED NPCI UPI PAYOUT VAULT */}
        {(activeTab === 'overview' || activeTab === 'payouts') && (
          <div className="bg-white rounded-3xl border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE7E3] pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-[#E6F4F1] text-[#07545A]">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#102A35]">
                    Simulated NPCI UPI Payout Vault
                  </h3>
                  <p className="text-xs text-[#52656B]">
                    Instant settlement ledger stamped with immutable SHA-256 cryptographic attestation hashes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEarningsModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer self-start sm:self-auto"
              >
                Manage UPI Settings &rarr;
              </button>
            </div>

            {/* Payout History List */}
            {earnings?.payouts && earnings.payouts.length > 0 ? (
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#52656B] uppercase tracking-wider block">
                  Recent Disbursed Bounties
                </span>
                <div className="divide-y divide-[#DCE7E3] border border-[#DCE7E3] rounded-2xl overflow-hidden">
                  {earnings.payouts.slice(0, 4).map((payout) => (
                    <div
                      key={payout.id}
                      className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#FAF9F5] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-[#102A35]">
                            ₹{payout.amount.toFixed(2)} {payout.currency}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            SETTLED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#52656B]">
                          Campaign: {payout.campaign_title || 'Beta Bug Bounty'} &bull; To: <span className="font-mono">{payout.upi_id}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 self-start sm:self-auto">
                        <div className="text-right">
                          <div className="flex items-center space-x-1 font-mono font-bold text-[#07545A] text-[11px]">
                            <span>UTR: {payout.utr_number}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(payout.utr_number, payout.id)}
                              className="p-1 hover:text-[#087C80]"
                              title="Copy NPCI UTR"
                            >
                              {copiedUtr === payout.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-[#52656B]">
                            {new Date(payout.disbursed_at).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(payout)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF9F5] border border-[#DCE7E3] hover:bg-[#EFEFE5] text-[#102A35] cursor-pointer"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#FAF9F5] rounded-2xl border border-[#DCE7E3] text-center text-xs text-[#52656B]">
                No bounties disbursed yet. Complete testing tasks or report approved bugs to receive simulated UPI payouts.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APPLICATION STATUS TRACKER */}
        {(activeTab === 'overview' || activeTab === 'applications') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#102A35] flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#07545A]" />
                  <span>My Campaign Applications ({myApps.length})</span>
                </h2>
                <p className="text-xs text-[#52656B]">
                  Track founder review decisions and screening application responses.
                </p>
              </div>

              <Link
                to="/tester/applications"
                className="text-xs font-bold text-[#07545A] hover:underline"
              >
                View Applications Page &rarr;
              </Link>
            </div>

            {myApps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myApps.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-white border border-[#DCE7E3] space-y-2 shadow-xs hover:border-[#087C80]/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#52656B] uppercase">{app.startup_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          app.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {app.status === 'accepted' ? 'Accepted ✓' : app.status === 'rejected' ? 'Declined' : 'In Review'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#102A35] line-clamp-1">
                      {app.campaign_title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-[#52656B] pt-2 border-t border-[#DCE7E3]">
                      <span>Reward: <strong>{app.reward_currency || '₹'}{app.reward_amount || 25}</strong></span>
                      {app.status === 'accepted' && (
                        <Link
                          to={`/tester/campaigns/${app.campaign_id}/tasks`}
                          className="font-bold text-[#07545A] hover:underline flex items-center space-x-1"
                        >
                          <span>Go to Tasks</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white rounded-3xl border border-[#DCE7E3] text-center text-xs text-[#52656B]">
                You haven't submitted any campaign applications yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CREDIBILITY & BIO HUB */}
        {(activeTab === 'overview' || activeTab === 'credibility') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#102A35] flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#07545A]" />
                  <span>Verified Credibility &amp; Reputation Hub</span>
                </h2>
                <p className="text-xs text-[#52656B]">
                  Your public resume, certifications, peer endorsements, and founder feedback ratings.
                </p>
              </div>
            </div>

            <TesterCredibilityHub isOwner={true} />
          </div>
        )}

        {/* DIGITAL RECEIPT MODAL */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-[#DCE7E3] shadow-2xl p-6 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-[#E6F7F0] text-[#07545A]">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#102A35]">
                      TryLo Disbursal Attestation Receipt
                    </h4>
                    <p className="text-[10px] text-[#52656B]">Simulated NPCI UPI Transaction</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#DCE7E3] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#52656B]">Campaign:</span>
                  <span className="font-bold text-[#102A35]">{selectedReceipt.campaign_title || 'Beta Bounty'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52656B]">Bounty Disbursed:</span>
                  <span className="font-black text-emerald-800">₹{selectedReceipt.amount.toFixed(2)} {selectedReceipt.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52656B]">Destination UPI VPA:</span>
                  <span className="font-mono text-[#07545A] font-bold">{selectedReceipt.upi_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#52656B]">NPCI UPI UTR:</span>
                  <span className="font-mono font-bold text-[#102A35]">{selectedReceipt.utr_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52656B]">Reference ID:</span>
                  <span className="font-mono text-[10px] text-[#52656B]">{selectedReceipt.reference_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52656B]">Settlement Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    SETTLED ✓
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2 bg-[#102A35] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}

        {/* Tester Earnings Modal Component */}
        {showEarningsModal && (
          <TesterEarningsModal onClose={() => setShowEarningsModal(false)} />
        )}
      </div>
    </div>
  );
};
export default TesterWorkspace;
