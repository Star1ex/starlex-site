import React, { Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "@/widgets/Layout/Layout.js";
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary.js';
import { authService } from '@/services/api/index.js';
import { apiClient } from '@/services/api/client.js';

// Lazy-loaded pages for better initial bundle size
const HomePage = React.lazy(() => import('@/pages/home/HomePage.js').then(m => ({ default: m.HomePage })));
const SignInPage = React.lazy(() => import('@/pages/auth/SignInPage/SignInPage.js').then(m => ({ default: m.SignInPage })));
const SignUpPage = React.lazy(() => import('@/pages/auth/SignUpPage/SignUpPage.js').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPasswordPage/ResetPasswordPage.js').then(m => ({ default: m.ResetPasswordPage })));
const Dashboard = React.lazy(() => import('@/pages/dashboard/Dashboard.js').then(m => ({ default: m.Dashboard })));
const VerifyEmailPage = React.lazy(() => import('@/pages/verify/VerifyEmailPage.js').then(m => ({ default: m.VerifyEmailPage })));
const GeneralSettings = React.lazy(() => import('@/pages/settings/GeneralSettings.js').then(m => ({ default: m.GeneralSettings })));
const AboutUs = React.lazy(() => import('@/pages/about-us/AboutUs.js').then(m => ({ default: m.default })));
const ProfilePage = React.lazy(() => import('@/pages/profile/UserProfile.js').then(m => ({ default: m.default })));
const UserProfilePage = React.lazy(() => import('@/pages/profile/UserProfilePage.js').then(m => ({ default: m.UserProfilePage })));
const TaskBoard = React.lazy(() => import('@/pages/team/TaskBoard.js').then(m => ({ default: m.default })));
const PersonalTasksPage = React.lazy(() => import('@/pages/personal/PersonalTasksPage.js').then(m => ({ default: m.default })));
const TaskView = React.lazy(() => import('@/components/Tasks/TaskView.js').then(m => ({ default: m.default })));

import { Navigate } from 'react-router-dom';

const Fallback = () => <div className="min-h-screen bg-white dark:bg-dark-bg" />;

export const AppRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<Fallback />}>
      <AnimatedRoutes />
    </Suspense>
  </ErrorBoundary>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected routes with Layout */}
      <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Layout><GeneralSettings /></Layout></RequireAuth>} />
      <Route path="/about-us" element={<RequireAuth><Layout><AboutUs /></Layout></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>} />
      <Route path="/profile/:userId" element={<RequireAuth><Layout><UserProfilePage /></Layout></RequireAuth>} />
      <Route path="/team/:team_id" element={<RequireAuth><Layout><TaskBoard /></Layout></RequireAuth>} />
      <Route path="/personal" element={<RequireAuth><Layout><Navigate to="/dashboard" replace /></Layout></RequireAuth>} />
      <Route path="/task/new" element={<RequireAuth><Layout><TaskView /></Layout></RequireAuth>} />
      <Route path="/task/:taskId" element={<RequireAuth><Layout><TaskView /></Layout></RequireAuth>} />
    </Routes>
  );
};

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = React.useState(false);
  const [authed, setAuthed] = React.useState(authService.isAuthenticated());

  React.useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (authService.isAuthenticated()) {
        if (mounted) {
          setAuthed(true);
          setReady(true);
        }
        return;
      }
      try {
        const ok = await apiClient.initialize();
        if (mounted) {
          setAuthed(ok);
          setReady(true);
        }
      } catch {
        if (mounted) {
          setAuthed(false);
          setReady(true);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    if (authed) return <>{children}</>;
    return <Fallback />;
  }
  if (!authed) return <Navigate to="/" replace />;
  return <>{children}</>;
};
