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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#087C80] mb-2" />
        <p className="text-sm text-[#102A35] font-semibold">Verifying profile status...</p>
        <p className="text-xs text-[#52656B]">Checking onboarding completion</p>
      </div>
    );
  }

  // Handle server / network errors with a retry option without logging out
  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-white border border-[#DCE7E3] rounded-3xl p-8 space-y-4 shadow-xl">
          <div className="h-12 w-12 mx-auto rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#9A4200]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#102A35]">Profile Verification Unavailable</h2>
          <p className="text-xs text-[#52656B] leading-relaxed">
            {error instanceof Error ? error.message : 'Unable to connect to the profile service.'}
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#07545A] text-white hover:bg-[#087C80] transition-colors shadow-sm cursor-pointer"
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
