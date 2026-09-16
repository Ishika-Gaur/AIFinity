import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStudentAuth } from "../context/StudentAuthContext";

export default function StudentAuthGuard({
  children,
  requireOnboardingCompleted = false,
  allowOnlyIncomplete = false,
}) {
  const location = useLocation();
  const { user, loading, refreshUser } = useStudentAuth();

  useEffect(() => {
    refreshUser();
  }, [location.pathname, refreshUser]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FBF8F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B332C] border-t-transparent"></div>
      </div>
    );
  }

  // 1. Unauthenticated users -> redirect to Login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Already completed onboarding -> redirect away from /onboardingpage to /dashboard
  if (allowOnlyIncomplete && user.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Incomplete onboarding -> redirect away from protected features to /onboardingpage
  if (requireOnboardingCompleted && !user.onboardingCompleted) {
    return <Navigate to="/onboardingpage" replace />;
  }

  return children;
}
