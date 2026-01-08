// auth.ts - Legacy compatibility layer
// DEPRECATED: Use authManager instead
import { getAuthToken, getAuthHeaders as getAuthHeadersFromManager } from './authManager.js';

export const getToken = () => getAuthToken();

export const getAuthHeaders = (): Record<string, string> => getAuthHeadersFromManager();
