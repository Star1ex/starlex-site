import React from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home/HomePage.js";
import { SignInPage } from "@/pages/auth/SignInPage/SignInPage.js";
import { SignUpPage } from "@/pages/auth/SignUpPage/SignUpPage.js";
import { Dashboard  } from "@/pages/dashboard/Dashboard.js";
import { GeneralSettings } from "@/pages/settings/GeneralSettings.js";
import AboutUs from "@/pages/about-us/AboutUs.js";
import ProfilePage from "@/pages/profile/UserProfile.js";
import TaskBoard from "@/pages/team/TaskBoard.js"; 

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/sign-up" element={<SignUpPage />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/settings" element={<GeneralSettings />} />
    <Route path="/about-us" element={<AboutUs />} />
    <Route path="/profile" element={<ProfilePage/> } />
    <Route path="/team/:team_id" element={<TaskBoard />} /> 
  </Routes> 
);
