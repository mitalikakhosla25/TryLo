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
  Sparkles,
  UserCheck,
  Cpu,
  Monitor,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

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
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Tester Onboarding</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Setup Your Testing Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Help startups match you with beta testing opportunities that fit your background and devices.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold">
          <span className={step >= 1 ? 'text-violet-400' : 'text-slate-500'}>
            1. About You
          </span>
          <span className={step >= 2 ? 'text-violet-400' : 'text-slate-500'}>
            2. Testing Preferences
          </span>
          <span className={step >= 3 ? 'text-violet-400' : 'text-slate-500'}>
            3. Setup &amp; Devices
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {generalError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-white">Tester Profile Saved!</p>
            <p className="text-xs text-emerald-300/80">Redirecting to your Tester Workspace...</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Step 1: About You */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-violet-400 pb-2 border-b border-slate-800">
              <UserCheck className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Step 1: About You</h2>
            </div>

            {/* Bio (Required) */}
            <div className="space-y-1.5">
              <label htmlFor="testerBio" className="block text-xs font-semibold text-slate-200">
                Short Bio / Introduction <span className="text-rose-400">*</span>
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
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border ${
                  errors.bio ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-violet-500'
                } text-white focus:outline-none transition-colors`}
              />
              {errors.bio ? (
                <p className="text-xs text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.bio}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Required: write at least 10 characters introducing yourself to startup founders.
                </p>
              )}
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
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
                        ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm shadow-violet-500/20 font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
            <div className="flex items-center space-x-2 text-violet-400 pb-2 border-b border-slate-800">
              <Cpu className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Step 2: Testing Preferences</h2>
            </div>

            {/* Skills (Multi-select) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  Your Skills <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {skills.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
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
                          ? 'bg-violet-600/25 border-violet-500 text-violet-200 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-violet-400" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
              {errors.skills && (
                <p className="text-xs text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.skills}</span>
                </p>
              )}
            </div>

            {/* Product Interests (Multi-select) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  Product Categories of Interest <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {interests.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
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
                          ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
              {errors.interests && (
                <p className="text-xs text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.interests}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Setup & Devices */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-violet-400 pb-2 border-b border-slate-800">
              <Monitor className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Step 3: Devices &amp; Location</h2>
            </div>

            {/* Devices (Multi-select) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Available Testing Devices / Platforms <span className="text-slate-500 font-normal">(Optional)</span>
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
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                      <span>{dev}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-xs font-semibold text-slate-200">
                  City <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-violet-500 text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="country" className="block text-xs font-semibold text-slate-200">
                  Country <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-violet-500 text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-1.5">
              <label htmlFor="linkedinUrl" className="block text-xs font-semibold text-slate-200">
                LinkedIn Profile URL <span className="text-slate-500 font-normal">(Optional)</span>
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
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border ${
                  errors.linkedinUrl ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-violet-500'
                } text-white focus:outline-none transition-colors`}
              />
              {errors.linkedinUrl && (
                <p className="text-xs text-rose-400">{errors.linkedinUrl}</p>
              )}
            </div>

            {/* Summary preview */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2 text-xs">
              <div className="font-semibold text-slate-300">Profile Summary Preview:</div>
              <div className="text-slate-400 space-y-1">
                <p>
                  <span className="text-slate-500">Level:</span> {experienceLevel}
                </p>
                <p>
                  <span className="text-slate-500">Skills ({skills.length}):</span>{' '}
                  {skills.join(', ') || '(None)'}
                </p>
                <p>
                  <span className="text-slate-500">Interests ({interests.length}):</span>{' '}
                  {interests.join(', ') || '(None)'}
                </p>
                {devices.length > 0 && (
                  <p>
                    <span className="text-slate-500">Devices ({devices.length}):</span>{' '}
                    {devices.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isUpdating || saveSuccess}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              to="/tester"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancel
            </Link>
          )}

          <div className="flex items-center space-x-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-all shadow-md shadow-violet-600/20"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isUpdating || saveSuccess}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Save &amp; Enter Workspace</span>
                  </>
                )}
              </button>
            )}
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-300 font-medium">Loading onboarding details...</p>
      </div>
    );
  }

  const initialProfile = (profileData?.role === 'tester' ? profileData.profile : null) as TesterProfile | null;

  return <TesterOnboardingWizard initialProfile={initialProfile} />;
};
