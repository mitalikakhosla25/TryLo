import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Box,
  BarChart3,
  MessageSquare,
  ShoppingBag,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Container } from '../ui/Container';
import { usePublicStartups } from '../../context/useStartups';
import { usePublicCampaigns } from '../../context/useCampaigns';

interface HeroStartupItem {
  id: string;
  name: string;
  tagline: string;
  category: string;
  image?: string;
  icon?: React.ReactNode;
  slug?: string;
  isReal?: boolean;
}

const DEMO_HERO_IMAGES = [
  '/images/founder-bloomly.jpg', // Pic with female founder holding Bloomly botanical product
  '/images/product-kraftly.jpg', // Handcrafted artisan ceramics
  '/images/product-nutribox.jpg', // Premium organic nutrient bar (replaces fruit bowl)
  '/images/founder-finmate.jpg', // Pic with male fintech founder holding mobile app
  '/images/product-studygenie.jpg', // Laptop workspace with edtech learning platform
  '/images/product-ecokart.jpg', // Luxury branded subscription box with embossed logo
  '/images/product-automitra.jpg', // Smart electric vehicle with teal accent details
];

const DEFAULT_DECK_ITEMS: HeroStartupItem[] = [
  {
    id: 'bloomly',
    name: 'Bloomly',
    tagline: 'Botanical wellness & sustainable refills',
    category: 'Sustainability',
    image: '/images/founder-bloomly.jpg',
    icon: <Leaf className="h-6 w-6 text-[#087C80]" />,
  },
  {
    id: 'kraftly',
    name: 'Kraftly',
    tagline: 'Artisan handmade pottery & ceramics',
    category: 'Handicrafts',
    image: '/images/product-kraftly.jpg',
    icon: <Box className="h-6 w-6 text-[#087C80]" />,
  },
  {
    id: 'nutribox',
    name: 'NutriBox',
    tagline: 'Clean protein & organic whole nutrients',
    category: 'Food & Beverage',
    image: '/images/product-nutribox.jpg',
    icon: <Heart className="h-4 w-4 text-white" />,
  },
  {
    id: 'finmate',
    name: 'FinMate',
    tagline: 'Personal wealth intelligence for founders',
    category: 'Fintech',
    image: '/images/founder-finmate.jpg',
    icon: <BarChart3 className="h-6 w-6 text-[#087C80]" />,
  },
  {
    id: 'lingoai',
    name: 'StudyGenie',
    tagline: 'AI interactive study & learning companion',
    category: 'EdTech',
    image: '/images/product-studygenie.jpg',
    icon: <MessageSquare className="h-6 w-6 text-[#087C80]" />,
  },
  {
    id: 'ecokart',
    name: 'EcoKart',
    tagline: 'Curated zero-waste sustainable essentials',
    category: 'E-Commerce',
    image: '/images/product-ecokart.jpg',
    icon: <ShoppingBag className="h-6 w-6 text-[#087C80]" />,
  },
  {
    id: 'automitra',
    name: 'AutoMitra',
    tagline: 'Smart electric vehicle telemetry & analytics',
    category: 'CleanTech',
    image: '/images/product-automitra.jpg',
    icon: <Box className="h-6 w-6 text-[#087C80]" />,
  },
];

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  const [activeIndex, setActiveIndex] = useState(2); // Center on NutriBox (index 2) by default
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Fetch real startups and campaigns
  const { data: startupsData } = usePublicStartups({ page_size: 8 });
  const { data: campaignsData } = usePublicCampaigns({ page_size: 8 });

  const realStartups = startupsData?.items || [];
  const totalStartups = startupsData?.total ?? 0;
  const totalCampaigns = campaignsData?.total ?? 0;
  const totalStates = Object.keys(startupsData?.state_counts || {}).length;

  // Helper to ensure each card has a valid, beautiful image
  const getSafeHeroImage = (name: string, url: string | null | undefined, fallbackIndex: number) => {
    // Specifically for Girlyio in this section, use the dedicated women's health care app mockup
    if (name.toLowerCase().includes('girlyio')) {
      return '/images/app-girlyio.jpg';
    }
    if (!url || !url.trim() || url.includes('phototourl.com') || url.includes('example.com')) {
      return DEMO_HERO_IMAGES[fallbackIndex % DEMO_HERO_IMAGES.length];
    }
    return url;
  };

  // Build deck items: prioritize real startups, fallback to reference demonstration deck
  const deckItems: HeroStartupItem[] =
    realStartups.length >= 3
      ? realStartups.map((s, idx) => ({
          id: s.id,
          name: s.name,
          tagline: s.tagline || `Innovating in ${s.industry || 'Technology'}`,
          category: s.industry || 'Technology',
          image: getSafeHeroImage(s.name, s.logo_url, idx),
          slug: s.slug,
          isReal: true,
        }))
      : DEFAULT_DECK_ITEMS;

  useEffect(() => {
    // Parallax mouse interaction (desktop only, non-reduced motion)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    if (prefersReducedMotion || isTouchDevice || !heroRef.current) {
      return;
    }

    const container = heroRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      targetX.current = (x - 0.5) * 2;
      targetY.current = (y - 0.5) * 2;
    };

    const handleMouseLeave = () => {
      targetX.current = 0;
      targetY.current = 0;
    };

    const animate = () => {
      currentX.current += (targetX.current - currentX.current) * 0.05;
      currentY.current += (targetY.current - currentY.current) * 0.05;

      if (container) {
        container.style.setProperty('--pointer-x', currentX.current.toFixed(4));
        container.style.setProperty('--pointer-y', currentY.current.toFixed(4));
      }

      rafId.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + deckItems.length) % deckItems.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % deckItems.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40) handleNext();
    if (diff < -40) handlePrev();
    setTouchStartX(null);
  };

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24"
      style={
        {
          '--pointer-x': '0',
          '--pointer-y': '0',
        } as React.CSSProperties
      }
    >
      {/* =========================================================================
          BACKGROUND DECORATIVE AESTHETICS (Teal / Aqua Ribbon Waves & 3D Glass Orbs)
          ========================================================================= */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform:
            'translate3d(calc(var(--pointer-x) * 16px), calc(var(--pointer-y) * 12px), 0)',
        }}
        aria-hidden="true"
      >
        {/* Soft atmospheric radial gradient glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[#D7EFEB]/80 via-[#A5E1D8]/30 to-transparent blur-3xl opacity-75" />
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#087C80]/10 via-[#D7EFEB]/50 to-transparent blur-3xl opacity-60" />

        {/* Dynamic Curved Flowing Teal Waves (Ribbon arc matching reference) */}
        <svg
          viewBox="0 0 1440 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover opacity-85"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="heroRibbon1" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#087C80" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#2DD4BF" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#D7EFEB" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="heroRibbon2" x1="100%" y1="10%" x2="0%" y2="90%">
              <stop offset="0%" stopColor="#07545A" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#14B8A6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#EBF7F5" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="heroLineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#087C80" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#DCE7E3" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Background contoured wave ribbons */}
          <path
            d="M -100 280 C 320 140, 720 380, 1100 180 C 1320 60, 1500 240, 1600 180 L 1600 680 L -100 680 Z"
            fill="url(#heroRibbon1)"
          />
          <path
            d="M -100 280 C 320 140, 720 380, 1100 180 C 1320 60, 1500 240, 1600 180"
            stroke="url(#heroLineStroke)"
            strokeWidth="1.5"
          />
          <path
            d="M -50 380 C 380 260, 800 480, 1180 290 C 1380 180, 1540 330, 1650 260 L 1650 680 L -50 680 Z"
            fill="url(#heroRibbon2)"
          />
        </svg>

        {/* 3D Pearl / Glass Spheres */}
        <div className="absolute top-24 left-[18%] w-8 h-8 rounded-full bg-gradient-to-tr from-[#087C80]/30 to-white/90 shadow-md border border-white/60 animate-float-slow" />
        <div className="absolute top-48 right-[12%] w-12 h-12 rounded-full bg-gradient-to-tr from-[#2DD4BF]/30 to-white/80 shadow-lg border border-white/70 animate-float-reverse" />
        <div className="absolute top-72 right-[38%] w-6 h-6 rounded-full bg-gradient-to-br from-[#087C80]/20 to-white/90 shadow-xs animate-float-slow" />
        <div className="absolute bottom-20 left-[8%] w-9 h-9 rounded-full bg-gradient-to-tr from-[#A5E1D8]/40 to-white/70 shadow-sm animate-float-reverse" />
      </div>

      <Container size="xl" className="space-y-12 sm:space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* =====================================================================
              LEFT COLUMN: HERO HEADLINE, SUPPORTING COPY, CTAs & STATS
              ===================================================================== */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
                WHERE IDEAS MEET REAL PEOPLE
              </span>
            </div>

            {/* Editorial Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-[#102A35] leading-[1.12]">
              From Idea to Impact,{' '}
              <span className="text-[#087C80] inline-block">Together.</span>
            </h1>

            {/* Supporting Subtitle */}
            <p className="text-base sm:text-lg text-[#52656B] leading-relaxed max-w-xl mx-auto lg:mx-0">
              TryLo helps startups find real users and get genuine feedback, while
              testers get early access to exciting products and shape what's next.
            </p>

            {/* Dual CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm sm:text-base font-semibold px-7 py-3.5 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-md hover:shadow-lg hover:shadow-[#087C80]/20 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 text-sm sm:text-base font-semibold px-6 py-3.5 rounded-full bg-white hover:bg-[#F6F5ED] text-[#102A35] border border-[#DCE7E3] hover:border-[#087C80] shadow-2xs transition-all cursor-pointer"
              >
                <div className="h-6 w-6 rounded-full bg-[#D7EFEB] text-[#087C80] flex items-center justify-center">
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </a>
            </div>

            {/* Floating Live Stats Row */}
            <div className="pt-6 border-t border-[#DCE7E3]/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                  {totalStartups > 0 ? `${totalStartups}+` : '500+'}
                </span>
                <span className="text-xs font-medium text-[#52656B]">
                  Startups Listed
                </span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                  {totalCampaigns > 0 ? `${totalCampaigns * 15}+` : '10K+'}
                </span>
                <span className="text-xs font-medium text-[#52656B]">
                  Beta Testers
                </span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">
                  {totalStates > 0 ? `${totalStates}+` : '50+'}
                </span>
                <span className="text-xs font-medium text-[#52656B]">
                  Industries &amp; Hubs
                </span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#087C80] tracking-tight">
                  95%
                </span>
                <span className="text-xs font-medium text-[#52656B]">
                  Positive Feedback
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              RIGHT COLUMN: 3D PERSPECTIVE FANNED DECK OF STARTUP CARDS
              ===================================================================== */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            {/* Ambient teal wave pedestal glow */}
            <div className="absolute w-[520px] sm:w-[600px] h-[380px] sm:h-[440px] bg-gradient-to-tr from-[#087C80]/15 via-[#2DD4BF]/20 to-transparent rounded-full blur-3xl -z-10" />

            {/* Deck of 3D Fanned Startup Cards with Enriched Proportions */}
            <div
              className="relative w-full h-[410px] sm:h-[480px] flex items-center justify-center select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {deckItems.map((item, index) => {
                // Calculate position relative to the active card
                const offset = index - activeIndex;
                const isCenter = offset === 0;

                // Restrict visible cards in fan to [-2, -1, 0, 1, 2]
                if (Math.abs(offset) > 3) return null;

                // Visual styling: 3D perspective fan with expanded width and spread
                const translateX = offset * 86; // horizontal fanning spread
                const translateY = Math.abs(offset) * 16; // downward parabolic curve
                const rotateZ = offset * 4.5; // slight card fan rotation
                const scale = isCenter ? 1.08 : Math.max(0.78, 1 - Math.abs(offset) * 0.1);
                const zIndex = 30 - Math.abs(offset) * 5;
                const opacity = Math.abs(offset) > 2 ? 0.35 : Math.abs(offset) === 2 ? 0.75 : 1;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className="absolute cursor-pointer transition-all duration-500 ease-out"
                    style={{
                      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotateZ}deg) scale(${scale})`,
                      zIndex,
                      opacity,
                    }}
                  >
                    <div
                      className={`w-[210px] sm:w-[245px] rounded-2xl bg-white border transition-all duration-300 p-4 flex flex-col justify-between ${
                        isCenter
                          ? 'border-[#087C80]/50 shadow-2xl shadow-[#087C80]/18 ring-2 ring-[#087C80]/20 min-h-[300px] sm:min-h-[335px]'
                          : 'border-[#DCE7E3] shadow-md hover:border-[#087C80]/30 min-h-[275px] sm:min-h-[310px]'
                      }`}
                    >
                      {/* Top Media / Thumbnail */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F6F5ED] border border-[#DCE7E3] mb-3 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = item.name.toLowerCase().includes('girlyio')
                                ? '/images/app-girlyio.jpg'
                                : DEMO_HERO_IMAGES[index % DEMO_HERO_IMAGES.length];
                              if (!target.src.endsWith(fallback)) {
                                target.src = fallback;
                              }
                            }}
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#D7EFEB] to-[#A5E1D8] flex items-center justify-center text-[#087C80] shadow-2xs">
                            {item.icon || (
                              <span className="font-extrabold text-xl text-[#087C80]">
                                {item.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Heart / Badge for center card */}
                        {isCenter && (
                          <div className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-md">
                            <Heart className="h-4 w-4 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 text-center">
                        <h4 className="text-base sm:text-lg font-extrabold text-[#102A35] truncate tracking-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs sm:text-[13px] text-[#52656B] line-clamp-2 leading-snug">
                          {item.tagline}
                        </p>
                      </div>

                      {/* Category Pill / Action */}
                      <div className="pt-2.5 mt-auto flex items-center justify-center">
                        {item.slug ? (
                          <Link
                            to={`/startups/${item.slug}`}
                            className="text-xs font-semibold text-[#087C80] hover:text-[#07545A] inline-flex items-center space-x-1"
                          >
                            <span>Explore Startup</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-[11px] font-bold text-[#07545A] px-2.5 py-0.5 rounded-full bg-[#D7EFEB] border border-[#BCE1DA]">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deck Carousel Navigation Controls `<  ● ○ ○ ○  >` */}
            <div className="flex items-center space-x-3 pt-4 z-40">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous startup card"
                className="h-8 w-8 rounded-full bg-white border border-[#DCE7E3] hover:border-[#087C80] text-[#102A35] hover:text-[#087C80] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center space-x-1.5 px-2">
                {deckItems.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === activeIndex
                        ? 'w-6 bg-[#087C80]'
                        : 'w-2 bg-[#DCE7E3] hover:bg-[#52656B]'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next startup card"
                className="h-8 w-8 rounded-full bg-white border border-[#DCE7E3] hover:border-[#087C80] text-[#102A35] hover:text-[#087C80] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
