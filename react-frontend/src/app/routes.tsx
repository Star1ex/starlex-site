import React from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/widgets/Layout/Layout.js";
import { HomePage } from "@/pages/home/HomePage.js";
import { SignInPage } from "@/pages/auth/SignInPage/SignInPage.js";
import { SignUpPage } from "@/pages/auth/SignUpPage/SignUpPage.js";
import { Dashboard  } from "@/pages/dashboard/Dashboard.js";
import { VerifyEmailPage } from "@/pages/verify/VerifyEmailPage.js";
import { GeneralSettings } from "@/pages/settings/GeneralSettings.js";
import AboutUs from "@/pages/about-us/AboutUs.js";
import  ProfilePage  from "@/pages/profile/UserProfile.js";
import { UserProfilePage } from "@/pages/profile/UserProfilePage.js";
import TaskBoard from "@/pages/team/TaskBoard.js"; 

export const AppRoutes = () => (
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
  </Routes> 
);
