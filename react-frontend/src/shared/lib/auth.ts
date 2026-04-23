// auth.ts - Legacy compatibility layer
// DEPRECATED: Use authManager instead
import { getAuthToken } from './authManager.js';

export const getToken = () => getAuthToken();

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
