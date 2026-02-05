import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { userService } from '@/services/api/index.js';
import { setAuthUser } from '@/shared/lib/authManager.js';
import { useAuth } from '@/contexts/AuthContext.js';

type CallbackStatus = 'loading' | 'error';

const providerLabel = (provider: string | null) => {
  if (provider === 'google') return 'Google';
  if (provider === 'github') return 'GitHub';
  return 'OAuth';
};

export const OAuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('Processing sign-in...');

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token');
  const error = params.get('error');
  const provider = params.get('provider');
  const rawReturnTo = params.get('return_to') || '/dashboard';
  const returnTo = rawReturnTo.startsWith('/') ? rawReturnTo : '/dashboard';

  useEffect(() => {
    let mounted = true;

    const handleSuccess = async (accessToken: string) => {
      await login(accessToken);
      const profile = await userService.getProfile();

      // Derive user id from token payload if needed
      let userId: string | null = null;
      try {
        const payload = accessToken.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        userId = decoded.user_id || decoded.id || decoded.sub || null;
      } catch (err) {
        userId = null;
      }

      setAuthUser({
        id: userId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        photo_url: profile.photo_url ?? null,
        avatar_url: profile.avatar_url ?? null,
        auth_providers: profile.auth_providers ?? [],
        google_id: profile.google_id ?? null,
        github_id: profile.github_id ?? null,
        email_verified: profile.email_verified ?? false,
      });

      if (!mounted) return;
      navigate(returnTo, { replace: true });
    };

    const handleError = (message: string) => {
      if (!mounted) return;
      setStatus('error');
      setErrorMessage(message);
    };

    if (error) {
      handleError(`Unable to complete ${providerLabel(provider)} sign-in. Please try again.`);
      return () => {
        mounted = false;
      };
    }

    if (!token) {
      handleError('Missing access token. Please try again.');
      return () => {
        mounted = false;
      };
    }

    handleSuccess(token).catch(() => {
      handleError('Failed to complete sign-in. Please try again.');
    });

    return () => {
      mounted = false;
    };
  }, [error, token, provider, returnTo, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-black mb-3">
          {status === 'loading' ? `Signing you in with ${providerLabel(provider)}` : 'Sign-in Error'}
        </h1>
        <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
        {status === 'error' && (
          <button
            onClick={() => navigate('/sign-in')}
            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
};
