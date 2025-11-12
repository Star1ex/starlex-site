package app

import (
	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/Team-Tracks/team-track-site/internal/api/routes"
	"github.com/Team-Tracks/team-track-site/internal/config"
	"github.com/Team-Tracks/team-track-site/internal/db"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func StartServer() {

	db_config := config.LoadConfig()

	db := db.Must(&db_config.DatabaseConfig)

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
		AllowHeaders: "Origins, Content-Type, Accept, Authorization",
	}))

	userRepo := repository.NewUserRepository(db.DB)

	userService := service.NewUserService(userRepo)

	handlers := handlers.NewHandlers(userService)

	routes.InitRoutes(app, handlers)

	app.Listen(":3000")
}
