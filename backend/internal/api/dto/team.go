package dto

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
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

func ToTeamResponse(team *entity.Team)*TeamResponse{
	return &TeamResponse{
		TeamID: team.ID,
		Name: team.Name,
		Description: team.Description,
	}
}

func ToUsersResponse(users []*entity.User)[]UserResponse{
	response:=make([]UserResponse, len(users))
	for i,user :=range users{
		response[i] = UserResponse{
			ID: user.ID,
			Email: user.Email,
			FirstName: user.FirstName,
			LastName: user.LastName,
		}
	}
	return response
}