import { apiClient, httpClient } from './client.js';
import { clearAuthStorage } from '@/shared/lib/authManager.js';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyResponse,
  ResendCodeRequest,
  AuthResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  PasswordResetConfirmRequest,
  SessionDTO,
  RequestEmailChangeRequest,
  ConfirmEmailChangeRequest,
} from '../../types/dto.js';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/api/auth/login', credentials);
    apiClient.setAccessToken(response.data.access_token);
    // Fetch CSRF token immediately after login so all mutations work
    await this.ensureCsrfToken();
    return response.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await httpClient.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyResponse> {
    const response = await httpClient.post<VerifyResponse>('/api/auth/verify', data);
    if (response.data.access_token) {
      apiClient.setAccessToken(response.data.access_token);
      await this.ensureCsrfToken();
    }
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

  async linkGoogle(redirectTo?: string): Promise<{ auth_url: string }> {
    const url = redirectTo ? `/api/auth/link-google?redirect=${encodeURIComponent(redirectTo)}` : '/api/auth/link-google';
    const response = await httpClient.post<{ auth_url: string }>(url);
    return response.data;
  },

  async linkGithub(redirectTo?: string): Promise<{ auth_url: string }> {
    const url = redirectTo ? `/api/auth/link-github?redirect=${encodeURIComponent(redirectTo)}` : '/api/auth/link-github';
    const response = await httpClient.post<{ auth_url: string }>(url);
    return response.data;
  },

  async unlinkGoogle(): Promise<AuthResponse> {
    const response = await httpClient.delete<AuthResponse>('/api/auth/unlink-google');
    return response.data;
  },

  async unlinkGithub(): Promise<AuthResponse> {
    const response = await httpClient.delete<AuthResponse>('/api/auth/unlink-github');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      // keepalive allows the request to finish even during navigation
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      apiClient.clearAccessToken();
      clearAuthStorage();
    }
  },

  isAuthenticated(): boolean {
    return apiClient.getAccessToken() !== null;
  },

  async listSessions(): Promise<SessionDTO[]> {
    const response = await httpClient.get<SessionDTO[]>('/api/auth/sessions');
    return Array.isArray(response.data) ? response.data : [];
  },

  async revokeSession(sessionId: string): Promise<void> {
    await httpClient.delete(`/api/auth/sessions/${sessionId}`);
  },

  async requestEmailChange(data: RequestEmailChangeRequest): Promise<void> {
    await this.ensureCsrfToken();
    await httpClient.post('/api/auth/email-change/request', data);
  },

  async confirmEmailChange(data: ConfirmEmailChangeRequest): Promise<void> {
    await this.ensureCsrfToken();
    await httpClient.post('/api/auth/email-change/confirm', data);
  },
};
