import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Building2,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  INDIA_STATES_DATA,
  INDIA_MAP_VIEWBOX,
  type IndiaStateFeature,
} from './indiaMapData';
import { usePublicStartups } from '../../context/useStartups';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/FeedbackStates';

export const IndiaStartupMap: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<IndiaStateFeature | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Fetch all startups or filtered by selected state
  const { data, isLoading, isError, refetch } = usePublicStartups(
    selectedState ? { state: selectedState, page_size: 12 } : { page_size: 12 }
  );

  const stateCounts = data?.state_counts || {};
  const startups = data?.items || [];
  const totalStartups = data?.total ?? 0;

  const handleStateClick = (stateName: string) => {
    if (selectedState === stateName) {
      setSelectedState(null); // Toggle off
    } else {
      setSelectedState(stateName);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, state: IndiaStateFeature) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredState(state);
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
    setTooltipPos(null);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedState(val || null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Map Control Bar: Current Selection Status & Jump Dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#087C80] animate-pulse" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
              {selectedState ? `Startups in ${selectedState}` : 'Startup Ecosystem Across India'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#52656B]">
            {selectedState
              ? `Displaying ${totalStartups} active startup${totalStartups === 1 ? '' : 's'} registered in ${selectedState}.`
              : 'Click any state or Union Territory to discover regional startup hubs.'}
          </p>
        </div>

        {/* State Jump Dropdown & Reset Filter */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <select
              aria-label="Filter startups by Indian State or Union Territory"
              value={selectedState || ''}
              onChange={handleDropdownChange}
              className="w-full pl-3 pr-8 py-2 bg-white border border-[#DCE7E3] rounded-xl text-xs font-semibold text-[#102A35] shadow-xs focus:outline-none focus:border-[#087C80] focus:ring-1 focus:ring-[#087C80] transition-all cursor-pointer"
            >
              <option value="">All States & UTs (National View)</option>
              {INDIA_STATES_DATA.map((st) => {
                const count = stateCounts[st.name] || 0;
                return (
                  <option key={st.id} value={st.name}>
                    {st.name} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedState && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RotateCcw className="h-3.5 w-3.5 text-[#087C80]" />}
              onClick={() => setSelectedState(null)}
            >
              Show All
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive India Vector Map (Left) + Startups Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Vector SVG Map Container */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#DCE7E3] p-4 sm:p-7 shadow-xs relative flex flex-col items-center justify-center overflow-hidden">
          {/* Map Top Bar */}
          <div className="w-full flex items-center justify-between mb-3 px-1 text-xs text-[#52656B]">
            <span className="font-bold text-[#102A35] flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#087C80]" />
              <span>36 States & Union Territories</span>
            </span>
            <span className="text-[11px] bg-[#EFEFE5] px-2.5 py-0.5 rounded-full font-medium text-[#52656B]">
              Administrative Boundaries
            </span>
          </div>

          {/* Scalable SVG Container (viewBox 0 0 1000 1000) */}
          <div className="relative w-full max-w-[620px] aspect-[1000/1000]">
            <svg
              viewBox={INDIA_MAP_VIEWBOX}
              className="w-full h-full select-none"
              aria-label="Geographically accurate map of India with 28 states and 8 Union Territories"
            >
              <defs>
                {/* Glow filter for selected state */}
                <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#087C80" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Render all 36 Indian States and Union Territories */}
              <g className="transition-all duration-300">
                {INDIA_STATES_DATA.map((state) => {
                  const count = stateCounts[state.name] || 0;
                  const isSelected = selectedState === state.name;
                  const isHovered = hoveredState?.name === state.name;
                  const hasStartups = count > 0;

                  // Distinctive, clean color hierarchy:
                  // - Selected: Deep Teal (#087C80)
                  // - Hovered: Vibrant Turquoise (#14B8A6)
                  // - Has Startups: Soft Aqua (#BEE4DE)
                  // - Neutral unselected: Pale Warm Aqua (#EAF3F1)
                  let fillColor = '#EAF3F1';
                  if (hasStartups) fillColor = '#BEE4DE';
                  if (isHovered) fillColor = '#14B8A6';
                  if (isSelected) fillColor = '#087C80';

                  let strokeColor = '#9FCAC2';
                  if (hasStartups) strokeColor = '#087C80';
                  if (isHovered) strokeColor = '#07545A';
                  if (isSelected) strokeColor = '#102A35';

                  return (
                    <path
                      key={state.id}
                      d={state.path}
                      role="button"
                      tabIndex={0}
                      aria-label={`${state.name}: ${count} startups`}
                      aria-pressed={isSelected}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.8}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isSelected ? 'url(#mapGlow)' : undefined}
                      className="transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80]"
                      onMouseEnter={(e) => handleMouseMove(e, state)}
                      onMouseMove={(e) => handleMouseMove(e, state)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleStateClick(state.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStateClick(state.name);
                        }
                      }}
                    />
                  );
                })}
              </g>

              {/* Centroid Indicator Markers for small regions (Delhi, Chandigarh, Goa, Puducherry, Lakshadweep) */}
              {INDIA_STATES_DATA.map((state) => {
                const count = stateCounts[state.name] || 0;
                const isSelected = selectedState === state.name;
                const isHovered = hoveredState?.name === state.name;
                const [cx, cy] = state.center;

                // For tiny regions or states with active startups, show an accessible centroid pin
                const isSmallRegion = [
                  'Delhi',
                  'Chandigarh',
                  'Goa',
                  'Puducherry',
                  'Lakshadweep',
                  'Dadra and Nagar Haveli and Daman and Diu',
                ].includes(state.name);

                if (!isSmallRegion && count === 0 && !isSelected) {
                  return null;
                }

                return (
                  <g
                    key={`pin-${state.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${state.name}: ${count} startups`}
                    className="cursor-pointer focus:outline-none transition-transform hover:scale-125"
                    transform={`translate(${cx}, ${cy})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStateClick(state.name);
                    }}
                    onMouseEnter={(e) => {
                      const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement)?.getBoundingClientRect();
                      if (svgRect) {
                        setHoveredState(state);
                        setTooltipPos({
                          x: e.clientX - svgRect.left,
                          y: e.clientY - svgRect.top,
                        });
                      }
                    }}
                    onMouseLeave={handleMouseLeave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStateClick(state.name);
                      }
                    }}
                  >
                    {/* Pulsing ring for selected state or active startup hub */}
                    {(isSelected || count > 0) && (
                      <circle
                        r={isSelected ? 10 : 7}
                        fill="none"
                        stroke={isSelected ? '#087C80' : '#087C80'}
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="animate-ping"
                      />
                    )}
                    {/* Center point */}
                    <circle
                      r={isSelected ? 6 : isSmallRegion ? 4.5 : 3.5}
                      fill={isSelected ? '#FFFFFF' : isHovered ? '#102A35' : '#087C80'}
                      stroke={isSelected ? '#087C80' : '#FFFFFF'}
                      strokeWidth={isSelected ? 2.5 : 1}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredState && tooltipPos && (
              <div
                className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full px-3.5 py-2 rounded-xl bg-[#102A35] text-white text-xs shadow-xl space-y-0.5 whitespace-nowrap border border-white/20"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y - 12}px`,
                }}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm text-white">
                    {hoveredState.name}
                  </span>
                  <span className="text-[10px] text-[#A5E1D8] font-mono">
                    [{hoveredState.code}]
                  </span>
                </div>
                <p className="text-[11px] text-[#D7EFEB] flex items-center space-x-1">
                  <span>
                    {stateCounts[hoveredState.name]
                      ? `${stateCounts[hoveredState.name]} Startup${stateCounts[hoveredState.name] === 1 ? '' : 's'} registered`
                      : '0 Startups registered'}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 italic pt-0.5">
                  Click to filter startups
                </p>
              </div>
            )}
          </div>

          {/* Map Legend & Licensing Attribution */}
          <div className="w-full pt-4 mt-3 border-t border-[#DCE7E3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#52656B]">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-md bg-[#087C80] shadow-xs" />
                <span className="font-semibold text-[#102A35]">Selected State</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-md bg-[#BEE4DE] border border-[#087C80]/40" />
                <span>Active Startups</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-md bg-[#EAF3F1] border border-[#9FCAC2]" />
                <span>Open for Pioneers</span>
              </div>
            </div>

            <span className="text-[10px] text-[#52656B]/80 text-center sm:text-right">
              Cartography: Simplemaps (Free Commercial License)
            </span>
          </div>
        </div>

        {/* Startups List Panel (Right Column on Desktop, Stacked on Mobile) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCE7E3]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-[#D7EFEB] text-[#087C80]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#102A35]">
                    {selectedState ? `${selectedState} Startups` : 'All Registered Startups'}
                  </h4>
                  <p className="text-xs text-[#52656B]">
                    {totalStartups} startup{totalStartups === 1 ? '' : 's'} available
                  </p>
                </div>
              </div>

              {selectedState && (
                <Badge variant="teal" size="sm">
                  {selectedState}
                </Badge>
              )}
            </div>

            {/* Content states: Loading, Error, Empty, List */}
            {isLoading ? (
              <div className="py-12">
                <LoadingSpinner label="Loading startup records..." size="md" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-[#B91C1C]">
                  Unable to load startups from this region. Please try again.
                </p>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : startups.length === 0 ? (
              /* Friendly Empty State for State without Startups */
              <div className="py-8 text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] mx-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 max-w-xs mx-auto">
                  <h5 className="font-bold text-sm text-[#102A35]">
                    {selectedState
                      ? `Be the First Startup in ${selectedState}`
                      : 'No startups registered yet'}
                  </h5>
                  <p className="text-xs text-[#52656B] leading-relaxed">
                    {selectedState
                      ? `Founders based in ${selectedState} can register their venture and recruit early testers from across India.`
                      : 'Founders are registering ventures daily. Launch your profile to be featured on the map.'}
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/register?role=founder">
                    <Button
                      size="sm"
                      variant="primary"
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Register Your Startup
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Populated State Startups List */
              <div className="py-2 divide-y divide-[#DCE7E3]/60 max-h-[500px] overflow-y-auto space-y-1 pr-1">
                {startups.map((st) => (
                  <div
                    key={st.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      {st.logo_url ? (
                        <img
                          src={st.logo_url}
                          alt={`${st.name} logo`}
                          className="h-10 w-10 rounded-xl object-cover border border-[#DCE7E3] bg-white shrink-0 mt-0.5"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D7EFEB] to-[#A5E1D8] text-[#087C80] font-bold text-sm flex items-center justify-center border border-[#BCE1DA] shrink-0 mt-0.5">
                          {st.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <Link
                          to={`/startups/${st.slug}`}
                          className="font-bold text-sm text-[#102A35] hover:text-[#087C80] transition-colors truncate block"
                        >
                          {st.name}
                        </Link>
                        {st.tagline && (
                          <p className="text-xs text-[#52656B] line-clamp-1 leading-relaxed">
                            {st.tagline}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-[11px] text-[#52656B] pt-0.5">
                          {st.city && <span>{st.city}</span>}
                          {st.industry && (
                            <>
                              <span>&bull;</span>
                              <span className="text-[#087C80] font-semibold">
                                {st.industry}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5 flex items-center space-x-1">
                      {st.website_url && (
                        <a
                          href={st.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#52656B] hover:text-[#087C80] transition-colors rounded-lg hover:bg-[#EFEFE5]"
                          title="Visit external website"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Link
                        to={`/startups/${st.slug}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EFEFE5] hover:bg-[#087C80] hover:text-white text-[#102A35] transition-all"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
