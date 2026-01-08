import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes.js";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary.js";
import { ThemeProvider } from "@/shared/contexts/ThemeContext.js";

export const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
