import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { BrandIcon } from './ui/BrandLogo';
import {
  Menu,
  X,
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

  const getActiveNav = (): 'home' | 'startups' | 'testers' | 'how-it-works' | null => {
    if (location.pathname !== '/') return null;
    if (location.hash === '#for-startups') return 'startups';
    if (location.hash === '#for-testers') return 'testers';
    if (location.hash === '#how-it-works') return 'how-it-works';
    return 'home';
  };

  const activeNav = getActiveNav();

  const handleNav = (target: 'home' | 'startups' | 'testers' | 'how-it-works') => {
    setMobileMenuOpen(false);

    if (target === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate({ pathname: '/', hash: '' }, { replace: true });
      } else {
        navigate('/');
      }
      return;
    }

    if (target === 'how-it-works') {
      if (location.pathname === '/') {
        const el = document.getElementById('how-it-works');
        if (el) {
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: elementPosition - 88, behavior: 'smooth' });
        }
        navigate({ pathname: '/', hash: '#how-it-works' }, { replace: true });
      } else {
        navigate('/#how-it-works');
      }
      return;
    }

    // target is 'startups' or 'testers'
    const role = target;
    const hash = target === 'startups' ? '#for-startups' : '#for-testers';

    if (location.pathname === '/') {
      // 1. Dispatch event so the perspective switches and the toggle visibly slides
      window.dispatchEvent(new CustomEvent('trylo-switch-tab', { detail: role }));

      // 2. Smoothly scroll down to the services area with header offset
      const section =
        document.getElementById('services-section') ||
        document.getElementById('our-services');
      if (section) {
        const elementPosition = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elementPosition - 88, behavior: 'smooth' });
      }

      // 3. Update router location hash
      navigate({ pathname: '/', hash }, { replace: true });
    } else {
      navigate(`/${hash}`);
    }
  };

  const workspacePath = user ? (user.role === 'founder' ? '/founder' : '/tester') : '/';

  return (
    <header className="border-b border-[#DCE7E3] bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center">
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
        </div>

        {/* Desktop Public Navigation Pill (When Unauthenticated) */}
        {!user && (
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center space-x-1 bg-[#F6F5ED] p-1 rounded-full border border-[#DCE7E3] text-xs lg:text-sm font-medium text-[#52656B] shadow-2xs"
          >
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeNav === 'home'
                  ? 'text-[#07545A] font-bold bg-white shadow-2xs'
                  : 'hover:text-[#102A35] hover:bg-white/60'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNav('startups')}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeNav === 'startups'
                  ? 'text-[#07545A] font-bold bg-white shadow-2xs'
                  : 'hover:text-[#102A35] hover:bg-white/60'
              }`}
            >
              <span>For Startups</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('testers')}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeNav === 'testers'
                  ? 'text-[#07545A] font-bold bg-white shadow-2xs'
                  : 'hover:text-[#102A35] hover:bg-white/60'
              }`}
            >
              <span>For Testers</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('how-it-works')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                activeNav === 'how-it-works'
                  ? 'text-[#07545A] font-bold bg-white shadow-2xs'
                  : 'hover:text-[#102A35] hover:bg-white/60'
              }`}
            >
              How It Works
            </button>
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
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname === '/tester/discover'
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Discover</span>
                </Link>
                <Link
                  to="/tester/applications"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname === '/tester/applications'
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Applications</span>
                </Link>
                <Link
                  to="/tester/tasks"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname.startsWith('/tester/tasks') ||
                    location.pathname.includes('/tasks')
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Tasks</span>
                </Link>
                <Link
                  to="/tester/feedback"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname === '/tester/feedback'
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Feedback</span>
                </Link>
              </>
            )}

            {user.role === 'founder' && (
              <>
                <Link
                  to="/founder/startups"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname.startsWith('/founder/startups')
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Startups</span>
                </Link>
                <Link
                  to="/founder/applications"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname === '/founder/applications'
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Review Applicants</span>
                </Link>
                <Link
                  to="/founder/feedback"
                  id="founder-header-feedback-link"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname.startsWith('/founder/feedback')
                      ? 'bg-[#D7EFEB] text-[#07545A] font-bold border border-[#BCE1DA]'
                      : 'hover:text-[#102A35] hover:bg-[#F6F5ED]'
                  }`}
                >
                  <span>Feedback &amp; Issues</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Right Action Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
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
              </Link>

              <Link
                to="/profile"
                className="flex items-center space-x-1 text-xs font-medium text-[#52656B] hover:text-[#102A35] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#F6F5ED]"
                title="Profile &amp; Credibility"
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
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                id="header-login-btn"
                className="inline-flex items-center justify-center text-xs lg:text-sm font-semibold text-[#52656B] hover:text-[#102A35] px-3.5 py-2 rounded-full hover:bg-[#F6F5ED] transition-colors duration-150 cursor-pointer"
              >
                Log In
              </Link>
              <Link
                to="/register"
                id="header-register-btn"
                className="group relative inline-flex items-center justify-center gap-1.5 text-xs lg:text-sm font-semibold text-white bg-gradient-to-r from-[#07545A] to-[#087C80] hover:from-[#087C80] hover:to-[#07545A] px-4.5 py-2 rounded-full shadow-xs hover:shadow-md hover:shadow-[#087C80]/20 border border-[#0B6B72]/30 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#5EEAD4] transition-transform duration-200 group-hover:translate-x-0.5" />
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
              <button
                type="button"
                onClick={() => handleNav('home')}
                className={`text-left px-3 py-2 rounded-xl transition-colors ${
                  activeNav === 'home' ? 'bg-white font-bold text-[#07545A]' : 'hover:bg-white'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNav('startups')}
                className={`text-left px-3 py-2 rounded-xl transition-colors ${
                  activeNav === 'startups' ? 'bg-white font-bold text-[#07545A]' : 'hover:bg-white'
                }`}
              >
                <span>For Startups</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('testers')}
                className={`text-left px-3 py-2 rounded-xl transition-colors ${
                  activeNav === 'testers' ? 'bg-white font-bold text-[#07545A]' : 'hover:bg-white'
                }`}
              >
                <span>For Testers</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('how-it-works')}
                className={`text-left px-3 py-2 rounded-xl transition-colors ${
                  activeNav === 'how-it-works' ? 'bg-white font-bold text-[#07545A]' : 'hover:bg-white'
                }`}
              >
                How It Works
              </button>

              <div className="pt-3 border-t border-[#DCE7E3] grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center py-2.5 rounded-full text-xs font-semibold bg-white border border-[#DCE7E3] text-[#102A35] hover:bg-[#F6F5ED] transition-colors shadow-2xs"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#07545A] to-[#087C80] text-white hover:shadow-xs transition-colors shadow-xs"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5EEAD4]" />
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
              </Link>

              {user.role === 'tester' && (
                <>
                  <Link
                    to="/tester/discover"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
                    <span>Discover Campaigns</span>
                  </Link>
                  <Link
                    to="/tester/applications"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
                    <span>My Applications</span>
                  </Link>
                  <Link
                    to="/tester/tasks"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
                    <span>Testing Tasks</span>
                  </Link>
                  <Link
                    to="/tester/feedback"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
                    <span>Feedback Submissions</span>
                  </Link>
                </>
              )}

              {user.role === 'founder' && (
                <>
                  <Link
                    to="/founder/startups"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
                    <span>My Startups</span>
                  </Link>
                  <Link
                    to="/founder/applications"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
                    <span>Review Applicants</span>
                  </Link>
                  <Link
                    to="/founder/feedback"
                    className="px-3 py-2 rounded-xl hover:bg-white text-xs font-semibold block"
                  >
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
