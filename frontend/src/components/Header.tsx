import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { BrandIcon } from './ui/BrandLogo';
import {
  Menu,
  X,
  Compass,
  FileCheck,
  CheckSquare,
  MessageSquare,
  Building2,
  Users2,
  User,
  LogOut,
  ArrowRight,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location.pathname + location.hash);

  if (prevLocation !== location.pathname + location.hash) {
    setPrevLocation(location.pathname + location.hash);
    setMobileMenuOpen(false);
  }

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const workspacePath = user ? (user.role === 'founder' ? '/founder' : '/tester') : '/';

  return (
    <header className="border-b border-[#DCE7E3] bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center space-x-6 lg:space-x-10">
          <Link
            to="/"
            className="flex items-center space-x-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] rounded-xl p-1"
            aria-label="TryLo Home"
          >
            <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
              <BrandIcon className="h-8 w-8" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#102A35]">
              TryLo
            </span>
          </Link>

          {/* Desktop Public Navigation Pill (When Unauthenticated) */}
          {!user && (
            <nav
              aria-label="Main Navigation"
              className="hidden md:flex items-center space-x-1 bg-white/70 backdrop-blur-md px-2 py-1.5 rounded-full border border-[#DCE7E3] text-xs lg:text-sm font-medium text-[#52656B] shadow-2xs"
            >
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                  location.pathname === '/' && !location.hash
                    ? 'text-[#07545A] font-bold bg-[#D7EFEB] shadow-2xs'
                    : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                }`}
              >
                Home
              </Link>
              <a
                href="/#for-startups"
                className="px-4 py-1.5 rounded-full hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
              >
                For Startups
              </a>
              <a
                href="/#for-testers"
                className="px-4 py-1.5 rounded-full hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
              >
                For Testers
              </a>
              <a
                href="/#how-it-works"
                className="px-4 py-1.5 rounded-full hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
              >
                How It Works
              </a>
              <a
                href="/#about"
                className="px-4 py-1.5 rounded-full hover:text-[#102A35] hover:bg-[#F6F5ED] transition-colors"
              >
                About Us
              </a>
            </nav>
          )}


          {/* Desktop Role-Specific Navigation (When Authenticated) */}
          {user && (
            <nav
              aria-label="Workspace Navigation"
              className="hidden md:flex items-center space-x-1 text-xs font-semibold text-[#52656B]"
            >
              {user.role === 'tester' && (
                <>
                  <Link
                    to="/tester/discover"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname === '/tester/discover'
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <Compass className="h-4 w-4 text-[#087C80]" />
                    <span>Discover</span>
                  </Link>
                  <Link
                    to="/tester/applications"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname === '/tester/applications'
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <FileCheck className="h-4 w-4 text-[#087C80]" />
                    <span>Applications</span>
                  </Link>
                  <Link
                    to="/tester/tasks"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname.startsWith('/tester/tasks') ||
                      location.pathname.includes('/tasks')
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <CheckSquare className="h-4 w-4 text-[#087C80]" />
                    <span>Tasks</span>
                  </Link>
                  <Link
                    to="/tester/feedback"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname === '/tester/feedback'
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 text-[#087C80]" />
                    <span>Feedback</span>
                  </Link>
                </>
              )}

              {user.role === 'founder' && (
                <>
                  <Link
                    to="/founder/startups"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname.startsWith('/founder/startups')
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-[#087C80]" />
                    <span>Startups</span>
                  </Link>
                  <Link
                    to="/founder/applications"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname === '/founder/applications'
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <Users2 className="h-4 w-4 text-[#087C80]" />
                    <span>Review Applicants</span>
                  </Link>
                  <Link
                    to="/founder/feedback"
                    id="founder-header-feedback-link"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.pathname.startsWith('/founder/feedback')
                        ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                        : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 text-[#087C80]" />
                    <span>Feedback &amp; Issues</span>
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center space-x-3">
          {user ? (
            /* Authenticated Actions */
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to={workspacePath}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#F6F5ED] border border-[#DCE7E3] hover:border-[#087C80] transition-colors text-xs"
                title="Go to your workspace"
              >
                <div className="h-6 w-6 rounded-full bg-[#087C80]/15 text-[#087C80] flex items-center justify-center font-bold text-[11px]">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-[#102A35] font-semibold hidden sm:inline max-w-[130px] truncate">
                  {user.full_name}
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-[#D7EFEB] text-[#07545A]">
                  {user.role}
                </span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center space-x-1 text-xs font-medium text-[#52656B] hover:text-[#102A35] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#F6F5ED]"
                title="Profile Settings"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                id="header-logout-btn"
                className="flex items-center space-x-1.5 text-xs font-semibold text-[#52656B] hover:text-[#B91C1C] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#FEE2E2]/60 cursor-pointer"
                title="Sign out of TryLo"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated Visitor Actions */
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-[#102A35] hover:text-[#087C80] px-5 py-2.5 rounded-full border border-[#DCE7E3] bg-white hover:bg-[#F6F5ED] transition-colors shadow-2xs"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full bg-[#07545A] hover:bg-[#087C80] text-white shadow-sm transition-all hover:shadow-md hover:shadow-[#087C80]/20"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#102A35] hover:bg-[#F6F5ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C80] transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DCE7E3] bg-[#F6F5ED] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {!user ? (
            <div className="flex flex-col space-y-1 text-sm font-medium text-[#102A35]">
              <Link
                to="/"
                className="px-3 py-2 rounded-xl hover:bg-white transition-colors"
              >
                Home
              </Link>
              <a
                href="/#for-startups"
                className="px-3 py-2 rounded-xl hover:bg-white transition-colors"
              >
                For Startups
              </a>
              <a
                href="/#for-testers"
                className="px-3 py-2 rounded-xl hover:bg-white transition-colors"
              >
                For Testers
              </a>
              <a
                href="/#how-it-works"
                className="px-3 py-2 rounded-xl hover:bg-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="/#about"
                className="px-3 py-2 rounded-xl hover:bg-white transition-colors"
              >
                About Us
              </a>
              <div className="pt-3 border-t border-[#DCE7E3] flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-xl border border-[#DCE7E3] bg-white font-semibold text-xs text-[#102A35]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 rounded-xl bg-[#087C80] text-white font-semibold text-xs shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-1 text-sm font-medium text-[#102A35]">
              <Link
                to={workspacePath}
                className="px-3 py-2 rounded-xl bg-white border border-[#DCE7E3] font-bold text-xs text-[#087C80] flex items-center justify-between"
              >
                <span>My Workspace</span>
                <span className="capitalize px-1.5 py-0.5 rounded bg-[#D7EFEB] text-[#07545A]">
                  {user.role}
                </span>
              </Link>

              {user.role === 'tester' && (
                <>
                  <Link
                    to="/tester/discover"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <Compass className="h-4 w-4 text-[#087C80]" />
                    <span>Discover Campaigns</span>
                  </Link>
                  <Link
                    to="/tester/applications"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <FileCheck className="h-4 w-4 text-[#087C80]" />
                    <span>My Applications</span>
                  </Link>
                  <Link
                    to="/tester/tasks"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <CheckSquare className="h-4 w-4 text-[#087C80]" />
                    <span>Testing Tasks</span>
                  </Link>
                  <Link
                    to="/tester/feedback"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4 text-[#087C80]" />
                    <span>Feedback Submissions</span>
                  </Link>
                </>
              )}

              {user.role === 'founder' && (
                <>
                  <Link
                    to="/founder/startups"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <Building2 className="h-4 w-4 text-[#087C80]" />
                    <span>My Startups</span>
                  </Link>
                  <Link
                    to="/founder/applications"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <Users2 className="h-4 w-4 text-[#087C80]" />
                    <span>Review Applicants</span>
                  </Link>
                  <Link
                    to="/founder/feedback"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4 text-[#087C80]" />
                    <span>Feedback &amp; Issues</span>
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold flex items-center space-x-2"
              >
                <User className="h-4 w-4 text-[#52656B]" />
                <span>Profile Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FEE2E2] text-xs font-semibold text-[#B91C1C] flex items-center space-x-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
