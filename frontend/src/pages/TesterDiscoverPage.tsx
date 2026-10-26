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
    <div className="min-h-[calc(100vh-140px)] bg-[#F6F5ED] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#DCE7E3] p-6 sm:p-10 shadow-xs">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
              <Sparkles className="h-3.5 w-3.5 text-[#07545A]" />
              <span>Discover Early Beta Opportunities</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102A35]">
              Find Products to Test &amp; Shape
            </h1>
            <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
              Browse real, active beta testing campaigns published by innovative startups. Filter by platform, reward terms, and experience criteria.
            </p>
          </div>
        </div>

        {/* Search and Main Filters Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52656B]" />
              <input
                type="text"
                id="tester-campaign-search-input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by product name, keywords, tasks, or startup..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#DCE7E3] text-[#102A35] placeholder-[#52656B]/60 text-xs sm:text-sm focus:outline-none focus:border-[#087C80] shadow-xs transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52656B] hover:text-[#102A35]"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#52656B] hidden md:inline">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value as 'newest' | 'deadline')}
                id="tester-sort-select"
                className="bg-white border border-[#DCE7E3] text-[#102A35] text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#087C80] shadow-xs transition-colors"
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
                    ? 'bg-[#07545A] text-white border-[#07545A]'
                    : 'bg-white border-[#DCE7E3] text-[#102A35]'
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
                className="bg-white border border-[#DCE7E3] text-[#102A35] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#087C80] shadow-xs"
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
                className="bg-white border border-[#DCE7E3] text-[#102A35] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#087C80] shadow-xs"
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
                className="bg-white border border-[#DCE7E3] text-[#102A35] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#087C80] shadow-xs"
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
                className="bg-white border border-[#DCE7E3] text-[#102A35] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#087C80] shadow-xs"
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
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset All Filters</span>
              </button>
            )}

            {isFetching && (
              <span className="text-[11px] text-[#52656B] animate-pulse ml-auto">
                Updating results...
              </span>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#52656B] text-[11px] mr-1">Active filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35]">
                <span>Query: "{debouncedSearch}"</span>
                <button onClick={() => setSearchInput('')} className="hover:text-rose-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedCategory !== 'All Categories' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35]">
                <span>Category: {selectedCategory}</span>
                <button onClick={() => handleCategoryChange('All Categories')} className="hover:text-rose-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedReward && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35] capitalize">
                <span>Reward: {selectedReward}</span>
                <button onClick={() => handleRewardChange('')} className="hover:text-rose-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedExperience !== 'All Levels' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35]">
                <span>Level: {selectedExperience}</span>
                <button onClick={() => handleExperienceChange('All Levels')} className="hover:text-rose-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedDevice !== 'All Devices' && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#EFEFE5] border border-[#DCE7E3] text-[#102A35]">
                <span>Device: {selectedDevice}</span>
                <button onClick={() => handleDeviceChange('All Devices')} className="hover:text-rose-600">
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
                  className="rounded-3xl bg-white border border-[#DCE7E3] p-6 space-y-4 animate-pulse h-72 shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#EFEFE5]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-[#EFEFE5] rounded w-1/2" />
                      <div className="h-3 bg-[#EFEFE5]/60 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-6 bg-[#EFEFE5] rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3.5 bg-[#EFEFE5]/60 rounded w-full" />
                    <div className="h-3.5 bg-[#EFEFE5]/60 rounded w-5/6" />
                  </div>
                  <div className="pt-4 border-t border-[#DCE7E3] flex justify-between">
                    <div className="h-4 bg-[#EFEFE5] rounded w-1/4" />
                    <div className="h-4 bg-[#EFEFE5] rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            /* Error State */
            <div className="rounded-3xl bg-rose-50 border border-rose-200 p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A35]">Failed to Load Opportunities</h3>
              <p className="text-xs sm:text-sm text-rose-800">
                {error?.message || 'A network error occurred while querying published campaigns.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Discovery</span>
              </button>
            </div>
          ) : campaigns.length === 0 ? (
            /* Empty States */
            <div className="rounded-3xl bg-white border border-dashed border-[#DCE7E3] p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="h-16 w-16 rounded-3xl bg-[#D7EFEB] border border-[#BCE1DA] text-[#07545A] flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-[#07545A]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-[#102A35]">
                  {hasActiveFilters ? 'No Matching Testing Campaigns' : 'No Active Beta Campaigns Right Now'}
                </h3>
                <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
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
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors shadow-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <Link
                    to="/profile"
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#EFEFE5] hover:bg-[#DCE7E3] text-[#102A35] border border-[#DCE7E3] transition-colors"
                  >
                    <span>Review Your Tester Profile</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Campaign Cards Grid */
            <div className="space-y-8">
              <div className="flex items-center justify-between text-xs text-[#52656B] pb-2 border-b border-[#DCE7E3]">
                <span>
                  Showing <strong className="text-[#102A35]">{campaigns.length}</strong> of{' '}
                  <strong className="text-[#102A35]">{totalItems}</strong> opportunities
                </span>
                <span>
                  Page <strong className="text-[#102A35]">{currentPage}</strong> of{' '}
                  <strong className="text-[#102A35]">{totalPages}</strong>
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
                <div className="flex items-center justify-between pt-6 border-t border-[#DCE7E3]">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 rounded-full text-xs font-semibold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#07545A] text-white shadow-xs'
                              : 'bg-white text-[#52656B] border border-[#DCE7E3] hover:text-[#102A35] hover:bg-[#EFEFE5]'
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
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#52656B] hover:text-[#102A35] hover:bg-[#EFEFE5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
      className={`group flex flex-col rounded-3xl bg-white border p-6 space-y-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        isApplied
          ? 'border-emerald-300'
          : 'border-[#DCE7E3] hover:border-[#087C80]/50'
      }`}
    >
      {/* Top Header: Startup Info & Product Type */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3">
          {campaign.startup_logo_url ? (
            <img
              src={campaign.startup_logo_url}
              alt={campaign.startup_name}
              className="h-10 w-10 rounded-2xl object-cover border border-[#DCE7E3]"
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#07545A] font-bold text-xs shadow-xs">
              {campaign.startup_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold text-[#102A35] group-hover:text-[#07545A] transition-colors line-clamp-1">
              {campaign.startup_name}
            </h4>
            <span className="text-[11px] text-[#52656B]">
              {campaign.product_type || 'Software Product'}
            </span>
          </div>
        </div>

        {/* Badges Container */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {isApplied && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Applied</span>
            </span>
          )}

          {/* Reward Badge */}
          {campaign.reward_type === 'monetary' && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
              <Coins className="h-3 w-3" />
              <span>${campaign.reward_amount} {campaign.reward_currency || 'USD'}</span>
            </span>
          )}
          {campaign.reward_type === 'perk' && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Gift className="h-3 w-3 text-amber-600" />
              <span>Perk Reward</span>
            </span>
          )}
          {campaign.reward_type === 'unpaid' && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EFEFE5] text-[#52656B] border border-[#DCE7E3]">
              <span>Volunteer</span>
            </span>
          )}
        </div>
      </div>

      {/* Campaign Title & Summary */}
      <div className="space-y-1.5 flex-1">
        <h3 className="text-base font-extrabold text-[#102A35] group-hover:text-[#07545A] transition-colors line-clamp-2">
          {campaign.title}
        </h3>
        {campaign.summary ? (
          <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">
            {campaign.summary}
          </p>
        ) : campaign.description ? (
          <p className="text-xs text-[#52656B] line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>
        ) : null}
      </div>

      {/* Criteria Tags: Level and Platforms */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {experienceLevel && (
          <span className="inline-flex items-center space-x-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#EFEFE5] text-[#07545A] border border-[#DCE7E3]">
            <Award className="h-2.5 w-2.5" />
            <span>{experienceLevel}</span>
          </span>
        )}

        {targetDevices.slice(0, 3).map((device) => (
          <span
            key={device}
            className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3]"
          >
            {device}
          </span>
        ))}
        {targetDevices.length > 3 && (
          <span className="text-[10px] text-[#52656B]">
            +{targetDevices.length - 3}
          </span>
        )}
      </div>

      {/* Footer Info: Tasks count, deadline, and view action */}
      <div className="pt-3 border-t border-[#DCE7E3] flex items-center justify-between text-[11px] text-[#52656B]">
        <div className="flex items-center space-x-3">
          {campaign.application_deadline ? (
            <span className="inline-flex items-center space-x-1 text-[#102A35]" title="Application Deadline">
              <Calendar className="h-3 w-3 text-[#07545A]" />
              <span>Due {new Date(campaign.application_deadline).toLocaleDateString()}</span>
            </span>
          ) : (
            <span>Rolling Admission</span>
          )}

          {campaign.testing_tasks && campaign.testing_tasks.length > 0 && (
            <span>&bull; {campaign.testing_tasks.length} {campaign.testing_tasks.length === 1 ? 'task' : 'tasks'}</span>
          )}
        </div>

        <span
          className={`inline-flex items-center space-x-1 text-xs font-semibold group-hover:translate-x-0.5 transition-all ${
            isApplied
              ? 'text-emerald-700'
              : 'text-[#07545A] group-hover:text-[#087C80]'
          }`}
        >
          <span>{isApplied ? 'Applied' : 'View'}</span>
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
};
