import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStartup, useUpdateStartup } from '../context/useStartups';
import { COMPANY_STAGES, SUGGESTED_INTERESTS, isValidUrl } from '../api/profile';
import { type Startup, INDIAN_STATES_AND_UTS } from '../api/startups';
import {
  Building,
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

    // Validate URLs
    if (formData.website_url && !isValidUrl(formData.website_url)) {
      setValidationError('Website URL must start with http:// or https://');
      return;
    }
    if (formData.logo_url && !isValidUrl(formData.logo_url)) {
      setValidationError('Logo URL must start with http:// or https://');
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
        website_url: formData.website_url.trim() || null,
        logo_url: formData.logo_url.trim() || null,
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
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb / Back */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link
          to={`/founder/startups/${startup.id}`}
          className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Startup</span>
        </Link>
        <span>/</span>
        <span className="text-slate-200">Edit {startup.name}</span>
      </div>

      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6338E8]/20 text-[#a88bff] border border-[#6338E8]/40">
            Edit Venture
          </span>
          <span className="text-xs text-slate-500">&bull;</span>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            slug: {startup.slug}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Edit Startup</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Update company details, pitch summary, and discovery information.
        </p>
      </div>

      {/* Alert Banners */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-start space-x-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
          {/* Startup Name */}
          <div className="space-y-1.5">
            <label htmlFor="startup-name" className="block text-xs font-semibold text-slate-200">
              Startup Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="startup-name"
                name="name"
                type="text"
                required
                maxLength={200}
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <label htmlFor="startup-tagline" className="block text-xs font-semibold text-slate-200">
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
              className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="startup-description" className="block text-xs font-semibold text-slate-200">
              Description
            </label>
            <textarea
              id="startup-description"
              name="description"
              rows={4}
              placeholder="Describe your product, value proposition, and the target users you are building for..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all resize-y"
            />
          </div>

          {/* Stage & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="company-stage" className="block text-xs font-semibold text-slate-200">
                Company Stage
              </label>
              <select
                id="company-stage"
                name="company_stage"
                value={formData.company_stage}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
              >
                {COMPANY_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="startup-industry" className="block text-xs font-semibold text-slate-200">
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
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
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
              <label htmlFor="startup-website" className="block text-xs font-semibold text-slate-200">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="startup-website"
                  name="website_url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="startup-logo" className="block text-xs font-semibold text-slate-200">
                Logo URL (Optional)
              </label>
              <div className="relative">
                <Image className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="startup-logo"
                  name="logo_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Location & Founded Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startup-city" className="block text-xs font-semibold text-slate-200">
                City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="startup-city"
                  name="city"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Bengaluru"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="startup-state" className="block text-xs font-semibold text-slate-200">
                State / UT (India)
              </label>
              <select
                id="startup-state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
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
              <label htmlFor="startup-country" className="block text-xs font-semibold text-slate-200">
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
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="startup-year" className="block text-xs font-semibold text-slate-200">
                Founded Year
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="startup-year"
                  name="founded_year"
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="2025"
                  value={formData.founded_year}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to={`/founder/startups/${startup.id}`}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            id="save-startup-btn"
            disabled={updateStartupMutation.isPending}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#6338E8] hover:bg-[#522ecc] disabled:bg-[#6338E8]/50 text-white shadow-lg shadow-[#6338E8]/25 transition-all"
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
  );
};

export const StartupEditPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const { data: startup, isLoading, isError, error, refetch } = useStartup(startupId);

  if (isLoading) {
    return (
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-6">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse"></div>
        <div className="h-96 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
      </div>
    );
  }

  if (isError || !startup) {
    return (
      <div className="flex-1 py-12 px-4 max-w-xl mx-auto text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Startup Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {error?.message || 'The requested startup could not be loaded or you do not have permission to edit it.'}
        </p>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
          <Link
            to="/founder/startups"
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-colors"
          >
            <span>Back to My Startups</span>
          </Link>
        </div>
      </div>
    );
  }

  return <StartupEditForm key={startup.id} startup={startup} />;
};
