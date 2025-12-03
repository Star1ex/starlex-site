import React from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home/HomePage.js";
import { SignInPage } from "@/pages/auth/SignInPage/SignInPage.js";
import { SignUpPage } from "@/pages/auth/SignUpPage/SignUpPage.js";
import { Dashboard  } from "@/pages/dashboard/Dashboard.js";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/sign-up" element={<SignUpPage />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
);
