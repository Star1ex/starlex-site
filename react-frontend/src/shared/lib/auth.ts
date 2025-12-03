// auth.ts
export const getToken = () => localStorage.getItem('token');

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
