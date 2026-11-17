import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/useProfile';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/client';
import { Loader2, AlertCircle, RefreshCw, LogIn, RotateCcw } from 'lucide-react';

interface WorkspaceGuardProps {
  children: React.ReactNode;
  expectedRole: 'founder' | 'tester';
}

export const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({
  children,
  expectedRole,
}) => {
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { profileData, isLoading, isFetching, isError, error, refetch } = useProfile();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryFeedback('Connecting to backend services...');
    try {
      await refreshUser();
      const res = await refetch();
      if (res.isError) {
        setRetryFeedback(
          res.error instanceof Error
            ? res.error.message
            : 'Connection retry unsuccessful. Please ensure the backend server is active.'
        );
      } else {
        setRetryFeedback(null);
      }
    } catch (err: unknown) {
      setRetryFeedback(
        err instanceof Error
          ? err.message
          : 'Unable to connect to server. Please try logging in again.'
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRelogin = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#087C80] mb-2" />
        <p className="text-sm text-[#102A35] font-semibold">Verifying profile status...</p>
        <p className="text-xs text-[#52656B]">Checking onboarding completion</p>
      </div>
    );
  }

  // Handle server / network / auth errors with an explicit action to prevent redirect loops
  if (isError) {
    const isAuthError =
      (error instanceof ApiError && (error.status === 401 || error.status === 403)) ||
      (error instanceof Error && error.message.toLowerCase().includes('not authenticated'));

    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-white border border-[#DCE7E3] rounded-3xl p-8 space-y-4 shadow-xl">
          <div className="h-12 w-12 mx-auto rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#9A4200]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#102A35]">
            {isAuthError ? 'Session Expired' : 'Profile Verification Unavailable'}
          </h2>
          <p className="text-xs text-[#52656B] leading-relaxed">
            {isAuthError
              ? 'Your authenticated session is no longer active. Please log in again.'
              : retryFeedback ||
                (error instanceof Error
                  ? error.message
                  : 'Unable to connect to the profile service. Please verify the backend is running.')}
          </p>

          {retryFeedback && (
            <p className="text-xs text-[#B91C1C] bg-[#FEE2E2] rounded-xl p-2.5 font-medium">
              {retryFeedback}
            </p>
          )}

          <div className="pt-2 flex flex-wrap justify-center gap-2.5">
            <button
              onClick={handleRetry}
              disabled={isRetrying || isFetching}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying || isFetching ? 'animate-spin' : ''}`} />
              <span>{isRetrying || isFetching ? 'Retrying Connection...' : 'Retry Connection'}</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload Page</span>
            </button>

            <button
              onClick={handleRelogin}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Log In Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If profile is incomplete, direct to onboarding
  if (profileData && !profileData.is_complete) {
    const onboardingTarget = expectedRole === 'founder' ? '/onboarding/founder' : '/onboarding/tester';
    return <Navigate to={onboardingTarget} replace />;
  }

  return <>{children}</>;
};
