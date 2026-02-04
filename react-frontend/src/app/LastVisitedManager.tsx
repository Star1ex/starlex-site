import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api/client.js';
import { authService } from '@/services/api/index.js';
import { getCookie, setCookie } from '@/shared/lib/cookies.js';

const LAST_URL_COOKIE_KEY = 'teamtrack-last-url';
const LAST_URL_MAX_AGE = 60 * 60 * 24 * 30;

const isAuthPath = (path: string) => {
  return (
    path === '/' ||
    path.startsWith('/sign-in') ||
    path.startsWith('/sign-up') ||
    path.startsWith('/verify-email')
  );
};

export const LastVisitedManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const didRedirectRef = useRef(false);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    if (didRedirectRef.current) return;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (current !== '/') return;

    let mounted = true;
    const attemptRestore = async () => {
      const saved = getCookie(LAST_URL_COOKIE_KEY);
      if (!saved || saved === current || isAuthPath(saved)) return;

      let authed = authService.isAuthenticated();
      if (!authed) {
        authed = await apiClient.initialize();
      }
      if (!mounted || !authed) return;

      skipSaveRef.current = true;
      didRedirectRef.current = true;
      navigate(saved, { replace: true });
    };

    attemptRestore();
    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    const value = `${location.pathname}${location.search}${location.hash}`;
    setCookie(LAST_URL_COOKIE_KEY, value, { maxAge: LAST_URL_MAX_AGE, path: '/' });
  }, [location.pathname, location.search, location.hash]);

  return null;
};
