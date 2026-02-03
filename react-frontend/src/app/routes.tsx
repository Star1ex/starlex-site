import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/widgets/Layout/Layout.js";
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary.js';

// Lazy-loaded pages for better initial bundle size
const HomePage = React.lazy(() => import('@/pages/home/HomePage.js').then(m => ({ default: m.HomePage })));
const SignInPage = React.lazy(() => import('@/pages/auth/SignInPage/SignInPage.js').then(m => ({ default: m.SignInPage })));
const SignUpPage = React.lazy(() => import('@/pages/auth/SignUpPage/SignUpPage.js').then(m => ({ default: m.SignUpPage })));
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

const Fallback = () => <div className="p-6">Loading…</div>;

export const AppRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<Fallback />}>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected routes with Layout */}
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/settings" element={<Layout><GeneralSettings /></Layout>} />
      <Route path="/about-us" element={<Layout><AboutUs /></Layout>} />
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      <Route path="/profile/:userId" element={<Layout><UserProfilePage /></Layout>} />
      <Route path="/team/:team_id" element={<Layout><TaskBoard /></Layout>} />
      <Route path="/personal" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
      <Route path="/task/new" element={<Layout><TaskView /></Layout>} />
      <Route path="/task/:taskId" element={<Layout><TaskView /></Layout>} />
    </Routes>
  </Suspense>
  </ErrorBoundary>
);
