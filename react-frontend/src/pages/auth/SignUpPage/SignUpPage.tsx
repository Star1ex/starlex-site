import React, { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from '@/services/api/index.js';
import { useTheme, useSystemThemeOnly } from '@/shared/contexts/ThemeContext.js';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { pageVariants, listVariants } from '@/shared/lib/animations.js';

export const SignUpPage = () => {
  useSystemThemeOnly();
  const navigate = useNavigate();
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState('');
  const [formFirstName, setFirstName] = useState("");
  const [formLastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [linkProviders, setLinkProviders] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();

  function handleToSignIn() {
    navigate("/sign-in");
  }
  
  function handleSetEmail(e: ChangeEvent<HTMLInputElement>) {
    setFormEmail(e.target.value);
  }
  
  function handleSetPassword(e: ChangeEvent<HTMLInputElement>) {
    setFormPassword(e.target.value);
  }
  
  function handleSetFirstName(e: ChangeEvent<HTMLInputElement>) {
    setFirstName(e.target.value);
  }
  
  function handleSetLastName(e: ChangeEvent<HTMLInputElement>) {
    setLastName(e.target.value);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setErrorMessage('');  
    setLinkProviders([]);
    e.preventDefault();

    if (!formEmail || !formPassword || !formFirstName || !formLastName) {
      setErrorMessage('All fields must be filled in');
      return; 
    }
    
    if (!formEmail.includes('@') || !formEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return; 
    }

    if (formPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const data = {
      email: formEmail,
      password: formPassword,
      first_name: formFirstName,
      last_name: formLastName
    };

    setIsLoading(true);

    try {
      const result = await authService.register({
        email: formEmail,
        password: formPassword,
        first_name: formFirstName,
        last_name: formLastName,
      });

      navigate('/verify-email', {
        state: {
          email: result.email,
        },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 400) {
        setErrorMessage(data?.error || 'Registration failed');
      } else if (status === 409) {
        const providers = Array.isArray(data?.auth_providers) ? data.auth_providers : [];
        setLinkProviders(providers);
        setErrorMessage(data?.message || 'Email already registered. Please sign in or link accounts.');
      } else if (status === 500) {
        setErrorMessage(data?.error || 'Server error. Please try again.');
      } else {
        setErrorMessage(err?.message || 'Unknown registration error');
      }

      console.error('Network or server error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOAuth = (provider: 'google' | 'github') => {
    setErrorMessage('');
    setOauthLoading(provider);
    const redirectPath = '/dashboard';
    window.location.href = `/api/auth/${provider}?redirect=${encodeURIComponent(redirectPath)}`;
  };

  return (
    <motion.div
      className="auth-page min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Helmet>
        <title>Sign Up — Starlex</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
      >
        {theme === 'light' ? 'Light' : 'Dark'}
      </button>
      <div className="auth-shell flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">

        {/* Left panel */}
        <motion.div
          className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl text-black dark:text-dark-text font-serif mb-4 md:mb-6 transition-colors duration-300">Begin</h1>
          <div className="w-16 sm:w-24 md:w-1/3 h-0.5 bg-black dark:bg-dark-text mb-4 md:mb-6 transition-colors duration-300"></div>
          <p className="text-base sm:text-lg text-black dark:text-dark-text-muted transition-colors duration-300">Start something new</p>
        </motion.div>

        {/* Right panel */}
        <div className="auth-panel w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <motion.form
            className="space-y-4 sm:space-y-6"
            onSubmit={handleSubmit}
            variants={listVariants}
            initial="initial"
            animate="animate"
          >

            <div>
              <label className="block text-sm sm:text-base font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">First Name</label>
              <input
                value={formFirstName}
                onChange={handleSetFirstName}
                type="text"
                placeholder="John"
                disabled={isLoading}
                className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">Last Name</label>
              <input
                value={formLastName}
                onChange={handleSetLastName}
                type="text"
                placeholder="Doe"
                disabled={isLoading}
                className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">Email</label>
              <input
                value={formEmail}
                onChange={handleSetEmail}
                type="email"
                placeholder="your@email.com"
                disabled={isLoading}
                className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-black dark:text-dark-text uppercase tracking-wider mb-1">Password</label>
              <input
                value={formPassword}
                onChange={handleSetPassword}
                type="password"
                placeholder="Min 6 characters"
                disabled={isLoading}
                className="auth-input mt-1 w-full border-b border-black dark:border-dark-border focus:border-black dark:focus:border-dark-text focus:outline-none py-2 text-black dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-muted transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            {errorMessage && (
              <p className="text-center text-sm text-red-600 font-medium transition-colors duration-300">
                {errorMessage}
              </p>
            )}

            {linkProviders.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-center text-xs uppercase tracking-widest text-gray-500 dark:text-dark-text-muted">Link existing account</p>
                {linkProviders.includes('google') && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading || oauthLoading !== null}
                    className="w-full py-3 border border-black dark:border-dark-border text-black dark:text-dark-text font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <FaGoogle className="w-4 h-4 text-gray-900 dark:text-white" />
                      {oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                    </span>
                  </button>
                )}
                {linkProviders.includes('github') && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('github')}
                    disabled={isLoading || oauthLoading !== null}
                    className="w-full py-3 border border-black dark:border-dark-border text-black dark:text-dark-text font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <FaGithub className="w-4 h-4 text-gray-900 dark:text-white" />
                      {oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {linkProviders.length === 0 && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                  <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-dark-text-muted">or</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading || oauthLoading !== null}
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
                    disabled={isLoading || oauthLoading !== null}
                    className="w-full py-3 border border-black dark:border-dark-border text-black dark:text-dark-text font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-200 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <FaGithub className="w-4 h-4 text-gray-900 dark:text-white" />
                      {oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                    </span>
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-4 sm:mt-6 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-md shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>

            <p className="text-center text-sm text-black dark:text-dark-text pt-3 sm:pt-4 transition-colors duration-300">
              Have an account?{" "}
              <button
                type="button"
                className="text-black dark:text-dark-text font-medium hover:text-gray-700 dark:hover:text-dark-text-muted transition-colors duration-200"
                onClick={handleToSignIn}
                disabled={isLoading}
              >
                Sign-In
              </button>
            </p>

          </motion.form>
        </div>
      </div>
    </motion.div>
  );
};
