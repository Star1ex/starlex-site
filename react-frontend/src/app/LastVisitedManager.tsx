import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api/client.js';
import { authService } from '@/services/api/index.js';
import { isExplicitLogoutPending } from '@/shared/lib/authManager.js';
import { getCookie, setCookie } from '@/shared/lib/cookies.js';

const LAST_URL_COOKIE_KEY = 'starlex-last-url';
const LAST_URL_MAX_AGE = 60 * 60 * 24 * 30;
const SAFE_QUERY_KEYS = new Set(['view']);
const SENSITIVE_ROUTE_MARKERS = [
  'token',
  'code',
  'secret',
  'invite',
  'reset',
  'oauth',
  'callback',
  'verify-email',
  'forgot-password',
];

const isAuthPath = (path: string) => {
  return (
    path === '/' ||
    path.startsWith('/sign-in') ||
    path.startsWith('/sign-up') ||
    path.startsWith('/verify-email') ||
    path.startsWith('/oauth/callback') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password')
  );
};

const clearLastUrlCookie = () => {
  setCookie(LAST_URL_COOKIE_KEY, '', { maxAge: 0, path: '/' });
};

const hasSensitiveMarker = (value: string) => {
  const lower = value.toLowerCase();
  return SENSITIVE_ROUTE_MARKERS.some((marker) => lower.includes(marker));
};

const sanitizeLastVisitedPath = (value: string): string | null => {
  if (!value.startsWith('/') || value.startsWith('//') || hasSensitiveMarker(value)) {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || isAuthPath(url.pathname)) {
      return null;
    }

    const safeParams = new URLSearchParams();
    for (const key of SAFE_QUERY_KEYS) {
      const paramValue = url.searchParams.get(key);
      if (paramValue && /^[a-z0-9_-]{1,40}$/i.test(paramValue)) {
        safeParams.set(key, paramValue);
      }
    }

    const query = safeParams.toString();
    return query ? `${url.pathname}?${query}` : url.pathname;
  } catch {
    return null;
  }
};

export const LastVisitedManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const didRedirectRef = useRef(false);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    if (didRedirectRef.current) return;
    const current = location.pathname;
    if (current !== '/') return;

    let mounted = true;
    const attemptRestore = async () => {
      const saved = sanitizeLastVisitedPath(getCookie(LAST_URL_COOKIE_KEY) ?? '');
      if (!saved) {
        clearLastUrlCookie();
        return;
      }
      if (saved === current) return;
      if (isExplicitLogoutPending()) return;

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
    const value = sanitizeLastVisitedPath(`${location.pathname}${location.search}`);
    if (!value) {
      clearLastUrlCookie();
      return;
    }
    setCookie(LAST_URL_COOKIE_KEY, value, { maxAge: LAST_URL_MAX_AGE, path: '/' });
  }, [location.pathname, location.search]);

  return null;
};
