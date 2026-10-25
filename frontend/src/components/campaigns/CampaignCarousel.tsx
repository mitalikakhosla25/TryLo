import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Gift,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { usePublicCampaigns } from '../../context/useCampaigns';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/FeedbackStates';

export const CampaignCarousel: React.FC = () => {
  const { data, isLoading, isError, refetch } = usePublicCampaigns({
    page_size: 12,
    sort: 'newest',
  });

  const campaigns = data?.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-rotation (pauses on hover or if user prefers reduced motion)
  useEffect(() => {
    if (campaigns.length <= 1 || isPaused) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [campaigns.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-white rounded-2xl border border-[#DCE7E3]">
        <LoadingSpinner label="Discovering live testing campaigns..." size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE7E3] space-y-3">
        <p className="text-sm text-[#B91C1C]">
          Unable to load active campaigns right now. Please check back shortly.
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Zero campaigns empty state
  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DCE7E3] bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] mx-auto">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h4 className="text-base sm:text-lg font-bold text-[#102A35]">
            Be the First to Launch a Campaign
          </h4>
          <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
            There are no public beta campaigns active right now. Founders can launch a
            targeted testing campaign to recruit verified testers today!
          </p>
        </div>
        <div className="pt-2">
          <Link to="/register">
            <Button size="md" variant="primary">
              Launch a Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentCampaign = campaigns[currentIndex];
  const targetRoute = `/campaigns/${currentCampaign.startup_slug}/${currentCampaign.slug}`;

  // Format deadline date nicely
  const formattedDeadline = currentCampaign.application_deadline
    ? new Date(currentCampaign.application_deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="rounded-3xl border border-[#DCE7E3] bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background aqua gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#D7EFEB]/40 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          {/* Campaign Details Column */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {currentCampaign.product_type && (
                <Badge variant="aqua" size="sm">
                  {currentCampaign.product_type}
                </Badge>
              )}

              {currentCampaign.reward_type === 'monetary' && (
                <Badge variant="success" size="sm" dot>
                  <Coins className="h-3 w-3 mr-1" />
                  <span>
                    {currentCampaign.reward_currency || '$'}
                    {currentCampaign.reward_amount || 'Paid'} Reward
                  </span>
                </Badge>
              )}

              {currentCampaign.reward_type === 'perk' && (
                <Badge variant="warning" size="sm">
                  <Gift className="h-3 w-3 mr-1" />
                  <span>Perk &amp; License</span>
                </Badge>
              )}

              {currentCampaign.reward_type === 'unpaid' && (
                <Badge variant="slate" size="sm">
                  Volunteer Beta Test
                </Badge>
              )}

              {formattedDeadline && (
                <div className="flex items-center space-x-1 text-[11px] text-[#52656B]">
                  <Calendar className="h-3.5 w-3.5 text-[#087C80]" />
                  <span>Deadline: {formattedDeadline}</span>
                </div>
              )}
            </div>

            {/* Campaign Headline */}
            <div className="space-y-2">
              <Link to={targetRoute} className="group inline-block">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] group-hover:text-[#087C80] transition-colors tracking-tight">
                  {currentCampaign.title}
                </h3>
              </Link>
              <p className="text-sm sm:text-base text-[#52656B] leading-relaxed line-clamp-3">
                {currentCampaign.summary || currentCampaign.description}
              </p>
            </div>

            {/* Startup Brand Attribution */}
            <div className="flex items-center space-x-3 pt-2">
              {currentCampaign.startup_logo_url ? (
                <img
                  src={currentCampaign.startup_logo_url}
                  alt={`${currentCampaign.startup_name} logo`}
                  className="h-10 w-10 rounded-xl object-cover border border-[#DCE7E3]"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-[#D7EFEB] text-[#087C80] font-bold text-sm flex items-center justify-center border border-[#BCE1DA]">
                  {currentCampaign.startup_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-xs text-[#7E939B] block font-medium">Built by</span>
                <span className="text-sm font-bold text-[#102A35]">
                  {currentCampaign.startup_name}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to={targetRoute}>
                <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Campaign &amp; Apply
                </Button>
              </Link>
              <Link to="/tester/discover">
                <Button size="md" variant="outline">
                  Browse All Campaigns
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics / Summary Card (Right) */}
          <div className="w-full lg:w-72 bg-[#F6F5ED] rounded-2xl border border-[#DCE7E3] p-5 space-y-4 shrink-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A35]">
              Campaign Snapshot
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE7E3]">
                <span className="text-[#52656B]">Product Format</span>
                <span className="font-semibold text-[#102A35]">
                  {currentCampaign.product_type || 'Web/Mobile'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE7E3]">
                <span className="text-[#52656B]">Testing Tasks</span>
                <span className="font-semibold text-[#102A35]">
                  {currentCampaign.testing_tasks?.length || 1} Step{currentCampaign.testing_tasks?.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE7E3]">
                <span className="text-[#52656B]">Capacity</span>
                <span className="font-semibold text-[#087C80]">
                  {currentCampaign.max_testers ? `${currentCampaign.max_testers} Testers Max` : 'Open Enrollment'}
                </span>
              </div>
            </div>

            {/* Pagination Controls */}
            {campaigns.length > 1 && (
              <div className="pt-2 flex items-center justify-between border-t border-[#DCE7E3]">
                <span className="text-[11px] font-medium text-[#7E939B]">
                  {currentIndex + 1} of {campaigns.length}
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous campaign"
                    className="p-1.5 rounded-lg border border-[#DCE7E3] bg-white hover:bg-[#D7EFEB]/40 text-[#102A35] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next campaign"
                    className="p-1.5 rounded-lg border border-[#DCE7E3] bg-white hover:bg-[#D7EFEB]/40 text-[#102A35] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
