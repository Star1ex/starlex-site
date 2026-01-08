/**
 * Centralized Authentication Manager
 * 
 * This abstraction layer allows for easy transition from token-based
 * to cookie-based authentication without changing consuming code.
 * 
 * Current implementation: Token-based (localStorage)
 * Future implementation: Cookie-based (will be seamless switch)
 */

export interface AuthStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  isAuthenticated(): boolean;
}

class TokenStorage implements AuthStorage {
  private readonly TOKEN_KEY = 'token';

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
    return !!this.getToken();
  }
}

// Future: CookieStorage implementation
// class CookieStorage implements AuthStorage {
//   getToken(): string | null {
//     // Read from httpOnly cookie via API endpoint
//     return null;
//   }
//   setToken(token: string): void {
//     // Set via API endpoint
//   }
//   clearToken(): void {
//     // Clear via API endpoint
//   }
//   isAuthenticated(): boolean {
//     // Check via API endpoint
//     return false;
//   }
// }

// Export singleton instance
// To switch to cookies, just change this:
export const authStorage: AuthStorage = new TokenStorage();

// Export convenience functions
export const getAuthToken = (): string | null => authStorage.getToken();
export const setAuthToken = (token: string): void => authStorage.setToken(token);
export const clearAuthToken = (): void => authStorage.clearToken();
export const isAuthenticated = (): boolean => authStorage.isAuthenticated();

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

