package handlers

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/db"
	"github.com/Star1ex/starlex-site/internal/domain/folder"
	"github.com/Star1ex/starlex-site/internal/domain/password"
	"github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/verification"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/service"
)

type Handlers struct {
	db                  *db.DB
	userService         user.Service
	workspaceService    workspace.Service
	taskService         task.Service
	folderService       folder.Service
	verificationService verification.Service
	passwordService     password.Service
	sprintService       *service.SprintService
	discussionService   *service.DiscussionService
	jwtSecret           string
	frontendBaseURL     string
	oauthConfig         OAuthConfig
	oauthLimiter        *rateLimiter
}

func NewHandlers(userService user.Service,
	workspaceService workspace.Service,
	taskService task.Service,
	folderService folder.Service,
	verificationService verification.Service,
	passwordService password.Service,
	sprintService *service.SprintService,
	discussionService *service.DiscussionService,
	db *db.DB,
	authConfig AuthConfig,
) *Handlers {

	return &Handlers{
		db:                  db,
		userService:         userService,
		workspaceService:    workspaceService,
		taskService:         taskService,
		folderService:       folderService,
		verificationService: verificationService,
		passwordService:     passwordService,
		sprintService:       sprintService,
		discussionService:   discussionService,
		jwtSecret:           authConfig.JWTSecret,
		frontendBaseURL:     authConfig.FrontendBaseURL,
		oauthConfig:         authConfig.OAuth,
		oauthLimiter:        newRateLimiter(30, time.Minute*5),
	}
}
