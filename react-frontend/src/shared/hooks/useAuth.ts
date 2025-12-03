import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsAuthenticated(true);
    } else {
      localStorage.setItem('redirectPath', location.pathname);
      navigate('/sign-in', { replace: true });
    }
    setLoading(false);
  }, [navigate, location.pathname]);

  return { isAuthenticated, loading };
};
