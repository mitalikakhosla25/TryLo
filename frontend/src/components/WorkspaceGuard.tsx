import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../context/useProfile';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface WorkspaceGuardProps {
  children: React.ReactNode;
  expectedRole: 'founder' | 'tester';
}

export const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({
  children,
  expectedRole,
}) => {
  const { profileData, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-300 font-medium">Verifying profile status...</p>
        <p className="text-xs text-slate-500 mt-1">Checking onboarding completion</p>
      </div>
    );
  }

  // Handle server / network errors with a retry option without logging out
  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 space-y-4 shadow-xl">
          <div className="h-12 w-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Profile Verification Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error instanceof Error ? error.message : 'Unable to connect to the profile service.'}
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Connection</span>
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
