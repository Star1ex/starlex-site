import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes.js";
import { ErrorBoundary } from "@/components/ErrorBoundary.js";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/shared/contexts/ThemeContext.js";
import { LastVisitedManager } from "@/app/LastVisitedManager.js";

export const App = () => {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <BrowserRouter>
            <LastVisitedManager />
            <AuthProvider>
              <AuthGate>
                <AppRoutes />
              </AuthGate>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInitialized } = useAuth();
  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span>Loading...</span>
      </div>
    );
  }
  return <>{children}</>;
};

// Lazy import to avoid cycles in top-level imports
import { AuthProvider, useAuth } from '@/contexts/AuthContext.js';
