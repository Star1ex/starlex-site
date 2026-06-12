import { httpClient } from './client.js';
import type {
  CreateWorkspaceRequest, WorkspaceDTO, UserDTO,
  WorkspaceMemberDTO, WorkspaceInviteDTO, InvitePreviewDTO, WorkspaceRole,
  WorkspaceLabelDTO, CreateLabelRequest, UpdateLabelRequest,
} from '../../types/dto.js';

function normalizeWorkspace(raw: unknown): WorkspaceDTO {
  const w = raw as Record<string, unknown>;
  return {
    id: (w.id ?? w.workspace_id) as string,
    name: (w.name ?? '') as string,
    description: (w.description ?? '') as string,
    icon: (w.icon ?? '') as string,
    color: (w.color ?? '') as string,
    key_prefix: (w.key_prefix ?? undefined) as WorkspaceDTO['key_prefix'],
    default_task_status: (w.default_task_status ?? undefined) as WorkspaceDTO['default_task_status'],
    member_default_role: (w.member_default_role ?? undefined) as WorkspaceDTO['member_default_role'],
    role: (w.role ?? undefined) as WorkspaceDTO['role'],
    member_count: (w.member_count ?? 0) as number,
    project_count: (w.project_count ?? 0) as number,
    created_at: (w.created_at ?? '') as string,
  };
}

export const workspaceService = {
  async createWorkspace(data: CreateWorkspaceRequest): Promise<WorkspaceDTO> {
    const response = await httpClient.post<unknown>('/api/workspaces/', data);
    return normalizeWorkspace(response.data);
  },

  async deleteWorkspace(workspaceId: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/workspaces/${workspaceId}`, {
      data: { workspace_id: workspaceId },
    });
    return response.data;
  },

  async updateWorkspace(workspaceId: string, data: { name?: string }): Promise<void> {
    if (!data.name) throw new Error('Workspace name is required');
    await httpClient.patch(`/api/workspaces/${workspaceId}/name`, { name: data.name });
  },

  async updateWorkspaceDescription(workspaceId: string, description: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/description`, { description });
  },

  async updateWorkspaceIcon(workspaceId: string, icon: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/icon`, { icon });
  },

  async updateWorkspaceColor(workspaceId: string, color: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/color`, { color });
  },

  // Legacy simple list (no roles) — used for bento/members preview
  async getWorkspaceUsers(workspaceId: string): Promise<UserDTO[]> {
    const response = await httpClient.get<UserDTO[]>(`/api/workspaces/${workspaceId}/users`);
    return response.data;
  },

  async addUserToWorkspace(workspaceId: string, email: string): Promise<{ message: string }> {
    const response = await httpClient.post<{ message: string }>(
      `/api/workspaces/${workspaceId}/users`,
      { email },
    );
    return response.data;
  },

  async removeUserFromWorkspace(workspaceId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `/api/workspaces/${workspaceId}/users`,
      { data: { userId } },
    );
    return response.data;
  },

  // Members API (roles-aware)
  async listMembers(workspaceId: string): Promise<WorkspaceMemberDTO[]> {
    const response = await httpClient.get<WorkspaceMemberDTO[]>(`/api/workspaces/${workspaceId}/members`);
    return response.data;
  },

  async addMember(workspaceId: string, email: string, role: WorkspaceRole = 'member'): Promise<void> {
    await httpClient.post(
      `/api/workspaces/${workspaceId}/members`,
      { email, role },
    );
  },

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/members/${userId}`, { role });
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await httpClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
  },

  // Invites
  async listInvites(workspaceId: string): Promise<WorkspaceInviteDTO[]> {
    const response = await httpClient.get<WorkspaceInviteDTO[]>(`/api/workspaces/${workspaceId}/invites`);
    return response.data;
  },

  async createInvite(
    workspaceId: string,
    role: WorkspaceRole = 'member',
    options: { expires_in_hours?: number; max_uses?: number } = {},
  ): Promise<{ token: string; url: string }> {
    const response = await httpClient.post<{ token: string; url: string }>(
      `/api/workspaces/${workspaceId}/invites`,
      { role, ...options },
    );
    return response.data;
  },

  async getInvitePreview(token: string): Promise<InvitePreviewDTO> {
    const response = await httpClient.get<InvitePreviewDTO>(`/api/invites/${token}`);
    return response.data;
  },

  async acceptInvite(token: string): Promise<WorkspaceDTO> {
    const response = await httpClient.post<unknown>(`/api/invites/${token}/accept`);
    return normalizeWorkspace(response.data);
  },

  async revokeInvite(inviteId: string): Promise<void> {
    await httpClient.delete(`/api/invites/${inviteId}`);
  },

  async patchWorkspaceSettings(
    workspaceId: string,
    settings: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      key_prefix?: string;
      default_task_status?: string;
      member_default_role?: string;
    },
  ): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/settings`, settings);
  },

  // Labels
  async listLabels(workspaceId: string): Promise<WorkspaceLabelDTO[]> {
    const response = await httpClient.get<WorkspaceLabelDTO[]>(`/api/workspaces/${workspaceId}/labels`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async createLabel(workspaceId: string, data: CreateLabelRequest): Promise<WorkspaceLabelDTO> {
    const response = await httpClient.post<WorkspaceLabelDTO>(`/api/workspaces/${workspaceId}/labels`, data);
    return response.data;
  },

  async updateLabel(_workspaceId: string, labelId: string, data: UpdateLabelRequest): Promise<WorkspaceLabelDTO> {
    const response = await httpClient.patch<WorkspaceLabelDTO>(`/api/labels/${labelId}`, data);
    return response.data;
  },

  async deleteLabel(_workspaceId: string, labelId: string): Promise<void> {
    await httpClient.delete(`/api/labels/${labelId}`);
  },
};
