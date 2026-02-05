import { apiClient, httpClient } from './client.js';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ResendCodeRequest,
  AuthResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  PasswordResetConfirmRequest,
} from '../../types/dto.js';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/api/auth/login', credentials);
    apiClient.setAccessToken(response.data.access_token);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await httpClient.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/api/auth/verify', data);
    return response.data;
  },

  async resendCode(data: ResendCodeRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/api/auth/resend-code', data);
    return response.data;
  },

  async refresh(): Promise<string> {
    const response = await httpClient.post<{ access_token: string }>('/api/auth/refresh');
    const newToken = response.data.access_token;
    apiClient.setAccessToken(newToken);
    return newToken;
  },

  async ensureCsrfToken(): Promise<string> {
    const existing = apiClient.getCsrfToken();
    if (existing) return existing;
    const response = await httpClient.get<{ csrf_token: string }>('/api/auth/csrf');
    const token = response.data?.csrf_token || '';
    if (token) {
      apiClient.setCsrfToken(token);
    }
    return token;
  },

  async changePassword(data: PasswordChangeRequest): Promise<PasswordChangeResponse> {
    await this.ensureCsrfToken();
    const response = await httpClient.post<PasswordChangeResponse>('/api/auth/password-change', data);
    if (response.data?.access_token) {
      apiClient.setAccessToken(response.data.access_token);
    }
    return response.data;
  },

  async requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    await this.ensureCsrfToken();
    const response = await httpClient.post<AuthResponse>('/api/auth/password-reset/request', data);
    return response.data;
  },

  async verifyPasswordReset(data: PasswordResetVerifyRequest): Promise<AuthResponse> {
    await this.ensureCsrfToken();
    const response = await httpClient.post<AuthResponse>('/api/auth/password-reset/verify', data);
    return response.data;
  },

  async resetPassword(data: PasswordResetConfirmRequest): Promise<AuthResponse> {
    await this.ensureCsrfToken();
    const response = await httpClient.post<AuthResponse>('/api/auth/password-reset/confirm', data);
    return response.data;
  },

  logout() {
    apiClient.clearAccessToken();
    window.location.href = '/sign-in';
  },

  isAuthenticated(): boolean {
    return apiClient.getAccessToken() !== null;
  },
};
