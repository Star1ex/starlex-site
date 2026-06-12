import { apiClient, httpClient } from '../../services/api/client.js';

type AccessTokenPayload = {
  exp?: number;
};

export type AuthUserCache = {
  email?: string;
  firstName?: string;
  lastName?: string;
  photo_url?: string | null;
  avatar_url?: string | null;
};

type AuthUserSource = AuthUserCache & {
  first_name?: string;
  last_name?: string;
};

// Token methods now delegate to ApiClient (in-memory) instead of localStorage
export const getAuthToken = (): string | null => apiClient.getAccessToken();
export const setAuthToken = (token: string): void => apiClient.setAccessToken(token);
export const clearAuthToken = (): void => apiClient.clearAccessToken();
export const isAuthenticated = (): boolean => apiClient.getAccessToken() !== null;

const decodeJwtPayload = (token: string): AccessTokenPayload | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as unknown;
    if (!decoded || typeof decoded !== 'object') return null;
    const { exp } = decoded as { exp?: unknown };
    return { exp: typeof exp === 'number' ? exp : undefined };
  } catch (err) {
    console.error('Error decoding token payload:', err);
    return null;
  }
};

// Token expiry check (decodes JWT payload if present)
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;

  const decoded = decodeJwtPayload(token);
  if (!decoded?.exp) return true;
  // Buffer time of 60 seconds
  return Date.now() >= (decoded.exp * 1000 - 60000);
};

// Display cache only. Keep credentials, ids, providers, and verification state out of localStorage.
const USER_KEY = 'user';
const EXPLICIT_LOGOUT_KEY = 'starlex:auth:explicit-logout';

export const markExplicitLogout = (): void => {
  try {
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, String(Date.now()));
  } catch (err) {
    console.error('Failed to mark explicit logout:', err);
  }
};

export const clearExplicitLogout = (): void => {
  try {
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  } catch (err) {
    console.error('Failed to clear explicit logout marker:', err);
  }
};

export const isExplicitLogoutPending = (): boolean => {
  try {
    return localStorage.getItem(EXPLICIT_LOGOUT_KEY) !== null;
  } catch (err) {
    console.error('Failed to read explicit logout marker:', err);
    return false;
  }
};

export const setAuthUser = (user: AuthUserSource): void => {
  const displayCache: AuthUserCache = {
    email: user.email,
    firstName: user.firstName ?? user.first_name ?? '',
    lastName: user.lastName ?? user.last_name ?? '',
    photo_url: user.photo_url ?? null,
    avatar_url: user.avatar_url ?? null,
  };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(displayCache));
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
};

export const getAuthUser = (): AuthUserCache | null => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    const parsed = JSON.parse(userStr) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const user = parsed as AuthUserSource;
    return {
      email: typeof user.email === 'string' ? user.email : undefined,
      firstName: typeof user.firstName === 'string' ? user.firstName : user.first_name,
      lastName: typeof user.lastName === 'string' ? user.lastName : user.last_name,
      photo_url: user.photo_url ?? null,
      avatar_url: user.avatar_url ?? null,
    };
  } catch (err) {
    console.error('Failed to read user from localStorage:', err);
    return null;
  }
};

export const clearAuthUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const clearAllAuthData = (): void => {
  clearAuthToken();
  clearAuthUser();
};

export const clearAuthStorage = (): void => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('redirectPath');
  } catch (err) {
    console.error('Failed to clear local auth storage:', err);
  }

  try {
    sessionStorage.removeItem('prevRoutePath');
    sessionStorage.removeItem('prevRouteLabel');
    sessionStorage.removeItem('lastNonSettingsRoute');
  } catch (err) {
    console.error('Failed to clear session auth storage:', err);
  }
};

// Refresh access token using httpOnly refresh token cookie
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await httpClient.post<{ access_token: string }>('/api/auth/refresh');
    const data = response.data;
    if (data && data.access_token) {
      setAuthToken(data.access_token);
      return data.access_token;
    }

    clearAllAuthData();
    return null;
  } catch (err) {
    console.error('Error refreshing token:', err);
    clearAllAuthData();
    return null;
  }
};
