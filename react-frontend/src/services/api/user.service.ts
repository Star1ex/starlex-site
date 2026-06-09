import { httpClient } from './client.js';
import { UserDTO, UserProfileDTO, UpdateUserRequest, WorkspaceDTO, NotificationPreferences } from '../../types/dto.js';

function normalizeWorkspace(raw: unknown): WorkspaceDTO {
  const data = raw as Partial<WorkspaceDTO> & { workspace_id?: string };
  return {
    id: data.id ?? data.workspace_id ?? '',
    name: data.name ?? '',
    description: data.description ?? '',
    icon: data.icon ?? '',
    color: data.color ?? '',
    key_prefix: data.key_prefix,
    default_task_status: data.default_task_status,
    member_default_role: data.member_default_role,
    role: data.role,
    member_count: data.member_count ?? 0,
    project_count: data.project_count ?? 0,
    created_at: data.created_at,
  };
}

type UserResponseShape = Partial<UserDTO> & {
  first_name?: string;
  last_name?: string;
};

function normalizeUser(raw: unknown): UserDTO {
  const data = raw as UserResponseShape;
  return {
    id: data.id ?? '',
    email: data.email ?? '',
    firstName: data.firstName ?? data.first_name ?? '',
    lastName: data.lastName ?? data.last_name ?? '',
    role: data.role ?? '',
    photo_url: data.photo_url ?? null,
    avatar_url: data.avatar_url ?? null,
    auth_providers: data.auth_providers ?? [],
    google_id: data.google_id ?? null,
    github_id: data.github_id ?? null,
    email_verified: data.email_verified ?? false,
  };
}

export const userService = {
  async getProfile(): Promise<UserProfileDTO> {
    const response = await httpClient.get<UserProfileDTO>('/api/users/profile');
    const d = response.data as UserProfileDTO & {
      first_name?: string;
      last_name?: string;
      is_verified?: boolean;
    };
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
    const payload = {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
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
    return (Array.isArray(response.data) ? response.data : []).map(normalizeWorkspace).filter((w) => w.id);
  },

  // Public user endpoints
  async getUserProfileById(userId: string): Promise<UserDTO> {
    const response = await httpClient.get<unknown>(`/api/users/${userId}/profile`);
    return normalizeUser(response.data);
  },

  async getUserById(userId: string): Promise<UserDTO> {
    const response = await httpClient.get<unknown>(`/api/users/${userId}`);
    return normalizeUser(response.data);
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await httpClient.get<NotificationPreferences>('/api/users/preferences/notifications');
    return response.data;
  },

  async updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<void> {
    await httpClient.patch('/api/users/preferences/notifications', data);
  },
};
