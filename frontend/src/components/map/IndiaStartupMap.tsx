import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  INDIA_STATES_DATA,
  INDIA_MAP_VIEWBOX,
  type IndiaStateFeature,
} from './indiaMapData';
import { usePublicStartups } from '../../context/useStartups';
import { Button } from '../ui/Button';
import { StartupAvatar } from '../ui/StartupAvatar';

// Demonstration cards matching reference image when state has sample or empty initial data
const DEMO_CARDS_BY_STATE: Record<
  string,
  Array<{ name: string; category: string; image?: string | null; slug?: string }>
> = {
  Maharashtra: [
    { name: 'NutriBox', category: 'Food & Beverage', image: '/images/product-nutribox.jpg' },
    { name: 'AutoMitra', category: 'Automotive', image: '/images/product-automitra.jpg' },
    { name: 'StudyGenie', category: 'EdTech', image: '/images/product-studygenie.jpg' },
    { name: 'Kraftly', category: 'Handicrafts', image: '/images/product-kraftly.jpg' },
  ],
  Karnataka: [
    { name: 'StudyGenie', category: 'EdTech', image: '/images/product-studygenie.jpg' },
    { name: 'AutoMitra', category: 'Automotive', image: '/images/product-automitra.jpg' },
    { name: 'NutriBox', category: 'Food & Beverage', image: '/images/product-nutribox.jpg' },
  ],
  Delhi: [
    { name: 'FinMate', category: 'FinTech', image: '/images/founder-finmate.jpg' },
    { name: 'Bloomly', category: 'Sustainability', image: '/images/founder-bloomly.jpg' },
    { name: 'Kraftly', category: 'Handicrafts', image: '/images/product-kraftly.jpg' },
  ],
  Punjab: [
    { name: 'FemmeCare Health', category: 'HealthTech', image: null }, // Displays 'FH' alphabet monogram
    { name: 'EcoKart', category: 'E-Commerce', image: '/images/product-ecokart.jpg' },
  ],
};

