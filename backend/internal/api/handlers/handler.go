package handlers

import (
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/folder"
	"github.com/Team-Tracks/team-track-site/internal/domain/password"
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/domain/verification"
	"github.com/Team-Tracks/team-track-site/internal/service"
)

type Handlers struct {
	userService         user.Service
	teamService         team.Service
	taskService         task.Service
	folderService       folder.Service
	verificationService verification.Service
	passwordService     password.Service
	sprintService       *service.SprintService
	jwtSecret           string
	frontendBaseURL     string
	oauthConfig         OAuthConfig
	oauthLimiter        *rateLimiter
}

func NewHandlers(userService user.Service,
	teamService team.Service,
	taskService task.Service,
	folderService folder.Service,
	verificationService verification.Service,
	passwordService password.Service,
	sprintService *service.SprintService,
	authConfig AuthConfig,
) *Handlers {

	return &Handlers{
		userService:         userService,
		teamService:         teamService,
		taskService:         taskService,
		folderService:       folderService,
		verificationService: verificationService,
		passwordService:     passwordService,
		sprintService:       sprintService,
		jwtSecret:           authConfig.JWTSecret,
		frontendBaseURL:     authConfig.FrontendBaseURL,
		oauthConfig:         authConfig.OAuth,
		oauthLimiter:        newRateLimiter(30, time.Minute*5),
	}
}
