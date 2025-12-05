package handlers

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
)

type Handlers struct {
	userService user.Service
	teamService team.Service
	taskService task.Service
}

func NewHandlers(userService user.Service, teamService team.Service, taskService task.Service) *Handlers {
	return &Handlers{
		userService: userService,
		teamService: teamService,
		taskService: taskService,
	}
}