export const IndiaStartupMap: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<IndiaStateFeature | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch real startups filtered by state when a state is selected
  const { data } = usePublicStartups(
    selectedState ? { state: selectedState, page_size: 12 } : undefined
  );
  const { data: allData } = usePublicStartups({ page_size: 1 });

  const stateCounts = allData?.state_counts || {};
  const realStartups = data?.items || [];
  const totalInSelectedState = selectedState
    ? (stateCounts[selectedState] ?? realStartups.length)
    : 0;
  const totalNationalStartups = allData?.total ?? 0;
  const totalActiveStates = Object.keys(stateCounts).length;

  const handleStateClick = (stateName: string) => {
    if (selectedState === stateName) {
      setSelectedState(null);
    } else {
      setSelectedState(stateName);
      setCarouselIndex(0);
    }
  };

  const handleClosePopup = () => {
    setSelectedState(null);
    setCarouselIndex(0);
  };

  // Cards to display in the state panel
  const displayCards = selectedState
    ? (realStartups.length > 0
        ? realStartups.map((s) => {
            const hasValidLogo = Boolean(
              s.logo_url &&
              s.logo_url.trim() &&
              (s.logo_url.startsWith('http://') || s.logo_url.startsWith('https://')) &&
              !s.logo_url.includes('phototourl.com') &&
              !s.logo_url.includes('example.com')
            );
            return {
              name: s.name,
              category: s.industry || 'Technology',
              image: hasValidLogo ? s.logo_url : null,
              slug: s.slug,
            };
          })
        : DEMO_CARDS_BY_STATE[selectedState] || [])
    : [];

  const handlePrevCards = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextCards = () => {
    setCarouselIndex((prev) =>
      Math.min(Math.max(0, displayCards.length - 4), prev + 1)
    );
  };

  return (
    <div className="w-full relative space-y-10">
      {/* =========================================================================
          SECTION HEADER: PAN INDIA COMMUNITY
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center">
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
              PAN INDIA COMMUNITY
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#102A35] tracking-tight leading-[1.15]">
            Startups from Every Corner of{' '}
            <span className="text-[#087C80]">India</span>
          </h2>

          <p className="text-sm sm:text-base text-[#52656B] leading-relaxed max-w-md">
            Discover innovative startups across the nation. Click any state on the map to explore startups and campaigns from that region.
          </p>

          {/* Metric Stats on Left below intro */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#DCE7E3]">
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-[#102A35] tracking-tight">
                {totalActiveStates > 0 ? totalActiveStates : '28'}
              </span>
              <span className="text-xs font-semibold text-[#52656B]">
                States &amp; UTs
              </span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-[#102A35] tracking-tight">
                {totalNationalStartups > 0 ? `${totalNationalStartups}+` : '1000+'}
              </span>
              <span className="text-xs font-semibold text-[#52656B]">
                Startups
              </span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-[#102A35] tracking-tight">
                50+
              </span>
              <span className="text-xs font-semibold text-[#52656B]">
                Cities
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAP COMPOSITION WITH FLOATING STATE PANEL
            ========================================================================= */}
        <div className="lg:col-span-7 relative flex flex-col items-center">
          {/* Ambient Aqua Backlight behind Map */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D7EFEB]/50 via-[#A5E1D8]/20 to-transparent rounded-3xl blur-2xl -z-10" />

          {/* Floating State Preview Card: Only pops up when a particular state is clicked */}
          {selectedState && (
            <div className="w-full sm:max-w-md lg:max-w-lg mb-4 lg:mb-0 lg:absolute lg:top-4 lg:right-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#DCE7E3] p-4 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE7E3]/60">
                <div>
                  <h4 className="text-base font-extrabold text-[#102A35]">
                    {selectedState}
                  </h4>
                  <p className="text-xs font-semibold text-[#087C80]">
                    {totalInSelectedState > 0
                      ? `${totalInSelectedState}+ Startups`
                      : 'Active Startup Hub'}
                  </p>
                </div>

                {/* Card carousel buttons & Close button */}
                <div className="flex items-center space-x-1.5">
                  {displayCards.length > 4 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevCards}
                        disabled={carouselIndex === 0}
                        aria-label="Previous startups in state"
                        className="h-7 w-7 rounded-full bg-white border border-[#DCE7E3] hover:border-[#087C80] text-[#102A35] hover:text-[#087C80] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextCards}
                        disabled={carouselIndex >= Math.max(0, displayCards.length - 4)}
                        aria-label="Next startups in state"
                        className="h-7 w-7 rounded-full bg-white border border-[#DCE7E3] hover:border-[#087C80] text-[#102A35] hover:text-[#087C80] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleClosePopup}
                    aria-label="Close state preview"
                    className="h-7 w-7 rounded-full bg-[#F6F5ED] hover:bg-[#D7EFEB] text-[#52656B] hover:text-[#07545A] flex items-center justify-center transition-colors cursor-pointer ml-1"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Mini Cards from selected state */}
              {displayCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {displayCards
                    .slice(carouselIndex, carouselIndex + 4)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#DCE7E3] bg-[#F6F5ED]/40 hover:bg-white hover:border-[#087C80] transition-all p-2 flex flex-col justify-between group"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden mb-1.5 flex items-center justify-center">
                          <StartupAvatar
                            name={item.name}
                            category={item.category}
                            logoUrl={item.image}
                            size="fill"
                            shape="square"
                            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-0.5">
                          {item.slug ? (
                            <Link
                              to={`/startups/${item.slug}`}
                              className="block font-bold text-xs text-[#102A35] hover:text-[#087C80] truncate"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="block font-bold text-xs text-[#102A35] truncate">
                              {item.name}
                            </span>
                          )}
                          <span className="block text-[10px] text-[#52656B] truncate">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-xs text-[#52656B]">
                    No startups registered in {selectedState} yet.
                  </p>
                  <Link to="/register?role=founder">
                    <Button size="sm" variant="primary">
                      Represent {selectedState}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Interactive Geographic SVG Map */}
          <div className="relative w-full max-w-[580px] aspect-[1000/1000] mt-2 select-none">
            <svg
              viewBox={INDIA_MAP_VIEWBOX}
              className="w-full h-full"
              aria-label="Map of India showing regional startups"
            >
              <defs>
                <filter id="selectedGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#087C80" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Render all states */}
              <g>
                {INDIA_STATES_DATA.map((state) => {
                  const isSelected = selectedState === state.name;
                  const isHovered = hoveredState?.name === state.name;
                  const count = stateCounts[state.name] || 0;

                  let fill = '#EAF3F1';
                  if (count > 0) fill = '#BEE4DE';
                  if (isHovered) fill = '#14B8A6';
                  if (isSelected) fill = '#087C80';

                  let stroke = '#9FCAC2';
                  if (isHovered) stroke = '#07545A';
                  if (isSelected) stroke = '#102A35';

                  return (
                    <path
                      key={state.id}
                      d={state.path}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.8}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isSelected ? 'url(#selectedGlow)' : undefined}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredState(state)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => handleStateClick(state.name)}
                    />
                  );
                })}
              </g>

              {/* State marker pins for prominent hubs */}
              {INDIA_STATES_DATA.map((state) => {
                const isSelected = selectedState === state.name;
                const [cx, cy] = state.center;
                if (!['Maharashtra', 'Karnataka', 'Delhi', 'Gujarat', 'Tamil Nadu', 'Telangana'].includes(state.name)) {
                  return null;
                }

                return (
                  <g
                    key={`pin-${state.id}`}
                    transform={`translate(${cx}, ${cy})`}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => handleStateClick(state.name)}
                  >
                    {isSelected && (
                      <circle
                        r={10}
                        fill="none"
                        stroke="#087C80"
                        strokeWidth="1.5"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      r={isSelected ? 5.5 : 3.5}
                      fill={isSelected ? '#102A35' : '#087C80'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Playful Hand-drawn Script Callout with Arrow */}
            <div className="absolute bottom-12 right-2 sm:right-6 pointer-events-none flex flex-col items-center">
              <span className="font-serif italic text-base sm:text-lg text-[#087C80] font-medium tracking-wide drop-shadow-2xs">
                Big ideas are
                <br />
                coming from everywhere!
              </span>
              <svg
                viewBox="0 0 100 40"
                className="w-16 h-8 text-[#087C80] stroke-current fill-none stroke-[2]"
              >
                <path
                  d="M 10 10 Q 50 35, 85 15"
                  strokeLinecap="round"
                />
                <polyline points="75 12 85 15 82 25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
