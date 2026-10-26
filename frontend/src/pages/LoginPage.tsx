import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Loader2,
  LogIn,
} from 'lucide-react';
import { ApiError } from '../api/client';
import { getMyProfile } from '../api/profile';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect immediately to their workspace
  if (user) {
    const defaultDestination = user.role === 'founder' ? '/founder' : '/tester';
    const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
    const destination = fromPath && fromPath !== '/login' ? fromPath : defaultDestination;
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({
        email: trimmedEmail,
        password,
      });

      // Clear password field immediately
      setPassword('');

      // Check profile completion status to direct to onboarding or workspace
      let destination: string;
      try {
        const profileStatus = await getMyProfile();
        if (profileStatus.is_complete) {
          destination = authenticatedUser.role === 'founder' ? '/founder' : '/tester';
        } else {
          destination = authenticatedUser.role === 'founder' ? '/onboarding/founder' : '/onboarding/tester';
        }
      } catch {
        destination = authenticatedUser.role === 'founder' ? '/founder' : '/tester';
      }

      const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const target = fromPath && fromPath !== '/login' ? fromPath : destination;
      navigate(target, { replace: true });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to log in. Please check your credentials and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs text-[#52656B] hover:text-[#087C80] transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to TryLo Home</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white border border-[#DCE7E3] p-8 sm:p-10 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#D7EFEB] border border-[#BCE1DA] text-[11px] font-bold text-[#07545A]">
              <Sparkles className="h-3 w-3 text-[#087C80]" />
              <span>Sign In to TryLo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#102A35]">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#52656B]">
              Enter your credentials to access your workspace
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
              <div className="flex-1">
                <p className="font-bold text-[#B91C1C]">Authentication Failed</p>
                <p className="text-[#B91C1C]/90 text-[11px] mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Address */}
            <div>
              <label htmlFor="login-email-input" className="block text-xs font-bold text-[#102A35] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#52656B]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#F6F5ED]/40 border border-[#DCE7E3] rounded-xl text-xs sm:text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/30 focus:border-[#087C80] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password-input" className="block text-xs font-bold text-[#102A35] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#52656B]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#F6F5ED]/40 border border-[#DCE7E3] rounded-xl text-xs sm:text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/30 focus:border-[#087C80] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#52656B] hover:text-[#102A35] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center py-3 px-4 rounded-full text-xs sm:text-sm font-bold text-white bg-[#07545A] hover:bg-[#087C80] active:scale-[0.99] shadow-md hover:shadow-lg hover:shadow-[#087C80]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </span>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-2 text-center text-xs text-[#52656B] border-t border-[#DCE7E3] space-y-2">
            <p>
              Don&apos;t have an account yet?{' '}
              <Link to="/register" className="text-[#087C80] hover:text-[#07545A] font-bold underline underline-offset-2">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
