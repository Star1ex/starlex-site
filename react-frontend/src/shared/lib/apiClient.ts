import { httpClient } from '@/services/api/client.js';

/**
 * Lightweight wrapper that returns a Fetch-like Response for compatibility
 */
export const apiClient = async (
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; json: () => Promise<any> }> => {
  const method = options.method ? (options.method as string).toLowerCase() : 'get';
  const data = (options as any).body ? JSON.parse((options as any).body as string) : undefined;

  try {
    const response = await httpClient.request({ url, method, data, headers: options.headers as any });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
    };
  } catch (err: any) {
    if (err.response) {
      return {
        ok: false,
        status: err.response.status,
        json: async () => err.response.data,
      };
    }
    throw err;
  }
};

export const apiGet = (url: string, options?: RequestInit) => {
  return apiClient(url, { ...options, method: 'GET' });
};

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

export const apiDelete = (url: string, options?: RequestInit) => {
  return apiClient(url, { ...options, method: 'DELETE' });
};

export default apiClient;
