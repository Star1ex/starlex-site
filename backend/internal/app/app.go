package app

import (
	"context"
	"fmt"
	"log"
	"os"
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
	if config.JWTSecret == "" || len(config.JWTSecret) < 32 { // ДОДАНО: enforce strong JWT secret
		log.Fatal("CRITICAL: JWT_SECRET must be set and at least 32 characters long!") // ДОДАНО: fail fast on weak secret
	}

	db := db.Must(&config.DatabaseConfig)

	storage, err := storage.NewStorageByEnv(&config.StorageConfig)
	if err != nil {
		fmt.Println("Error init storage")
	}

	app := fiber.New()

	// ДОДАНО: security headers middleware
	app.Use(func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
		return c.Next()
	})

	// ДОДАНО: improved CORS configuration
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000,http://teamtrackwebsite.duckdns.org:8888"
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
