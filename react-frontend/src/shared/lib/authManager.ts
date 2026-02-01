import { apiClient, httpClient } from '../../services/api/client.js';

// Token methods now delegate to ApiClient (in-memory) instead of localStorage
export const getAuthToken = (): string | null => apiClient.getAccessToken();
export const setAuthToken = (token: string): void => apiClient.setAccessToken(token);
export const clearAuthToken = (): void => apiClient.clearAccessToken();
export const isAuthenticated = (): boolean => apiClient.getAccessToken() !== null;

// Token expiry check (decodes JWT payload if present)
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;

  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload));
    const exp = decoded.exp;
    if (!exp) return true;
    // Buffer time of 60 seconds
    return Date.now() >= (exp * 1000 - 60000);
  } catch (err) {
    console.error('Error checking token expiration:', err);
    return true;
  }
};

// User storage functions (kept in localStorage)
const USER_KEY = 'user';

export const setAuthUser = (user: any): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
};

export const getAuthUser = (): any | null => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
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


