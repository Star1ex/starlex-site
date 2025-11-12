package handlers

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
)

type Handlers struct {
	userService user.Service
	teamService team.Service
}

func NewHandlers(userService user.Service, teamService team.Service) *Handlers {
	return &Handlers{
		userService: userService,
		teamService: teamService,
	}
}
