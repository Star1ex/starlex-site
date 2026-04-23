export type CookieOptions = {
  maxAge?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  const parts = [`${encodedName}=${encodedValue}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  parts.push(`Path=${options.path || '/'}`);

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  } else {
    parts.push('SameSite=Lax');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  document.cookie = parts.join('; ');
};

export const getCookie = (name: string): string | null => {
  const encodedName = encodeURIComponent(name);
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodedName}=`));
  if (!cookie) return null;
  const value = cookie.substring(encodedName.length + 1);
  return decodeURIComponent(value);
};
