import React, { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { authService, userService } from '@/services/api/index.js';
import { clearExplicitLogout, setAuthUser } from '@/shared/lib/authManager.js';
import { useAuth } from '@/contexts/useAuth.js';
import { useTheme, useSystemThemeOnly } from '@/shared/contexts/useTheme.js';
import { getLastWorkspaceId } from '@/contexts/useWorkspace.js';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { listVariants, listItemVariants, pageVariants } from '@/shared/lib/animations.js';
import { getApiErrorInfo } from '@/shared/lib/apiError.js';
import { Glass } from '@/shared/ui/glass/index.js';

export const SignInPage = () => {
  useSystemThemeOnly();
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

    // If already authenticated, redirect to saved path or last workspace
    if (isAuthenticated) {
      const redirectPath = localStorage.getItem('redirectPath');
      localStorage.removeItem('redirectPath');
      if (redirectPath && !redirectPath.startsWith('/sign')) {
        navigate(redirectPath, { replace: true });
        return;
      }
      const lastId = getLastWorkspaceId();
      navigate(lastId ? `/workspace/${lastId}` : '/onboarding', { replace: true });
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
        setAuthUser(result.user);
        await login(result.access_token);

        // Prefer explicit redirect, then onboarding check, then last workspace
        const redirectPath = localStorage.getItem('redirectPath');
        localStorage.removeItem('redirectPath');

        if (redirectPath && !redirectPath.startsWith('/sign') && !redirectPath.startsWith('/login')) {
          navigate(redirectPath, { replace: true });
          return;
        }

        if (result.needs_onboarding) {
          navigate('/onboarding', { replace: true });
          return;
        }

        // Check if user has any workspaces
        try {
          const workspaces = await userService.getWorkspaces();
          if (!Array.isArray(workspaces) || workspaces.length === 0) {
            navigate('/onboarding', { replace: true });
            return;
          }
        } catch {
          // If check fails, fall through to last visited
        }

        const lastId = getLastWorkspaceId();
        navigate(lastId ? `/workspace/${lastId}` : '/onboarding', { replace: true });
        return;
      } else {
        setErrorMessage('Internal server error');
        return;
      }
    } catch (err: unknown) {
      const { status, data } = getApiErrorInfo(err);

      if (status === 400 || status === 401) {
        if (data?.auth_providers) {
          setErrorMessage(data?.message || 'This email is linked to an OAuth provider. Please continue with Google or GitHub.');
        } else {
          setErrorMessage(data?.error || 'Invalid email or password');
        }
      } else if (status === 403) {
        setErrorMessage(data?.message || 'Please verify your email first');
        if (data?.user_id) {
          const userId = data.user_id;
          setTimeout(() => {
            navigate('/verify-email', { state: { userId, email: formEmail } });
          }, 2000);
        }
      } else if (status === 409) {
        setErrorMessage('User already authenticated');
      } else {
        setErrorMessage(data?.error || 'Server authentication error');
      }

      // error handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    setErrorMessage("");
    setSuccessMessage("");
    clearExplicitLogout();
    setOauthLoading(provider);
    const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
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
        <title>Sign In — Starlex</title>
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
        className="w-full max-w-sm p-8 space-y-6"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={listItemVariants} className="text-center space-y-1.5">
          <p className="label-caps text-[color:var(--sx-text-subtle)] tracking-[0.25em]">Starlex</p>
          <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)]">Welcome back</h1>
          <p className="text-body-sm text-[color:var(--sx-text-muted)]">Continue your journey</p>
        </motion.div>

        {successMessage && (
          <div className="rounded-lg px-3 py-2 bg-[color:var(--status-done-bg)]">
            <p className="text-center text-sm text-[color:var(--status-done-text)] font-medium">
              {successMessage}
            </p>
          </div>
        )}

        <motion.div variants={listItemVariants}>
          <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Email</label>
          <input
            value={formEmail}
            onChange={handleSetEmail}
            type="email"
            placeholder="your@email.com"
            disabled={isSubmitting}
            className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
          />
        </motion.div>

        <motion.div variants={listItemVariants}>
          <label className="label-caps block text-[color:var(--sx-text-subtle)] mb-1.5">Password</label>
          <input
            value={formPassword}
            onChange={handleSetPassword}
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            className="glass-input w-full px-3 py-2.5 !rounded-[var(--radius-md)] text-body-md disabled:opacity-50"
          />
        </motion.div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            disabled={isSubmitting}
            className="label-caps text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {errorMessage && (
          <p className="text-center text-sm text-[color:var(--sx-danger)] font-medium">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[color:var(--sx-accent)] text-[color:var(--sx-accent-contrast)] font-semibold rounded-[var(--radius-md)] hover:brightness-110 transition-[filter] disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[color:var(--sx-line)]" />
          <span className="label-caps text-[color:var(--sx-text-subtle)]">or</span>
          <div className="flex-1 h-px bg-[color:var(--sx-line)]" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isSubmitting || oauthLoading !== null}
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
            disabled={isSubmitting || oauthLoading !== null}
            className="w-full py-3 bg-[color:var(--sx-surface)] text-[color:var(--sx-text)] font-semibold rounded-[var(--radius-md)] hover:bg-[color:var(--sx-surface-hover)] transition-colors disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <FaGithub className="w-4 h-4 text-[color:var(--sx-text-muted)]" />
              {oauthLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
            </span>
          </button>
        </div>

        <p className="text-center text-sm text-[color:var(--sx-text-muted)]">
          New to Starlex?{" "}
          <button
            type="button"
            onClick={handleToSignUp}
            disabled={isSubmitting}
            className="text-[color:var(--sx-text)] font-medium hover:text-[color:var(--sx-accent)] transition-colors"
          >
            Create account
          </button>
        </p>
      </Glass>
    </motion.div>
  );
};
