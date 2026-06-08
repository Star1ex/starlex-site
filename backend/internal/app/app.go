package app

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/api/handlers"
	"github.com/Star1ex/starlex-site/internal/api/routes"
	"github.com/Star1ex/starlex-site/internal/config"
	"github.com/Star1ex/starlex-site/internal/db"
	"github.com/Star1ex/starlex-site/internal/events"
	emailService "github.com/Star1ex/starlex-site/internal/infra/email"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/notifications/telegram"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/Star1ex/starlex-site/internal/service"
	"github.com/Star1ex/starlex-site/internal/storage"
	"github.com/getsentry/sentry-go"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

func StartServer() {

	logger.Init(os.Getenv("APP_ENV"))
	if err := sentry.Init(sentry.ClientOptions{
		Dsn:         os.Getenv("SENTRY_DSN"),
		Environment: os.Getenv("APP_ENV"),
		Release:     os.Getenv("APP_VERSION"),
	}); err != nil {
		logger.Log.Errorw("sentry init failed", "error", err)
	}
	defer sentry.Flush(2 * time.Second)

	config := config.LoadConfig()
	if config.JWTSecret == "" || len(config.JWTSecret) < 32 {
		logger.Log.Fatalw("CRITICAL: JWT_SECRET must be set and at least 32 characters long!")
	}

	db := db.Must(&config.DatabaseConfig)

	storage, err := storage.NewStorageByEnv(&config.StorageConfig)
	if err != nil {
		logger.Log.Errorw("Error init storage", "error", err)
	}

	app := fiber.New(fiber.Config{
		BodyLimit:         2 * 1024 * 1024, // 2MB
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      20 * time.Second,
		IdleTimeout:       30 * time.Second,
		ReduceMemoryUsage: true,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			if err != nil {
				sentry.CaptureException(err)
			}
			return fiber.DefaultErrorHandler(c, err)
		},
	})

	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed,
	}))
	app.Use(handlers.CreateGlobalRateLimiter())

	app.Use(func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("Referrer-Policy", "no-referrer")
		c.Set("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()")
		c.Set("Cross-Origin-Resource-Policy", "same-origin")
		c.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
		if strings.EqualFold(c.Protocol(), "https") {
			c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		return c.Next()
	})

	allowedOrigins := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if allowedOrigins == "" {
		logger.Log.Fatalw("CRITICAL: ALLOWED_ORIGINS must be configured explicitly")
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-CSRF-Token",
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	bus := events.NewBus()

	tg, _ := telegram.New(
		config.TelegramNotifications.Token,
		config.TelegramNotifications.ChatID,
	)
	bus.Subscribe(
		"user.registered",
		handlers.UserRegisteredTelegramHandler(tg),
	)
	bus.Subscribe(
		"user.login",
		handlers.UserLoginTelegramHandler(tg),
	)

	userRepo := repository.NewUserRepository(db.DB)
	workspaceRepo := repository.NewWorkspaceRepository(db.DB)
	projectRepo := repository.NewProjectRepository(db.DB)
	taskRepo := repository.NewTaskRepository(db.DB)
	folderRepo := repository.NewFolderRepository(db.DB)
	sprintRepo := repository.NewSprintRepository(db.DB)
	discussionRepo := repository.NewDiscussionRepository(db.DB)
	pendingRegistrationRepo := repository.NewPendingRegistrationRepository(db.DB)
	passwordResetRepo := repository.NewPasswordResetRepository(db.DB)
	passwordAuditRepo := repository.NewPasswordAuditRepository(db.DB)

	emailService := emailService.NewEmailService(emailService.EmailConfig{
		SMTPHost:     config.EmailConfig.SMTPHost,
		SMTPPort:     config.EmailConfig.SMTPPort,
		SMTPUsername: config.EmailConfig.SMTPUsername,
		SMTPPassword: config.EmailConfig.SMTPPassword,
		FromEmail:    config.EmailConfig.FromEmail,
		FromName:     config.EmailConfig.FromName,
	})

	registrationService := service.NewRegistrationService(pendingRegistrationRepo, userRepo, emailService, bus)
	passwordService := service.NewPasswordService(userRepo, passwordResetRepo, passwordAuditRepo, emailService, config.FrontendBaseURL)
	userService := service.NewUserService(userRepo, storage, bus)
	workspaceService := service.NewWorkspaceService(workspaceRepo, userRepo)
	projectService := service.NewProjectService(projectRepo, workspaceRepo, userRepo)
	taskService := service.NewTaskService(taskRepo, userRepo, workspaceRepo)
	folderService := service.NewFolderService(folderRepo)
	sprintService := service.NewSprintService(sprintRepo)
	discussionService := service.NewDiscussionService(discussionRepo)
	authConfig := handlers.AuthConfig{
		JWTSecret:       config.JWTSecret,
		FrontendBaseURL: config.FrontendBaseURL,
		OAuth: handlers.OAuthConfig{
			GoogleClientID:     config.OAuthConfig.GoogleClientID,
			GoogleClientSecret: config.OAuthConfig.GoogleClientSecret,
			GoogleCallbackURL:  config.OAuthConfig.GoogleCallbackURL,
			GithubClientID:     config.OAuthConfig.GithubClientID,
			GithubClientSecret: config.OAuthConfig.GithubClientSecret,
			GithubCallbackURL:  config.OAuthConfig.GithubCallbackURL,
		},
	}
	httpHandlers := handlers.NewHandlers(userService, workspaceService, projectService, taskService, folderService, registrationService, passwordService, sprintService, discussionService, db, authConfig)
	routes.InitRoutes(app, httpHandlers)

	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if _, err := passwordService.CleanupExpiredTokens(context.Background()); err != nil {
				logger.Log.Errorw("password reset cleanup error", "error", err)
			}
		}
	}()

	// Allow overriding listen port via env (BACKEND_PORT or PORT), default 3000
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "3000"
	}

	if err := app.Listen(":" + port); err != nil {
		logger.Log.Fatalw("server failed to start", "error", err)
	}
}
