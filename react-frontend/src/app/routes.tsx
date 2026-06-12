import React, { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { routeFadeVariants } from '@/shared/lib/animations.js';
import { Layout } from '@/widgets/Layout/Layout.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { getLastWorkspaceId } from '@/contexts/useWorkspace.js';
import { preloadCoreWorkspaceRoutes } from './routePreload.js';
import { useAuth } from '@/contexts/useAuth.js';
import { lazyWithRetry } from '@/shared/lib/loadWithRetry.js';
import { PageRouteSkeleton } from '@/shared/ui/PageLoadState.js';
import { isExplicitLogoutPending } from '@/shared/lib/authManager.js';

// Lazy-loaded pages
const SignInPage      = lazyWithRetry('sign-in', () => import('@/pages/auth/SignInPage/SignInPage.js').then(m => ({ default: m.SignInPage })));
const SignUpPage      = lazyWithRetry('sign-up', () => import('@/pages/auth/SignUpPage/SignUpPage.js').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazyWithRetry('forgot-password', () => import('@/pages/auth/ForgotPasswordPage/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = lazyWithRetry('reset-password', () => import('@/pages/auth/ResetPasswordPage/ResetPasswordPage.js').then(m => ({ default: m.ResetPasswordPage })));
const OAuthCallbackPage  = lazyWithRetry('oauth-callback', () => import('@/pages/auth/OAuthCallbackPage/OAuthCallbackPage.js').then(m => ({ default: m.OAuthCallbackPage })));
const OnboardingPage  = lazyWithRetry('onboarding', () => import('@/pages/onboarding/OnboardingPage.js').then(m => ({ default: m.OnboardingPage })));
const VerifyEmailPage = lazyWithRetry('verify-email', () => import('@/pages/verify/VerifyEmailPage.js').then(m => ({ default: m.VerifyEmailPage })));
const WorkspacePage   = lazyWithRetry('workspace', () => import('@/pages/workspace/WorkspacePage.js').then(m => ({ default: m.WorkspacePage })));
const ProjectPage     = lazyWithRetry('project', () => import('@/pages/workspace/ProjectPage.js').then(m => ({ default: m.ProjectPage })));
const ProfilePage     = lazyWithRetry('profile', () => import('@/pages/profile/UserProfile.js').then(m => ({ default: m.default })));
const UserProfilePage = lazyWithRetry('user-profile', () => import('@/pages/profile/UserProfilePage.js').then(m => ({ default: m.UserProfilePage })));
const InviteAcceptPage  = lazyWithRetry('invite-accept', () => import('@/pages/invite/InviteAcceptPage.js').then(m => ({ default: m.InviteAcceptPage })));
const MyIssuesPage      = lazyWithRetry('my-issues', () => import('@/pages/tasks/MyIssuesPage.js').then(m => ({ default: m.MyIssuesPage })));
const TaskDetailPage    = lazyWithRetry('task-detail', () => import('@/pages/tasks/TaskDetailPage.js').then(m => ({ default: m.TaskDetailPage })));
const TaskExplorerPage  = lazyWithRetry('task-explorer', () => import('@/pages/tasks/TaskExplorerPage.js').then(m => ({ default: m.TaskExplorerPage })));
const MembersPage       = lazyWithRetry('members', () => import('@/features/members/MembersPage.js').then(m => ({ default: m.MembersPage })));
const AboutUs           = lazyWithRetry('about-us', () => import('@/pages/about-us/AboutUs.js'));
const LanderPage        = lazyWithRetry('lander', () => import('@/pages/lander/LanderPage.js').then(m => ({ default: m.LanderPage })));
const SettingsModal     = lazyWithRetry('settings-modal', () => import('@/widgets/SettingsModal/SettingsModal.js').then(m => ({ default: m.SettingsModal })));

const Fallback = () => (
  <div className="app-loading-gate">
    <div className="app-loading-spinner" />
  </div>
);

const RouteContentFallback = () => (
  <PageRouteSkeleton />
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

const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>
      {children}
    </ErrorBoundary>
  );
};

const withEB = (el: React.ReactNode) => <RouteErrorBoundary>{el}</RouteErrorBoundary>;
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
        <Route path="/"                element={publicRoute(<LanderPage />)} />
        <Route path="/sign-in"         element={publicRoute(<SignInPage />)} />
        <Route path="/sign-up"         element={publicRoute(<SignUpPage />)} />
        <Route path="/oauth/callback"  element={publicRoute(<OAuthCallbackPage />)} />
        <Route path="/login"           element={withEB(<Navigate to="/sign-in" replace />)} />
        <Route path="/forgot-password" element={publicRoute(<ForgotPasswordPage />)} />
        <Route path="/reset-password"  element={publicRoute(<ResetPasswordPage />)} />
        <Route path="/verify-email"    element={publicRoute(<VerifyEmailPage />)} />
        <Route path="/about-us"        element={publicRoute(<AboutUs />)} />
        <Route path="/lander"          element={withEB(<Navigate to="/" replace />)} />
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

const ShellRoute: React.FC = () => {
  const location = useLocation();
  // When an overlay route (e.g. /settings) opens over a background, key the
  // content crossfade on the background path so the shell content holds still.
  const background = (location.state as { background?: typeof location } | null)?.background;
  const contentKey = (background ?? location).pathname;
  return (
    <RequireAuth>
      <Layout>
        <motion.div
          key={contentKey}
          className="route-content-shell"
          variants={routeFadeVariants}
          initial="initial"
          animate="animate"
        >
          <Suspense fallback={<RouteContentFallback />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </Layout>
    </RequireAuth>
  );
};

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
    if (!isExplicitLogoutPending()) {
      localStorage.setItem('redirectPath', location.pathname + location.search);
    }
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};
