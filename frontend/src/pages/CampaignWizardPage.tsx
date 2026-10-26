import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMyStartups } from '../context/useStartups';
import {
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  usePublishCampaign,
} from '../context/useCampaigns';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Lock,
  Plus,
  Trash2,
  Gift,
  Coins,
  AlertCircle,
  Send,
  Save,
  HelpCircle,
} from 'lucide-react';
import type {
  Campaign,
  CampaignCreatePayload,
  CampaignUpdatePayload,
  TestingTask,
  TargetAudience,
  RewardType,
  ScreeningQuestion,
} from '../api/campaigns';
import type { Startup } from '../api/startups';

const PRODUCT_TYPES = [
  'Web App',
  'iOS App',
  'Android App',
  'Desktop App',
  'API / Developer Tool',
  'Other',
];

const DEVICE_OPTIONS = ['Web Browser', 'Mac', 'Windows', 'Linux', 'iOS', 'Android'];

const COMMON_SKILLS = [
  'UI/UX Feedback',
  'QA Testing',
  'Performance Testing',
  'Security Audit',
  'Python',
  'JavaScript/TypeScript',
  'Mobile App Testing',
  'API Testing',
];

const COMMON_INTERESTS = [
  'AI / Machine Learning',
  'Developer Tools',
  'Fintech',
  'Productivity',
  'E-commerce',
  'Health & Fitness',
  'Social',
];

interface CampaignWizardFormProps {
  initialCampaign?: Campaign;
  routeStartupId?: string;
  myStartups: Startup[];
}

