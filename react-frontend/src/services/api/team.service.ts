import { httpClient } from './client.js';
import { TeamDTO, CreateTeamRequest, UserDTO } from '../../types/dto.js';

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