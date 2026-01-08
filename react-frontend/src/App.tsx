import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes.js";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary.js";

export const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};
