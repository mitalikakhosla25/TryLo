import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import {
  evaluateFeedbackQuality,
  polishFeedbackReport,
  type FeedbackQualityEvaluationResponse,
  type FeedbackPolishResponse,
} from '../../api/feedback';

interface AiFeedbackQualityMeterProps {
  title: string;
  description: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  hasVideo: boolean;
  feedbackType: 'bug_report' | 'general_feedback';
  onApplyPolished: (polished: {
    title: string;
    description: string;
    reproductionSteps?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }) => void;
}

export const AiFeedbackQualityMeter: React.FC<AiFeedbackQualityMeterProps> = ({
  title,
  description,
  reproductionSteps,
  expectedBehavior,
  actualBehavior,
  hasVideo,
  feedbackType,
  onApplyPolished,
}) => {
  const [assessment, setAssessment] = useState<FeedbackQualityEvaluationResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Polisher States
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishPreview, setPolishPreview] = useState<FeedbackPolishResponse | null>(null);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Debounced real-time evaluation
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsEvaluating(true);
        const res = await evaluateFeedbackQuality({
          title,
          description,
          reproduction_steps: reproductionSteps,
          expected_behavior: expectedBehavior,
          actual_behavior: actualBehavior,
          has_video: hasVideo,
          feedback_type: feedbackType,
        });
        setAssessment(res);
      } catch (err) {
        // Silently ignore background eval errors
      } finally {
        setIsEvaluating(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, reproductionSteps, expectedBehavior, actualBehavior, hasVideo, feedbackType]);

  const handlePolish = async () => {
    if (!title.trim() && !description.trim()) return;
    setIsPolishing(true);
    setPolishError(null);
    try {
      const res = await polishFeedbackReport({
        title,
        description,
        reproduction_steps: reproductionSteps,
        expected_behavior: expectedBehavior,
        actual_behavior: actualBehavior,
        feedback_type: feedbackType,
      });
      setPolishPreview(res);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setPolishError(errorObj.message || 'Failed to auto-polish feedback draft.');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleApply = () => {
    if (!polishPreview) return;
    onApplyPolished({
      title: polishPreview.polished_title,
      description: polishPreview.polished_description,
      reproductionSteps: polishPreview.polished_reproduction_steps,
      expectedBehavior: polishPreview.polished_expected_behavior,
      actualBehavior: polishPreview.polished_actual_behavior,
      severity: polishPreview.suggested_severity,
    });
    setPolishPreview(null);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  const score = assessment?.score || 15;
  const tier = assessment?.quality_tier || 'needs_detail';

  const getTierColor = () => {
    if (tier === 'stellar') return { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (tier === 'good') return { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const colors = getTierColor();

  return (
    <div className="rounded-2xl border border-[#DCE7E3] bg-[#FAF9F5] p-4.5 space-y-3.5 shadow-xs">
      {/* Top Header & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[#07545A] text-[#7DE3DA]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold text-[#102A35]">AI Feedback Quality Meter</h4>
              {isEvaluating && <Loader2 className="h-3 w-3 animate-spin text-[#07545A]" />}
            </div>
            <p className="text-[11px] text-[#52656B]">
              Real-time scoring ensures founders get reproducible, actionable bug telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${colors.badge}`}>
            {assessment?.summary_label || 'Drafting...'} ({score}/100)
          </span>

          <button
            type="button"
            onClick={handlePolish}
            disabled={isPolishing || (!title.trim() && !description.trim())}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#07545A] to-[#087C80] hover:from-[#087C80] hover:to-[#0a9da2] text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            title="Auto-polish raw notes into clean, numbered reproduction steps"
          >
            {isPolishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-[#7DE3DA]" />
            )}
            <span>Enhance with AI</span>
          </button>
        </div>
      </div>

      {appliedNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">AI polished report applied successfully!</span>
        </div>
      )}

      {polishError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{polishError}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-[#E5ECE9] h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${colors.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Quick Tips */}
      {assessment?.tips && assessment.tips.length > 0 && (
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[#52656B] uppercase tracking-wider">Tips to level up:</span>
          {assessment.tips.map((tip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] font-medium text-[#102A35] bg-white px-2 py-0.5 rounded-md border border-[#DCE7E3]"
            >
              &bull; {tip}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible Checklist Toggle */}
      <div className="pt-1 border-t border-[#E5ECE9]/60">
        <button
          type="button"
          onClick={() => setShowChecklist(!showChecklist)}
          className="flex items-center space-x-1 text-[11px] font-semibold text-[#07545A] hover:underline cursor-pointer"
        >
          <span>{showChecklist ? 'Hide Quality Criteria Checklist' : 'Show Quality Criteria Checklist'}</span>
          {showChecklist ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showChecklist && assessment?.checklist && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in">
            {assessment.checklist.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 p-2 rounded-xl border text-[11px] ${
                  item.passed
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-white border-[#DCE7E3] text-[#52656B]'
                }`}
              >
                {item.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{item.criterion}</span>
                    <span className="text-[10px] font-semibold opacity-75">({item.points} pts)</span>
                  </div>
                  {!item.passed && <p className="text-[10px] text-[#52656B] mt-0.5">{item.hint}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Polish Preview Modal / Card */}
      {polishPreview && (
        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#087C80] shadow-md space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE7E3]">
            <div className="flex items-center space-x-2">
              <Wand2 className="h-4 w-4 text-[#07545A]" />
              <h5 className="text-xs font-extrabold text-[#102A35]">AI Polished Report Preview</h5>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D7EFEB] text-[#07545A]">
                {polishPreview.engine_used}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPolishPreview(null)}
              className="p-1 rounded-lg hover:bg-[#EFEFE5] text-[#52656B] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-extrabold text-[#52656B] uppercase tracking-wider block">Polished Title:</span>
              <p className="font-bold text-[#102A35]">{polishPreview.polished_title}</p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-[#52656B] uppercase tracking-wider block">Reproduction Steps:</span>
              <pre className="text-[11px] font-mono bg-[#FAF9F5] p-2 rounded-lg border border-[#DCE7E3] whitespace-pre-wrap text-[#102A35]">
                {polishPreview.polished_reproduction_steps}
              </pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-[#52656B] uppercase tracking-wider block">Expected:</span>
                <p className="text-[11px] text-[#52656B]">{polishPreview.polished_expected_behavior}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#52656B] uppercase tracking-wider block">Actual:</span>
                <p className="text-[11px] text-[#52656B]">{polishPreview.polished_actual_behavior}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[10px] font-extrabold text-[#52656B] uppercase tracking-wider">Suggested Severity:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                {polishPreview.suggested_severity}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#DCE7E3]">
            <button
              type="button"
              onClick={() => setPolishPreview(null)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#52656B] hover:bg-[#EFEFE5] cursor-pointer"
            >
              Keep My Current Draft
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#07545A] hover:bg-[#087C80] text-white shadow-xs cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 text-[#7DE3DA]" />
              <span>Apply Polished Report to Form</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
