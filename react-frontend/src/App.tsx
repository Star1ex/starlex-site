import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes.js";
import { ErrorBoundary } from "@/components/ErrorBoundary.js";
import { ThemeProvider } from "@/shared/contexts/ThemeContext.js";
import { LastVisitedManager } from "@/app/LastVisitedManager.js";

export const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <LastVisitedManager />
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Lazy import to avoid cycles in top-level imports
import { AuthProvider } from '@/contexts/AuthContext.js';
