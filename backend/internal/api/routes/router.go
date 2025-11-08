package routes

import (
	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/gofiber/fiber/v2"
)

func InitRoutes(app *fiber.App, handlers *handlers.Handlers) {

	api := app.Group("/api")

	auth := api.Group("/auth")
	{
		auth.Post("/login", handlers.Login)
		auth.Post("/register", handlers.Register)
	}
}
