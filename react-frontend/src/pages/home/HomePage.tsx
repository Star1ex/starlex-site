import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button.js";

// HomePage first page which user can see
export const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFD1C1]">
      <h1 className="text-7xl text-[#60392f] font-serif mb-6">
        Welcome to TeamTrack
      </h1>
      <p className="text-[#60392f] font-serif ">
        Open Source minimalistic task-manager.
      </p>
      <div className="gap-4">
        <Button variant={"secondary"} size={"md"} onClick={handleGetStarted}>
          Get Started
        </Button>
      </div>
    </div>
  );
};
