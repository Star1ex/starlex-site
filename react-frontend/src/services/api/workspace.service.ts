import { httpClient } from './client.js';
import { CreateWorkspaceRequest, WorkspaceDTO, UserDTO } from '../../types/dto.js';

// Backend returns workspaces with a `workspace_id` field; normalize to `id` so
// the rest of the app works with a single, consistent shape.
function normalizeWorkspace(raw: unknown): WorkspaceDTO {
  const w = raw as Record<string, unknown>;
  return {
    id: (w.id ?? w.workspace_id) as string,
    name: (w.name ?? '') as string,
    description: (w.description ?? '') as string,
    icon: (w.icon ?? '') as string,
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
    if (!data.name) {
      throw new Error('Workspace name is required');
    }
    await httpClient.patch(`/api/workspaces/${workspaceId}/name`, { name: data.name });
  },

  async updateWorkspaceDescription(workspaceId: string, description: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/description`, { description });
  },

  async updateWorkspaceIcon(workspaceId: string, icon: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/icon`, { icon });
  },

  async getWorkspaceUsers(workspaceId: string): Promise<UserDTO[]> {
    const response = await httpClient.get<UserDTO[]>(`/api/workspaces/${workspaceId}/users`);
    return response.data;
  },

  async addUserToWorkspace(workspaceId: string, email: string): Promise<{ message: string }> {
    const response = await httpClient.post<{ message: string }>(
      `/api/workspaces/${workspaceId}/users`,
      { email }
    );
    return response.data;
  },

  async removeUserFromWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `/api/workspaces/${workspaceId}/users`,
      { data: { userId } }
    );
    return response.data;
  },
};
