import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Buttons/Button.js";

// HomePage first page which user can see
export const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFD1C1]">
      <h1 className="mb-7 text-6xl md:text-7xl font-serif text-foreground">
        Welcome to TeamTrack
      </h1>

      <div className="gap-4">
        <Button variant={"primary"} size={"md"} onClick={handleGetStarted}>
          Get Started
        </Button>
      </div>
    </div>
  );
};
