import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../context/useProfile';
import {
  COMPANY_STAGES,
  isValidUrl,
  isValidLinkedInUrl,
  type FounderProfile,
} from '../api/profile';
import {
  Building,
  Globe,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface FounderOnboardingWizardProps {
  initialProfile: FounderProfile | null;
}

const FounderOnboardingWizard: React.FC<FounderOnboardingWizardProps> = ({ initialProfile }) => {
  const { updateProfile, isUpdating } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form State initialized directly from initialProfile
  const [startupName, setStartupName] = useState<string>(() => initialProfile?.startup_name || '');
  const [professionalTitle, setProfessionalTitle] = useState<string>(() => initialProfile?.professional_title || '');
  const [industry, setIndustry] = useState<string>(() => initialProfile?.industry || '');
  const [companyStage, setCompanyStage] = useState<string>(() => initialProfile?.company_stage || 'MVP');
  const [startupDescription, setStartupDescription] = useState<string>(() => initialProfile?.startup_description || '');
  const [websiteUrl, setWebsiteUrl] = useState<string>(() => initialProfile?.website_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState<string>(() => initialProfile?.linkedin_url || '');
  const [city, setCity] = useState<string>(() => initialProfile?.city || '');
  const [country, setCountry] = useState<string>(() => initialProfile?.country || '');

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!startupName.trim()) {
      errs.startupName = 'Startup or product name is required to complete your profile.';
    } else if (startupName.trim().length > 200) {
      errs.startupName = 'Startup name must not exceed 200 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (websiteUrl.trim() && !isValidUrl(websiteUrl)) {
      errs.websiteUrl = 'Please enter a valid website URL (starting with http:// or https://).';
    }
    if (linkedinUrl.trim() && !isValidLinkedInUrl(linkedinUrl)) {
      errs.linkedinUrl = 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/...).';
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

    // Final full validation
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    try {
      await updateProfile({
        startup_name: startupName.trim(),
        professional_title: professionalTitle.trim() || null,
        industry: industry.trim() || null,
        company_stage: companyStage || null,
        startup_description: startupDescription.trim() || null,
        website_url: websiteUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/founder', { replace: true });
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Failed to save profile. Please check your network and try again.');
      }
    }
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Founder Onboarding</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Tell Us About Your Startup
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Set up your founder profile to unlock the TryLo beta testing community and recruit targeted testers.
        </p>
      </div>

      {/* Multi-step progress bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold">
          <span className={step >= 1 ? 'text-indigo-400' : 'text-slate-500'}>
            1. Startup Basics
          </span>
          <span className={step >= 2 ? 'text-indigo-400' : 'text-slate-500'}>
            2. Product Details
          </span>
          <span className={step >= 3 ? 'text-indigo-400' : 'text-slate-500'}>
            3. Location
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Error alert */}
      {generalError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Success alert */}
      {saveSuccess && (
        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-white">Profile Saved Successfully!</p>
            <p className="text-xs text-emerald-300/80">Redirecting to your Founder Workspace...</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Step 1: About you and your startup */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-indigo-400 pb-2 border-b border-slate-800">
              <Building className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Step 1: About You &amp; Your Startup</h2>
            </div>

            {/* Startup Name (Required) */}
            <div className="space-y-1.5">
              <label htmlFor="startupName" className="block text-xs font-semibold text-slate-200">
                Startup / Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="startupName"
                type="text"
                value={startupName}
                onChange={(e) => {
                  setStartupName(e.target.value);
                  if (errors.startupName) setErrors({ ...errors, startupName: '' });
                }}
                placeholder="e.g. Acme AI, FluxCloud"
                maxLength={200}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border ${
                  errors.startupName ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'
                } text-white focus:outline-none transition-colors`}
              />
              {errors.startupName ? (
                <p className="text-xs text-rose-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.startupName}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Required to complete your founder profile.
                </p>
              )}
            </div>

            {/* Professional Title (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="professionalTitle" className="block text-xs font-semibold text-slate-200">
                Professional Title <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="professionalTitle"
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="e.g. Founder &amp; CEO, Co-founder &amp; CTO"
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Industry (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="industry" className="block text-xs font-semibold text-slate-200">
                Industry Domain <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. B2B SaaS, HealthTech, Developer Tools"
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2: Startup Details */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-indigo-400 pb-2 border-b border-slate-800">
              <Globe className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Step 2: Startup Details</h2>
            </div>

            {/* Company Stage */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Company Stage <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPANY_STAGES.map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setCompanyStage(stg)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      companyStage === stg
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20 font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>

            {/* Startup Description */}
            <div className="space-y-1.5">
              <label htmlFor="startupDescription" className="block text-xs font-semibold text-slate-200">
                Short Description <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="startupDescription"
                rows={3}
                value={startupDescription}
                onChange={(e) => setStartupDescription(e.target.value)}
                placeholder="What problem does your product solve?"
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Website URL */}
            <div className="space-y-1.5">
              <label htmlFor="websiteUrl" className="block text-xs font-semibold text-slate-200">
                Website URL <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  if (errors.websiteUrl) setErrors({ ...errors, websiteUrl: '' });
                }}
                placeholder="https://example.com"
                maxLength={500}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border ${
                  errors.websiteUrl ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'
                } text-white focus:outline-none transition-colors`}
              />
              {errors.websiteUrl && (
                <p className="text-xs text-rose-400">{errors.websiteUrl}</p>
              )}
            </div>

            {/* LinkedIn Profile */}
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
                  errors.linkedinUrl ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'
                } text-white focus:outline-none transition-colors`}
              />
              {errors.linkedinUrl && (
                <p className="text-xs text-rose-400">{errors.linkedinUrl}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-indigo-400 pb-2 border-b border-slate-800">
              <MapPin className="h-5 w-5" />
              <h2 className="text-base font-bold text-white">Step 3: Location</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-xs font-semibold text-slate-200">
                  City <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none transition-colors"
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
                  placeholder="e.g. United States"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Summary card before saving */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Profile Summary Preview:</div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  <span className="text-slate-500">Startup:</span>{' '}
                  <span className="text-white font-medium">{startupName || '(Not specified)'}</span>
                </p>
                {professionalTitle && (
                  <p>
                    <span className="text-slate-500">Title:</span> {professionalTitle}
                  </p>
                )}
                {companyStage && (
                  <p>
                    <span className="text-slate-500">Stage:</span> {companyStage}
                  </p>
                )}
                {(city || country) && (
                  <p>
                    <span className="text-slate-500">Location:</span>{' '}
                    {[city, country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
              to="/founder"
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
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isUpdating || saveSuccess}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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

export const FounderOnboardingPage: React.FC = () => {
  const { profileData, isLoading: isLoadingProfile } = useProfile();

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-300 font-medium">Loading onboarding details...</p>
      </div>
    );
  }

  const initialProfile = (profileData?.role === 'founder' ? profileData.profile : null) as FounderProfile | null;

  return <FounderOnboardingWizard initialProfile={initialProfile} />;
};
