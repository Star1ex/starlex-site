package dto

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type TeamApi struct {
	UserID      string `json:"user_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type TeamResponse struct {
	TeamID      string `json:"team_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func ToTeamResponse(team *entity.Team) *TeamResponse {
	return &TeamResponse{
		TeamID:      team.ID,
		Name:        team.Name,
		Description: team.Description,
	}
}

type RemoveUserFromTeamRequest struct {
	UserID string `json:"userId" validate:"required"`
}

type DeleteTeam struct {
	TeamID string `json:"team_id" binding:"required"`
}

type UpdateTeamName struct {
	Name *string `json:"name"`
}

type UpdateTeamDescription struct {
	Description *string `json:"description"`
}

func ToTeamsResponse(teams []*entity.Team) []TeamResponse {
	response := make([]TeamResponse, len(teams))
	for i, team := range teams {
		response[i] = TeamResponse{
			TeamID:      team.ID,
			Name:        team.Name,
			Description: team.Description,
		}
	}
	return response
}

func ToUsersResponse(users []*entity.User) []UserResponse {
	response := make([]UserResponse, len(users))
	for i, user := range users {
		response[i] = *ToUserResponse(user)
	}
	return response
}
