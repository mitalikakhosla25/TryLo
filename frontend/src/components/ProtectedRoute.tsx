/**
 * TryLo Reusable Protected and Role-Guarded Route Component
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { UserRole } from '../api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#087C80] mb-2" />
        <p className="text-xs text-[#52656B] font-semibold">Verifying authenticated session...</p>
      </div>
    );
  }

  // Not logged in -> redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-white border border-[#DCE7E3] rounded-3xl p-8 space-y-4 shadow-xl">
          <div className="h-12 w-12 mx-auto rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#B91C1C]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[#102A35]">Access Denied</h2>
          <p className="text-xs text-[#52656B] leading-relaxed">
            Your account role is <span className="text-[#102A35] font-bold capitalize">{user.role}</span>.
            You do not have permission to access this resource.
          </p>
          <div className="pt-2">
            <Navigate
              to={user.role === 'founder' ? '/founder' : '/tester'}
              replace
            />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
