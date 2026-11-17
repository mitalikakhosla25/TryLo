/**
 * TryLo AI Automated Bug Triaging & Root Cause Intelligence Card
 * Replaces the "Coming Soon" placeholder with active root cause detection,
 * complexity estimation, duplicate correlation, and 1-click GitHub/Linear dev tickets.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Wrench,
  Gauge,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';
import type { FounderFeedbackDetail } from '../../api/feedback';
import { useRunAiFeedbackTriage } from '../../context/useFeedback';

interface AiTriageCardProps {
  feedback: FounderFeedbackDetail;
}

export const AiTriageCard: React.FC<AiTriageCardProps> = ({ feedback }) => {
  const triage = feedback.ai_triage;
  const { mutate: runTriage, isPending: isRunningTriage } = useRunAiFeedbackTriage(feedback.id);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [showRawTicket, setShowRawTicket] = useState(false);

  const handleCopyTicket = () => {
    if (!triage?.dev_ticket_markdown) return;
    navigator.clipboard.writeText(triage.dev_ticket_markdown);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2200);
  };

  const getComplexityColor = (complexity: string) => {
    const c = complexity.toLowerCase();
    if (c.includes('low')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (c.includes('high')) return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const getFrictionColor = (score: number) => {
    if (score >= 8) return { text: 'text-rose-600', bg: 'bg-rose-500', border: 'border-rose-200' };
    if (score >= 5) return { text: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-200' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-200' };
  };

  const getSentimentIcon = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === 'frustrated') return <Frown className="h-3.5 w-3.5 text-rose-600" />;
    if (s === 'confused') return <Meh className="h-3.5 w-3.5 text-amber-600" />;
    return <Smile className="h-3.5 w-3.5 text-emerald-600" />;
  };

  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-[#07545A]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#102A35] flex items-center gap-2">
              <span>AI Automated Root Cause &amp; Triage Intelligence</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] text-[#07545A] border border-[#BCE1D8]">
                v2 Powered
              </span>
            </h2>
            <p className="text-[11px] text-[#52656B]">
              Deterministic semantic root cause analysis, duplicate clustering, and 1-click developer tickets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => runTriage(feedback.id)}
          disabled={isRunningTriage}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRunningTriage ? 'animate-spin' : ''}`} />
          <span>{isRunningTriage ? 'Synthesizing...' : triage ? 'Re-run Analysis' : 'Run AI Triage'}</span>
        </button>
      </div>

      {/* Main Content */}
      {!triage ? (
        /* Empty / Not run state */
        <div className="py-8 text-center bg-[#F6F5ED] rounded-2xl border border-dashed border-[#DCE7E3] p-6 space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-[#DCE7E3] flex items-center justify-center">
            <Cpu className="h-5 w-5 text-[#07545A]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#102A35]">AI Triage Ready to Analyze</h3>
            <p className="text-[11px] text-[#52656B] max-w-sm mx-auto leading-relaxed">
              Click &quot;Run AI Triage&quot; above to deduce likely root causes, detect duplicate issues in this campaign, evaluate friction, and generate a GitHub/Linear ticket.
            </p>
          </div>
          <button
            type="button"
            onClick={() => runTriage(feedback.id)}
            disabled={isRunningTriage}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#07545A] text-white hover:bg-[#087C80] shadow-xs cursor-pointer transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate AI Triage</span>
          </button>
        </div>
      ) : (
        /* Triage Analysis Results */
        <div className="space-y-5">
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fix Complexity */}
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#DCE7E3] space-y-1">
              <div className="flex items-center space-x-1.5 text-[#52656B] text-[11px] font-semibold">
                <Wrench className="h-3.5 w-3.5" />
                <span>Estimated Fix Complexity</span>
              </div>
              <div className="pt-0.5">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getComplexityColor(triage.fix_complexity)}`}>
                  {triage.fix_complexity}
                </span>
              </div>
            </div>

            {/* Friction Score */}
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#DCE7E3] space-y-1">
              <div className="flex items-center space-x-1.5 text-[#52656B] text-[11px] font-semibold">
                <Gauge className="h-3.5 w-3.5" />
                <span>User Friction Score</span>
              </div>
              <div className="flex items-center space-x-2 pt-0.5">
                <span className={`text-base font-extrabold ${getFrictionColor(triage.friction_score).text}`}>
                  {triage.friction_score} / 10
                </span>
                <div className="flex-1 h-2 bg-[#EFEFE5] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getFrictionColor(triage.friction_score).bg}`}
                    style={{ width: `${triage.friction_score * 10}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tester Sentiment */}
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#DCE7E3] space-y-1">
              <div className="flex items-center space-x-1.5 text-[#52656B] text-[11px] font-semibold">
                <span>Tester Sentiment</span>
              </div>
              <div className="flex items-center space-x-1.5 pt-0.5">
                {getSentimentIcon(triage.sentiment_label)}
                <span className="text-xs font-bold text-[#102A35] capitalize">
                  {triage.sentiment_label}
                </span>
              </div>
            </div>
          </div>

          {/* Suspected Root Cause & Tags */}
          <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2">
            <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider block">
              Suspected Root Cause Hypothesis
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[#102A35] leading-relaxed">
              {triage.root_cause_hypothesis}
            </p>

            {/* Technical Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="h-3 w-3 text-[#52656B]" />
              {triage.technical_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white border border-[#DCE7E3] text-[#07545A]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Actionable Code Fix Suggestion */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Architectural Fix Recommendation</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {triage.suggested_fix}
            </p>
          </div>

          {/* Duplicate Detection Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#102A35]">
                Semantic Duplicate Correlation ({triage.potential_duplicates.length})
              </span>
              <span className="text-[10px] text-[#52656B]">
                Scanned across {feedback.campaign_title}
              </span>
            </div>

            {triage.potential_duplicates.length === 0 ? (
              <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#DCE7E3] text-xs text-[#52656B] flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Zero duplicate reports detected. This appears to be a unique issue submission.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {triage.potential_duplicates.map((dup) => (
                  <div
                    key={dup.id}
                    className="p-3 rounded-xl bg-[#FAFAFA] border border-[#DCE7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-[#087C80]/50 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {dup.similarity_score}% Similar
                        </span>
                        {dup.severity && (
                          <span className="text-[10px] uppercase font-semibold text-[#52656B]">
                            {dup.severity}
                          </span>
                        )}
                        <span className="text-[11px] text-[#52656B]">
                          by {dup.tester_name}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#102A35] truncate">{dup.title}</h4>
                    </div>

                    <Link
                      to={`/founder/feedback/${dup.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-white border border-[#DCE7E3] text-[#07545A] hover:bg-[#EFEFE5] transition-colors shrink-0"
                    >
                      <span>View Related Issue</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1-Click Developer Ticket Section */}
          <div className="pt-3 border-t border-[#DCE7E3] space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#102A35] block">
                  Export Developer Issue Ticket
                </span>
                <span className="text-[10px] text-[#52656B]">
                  Formatted markdown ready to paste directly into GitHub Issues, Linear, or Jira.
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRawTicket((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] transition-colors cursor-pointer inline-flex items-center space-x-1"
                >
                  <span>{showRawTicket ? 'Hide Preview' : 'Preview Ticket'}</span>
                  {showRawTicket ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
                >
                  {copiedTicket ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Markdown Preview */}
            {showRawTicket && (
              <pre className="p-4 bg-[#102A35] text-white rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-64 border border-[#07545A]">
                {triage.dev_ticket_markdown}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

