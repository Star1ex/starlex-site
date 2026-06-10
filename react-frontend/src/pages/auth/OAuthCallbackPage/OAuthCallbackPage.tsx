import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type CallbackStatus = 'loading' | 'error';

const providerLabel = (provider: string | null) => {
  if (provider === 'google') return 'Google';
  if (provider === 'github') return 'GitHub';
  return 'OAuth';
};

export const OAuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('Redirecting...');

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const error = params.get('error');
  const provider = params.get('provider');
  const rawReturnTo = params.get('return_to') || '/dashboard';
  const returnTo = rawReturnTo.startsWith('/') ? rawReturnTo : '/dashboard';

  useEffect(() => {
    const handleError = (message: string) => {
      setStatus('error');
      setErrorMessage(message);
    };

    if (error) {
      handleError(`Unable to complete ${providerLabel(provider)} sign-in. Please try again.`);
      return;
    }

    navigate(returnTo, { replace: true });
  }, [error, provider, returnTo, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--sx-canvas)' }}>
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-[color:var(--sx-text)] mb-3">
          {status === 'loading' ? 'Redirecting...' : 'Sign-in Error'}
        </h1>
        <p className="text-sm text-[color:var(--sx-text-muted)] mb-6">{errorMessage}</p>
        {status === 'error' && (
          <button
            onClick={() => navigate('/sign-in')}
            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[color:var(--sx-accent)] text-[color:var(--sx-accent-contrast)] text-sm font-semibold hover:brightness-110 transition-colors"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
};
