import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button.js";

export const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white transition-colors duration-300 px-4 sm:px-6 lg:px-0">
      <h1 className="text-4xl sm:text-5xl md:text-7xl text-black font-serif mb-4 sm:mb-6 text-center transition-colors duration-300">
        Welcome to TeamTrack
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-black font-serif mb-6 sm:mb-8 text-center transition-colors duration-300">
        Open Source minimalistic task-manager.
      </p>
      <div className="gap-4 flex flex-col sm:flex-row">
        <Button
          variant={"secondary"}
          size={"md"}
          onClick={handleGetStarted}
          className="bg-black text-white hover:bg-gray-800 transition-colors duration-200 w-full sm:w-auto"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
