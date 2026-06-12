import React, { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from '@/services/api/index.js';
import { useTheme, useSystemThemeOnly } from '@/shared/contexts/useTheme.js';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { pageVariants, listVariants, listItemVariants } from '@/shared/lib/animations.js';
import { getApiErrorInfo } from '@/shared/lib/apiError.js';
import { Glass } from '@/shared/ui/glass/index.js';
import { clearExplicitLogout } from '@/shared/lib/authManager.js';

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
    } catch (err: unknown) {
      const { status, data, message } = getApiErrorInfo(err);

      if (status === 400) {
        setErrorMessage(data?.error || 'Registration failed');
      } else if (status === 409) {
        const providers = data?.auth_providers ?? [];
        setLinkProviders(providers);
        setErrorMessage(data?.message || 'Email already registered. Please sign in or link accounts.');
      } else if (status === 500) {
        setErrorMessage(data?.error || 'Server error. Please try again.');
      } else {
        setErrorMessage(message || 'Unknown registration error');
      }

      // error handled
    } finally {
      setIsLoading(false);
    }
  }

  const handleOAuth = (provider: 'google' | 'github') => {
    setErrorMessage('');
    clearExplicitLogout();
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
        className="absolute top-6 right-6 px-3 py-2 rounded-full label-caps text-[color:var(--sx-text-muted)] bg-[color:var(--sx-surface)] hover:bg-[color:var(--sx-surface-hover)] transition-colors"
      >
        {theme === 'light' ? 'Light' : 'Dark'}
      </button>

      <Glass
        as={motion.form}
        variant="modal"
        depth="floating"
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 space-y-5"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={listItemVariants} className="text-center space-y-1.5">
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em]">Starlex</p>
          <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)]">Begin</h1>
          <p className="text-body-sm text-[color:var(--sx-text-muted)]">Start something new</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">First Name</label>
            <input
              value={formFirstName}
              onChange={handleSetFirstName}
              type="text"
              placeholder="John"
              disabled={isLoading}
              className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
            />
          </div>
          <div>
            <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Last Name</label>
            <input
              value={formLastName}
              onChange={handleSetLastName}
              type="text"
              placeholder="Doe"
              disabled={isLoading}
              className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Email</label>
          <input
            value={formEmail}
            onChange={handleSetEmail}
            type="email"
            placeholder="your@email.com"
            disabled={isLoading}
            className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
          />
        </div>

        <div>
          <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Password</label>
          <input
            value={formPassword}
            onChange={handleSetPassword}
            type="password"
            placeholder="Min 6 characters"
            disabled={isLoading}
            className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
          />
        </div>

        {errorMessage && (
          <p className="text-center text-sm text-[color:var(--sx-danger)] font-medium">
            {errorMessage}
          </p>
        )}

        {linkProviders.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="label-caps text-center text-[color:var(--sx-text-subtle)]">Link existing account</p>
            {linkProviders.includes('google') && (
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 bg-[color:var(--sx-surface)] text-[color:var(--sx-text)] font-semibold rounded-[var(--radius-md)] hover:bg-[color:var(--sx-surface-hover)] transition-colors disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGoogle className="w-4 h-4 text-[color:var(--sx-text-muted)]" />
                  {oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>
            )}
            {linkProviders.includes('github') && (
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 bg-[color:var(--sx-surface)] text-[color:var(--sx-text)] font-semibold rounded-[var(--radius-md)] hover:bg-[color:var(--sx-surface-hover)] transition-colors disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGithub className="w-4 h-4 text-[color:var(--sx-text-muted)]" />
                  {oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                </span>
              </button>
            )}
          </div>
        )}

        {linkProviders.length === 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[color:var(--sx-line)]" />
              <span className="label-caps text-[color:var(--sx-text-subtle)]">or</span>
              <div className="flex-1 h-px bg-[color:var(--sx-line)]" />
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 bg-[color:var(--sx-surface)] text-[color:var(--sx-text)] font-semibold rounded-[var(--radius-md)] hover:bg-[color:var(--sx-surface-hover)] transition-colors disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGoogle className="w-4 h-4 text-[color:var(--sx-text-muted)]" />
                  {oauthLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={isLoading || oauthLoading !== null}
                className="w-full py-3 bg-[color:var(--sx-surface)] text-[color:var(--sx-text)] font-semibold rounded-[var(--radius-md)] hover:bg-[color:var(--sx-surface-hover)] transition-colors disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FaGithub className="w-4 h-4 text-[color:var(--sx-text-muted)]" />
                  {oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                </span>
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[color:var(--sx-accent)] text-[color:var(--sx-accent-contrast)] font-semibold rounded-[var(--radius-md)] hover:brightness-110 transition-[filter] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-[color:var(--sx-text-muted)]">
          Have an account?{" "}
          <button
            type="button"
            className="text-[color:var(--sx-text)] font-medium hover:text-[color:var(--sx-accent)] transition-colors"
            onClick={handleToSignIn}
            disabled={isLoading}
          >
            Sign-In
          </button>
        </p>
      </Glass>
    </motion.div>
  );
};
