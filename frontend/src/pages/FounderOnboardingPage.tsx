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
  Building2,
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
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
            <Sparkles className="h-3.5 w-3.5 text-[#087C80]" />
            <span>Founder Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
            Tell Us About Your Startup
          </h1>
          <p className="text-xs sm:text-sm text-[#52656B] max-w-lg mx-auto">
            Set up your founder profile to unlock TryLo’s beta tester community and recruit targeted testers across India.
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="bg-white border border-[#DCE7E3] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold">
            <span className={step >= 1 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              1. Startup Basics
            </span>
            <span className={step >= 2 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              2. Product Details
            </span>
            <span className={step >= 3 ? 'text-[#087C80] font-bold' : 'text-[#52656B]'}>
              3. Location &amp; Review
            </span>
          </div>
          <div className="w-full bg-[#EFEFE5] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#087C80] to-[#07545A] h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error alert */}
        {generalError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Success alert */}
        {saveSuccess && (
          <div className="p-5 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] flex items-center space-x-3 text-[#0E7C57] text-sm animate-in fade-in">
            <CheckCircle2 className="h-6 w-6 text-[#0E7C57] shrink-0" />
            <div>
              <p className="font-bold text-[#102A35]">Profile Saved Successfully!</p>
              <p className="text-xs text-[#52656B]">Redirecting to your Founder Workspace...</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white border border-[#DCE7E3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Step 1: About you and your startup */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#087C80] pb-3 border-b border-[#DCE7E3]">
                <Building2 className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Step 1: About You &amp; Your Startup</h2>
              </div>

              {/* Startup Name (Required) */}
              <div className="space-y-1.5">
                <label htmlFor="startupName" className="block text-xs font-semibold text-[#102A35]">
                  Startup / Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="startupName"
                  type="text"
                  value={startupName}
                  onChange={(e) => {
                    setStartupName(e.target.value);
                    if (errors.startupName) setErrors({ ...errors, startupName: '' });
                  }}
                  placeholder="e.g. NutriBox, Kraftly, Bloomly"
                  maxLength={200}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border ${
                    errors.startupName ? 'border-rose-400 focus:border-rose-500' : 'border-[#DCE7E3] focus:border-[#087C80]'
                  } text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all`}
                />
                {errors.startupName ? (
                  <p className="text-xs text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{errors.startupName}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#52656B]">
                    Required to complete your founder profile.
                  </p>
                )}
              </div>

              {/* Professional Title (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="professionalTitle" className="block text-xs font-semibold text-[#102A35]">
                  Professional Title <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <input
                  id="professionalTitle"
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g. Founder &amp; CEO, Co-founder &amp; CTO"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-[#DCE7E3] focus:border-[#087C80] text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                />
              </div>

              {/* Industry (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="industry" className="block text-xs font-semibold text-[#102A35]">
                  Industry Domain <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. B2B SaaS, HealthTech, D2C, Developer Tools"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-[#DCE7E3] focus:border-[#087C80] text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 2: Startup Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#087C80] pb-3 border-b border-[#DCE7E3]">
                <Globe className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Step 2: Startup Details</h2>
              </div>

              {/* Company Stage */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#102A35]">
                  Company Stage <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMPANY_STAGES.map((stg) => (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => setCompanyStage(stg)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        companyStage === stg
                          ? 'bg-[#087C80] border-[#087C80] text-white shadow-xs font-semibold'
                          : 'bg-[#F6F5ED] border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:border-[#087C80]/40'
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Startup Description */}
              <div className="space-y-1.5">
                <label htmlFor="startupDescription" className="block text-xs font-semibold text-[#102A35]">
                  Short Description <span className="text-[#52656B] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="startupDescription"
                  rows={3}
                  value={startupDescription}
                  onChange={(e) => setStartupDescription(e.target.value)}
                  placeholder="What problem does your product solve?"
                  maxLength={2000}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-[#DCE7E3] focus:border-[#087C80] text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-1.5">
                <label htmlFor="websiteUrl" className="block text-xs font-semibold text-[#102A35]">
                  Website URL <span className="text-[#52656B] font-normal">(Optional)</span>
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
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border ${
                    errors.websiteUrl ? 'border-rose-400 focus:border-rose-500' : 'border-[#DCE7E3] focus:border-[#087C80]'
                  } text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/15 transition-all`}
                />
                {errors.websiteUrl && (
                  <p className="text-xs text-rose-600">{errors.websiteUrl}</p>
                )}
              </div>

              {/* LinkedIn Profile */}
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
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-[#087C80] pb-3 border-b border-[#DCE7E3]">
                <MapPin className="h-5 w-5" />
                <h2 className="text-base font-bold text-[#102A35]">Step 3: Location &amp; Confirmation</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="city" className="block text-xs font-semibold text-[#102A35]">
                    City <span className="text-[#52656B] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru, Mumbai, Delhi NCR"
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

              {/* Summary card before saving */}
              <div className="mt-4 p-4.5 rounded-2xl bg-[#F6F5ED] border border-[#DCE7E3] space-y-2">
                <div className="text-xs font-bold text-[#102A35]">Profile Summary Preview</div>
                <div className="text-xs text-[#52656B] space-y-1.5">
                  <p>
                    <span className="font-medium text-[#102A35]">Startup:</span>{' '}
                    <span className="text-[#087C80] font-semibold">{startupName || '(Not specified)'}</span>
                  </p>
                  {professionalTitle && (
                    <p>
                      <span className="font-medium text-[#102A35]">Title:</span> {professionalTitle}
                    </p>
                  )}
                  {companyStage && (
                    <p>
                      <span className="font-medium text-[#102A35]">Stage:</span> {companyStage}
                    </p>
                  )}
                  {(city || country) && (
                    <p>
                      <span className="font-medium text-[#102A35]">Location:</span>{' '}
                      {[city, country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
                to="/founder"
                className="text-xs font-medium text-[#52656B] hover:text-[#102A35] transition-colors"
              >
                Cancel
              </Link>
            )}

            <div className="flex items-center space-x-3">
              {step < 3 ? (
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
                      <span>Save &amp; Enter Workspace</span>
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

export const FounderOnboardingPage: React.FC = () => {
  const { profileData, isLoading: isLoadingProfile } = useProfile();

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[#F6F5ED]">
        <Loader2 className="h-8 w-8 animate-spin text-[#087C80] mb-4" />
        <p className="text-sm text-[#52656B] font-medium">Loading onboarding details...</p>
      </div>
    );
  }

  const initialProfile = (profileData?.role === 'founder' ? profileData.profile : null) as FounderProfile | null;

  return <FounderOnboardingWizard initialProfile={initialProfile} />;
};
