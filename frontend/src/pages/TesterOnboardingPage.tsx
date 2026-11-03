import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../context/useProfile';
import {
  EXPERIENCE_LEVELS,
  SUGGESTED_SKILLS,
  SUGGESTED_INTERESTS,
  SUGGESTED_DEVICES,
  isValidLinkedInUrl,
  type TesterProfile,
  type ExperienceLevel,
} from '../api/profile';
import {
  UserCheck,
  Cpu,
  Monitor,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  ShieldCheck,
  Award,
  ExternalLink,
} from 'lucide-react';
import {
  updateTesterResume,
  TESTER_SPECIALIZATIONS,
} from '../api/verification';

interface TesterOnboardingWizardProps {
  initialProfile: TesterProfile | null;
}

const TesterOnboardingWizard: React.FC<TesterOnboardingWizardProps> = ({ initialProfile }) => {
  const { updateProfile, isUpdating } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form State initialized from initialProfile
  const [bio, setBio] = useState<string>(() => initialProfile?.bio || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    () => (initialProfile?.experience_level as ExperienceLevel) || 'Intermediate'
  );
  const [skills, setSkills] = useState<string[]>(() => initialProfile?.skills || []);
  const [interests, setInterests] = useState<string[]>(() => initialProfile?.interests || []);
  const [devices, setDevices] = useState<string[]>(() => initialProfile?.devices || []);
  const [city, setCity] = useState<string>(() => initialProfile?.city || '');
  const [country, setCountry] = useState<string>(() => initialProfile?.country || '');
  const [linkedinUrl, setLinkedinUrl] = useState<string>(() => initialProfile?.linkedin_url || '');

  // Step 4: Credibility & Resume State
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [bugBountyUrl, setBugBountyUrl] = useState<string>('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toggle multi-select chips
  const toggleSelection = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!bio.trim()) {
      errs.bio = 'A short introductory bio is required to complete your profile.';
    } else if (bio.trim().length < 10) {
      errs.bio = 'Please provide a more descriptive bio (minimum 10 characters).';
    } else if (bio.trim().length > 2000) {
      errs.bio = 'Bio must not exceed 2000 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (skills.length === 0) {
      errs.skills = 'Please select at least 1 testing skill to complete your profile.';
    }
    if (interests.length === 0) {
      errs.interests = 'Please select at least 1 product interest/category to complete your profile.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (linkedinUrl.trim() && !isValidLinkedInUrl(linkedinUrl)) {
      errs.linkedinUrl = 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/...).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    setGeneralError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setGeneralError(null);
    setErrors({});
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError(null);

    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      return;
    }

    try {
      await updateProfile({
        bio: bio.trim(),
        experience_level: experienceLevel || null,
        skills,
        interests,
        devices,
        city: city.trim() || null,
        country: country.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
      });

      // If user provided resume, specializations or portfolio links, persist them to update tier
      if (
        resumeUrl.trim() ||
        specializations.length > 0 ||
        githubUrl.trim() ||
        portfolioUrl.trim() ||
        bugBountyUrl.trim()
      ) {
        try {
          await updateTesterResume({
            resume_url: resumeUrl.trim() || undefined,
            file_name: fileName.trim() || (resumeUrl.trim() ? 'Attested_QA_Resume.pdf' : undefined),
            github_url: githubUrl.trim() || undefined,
            portfolio_url: portfolioUrl.trim() || undefined,
            bug_bounty_url: bugBountyUrl.trim() || undefined,
            specializations,
          });
        } catch (resErr) {
          console.warn('Resume update optional notice:', resErr);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/tester', { replace: true });
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Failed to save profile. Please check your connection and try again.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
            Set Up Your Testing Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#52656B] max-w-lg mx-auto">
            Help founders match you with beta testing opportunities that fit your background, interests, and devices.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-[#DCE7E3] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold">
            <span className={step >= 1 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              1. About You
            </span>
            <span className={step >= 2 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              2. Skills &amp; Categories
            </span>
            <span className={step >= 3 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              3. Hardware &amp; Location
            </span>
            <span className={step >= 4 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              4. Credibility &amp; Resume
            </span>
          </div>
          <div className="w-full bg-[#EFEFE5] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#087C80] to-[#07545A] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Banner */}
        {generalError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccess && (
          <div className="p-5 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] flex items-center space-x-3 text-[#0E7C57] text-sm animate-in fade-in">
            <CheckCircle2 className="h-6 w-6 text-[#0E7C57] shrink-0" />
            <div>
              <p className="font-bold text-[#102A35]">Tester Profile Saved!</p>
              <p className="text-xs text-[#52656B]">Redirecting to your Tester Workspace...</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white border border-[#DCE7E3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Step 1: About You */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#087C80] pb-3 border-b border-[#DCE7E3]">
                <UserCheck className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Step 1: About You</h2>
              </div>

              {/* Bio (Required) */}
              <div className="space-y-1.5">
                <label htmlFor="testerBio" className="block text-xs font-semibold text-[#102A35]">
                  Short Bio / Introduction <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="testerBio"
                  rows={4}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    if (errors.bio) setErrors({ ...errors, bio: '' });
                  }}
                  placeholder="Share your testing experience, attention to detail, and what kinds of apps you enjoy exploring..."
                  maxLength={2000}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border ${
                    errors.bio ? 'border-rose-400 focus:border-rose-500' : 'border-[#DCE7E3] focus:border-[#087C80]'
                  } text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all`}
                />
                {errors.bio ? (
                  <p className="text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors.bio}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#52656B]">
                    Required: write at least 10 characters introducing yourself to startup founders.
                  </p>
                )}
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#102A35]">
                  Testing Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        experienceLevel === lvl
                          ? 'bg-[#087C80] border-[#087C80] text-white shadow-xs font-semibold'
                          : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:border-[#087C80]/40'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Testing Preferences (Skills & Interests) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#087C80] pb-3 border-b border-[#DCE7E3]">
                <Cpu className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Step 2: Testing Preferences</h2>
              </div>

              {/* Skills (Multi-select) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#102A35]">
                    Your Skills <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-[#087C80]">
                    {skills.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-[#52656B]">
                  Select at least 1 skill you bring to beta testing campaigns:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SKILLS.map((skill) => {
                    const isSelected = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          toggleSelection(skill, skills, setSkills);
                          if (errors.skills) setErrors({ ...errors, skills: '' });
                        }}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-[#087C80] border-[#087C80] text-white font-semibold'
                            : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:border-[#087C80]/40'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.skills && (
                  <p className="text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors.skills}</span>
                  </p>
                )}
              </div>

              {/* Product Interests (Multi-select) */}
              <div className="space-y-2.5 pt-3 border-t border-[#DCE7E3]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#102A35]">
                    Product Categories of Interest <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-[#087C80]">
                    {interests.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-[#52656B]">
                  Select at least 1 industry domain you are excited to test:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INTERESTS.map((interest) => {
                    const isSelected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => {
                          toggleSelection(interest, interests, setInterests);
                          if (errors.interests) setErrors({ ...errors, interests: '' });
                        }}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-[#07545A] border-[#07545A] text-white font-semibold'
                            : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:border-[#087C80]/40'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                        <span>{interest}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.interests && (
                  <p className="text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors.interests}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Setup & Devices */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#087C80] pb-3 border-b border-[#DCE7E3]">
                <Monitor className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Step 3: Devices &amp; Location</h2>
              </div>

              {/* Devices (Multi-select) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#102A35]">
                  Available Testing Devices / Platforms <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_DEVICES.map((dev) => {
                    const isSelected = devices.includes(dev);
                    return (
                      <button
                        key={dev}
                        type="button"
                        onClick={() => toggleSelection(dev, devices, setDevices)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-[#087C80] border-[#087C80] text-white font-semibold'
                            : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:border-[#087C80]/40'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                        <span>{dev}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="city" className="block text-xs font-semibold text-[#102A35]">
                    City <span className="text-[#52656B] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Bangalore, Hyderabad"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-[#DCE7E3] focus:border-[#087C80] text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="country" className="block text-xs font-semibold text-[#102A35]">
                    Country <span className="text-[#52656B] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-[#DCE7E3] focus:border-[#087C80] text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                  />
                </div>
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-1.5">
                <label htmlFor="linkedinUrl" className="block text-xs font-semibold text-[#102A35]">
                  LinkedIn Profile URL <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <input
                  id="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => {
                    setLinkedinUrl(e.target.value);
                    if (errors.linkedinUrl) setErrors({ ...errors, linkedinUrl: '' });
                  }}
                  placeholder="https://linkedin.com/in/yourprofile"
                  maxLength={500}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border ${
                    errors.linkedinUrl ? 'border-rose-400 focus:border-rose-500' : 'border-[#DCE7E3] focus:border-[#087C80]'
                  } text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all`}
                />
                {errors.linkedinUrl && (
                  <p className="text-xs text-rose-600">{errors.linkedinUrl}</p>
                )}
              </div>

              {/* Summary preview */}
              <div className="mt-4 p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2 text-xs">
                <div className="font-bold text-[#102A35]">Profile Summary Preview</div>
                <div className="text-[#52656B] space-y-1">
                  <p>
                    <span className="font-medium text-[#102A35]">Level:</span> {experienceLevel}
                  </p>
                  <p>
                    <span className="font-medium text-[#102A35]">Skills ({skills.length}):</span>{' '}
                    {skills.join(', ') || '(None)'}
                  </p>
                  <p>
                    <span className="font-medium text-[#102A35]">Interests ({interests.length}):</span>{' '}
                    {interests.join(', ') || '(None)'}
                  </p>
                  {devices.length > 0 && (
                    <p>
                      <span className="font-medium text-[#102A35]">Devices ({devices.length}):</span>{' '}
                      {devices.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Credibility & QA Verification */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
                <div className="flex items-center space-x-2 text-[#087C80]">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="text-base font-bold text-[#102A35]">Step 4: Credibility &amp; QA Verification</h2>
                </div>
                <span className="text-[11px] font-semibold text-[#0E7C57] bg-[#E6F7F0] px-2.5 py-0.5 rounded-full border border-[#B6EDD5]">
                  Tier 2 Boost (Optional)
                </span>
              </div>

              {/* Explanatory Trust Tier Banner */}
              <div className="p-4 rounded-2xl bg-[#E6F7F0]/60 border border-[#B6EDD5] space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#0E7C57]">
                  <Award className="h-4 w-4" />
                  <span>TryLo 3-Tier Verification Architecture</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-[#B6EDD5]">
                    <div className="font-bold text-[#102A35] flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#52656B]"></span>
                      <span>Tier 1: Basic</span>
                    </div>
                    <p className="text-[#52656B] mt-0.5">Completed profile info and bio.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#B6EDD5] shadow-xs">
                    <div className="font-bold text-[#087C80] flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#087C80]"></span>
                      <span>Tier 2: Vetted</span>
                    </div>
                    <p className="text-[#52656B] mt-0.5">QA Resume or verified certifications attached.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#B6EDD5]">
                    <div className="font-bold text-[#0E7C57] flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#0E7C57]"></span>
                      <span>Tier 3: Top-Rated</span>
                    </div>
                    <p className="text-[#52656B] mt-0.5">3+ verified founder reviews (avg &ge; 4.0 stars).</p>
                  </div>
                </div>
              </div>

              {/* QA Resume / Attested Document Attachment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#102A35]">
                    QA Resume / CV Document URL <span className="text-[#52656B] font-normal">(PDF or Cloud Storage Link)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeUrl('/documents/Priya_Patel_Senior_QA_Automation_Attested.pdf');
                      setFileName('Priya_Patel_Senior_QA_Automation_Attested.pdf');
                      if (specializations.length === 0) {
                        setSpecializations(['Security Testing', 'Automated Testing', 'API Testing']);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087C80] hover:text-[#07545A] underline cursor-pointer"
                  >
                    <span>Load Sample Attested QA CV</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="e.g. /documents/Priya_Patel_Senior_QA_Automation_Attested.pdf or https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-[#DCE7E3] focus:border-[#087C80] text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15"
                  />
                </div>
                {resumeUrl && (
                  <div className="flex items-center space-x-2 text-[11px] text-[#0E7C57] bg-[#E6F7F0] p-2 rounded-xl border border-[#B6EDD5]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Resume attached: {fileName || 'Attested_QA_Resume.pdf'}</span>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 font-bold underline"
                    >
                      <span>Preview</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* QA Specializations */}
              <div className="space-y-2 pt-2 border-t border-[#DCE7E3]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#102A35]">
                    QA Specializations
                  </label>
                  <span className="text-[11px] text-[#087C80] font-medium">
                    {specializations.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-[#52656B]">
                  Select the domains where you have demonstrable testing track records:
                </p>
                <div className="flex flex-wrap gap-2">
                  {TESTER_SPECIALIZATIONS.map((spec) => {
                    const isSelected = specializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSelection(spec, specializations, setSpecializations)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#087C80] border-[#087C80] text-white font-semibold'
                            : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:border-[#087C80]/40'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                        <span>{spec}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Portfolio & GitHub Repositories */}
              <div className="space-y-3 pt-2 border-t border-[#DCE7E3]">
                <label className="block text-xs font-semibold text-[#102A35]">
                  QA Portfolio &amp; Code Links <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[#52656B]">GitHub / Repo:</span>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/your-username"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[#52656B]">QA Portfolio URL:</span>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[#52656B]">Bug Bounty Profile:</span>
                    <input
                      type="url"
                      value={bugBountyUrl}
                      onChange={(e) => setBugBountyUrl(e.target.value)}
                      placeholder="https://hackerone.com/username"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] text-xs text-[#102A35] focus:outline-none focus:border-[#087C80]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-4 border-t border-[#DCE7E3] flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isUpdating || saveSuccess}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#102A35] hover:bg-[#F6F5ED] bg-white border border-[#DCE7E3] transition-all disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                to="/tester"
                className="text-xs font-medium text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                Cancel
              </Link>
            )}

            <div className="flex items-center space-x-3">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isUpdating || saveSuccess}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-all shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Complete &amp; Enter Workspace</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TesterOnboardingPage: React.FC = () => {
  const { profileData, isLoading: isLoadingProfile } = useProfile();

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[#F6F5ED]">
        <Loader2 className="h-8 w-8 animate-spin text-[#087C80] mb-4" />
        <p className="text-sm text-[#52656B] font-medium">Loading onboarding details...</p>
      </div>
    );
  }

  const initialProfile = (profileData?.role === 'tester' ? profileData.profile : null) as TesterProfile | null;

  return <TesterOnboardingWizard initialProfile={initialProfile} />;
};
