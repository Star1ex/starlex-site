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
      setErrorMessage("All fields required");
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white transition-colors duration-300">
      <div className="flex max-w-5xl w-full overflow-hidden">

        <div className="w-1/2 p-16 flex flex-col justify-center items-start">
          <h1 className="text-7xl text-black font-serif mb-6 transition-colors duration-300">
            Welcome
          </h1>
          <div className="w-1/3 h-0.5 bg-black mb-6 transition-colors duration-300"></div>
          <p className="text-lg text-black transition-colors duration-300">
            Continue your journey
          </p>
        </div>

        <div className="w-1/2 p-16 flex flex-col justify-center">
          <form className="space-y-7" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-black uppercase tracking-wider">
                Email
              </label>
              <input
                value={formEmail}
                onChange={handleSetEmail}
                type="email"
                placeholder="your@email.com"
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black uppercase tracking-wider">
                Password
              </label>
              <input
                value={formPassword}
                onChange={handleSetPassword}
                type="password"
                placeholder="********"
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300"
              />
            </div>

            {errorMessage && (
              <p className="text-center text-sm text-red-600 font-medium transition-colors duration-300">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 mt-8 bg-black text-white font-semibold rounded-md shadow-md hover:bg-gray-800 transition-colors duration-200"
            >
              Sign In
            </button>

            <p className="text-center text-sm text-black pt-4 transition-colors duration-300">
              Already a member?{" "}
              <a
                href="#"
                className="text-black font-medium hover:text-gray-700 transition-colors duration-200"
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
