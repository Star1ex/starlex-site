export type UserProfile = {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  photo_url?: string | null;
};

export const API_URL = import.meta.env.VITE_API_URL ?? '';

export const getToken = () => localStorage.getItem('token');
