import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes.js";
import { ErrorBoundary } from "@/components/ErrorBoundary.js";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/shared/contexts/ThemeContext.js";
import { LastVisitedManager } from "@/app/LastVisitedManager.js";
import { AuthProvider } from '@/contexts/AuthContext.js';
import { useAuth } from '@/contexts/useAuth.js';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext.js';

export const App = () => {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <BrowserRouter>
            <LastVisitedManager />
            <AuthProvider>
              <WorkspaceProvider>
                <AuthGate>
                  <AppRoutes />
                </AuthGate>
              </WorkspaceProvider>
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
      <div className="app-loading-gate">
        <div className="app-loading-spinner" />
      </div>
    );
  }
  return <>{children}</>;
};
