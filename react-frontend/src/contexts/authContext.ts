import { createContext } from 'react';

export type AuthContextType = {
  userId: string | null;
  userEmail: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
