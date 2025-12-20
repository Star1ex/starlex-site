package app

import (
	"fmt"

	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/Team-Tracks/team-track-site/internal/api/routes"
	"github.com/Team-Tracks/team-track-site/internal/config"
	"github.com/Team-Tracks/team-track-site/internal/db"
	"github.com/Team-Tracks/team-track-site/internal/events"
	"github.com/Team-Tracks/team-track-site/internal/notifications/telegram"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/service"
	"github.com/Team-Tracks/team-track-site/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func StartServer() {

	config := config.LoadConfig()

	db := db.Must(&config.DatabaseConfig)

	storage, err := storage.NewStorageByEnv(&config.StorageConfig)
	if err != nil {
		fmt.Println("Error init storage")
	}

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://teamtrackwebsite.duckdns.org:8888",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: false,
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

	userRepo := repository.NewUserRepository(db.DB)
	teamRepo := repository.NewTeamRepository(db.DB)
	taskRepo := repository.NewTaskRepository(db.DB)
	userService := service.NewUserService(userRepo, storage, bus)
	teamService := service.NewTeamService(teamRepo, userRepo)
	taskService := service.NewTaskService(taskRepo, userRepo, teamRepo)
	httpHandlers := handlers.NewHandlers(userService, teamService, taskService)
	routes.InitRoutes(app, httpHandlers)

	app.Listen(":3000")
}
