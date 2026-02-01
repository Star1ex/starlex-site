import { apiClient, httpClient } from './client.js';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, VerifyEmailRequest, ResendCodeRequest, AuthResponse } from '../../types/dto.js';

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

  logout() {
    apiClient.clearAccessToken();
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return apiClient.getAccessToken() !== null;
  },
};