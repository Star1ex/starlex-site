export const API_URL = import.meta.env.VITE_API_URL ?? '';

const getToken = () => localStorage.getItem('token');

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}


// utils.ts - TypeScript fetch utility
export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const fetchWithAuth = async (url: string, options: FetchOptions = {}): Promise<any> => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
