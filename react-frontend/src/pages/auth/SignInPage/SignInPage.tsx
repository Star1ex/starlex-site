import React, { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from '@/services/api/index.js';
import { setAuthUser, isTokenExpired } from '@/shared/lib/authManager.js';

export const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user already has a valid access token, send to dashboard
    if (authService.isAuthenticated() && !isTokenExpired()) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // If token expired, try to refresh it
    if (authService.isAuthenticated() && isTokenExpired()) {
      const tryRefresh = async () => {
        const newToken = await authService.refresh();
        if (newToken) {
          navigate('/dashboard', { replace: true });
        }
        // If refresh fails, user stays on sign-in page (authService handles redirect)
      };
      tryRefresh();
      return;
    }

    // Show success message if coming from verification page
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location, navigate]);

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
    setSuccessMessage("");
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
    setIsLoading(true);

    try {
      const result = await authService.login(data);

      if (result && result.user) {
        // Save user locally
        setAuthUser(result.user);
        const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
        localStorage.removeItem('redirectPath');
        navigate(redirectPath, { replace: true });
        return;
      } else {
        setErrorMessage('Internal server error');
        return;
      }
    } catch (err: any) {
      const response = err?.response;
      const status = response?.status;

      if (status === 400 || status === 401) {
        setErrorMessage(err?.response?.data?.error || 'Invalid email or password');
      } else if (status === 403) {
        setErrorMessage(err?.response?.data?.message || 'Please verify your email first');
        if (err?.response?.data?.user_id) {
          setTimeout(() => {
            navigate('/verify-email', { state: { userId: err.response.data.user_id, email: formEmail } });
          }, 2000);
        }
      } else if (status === 409) {
        setErrorMessage('User already authenticated');
      } else {
        setErrorMessage(err?.response?.data?.error || 'Server authentication error');
      }

      console.error('Network error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white transition-colors duration-300">
      <div className="flex flex-col md:flex-row w-full max-w-5xl overflow-hidden bg-white">
        {/* Left panel */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start">
          <h1 className="text-4xl sm:text-5xl md:text-7xl text-black font-serif mb-4 md:mb-6 transition-colors duration-300">
            Welcome
          </h1>
          <div className="w-16 sm:w-24 md:w-1/3 h-0.5 bg-black mb-4 md:mb-6 transition-colors duration-300"></div>
          <p className="text-base sm:text-lg text-black transition-colors duration-300">
            Continue your journey
          </p>
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <form className="space-y-6 sm:space-y-7" onSubmit={handleSubmit}>
            
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-center text-sm text-green-700 font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                value={formEmail}
                onChange={handleSetEmail}
                type="email"
                placeholder="your@email.com"
                disabled={isLoading}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                value={formPassword}
                onChange={handleSetPassword}
                type="password"
                placeholder="********"
                disabled={isLoading}
                className="mt-1 w-full border-b bg-white border-black focus:border-black focus:outline-none py-2 text-black placeholder-gray-500 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            {errorMessage && (
              <p className="text-center text-sm text-red-600 font-medium transition-colors duration-300">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-6 sm:mt-8 bg-black text-white font-semibold rounded-md shadow-md hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-black pt-4 transition-colors duration-300">
              New to Team Track?{" "}
              <button
                type="button"
                onClick={handleToSignUp}
                disabled={isLoading}
                className="text-black font-medium hover:text-gray-700 transition-colors duration-200"
              >
                Create account
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};