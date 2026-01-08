import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button.js";
import { isAuthenticated } from "@/shared/lib/authManager.js";

export const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-dark-bg transition-colors duration-300 px-4 sm:px-6 lg:px-0">
      <h1 className="text-4xl sm:text-5xl md:text-7xl text-black dark:text-dark-text font-serif mb-4 sm:mb-6 text-center transition-colors duration-300">
        Welcome to TeamTrack
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-black dark:text-dark-text-muted font-serif mb-6 sm:mb-8 text-center transition-colors duration-300">
        Open Source minimalistic task-manager.
      </p>
      <div className="gap-4 flex flex-col sm:flex-row">
        <Button
          variant={"secondary"}
          size={"md"}
          onClick={handleGetStarted}
          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 w-full sm:w-auto"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
