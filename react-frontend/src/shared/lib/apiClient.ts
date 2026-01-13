/**
 * API Client with automatic token refresh on 401
 * 
 * Handles:
 * - Automatically refreshing access token when it expires
 * - Retrying failed requests with new token
 * - Clearing auth data and redirecting to login on permanent auth failure
 */

import { getAuthToken, refreshAccessToken, clearAllAuthData, getAuthHeaders } from './authManager.js';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Wrapper around fetch that handles token refresh on 401
 */
export const apiClient = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Add auth headers if not explicitly provided
  if (!options.headers) {
    options.headers = {};
  }

  const headers = options.headers as Record<string, string>;
  
  // If no authorization header is set, try to add token
  if (!headers['Authorization']) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, options);

  // Handle 401 - try to refresh token and retry
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;

      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        // Token refreshed successfully, update headers and retry
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);

        const retryOptions = { ...options, headers: retryHeaders };
        response = await fetch(url, retryOptions);

        onTokenRefreshed(newToken);
      } else {
        // Refresh failed - redirect to login
        window.location.href = '/sign-in';
        onTokenRefreshed(null);
        return response; // Return original 401 response
      }
    } else {
      // Refresh is already in progress, wait for it
      return new Promise(resolve => {
        subscribeTokenRefresh((token: string | null) => {
          if (token) {
            const retryHeaders = new Headers(headers);
            retryHeaders.set('Authorization', `Bearer ${token}`);
            const retryOptions = { ...options, headers: retryHeaders };
            fetch(url, retryOptions).then(resolve);
          } else {
            resolve(response);
          }
        });
      });
    }
  }

  return response;
};

/**
 * Convenience method for GET requests
 */
export const apiGet = (url: string, options?: RequestInit) => {
  return apiClient(url, { ...options, method: 'GET' });
};

/**
 * Convenience method for POST requests
 */
export const apiPost = (url: string, body?: any, options?: RequestInit) => {
  return apiClient(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
};

/**
 * Convenience method for PUT requests
 */
export const apiPut = (url: string, body?: any, options?: RequestInit) => {
  return apiClient(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
};

/**
 * Convenience method for DELETE requests
 */
export const apiDelete = (url: string, options?: RequestInit) => {
  return apiClient(url, { ...options, method: 'DELETE' });
};

export default apiClient;
