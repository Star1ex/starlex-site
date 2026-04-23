import { httpClient } from './client.js';
import { CreateTeamRequest, TeamDTO, UserDTO } from '../../types/dto.js';

export const teamService = {
  async createTeam(data: CreateTeamRequest): Promise<TeamDTO> {
    const response = await httpClient.post<TeamDTO>('/api/teams/', data);
    return response.data;
  },

  async deleteTeam(teamId: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/teams/${teamId}`, {
      data: { team_id: teamId },
    });
    return response.data;
  },

  async updateTeam(teamId: string, data: { name?: string }): Promise<void> {
    if (!data.name) {
      throw new Error('Team name is required');
    }
    await httpClient.patch(`/api/teams/${teamId}/name`, { name: data.name });
  },

  async updateTeamDescription(teamId: string, description: string): Promise<void> {
    await httpClient.patch(`/api/teams/${teamId}/description`, { description });
  },

  async updateTeamIcon(teamId: string, icon: string): Promise<void> {
    await httpClient.patch(`/api/teams/${teamId}/icon`, { icon });
  },

  async getTeamUsers(teamId: string): Promise<UserDTO[]> {
    const response = await httpClient.get<UserDTO[]>(`/api/teams/${teamId}/users`);
    return response.data;
  },

  async addUserToTeam(teamId: string, email: string): Promise<{ message: string }> {
    const response = await httpClient.post<{ message: string }>(`/api/teams/${teamId}/users`, {
      email,
    });
    return response.data;
  },

  async removeUserFromTeam(teamId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete<{ success: boolean; message: string }>(
      `/api/teams/${teamId}/users`,
      {
        data: { userId },
      }
    );
    return response.data;
  },
};
