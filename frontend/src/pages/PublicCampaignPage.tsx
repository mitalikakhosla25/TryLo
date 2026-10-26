import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  usePublicCampaignBySlug,
  usePublicCampaignById,
} from '../context/useCampaigns';
import {
  useApplicationStatus,
  useSubmitApplication,
} from '../context/useApplications';
import type { CampaignPublic } from '../api/campaigns';
import {
  Building,
  ExternalLink,
  Calendar,
  Gift,
  Coins,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Share2,
  ArrowLeft,
} from 'lucide-react';

export const PublicCampaignPage: React.FC = () => {
  const { user } = useAuth();
  const { startupSlug, campaignSlug, campaignId } = useParams<{
    startupSlug?: string;
    campaignSlug?: string;
    campaignId?: string;
  }>();

  // Query either by slug pair or by UUID
  const slugQuery = usePublicCampaignBySlug(startupSlug, campaignSlug);
  const idQuery = usePublicCampaignById(campaignId);

  const activeQuery = campaignId ? idQuery : slugQuery;
  const { data: campaign, isLoading, isError, error } = activeQuery;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="h-6 w-32 bg-[#EFEFE5] rounded-md animate-pulse"></div>
        <div className="h-44 bg-white rounded-3xl border border-[#DCE7E3] animate-pulse"></div>
        <div className="h-64 bg-white rounded-3xl border border-[#DCE7E3] animate-pulse"></div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-16 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center text-[#52656B]">
          <AlertCircle className="h-6 w-6 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-[#102A35]">Campaign Not Available</h2>
        <p className="text-xs sm:text-sm text-[#52656B]">
          {error?.message || 'This beta testing campaign is either closed, still in draft preparation, or does not exist.'}
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-1 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
          >
            <span>Explore TryLo Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between text-xs text-[#52656B]">
          <div className="flex items-center space-x-2">
            {user?.role === 'tester' ? (
              <Link
                to="/tester/discover"
                className="inline-flex items-center space-x-1 text-[#07545A] hover:text-[#087C80] font-semibold transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Discover</span>
              </Link>
            ) : (
              <Link to="/" className="hover:text-[#07545A] transition-colors">
                TryLo
              </Link>
            )}
            <span>/</span>
            <span className="text-[#102A35] font-medium">{campaign.startup_name}</span>
            <span>/</span>
            <span className="text-[#52656B] truncate max-w-[200px]">{campaign.title}</span>
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Public campaign link copied to clipboard!');
            }}
            className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#102A35] transition-colors cursor-pointer"
            title="Share Link"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* Main Campaign Hero Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#087C80] animate-pulse"></span>
                  <span>Active Beta Test</span>
                </span>
                {campaign.product_type && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                    {campaign.product_type}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                {campaign.title}
              </h1>

              {campaign.summary && (
                <p className="text-sm sm:text-base text-[#52656B] leading-relaxed font-normal">
                  {campaign.summary}
                </p>
              )}
            </div>

            {/* Reward Callout */}
            <div className="shrink-0">
              {campaign.reward_type === 'monetary' && (
                <div className="p-4 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] text-center space-y-0.5 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#07545A] block">
                    Reward
                  </span>
                  <span className="text-lg font-extrabold text-[#07545A] flex items-center justify-center space-x-1">
                    <Coins className="h-4 w-4" />
                    <span>{campaign.reward_currency || 'USD'} {campaign.reward_amount}</span>
                  </span>
                </div>
              )}
              {campaign.reward_type === 'perk' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">
                    Perk
                  </span>
                  <span className="text-xs font-bold text-amber-900 flex items-center justify-center space-x-1">
                    <Gift className="h-3.5 w-3.5 text-amber-600" />
                    <span>{campaign.reward_description || 'Exclusive Perk'}</span>
                  </span>
                </div>
              )}
              {campaign.reward_type === 'unpaid' && (
                <div className="p-4 rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] text-center">
                  <span className="text-[10px] uppercase font-semibold text-[#52656B] block">Category</span>
                  <span className="text-xs font-bold text-[#102A35]">Community Beta</span>
                </div>
              )}
            </div>
          </div>

          {/* Startup Byline */}
          <div className="flex items-center space-x-3 pt-4 border-t border-[#DCE7E3] text-xs relative z-10">
            <div className="h-9 w-9 rounded-xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#07545A] shrink-0">
              {campaign.startup_logo_url ? (
                <img
                  src={campaign.startup_logo_url}
                  alt={campaign.startup_name}
                  className="h-8 w-8 object-contain rounded-lg"
                />
              ) : (
                <Building className="h-4 w-4" />
              )}
            </div>
            <div>
              <span className="text-[#52656B] block text-[11px]">Presented by</span>
              <span className="font-bold text-[#102A35]">{campaign.startup_name}</span>
            </div>
            {campaign.product_url && (
              <a
                href={campaign.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center space-x-1 text-[#07545A] hover:text-[#087C80] font-semibold"
              >
                <span>Visit Product</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Description Section */}
        {campaign.description && (
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-xs font-semibold text-[#52656B] uppercase tracking-wider">
              About This Beta Test
            </h2>
            <p className="text-sm text-[#102A35] leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>
          </div>
        )}

        {/* Structured Tasks */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-[#DCE7E3] pb-4">
            <CheckCircle2 className="h-5 w-5 text-[#07545A]" />
            <h2 className="text-base font-bold text-[#102A35]">
              Testing Tasks ({campaign.testing_tasks?.length || 0})
            </h2>
          </div>

          {campaign.testing_tasks && campaign.testing_tasks.length > 0 ? (
            <div className="space-y-3">
              {campaign.testing_tasks.map((task, idx) => (
                <div
                  key={task.id || idx}
                  className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-start space-x-3.5"
                >
                  <span className="h-6 w-6 rounded-full bg-[#D7EFEB] text-[#07545A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold text-[#102A35]">{task.title}</span>
                      {task.is_required && (
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Required
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-[#52656B] leading-relaxed">{task.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#52656B] italic">No structured tasks listed.</p>
          )}
        </div>

        {/* Target Tester Criteria & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Audience */}
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[#102A35] font-bold text-sm border-b border-[#DCE7E3] pb-3">
              <ShieldCheck className="h-4 w-4 text-[#07545A]" />
              <span>Tester Criteria</span>
            </div>

            <div className="text-xs space-y-3 text-[#102A35]">
              <div>
                <span className="text-[#52656B] block">Experience Level:</span>
                <span className="font-semibold">
                  {campaign.target_audience?.experience_level || 'Any experience level'}
                </span>
              </div>

              <div>
                <span className="text-[#52656B] block">Supported Platforms:</span>
                <span>{campaign.target_audience?.devices?.join(', ') || 'Any platform'}</span>
              </div>

              {campaign.target_audience?.skills && campaign.target_audience.skills.length > 0 && (
                <div>
                  <span className="text-[#52656B] block">Desired Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {campaign.target_audience.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#EFEFE5] text-[#07545A] border border-[#DCE7E3]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {campaign.max_testers && (
                <div className="pt-2 border-t border-[#DCE7E3]">
                  <span className="text-[#52656B] block">Capacity:</span>
                  <span className="font-semibold">{campaign.max_testers} testers max</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Compensation */}
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[#102A35] font-bold text-sm border-b border-[#DCE7E3] pb-3">
              <Calendar className="h-4 w-4 text-[#07545A]" />
              <span>Timeline &amp; Terms</span>
            </div>

            <div className="text-xs space-y-3 text-[#102A35]">
              <div>
                <span className="text-[#52656B] block">Application Deadline:</span>
                <span className="font-semibold">
                  {campaign.application_deadline
                    ? new Date(campaign.application_deadline).toLocaleDateString()
                    : 'Open (No cutoff date)'}
                </span>
              </div>

              <div>
                <span className="text-[#52656B] block">Testing Period:</span>
                <span className="font-semibold">
                  {campaign.testing_start_date && campaign.testing_end_date
                    ? `${new Date(campaign.testing_start_date).toLocaleDateString()} — ${new Date(campaign.testing_end_date).toLocaleDateString()}`
                    : 'Flexible'}
                </span>
              </div>

              {campaign.reward_eligibility && (
                <div className="pt-2 border-t border-[#DCE7E3]">
                  <span className="text-[#52656B] block">Qualification Conditions:</span>
                  <p className="text-[#52656B] mt-1 leading-relaxed">{campaign.reward_eligibility}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tester Application Flow */}
        <TesterApplicationSection campaign={campaign} />
      </div>
    </div>
  );
};

interface TesterApplicationSectionProps {
  campaign: CampaignPublic;
}

const TesterApplicationSection: React.FC<TesterApplicationSectionProps> = ({ campaign }) => {
  const { user } = useAuth();
  const isFounder = user?.role === 'founder';
  const [now] = useState(() => Date.now());
  const isExpired = Boolean(
    campaign.application_deadline && new Date(campaign.application_deadline).getTime() < now
  );
  const isPublished = campaign.status === 'published';

  const { data: statusData, isLoading: isStatusLoading } = useApplicationStatus(campaign.id);
  const submitMutation = useSubmitApplication(campaign.id);

  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [motivation, setMotivation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const screeningQuestions = campaign.screening_questions || [];

  const handleAnswerChange = (qId: string, val: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate required questions
    for (const q of screeningQuestions) {
      if (q.is_required) {
        const ans = answers[q.id];
        if (ans === undefined || ans === null || (typeof ans === 'string' && !ans.trim())) {
          setFormError(`Please answer required question: "${q.prompt}"`);
          return;
        }
      }
    }

    try {
      await submitMutation.mutateAsync({
        screening_answers: answers,
        motivation: motivation.trim() || undefined,
      });
    } catch (err: unknown) {
      const eObj = err as { message?: string };
      setFormError(eObj?.message || 'Failed to submit application. Please check your answers and try again.');
    }
  };

  // 1. Visitor is unauthenticated
  if (!user) {
    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-8 sm:p-10 text-center space-y-4 shadow-sm">
        <h3 className="text-xl font-bold text-[#102A35]">Want to test this product?</h3>
        <p className="text-xs sm:text-sm text-[#52656B] max-w-md mx-auto leading-relaxed">
          Sign in or create a tester account to review requirements, answer screening questions, and submit your beta tester application.
        </p>
        <div className="pt-2">
          <Link
            to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors shadow-xs"
          >
            <span>Sign In to Apply</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Logged in user is a Founder
  if (isFounder) {
    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 text-center space-y-2 shadow-xs">
        <h3 className="text-sm font-bold text-[#102A35]">Viewing as Founder</h3>
        <p className="text-xs text-[#52656B] max-w-md mx-auto">
          Founder accounts cannot apply as testers. Switch to a registered tester account to submit applications and answers.
        </p>
      </div>
    );
  }

  // 3. Status loading
  if (isStatusLoading) {
    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-8 text-center animate-pulse shadow-xs">
        <div className="h-5 w-48 bg-[#EFEFE5] rounded-md mx-auto mb-3"></div>
        <div className="h-4 w-72 bg-[#EFEFE5]/60 rounded-md mx-auto"></div>
      </div>
    );
  }

  // 4. Tester has already applied
  if (statusData?.applied && statusData.application) {
    const app = statusData.application;
    const isPending = app.status === 'pending';
    const isAccepted = app.status === 'accepted';

    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE7E3] pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A35]">Application Submitted</h3>
              <p className="text-xs text-[#52656B]">
                Submitted on {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                isPending
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : isAccepted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              Status: {app.status}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
          {isPending &&
            'Your application has been received and is currently under review by the startup founder. You will be notified when your application is reviewed.'}
          {isAccepted &&
            'Congratulations! Your application has been accepted. Private product access instructions will be available in your workspace.'}
          {!isPending && !isAccepted &&
            'Thank you for your interest. The founder has concluded review for this cohort.'}
        </p>

        {app.motivation && (
          <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-xs text-[#102A35] space-y-1">
            <span className="font-semibold text-[#07545A] block text-[11px] uppercase">
              Your Motivation Statement:
            </span>
            <p className="italic">"{app.motivation}"</p>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-[#DCE7E3]">
          <Link
            to="/tester/applications"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#07545A] hover:text-[#087C80] transition-colors"
          >
            <span>View All My Applications &rarr;</span>
          </Link>
          <span className="text-[11px] text-[#52656B]">ID: {app.id.slice(0, 8)}...</span>
        </div>
      </div>
    );
  }

  // 5. Campaign unavailable for new applications
  if (!isPublished) {
    return (
      <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 text-center space-y-2 shadow-xs">
        <h3 className="text-sm font-bold text-[#102A35]">Applications Unavailable</h3>
        <p className="text-xs text-[#52656B] max-w-md mx-auto">
          This campaign is not currently published and cannot accept applications.
        </p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-center space-y-2 shadow-xs">
        <h3 className="text-sm font-bold text-rose-800">Application Deadline Passed</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          The application cutoff for this campaign expired on{' '}
          {new Date(campaign.application_deadline!).toLocaleDateString()}.
        </p>
      </div>
    );
  }

  // 6. Active Application Form for Authenticated Tester
  return (
    <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="border-b border-[#DCE7E3] pb-4">
        <h3 className="text-lg font-bold text-[#102A35]">Apply for this Beta Test</h3>
        <p className="text-xs text-[#52656B]">
          Answer the founder's screening questions and explain why you're a good fit for this testing cohort.
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Screening Questions List */}
        {screeningQuestions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[#102A35] uppercase tracking-wider">
              Screening Questions ({screeningQuestions.length})
            </h4>

            {screeningQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="text-xs sm:text-sm font-semibold text-[#102A35] flex items-center space-x-1.5">
                    <span className="text-[#07545A]">Q{idx + 1}.</span>
                    <span>{q.prompt}</span>
                    {q.is_required && <span className="text-rose-600 font-bold">*</span>}
                  </label>
                  <span className="text-[10px] text-[#52656B] font-medium">
                    {q.is_required ? 'Required' : 'Optional'}
                  </span>
                </div>

                {/* Text Type */}
                {q.question_type === 'text' && (
                  <textarea
                    rows={2}
                    value={(answers[q.id] as string) || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    maxLength={2000}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80]"
                  />
                )}

                {/* Single Choice Type */}
                {q.question_type === 'single_choice' && (
                  <div className="space-y-1.5 pt-1">
                    {(q.options || []).map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          answers[q.id] === opt
                            ? 'bg-[#D7EFEB] border-[#BCE1DA] text-[#07545A] font-semibold'
                            : 'bg-white border-[#DCE7E3] text-[#52656B] hover:text-[#102A35]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`sq-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleAnswerChange(q.id, opt)}
                          className="text-[#07545A] focus:ring-[#07545A]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Boolean / Yes-No Type */}
                {q.question_type === 'boolean' && (
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.id, true)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        answers[q.id] === true
                          ? 'bg-[#07545A] text-white border-[#07545A] shadow-xs'
                          : 'bg-white border-[#DCE7E3] text-[#52656B] hover:text-[#102A35]'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(q.id, false)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        answers[q.id] === false
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white border-[#DCE7E3] text-[#52656B] hover:text-[#102A35]'
                      }`}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Motivation field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
              Motivation Statement
            </label>
            <span className="text-[11px] text-[#52656B]">Optional &bull; Max 1000 chars</span>
          </div>
          <textarea
            rows={3}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Why do you want to participate in this test? (e.g. your relevant testing experience, device setup, or workflow excitement)"
            maxLength={1000}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] leading-relaxed"
          />
          <div className="text-right text-[11px] text-[#52656B]">
            {motivation.length} / 1000
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#DCE7E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-[#52656B]">
            By applying, you agree to submit constructive testing feedback and honor confidential testing terms.
          </p>

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] text-white hover:bg-[#087C80] disabled:opacity-50 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            {submitMutation.isPending ? (
              <span>Submitting Application...</span>
            ) : (
              <span>Submit Application</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
