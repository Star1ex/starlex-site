import { httpClient } from '@/services/api/client.js';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const method = options.method ? options.method.toLowerCase() : 'get';
  const data = (options as any).body ? JSON.parse((options as any).body as string) : undefined;

  const response = await httpClient.request({ url: endpoint, method, data, headers: options.headers as any });
  return response.data;
}


// utils.ts - TypeScript fetch utility
export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const fetchWithAuth = async (url: string, options: FetchOptions = {}): Promise<any> => {
  const method = options.method ? options.method.toLowerCase() : 'get';
  const data = (options as any).body ? JSON.parse((options as any).body as string) : undefined;
  const response = await httpClient.request({ url, method, data, headers: options.headers as any });
  return response.data;
};