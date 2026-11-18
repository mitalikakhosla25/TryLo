/**
 * TryLo AI Tester Proof Attestation & Anti-Fraud Sentinel Card
 * Audits crowdsourced tester submissions for authentic human telemetry,
 * campaign task compliance, and provides 1-click payout release recommendations.
 */

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Coins,
  Sparkles,
} from 'lucide-react';
import { useTesterProofAttestation, useRunTesterProofAttestation } from '../../context/useFeedback';

interface AiProofSentinelCardProps {
  feedbackId: string;
}

export const AiProofSentinelCard: React.FC<AiProofSentinelCardProps> = ({ feedbackId }) => {
  const { data: audit, isLoading } = useTesterProofAttestation(feedbackId);
  const { mutate: reAudit, isPending: isReAuditing } = useRunTesterProofAttestation(feedbackId);

  if (isLoading) {
    return (
      <div className="p-5 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-20 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (!audit) return null;

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Low Fraud Risk (Human Verified)',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Medium Risk (Standard Tester)',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          label: 'High Risk (Manual Review Needed)',
        };
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Critical / Potential Automation',
        };
    }
  };

  const getPayoutCallout = (status: string) => {
    switch (status) {
      case 'approve':
        return 'bg-emerald-50 border-emerald-200 text-emerald-950';
      case 'approve_partial':
        return 'bg-amber-50 border-amber-200 text-amber-950';
      case 'hold':
        return 'bg-orange-50 border-orange-200 text-orange-950';
      default:
        return 'bg-rose-50 border-rose-200 text-rose-950';
    }
  };

  const riskInfo = getRiskBadge(audit.fraud_risk);

  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#E6F7F0] text-[#07545A] border border-[#B6EDD5]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-[#102A35]">
                AI Tester Proof Attestation &amp; Anti-Fraud Sentinel
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-teal-600" />
                <span>Zero-Fraud Protocol</span>
              </span>
            </div>
            <p className="text-[11px] text-[#52656B]">
              Verifies human telemetry patterns, device entropy, and campaign pass-criteria compliance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => reAudit()}
          disabled={isReAuditing}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF9F5] hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 text-[#07545A] ${isReAuditing ? 'animate-spin' : ''}`} />
          <span>{isReAuditing ? 'Auditing...' : 'Re-Audit'}</span>
        </button>
      </div>

      {/* Main Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Overall Trust Score */}
        <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
              Trust &amp; Proof Score
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-[#102A35]">{audit.overall_trust_score}</span>
              <span className="text-xs text-[#52656B] font-semibold">/100</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-800 text-xs">
            {audit.overall_trust_score}%
          </div>
        </div>

        {/* Human Interaction Telemetry */}
        <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-0.5">
          <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
            Human Telemetry Entropy
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-[#102A35]">{audit.human_interaction_score}%</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskInfo.bg}`}>
              {riskInfo.label}
            </span>
          </div>
        </div>

        {/* Task Compliance */}
        <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-0.5">
          <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">
            Pass Criteria Adherence
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-[#102A35]">{audit.compliance_score}%</span>
            <span className="text-[11px] font-semibold text-emerald-700">
              {audit.compliance_score >= 70 ? 'Complete' : 'Partial'}
            </span>
          </div>
        </div>
      </div>

      {/* Payout Release Recommendation */}
      <div className={`p-4 rounded-2xl border ${getPayoutCallout(audit.payout_status)} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs`}>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-[#07545A]" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Sentinel Payout Recommendation:
            </span>
          </div>
          <p className="text-sm font-bold">
            {audit.payout_recommendation}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            {audit.sentinel_audit_summary}
          </p>
        </div>

        <div className="shrink-0">
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#102A35] text-white shadow-2xs inline-block">
            {audit.trust_tier}
          </span>
        </div>
      </div>

      {/* 4 Proof Attestation Vector Badges */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#52656B] uppercase tracking-wider block">
          Telemetry &amp; Fraud Attestation Vectors:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {audit.attestation_badges.map((badge) => (
            <div
              key={badge.id}
              className="p-3 rounded-2xl bg-white border border-[#DCE7E3] space-y-1 hover:border-[#087C80]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102A35]">{badge.label}</span>
                {badge.status === 'pass' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>VERIFIED</span>
                  </span>
                ) : badge.status === 'warn' ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    <span>ATTENTION</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    <HelpCircle className="h-3 w-3" />
                    <span>OPTIONAL</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#52656B] leading-relaxed">
                {badge.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Engine Stamp */}
      <div className="pt-2 border-t border-[#DCE7E3] flex items-center justify-between text-[10px] text-[#52656B]">
        <span>Engine: <strong className="text-[#102A35]">{audit.engine_used}</strong></span>
        <span>Audited: {new Date(audit.audited_at).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
