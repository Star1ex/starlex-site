import React, { Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "@/widgets/Layout/Layout.js";
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { authService } from '@/services/api/index.js';
import { apiClient } from '@/services/api/client.js';

// Lazy-loaded pages for better initial bundle size
const HomePage = React.lazy(() => import('@/pages/home/HomePage.js').then(m => ({ default: m.HomePage })));
const SignInPage = React.lazy(() => import('@/pages/auth/SignInPage/SignInPage.js').then(m => ({ default: m.SignInPage })));
const SignUpPage = React.lazy(() => import('@/pages/auth/SignUpPage/SignUpPage.js').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPasswordPage/ResetPasswordPage.js').then(m => ({ default: m.ResetPasswordPage })));
const OAuthCallbackPage = React.lazy(() => import('@/pages/auth/OAuthCallbackPage/OAuthCallbackPage.js').then(m => ({ default: m.OAuthCallbackPage })));
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
  <Suspense fallback={<Fallback />}>
    <AnimatedRoutes />
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const withErrorBoundary = (element: React.ReactNode) => (
    <ErrorBoundary>{element}</ErrorBoundary>
  );
  return (
    <AnimatePresence mode="wait" initial={false}>
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={withErrorBoundary(<HomePage />)} />
      <Route path="/sign-in" element={withErrorBoundary(<SignInPage />)} />
      <Route path="/sign-up" element={withErrorBoundary(<SignUpPage />)} />
      <Route path="/oauth/callback" element={withErrorBoundary(<OAuthCallbackPage />)} />
      <Route path="/login" element={withErrorBoundary(<Navigate to="/sign-in" replace />)} />
      <Route path="/forgot-password" element={withErrorBoundary(<ForgotPasswordPage />)} />
      <Route path="/reset-password" element={withErrorBoundary(<ResetPasswordPage />)} />
      <Route path="/verify-email" element={withErrorBoundary(<VerifyEmailPage />)} />
      <Route path="/about-us" element={withErrorBoundary(<AboutUs />)} />

      {/* Protected routes with Layout */}
      <Route
        path="/dashboard"
        element={withErrorBoundary(<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>)}
      />
      <Route
        path="/settings"
        element={withErrorBoundary(<RequireAuth><Layout><GeneralSettings /></Layout></RequireAuth>)}
      />
      <Route
        path="/profile"
        element={withErrorBoundary(<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>)}
      />
      <Route
        path="/profile/:userId"
        element={withErrorBoundary(<RequireAuth><Layout><UserProfilePage /></Layout></RequireAuth>)}
      />
      <Route
        path="/team/:team_id"
        element={withErrorBoundary(<RequireAuth><Layout><TaskBoard /></Layout></RequireAuth>)}
      />
      <Route
        path="/personal"
        element={withErrorBoundary(<RequireAuth><Layout><Navigate to="/dashboard" replace /></Layout></RequireAuth>)}
      />
      <Route
        path="/task/new"
        element={withErrorBoundary(<RequireAuth><Layout><TaskView /></Layout></RequireAuth>)}
      />
      <Route
        path="/task/:taskId"
        element={withErrorBoundary(<RequireAuth><Layout><TaskView /></Layout></RequireAuth>)}
      />
    </Routes>
    </AnimatePresence>
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