const CampaignWizardForm: React.FC<CampaignWizardFormProps> = ({
  initialCampaign,
  routeStartupId,
  myStartups,
}) => {
  const navigate = useNavigate();
  const isEditing = !!initialCampaign;
  const campaignId = initialCampaign?.id;

  // Selected startup state
  const [selectedStartupId, setSelectedStartupId] = useState<string>(
    () => routeStartupId || initialCampaign?.startup_id || myStartups[0]?.id || ''
  );

  // Step 1: Overview
  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState(initialCampaign?.title || '');
  const [summary, setSummary] = useState(initialCampaign?.summary || '');
  const [description, setDescription] = useState(initialCampaign?.description || '');
  const [productType, setProductType] = useState(initialCampaign?.product_type || 'Web App');
  const [productUrl, setProductUrl] = useState(initialCampaign?.product_url || '');
  const [accessInstructions, setAccessInstructions] = useState(
    initialCampaign?.access_instructions || ''
  );

  // Step 2: Testing tasks
  const [tasks, setTasks] = useState<TestingTask[]>(() =>
    initialCampaign?.testing_tasks && initialCampaign.testing_tasks.length > 0
      ? initialCampaign.testing_tasks
      : [
          {
            id: 'task-1',
            title: 'Initial onboarding and exploration',
            description: 'Sign up and explore core workflow. Record any friction or confusing UI.',
            is_required: true,
            order: 1,
          },
        ]
  );
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  // Step 2: Screening Questions
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>(
    () => initialCampaign?.screening_questions || []
  );
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'single_choice' | 'boolean'>('text');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);
  const [newQuestionOptions, setNewQuestionOptions] = useState('');

  // Step 3: Target audience
  const [skills, setSkills] = useState<string[]>(initialCampaign?.target_audience?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [interests, setInterests] = useState<string[]>(
    initialCampaign?.target_audience?.interests || []
  );
  const [customInterest, setCustomInterest] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>(
    initialCampaign?.target_audience?.experience_level || 'Intermediate'
  );
  const [selectedDevices, setSelectedDevices] = useState<string[]>(
    initialCampaign?.target_audience?.devices || ['Web Browser']
  );
  const [countryInput, setCountryInput] = useState('');
  const [countries, setCountries] = useState<string[]>(
    initialCampaign?.target_audience?.countries || []
  );
  const [audienceNotes, setAudienceNotes] = useState(
    initialCampaign?.target_audience?.notes || ''
  );

  // Step 4: Schedule and reward
  const [applicationDeadline, setApplicationDeadline] = useState(
    initialCampaign?.application_deadline ? initialCampaign.application_deadline.slice(0, 16) : ''
  );
  const [testingStartDate, setTestingStartDate] = useState(
    initialCampaign?.testing_start_date ? initialCampaign.testing_start_date.slice(0, 16) : ''
  );
  const [testingEndDate, setTestingEndDate] = useState(
    initialCampaign?.testing_end_date ? initialCampaign.testing_end_date.slice(0, 16) : ''
  );
  const [maxTesters, setMaxTesters] = useState<string>(
    initialCampaign?.max_testers ? String(initialCampaign.max_testers) : '20'
  );
  const [rewardType, setRewardType] = useState<RewardType>(
    (initialCampaign?.reward_type as RewardType) || 'unpaid'
  );
  const [rewardAmount, setRewardAmount] = useState<string>(
    initialCampaign?.reward_amount !== null && initialCampaign?.reward_amount !== undefined
      ? String(initialCampaign.reward_amount)
      : '25'
  );
  const [rewardCurrency, setRewardCurrency] = useState(
    initialCampaign?.reward_currency || 'USD'
  );
  const [rewardDescription, setRewardDescription] = useState(
    initialCampaign?.reward_description || ''
  );
  const [rewardEligibility, setRewardEligibility] = useState(
    initialCampaign?.reward_eligibility || ''
  );

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Mutations
  const createMutation = useCreateCampaign(selectedStartupId || undefined);
  const updateMutation = useUpdateCampaign(campaignId || undefined);
  const publishMutation = usePublishCampaign(campaignId || undefined);

  const selectedStartup = myStartups.find((s) => s.id === selectedStartupId);

  // Helpers for tasks
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: TestingTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || null,
      is_required: true,
      order: tasks.length + 1,
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleRemoveTask = (index: number) => {
    const updated = tasks.filter((_, idx) => idx !== index);
    setTasks(updated.map((t, idx) => ({ ...t, order: idx + 1 })));
  };

  const handleToggleTaskRequired = (index: number) => {
    setTasks(
      tasks.map((t, idx) => (idx === index ? { ...t, is_required: !t.is_required } : t))
    );
  };

  // Screening question handlers
  const handleAddScreeningQuestion = () => {
    if (!newQuestionPrompt.trim()) return;
    if (screeningQuestions.length >= 10) {
      setErrorMsg('A maximum of 10 screening questions are allowed per campaign.');
      return;
    }

    let parsedOptions: string[] = [];
    if (newQuestionType === 'single_choice') {
      parsedOptions = newQuestionOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (parsedOptions.length < 2) {
        setErrorMsg('Single choice questions require at least two comma-separated options.');
        return;
      }
    }

    const q: ScreeningQuestion = {
      id: `sq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      prompt: newQuestionPrompt.trim(),
      question_type: newQuestionType,
      is_required: newQuestionRequired,
      options: parsedOptions,
    };

    setScreeningQuestions([...screeningQuestions, q]);
    setNewQuestionPrompt('');
    setNewQuestionOptions('');
    setNewQuestionType('text');
    setNewQuestionRequired(true);
  };

  const handleRemoveScreeningQuestion = (id: string) => {
    setScreeningQuestions(screeningQuestions.filter((q) => q.id !== id));
  };

  const handleToggleQuestionRequired = (id: string) => {
    setScreeningQuestions(
      screeningQuestions.map((q) =>
        q.id === id ? { ...q, is_required: !q.is_required } : q
      )
    );
  };

  // Helpers for audience
  const handleToggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkill('');
    }
  };

  const handleToggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setCustomInterest('');
    }
  };

  const handleToggleDevice = (device: string) => {
    setSelectedDevices((prev) =>
      prev.includes(device) ? prev.filter((d) => d !== device) : [...prev, device]
    );
  };

  const handleAddCountry = () => {
    const trimmed = countryInput.trim();
    if (trimmed && !countries.includes(trimmed)) {
      setCountries([...countries, trimmed]);
      setCountryInput('');
    }
  };

  const handleRemoveCountry = (country: string) => {
    setCountries(countries.filter((c) => c !== country));
  };

  // Build API payload
  const buildPayload = (): CampaignCreatePayload => {
    const targetAudience: TargetAudience = {
      skills,
      interests,
      experience_level: experienceLevel,
      devices: selectedDevices,
      countries,
      notes: audienceNotes.trim() || null,
    };

    const parsedMaxTesters = maxTesters ? parseInt(maxTesters, 10) : null;
    const parsedRewardAmount =
      rewardType === 'monetary' && rewardAmount ? parseFloat(rewardAmount) : null;

    return {
      title: title.trim(),
      summary: summary.trim() || null,
      description: description.trim() || null,
      product_type: productType || null,
      product_url: productUrl.trim() || null,
      access_instructions: accessInstructions.trim() || null,
      testing_tasks: tasks,
      target_audience: targetAudience,
      screening_questions: screeningQuestions,
      max_testers: parsedMaxTesters && parsedMaxTesters > 0 ? parsedMaxTesters : null,
      application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
      testing_start_date: testingStartDate ? new Date(testingStartDate).toISOString() : null,
      testing_end_date: testingEndDate ? new Date(testingEndDate).toISOString() : null,
      reward_type: rewardType,
      reward_amount: parsedRewardAmount,
      reward_currency: rewardType === 'monetary' ? rewardCurrency.toUpperCase() : null,
      reward_description: rewardType === 'perk' ? rewardDescription.trim() || null : null,
      reward_eligibility: rewardEligibility.trim() || null,
    };
  };

  // Save Draft (or Save Changes)
  const handleSaveDraft = async () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg('Please enter a campaign title before saving.');
      setStep(1);
      return;
    }
    if (!selectedStartupId) {
      setErrorMsg('Please select a startup for this campaign.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEditing && campaignId) {
        await updateMutation.mutateAsync(payload as CampaignUpdatePayload);
        navigate(`/founder/campaigns/${campaignId}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        navigate(`/founder/campaigns/${created.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save campaign.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish from Review step
  const handlePublishFromWizard = async () => {
    setErrorMsg(null);
    if (!title.trim() || title.length < 3) {
      setErrorMsg('Campaign title must be at least 3 characters.');
      setStep(1);
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('A brief campaign summary is required to publish.');
      setStep(1);
      return;
    }
    if (!description.trim() || description.length < 10) {
      setErrorMsg('A detailed description (at least 10 characters) is required to publish.');
      setStep(1);
      return;
    }
    if (!accessInstructions.trim() || accessInstructions.length < 10) {
      setErrorMsg(
        'Clear access instructions (at least 10 characters) are required so testers can test your product.'
      );
      setStep(2);
      return;
    }
    if (tasks.length === 0) {
      setErrorMsg('At least one testing task is required to publish.');
      setStep(2);
      return;
    }

    if (
      !window.confirm(
        `Are you ready to publish "${title}"? This campaign will be immediately visible for beta tester applications.`
      )
    ) {
      return;
    }

    setIsPublishing(true);
    try {
      const payload = buildPayload();
      let targetId = campaignId;

      // 1. First save all latest draft changes
      if (isEditing && targetId) {
        await updateMutation.mutateAsync(payload as CampaignUpdatePayload);
      } else {
        const created = await createMutation.mutateAsync(payload);
        targetId = created.id;
      }

      // 2. Publish campaign
      if (targetId) {
        await publishMutation.mutateAsync();
        navigate(`/founder/campaigns/${targetId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish campaign.';
      setErrorMsg(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#DCE7E3]">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs text-[#52656B]">
              <Link
                to={
                  selectedStartupId
                    ? `/founder/startups/${selectedStartupId}/campaigns`
                    : '/founder/startups'
                }
                className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Campaigns</span>
              </Link>
              <span>/</span>
              <span className="text-[#102A35] font-semibold">
                {isEditing ? `Edit Campaign: ${title || 'Campaign'}` : 'New Campaign Wizard'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
              {isEditing ? 'Edit Beta Campaign' : 'Create Beta Testing Campaign'}
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B]">
              {isEditing
                ? 'Update your testing goals, task instructions, or criteria.'
                : 'Follow the 5-step wizard to configure your product testing campaign and save your draft.'}
            </p>
          </div>

          {/* Quick Save Draft button always visible */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5 text-[#087C80]" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Draft'}</span>
            </button>
          </div>
        </div>

        {/* Editing Published Warning */}
        {isEditing && initialCampaign?.status === 'published' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Live Published Campaign</p>
              <p className="text-xs text-amber-800 mt-0.5">
                This campaign is currently public. Saving changes will immediately update the live
                public details. Publication date (
                <span className="font-mono font-semibold">
                  {initialCampaign.published_at
                    ? new Date(initialCampaign.published_at).toLocaleDateString()
                    : ''}
                </span>
                ) will be preserved.
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Validation Notice</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-700 hover:text-rose-900 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Wizard Step Progress Bar */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-4 shadow-xs">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'Overview' },
              { num: 2, label: 'Tasks & Access' },
              { num: 3, label: 'Audience' },
              { num: 4, label: 'Reward & Dates' },
              { num: 5, label: 'Review & Save' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`p-2 rounded-2xl transition-all flex flex-col items-center justify-center space-y-1 ${
                  step === s.num
                    ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                    : step > s.num
                    ? 'text-[#0E7C57] hover:bg-[#F6F5ED]'
                    : 'text-[#52656B] hover:bg-[#F6F5ED]'
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step === s.num
                      ? 'bg-[#087C80] text-white shadow-xs'
                      : step > s.num
                      ? 'bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]'
                      : 'bg-[#EFEFE5] text-[#52656B]'
                  }`}
                >
                  {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className="truncate max-w-full text-[11px] sm:text-xs">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-8 space-y-6 shadow-sm">
          {/* STEP 1: Overview */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#DCE7E3] pb-3">
                <h2 className="text-lg font-bold text-[#102A35]">Step 1 — Product &amp; Campaign Overview</h2>
                <p className="text-xs text-[#52656B]">
                  Identify your product and state the primary objective for this beta test.
                </p>
              </div>

              {/* Select Startup */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Associated Startup <span className="text-rose-500">*</span>
                </label>
                {myStartups && myStartups.length > 0 ? (
                  <select
                    value={selectedStartupId}
                    onChange={(e) => setSelectedStartupId(e.target.value)}
                    disabled={isEditing}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 disabled:opacity-60"
                  >
                    {myStartups.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-600">
                    You need to create a startup profile first before launching campaigns.
                  </p>
                )}
              </div>

              {/* Campaign Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Campaign Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next-Gen Mobile Checkout Beta Test"
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                />
                <p className="text-[11px] text-[#52656B]">
                  A public URL slug will be generated automatically from this title.
                </p>
              </div>

              {/* Short Summary */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Short Summary
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Help us test frictionless 1-click checkout flows before public launch."
                  maxLength={255}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                />
                <p className="text-[11px] text-[#52656B]">
                  Shown on campaign discovery cards (max 255 chars).
                </p>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Product &amp; Testing Overview
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your product, what you've recently built, and what specific feedback or bug reports you are looking for..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 leading-relaxed"
                />
              </div>

              {/* Product Type & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                    Product Category / Platform
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                  >
                    {PRODUCT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                    Public Product URL
                  </label>
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://trylo.com/demo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Testing Tasks & Access */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#DCE7E3] pb-3">
                <h2 className="text-lg font-bold text-[#102A35]">
                  Step 2 — Testing Tasks &amp; Access Instructions
                </h2>
                <p className="text-xs text-[#52656B]">
                  Define the structured action items testers will execute, plus private onboarding
                  instructions.
                </p>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                    Testing Tasks ({tasks.length})
                  </label>
                  <span className="text-[11px] text-[#52656B]">Max 20 tasks</span>
                </div>

                {tasks.map((task, idx) => (
                  <div
                    key={task.id || idx}
                    className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-[#D7EFEB] text-[#07545A] text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#102A35]">{task.title}</span>
                        {task.is_required && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Required
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-[#52656B] pl-7">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskRequired(idx)}
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                          task.is_required
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                        }`}
                      >
                        {task.is_required ? 'Required' : 'Optional'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="p-1 rounded text-[#52656B] hover:text-rose-600 transition-colors"
                        title="Remove Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Task Form */}
                <div className="p-4.5 rounded-2xl bg-white border border-dashed border-[#DCE7E3] space-y-3">
                  <h3 className="text-xs font-semibold text-[#102A35]">Add a New Testing Task</h3>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title (e.g. Try sign-up with Google OAuth)"
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                  />
                  <input
                    type="text"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Instructions or expected outcome (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Optional Screening Questions */}
              <div className="space-y-3 pt-3 border-t border-[#DCE7E3]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-[#102A35] uppercase tracking-wider flex items-center space-x-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-[#087C80]" />
                      <span>Screening Questions ({screeningQuestions.length})</span>
                    </label>
                    <p className="text-[11px] text-[#52656B] mt-0.5">
                      Ask applicants specific questions before selecting them. Max 10 questions.
                    </p>
                  </div>
                  <span className="text-[11px] text-[#52656B]">Optional</span>
                </div>

                {screeningQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-[#D7EFEB] text-[#07545A] text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#102A35]">{q.prompt}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFEFE5] text-[#102A35] border border-[#DCE7E3]">
                          {q.question_type === 'text'
                            ? 'Short Text'
                            : q.question_type === 'single_choice'
                            ? 'Single Choice'
                            : 'Yes / No'}
                        </span>
                        {q.is_required && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Required
                          </span>
                        )}
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="text-xs text-[#52656B] pl-7 flex flex-wrap gap-1 mt-1">
                          <span className="text-[#52656B] text-[11px]">Options:</span>
                          {q.options.map((opt) => (
                            <span
                              key={opt}
                              className="px-2 py-0.5 rounded-md bg-white border border-[#DCE7E3] text-[#102A35] text-[11px]"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionRequired(q.id)}
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                          q.is_required
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-white text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                        }`}
                      >
                        {q.is_required ? 'Required' : 'Optional'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreeningQuestion(q.id)}
                        className="p-1 rounded text-[#52656B] hover:text-rose-600 transition-colors"
                        title="Remove Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Screening Question Form */}
                {screeningQuestions.length < 10 && (
                  <div className="p-4.5 rounded-2xl bg-white border border-dashed border-[#DCE7E3] space-y-3">
                    <h3 className="text-xs font-semibold text-[#102A35]">Add a Screening Question</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={newQuestionPrompt}
                          onChange={(e) => setNewQuestionPrompt(e.target.value)}
                          placeholder="e.g. Do you have an iPhone with iOS 17 installed?"
                          maxLength={250}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                        />
                      </div>
                      <div>
                        <select
                          value={newQuestionType}
                          onChange={(e) => setNewQuestionType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                        >
                          <option value="text">Short Text</option>
                          <option value="single_choice">Single Choice</option>
                          <option value="boolean">Yes / No</option>
                        </select>
                      </div>
                    </div>

                    {newQuestionType === 'single_choice' && (
                      <input
                        type="text"
                        value={newQuestionOptions}
                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                        placeholder="Comma-separated choices (e.g. Daily, 2-3 times a week, Rarely)"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-xs text-[#102A35] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newQuestionRequired}
                          onChange={(e) => setNewQuestionRequired(e.target.checked)}
                          className="rounded border-[#DCE7E3] text-[#087C80] focus:ring-[#087C80]"
                        />
                        <span>Require tester to answer this question</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddScreeningQuestion}
                        disabled={!newQuestionPrompt.trim()}
                        className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Access Instructions with Security Boundary Notice */}
              <div className="space-y-2 pt-3 border-t border-[#DCE7E3]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#102A35] uppercase tracking-wider flex items-center space-x-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>Private Access Instructions</span>
                  </label>
                  <span className="text-[11px] text-[#07545A] font-medium bg-[#D7EFEB] px-2 py-0.5 rounded-full border border-[#BCE1DA]">
                    Protected Boundary
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] text-xs text-[#0E7C57] leading-relaxed">
                  <span className="font-bold text-[#102A35]">Confidentiality Guarantee:</span>{' '}
                  These instructions are <span className="underline font-semibold">never rendered</span> on public
                  campaign pages. They are strictly kept private and revealed only to testers whom you accept.
                </div>

                <textarea
                  value={accessInstructions}
                  onChange={(e) => setAccessInstructions(e.target.value)}
                  rows={3}
                  placeholder="Include TestFlight link, staging credentials, invite tokens, or private APK links required to test..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Target Tester Criteria */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#DCE7E3] pb-3">
                <h2 className="text-lg font-bold text-[#102A35]">Step 3 — Target Tester Criteria</h2>
                <p className="text-xs text-[#52656B]">
                  Specify who you want to invite based on skills, interests, devices, and experience level.
                </p>
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Preferred Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        experienceLevel === lvl
                          ? 'bg-[#087C80] text-white border-[#087C80] shadow-xs'
                          : 'bg-[#F6F5ED] text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Devices */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Target Devices &amp; Operating Systems
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEVICE_OPTIONS.map((dev) => (
                    <button
                      key={dev}
                      type="button"
                      onClick={() => handleToggleDevice(dev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedDevices.includes(dev)
                          ? 'bg-[#07545A] text-white border-[#07545A] font-semibold'
                          : 'bg-[#F6F5ED] text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                      }`}
                    >
                      {selectedDevices.includes(dev) ? '✓ ' : '+ '}
                      {dev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Required / Desired Skills
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => handleToggleSkill(sk)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                        skills.includes(sk)
                          ? 'bg-[#087C80] text-white border-[#087C80] font-semibold'
                          : 'bg-[#F6F5ED] text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                      }`}
                    >
                      {skills.includes(sk) ? '✓ ' : '+ '}
                      {sk}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add custom skill..."
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3.5 py-1.5 rounded-xl bg-[#EFEFE5] hover:bg-[#DCE7E3] text-xs text-[#102A35] font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Product Interests */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Tester Product Interests
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_INTERESTS.map((int) => (
                    <button
                      key={int}
                      type="button"
                      onClick={() => handleToggleInterest(int)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                        interests.includes(int)
                          ? 'bg-[#07545A] text-white border-[#07545A] font-semibold'
                          : 'bg-[#F6F5ED] text-[#52656B] border-[#DCE7E3] hover:text-[#102A35]'
                      }`}
                    >
                      {interests.includes(int) ? '✓ ' : '+ '}
                      {int}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add custom interest..."
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomInterest}
                    className="px-3.5 py-1.5 rounded-xl bg-[#EFEFE5] hover:bg-[#DCE7E3] text-xs text-[#102A35] font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Countries / Geography */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Geographic Focus (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {countries.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] font-semibold"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCountry(c)}
                        className="text-[#07545A] hover:text-rose-600 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    placeholder="e.g. India, United States, Germany"
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCountry}
                    className="px-3.5 py-1.5 rounded-xl bg-[#EFEFE5] hover:bg-[#DCE7E3] text-xs text-[#102A35] font-semibold"
                  >
                    Add Country
                  </button>
                </div>
              </div>

              {/* Audience Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Additional Screening Notes
                </label>
                <textarea
                  value={audienceNotes}
                  onChange={(e) => setAudienceNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special hardware requirements, prior domain experience, or screening criteria..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Schedule and Reward */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#DCE7E3] pb-3">
                <h2 className="text-lg font-bold text-[#102A35]">
                  Step 4 — Schedule &amp; Reward Configuration
                </h2>
                <p className="text-xs text-[#52656B]">
                  Set tester limits, testing timeline, and compensation terms.
                </p>
              </div>

              {/* Capacity Limit */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Maximum Tester Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={maxTesters}
                  onChange={(e) => setMaxTesters(e.target.value)}
                  placeholder="20"
                  className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs sm:text-sm focus:outline-none focus:border-[#087C80]"
                />
                <p className="text-[11px] text-[#52656B]">Cap on accepted testers for this beta cycle.</p>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                    Testing Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={testingStartDate}
                    onChange={(e) => setTestingStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                    Testing End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={testingEndDate}
                    onChange={(e) => setTestingEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80]"
                  />
                </div>
              </div>

              {/* Reward Type Selection */}
              <div className="space-y-2 pt-3 border-t border-[#DCE7E3]">
                <label className="block text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Testing Reward Model <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRewardType('unpaid')}
                    className={`p-4 rounded-2xl text-left border transition-all space-y-1 ${
                      rewardType === 'unpaid'
                        ? 'bg-[#D7EFEB] border-[#087C80] shadow-xs'
                        : 'bg-[#F6F5ED] border-[#DCE7E3] hover:border-[#087C80]/40'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#102A35] block">Unpaid / Volunteer</span>
                    <span className="text-[11px] text-[#52656B] block">
                      Passion testing in exchange for early product access.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardType('monetary')}
                    className={`p-4 rounded-2xl text-left border transition-all space-y-1 ${
                      rewardType === 'monetary'
                        ? 'bg-[#E6F7F0] border-[#0E7C57] shadow-xs'
                        : 'bg-[#F6F5ED] border-[#DCE7E3] hover:border-[#087C80]/40'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#0E7C57] flex items-center space-x-1">
                      <Coins className="h-3.5 w-3.5" />
                      <span>Monetary Reward</span>
                    </span>
                    <span className="text-[11px] text-[#52656B] block">
                      Direct cash compensation upon task completion.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardType('perk')}
                    className={`p-4 rounded-2xl text-left border transition-all space-y-1 ${
                      rewardType === 'perk'
                        ? 'bg-[#D7EFEB] border-[#087C80] shadow-xs'
                        : 'bg-[#F6F5ED] border-[#DCE7E3] hover:border-[#087C80]/40'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#07545A] flex items-center space-x-1">
                      <Gift className="h-3.5 w-3.5" />
                      <span>Perk / Subscription</span>
                    </span>
                    <span className="text-[11px] text-[#52656B] block">
                      Free licenses, annual subscription, or company merchandise.
                    </span>
                  </button>
                </div>
              </div>

              {/* Monetary Fields */}
              {rewardType === 'monetary' && (
                <div className="p-4.5 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#0E7C57] uppercase tracking-wider">
                        Reward Amount per Tester *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={rewardAmount}
                        onChange={(e) => setRewardAmount(e.target.value)}
                        placeholder="25.00"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#B6EDD5] text-[#102A35] text-xs focus:outline-none focus:border-[#0E7C57]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#0E7C57] uppercase tracking-wider">
                        Currency (ISO code) *
                      </label>
                      <select
                        value={rewardCurrency}
                        onChange={(e) => setRewardCurrency(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#B6EDD5] text-[#102A35] text-xs focus:outline-none focus:border-[#0E7C57]"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#0E7C57] uppercase tracking-wider">
                      Fulfillment &amp; Qualification Terms
                    </label>
                    <input
                      type="text"
                      value={rewardEligibility}
                      onChange={(e) => setRewardEligibility(e.target.value)}
                      placeholder="e.g. Paid out via UPI/Bank transfer within 7 business days of testing report verification."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#B6EDD5] text-[#102A35] text-xs focus:outline-none focus:border-[#0E7C57]"
                    />
                  </div>
                </div>
              )}

              {/* Perk Fields */}
              {rewardType === 'perk' && (
                <div className="p-4.5 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#07545A] uppercase tracking-wider">
                      Perk Description *
                    </label>
                    <input
                      type="text"
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      placeholder="e.g. Free 1-year Pro Subscription license key ($120 value)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#BCE1DA] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#07545A] uppercase tracking-wider">
                      Perk Eligibility Terms
                    </label>
                    <input
                      type="text"
                      value={rewardEligibility}
                      onChange={(e) => setRewardEligibility(e.target.value)}
                      placeholder="e.g. Must complete at least 2 structured testing tasks and submit survey."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#BCE1DA] text-[#102A35] text-xs focus:outline-none focus:border-[#087C80]"
                    />
                  </div>
                </div>
              )}

              {/* Fulfillment Disclaimer */}
              <div className="p-4 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] text-[11px] text-[#52656B] space-y-1">
                <span className="font-bold text-[#102A35] block">Reward Fulfillment Notice:</span>
                <p>
                  TryLo facilitates campaign discovery and tester matching. All stated reward conditions are
                  honored and fulfilled directly by you as the startup founder upon test report verification.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Save */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#DCE7E3] pb-3">
                <h2 className="text-lg font-bold text-[#102A35]">Step 5 — Review &amp; Save</h2>
                <p className="text-xs text-[#52656B]">
                  Review your campaign specifications. You can save as a draft or publish right away.
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="p-6 rounded-3xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#DCE7E3]">
                  <div>
                    <div className="flex items-center space-x-2 text-xs text-[#52656B] pb-1">
                      <Building2 className="h-3.5 w-3.5 text-[#087C80]" />
                      <span className="font-medium text-[#102A35]">{selectedStartup?.name || 'Selected Startup'}</span>
                      <span>&bull;</span>
                      <span>{productType}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#102A35]">{title || 'Untitled Campaign'}</h3>
                    {summary && <p className="text-xs text-[#52656B] mt-1">{summary}</p>}
                  </div>

                  <div className="shrink-0">
                    {rewardType === 'monetary' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F7F0] text-[#0E7C57] border border-[#B6EDD5]">
                        <Coins className="h-3.5 w-3.5 text-[#0E7C57]" />
                        <span>
                          {rewardCurrency} {rewardAmount}
                        </span>
                      </span>
                    )}
                    {rewardType === 'perk' && (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                        <Gift className="h-3.5 w-3.5 text-[#087C80]" />
                        <span>{rewardDescription || 'Perk Reward'}</span>
                      </span>
                    )}
                    {rewardType === 'unpaid' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
                        <span>Unpaid Testing</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Tasks Review */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[#52656B] uppercase tracking-wider">
                    Testing Tasks ({tasks.length})
                  </h4>
                  <div className="space-y-1.5">
                    {tasks.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="p-3 rounded-xl bg-white border border-[#DCE7E3] text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-[#102A35]">
                          {idx + 1}. {t.title}
                        </span>
                        {t.is_required && (
                          <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Required
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audience Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-[#DCE7E3] text-[#52656B]">
                  <div>
                    <span className="text-[#102A35] block font-semibold mb-1">Target Devices:</span>
                    <span>{selectedDevices.join(', ') || 'Any'}</span>
                  </div>
                  <div>
                    <span className="text-[#102A35] block font-semibold mb-1">Experience Level:</span>
                    <span>{experienceLevel}</span>
                  </div>
                  {skills.length > 0 && (
                    <div>
                      <span className="text-[#102A35] block font-semibold mb-1">Skills:</span>
                      <span>{skills.join(', ')}</span>
                    </div>
                  )}
                  {maxTesters && (
                    <div>
                      <span className="text-[#102A35] block font-semibold mb-1">Capacity:</span>
                      <span>{maxTesters} testers max</span>
                    </div>
                  )}
                </div>

                {/* Private access instructions confirmation */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE7E3] text-xs space-y-1">
                  <span className="font-bold text-[#102A35] flex items-center space-x-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#087C80]" />
                    <span>Tester Access Instructions:</span>
                  </span>
                  <p className="text-[#52656B] text-[11px]">
                    {accessInstructions.trim()
                      ? 'Instructions saved securely. Never shown to public visitors.'
                      : 'No instructions entered yet. Required before publication.'}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#DCE7E3]">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isPublishing}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className="h-4 w-4 text-[#087C80]" />
                  <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishFromWizard}
                  disabled={isSubmitting || isPublishing}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] text-white hover:bg-[#087C80] shadow-xs transition-all disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isPublishing ? 'Publishing...' : 'Publish Campaign'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#DCE7E3]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold text-[#102A35] hover:bg-[#F6F5ED] bg-white border border-[#DCE7E3] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 5 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setStep(step + 1);
                }}
                className="inline-flex items-center space-x-1 px-5 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors shadow-xs"
              >
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CampaignWizardPage: React.FC = () => {
  const { startupId: routeStartupId, campaignId } = useParams<{
    startupId?: string;
    campaignId?: string;
  }>();

  const { data: myStartups } = useMyStartups();
  const { data: existingCampaign, isLoading: isLoadingCampaign } = useCampaign(campaignId);

  if (campaignId && isLoadingCampaign) {
    return (
      <div className="flex-1 py-12 px-4 max-w-3xl mx-auto w-full space-y-6 bg-[#F6F5ED]">
        <div className="h-8 w-48 bg-[#EFEFE5] rounded animate-pulse"></div>
        <div className="h-72 bg-white rounded-3xl border border-[#DCE7E3] animate-pulse"></div>
      </div>
    );
  }

  if (existingCampaign?.status === 'closed') {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-16 px-4 max-w-lg mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-[#EFEFE5] border border-[#DCE7E3] flex items-center justify-center text-[#52656B]">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#102A35]">Closed Campaign Cannot Be Modified</h2>
        <p className="text-xs sm:text-sm text-[#52656B]">
          This campaign has been closed and cannot be updated. You can view its historical details or
          launch a new campaign.
        </p>
        <Link
          to={`/founder/campaigns/${campaignId}`}
          className="inline-flex items-center space-x-1 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80]"
        >
          <span>View Campaign Details</span>
        </Link>
      </div>
    );
  }

  return (
    <CampaignWizardForm
      key={existingCampaign?.id || 'new'}
      initialCampaign={existingCampaign}
      routeStartupId={routeStartupId}
      myStartups={myStartups || []}
    />
  );
};
