package app

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/Team-Tracks/team-track-site/internal/api/routes"
	"github.com/Team-Tracks/team-track-site/internal/config"
	"github.com/Team-Tracks/team-track-site/internal/db"
	"github.com/Team-Tracks/team-track-site/internal/events"
	emailService "github.com/Team-Tracks/team-track-site/internal/infra/email"
	"github.com/Team-Tracks/team-track-site/internal/notifications/telegram"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/service"
	"github.com/Team-Tracks/team-track-site/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func StartServer() {

	config := config.LoadConfig()
	if config.JWTSecret == "" {
		log.Println("WARNING: JWT_SECRET is not set; tokens will be insecure.")
	}

	db := db.Must(&config.DatabaseConfig)

	storage, err := storage.NewStorageByEnv(&config.StorageConfig)
	if err != nil {
		fmt.Println("Error init storage")
	}

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://teamtrackwebsite.duckdns.org:8888",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-CSRF-Token",
		AllowCredentials: true,
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
	teamRepo := repository.NewTeamRepository(db.DB)
	taskRepo := repository.NewTaskRepository(db.DB)
	folderRepo := repository.NewFolderRepository(db.DB)
	verificationRepo := repository.NewVerificationRepository(db.DB)
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

	fmt.Println("Check", config.EmailConfig.SMTPHost, config.EmailConfig.SMTPPort, config.EmailConfig.SMTPUsername, config.EmailConfig.SMTPPassword, config.EmailConfig.FromEmail, config.EmailConfig.FromName)
	verificationService := service.NewVerificationService(verificationRepo, userRepo, emailService)
	passwordService := service.NewPasswordService(userRepo, passwordResetRepo, passwordAuditRepo, emailService, config.FrontendBaseURL)
	userService := service.NewUserService(userRepo, storage, bus)
	teamService := service.NewTeamService(teamRepo, userRepo)
	taskService := service.NewTaskService(taskRepo, userRepo, teamRepo)
	folderService := service.NewFolderService(folderRepo)
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
	httpHandlers := handlers.NewHandlers(userService, teamService, taskService, folderService, verificationService, passwordService, authConfig)
	routes.InitRoutes(app, httpHandlers)

	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if _, err := passwordService.CleanupExpiredTokens(context.Background()); err != nil {
				fmt.Println("password reset cleanup error:", err)
			}
		}
	}()

	app.Listen(":3000")
}
