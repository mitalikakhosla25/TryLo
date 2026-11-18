/**
 * TryLo AI Tester Proof Attestation & Anti-Fraud Sentinel Card
 * Audits crowdsourced tester submissions for authentic human telemetry,
 * campaign task compliance, and provides 1-click escrow payout release.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Coins,
  Sparkles,
  Copy,
  Check,
  FileCheck,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Award,
} from 'lucide-react';
import {
  useTesterProofAttestation,
  useRunTesterProofAttestation,
  useFeedbackPayoutStatus,
  useReleaseFeedbackPayout,
} from '../../context/useFeedback';

interface AiProofSentinelCardProps {
  feedbackId: string;
}

export const AiProofSentinelCard: React.FC<AiProofSentinelCardProps> = ({ feedbackId }) => {
  const { data: audit, isLoading: isAuditLoading } = useTesterProofAttestation(feedbackId);
  const { mutate: reAudit, isPending: isReAuditing } = useRunTesterProofAttestation(feedbackId);
  const { data: payoutStatus, isLoading: isPayoutLoading } = useFeedbackPayoutStatus(feedbackId);
  const { mutate: releasePayout, isPending: isReleasing } = useReleaseFeedbackPayout(feedbackId);

  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedUtr, setCopiedUtr] = useState<boolean>(false);

  if (isAuditLoading || isPayoutLoading) {
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
  const isDisbursed = payoutStatus?.is_disbursed;
  const activeAmount = customAmount ? parseFloat(customAmount) : (payoutStatus?.amount || 25);

  const handleCopyHash = () => {
    if (payoutStatus?.digital_certificate_hash) {
      navigator.clipboard.writeText(payoutStatus.digital_certificate_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleCopyUtr = () => {
    if (payoutStatus?.utr_number) {
      navigator.clipboard.writeText(payoutStatus.utr_number);
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  const handleExecuteRelease = () => {
    releasePayout({
      amount: activeAmount,
      notes: customNotes.trim() || undefined,
    });
  };

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

      {/* Sentinel Payout Recommendation & 1-Click Escrow Action */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${getPayoutCallout(audit.payout_status)} space-y-3 shadow-2xs`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-[#07545A]" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Sentinel Payout Recommendation:
              </span>
            </div>
            <p className="text-sm font-bold text-[#102A35]">
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

        {/* Payout Status Banner / 1-Click Action */}
        <div className="pt-2 border-t border-black/10">
          {isDisbursed ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 p-3.5 rounded-xl border border-emerald-300">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-[#102A35]">
                      Escrow Bounty Disbursed (₹{payoutStatus?.amount})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      UTR: {payoutStatus?.utr_number}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52656B]">
                    Instant settlement to {payoutStatus?.tester_name} &bull; {payoutStatus?.upi_id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Award className="h-3.5 w-3.5" />
                <span>View Attestation Receipt</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleExecuteRelease}
                  disabled={isReleasing}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#07545A] hover:bg-[#087C80] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isReleasing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                  )}
                  <span>
                    {isReleasing
                      ? 'Releasing from Escrow...'
                      : `1-Click Release Bounty (₹${activeAmount}) via Escrow`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-[#52656B] hover:text-[#102A35] transition-colors cursor-pointer"
                >
                  <span>Adjust amount or add notes</span>
                  {showConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Collapsible custom configuration */}
              {showConfig && (
                <div className="p-3.5 bg-white/90 rounded-xl border border-black/10 space-y-2.5 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                        Bounty Amount (₹ / INR)
                      </label>
                      <input
                        type="number"
                        placeholder={`Default: ₹${payoutStatus?.amount || 25}`}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FAF9F5] border border-[#DCE7E3] rounded-lg text-xs text-[#102A35]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#102A35] mb-1">
                        Disbursal Notes / Founder Accolades
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Thanks for the pristine screen recording!"
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FAF9F5] border border-[#DCE7E3] rounded-lg text-xs text-[#102A35]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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

      {/* Cryptographic Attestation Modal */}
      {showCertModal && payoutStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#DCE7E3] shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#E6F7F0] text-[#07545A]">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#102A35]">
                    Cryptographic Attestation Receipt
                  </h4>
                  <p className="text-[10px] text-[#52656B]">
                    TryLo Immutable Escrow Disbursal Certificate
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Summary Grid */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#52656B]">Attestation Status:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  VERIFIED &bull; SETTLED
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52656B]">Bounty Disbursed:</span>
                <span className="font-extrabold text-[#102A35] text-base">
                  ₹{payoutStatus.amount.toFixed(2)} {payoutStatus.currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52656B]">Beneficiary Tester:</span>
                <span className="font-bold text-[#102A35]">{payoutStatus.tester_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52656B]">UPI VPA Address:</span>
                <span className="font-mono text-[#07545A] font-semibold">{payoutStatus.upi_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52656B]">NPCI UPI UTR:</span>
                <div className="flex items-center space-x-1 font-mono font-bold text-[#102A35]">
                  <span>{payoutStatus.utr_number}</span>
                  <button
                    type="button"
                    onClick={handleCopyUtr}
                    className="p-1 hover:text-[#07545A] transition-colors"
                  >
                    {copiedUtr ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52656B]">Disbursal Timestamp:</span>
                <span className="text-[11px] text-[#102A35]">
                  {payoutStatus.disbursed_at ? new Date(payoutStatus.disbursed_at).toUTCString() : 'Instant'}
                </span>
              </div>
            </div>

            {/* SHA-256 Hash Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#52656B]">
                <span>SHA-256 Attestation Hash</span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="inline-flex items-center space-x-1 text-[#07545A] hover:underline cursor-pointer"
                >
                  {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-cyan-300 break-all select-all border border-slate-800">
                {payoutStatus.digital_certificate_hash || 'SHA256: PENDING'}
              </div>
              <p className="text-[10px] text-[#52656B] italic">
                This cryptographic hash cryptographically binds the defect submission, tester biometric telemetry, and escrow payout.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#102A35] text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
