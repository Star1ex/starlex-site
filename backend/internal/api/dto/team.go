package dto

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
)


type TeamApi struct{
	UserID string `json:"user_id" binding:"required"`
	Name string	`json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}



type TeamResponse struct{
	TeamID string `json:"team_id"`
	Name string `json:"name"`
	Description string `json:"description"`
}

func ToTeamResponse(team *team.Team)*TeamResponse{
	return &TeamResponse{
		TeamID: team.ID,
		Name: team.Name,
		Description: team.Description,
	}
}