const TOKEN_KEY = "auth_token";

export const Token = {
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
