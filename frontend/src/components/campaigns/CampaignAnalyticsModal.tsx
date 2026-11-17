import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Download,
  Printer,
  ShieldCheck,
  Users,
  Bug,
  Award,
  Coins,
  CheckCircle2,
  Smartphone,
  Monitor,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useCampaignAnalytics } from '../../context/useCampaigns';
import { downloadCampaignAuditCsv } from '../../api/campaigns';
import { DonutChart, BarVelocityChart } from '../ui/ChartWidgets';

interface CampaignAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string;
}

export const CampaignAnalyticsModal: React.FC<CampaignAnalyticsModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  campaignSlug,
}) => {
  const { data: analytics, isLoading, isError, error, refetch } = useCampaignAnalytics(campaignId);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCsv = async () => {
    try {
      setIsExporting(true);
      setExportNotice(null);
      await downloadCampaignAuditCsv(campaignId, campaignSlug);
      setExportNotice('Executive CSV audit summary downloaded successfully.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      setExportNotice('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#DCE7E3] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#DCE7E3] bg-[#F6F5ED]/50 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                <TrendingUp className="w-3.5 h-3.5 text-[#087C80]" />
                <span>Founder Intelligence Suite • Version 2</span>
              </span>

              {analytics?.dpiit_registered && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                  <ShieldCheck className="w-3 h-3 text-[#0E7C57]" />
                  <span>DPIIT / CIN: {analytics.cin_number || 'Verified'}</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-[#102A35] tracking-tight">
              {campaignTitle}
            </h2>
            <p className="text-xs text-[#52656B]">
              Real-time conversion telemetry, bug triage density, device matrices, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              disabled={isExporting || isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Download CSV Audit Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] shadow-2xs transition cursor-pointer"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#52656B]" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Export Notification Toast */}
        {exportNotice && (
          <div className="px-6 py-2 bg-[#E6F7F0] border-b border-[#B6EDD5] text-xs font-semibold text-[#0E7C57] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {isLoading && (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#07545A] border-t-transparent" />
              <p className="text-xs text-[#52656B] font-medium">Assembling live intelligence telemetry...</p>
            </div>
          )}

          {isError && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Unable to load campaign intelligence</span>
              </div>
              <p className="text-xs text-rose-700">{error?.message || 'Failed to fetch analytics.'}</p>
              <button
                onClick={() => refetch()}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-rose-800 border border-rose-300 hover:bg-rose-100 transition"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && analytics && (
            <>
              {/* Section 1: Hero KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#52656B]">
                    <span className="font-semibold">Tester Conversion</span>
                    <Users className="w-4 h-4 text-[#087C80]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#102A35]">
                    {analytics.funnel.applicants_accepted}
                    <span className="text-xs font-normal text-[#52656B] ml-1">/ {analytics.quota_target}</span>
                  </div>
                  <div className="text-[11px] text-[#0E7C57] font-semibold flex items-center gap-1">
                    <span>{analytics.funnel.acceptance_rate}% Acceptance Rate</span>
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#52656B]">
                    <span className="font-semibold">Bug Resolution</span>
                    <Bug className="w-4 h-4 text-[#087C80]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#102A35]">
                    {analytics.severity.resolution_rate}%
                  </div>
                  <div className="text-[11px] text-[#52656B] font-medium">
                    {analytics.severity.resolved_count} of {analytics.severity.total_bugs} issues resolved
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#52656B]">
                    <span className="font-semibold">Avg Tester ATS</span>
                    <Award className="w-4 h-4 text-[#087C80]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#07545A]">
                    {analytics.average_ats_score || 90}
                    <span className="text-xs font-normal text-[#52656B]"> / 100</span>
                  </div>
                  <div className="text-[11px] text-[#0E7C57] font-semibold">
                    LaTeX Verified Candidates
                  </div>
                </div>

                <div className="p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#52656B]">
                    <span className="font-semibold">Reward Capital</span>
                    <Coins className="w-4 h-4 text-[#087C80]" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#102A35]">
                    ₹{analytics.payout_disbursed.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#52656B] font-medium">
                    ₹{analytics.payout_pending.toLocaleString()} pending milestone approval
                  </div>
                </div>
              </div>

              {/* Section 2: Interactive Funnel Progression */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#DCE7E3] space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#102A35]">Applicant-to-Completion Conversion Funnel</h3>
                    <p className="text-xs text-[#52656B]">Progression of vetted candidates from application to verified test proof.</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                    {analytics.funnel.completion_rate}% Final Velocity
                  </span>
                </div>

                {/* Funnel Stage Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                    <div className="text-xs text-[#52656B] font-semibold">1. Applied</div>
                    <div className="text-lg font-extrabold text-[#102A35]">{analytics.funnel.applicants_total}</div>
                    <div className="w-full bg-[#DCE7E3] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#07545A] h-full w-full" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                    <div className="text-xs text-[#52656B] font-semibold">2. Accepted</div>
                    <div className="text-lg font-extrabold text-[#07545A]">{analytics.funnel.applicants_accepted}</div>
                    <div className="w-full bg-[#DCE7E3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#087C80] h-full"
                        style={{ width: `${Math.min(100, analytics.funnel.acceptance_rate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                    <div className="text-xs text-[#52656B] font-semibold">3. In Progress</div>
                    <div className="text-lg font-extrabold text-[#D97706]">{analytics.funnel.testers_in_progress}</div>
                    <div className="w-full bg-[#DCE7E3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D97706] h-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (analytics.funnel.testers_in_progress / (analytics.funnel.applicants_accepted || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-1">
                    <div className="text-xs text-[#52656B] font-semibold">4. Completed Proof</div>
                    <div className="text-lg font-extrabold text-[#0E7C57]">{analytics.funnel.testers_completed}</div>
                    <div className="w-full bg-[#DCE7E3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0E7C57] h-full"
                        style={{ width: `${Math.min(100, analytics.funnel.completion_rate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 & 4: Bug Severity Matrix & Hardware Coverage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bug Severity Distribution */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#DCE7E3] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#102A35]">Vulnerability & Bug Severity</h3>
                      <p className="text-xs text-[#52656B]">Triaged severity breakdown reported by testers.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#52656B]">
                      Total: {analytics.severity.total_bugs}
                    </span>
                  </div>

                  {/* SVG Donut Chart */}
                  <div className="py-2">
                    <DonutChart
                      data={[
                        { label: 'Critical', value: analytics.severity.critical, color: '#DC2626' },
                        { label: 'High', value: analytics.severity.high, color: '#D97706' },
                        { label: 'Medium', value: analytics.severity.medium, color: '#0284C7' },
                        { label: 'Low', value: analytics.severity.low, color: '#0D9488' },
                      ]}
                      centerLabel="Bugs"
                      centerValue={String(analytics.severity.total_bugs)}
                      size={150}
                      strokeWidth={20}
                    />
                  </div>

                  {/* Segmented Color Bar */}
                  <div className="w-full h-2.5 rounded-full bg-[#DCE7E3] overflow-hidden flex">
                    <div
                      className="bg-rose-600 h-full transition-all"
                      style={{
                        width: `${(analytics.severity.critical / (analytics.severity.total_bugs || 1)) * 100}%`,
                      }}
                      title={`Critical: ${analytics.severity.critical}`}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{
                        width: `${(analytics.severity.high / (analytics.severity.total_bugs || 1)) * 100}%`,
                      }}
                      title={`High: ${analytics.severity.high}`}
                    />
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{
                        width: `${(analytics.severity.medium / (analytics.severity.total_bugs || 1)) * 100}%`,
                      }}
                      title={`Medium: ${analytics.severity.medium}`}
                    />
                    <div
                      className="bg-teal-500 h-full transition-all"
                      style={{
                        width: `${(analytics.severity.low / (analytics.severity.total_bugs || 1)) * 100}%`,
                      }}
                      title={`Low: ${analytics.severity.low}`}
                    />
                  </div>

                  {/* Severity Labels */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                      <div className="font-bold text-rose-700">Critical</div>
                      <div className="text-lg font-black text-rose-800">{analytics.severity.critical}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="font-bold text-amber-700">High</div>
                      <div className="text-lg font-black text-amber-800">{analytics.severity.high}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-50 border border-sky-200">
                      <div className="font-bold text-sky-700">Medium</div>
                      <div className="text-lg font-black text-sky-800">{analytics.severity.medium}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-teal-50 border border-teal-200">
                      <div className="font-bold text-teal-700">Low</div>
                      <div className="text-lg font-black text-teal-800">{analytics.severity.low}</div>
                    </div>
                  </div>
                </div>

                {/* Device & Environment Coverage */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#DCE7E3] space-y-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-[#102A35]">Hardware & Operating System Coverage</h3>
                    <p className="text-xs text-[#52656B]">Diagnostics captured across tester runtimes.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#52656B]">
                        <span className="flex items-center gap-1.5 text-[#102A35]">
                          <Monitor className="w-3.5 h-3.5 text-[#087C80]" />
                          <span>Operating Systems</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analytics.os_matrix.map((os, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F6F5ED] border border-[#DCE7E3] text-[#102A35]"
                          >
                            <span>{os.name}</span>
                            <span className="text-[#087C80] font-bold">({os.percentage}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#DCE7E3]">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#52656B]">
                        <span className="flex items-center gap-1.5 text-[#102A35]">
                          <Smartphone className="w-3.5 h-3.5 text-[#087C80]" />
                          <span>Browsers & Web Runtimes</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analytics.browser_matrix.map((b, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F6F5ED] border border-[#DCE7E3] text-[#102A35]"
                          >
                            <span>{b.name}</span>
                            <span className="text-[#087C80] font-bold">({b.percentage}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Task Completion Velocity */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#DCE7E3] space-y-4 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#102A35]">Task Execution Velocity</h3>
                  <p className="text-xs text-[#52656B]">Milestone completion rates across all assigned beta testers.</p>
                </div>

                {analytics.task_velocity.length === 0 ? (
                  <p className="text-xs text-[#52656B] italic">No structured tasks assigned yet.</p>
                ) : (
                  <>
                    {/* Visual Bar Velocity Chart */}
                    <div className="pb-2">
                      <BarVelocityChart
                        data={analytics.task_velocity.map((t) => ({
                          label: t.title.length > 15 ? t.title.slice(0, 15) + '…' : t.title,
                          value: t.completion_percentage,
                          sublabel: `${t.completed_count} done`,
                          color: '#087C80',
                        }))}
                        valuePrefix="%"
                        height={130}
                      />
                    </div>

                    <div className="space-y-3">
                      {analytics.task_velocity.map((t) => (
                        <div
                          key={t.task_id}
                          className="p-3 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#102A35] flex items-center gap-2">
                              <span>{t.title}</span>
                              {t.is_required && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#52656B]">
                              {t.completed_count} completed • {t.in_progress_count} in progress
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-28 sm:w-36 bg-[#DCE7E3] h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#07545A] h-full transition-all"
                                style={{ width: `${Math.min(100, t.completion_percentage)}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-[#07545A] w-12 text-right">
                              {t.completion_percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#DCE7E3] bg-[#F6F5ED]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-[#52656B]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#087C80]" />
            <span>TryLo High-Assurance QA Telemetry Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full font-semibold bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#EFEFE5] transition cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
