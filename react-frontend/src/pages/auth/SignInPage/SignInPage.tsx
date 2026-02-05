import React, { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from '@/services/api/index.js';
import { setAuthUser } from '@/shared/lib/authManager.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { useTheme } from '@/shared/contexts/ThemeContext.js';
import { FaGoogle, FaGithub } from 'react-icons/fa';

export const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const { isAuthenticated, isLoading, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Wait for auth initialization
    if (isLoading) return;

    // If already authenticated, redirect to saved path or dashboard
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
      localStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
      return;
    }

    // Show success message if coming from verification page
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [isAuthenticated, isLoading, location, navigate, login]);

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
    setIsSubmitting(true);

    try {
      const result = await authService.login(data);

      if (result && result.user && result.access_token) {
        // Save user locally and set access token in ApiClient via AuthContext
        setAuthUser(result.user);
        await login(result.access_token);

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
        const data = err?.response?.data;
        if (data?.auth_providers) {
          setErrorMessage(data?.message || 'This email is linked to an OAuth provider. Please continue with Google or GitHub.');
        } else {
          setErrorMessage(data?.error || 'Invalid email or password');
        }
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
      setIsSubmitting(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    setErrorMessage("");
    setSuccessMessage("");
    setOauthLoading(provider);
    const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
    window.location.href = `/api/auth/${provider}?redirect=${encodeURIComponent(redirectPath)}`;
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
      >
        {theme === 'light' && 'Light'}
        {theme === 'dark' && 'Dark Blue'}
        {theme === 'ultra-dark' && 'Ultra Dark'}
        {theme === 'solarized' && 'Solarized'}
      </button>
      <div className="auth-shell flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
        {/* Left panel */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start">
          <h1 className="text-4xl sm:text-5xl md:text-7xl text-black dark:text-dark-text font-serif mb-4 md:mb-6 transition-colors duration-300">
            Welcome
          </h1>
          <div className="w-16 sm:w-24 md:w-1/3 h-0.5 bg-black dark:bg-dark-text mb-4 md:mb-6 transition-colors duration-300"></div>
          <p className="text-base sm:text-lg text-black dark:text-dark-text-muted transition-colors duration-300">
            Continue your journey
          </p>
        </div>

        {/* Right panel */}
        <div className="auth-panel w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <form className="space-y-6 sm:space-y-7" onSubmit={handleSubmit}>
            
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-center text-sm text-green-700 font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                value={formEmail}
                onChange={handleSetEmail}
                type="email"
                placeholder="your@email.com"
                disabled={isSubmitting}
                className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                value={formPassword}
                onChange={handleSetPassword}
                type="password"
                placeholder="********"
                disabled={isSubmitting}
                className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              disabled={isSubmitting}
              className="text-xs uppercase tracking-wider text-black/70 dark:text-dark-text-muted hover:text-black dark:hover:text-dark-text transition-colors duration-200"
            >
              Forgot Password?
            </button>
            </div>

            {errorMessage && (
              <p className="text-center text-sm text-red-600 font-medium transition-colors duration-300">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-6 sm:mt-8 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-md shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
              <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-dark-text-muted">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isSubmitting || oauthLoading !== null}
                className="w-full py-3 border border-black dark:border-dark-border text-black dark:text-dark-text font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGoogle className="w-4 h-4 text-gray-900 dark:text-white" />
                  {oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={isSubmitting || oauthLoading !== null}
                className="w-full py-3 border border-black dark:border-dark-border text-black dark:text-dark-text font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGithub className="w-4 h-4 text-gray-900 dark:text-white" />
                  {oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                </span>
              </button>
            </div>

            <p className="text-center text-sm text-black dark:text-dark-text pt-4 transition-colors duration-300">
              New to Team Track?{" "}
              <button
                type="button"
                onClick={handleToSignUp}
                disabled={isSubmitting}
                className="text-black dark:text-dark-text font-medium hover:text-gray-700 dark:hover:text-dark-text-muted transition-colors duration-200"
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
