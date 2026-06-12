import React, { useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/services/api/client.js';
import { authService, userService } from '@/services/api/index.js';
import {
  clearAuthStorage,
  clearExplicitLogout,
  isExplicitLogoutPending,
  markExplicitLogout,
  setAuthUser,
} from '@/shared/lib/authManager.js';
import { realtimeClient } from '@/shared/lib/realtime.js';
import type { UserProfileDTO } from '@/types/dto.js';
import { AuthContext } from './authContext.js';

type AccessTokenPayload = {
  user_id?: string;
  id?: string;
  sub?: string;
};

type UserProfileWithId = UserProfileDTO & {
  id?: string;
};

const decodeTokenUserId = (token: string): string | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as unknown;
    if (!decoded || typeof decoded !== 'object') return null;
    const { user_id, id, sub } = decoded as AccessTokenPayload;
    return user_id ?? id ?? sub ?? null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      if (isExplicitLogoutPending()) {
        realtimeClient.disconnect();
        apiClient.clearAccessToken();
        clearAuthStorage();
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        return;
      }

      const hasSession = await apiClient.initialize();
      if (!hasSession) {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        return;
      }

      const profile = await userService.getProfile();
      const token = apiClient.getAccessToken();
      const id = token ? decodeTokenUserId(token) : null;
      const profileWithId: UserProfileWithId = profile;

      setUserId(id || profileWithId.id || null);
      setUserEmail(profile.email || null);
      setIsAuthenticated(true);
      setAuthUser({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        photo_url: profile.photo_url ?? null,
        avatar_url: profile.avatar_url ?? null,
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
    clearExplicitLogout();
    apiClient.setAccessToken(accessToken);
    await refreshUser();
  };

  const logout = async () => {
    markExplicitLogout();
    realtimeClient.disconnect();
    setUserId(null);
    setUserEmail(null);
    setIsAuthenticated(false);

    try {
      await authService.logout();
    } catch {
      // best-effort; still clear locally
    } finally {
      apiClient.clearAccessToken();
      clearAuthStorage();
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
