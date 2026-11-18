import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Zap,
  Smartphone,
  AlertTriangle,
  Bug,
  CheckCircle2,
} from 'lucide-react';
import { useSyntheticAudit } from '../../context/useFeedback';
import type { SyntheticAuditResponse, SyntheticPersonaFinding } from '../../api/feedback';

interface AiSyntheticPersonaAuditProps {
  campaignId: string;
  campaignTitle?: string;
}

export const AiSyntheticPersonaAudit: React.FC<AiSyntheticPersonaAuditProps> = ({
  campaignId,
  campaignTitle,
}) => {
  const { mutateAsync: runAudit, isPending } = useSyntheticAudit();
  const [auditData, setAuditData] = useState<SyntheticAuditResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('persona_novice');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setErrorMessage(null);
    try {
      const res = await runAudit(campaignId);
      setAuditData(res);
      setIsOpen(true);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setErrorMessage(errObj.response?.data?.detail || errObj.message || 'Failed to run synthetic audit.');
    }
  };

  const getPersonaIcon = (id: string) => {
    if (id === 'persona_novice') return <UserCheck className="h-5 w-5 text-blue-600" />;
    if (id === 'persona_power') return <Zap className="h-5 w-5 text-amber-600" />;
    return <Smartphone className="h-5 w-5 text-purple-600" />;
  };

  const activePersona: SyntheticPersonaFinding | undefined = auditData?.personas.find(
    (p) => p.persona_id === selectedPersonaId
  ) || auditData?.personas[0];

  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7E3]">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shrink-0 mt-0.5">
            <Users className="h-6 w-6 text-[#07545A]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#102A35]">
                Synthetic AI Pre-Flight Testing
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Frontier Simulation
              </span>
            </div>
            <p className="text-xs text-[#52656B] max-w-2xl leading-relaxed">
              Simulate 3 diverse human beta personas in 10 seconds before live testers begin testing {campaignTitle ? `"${campaignTitle}"` : 'your campaign'}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunAudit}
          disabled={isPending}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Simulating 3 Personas...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-[#7DE3DA]" />
              <span>{auditData ? 'Re-Run Synthetic Audit' : 'Run 10-Second Pre-Flight Audit'}</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Audit Results View */}
      {auditData && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Executive Readiness Banner */}
          <div className="rounded-2xl bg-[#FAF9F5] border border-[#DCE7E3] p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#102A35]">Synthetic Executive Verdict</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D7EFEB] text-[#07545A]">
                  {auditData.engine_used}
                </span>
              </div>
              <p className="text-xs text-[#52656B] leading-relaxed max-w-2xl">
                {auditData.executive_summary}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0 self-start md:self-auto">
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-[#52656B] block">Pre-Flight Readiness</span>
                <span className="text-2xl font-black text-[#07545A]">{auditData.readiness_score}/100</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-white border border-[#DCE7E3] hover:bg-[#EFEFE5] text-[#52656B] cursor-pointer"
                title="Toggle Persona Inspection"
              >
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Persona Tabs & Detail Card */}
          {isOpen && (
            <div className="space-y-4">
              {/* Persona Tab Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {auditData.personas.map((persona) => {
                  const isSelected = persona.persona_id === (activePersona?.persona_id || 'persona_novice');
                  return (
                    <button
                      key={persona.persona_id}
                      type="button"
                      onClick={() => setSelectedPersonaId(persona.persona_id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF9F5] border-[#087C80] shadow-sm'
                          : 'bg-white border-[#DCE7E3] hover:border-[#BCE1DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-white border border-[#DCE7E3] shadow-2xs">
                            {getPersonaIcon(persona.persona_id)}
                          </div>
                          <span className="text-xs font-bold text-[#102A35]">{persona.persona_name}</span>
                        </div>
                        <span className="text-xs font-black text-[#07545A]">{persona.overall_score}/100</span>
                      </div>
                      <p className="text-[11px] font-semibold text-[#52656B] truncate">{persona.persona_role}</p>
                      <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D7EFEB] text-[#07545A]">
                        {persona.verdict}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Persona Deep-Dive */}
              {activePersona && (
                <div className="rounded-2xl border border-[#DCE7E3] bg-[#FAF9F5] p-5 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE7E3]">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#102A35] flex items-center gap-1.5">
                        <span>Persona Archetype: {activePersona.persona_name}</span>
                        <span className="text-[11px] font-normal text-[#52656B]">({activePersona.persona_role})</span>
                      </h4>
                      <p className="text-[11px] text-[#52656B] mt-0.5">
                        <span className="font-semibold text-[#102A35]">Mindset:</span> {activePersona.mindset}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#07545A] text-white self-start sm:self-auto">
                      Score: {activePersona.overall_score}/100
                    </span>
                  </div>

                  {/* Observations */}
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[#52656B]">
                      Simulated Tester Observations:
                    </h5>
                    <ul className="space-y-1 text-xs text-[#102A35]">
                      {activePersona.key_observations.map((obs, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Simulated Bug Report */}
                  {activePersona.simulated_bug_report && (
                    <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bug className="h-4 w-4 text-rose-600" />
                          <span className="text-xs font-bold text-[#102A35]">
                            Simulated Flaw: {activePersona.simulated_bug_report.title}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                          {activePersona.simulated_bug_report.severity}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono bg-[#FAF9F5] p-2 rounded-lg border border-[#DCE7E3] whitespace-pre-wrap text-[#102A35]">
                        {activePersona.simulated_bug_report.steps}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-[#52656B] block">Expected:</span>
                          <span className="text-[#102A35]">{activePersona.simulated_bug_report.expected}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[#52656B] block">Observed:</span>
                          <span className="text-rose-700 font-medium">{activePersona.simulated_bug_report.actual}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[#52656B]">
                      Pre-Launch Recommendations:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {activePersona.actionable_recommendations.map((rec, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium text-[#07545A] bg-[#D7EFEB] border border-[#BCE1DA] px-2.5 py-1 rounded-lg"
                        >
                          &bull; {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

