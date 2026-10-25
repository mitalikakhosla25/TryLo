import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Calendar,
  Coins,
  Gift,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { usePublicCampaigns } from '../context/useCampaigns';
import { useMyApplications } from '../context/useApplications';
import type { PublicCampaignFilters, CampaignPublic } from '../api/campaigns';

const CATEGORY_OPTIONS = [
  'All Categories',
  'Web App',
  'iOS App',
  'Android App',
  'Desktop App',
  'API / Developer Tool',
  'Other',
];

const REWARD_OPTIONS = [
  { label: 'All Rewards', value: '' },
  { label: 'Paid / Monetary ($)', value: 'monetary' },
  { label: 'Perks & Licenses', value: 'perk' },
  { label: 'Volunteer Testing', value: 'unpaid' },
];

const EXPERIENCE_OPTIONS = [
  'All Levels',
  'Beginner',
  'Intermediate',
  'Advanced',
];

const DEVICE_OPTIONS = [
  'All Devices',
  'Web',
  'iOS',
  'Android',
  'macOS',
  'Windows',
  'Linux',
];

export const TesterDiscoverPage: React.FC = () => {
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedReward, setSelectedReward] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('All Levels');
  const [selectedDevice, setSelectedDevice] = useState('All Devices');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'deadline'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Construct query payload
  const activeFilters = useMemo<PublicCampaignFilters>(() => {
    const filters: PublicCampaignFilters = {
      page: currentPage,
      page_size: 9,
      sort: selectedSort,
    };
    if (debouncedSearch.trim()) filters.q = debouncedSearch.trim();
    if (selectedCategory !== 'All Categories') filters.category = selectedCategory;
    if (selectedReward) filters.reward_type = selectedReward;
    if (selectedExperience !== 'All Levels') filters.experience_level = selectedExperience;
    if (selectedDevice !== 'All Devices') filters.device = selectedDevice;
    return filters;
  }, [
    debouncedSearch,
    selectedCategory,
    selectedReward,
    selectedExperience,
    selectedDevice,
    selectedSort,
    currentPage,
  ]);

  const { data, isLoading, isError, error, refetch, isFetching } = usePublicCampaigns(activeFilters);

  // Single query for tester's submitted applications to efficiently mark Applied status
  const { data: myApps } = useMyApplications();
  const appliedIds = useMemo(() => new Set((myApps || []).map((a) => a.campaign_id)), [myApps]);

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
    selectedCategory !== 'All Categories' ||
    selectedReward ||
    selectedExperience !== 'All Levels' ||
    selectedDevice !== 'All Devices'
  );

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategory('All Categories');
    setSelectedReward('');
    setSelectedExperience('All Levels');
    setSelectedDevice('All Devices');
    setSelectedSort('newest');
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleRewardChange = (rew: string) => {
    setSelectedReward(rew);
    setCurrentPage(1);
  };

  const handleExperienceChange = (exp: string) => {
    setSelectedExperience(exp);
    setCurrentPage(1);
  };

  const handleDeviceChange = (dev: string) => {
    setSelectedDevice(dev);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'newest' | 'deadline') => {
    setSelectedSort(sort);
    setCurrentPage(1);
  };

  const campaigns = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#131127] to-slate-900 border border-violet-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6338E8]/15 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30">
            <Sparkles className="h-3.5 w-3.5 text-[#FFC928]" />
            <span>Discover Early Beta Opportunities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Find Products to Test &amp; Shape
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Browse real, active beta testing campaigns published by innovative startups. Filter by platform, reward terms, and experience criteria.
          </p>
        </div>
      </div>

      {/* Search and Main Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="tester-campaign-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by product name, keywords, tasks, or startup..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#6338E8] focus:ring-1 focus:ring-[#6338E8] transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 hidden md:inline">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value as 'newest' | 'deadline')}
              id="tester-sort-select"
              className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#6338E8] transition-colors"
            >
              <option value="newest">Newest Campaigns</option>
              <option value="deadline">Application Deadline Soonest</option>
            </select>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`sm:hidden inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                isFilterDrawerOpen || hasActiveFilters
                  ? 'bg-[#6338E8] text-white border-[#6338E8]'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Desktop Filter Pills / Dropdowns */}
        <div className={`sm:flex flex-wrap items-center gap-2.5 pt-1 ${isFilterDrawerOpen ? 'flex' : 'hidden sm:flex'}`}>
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              id="tester-category-select"
              className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6338E8]"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reward Type Dropdown */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedReward}
              onChange={(e) => handleRewardChange(e.target.value)}
              id="tester-reward-select"
              className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6338E8]"
            >
              {REWARD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level Dropdown */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedExperience}
              onChange={(e) => handleExperienceChange(e.target.value)}
              id="tester-experience-select"
              className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6338E8]"
            >
              {EXPERIENCE_OPTIONS.map((exp) => (
                <option key={exp} value={exp}>
                  {exp}
                </option>
              ))}
            </select>
          </div>

          {/* Device Dropdown */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedDevice}
              onChange={(e) => handleDeviceChange(e.target.value)}
              id="tester-device-select"
              className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#6338E8]"
            >
              {DEVICE_OPTIONS.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              id="tester-clear-filters-btn"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All Filters</span>
            </button>
          )}

          {isFetching && (
            <span className="text-[11px] text-slate-400 animate-pulse ml-auto">
              Updating results...
            </span>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Active filters:</span>
          {debouncedSearch && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
              <span>Query: "{debouncedSearch}"</span>
              <button onClick={() => setSearchInput('')} className="hover:text-rose-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedCategory !== 'All Categories' && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
              <span>Category: {selectedCategory}</span>
              <button onClick={() => handleCategoryChange('All Categories')} className="hover:text-rose-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedReward && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 capitalize">
              <span>Reward: {selectedReward}</span>
              <button onClick={() => handleRewardChange('')} className="hover:text-rose-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedExperience !== 'All Levels' && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
              <span>Level: {selectedExperience}</span>
              <button onClick={() => handleExperienceChange('All Levels')} className="hover:text-rose-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedDevice !== 'All Devices' && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
              <span>Device: {selectedDevice}</span>
              <button onClick={() => handleDeviceChange('All Devices')} className="hover:text-rose-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Campaigns Feed / Loading / Error / Empty States */}
      <div>
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-4 animate-pulse h-72"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-slate-800/60 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-800/60 rounded w-full" />
                  <div className="h-3.5 bg-slate-800/60 rounded w-5/6" />
                </div>
                <div className="pt-4 border-t border-slate-800/60 flex justify-between">
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error State */
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Failed to Load Opportunities</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {error?.message || 'A network error occurred while querying published campaigns.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Discovery</span>
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          /* Empty States */
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xl">
            <div className="h-16 w-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="h-8 w-8 text-[#FFC928]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-white">
                {hasActiveFilters ? 'No Matching Testing Campaigns' : 'No Active Beta Campaigns Right Now'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {hasActiveFilters
                  ? 'No published campaigns match all the selected search and filter criteria. Try adjusting or clearing your filters.'
                  : 'Startups publish new beta testing campaigns regularly. Keep your tester profile updated to qualify when new apps go live!'}
              </p>
            </div>

            {hasActiveFilters ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6338E8] text-white hover:bg-[#522ecc] transition-colors shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <span>Review Your Tester Profile</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Campaign Cards Grid */
          <div className="space-y-8">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
              <span>
                Showing <strong className="text-white">{campaigns.length}</strong> of{' '}
                <strong className="text-white">{totalItems}</strong> opportunities
              </span>
              <span>
                Page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  isApplied={appliedIds.has(camp.id)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#6338E8] text-white shadow-md'
                            : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface CampaignCardProps {
  campaign: CampaignPublic;
  isApplied?: boolean;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, isApplied }) => {
  const targetDevices = campaign.target_audience?.devices || [];
  const experienceLevel = campaign.target_audience?.experience_level;

  const detailUrl = campaign.startup_slug && campaign.slug
    ? `/campaigns/${campaign.startup_slug}/${campaign.slug}`
    : `/campaigns/p/${campaign.id}`;

  return (
    <Link
      to={detailUrl}
      className={`group flex flex-col rounded-2xl bg-slate-900/85 hover:bg-slate-900 border p-5 space-y-4 transition-all duration-200 hover:shadow-xl hover:shadow-violet-950/20 hover:-translate-y-0.5 ${
        isApplied
          ? 'border-emerald-500/30 hover:border-emerald-500/50'
          : 'border-slate-800/80 hover:border-violet-500/40'
      }`}
    >
      {/* Top Header: Startup Info & Product Type */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          {campaign.startup_logo_url ? (
            <img
              src={campaign.startup_logo_url}
              alt={campaign.startup_name}
              className="h-9 w-9 rounded-xl object-cover border border-slate-700/60"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {campaign.startup_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
              {campaign.startup_name}
            </h4>
            <span className="text-[11px] text-slate-400">
              {campaign.product_type || 'Software Product'}
            </span>
          </div>
        </div>

        {/* Badges Container */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {isApplied && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#17865B]/15 text-[#17865B] border border-[#17865B]/30">
              <CheckCircle2 className="h-3 w-3" />
              <span>Applied</span>
            </span>
          )}

          {/* Reward Badge */}
          {campaign.reward_type === 'monetary' && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Coins className="h-3 w-3" />
              <span>${campaign.reward_amount} {campaign.reward_currency || 'USD'}</span>
            </span>
          )}
          {campaign.reward_type === 'perk' && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Gift className="h-3 w-3" />
              <span>Perk Reward</span>
            </span>
          )}
          {campaign.reward_type === 'unpaid' && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <span>Volunteer</span>
            </span>
          )}
        </div>
      </div>

      {/* Campaign Title & Summary */}
      <div className="space-y-1.5 flex-1">
        <h3 className="text-base font-extrabold text-white group-hover:text-violet-200 transition-colors line-clamp-2">
          {campaign.title}
        </h3>
        {campaign.summary ? (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {campaign.summary}
          </p>
        ) : campaign.description ? (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>
        ) : null}
      </div>

      {/* Criteria Tags: Level and Platforms */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {experienceLevel && (
          <span className="inline-flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
            <Award className="h-2.5 w-2.5" />
            <span>{experienceLevel}</span>
          </span>
        )}

        {targetDevices.slice(0, 3).map((device) => (
          <span
            key={device}
            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
          >
            {device}
          </span>
        ))}
        {targetDevices.length > 3 && (
          <span className="text-[10px] text-slate-500">
            +{targetDevices.length - 3}
          </span>
        )}
      </div>

      {/* Footer Info: Tasks count, deadline, and view action */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-3">
          {campaign.application_deadline ? (
            <span className="inline-flex items-center space-x-1 text-slate-300" title="Application Deadline">
              <Calendar className="h-3 w-3 text-violet-400" />
              <span>Due {new Date(campaign.application_deadline).toLocaleDateString()}</span>
            </span>
          ) : (
            <span className="text-slate-400">Rolling Admission</span>
          )}

          {campaign.testing_tasks && campaign.testing_tasks.length > 0 && (
            <span>&bull; {campaign.testing_tasks.length} {campaign.testing_tasks.length === 1 ? 'task' : 'tasks'}</span>
          )}
        </div>

        <span
          className={`inline-flex items-center space-x-1 text-xs font-semibold group-hover:translate-x-0.5 transition-all ${
            isApplied
              ? 'text-[#17865B] group-hover:text-emerald-300'
              : 'text-violet-400 group-hover:text-violet-300'
          }`}
        >
          <span>{isApplied ? 'Applied' : 'View'}</span>
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
};
