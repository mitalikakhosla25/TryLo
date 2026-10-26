import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStartup, useUpdateStartup } from '../context/useStartups';
import { COMPANY_STAGES, SUGGESTED_INTERESTS, isValidUrl, normalizeWebUrl } from '../api/profile';
import { type Startup, INDIAN_STATES_AND_UTS } from '../api/startups';
import {
  Building2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Globe,
  MapPin,
  Calendar,
  Image,
  RefreshCw,
} from 'lucide-react';
import { StartupAvatar } from '../components/ui/StartupAvatar';

interface StartupEditFormProps {
  startup: Startup;
}

const StartupEditForm: React.FC<StartupEditFormProps> = ({ startup }) => {
  const navigate = useNavigate();
  const updateStartupMutation = useUpdateStartup(startup.id);

  const [formData, setFormData] = useState({
    name: startup.name || '',
    tagline: startup.tagline || '',
    description: startup.description || '',
    industry: startup.industry || '',
    company_stage: startup.company_stage || 'MVP',
    website_url: startup.website_url || '',
    logo_url: startup.logo_url || '',
    city: startup.city || '',
    state: startup.state || '',
    country: startup.country || '',
    founded_year: startup.founded_year ? startup.founded_year.toString() : '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate name
    if (!formData.name.trim()) {
      setValidationError('Startup name is required.');
      return;
    }
    if (formData.name.trim().length < 2) {
      setValidationError('Startup name must be at least 2 characters.');
      return;
    }

    // Validate and normalize URLs
    const normalizedWebsiteUrl = formData.website_url.trim()
      ? normalizeWebUrl(formData.website_url)
      : null;
    const normalizedLogoUrl = formData.logo_url.trim()
      ? normalizeWebUrl(formData.logo_url)
      : null;

    if (normalizedWebsiteUrl && !isValidUrl(normalizedWebsiteUrl)) {
      setValidationError('Website URL must be a valid web URL (e.g. https://example.com).');
      return;
    }
    if (normalizedLogoUrl && !isValidUrl(normalizedLogoUrl)) {
      setValidationError('Logo URL must be a valid image URL (e.g. https://example.com/logo.png).');
      return;
    }

    // Validate Founded Year
    let parsedYear: number | null = null;
    if (formData.founded_year.trim()) {
      parsedYear = parseInt(formData.founded_year.trim(), 10);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
        setValidationError('Founded year must be between 1900 and 2100.');
        return;
      }
    }

    try {
      const payload = {
        name: formData.name.trim(),
        tagline: formData.tagline.trim() || null,
        description: formData.description.trim() || null,
        industry: formData.industry.trim() || null,
        company_stage: formData.company_stage || null,
        website_url: normalizedWebsiteUrl,
        logo_url: normalizedLogoUrl,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || null,
        founded_year: parsedYear,
      };

      await updateStartupMutation.mutateAsync(payload);
      setSuccessMessage('Startup updated successfully!');
      setTimeout(() => {
        navigate(`/founder/startups/${startup.id}`);
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update startup.';
      setValidationError(message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Breadcrumb / Back */}
        <div className="flex items-center space-x-2 text-xs text-[#52656B]">
          <Link
            to={`/founder/startups/${startup.id}`}
            className="inline-flex items-center space-x-1 text-[#52656B] hover:text-[#102A35] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Startup</span>
          </Link>
          <span>/</span>
          <span className="text-[#102A35] font-semibold">Edit {startup.name}</span>
        </div>

        {/* Header */}
        <div className="space-y-1.5 pb-4 border-b border-[#DCE7E3]">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
              Edit Venture
            </span>
            <span className="text-xs text-[#52656B]">&bull;</span>
            <span className="text-xs font-mono text-[#102A35] bg-white px-2.5 py-0.5 rounded-md border border-[#DCE7E3]">
              slug: {startup.slug}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">Edit Startup</h1>
          <p className="text-xs sm:text-sm text-[#52656B]">
            Update company details, pitch summary, and discovery information.
          </p>
        </div>

        {/* Alert Banners */}
        {validationError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start space-x-3">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-[#E6F7F0] border border-[#B6EDD5] text-xs sm:text-sm text-[#0E7C57] flex items-start space-x-3">
            <CheckCircle2 className="h-4 w-4 text-[#0E7C57] shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#DCE7E3] space-y-6 shadow-sm">
            {/* Startup Name */}
            <div className="space-y-1.5">
              <label htmlFor="startup-name" className="block text-xs font-semibold text-[#102A35]">
                Startup Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-[#087C80]" />
                <input
                  id="startup-name"
                  name="name"
                  type="text"
                  required
                  maxLength={200}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label htmlFor="startup-tagline" className="block text-xs font-semibold text-[#102A35]">
                Tagline (One-liner)
              </label>
              <input
                id="startup-tagline"
                name="tagline"
                type="text"
                maxLength={255}
                placeholder="e.g. High-efficiency micro-turbines for clean distributed energy"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="startup-description" className="block text-xs font-semibold text-[#102A35]">
                Description
              </label>
              <textarea
                id="startup-description"
                name="description"
                rows={4}
                placeholder="Describe your product, value proposition, and the target users you are building for..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all resize-y"
              />
            </div>

            {/* Stage & Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="company-stage" className="block text-xs font-semibold text-[#102A35]">
                  Company Stage
                </label>
                <select
                  id="company-stage"
                  name="company_stage"
                  value={formData.company_stage}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                >
                  {COMPANY_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="startup-industry" className="block text-xs font-semibold text-[#102A35]">
                  Industry
                </label>
                <input
                  id="startup-industry"
                  name="industry"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. CleanTech, Developer Tools"
                  value={formData.industry}
                  onChange={handleChange}
                  list="industry-suggestions"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                />
                <datalist id="industry-suggestions">
                  {SUGGESTED_INTERESTS.map((ind) => (
                    <option key={ind} value={ind} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Website URL & Logo URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="startup-website" className="block text-xs font-semibold text-[#102A35]">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 h-4 w-4 text-[#087C80]" />
                  <input
                    id="startup-website"
                    name="website_url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website_url}
                    onChange={handleChange}
                    onBlur={() => {
                      if (formData.website_url.trim()) {
                        setFormData((prev) => ({ ...prev, website_url: normalizeWebUrl(prev.website_url) }));
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="startup-logo" className="block text-xs font-semibold text-[#102A35]">
                    Logo URL (Optional)
                  </label>
                  <span className="text-[11px] text-[#52656B]">
                    Leave blank to use an Alphabet Monogram
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Image className="absolute left-3.5 top-3 h-4 w-4 text-[#087C80]" />
                    <input
                      id="startup-logo"
                      name="logo_url"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logo_url}
                      onChange={handleChange}
                      onBlur={() => {
                        if (formData.logo_url.trim()) {
                          setFormData((prev) => ({ ...prev, logo_url: normalizeWebUrl(prev.logo_url) }));
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                    />
                  </div>
                  {/* Live Avatar / Monogram Preview */}
                  <div className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 bg-[#F6F5ED] border border-[#DCE7E3] rounded-xl" title="Live Logo / Monogram Preview">
                    <StartupAvatar
                      name={formData.name || startup.name}
                      logoUrl={formData.logo_url}
                      size="sm"
                      shape="square"
                    />
                    <span className="text-[10px] font-bold text-[#52656B] hidden sm:inline">Preview</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Founded Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="startup-city" className="block text-xs font-semibold text-[#102A35]">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-[#087C80]" />
                  <input
                    id="startup-city"
                    name="city"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="startup-state" className="block text-xs font-semibold text-[#102A35]">
                  State / UT (India)
                </label>
                <select
                  id="startup-state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                >
                  <option value="">-- None / Outside India --</option>
                  {INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="startup-country" className="block text-xs font-semibold text-[#102A35]">
                  Country
                </label>
                <input
                  id="startup-country"
                  name="country"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. India"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="startup-year" className="block text-xs font-semibold text-[#102A35]">
                  Founded Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-[#087C80]" />
                  <input
                    id="startup-year"
                    name="founded_year"
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2025"
                    value={formData.founded_year}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#DCE7E3] rounded-xl text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:border-[#087C80] focus:ring-2 focus:ring-[#087C80]/15 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to={`/founder/startups/${startup.id}`}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-[#52656B] hover:text-[#102A35] transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              id="save-startup-btn"
              disabled={updateStartupMutation.isPending}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#07545A] hover:bg-[#087C80] disabled:opacity-50 text-white shadow-xs transition-all"
            >
              {updateStartupMutation.isPending ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StartupEditPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { data: startup, isLoading, isError, error, refetch } = useStartup(startupId);

  if (isLoading) {
    return (
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-6 bg-[#F6F5ED]">
        <div className="h-6 w-32 bg-[#EFEFE5] rounded animate-pulse"></div>
        <div className="h-96 rounded-3xl bg-white border border-[#DCE7E3] animate-pulse"></div>
      </div>
    );
  }

  if (isError || !startup) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4 bg-[#F6F5ED]">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#102A35]">Startup Not Found</h2>
        <p className="text-xs sm:text-sm text-[#52656B]">
          {error?.message || 'The requested startup could not be loaded or you do not have permission to edit it.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] hover:bg-[#F6F5ED] text-[#102A35] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
          <Link
            to="/founder/startups"
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-semibold bg-[#07545A] hover:bg-[#087C80] text-white transition-colors"
          >
            <span>Back to My Startups</span>
          </Link>
        </div>
      </div>
    );
  }

  return <StartupEditForm key={startup.id} startup={startup} />;
};
