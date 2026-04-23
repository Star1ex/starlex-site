import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated as checkAuth, getAuthUser } from '@/shared/lib/authManager.js';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authenticated = checkAuth();
    const user = getAuthUser();

    if (authenticated && user) {
      setIsAuthenticated(true);
    } else {
      // Only redirect if not already on a public auth page
      if (!['/sign-in', '/sign-up', '/verify-email', '/'].includes(location.pathname)) {
        localStorage.setItem('redirectPath', location.pathname);
        navigate('/sign-in', { replace: true });
      }
    }
    setLoading(false);
  }, [navigate, location.pathname]);

  return { isAuthenticated, loading };
};
