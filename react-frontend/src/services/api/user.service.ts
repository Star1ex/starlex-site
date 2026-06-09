import { httpClient } from './client.js';
import { UserDTO, UserProfileDTO, UpdateUserRequest, WorkspaceDTO, NotificationPreferences } from '../../types/dto.js';

export const userService = {
  async getProfile(): Promise<UserProfileDTO> {
    const response = await httpClient.get<UserProfileDTO>('/api/users/profile');
    const d = response.data as any;
    // Normalize fields from snake_case if backend returns them
    return {
      email: d.email,
      firstName: d.firstName ?? d.first_name,
      lastName: d.lastName ?? d.last_name,
      role: d.role,
      photo_url: d.photo_url ?? null,
      avatar_url: d.avatar_url ?? null,
      auth_providers: d.auth_providers ?? [],
      google_id: d.google_id ?? null,
      github_id: d.github_id ?? null,
      email_verified: d.email_verified ?? d.is_verified ?? false,
      created_at: d.created_at ?? undefined,
      last_login_at: d.last_login_at ?? null,
    } as UserProfileDTO;
  },

  async updateProfile(data: UpdateUserRequest): Promise<{ Status: string }> {
    // Convert camelCase -> snake_case for backend
    const payload: any = {
      email: data.email,
      first_name: (data as any).firstName ?? (data as any).first_name,
      last_name: (data as any).lastName ?? (data as any).last_name,
      role: data.role,
      photo_url: data.photo_url ?? null,
    };

    const response = await httpClient.put<{ Status: string }>('/api/users/update', payload);
    return response.data;
  },

  async uploadPhoto(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await httpClient.post<{ url: string }>('/api/users/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getPhoto(): Promise<{ url: string }> {
    const response = await httpClient.get<{ url: string }>('/api/users/photo');
    return response.data;
  },

  async getWorkspaces(): Promise<WorkspaceDTO[]> {
    const response = await httpClient.get<WorkspaceDTO[]>('/api/users/workspaces');
    const d = response.data as any[];
    return (Array.isArray(d) ? d : []).map((w) => ({
      id: w.id ?? w.workspace_id,
      name: w.name,
      description: w.description,
      icon: w.icon ?? '',
    }));
  },

  // Public user endpoints
  async getUserProfileById(userId: string): Promise<any> {
    const response = await httpClient.get<any>(`/api/users/${userId}/profile`);
    const d = response.data as any;
    return {
      id: d.id,
      email: d.email,
      firstName: d.firstName ?? d.first_name,
      lastName: d.lastName ?? d.last_name,
      photo_url: d.photo_url ?? null,
      avatar_url: d.avatar_url ?? null,
      role: d.role,
    };
  },

  async getUserById(userId: string): Promise<any> {
    const response = await httpClient.get<any>(`/api/users/${userId}`);
    const d = response.data as any;
    return {
      id: d.id,
      email: d.email,
      firstName: d.firstName ?? d.first_name,
      lastName: d.lastName ?? d.last_name,
      photo_url: d.photo_url ?? null,
      avatar_url: d.avatar_url ?? null,
      role: d.role,
    };
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await httpClient.get<NotificationPreferences>('/api/users/preferences/notifications');
    return response.data;
  },

  async updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<void> {
    await httpClient.patch('/api/users/preferences/notifications', data);
  },
};
