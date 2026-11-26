/**
 * TryLo AI Holistic Executive Synthesis & Blocker Intelligence Hub
 * Ingests all feedback submissions, logs, and video proofs, synthesizing them into
 * the #1 Single Most Critical Thing To Solve First, Release Verdict, and Unified PR Brief.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Wrench,
  FileText,
  Activity,
  ShieldAlert,
  TrendingDown,
  DollarSign,
  Code2,
} from 'lucide-react';
import {
  useExecutiveFeedbackSynthesis,
  useGenerateExecutiveFeedbackSynthesis,
  useCampaignAiSynthesis,
  useResynthesizeCampaignAi,
  useAiEngineStatus,
} from '../../context/useFeedback';

interface AiExecutiveSummaryCardProps {
  campaignId?: string;
  campaignTitle?: string;
}

export const AiExecutiveSummaryCard: React.FC<AiExecutiveSummaryCardProps> = ({
  campaignId,
  campaignTitle,
}) => {
  const { data: synthesis, isLoading, isError, error } = useExecutiveFeedbackSynthesis(campaignId);
  const { mutate: runBatchSynthesis, isPending: isSynthesizing } = useGenerateExecutiveFeedbackSynthesis();
  const { data: campaignSynthesis } = useCampaignAiSynthesis(campaignId);
  const { mutate: resynthesizeCampaign, isPending: isResynthesizing } = useResynthesizeCampaignAi();
  const { data: engineStatus } = useAiEngineStatus();

  const [copiedType, setCopiedType] = useState<'brief' | 'pr' | 'patch' | null>(null);
  const [showPreview, setShowPreview] = useState<'brief' | 'pr' | null>(null);
  const [showDiffPatch, setShowDiffPatch] = useState<boolean>(false);

  const handleCopy = (text: string, type: 'brief' | 'pr' | 'patch') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2200);
  };

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes('blocking') || v.includes('do not ship')) {
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-600 text-white',
        icon: <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0" />,
      };
    }
    if (v.includes('caution')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        badge: 'bg-amber-600 text-white',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
      };
    }
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      badge: 'bg-emerald-600 text-white',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    };
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-4 animate-pulse shadow-xs">
        <div className="h-6 bg-[#EFEFE5] rounded-full w-1/3" />
        <div className="h-20 bg-[#F6F5ED] rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-16 bg-[#F6F5ED] rounded-xl" />
          <div className="h-16 bg-[#F6F5ED] rounded-xl" />
          <div className="h-16 bg-[#F6F5ED] rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 space-y-3">
        <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>Failed to synthesize feedback insights</span>
        </div>
        <p className="text-xs text-rose-700">
          {error?.message || 'Could not load executive synthesis.'}
        </p>
        <button
          type="button"
          onClick={() => runBatchSynthesis(campaignId)}
          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
        >
          Retry Synthesis
        </button>
      </div>
    );
  }

  if (!synthesis) return null;

  const verdictStyle = getVerdictStyle(synthesis.release_readiness_verdict);
  const blocker = synthesis.single_most_critical_blocker;

  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shrink-0 mt-0.5">
            <Sparkles className="h-6 w-6 text-[#07545A]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#102A35]">
                AI Holistic Executive Synthesis
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#07545A] text-white">
                Macro Intelligence
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  engineStatus?.is_live_llm
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-[#D7EFEB] text-[#07545A]'
                }`}
                title={engineStatus?.notice}
              >
                {engineStatus?.is_live_llm ? 'TryLo AI Engine' : 'Free Local Engine'}
              </span>
              {campaignTitle && (
                <span className="text-xs font-medium text-[#52656B]">
                  &bull; {campaignTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-[#52656B] max-w-2xl leading-relaxed">
              Synthesizes dozens of tester feedbacks, reproduction steps, and video proofs into the single most critical failure mode to solve before shipping.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (campaignId) {
              resynthesizeCampaign(campaignId);
            } else {
              runBatchSynthesis(campaignId);
            }
          }}
          disabled={isSynthesizing || isResynthesizing}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(isSynthesizing || isResynthesizing) ? 'animate-spin' : ''}`} />
          <span>{(isSynthesizing || isResynthesizing) ? 'Synthesizing All Reports...' : 'Re-synthesize All Submissions'}</span>
        </button>
      </div>

      {/* Outdated Intelligence Snapshot Notice */}
      {campaignSynthesis?.is_outdated && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Intelligence Snapshot Outdated:</strong> New tester feedback has been submitted since snapshot v{campaignSynthesis.version}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => campaignId && resynthesizeCampaign(campaignId)}
            disabled={isResynthesizing}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isResynthesizing ? 'Resynthesizing...' : 'Resynthesize Campaign'}
          </button>
        </div>
      )}

      {/* Release Readiness & Overview Cards */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${verdictStyle.border} ${verdictStyle.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center space-x-3">
          {verdictStyle.icon}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
                Release Readiness Verdict
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${verdictStyle.badge}`}>
                {synthesis.release_readiness_verdict}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-[#102A35] pt-0.5">
              Health Readiness Score: <span className={verdictStyle.text}>{synthesis.release_readiness_score} / 100</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#52656B]">
          <span className="px-3 py-1 rounded-full bg-white border border-[#DCE7E3] font-semibold">
            <strong>{synthesis.total_reports_analyzed}</strong> Total Reports
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#DCE7E3] font-semibold text-rose-600">
            <strong>{synthesis.critical_bugs_count}</strong> Critical
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#DCE7E3] font-semibold text-orange-600">
            <strong>{synthesis.high_bugs_count}</strong> High
          </span>
        </div>
      </div>

      {/* THE SINGLE MOST CRITICAL ISSUE HERO CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF9F5] border-2 border-rose-200/90 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-100">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1.5 shadow-xs">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>THE #1 CRITICAL ISSUE TO SOLVE FIRST</span>
            </span>
            <span className="text-xs font-bold text-rose-800">
              Correlated across {blocker.affected_reports_count} of {synthesis.total_reports_analyzed} submissions
            </span>
          </div>

          <span className="text-[11px] text-[#52656B]">
            Primary Bottleneck &bull; Highest Customer Drop-off Risk
          </span>
        </div>

        {/* Headline & Business Impact */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-[#102A35] tracking-tight">
            {blocker.headline}
          </h3>
          <p className="text-xs sm:text-sm text-[#102A35] leading-relaxed">
            <strong>Business Impact:</strong> {blocker.business_impact}
          </p>

          {/* Predictive Risk & Financial Modeling */}
          {(blocker.revenue_at_risk_monthly || blocker.churn_risk_percentage) && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              {blocker.revenue_at_risk_monthly && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100/90 text-amber-900 border border-amber-300 shadow-2xs">
                  <DollarSign className="h-3.5 w-3.5 text-amber-700" />
                  <span>Est. {blocker.revenue_at_risk_monthly} Revenue at Risk</span>
                </span>
              )}
              {blocker.churn_risk_percentage && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-700" />
                  <span>{blocker.churn_risk_percentage}% Projected Churn</span>
                </span>
              )}
              <span className="text-[11px] text-[#52656B] font-medium">
                Correlated from conversion drop-off &amp; feedback frequency
              </span>
            </div>
          )}
        </div>

        {/* Root Cause & Hotfix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white border border-[#DCE7E3] space-y-1">
            <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider block">
              Architectural Nexus (Underlying Failure Mode)
            </span>
            <p className="text-xs text-[#102A35] font-medium leading-relaxed">
              {blocker.underlying_nexus}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <Wrench className="h-3 w-3 text-emerald-600" />
              <span>Recommended Engineering Hotfix</span>
            </span>
            <p className="text-xs text-emerald-900 font-medium leading-relaxed">
              {blocker.recommended_hotfix}
            </p>
          </div>
        </div>

        {/* Ready-to-Apply Git Diff Patch */}
        {blocker.git_diff_patch && (
          <div className="pt-3 border-t border-rose-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDiffPatch(!showDiffPatch)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#07545A] hover:text-[#087C80] transition-colors cursor-pointer"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>{showDiffPatch ? 'Hide Ready-to-Apply Git Patch' : 'View Ready-to-Apply Git Diff Patch'}</span>
                {showDiffPatch ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(blocker.git_diff_patch || '', 'patch')}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer shadow-2xs"
              >
                {copiedType === 'patch' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied Patch!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-[#52656B]" />
                    <span>Copy Git Diff</span>
                  </>
                )}
              </button>
            </div>

            {showDiffPatch && (
              <pre className="p-4 rounded-2xl bg-[#0F172A] text-[#38BDF8] font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 select-all shadow-inner">
                <code>{blocker.git_diff_patch}</code>
              </pre>
            )}
          </div>
        )}
      </div>

      {/* TOP 3 PRIORITIZED ACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#102A35] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#07545A]" />
            <span>Top 3 Prioritized Engineering Actions</span>
          </h4>
          <span className="text-[11px] text-[#52656B]">Ranked by ROI &amp; Failure Severity</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {synthesis.top_prioritized_actions.map((act) => (
            <div
              key={act.priority}
              className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#DCE7E3] space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-[#07545A] text-white text-[11px] font-black flex items-center justify-center">
                    P{act.priority}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#DCE7E3] text-[#52656B]">
                    {act.estimated_effort}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-[#102A35] leading-snug">
                  {act.action_title}
                </h5>
                <p className="text-[11px] text-[#52656B] leading-relaxed line-clamp-3">
                  {act.rationale}
                </p>
              </div>

              <div className="pt-2 border-t border-[#DCE7E3] text-[10px] text-[#52656B]">
                Impacts <strong>{act.affected_reports_count}</strong> reported issues
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1-CLICK EXPORTS: EXECUTIVE REPORT & UNIFIED PR BRIEF */}
      <div className="pt-4 border-t border-[#DCE7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-[#102A35] block">
            1-Click Export Actions
          </span>
          <span className="text-[11px] text-[#52656B]">
            Export either a high-level executive report for stakeholders or a unified engineering fix brief for developers.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Executive Brief */}
          <button
            type="button"
            onClick={() => handleCopy(synthesis.executive_summary_markdown, 'brief')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors cursor-pointer"
          >
            {copiedType === 'brief' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Executive Report Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Executive Report</span>
              </>
            )}
          </button>

          {/* Copy Unified Developer PR Brief */}
          <button
            type="button"
            onClick={() => handleCopy(synthesis.unified_pr_brief_markdown, 'pr')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer shadow-xs"
          >
            {copiedType === 'pr' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Unified PR Brief Copied!</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span>Copy Unified PR Brief (GitHub/Linear)</span>
              </>
            )}
          </button>

          {/* Toggle Preview */}
          <button
            type="button"
            onClick={() => setShowPreview((prev) => (prev ? null : 'brief'))}
            className="p-2 rounded-xl text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] transition-colors cursor-pointer"
            title="Toggle Markdown Preview"
          >
            {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Preview Box */}
      {showPreview && (
        <div className="space-y-2 pt-2 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => setShowPreview('brief')}
              className={`px-3 py-1 rounded-lg font-bold ${
                showPreview === 'brief'
                  ? 'bg-[#07545A] text-white'
                  : 'bg-[#EFEFE5] text-[#52656B]'
              }`}
            >
              Executive Report Preview
            </button>
            <button
              type="button"
              onClick={() => setShowPreview('pr')}
              className={`px-3 py-1 rounded-lg font-bold ${
                showPreview === 'pr'
                  ? 'bg-[#07545A] text-white'
                  : 'bg-[#EFEFE5] text-[#52656B]'
              }`}
            >
              Unified PR Brief Preview
            </button>
          </div>

          <pre className="p-4 bg-[#102A35] text-white rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-72 border border-[#07545A]">
            {showPreview === 'brief'
              ? synthesis.executive_summary_markdown
              : synthesis.unified_pr_brief_markdown}
          </pre>
        </div>
      )}
    </div>
  );
};
