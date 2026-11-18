import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useSimulateLaunchRoi } from '../../context/useFeedback';
import type {
  FounderFeedbackListItem,
  LaunchRoiSimulationResponse,
} from '../../api/feedback';

interface AiLaunchRoiSimulatorProps {
  campaignId?: string;
  feedbackItems: FounderFeedbackListItem[];
}

export const AiLaunchRoiSimulator: React.FC<AiLaunchRoiSimulatorProps> = ({
  campaignId,
  feedbackItems,
}) => {
  const { mutateAsync: simulateRoi, isPending } = useSimulateLaunchRoi();
  const [selectedResolvedIds, setSelectedResolvedIds] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<LaunchRoiSimulationResponse | null>(null);

  // Filter only actionable open/submitted bugs (up to 8 top defects)
  const openBugs = feedbackItems
    .filter((f) => f.feedback_type === 'bug_report' && f.status !== 'resolved')
    .slice(0, 8);

  const runSimulation = async (resolvedIds: string[]) => {
    try {
      const res = await simulateRoi({
        campaign_id: campaignId || null,
        simulated_resolved_ids: resolvedIds,
      });
      setSimulation(res);
    } catch {
      // Silently handle
    }
  };

  // Initial simulation
  useEffect(() => {
    runSimulation(selectedResolvedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, feedbackItems.length]);

  const toggleBugResolved = (id: string) => {
    const next = selectedResolvedIds.includes(id)
      ? selectedResolvedIds.filter((item) => item !== id)
      : [...selectedResolvedIds, id];
    setSelectedResolvedIds(next);
    runSimulation(next);
  };

  const handleSelectAllCritical = () => {
    const criticalIds = openBugs.filter((b) => b.severity === 'critical').map((b) => b.id);
    setSelectedResolvedIds(criticalIds);
    runSimulation(criticalIds);
  };

  const handleReset = () => {
    setSelectedResolvedIds([]);
    runSimulation([]);
  };

  if (openBugs.length === 0 && !simulation) {
    return null;
  }

  const baseScore = simulation?.baseline_readiness_score ?? 60;
  const simScore = simulation?.simulated_readiness_score ?? baseScore;
  const delta = simulation?.readiness_delta ?? 0;
  const protectedMrr = simulation?.protected_revenue_monthly ?? 0;
  const simChurn = simulation?.simulated_churn_rate_pct ?? 25;
  const churnReduction = simulation?.churn_reduction_pct ?? 0;

  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
            <Sliders className="h-6 w-6 text-amber-700" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#102A35]">
                Launch &amp; Revenue "What-If" Simulator
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                Predictive ROI
              </span>
            </div>
            <p className="text-xs text-[#52656B] max-w-2xl leading-relaxed">
              Check hypothetical defect hotfixes below to simulate real-time release readiness, protected MRR, and churn reduction.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSelectAllCritical}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#D7EFEB] hover:bg-[#BCE1DA] text-[#07545A] border border-[#BCE1DA] transition-all cursor-pointer"
          >
            Fix All Critical
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={selectedResolvedIds.length === 0}
            className="p-1.5 rounded-full hover:bg-[#EFEFE5] text-[#52656B] disabled:opacity-30 cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3 Live KPI Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Readiness Score */}
        <div className="p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52656B]">
              Simulated Readiness
            </span>
            <ShieldCheck className="h-4 w-4 text-[#07545A]" />
          </div>
          <div className="flex items-baseline space-x-2.5">
            <span className="text-2xl sm:text-3xl font-black text-[#102A35]">{simScore}/100</span>
            {delta > 0 && (
              <span className="inline-flex items-center text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="h-3 w-3 mr-0.5" />+{delta} pts
              </span>
            )}
          </div>
          <div className="w-full bg-[#E5ECE9] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                simScore >= 80 ? 'bg-emerald-500' : simScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${simScore}%` }}
            />
          </div>
        </div>

        {/* Protected MRR */}
        <div className="p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52656B]">
              Protected Monthly Revenue
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              +${protectedMrr.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-[#52656B]">/mo MRR</span>
          </div>
          <p className="text-[11px] text-[#52656B]">
            Remaining risk: ${simulation?.remaining_revenue_risk_monthly.toLocaleString() || '0'}/mo
          </p>
        </div>

        {/* Projected Churn Reduction */}
        <div className="p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52656B]">
              Projected Churn Rate
            </span>
            <Zap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-2.5">
            <span className="text-2xl sm:text-3xl font-black text-[#102A35]">{simChurn}%</span>
            {churnReduction > 0 && (
              <span className="inline-flex items-center text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                -{churnReduction}% drop
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#52656B]">
            Status: <span className="font-bold text-[#102A35]">{simulation?.verdict || 'Evaluating...'}</span>
          </p>
        </div>
      </div>

      {/* Strategic Advice Banner */}
      {simulation?.strategic_advice && (
        <div className="p-3.5 rounded-2xl bg-[#D7EFEB]/40 border border-[#BCE1DA] flex items-center space-x-2.5 text-xs text-[#07545A]">
          <Sparkles className="h-4 w-4 text-[#07545A] shrink-0" />
          <span className="font-medium">{simulation.strategic_advice}</span>
        </div>
      )}

      {/* Highest Leverage Next Fix Banner */}
      {simulation?.highest_leverage_next_fix && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Highest-Leverage Next Resolution:
            </span>
            <p className="text-xs font-bold text-[#102A35]">
              "{simulation.highest_leverage_next_fix.title}"
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-emerald-700 border border-emerald-200">
              +${simulation.highest_leverage_next_fix.marginal_mrr_protection.toLocaleString()}/mo MRR
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-blue-700 border border-blue-200">
              +{simulation.highest_leverage_next_fix.marginal_readiness_gain} pts
            </span>
          </div>
        </div>
      )}

      {/* Interactive Bug List */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-[#102A35]">
            Open Defects in Scope ({openBugs.length} items):
          </span>
          <span className="text-[11px] text-[#52656B]">
            {selectedResolvedIds.length} simulated as resolved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {openBugs.map((bug) => {
            const isResolvedInSim = selectedResolvedIds.includes(bug.id);
            return (
              <div
                key={bug.id}
                onClick={() => toggleBugResolved(bug.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isResolvedInSim
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                    : 'bg-[#FAF9F5] border-[#DCE7E3] hover:border-[#087C80]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="shrink-0 text-[#07545A]">
                    {isResolvedInSim ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-[#52656B]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isResolvedInSim ? 'line-through text-[#52656B]' : 'text-[#102A35]'
                      }`}
                    >
                      {bug.title}
                    </p>
                    <span className="text-[10px] text-[#52656B]">
                      Reported by {bug.tester_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      bug.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : bug.severity === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {bug.severity || 'medium'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#07545A]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Recalculating Launch Telemetry &amp; MRR...</span>
        </div>
      )}
    </div>
  );
};
