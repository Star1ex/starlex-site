import React from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home/HomePage.js";
import { SignInPage } from "@/pages/auth/SignInPage/SignInPage.js";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/sign-in" element={<SignInPage />} />
  </Routes>
);
