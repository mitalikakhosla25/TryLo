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
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to TryLo Home</span>
          </Link>
        </div>

        {/* Success View */}
        {registerMutation.isSuccess && registerMutation.data ? (
          <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-8 shadow-2xl shadow-emerald-500/10 space-y-6 text-center animate-in fade-in duration-300">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Account Created!</h2>
              <p className="text-sm text-slate-300">
                Welcome to TryLo, <span className="font-semibold text-white">{registerMutation.data.full_name}</span>.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-left space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">
                  {registerMutation.data.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-medium">{registerMutation.data.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Role:</span>
                <span
                  className={`capitalize px-2 py-0.5 rounded text-[11px] font-semibold ${registerMutation.data.role === 'founder'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    }`}
                >
                  {registerMutation.data.role}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 text-left">
              <p className="font-medium flex items-center space-x-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Registration Complete</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your account has been securely created and encrypted with Argon2id.
                Please sign in to access your workspace.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                to="/login"
                className="w-full inline-flex justify-center items-center space-x-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Proceed to Sign In</span>
              </Link>
              <div className="flex gap-2">
                <Link
                  to="/"
                  className="flex-1 inline-flex justify-center items-center py-2 px-3 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
                >
                  Return to Home
                </Link>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 inline-flex justify-center items-center py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 transition-colors"
                >
                  Register Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Registration Form View */
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-900/70 border border-slate-800 p-8 shadow-2xl shadow-black/40 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-400">
                <Sparkles className="h-3 w-3" />
                <span>Join TryLo Community</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
              <p className="text-xs text-slate-400">
                Choose your role to get started with verified beta testing
              </p>
            </div>

            {/* API Error Notification */}
            {registerMutation.isError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-200">Registration Failed</p>
                  <p className="text-rose-300/90 text-[11px] mt-0.5">
                    {registerMutation.error?.message || 'Failed to create account. Please try again.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  I want to join as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('founder')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${role === 'founder'
                        ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Rocket className={`h-4 w-4 ${role === 'founder' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${role === 'founder' ? 'text-white' : 'text-slate-300'}`}>
                        Founder
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Recruit testers &amp; test my startup products
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('tester')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${role === 'tester'
                        ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/50 shadow-md shadow-violet-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <ShieldCheck className={`h-4 w-4 ${role === 'tester' ? 'text-violet-400' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${role === 'tester' ? 'text-white' : 'text-slate-300'}`}>
                        Beta Tester
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Test early products &amp; submit feedback
                    </p>
                  </button>
                </div>
                {validationErrors.role && (
                  <p className="mt-1 text-[11px] text-rose-400">{validationErrors.role}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full-name-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
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
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="mt-1 text-[11px] text-rose-400">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work / Personal Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
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
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-400">{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
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
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password ? (
                  <p className="mt-1 text-[11px] text-rose-400">{validationErrors.password}</p>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Must be at least 8 characters long.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="register-submit-btn"
                disabled={registerMutation.isPending}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/80">
              Already registered?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Sign in to your account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
