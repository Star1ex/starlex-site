package handlers

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/domain/verification"
)

type Handlers struct {
	userService         user.Service
	teamService         team.Service
	taskService         task.Service
	verificationService verification.Service
}

func NewHandlers(userService user.Service, teamService team.Service, taskService task.Service, verificationService verification.Service) *Handlers {
	return &Handlers{
		userService:         userService,
		teamService:         teamService,
		taskService:         taskService,
		verificationService: verificationService,
	}
}
