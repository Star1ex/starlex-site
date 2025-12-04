import React, { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


export const API_URL = import.meta.env.VITE_API_URL ?? '';


export const SignInPage = () => {
  const navigate = useNavigate();
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  function handleToSignUp() {
    navigate("/sign-up");
  }
  function handleSetEmail(e: ChangeEvent<HTMLInputElement>) {
    setFormEmail(e.target.value);
  }
  function handleSetPassword(e: ChangeEvent<HTMLInputElement>) {
    setFormPassword(e.target.value);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setErrorMessage("");
    e.preventDefault();

    if (!formEmail || !formPassword) {
      setErrorMessage("All ");
      return;
    }
    if (!formEmail.includes("@") || !formEmail.includes(".")) {
      setErrorMessage("Enter correct email");
      return;
    }

    const data = { email: formEmail, password: formPassword };
    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.token && result.user) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          console.log("Successfuly auth:", result.user.email);
          navigate("/dashboard");
          return;
        } else {
          setErrorMessage("Internal server error");
          return;
        }
      }

      const errorData = await response.json().catch(() => ({}));
      switch (response.status) {
        case 400:
        case 401:
          setErrorMessage(errorData.message || "Invalid email or password");
          break;
        case 409:
          setErrorMessage("User already auth");
          break;
        default:
          setErrorMessage("Error server auth");
      }
    } catch (error) {
      setErrorMessage("Missing connect to server");
      console.error("Network error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFD1C1]">
      <div className="flex max-w-5xl w-full  overflow-hidden">
        <div className="w-1/2 p-16 flex flex-col justify-center items-start">
          <h1 className="text-7xl text-[#60392f] font-serif mb-6">Welcome</h1>
          <div className="w-1/3 h-0.5 bg-[#d4a89a] mb-6"></div>
          <p className="text-lg text-gray-700">Continue your journey</p>
        </div>

        <div className="w-1/2 p-16 flex flex-col justify-center ">
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                Email
              </label>
              <input
                value={formEmail}
                onChange={handleSetEmail}
                type="email"
                placeholder="your@email.com"
                className="mt-1 w-full border-b bg-[#FFD1C1] border-gray-400 focus:border-[#d4a89a] focus:outline-none py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <input
                value={formPassword}
                onChange={handleSetPassword}
                type="password"
                placeholder="********"
                className="mt-1 w-full border-b bg-[#FFD1C1] border-gray-400 focus:border-[#d4a89a] focus:outline-none py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            {errorMessage && (
              <p className="text-center text-sm text-red-500 font-medium">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 mt-8 bg-[#d4a89a] text-white font-semibold rounded-md shadow-md hover:bg-[#c69a8c] transition duration-200"
            >
              Sign In
            </button>

            <p className="text-center text-sm text-gray-500 pt-4">
              Already a member?{" "}
              <a
                href="#"
                className="text-[#d4a89a] hover:text-[#c69a8c] font-medium"
                onClick={handleToSignUp}
              >
                Create account
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
