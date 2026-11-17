/**
 * TryLo AI User Journey Funnel & Drop-Off Reconstruction Component
 * Displays a connected visual telemetry pipeline reconstructing tester retention across:
 * Discovery -> Auth -> Onboarding -> Core Workflow -> Monetization & Checkout.
 */

import React, { useState } from 'react';
import {
  Compass,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Wrench,
  Users,
  Layers,
} from 'lucide-react';
import { useUserJourneyFunnel } from '../../context/useFeedback';
import type { UserJourneyStageItem } from '../../api/feedback';

interface AiUserJourneyFunnelProps {
  campaignId?: string;
}

export const AiUserJourneyFunnel: React.FC<AiUserJourneyFunnelProps> = ({ campaignId }) => {
  const { data: funnel, isLoading, isError } = useUserJourneyFunnel(campaignId);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 text-center space-y-2 animate-pulse shadow-sm">
        <div className="h-4 w-48 bg-slate-200 rounded-full mx-auto" />
        <div className="h-3 w-72 bg-slate-100 rounded-full mx-auto" />
      </div>
    );
  }

  if (isError || !funnel) return null;

  const getStatusBadge = (status: UserJourneyStageItem['status']) => {
    switch (status) {
      case 'healthy':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Healthy Stage',
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Friction Warning',
          icon: <AlertTriangle className="h-3 w-3 text-amber-600" />,
        };
      case 'critical_bottleneck':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Critical Bottleneck',
          icon: <ShieldAlert className="h-3 w-3 text-rose-600" />,
        };
    }
  };

  const getProgressBarColor = (status: UserJourneyStageItem['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical_bottleneck':
        return 'bg-rose-500';
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Funnel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shrink-0 mt-0.5">
            <Compass className="h-6 w-6 text-[#07545A]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#102A35]">
                AI User Journey Funnel &amp; Drop-Off Reconstruction
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#07545A] text-white">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-[#52656B] max-w-2xl leading-relaxed">
              Synthesizes end-to-end tester activity into sequential conversion milestones. Identifies exactly where users encounter friction and drop off.
            </p>
          </div>
        </div>

        {/* Funnel Efficiency Score Pill */}
        <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto bg-[#FAF9F5] border border-[#DCE7E3] rounded-2xl p-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider block">
              Overall Efficiency
            </span>
            <span className="text-lg font-black text-[#102A35]">
              {funnel.overall_funnel_efficiency_score}%
            </span>
          </div>
          <div className="h-8 w-px bg-[#DCE7E3]" />
          <div className="text-left">
            <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider block">
              Evaluated Testers
            </span>
            <span className="text-sm font-bold text-[#07545A] flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{funnel.total_testers_evaluated}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Critical Drop-off Bottleneck Hero Callout */}
      <div className="p-4 rounded-2xl bg-[#FFF9F5] border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <span className="p-1.5 rounded-xl bg-amber-500 text-white shrink-0">
            <Flame className="h-4 w-4" />
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-[#102A35]">
                Primary Drop-Off Nexus:
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                {funnel.critical_drop_off_stage}
              </span>
            </div>
            <p className="text-xs text-[#52656B]">
              {funnel.executive_funnel_takeaway}
            </p>
          </div>
        </div>
      </div>

      {/* Connected Visual Pipeline Flow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#102A35] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#07545A]" />
            <span>Interactive Conversion Milestones</span>
          </h4>
          <span className="text-[11px] text-[#52656B]">Click any stage to inspect defects &amp; AI fixes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {funnel.stages.map((stage) => {
            const isExpanded = expandedStageId === stage.stage_id;
            const badge = getStatusBadge(stage.status);
            const progressColor = getProgressBarColor(stage.status);

            return (
              <div
                key={stage.stage_id}
                onClick={() => setExpandedStageId(isExpanded ? null : stage.stage_id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isExpanded
                    ? 'bg-white border-[#07545A] shadow-md ring-2 ring-[#07545A]/20'
                    : 'bg-[#FAFAFA] hover:bg-white border-[#DCE7E3] hover:border-[#BCE1DA] shadow-2xs'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top indicator & order */}
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-md bg-[#102A35] text-white text-[10px] font-black flex items-center justify-center">
                      {stage.order}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.bg}`}>
                      {badge.icon}
                      <span>{stage.pass_rate_percentage}% Pass</span>
                    </span>
                  </div>

                  {/* Stage Name */}
                  <h5 className="text-xs font-bold text-[#102A35] line-clamp-1">
                    {stage.stage_name}
                  </h5>

                  {/* Pass Rate Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${stage.pass_rate_percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#52656B]">
                      <span>{stage.testers_reached} reached</span>
                      <span className={stage.drop_off_percentage > 20 ? 'font-bold text-rose-600' : ''}>
                        -{stage.drop_off_percentage}% drop
                      </span>
                    </div>
                  </div>

                  {/* Defect Count Pill */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#52656B]">Reported Defects:</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#DCE7E3] text-[10px] font-bold text-[#102A35]">
                      {stage.reported_defects_count}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 flex items-center justify-end text-[10px] font-semibold text-[#07545A]">
                  <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
                  {isExpanded ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Stage Detail Drawer */}
      {expandedStageId && (() => {
        const stage = funnel.stages.find((s) => s.stage_id === expandedStageId);
        if (!stage) return null;
        const badge = getStatusBadge(stage.status);

        return (
          <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-3.5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xs text-[#102A35]">
                  Stage Detail: {stage.stage_name}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <span className="text-xs text-[#52656B]">
                {stage.testers_reached} testers reached milestone ({stage.pass_rate_percentage}% completion rate)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Top Defect */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DCE7E3] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52656B] block">
                  Top Reported Friction Point
                </span>
                <p className="text-xs text-[#102A35] font-semibold leading-relaxed">
                  {stage.top_defect_headline || 'No blocking defects filed in this stage.'}
                </p>
              </div>

              {/* Tactical AI Recommendation */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 block">
                  <Wrench className="h-3 w-3 text-emerald-600" />
                  <span>AI Conversion Recommendation</span>
                </span>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  {stage.ai_recommendation}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
