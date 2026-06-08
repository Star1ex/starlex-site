import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/services/api/client.js';
import { authService, userService } from '@/services/api/index.js';
import { clearAuthStorage, setAuthUser } from '@/shared/lib/authManager.js';
import { realtimeClient } from '@/shared/lib/realtime.js';

type AuthContextType = {
  userId: string | null;
  userEmail: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const hasSession = await apiClient.initialize();
      if (!hasSession) {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        return;
      }

      // Pull profile
      const profile = await userService.getProfile();
      // Try to decode token for user id, falling back to profile.id
      const token = apiClient.getAccessToken();
      let id: string | null = null;
      if (token) {
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          id = decoded.user_id || decoded.id || decoded.sub || null;
        } catch (err) {
          // ignore
        }
      }

      setUserId(id || (profile as any).id || null);
      setUserEmail(profile.email || null);
      setIsAuthenticated(true);
      setAuthUser({
        id: id || (profile as any).id || null,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        photo_url: profile.photo_url ?? null,
        avatar_url: (profile as any).avatar_url ?? null,
        auth_providers: (profile as any).auth_providers ?? [],
        google_id: (profile as any).google_id ?? null,
        github_id: (profile as any).github_id ?? null,
        email_verified: (profile as any).email_verified ?? false,
      });
    } catch (err) {
      console.error('Auth refresh failed:', err);
      setUserId(null);
      setUserEmail(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string) => {
    apiClient.setAccessToken(accessToken);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort; still clear locally
    } finally {
      realtimeClient.disconnect();
      apiClient.clearAccessToken();
      clearAuthStorage();
      setUserId(null);
      setUserEmail(null);
      setIsAuthenticated(false);
      window.location.replace('/sign-in');
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isInitialized = !isLoading;

  return (
    <AuthContext.Provider value={{ userId, userEmail, isLoading, isInitialized, isAuthenticated, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
