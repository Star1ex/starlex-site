import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button.js";

export const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white transition-colors duration-300">
      <h1 className="text-7xl text-black font-serif mb-6 transition-colors duration-300">
        Welcome to TeamTrack
      </h1>
      <p className="text-black font-serif mb-8 transition-colors duration-300">
        Open Source minimalistic task-manager.
      </p>
      <div className="gap-4 flex">
        <Button
          variant={"secondary"}
          size={"md"}
          onClick={handleGetStarted}
          className="bg-black text-white hover:bg-gray-800 transition-colors duration-200"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
