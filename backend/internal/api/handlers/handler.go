package handlers

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/db"
	"github.com/Star1ex/starlex-site/internal/domain/folder"
	domaininvite "github.com/Star1ex/starlex-site/internal/domain/invite"
	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	"github.com/Star1ex/starlex-site/internal/domain/password"
	"github.com/Star1ex/starlex-site/internal/domain/project"
	domainSession "github.com/Star1ex/starlex-site/internal/domain/session"
	"github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/service"
)

type Handlers struct {
	db                  *db.DB
	userService         user.Service
	workspaceService    workspace.Service
	projectService      project.Service
	taskService         task.Service
	folderService       folder.Service
	registrationService *service.RegistrationService
	passwordService     password.Service
	sprintService       *service.SprintService
	discussionService   *service.DiscussionService
	sessionService      domainSession.Service
	inviteService       domaininvite.Service
	labelService        domainlabel.Service
	jwtSecret           string
	frontendBaseURL     string
	oauthConfig         OAuthConfig
	oauthLimiter        *rateLimiter
}

func NewHandlers(userService user.Service,
	workspaceService workspace.Service,
	projectService project.Service,
	taskService task.Service,
	folderService folder.Service,
	registrationService *service.RegistrationService,
	passwordService password.Service,
	sprintService *service.SprintService,
	discussionService *service.DiscussionService,
	sessionService domainSession.Service,
	inviteService domaininvite.Service,
	labelService domainlabel.Service,
	db *db.DB,
	authConfig AuthConfig,
) *Handlers {

	return &Handlers{
		db:                  db,
		userService:         userService,
		workspaceService:    workspaceService,
		projectService:      projectService,
		taskService:         taskService,
		folderService:       folderService,
		registrationService: registrationService,
		passwordService:     passwordService,
		sprintService:       sprintService,
		discussionService:   discussionService,
		sessionService:      sessionService,
		inviteService:       inviteService,
		labelService:        labelService,
		jwtSecret:           authConfig.JWTSecret,
		frontendBaseURL:     authConfig.FrontendBaseURL,
		oauthConfig:         authConfig.OAuth,
		oauthLimiter:        newRateLimiter(30, time.Minute*5),
	}
}
