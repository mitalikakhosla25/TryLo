import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Bug,
  Compass,
} from 'lucide-react';
import { Container } from '../ui/Container';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CampaignCarousel } from '../campaigns/CampaignCarousel';

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    // Check if user prefers reduced motion or is on touch device
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
      // Normalize to [-1, 1]
      targetX.current = (x - 0.5) * 2;
      targetY.current = (y - 0.5) * 2;
    };

    const handleMouseLeave = () => {
      targetX.current = 0;
      targetY.current = 0;
    };

    // Smooth lerp loop for fluid, slow-motion easing without re-renders
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

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16"
      style={
        {
          '--pointer-x': '0',
          '--pointer-y': '0',
        } as React.CSSProperties
      }
    >
      {/* =========================================================================
          ATMOSPHERIC BACKGROUND DECORATIVE LAYERS (Parallax + Ambient Float)
          All decorative layers have pointer-events-none so they never obstruct clicks
          ========================================================================= */}

      {/* Layer 1: Soft Ambient Glow Blobs (Deeper, shifts slowly) */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] -z-10 transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform:
            'translate3d(calc(var(--pointer-x) * 10px), calc(var(--pointer-y) * 8px), 0)',
        }}
      >
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#D7EFEB]/60 via-[#A5E1D8]/30 to-transparent blur-3xl animate-pulse-soft" />
        <div className="absolute top-20 right-10 w-[420px] h-[420px] rounded-full bg-gradient-to-bl from-[#087C80]/15 via-[#D7EFEB]/40 to-transparent blur-3xl animate-float-reverse" />
        <div className="absolute top-48 left-1/3 w-80 h-80 rounded-full bg-[#EBF7F5]/80 blur-2xl" />
      </div>

      {/* Layer 2: Translucent Flowing Glass Ribbons (SVG Bezier Waves) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-75 overflow-hidden transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform:
            'translate3d(calc(var(--pointer-x) * 18px), calc(var(--pointer-y) * 14px), 0)',
        }}
      >
        <svg
          viewBox="0 0 1440 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover animate-float-slow"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#087C80" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#D7EFEB" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="ribbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#087C80" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#A5E1D8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#087C80" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#DCE7E3" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Smooth flowing glass ribbon 1 */}
          <path
            d="M -100 240 C 280 120, 520 420, 920 220 C 1220 70, 1420 310, 1600 210 L 1600 680 L -100 680 Z"
            fill="url(#ribbonGrad1)"
          />
          <path
            d="M -100 240 C 280 120, 520 420, 920 220 C 1220 70, 1420 310, 1600 210"
            stroke="url(#strokeGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Smooth flowing glass ribbon 2 (overlapping translucent depth) */}
          <path
            d="M -50 360 C 350 220, 680 490, 1080 320 C 1320 210, 1500 370, 1650 300 L 1650 680 L -50 680 Z"
            fill="url(#ribbonGrad2)"
          />
          <path
            d="M -50 360 C 350 220, 680 490, 1080 320 C 1320 210, 1500 370, 1650 300"
            stroke="url(#strokeGrad)"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Layer 3: Floating Translucent Spheres / Particles */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-transform duration-700 ease-out will-change-transform"
        style={{
          transform:
            'translate3d(calc(var(--pointer-x) * 26px), calc(var(--pointer-y) * 22px), 0)',
        }}
      >
        {/* Sphere 1 (Top Left) */}
        <div className="absolute top-16 left-12 w-9 h-9 rounded-full bg-gradient-to-tr from-[#087C80]/30 to-white/70 backdrop-blur-xs border border-white/60 shadow-sm animate-float-slow" />
        {/* Sphere 2 (Mid Right) */}
        <div className="absolute top-44 right-20 w-14 h-14 rounded-full bg-gradient-to-tr from-[#2DD4BF]/25 to-white/80 backdrop-blur-xs border border-white/70 shadow-md animate-float-reverse" />
        {/* Sphere 3 (Center Deep) */}
        <div className="absolute top-80 left-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-[#D7EFEB] to-[#087C80]/20 border border-white/50 animate-float-slow" />
        {/* Sphere 4 (Bottom Left) */}
        <div className="absolute bottom-24 left-1/4 w-10 h-10 rounded-full bg-gradient-to-tr from-[#A5E1D8]/40 to-white/60 border border-white/40 animate-float-reverse" />
      </div>

      {/* =========================================================================
          LAYER 4: FOREGROUND CONTENT
          Composed as balanced two-column hero on desktop + dynamic carousel below
          ========================================================================= */}
      <Container size="xl" className="space-y-12 sm:space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Copy, Dual CTAs, Trust Pills */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center">
              <Badge variant="aqua" size="md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#087C80] animate-ping mr-1" />
                <Sparkles className="h-3.5 w-3.5 mr-1 text-[#087C80]" />
                <span>Startup Beta-Testing Marketplace</span>
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#102A35] leading-[1.14]">
              Great Products Deserve{' '}
              <span className="relative inline-block text-[#087C80]">
                Real Feedback.
                {/* Subtle turquoise highlight underline sweep */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#087C80]/30 -z-10"
                  viewBox="0 0 240 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 2 8 C 60 2, 180 2, 238 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#52656B] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              TryLo connects ambitious early-stage founders with verified beta testers.
              Founders recruit relevant users and uncover critical edge cases before launch;
              testers discover emerging products and earn recognition shaping the future of software.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link to="/tester/discover">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Campaigns
                </Button>
              </Link>
              <Link to="/register?role=founder">
                <Button
                  size="lg"
                  variant="outline"
                  rightIcon={<Rocket className="h-4 w-4 text-[#087C80]" />}
                >
                  Launch Your Campaign
                </Button>
              </Link>
            </div>

            {/* Platform Feature Trust Pills */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-[#52656B]">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#DCE7E3] backdrop-blur-xs shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Verified Beta Testers</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#DCE7E3] backdrop-blur-xs shadow-2xs">
                <Bug className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Structured Bug Reports</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#DCE7E3] backdrop-blur-xs shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Closed-Loop Retesting</span>
              </span>
            </div>
          </div>

          {/* Right Column: Layered Atmospheric Glass Card Composition (Desktop Visual Scene) */}
          <div className="lg:col-span-5 relative hidden lg:block">
            {/* Soft backdrop glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#087C80]/15 to-[#2DD4BF]/20 rounded-3xl blur-2xl -z-10" />

            <div className="relative p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-white/80 shadow-xl space-y-5 animate-float-slow">
              {/* Satellite Badge 1 (Floating Top Right) */}
              <div className="absolute -top-4 -right-4 px-3.5 py-1.5 rounded-full bg-[#102A35] text-white text-xs font-semibold shadow-lg flex items-center space-x-1.5 border border-white/20 animate-float-reverse">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2DD4BF]" />
                <span>3/3 Tasks Completed</span>
              </div>

              {/* Main Showcase Card Content */}
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE7E3]">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D7EFEB] to-[#A5E1D8] text-[#087C80] flex items-center justify-center font-bold text-base shadow-xs">
                    TL
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#102A35]">
                      Beta Testing Run
                    </h4>
                    <p className="text-[11px] text-[#52656B]">
                      Verified Tester Cohort
                    </p>
                  </div>
                </div>
                <Badge variant="teal" size="sm">
                  Active
                </Badge>
              </div>

              {/* Sample Testing Task Preview */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-[#102A35] uppercase tracking-wider">
                  Guided Testing Journey
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-center justify-between text-xs">
                    <span className="font-medium text-[#102A35] flex items-center space-x-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#087C80]" />
                      <span>Onboard & Create First Project</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#087C80]">
                      Passed
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] flex items-center justify-between text-xs">
                    <span className="font-medium text-[#102A35] flex items-center space-x-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#087C80]" />
                      <span>Test Real-Time Data Export</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#087C80]">
                      Passed
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#D7EFEB]/50 border border-[#BCE1DA] flex items-center justify-between text-xs">
                    <span className="font-medium text-[#07545A] flex items-center space-x-2">
                      <Bug className="h-3.5 w-3.5 text-[#087C80]" />
                      <span>Edge Case: Offline State Sync</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#087C80] bg-white px-2 py-0.5 rounded-md">
                      Reported
                    </span>
                  </div>
                </div>
              </div>

              {/* Satellite Badge 2 (Bottom Bar) */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#52656B] border-t border-[#DCE7E3]/60">
                <span className="inline-flex items-center space-x-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Real Feedback Loop</span>
                </span>
                <span className="font-semibold text-[#087C80]">
                  Retest Requested
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Carousel of Real Published Campaigns */}
        <div className="pt-4 border-t border-[#DCE7E3]/60">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#087C80]">
                Live On TryLo
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#102A35]">
                Active Testing Programs
              </h2>
            </div>
            <Link
              to="/tester/discover"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#087C80] hover:text-[#07545A] transition-colors"
            >
              <span>Browse All Open Campaigns</span>
              <Compass className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          <CampaignCarousel />
        </div>
      </Container>
    </section>
  );
};
