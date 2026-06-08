import React, { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '@/widgets/Layout/Layout.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { authService } from '@/services/api/index.js';
import { apiClient } from '@/services/api/client.js';
import { getLastWorkspaceId } from '@/contexts/WorkspaceContext.js';

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
const GeneralSettings = React.lazy(() => import('@/pages/settings/GeneralSettings.js').then(m => ({ default: m.GeneralSettings })));
const AboutUs         = React.lazy(() => import('@/pages/about-us/AboutUs.js').then(m => ({ default: m.default })));
const ProfilePage     = React.lazy(() => import('@/pages/profile/UserProfile.js').then(m => ({ default: m.default })));
const UserProfilePage = React.lazy(() => import('@/pages/profile/UserProfilePage.js').then(m => ({ default: m.UserProfilePage })));
const TaskView        = React.lazy(() => import('@/components/Tasks/TaskView.js').then(m => ({ default: m.default })));
const SettingsModal     = React.lazy(() => import('@/widgets/SettingsModal/SettingsModal.js').then(m => ({ default: m.SettingsModal })));
const InviteAcceptPage  = React.lazy(() => import('@/pages/invite/InviteAcceptPage.js').then(m => ({ default: m.InviteAcceptPage })));

function preloadRoutes() {
  import('@/pages/workspace/WorkspacePage.js');
  import('@/pages/settings/GeneralSettings.js');
  import('@/pages/profile/UserProfile.js');
  import('@/pages/profile/UserProfilePage.js');
}

const Fallback = () => (
  <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} />
);

const withEB = (el: React.ReactNode) => <ErrorBoundary>{el}</ErrorBoundary>;

export const AppRoutes = () => {
  useEffect(() => { preloadRoutes(); }, []);
  return (
    <Suspense fallback={<Fallback />}>
      <AnimatedRoutes />
    </Suspense>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const background = location.state?.background as typeof location | undefined;

  return (
    <>
      <AnimatePresence mode="sync" initial={false}>
        <Routes
          location={background || location}
          key={(background || location).pathname}
        >
          {/* Public */}
          <Route path="/"                  element={withEB(<HomePage />)} />
          <Route path="/sign-in"           element={withEB(<SignInPage />)} />
          <Route path="/sign-up"           element={withEB(<SignUpPage />)} />
          <Route path="/oauth/callback"    element={withEB(<OAuthCallbackPage />)} />
          <Route path="/login"             element={withEB(<Navigate to="/sign-in" replace />)} />
          <Route path="/forgot-password"   element={withEB(<ForgotPasswordPage />)} />
          <Route path="/reset-password"    element={withEB(<ResetPasswordPage />)} />
          <Route path="/verify-email"      element={withEB(<VerifyEmailPage />)} />
          <Route path="/about-us"          element={withEB(<AboutUs />)} />
          <Route path="/invite/:token"     element={withEB(<InviteAcceptPage />)} />

          {/* Onboarding — authed, no layout shell */}
          <Route path="/onboarding"
            element={withEB(<RequireAuth><OnboardingPage /></RequireAuth>)}
          />

          {/* Dashboard redirect → active workspace */}
          <Route path="/dashboard"
            element={withEB(<RequireAuth><DashboardRedirect /></RequireAuth>)}
          />

          {/* Protected routes with Layout */}
          <Route path="/settings"
            element={withEB(<RequireAuth><Layout><div /></Layout></RequireAuth>)}
          />
          <Route path="/profile"
            element={withEB(<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>)}
          />
          <Route path="/profile/:userId"
            element={withEB(<RequireAuth><Layout><UserProfilePage /></Layout></RequireAuth>)}
          />
          <Route path="/personal"
            element={withEB(<RequireAuth><DashboardRedirect /></RequireAuth>)}
          />
          <Route path="/workspace/:workspaceId"
            element={withEB(<RequireAuth><Layout><WorkspacePage /></Layout></RequireAuth>)}
          />
          <Route path="/workspace/:workspaceId/projects/:projectId"
            element={withEB(<RequireAuth><Layout><ProjectPage /></Layout></RequireAuth>)}
          />
          <Route path="/task/new"
            element={withEB(<RequireAuth><Layout><TaskView /></Layout></RequireAuth>)}
          />
          <Route path="/task/:taskId"
            element={withEB(<RequireAuth><Layout><TaskView /></Layout></RequireAuth>)}
          />
        </Routes>
      </AnimatePresence>

      {/* Settings modal overlay */}
      <AnimatePresence>
        {location.pathname === '/settings' && (
          <SettingsModal key="settings-modal" />
        )}
      </AnimatePresence>
    </>
  );
};

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
