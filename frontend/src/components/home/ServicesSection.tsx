import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  BarChart2,
  Users2,
  Sparkles,
  ArrowRight,
  Compass,
  FileCheck,
  ListTodo,
  Award,
  Building2,
  Users,
} from 'lucide-react';
import { Container } from '../ui/Container';

interface ServiceCardData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  link: string;
  linkText: string;
}

const STARTUP_SERVICES: ServiceCardData[] = [
  {
    id: 'reach-users',
    title: 'Reach Real Users',
    description:
      'Get your product in front of genuine beta testers who are eager to try and give feedback.',
    icon: <Rocket className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-bars.jpg',
    link: '/register?role=founder',
    linkText: 'Recruit Testers',
  },
  {
    id: 'actionable-insights',
    title: 'Actionable Insights',
    description:
      'Receive structured feedback and actionable reports to improve your product faster.',
    icon: <BarChart2 className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-waves.jpg',
    link: '/register?role=founder',
    linkText: 'Explore Insights',
  },
  {
    id: 'build-community',
    title: 'Build Your Community',
    description:
      'Create a loyal user base and turn early testers into long-term advocates.',
    icon: <Users2 className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-community.jpg',
    link: '/register?role=founder',
    linkText: 'Grow Advocates',
  },
  {
    id: 'showcase-startup',
    title: 'Showcase Your Startup',
    description:
      'Get featured, gain visibility and connect with investors and industry experts.',
    icon: <Sparkles className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-star.jpg',
    link: '/register?role=founder',
    linkText: 'Get Featured',
  },
];

const TESTER_SERVICES: ServiceCardData[] = [
  {
    id: 'discover-early',
    title: 'Discover Early Tech',
    description:
      'Get hands-on access to emerging developer tools, SaaS apps, and products before public release.',
    icon: <Compass className="h-5 w-5 text-[#087C80]" />,
    image: '/images/product-studygenie.jpg',
    link: '/tester/discover',
    linkText: 'Browse Campaigns',
  },
  {
    id: 'seamless-apply',
    title: 'Seamless Applications',
    description:
      'Apply with your testing profile, hardware configurations, and answers tailored to founders.',
    icon: <FileCheck className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-bars.jpg',
    link: '/register?role=tester',
    linkText: 'Join as Tester',
  },
  {
    id: 'guided-tasks',
    title: 'Guided Testing Tasks',
    description:
      'Follow clear, task-oriented test objectives to exercise key product features and usability flows.',
    icon: <ListTodo className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-waves.jpg',
    link: '/tester/discover',
    linkText: 'View Tasks',
  },
  {
    id: 'build-reputation',
    title: 'Build Your Reputation',
    description:
      'Earn recognition for high-impact bug reports, unlock exclusive rewards, and become a trusted beta specialist.',
    icon: <Award className="h-5 w-5 text-[#087C80]" />,
    image: '/images/service-star.jpg',
    link: '/register?role=tester',
    linkText: 'Start Testing',
  },
];

export const ServicesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'startups' | 'testers'>('startups');

  const services = activeTab === 'startups' ? STARTUP_SERVICES : TESTER_SERVICES;

  return (
    <section className="relative overflow-hidden py-6 sm:py-12" id="our-services">
      <Container size="xl" className="space-y-12">
        {/* =====================================================================
            HEADER: BADGE, HEADLINE & DESCRIPTION (2-column layout matching reference)
            ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA] shadow-2xs">
                OUR SERVICES
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#102A35] tracking-tight leading-[1.15]">
              Built for <span className="text-[#087C80]">Builders</span> and{' '}
              <span className="text-[#087C80]">Believers</span>
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="text-sm sm:text-base text-[#52656B] leading-relaxed">
              Whether you're a startup looking for real users or a tester excited to try new
              products, TryLo gives you the right tools, opportunities and support.
            </p>
          </div>
        </div>

        {/* =====================================================================
            PILL TOGGLE SWITCHER
            ===================================================================== */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-[#EFEFE5] rounded-full border border-[#DCE7E3] shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('startups')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'startups'
                  ? 'bg-[#087C80] text-white shadow-sm'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>For Startups</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('testers')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'testers'
                  ? 'bg-[#087C80] text-white shadow-sm'
                  : 'text-[#52656B] hover:text-[#102A35]'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>For Testers</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            4 VERTICAL CARDS GRID WITH 3D ARTWORK (Matching reference visual)
            ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-white border border-[#DCE7E3] hover:border-[#087C80]/40 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Subtle upper ambient aqua tint */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D7EFEB]/40 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                {/* Circular teal icon badge */}
                <div className="h-12 w-12 rounded-full bg-[#D7EFEB] border border-[#BCE1DA] flex items-center justify-center text-[#087C80] shadow-xs group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>

                {/* Card Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-[#102A35] tracking-tight group-hover:text-[#087C80] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom: Arrow Button + 3D Rendered Artwork */}
              <div className="pt-6 relative z-10 flex flex-col justify-end space-y-4">
                {/* 3D Rendered Artwork Container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-[#F6F5ED]/50 to-white flex items-center justify-center border border-[#DCE7E3]/60 group-hover:shadow-sm transition-all">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Circular Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <Link
                    to={item.link}
                    className="inline-flex items-center space-x-2 text-xs font-bold text-[#087C80] hover:text-[#07545A] group-hover:translate-x-0.5 transition-all"
                  >
                    <span>{item.linkText}</span>
                    <div className="h-7 w-7 rounded-full bg-[#EFEFE5] group-hover:bg-[#087C80] group-hover:text-white text-[#102A35] flex items-center justify-center transition-colors">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
