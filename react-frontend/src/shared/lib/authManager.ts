/**
 * Centralized Authentication Manager with Refresh Token Support
 * 
 * Tokens:
 * - Access Token: 1 hour expiration, stored in localStorage
 * - Refresh Token: 7 days expiration, stored in httpOnly cookie (set by server)
 * 
 * Flow:
 * 1. On login, server returns access_token and sets refreshToken cookie
 * 2. API calls use access_token in Authorization header
 * 3. When access_token expires (401 error), automatically refresh using refresh token
 * 4. On logout or refresh token expiry, user is redirected to login
 */

export interface AuthStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  isAuthenticated(): boolean;
  isTokenExpired(): boolean;
}

class TokenStorage implements AuthStorage {
  private readonly TOKEN_KEY = 'access_token';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = token.split('.')[1];
      if (!payload) return true;
      
      const decoded = JSON.parse(atob(payload));
      const exp = decoded.exp;
      
      if (!exp) return true;
      
      // Add 60 second buffer - refresh if less than 1 minute left
      return Date.now() >= (exp * 1000 - 60000);
    } catch (err) {
      console.error('Error checking token expiration:', err);
      return true;
    }
  }
}

// Export singleton instance
export const authStorage: AuthStorage = new TokenStorage();

// Export convenience functions
export const getAuthToken = (): string | null => authStorage.getToken();
export const setAuthToken = (token: string): void => authStorage.setToken(token);
export const clearAuthToken = (): void => authStorage.clearToken();
export const isAuthenticated = (): boolean => authStorage.isAuthenticated();
export const isTokenExpired = (): boolean => authStorage.isTokenExpired();

// User storage functions
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

// Clear all auth data (logout)
export const clearAllAuthData = (): void => {
  clearAuthToken();
  clearAuthUser();
};

// Get auth headers for API calls
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
};

// Refresh access token using refresh token (stored in httpOnly cookie)
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      clearAllAuthData();
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
      return data.access_token;
    }

    return null;
  } catch (err) {
    console.error('Error refreshing token:', err);
    clearAllAuthData();
    return null;
  }
};


