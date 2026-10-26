import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/useAuth';
import {
  Rocket,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Loader2,
  LogIn,
} from 'lucide-react';
import { registerUser } from '../api/auth';
import type { RegisterRequest, UserResponse, UserRole } from '../api/auth';
import { ApiError } from '../api/client';

export const RegisterPage: React.FC = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('founder');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const registerMutation = useMutation<UserResponse, ApiError, RegisterRequest>({
    mutationFn: registerUser,
  });

  // If already authenticated, redirect to workspace
  if (user) {
    return <Navigate to={user.role === 'founder' ? '/founder' : '/tester'} replace />;
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (role !== 'founder' && role !== 'tester') {
      errors.role = 'Please select either Founder or Tester role.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    registerMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('founder');
    setValidationErrors({});
    registerMutation.reset();
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

        {/* Success View */}
        {registerMutation.isSuccess && registerMutation.data ? (
          <div className="rounded-3xl bg-white border border-[#B6EDD5] p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in duration-300">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#E6F7F0] border border-[#B6EDD5] flex items-center justify-center text-[#0E7C57]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A35] tracking-tight">Account Created!</h2>
              <p className="text-sm text-[#52656B]">
                Welcome to TryLo, <span className="font-bold text-[#102A35]">{registerMutation.data.full_name}</span>.
              </p>
            </div>

            <div className="bg-[#F6F5ED] border border-[#DCE7E3] rounded-2xl p-4 text-left space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#DCE7E3]">
                <span className="text-[#52656B]">Account ID:</span>
                <span className="font-mono text-[#102A35] text-[11px] truncate max-w-[200px]">
                  {registerMutation.data.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#DCE7E3]">
                <span className="text-[#52656B]">Email:</span>
                <span className="text-[#102A35] font-semibold">{registerMutation.data.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#52656B]">Role:</span>
                <span className="capitalize px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D7EFEB] text-[#07545A] border border-[#BCE1DA]">
                  {registerMutation.data.role}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#D7EFEB]/50 border border-[#BCE1DA] text-xs text-[#07545A] text-left">
              <p className="font-bold flex items-center space-x-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-[#087C80]" />
                <span>Registration Complete</span>
              </p>
              <p className="text-[11px] text-[#52656B] leading-relaxed">
                Your account has been securely created. Please sign in to access your workspace.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                to="/login"
                className="w-full inline-flex justify-center items-center space-x-2 py-3 px-5 rounded-full text-xs sm:text-sm font-bold text-white bg-[#07545A] hover:bg-[#087C80] shadow-md hover:shadow-lg hover:shadow-[#087C80]/20 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Proceed to Sign In</span>
              </Link>
              <div className="flex gap-2">
                <Link
                  to="/"
                  className="flex-1 inline-flex justify-center items-center py-2.5 px-3 rounded-full text-xs font-semibold text-[#102A35] hover:bg-[#F6F5ED] border border-[#DCE7E3] transition-colors"
                >
                  Return to Home
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 inline-flex justify-center items-center py-2.5 px-3 rounded-full text-xs font-semibold text-[#52656B] hover:text-[#102A35] hover:bg-[#F6F5ED] border border-[#DCE7E3] transition-colors cursor-pointer"
                >
                  Register Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Registration Form View */
          <div className="rounded-3xl bg-white border border-[#DCE7E3] p-8 sm:p-10 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#D7EFEB] border border-[#BCE1DA] text-[11px] font-bold text-[#07545A]">
                <Sparkles className="h-3 w-3 text-[#087C80]" />
                <span>Join TryLo Community</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#102A35]">
                Create Your Account
              </h1>
              <p className="text-xs sm:text-sm text-[#52656B]">
                Choose your role to get started with verified beta testing
              </p>
            </div>

            {/* API Error Notification */}
            {registerMutation.isError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs flex items-start space-x-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <div className="flex-1">
                  <p className="font-bold text-[#B91C1C]">Registration Failed</p>
                  <p className="text-[#B91C1C]/90 text-[11px] mt-0.5">
                    {registerMutation.error?.message || 'Failed to create account. Please try again.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-bold text-[#102A35] mb-2">
                  I want to join as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('founder')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      role === 'founder'
                        ? 'border-[#087C80] bg-[#D7EFEB]/50 ring-2 ring-[#087C80]/30 shadow-xs'
                        : 'border-[#DCE7E3] bg-[#F6F5ED]/40 hover:border-[#087C80]/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Rocket className={`h-4 w-4 ${role === 'founder' ? 'text-[#087C80]' : 'text-[#52656B]'}`} />
                      <span className={`text-xs font-bold ${role === 'founder' ? 'text-[#07545A]' : 'text-[#102A35]'}`}>
                        Founder
                      </span>
                    </div>
                    <p className="text-[10px] text-[#52656B] leading-tight">
                      Recruit testers &amp; test my startup products
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('tester')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      role === 'tester'
                        ? 'border-[#087C80] bg-[#D7EFEB]/50 ring-2 ring-[#087C80]/30 shadow-xs'
                        : 'border-[#DCE7E3] bg-[#F6F5ED]/40 hover:border-[#087C80]/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <ShieldCheck className={`h-4 w-4 ${role === 'tester' ? 'text-[#087C80]' : 'text-[#52656B]'}`} />
                      <span className={`text-xs font-bold ${role === 'tester' ? 'text-[#07545A]' : 'text-[#102A35]'}`}>
                        Beta Tester
                      </span>
                    </div>
                    <p className="text-[10px] text-[#52656B] leading-tight">
                      Test early products &amp; submit feedback
                    </p>
                  </button>
                </div>
                {validationErrors.role && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{validationErrors.role}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full-name-input" className="block text-xs font-bold text-[#102A35] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#52656B]">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    id="full-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (validationErrors.fullName) {
                        setValidationErrors((prev) => ({ ...prev, fullName: '' }));
                      }
                    }}
                    placeholder="e.g. Jane Doe"
                    disabled={registerMutation.isPending}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-[#F6F5ED]/40 border border-[#DCE7E3] rounded-xl text-xs sm:text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/30 focus:border-[#087C80] transition-all disabled:opacity-50"
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email-input" className="block text-xs font-bold text-[#102A35] mb-1.5">
                  Work / Personal Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#52656B]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors.email) {
                        setValidationErrors((prev) => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="you@domain.com"
                    disabled={registerMutation.isPending}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-[#F6F5ED]/40 border border-[#DCE7E3] rounded-xl text-xs sm:text-sm text-[#102A35] placeholder-[#52656B]/60 focus:outline-none focus:ring-2 focus:ring-[#087C80]/30 focus:border-[#087C80] transition-all disabled:opacity-50"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-input" className="block text-xs font-bold text-[#102A35] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#52656B]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                    placeholder="Minimum 8 characters"
                    disabled={registerMutation.isPending}
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
                {validationErrors.password ? (
                  <p className="mt-1 text-[11px] text-[#B91C1C]">{validationErrors.password}</p>
                ) : (
                  <p className="mt-1 text-[10px] text-[#52656B]">
                    Must be at least 8 characters long.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="register-submit-btn"
                disabled={registerMutation.isPending}
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-full text-xs sm:text-sm font-bold text-white bg-[#07545A] hover:bg-[#087C80] active:scale-[0.99] shadow-md hover:shadow-lg hover:shadow-[#087C80]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <span>Create {role === 'founder' ? 'Founder' : 'Tester'} Account</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-[#52656B] border-t border-[#DCE7E3]">
              Already registered?{' '}
              <Link to="/login" className="text-[#087C80] hover:text-[#07545A] font-bold underline underline-offset-2">
                Sign in to your account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
