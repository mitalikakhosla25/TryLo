import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { BrandIcon } from './ui/BrandLogo';
import { ShieldCheck } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  const { user } = useAuth();


  return (
    <footer className="border-t border-[#DCE7E3] bg-[#EFEFE5] text-[#102A35] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Value Proposition Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2.5 group">
              <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
                <BrandIcon className="h-8 w-8" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-[#102A35]">
                TryLo
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-[#52656B] leading-relaxed max-w-sm">
              The premier marketplace where early-stage startups gather mission-critical
              feedback and curious testers shape the next generation of software before launch.
            </p>

            <div className="pt-2 flex items-center space-x-2 text-xs text-[#07545A] font-medium bg-[#D7EFEB]/60 border border-[#BCE1DA] px-3 py-1.5 rounded-full w-fit">
              <span className="h-2 w-2 rounded-full bg-[#087C80] animate-pulse" />
              <span>Platform Systems Operational</span>
            </div>
          </div>

          {/* For Startups Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A35]">
              For Startups
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#52656B]">
              <li>
                <Link
                  to={user?.role === 'founder' ? '/founder/startups/new' : '/register'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Launch a Campaign
                </Link>
              </li>
              <li>
                <Link
                  to={user?.role === 'founder' ? '/founder' : '/login'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Founder Workspace
                </Link>
              </li>
              <li>
                <Link
                  to={user?.role === 'founder' ? '/founder/applications' : '/login'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Applicant Screening
                </Link>
              </li>
              <li>
                <Link
                  to={user?.role === 'founder' ? '/founder/feedback' : '/login'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Feedback &amp; Issue Triage
                </Link>
              </li>
            </ul>
          </div>

          {/* For Testers Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A35]">
              For Testers
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#52656B]">
              <li>
                <Link
                  to={user?.role === 'tester' ? '/tester/discover' : '/tester/discover'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Discover Open Campaigns
                </Link>
              </li>
              <li>
                <Link
                  to={user?.role === 'tester' ? '/tester/tasks' : '/login'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  My Testing Tasks
                </Link>
              </li>
              <li>
                <Link
                  to={user?.role === 'tester' ? '/tester/applications' : '/login'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Application Tracking
                </Link>
              </li>
              <li>
                <Link
                  to={user?.role === 'tester' ? '/tester/feedback' : '/login'}
                  className="hover:text-[#087C80] transition-colors"
                >
                  Feedback History
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Account Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A35]">
              Platform &amp; Account
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#52656B]">
              <li>
                <a href="/#how-it-works" className="hover:text-[#087C80] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-[#087C80] transition-colors">
                  About TryLo
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#087C80] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#087C80] transition-colors">
                  Create an Account
                </Link>
              </li>
              {user && (
                <li>
                  <Link to="/profile" className="hover:text-[#087C80] transition-colors">
                    Profile Settings
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-[#DCE7E3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52656B]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-[#087C80]" />
            <span>TryLo Beta-Testing Marketplace &bull; High-Assurance Architecture</span>
          </div>

          <div>
            <p>&copy; {CURRENT_YEAR} TryLo. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
