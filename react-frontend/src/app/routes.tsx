import React, { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '@/widgets/Layout/Layout.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { getLastWorkspaceId } from '@/contexts/useWorkspace.js';
import { preloadCoreWorkspaceRoutes } from './routePreload.js';
import { useAuth } from '@/contexts/useAuth.js';

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
const AboutUs           = React.lazy(() => import('@/pages/about-us/AboutUs.js'));
const SettingsModal     = React.lazy(() => import('@/widgets/SettingsModal/SettingsModal.js').then(m => ({ default: m.SettingsModal })));

const Fallback = () => (
  <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} />
);

const RouteContentFallback = () => (
  <div className="route-content-fallback" aria-hidden="true" />
);

const SettingsModalFallback = () => (
  <div className="settings-overlay" aria-hidden="true">
    <div className="settings-backdrop" />
    <div className="settings-modal-shell">
      <aside className="settings-modal-sidebar">
        <div className="settings-profile-wrap">
          <div className="settings-profile-card">
            <div className="settings-profile-avatar" />
            <div className="settings-profile-copy">
              <div className="settings-panel-skeleton__line settings-panel-skeleton__line--short" />
              <div className="settings-panel-skeleton__line" />
            </div>
          </div>
        </div>
      </aside>
      <div className="settings-main-panel">
        <div className="settings-modal-header">
          <div>
            <div className="settings-header-kicker">Settings</div>
            <h2 className="settings-header-title">Loading</h2>
          </div>
        </div>
        <div className="settings-content-scroll">
          <div className="settings-content-inner">
            <div className="settings-page">
              <section className="settings-section settings-panel-skeleton">
                <div className="settings-panel-skeleton__title" />
                <div className="settings-panel-skeleton__line" />
                <div className="settings-panel-skeleton__line settings-panel-skeleton__line--short" />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
      const id = idleWindow.requestIdleCallback(preloadCoreWorkspaceRoutes, { timeout: 1200 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(preloadCoreWorkspaceRoutes, 600);
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
          <Suspense fallback={<SettingsModalFallback />}>
            <SettingsModal key="settings-modal" />
          </Suspense>
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
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <Fallback />;
  }

  if (!isAuthenticated) {
    localStorage.setItem('redirectPath', location.pathname + location.search);
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};
