import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useProfile } from '../context/useProfile';
import {
  COMPANY_STAGES,
  EXPERIENCE_LEVELS,
  SUGGESTED_SKILLS,
  SUGGESTED_INTERESTS,
  SUGGESTED_DEVICES,
  isValidUrl,
  isValidLinkedInUrl,
  type FounderProfile,
  type TesterProfile,
  type ExperienceLevel,
  type ProfileMeResponse,
} from '../api/profile';
import {
  User,
  Building,
  Globe,
  MapPin,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';

interface ProfileManagementContentProps {
  profileData: ProfileMeResponse;
  user: ReturnType<typeof useAuth>['user'];
}

const ProfileManagementContent: React.FC<ProfileManagementContentProps> = ({ profileData, user }) => {
  const { updateProfile, isUpdating } = useProfile();

  const isFounder = user?.role === 'founder';
  const fp = isFounder ? (profileData.profile as FounderProfile | null) : null;
  const tp = !isFounder ? (profileData.profile as TesterProfile | null) : null;

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Founder Form State
  const [startupName, setStartupName] = useState<string>(() => fp?.startup_name || '');
  const [professionalTitle, setProfessionalTitle] = useState<string>(() => fp?.professional_title || '');
  const [industry, setIndustry] = useState<string>(() => fp?.industry || '');
  const [companyStage, setCompanyStage] = useState<string>(() => fp?.company_stage || 'MVP');
  const [startupDescription, setStartupDescription] = useState<string>(() => fp?.startup_description || '');
  const [websiteUrl, setWebsiteUrl] = useState<string>(() => fp?.website_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState<string>(() => fp?.linkedin_url || '');
  const [city, setCity] = useState<string>(() => (fp ? fp.city : tp?.city) || '');
  const [country, setCountry] = useState<string>(() => (fp ? fp.country : tp?.country) || '');

  // Tester Form State
  const [bio, setBio] = useState<string>(() => tp?.bio || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    () => (tp?.experience_level as ExperienceLevel) || 'Intermediate'
  );
  const [skills, setSkills] = useState<string[]>(() => tp?.skills || []);
  const [interests, setInterests] = useState<string[]>(() => tp?.interests || []);
  const [devices, setDevices] = useState<string[]>(() => tp?.devices || []);
  const [testerLinkedinUrl, setTesterLinkedinUrl] = useState<string>(() => tp?.linkedin_url || '');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSaveFounder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    const errs: Record<string, string> = {};
    if (!startupName.trim()) {
      errs.startupName = 'Startup name is required.';
    }
    if (websiteUrl.trim() && !isValidUrl(websiteUrl)) {
      errs.websiteUrl = 'Please enter a valid website URL.';
    }
    if (linkedinUrl.trim() && !isValidLinkedInUrl(linkedinUrl)) {
      errs.linkedinUrl = 'Please enter a valid LinkedIn URL.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

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
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  const handleSaveTester = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    const errs: Record<string, string> = {};
    if (!bio.trim() || bio.trim().length < 10) {
      errs.bio = 'Bio is required and must be at least 10 characters.';
    }
    if (skills.length === 0) {
      errs.skills = 'Please select at least 1 skill.';
    }
    if (interests.length === 0) {
      errs.interests = 'Please select at least 1 interest.';
    }
    if (testerLinkedinUrl.trim() && !isValidLinkedInUrl(testerLinkedinUrl)) {
      errs.linkedinUrl = 'Please enter a valid LinkedIn URL.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      await updateProfile({
        bio: bio.trim(),
        experience_level: experienceLevel || null,
        skills,
        interests,
        devices,
        city: city.trim() || null,
        country: country.trim() || null,
        linkedin_url: testerLinkedinUrl.trim() || null,
      });
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  const workspacePath = isFounder ? '/founder' : '/tester';
  const isComplete = profileData.is_complete;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          to={workspacePath}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to {isFounder ? 'Founder' : 'Tester'} Workspace</span>
        </Link>

        <div className="flex items-center space-x-2">
          {isComplete ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Profile Complete</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Incomplete Profile</span>
            </span>
          )}
        </div>
      </div>

      {/* Profile Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900/40 border border-indigo-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {user?.full_name}
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>{user?.email}</span>
              <span>&bull;</span>
              <span className="capitalize text-indigo-300 font-semibold">{user?.role}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={() => {
                setIsEditing(true);
                setSaveSuccess(false);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setErrorMessage(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VIEW MODE: FOUNDER */}
      {!isEditing && isFounder && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5 text-indigo-400">
                <Building className="h-5 w-5" />
                <h2 className="text-base font-bold text-white">Startup Overview</h2>
              </div>
              {fp?.company_stage && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {fp.company_stage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Startup / Product Name</span>
                <span className="text-base font-semibold text-white">
                  {fp?.startup_name || '(Not set yet)'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Professional Title</span>
                <span className="text-sm font-medium text-slate-200">
                  {fp?.professional_title || '(Not set)'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Industry</span>
                <span className="text-sm font-medium text-slate-200">
                  {fp?.industry || '(Not set)'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Location</span>
                <span className="text-sm font-medium text-slate-200 flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {[fp?.city, fp?.country].filter(Boolean).join(', ') || '(Not set)'}
                  </span>
                </span>
              </div>
            </div>

            {fp?.startup_description && (
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500 block mb-1">Startup Description</span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {fp.startup_description}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-4">
              {fp?.website_url && (
                <a
                  href={fp.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{fp.website_url}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {fp?.linkedin_url && (
                <a
                  href={fp.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white transition-colors bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60"
                >
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: TESTER */}
      {!isEditing && !isFounder && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5 text-violet-400">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-base font-bold text-white">Tester Overview</h2>
              </div>
              {tp?.experience_level && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  {tp.experience_level}
                </span>
              )}
            </div>

            {/* Bio */}
            <div>
              <span className="text-xs text-slate-500 block mb-1">Introduction &amp; Bio</span>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                {tp?.bio || '(No bio provided yet)'}
              </p>
            </div>

            {/* Skills */}
            <div>
              <span className="text-xs text-slate-500 block mb-2">Testing Skills</span>
              <div className="flex flex-wrap gap-2">
                {tp?.skills && tp.skills.length > 0 ? (
                  tp.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">(No skills selected)</span>
                )}
              </div>
            </div>

            {/* Interests */}
            <div>
              <span className="text-xs text-slate-500 block mb-2">Product Categories of Interest</span>
              <div className="flex flex-wrap gap-2">
                {tp?.interests && tp.interests.length > 0 ? (
                  tp.interests.map((it) => (
                    <span
                      key={it}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                    >
                      {it}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">(No interests selected)</span>
                )}
              </div>
            </div>

            {/* Devices */}
            <div>
              <span className="text-xs text-slate-500 block mb-2">Testing Hardware &amp; Platforms</span>
              <div className="flex flex-wrap gap-2">
                {tp?.devices && tp.devices.length > 0 ? (
                  tp.devices.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    >
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">(No devices specified)</span>
                )}
              </div>
            </div>

            {/* Location & Links */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {[tp?.city, tp?.country].filter(Boolean).join(', ') || 'Location not specified'}
                </span>
              </div>

              {tp?.linkedin_url && (
                <a
                  href={tp.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white transition-colors bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60"
                >
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE: FOUNDER */}
      {isEditing && isFounder && (
        <form onSubmit={handleSaveFounder} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-white pb-2 border-b border-slate-800">
            Edit Founder Profile
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Startup / Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
              />
              {errors.startupName && <p className="text-xs text-rose-400">{errors.startupName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Professional Title
                </label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">Company Stage</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMPANY_STAGES.map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setCompanyStage(stg)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      companyStage === stg
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">Short Description</label>
              <textarea
                rows={3}
                value={startupDescription}
                onChange={(e) => setStartupDescription(e.target.value)}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
                />
                {errors.websiteUrl && <p className="text-xs text-rose-400">{errors.websiteUrl}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
                />
                {errors.linkedinUrl && <p className="text-xs text-rose-400">{errors.linkedinUrl}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* EDIT MODE: TESTER */}
      {isEditing && !isFounder && (
        <form onSubmit={handleSaveTester} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-white pb-2 border-b border-slate-800">
            Edit Tester Profile
          </h2>

          <div className="space-y-5">
            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Short Bio <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-violet-500 text-white focus:outline-none"
              />
              {errors.bio && <p className="text-xs text-rose-400">{errors.bio}</p>}
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">Experience Level</label>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      experienceLevel === lvl
                        ? 'bg-violet-600/20 border-violet-500 text-white font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Testing Skills <span className="text-rose-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSelection(skill, skills, setSkills)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-violet-600/25 border-violet-500 text-violet-200 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-violet-400" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
              {errors.skills && <p className="text-xs text-rose-400">{errors.skills}</p>}
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Product Categories <span className="text-rose-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_INTERESTS.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleSelection(interest, interests, setInterests)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
              {errors.interests && <p className="text-xs text-rose-400">{errors.interests}</p>}
            </div>

            {/* Devices */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Devices &amp; Platforms
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
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                      <span>{dev}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location & LinkedIn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-violet-500 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-violet-500 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">LinkedIn Profile URL</label>
              <input
                type="url"
                value={testerLinkedinUrl}
                onChange={(e) => setTesterLinkedinUrl(e.target.value)}
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-950/70 border border-slate-800 focus:border-violet-500 text-white focus:outline-none"
              />
              {errors.linkedinUrl && <p className="text-xs text-rose-400">{errors.linkedinUrl}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export const ProfileManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { profileData, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-300 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (isError || !profileData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 space-y-4 shadow-xl">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Error Loading Profile</h2>
          <p className="text-xs text-slate-400">
            {error instanceof Error ? error.message : 'Unable to connect to profile service.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProfileManagementContent
      key={user?.id + '-' + (profileData.profile?.updated_at || 'new')}
      profileData={profileData}
      user={user}
    />
  );
};
