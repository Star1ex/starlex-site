import React, { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '@/widgets/Layout/Layout.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { authService } from '@/services/api/index.js';
import { apiClient } from '@/services/api/client.js';
import { getLastWorkspaceId } from '@/contexts/WorkspaceContext.js';
import { SettingsModal } from '@/widgets/SettingsModal/SettingsModal.js';
import AboutUs from '@/pages/about-us/AboutUs.js';

// Lazy-loaded pages
const HomePage        = React.lazy(() => import('@/pages/home/HomePage.js').then(m => ({ default: m.HomePage })));
const SignInPage      = React.lazy(() => import('@/pages/auth/SignInPage/SignInPage.js').then(m => ({ default: m.SignInPage })));
const SignUpPage      = React.lazy(() => import('@/pages/auth/SignUpPage/SignUpPage.js').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = React.lazy(() => import('@/pages/auth/ResetPasswordPage/ResetPasswordPage.js').then(m => ({ default: m.ResetPasswordPage })));
const OAuthCallbackPage  = React.lazy(() => import('@/pages/auth/OAuthCallbackPage/OAuthCallbackPage.js').then(m => ({ default: m.OAuthCallbackPage })));
const OnboardingPage  = React.lazy(() => import('@/pages/onboarding/OnboardingPage.js').then(m => ({ default: m.OnboardingPage })));
const VerifyEmailPage = React.lazy(() => import('@/pages/verify/VerifyEmailPage.js').then(m => ({ default: m.VerifyEmailPage })));
const WorkspacePage   = React.lazy(() => import('@/pages/workspace/WorkspacePage.js').then(m => ({ default: m.WorkspacePage })));
const ProjectPage     = React.lazy(() => import('@/pages/workspace/ProjectPage.js').then(m => ({ default: m.ProjectPage })));
const ProfilePage     = React.lazy(() => import('@/pages/profile/UserProfile.js').then(m => ({ default: m.default })));
const UserProfilePage = React.lazy(() => import('@/pages/profile/UserProfilePage.js').then(m => ({ default: m.UserProfilePage })));
const InviteAcceptPage  = React.lazy(() => import('@/pages/invite/InviteAcceptPage.js').then(m => ({ default: m.InviteAcceptPage })));
const MyIssuesPage      = React.lazy(() => import('@/pages/tasks/MyIssuesPage.js').then(m => ({ default: m.MyIssuesPage })));
const TaskDetailPage    = React.lazy(() => import('@/pages/tasks/TaskDetailPage.js').then(m => ({ default: m.TaskDetailPage })));
const TaskExplorerPage  = React.lazy(() => import('@/pages/tasks/TaskExplorerPage.js').then(m => ({ default: m.TaskExplorerPage })));
const MembersPage       = React.lazy(() => import('@/features/members/MembersPage.js').then(m => ({ default: m.MembersPage })));

function preloadRoutes() {
  import('@/pages/workspace/WorkspacePage.js');
  import('@/pages/workspace/ProjectPage.js');
  import('@/pages/tasks/MyIssuesPage.js');
  import('@/pages/tasks/TaskExplorerPage.js');
  import('@/pages/tasks/TaskDetailPage.js');
  import('@/features/members/MembersPage.js');
  import('@/pages/profile/UserProfile.js');
  import('@/pages/profile/UserProfilePage.js');
}

const Fallback = () => (
  <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} />
);

const RouteContentFallback = () => (
  <div className="route-content-fallback" aria-hidden="true" />
);

const withEB = (el: React.ReactNode) => <ErrorBoundary>{el}</ErrorBoundary>;
const publicRoute = (el: React.ReactNode) => withEB(<Suspense fallback={<Fallback />}>{el}</Suspense>);
const authedRoute = (el: React.ReactNode) => (
  withEB(<RequireAuth><Suspense fallback={<Fallback />}>{el}</Suspense></RequireAuth>)
);

export const AppRoutes = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const idleWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(preloadRoutes, { timeout: 900 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(preloadRoutes, 250);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <AnimatedRoutes />
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const background = location.state?.background as typeof location | undefined;

  return (
    <>
      <Routes location={background || location}>
        {/* Public */}
        <Route path="/"                element={publicRoute(<HomePage />)} />
        <Route path="/sign-in"         element={publicRoute(<SignInPage />)} />
        <Route path="/sign-up"         element={publicRoute(<SignUpPage />)} />
        <Route path="/oauth/callback"  element={publicRoute(<OAuthCallbackPage />)} />
        <Route path="/login"           element={withEB(<Navigate to="/sign-in" replace />)} />
        <Route path="/forgot-password" element={publicRoute(<ForgotPasswordPage />)} />
        <Route path="/reset-password"  element={publicRoute(<ResetPasswordPage />)} />
        <Route path="/verify-email"    element={publicRoute(<VerifyEmailPage />)} />
        <Route path="/about-us"        element={publicRoute(<AboutUs />)} />
        <Route path="/invite/:token"   element={publicRoute(<InviteAcceptPage />)} />

        {/* Onboarding — authed, no layout shell */}
        <Route path="/onboarding" element={authedRoute(<OnboardingPage />)} />

        {/* Dashboard redirect → active workspace */}
        <Route path="/dashboard" element={withEB(<RequireAuth><DashboardRedirect /></RequireAuth>)} />
        <Route path="/personal" element={withEB(<RequireAuth><DashboardRedirect /></RequireAuth>)} />

        {/* Protected routes with persistent shell */}
        <Route element={withEB(<ShellRoute />)}>
          <Route path="/settings" element={<div />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/my-issues" element={<MyIssuesPage />} />
          <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
          <Route path="/workspace/:workspaceId/projects/:projectId" element={<ProjectPage />} />
          <Route path="/workspace/:workspaceId/tasks" element={<TaskExplorerPage />} />
          <Route path="/workspace/:workspaceId/members" element={<MembersPage />} />
          <Route path="/task/new" element={<TaskDetailPage />} />
          <Route path="/task/:taskId" element={<TaskDetailPage />} />
        </Route>
      </Routes>

      {/* Settings modal overlay */}
      <AnimatePresence>
        {location.pathname === '/settings' && (
          <SettingsModal key="settings-modal" />
        )}
      </AnimatePresence>
    </>
  );
};

const ShellRoute: React.FC = () => (
  <RequireAuth>
    <Layout>
      <Suspense fallback={<RouteContentFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  </RequireAuth>
);

/** Redirect to the last-visited workspace, or /onboarding if none. */
const DashboardRedirect: React.FC = () => {
  const lastId = getLastWorkspaceId();
  return <Navigate to={lastId ? `/workspace/${lastId}` : '/onboarding'} replace />;
};

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = React.useState(false);
  const [authed, setAuthed] = React.useState(authService.isAuthenticated());
  const location = useLocation();

  React.useEffect(() => {
    let mounted = true;
    if (authService.isAuthenticated()) {
      if (mounted) { setAuthed(true); setReady(true); }
      return;
    }
    apiClient.initialize().then((ok) => {
      if (mounted) { setAuthed(ok); setReady(true); }
    }).catch(() => {
      if (mounted) { setAuthed(false); setReady(true); }
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    if (authed) return <>{children}</>;
    return <Fallback />;
  }

  if (!authed) {
    localStorage.setItem('redirectPath', location.pathname + location.search);
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};
