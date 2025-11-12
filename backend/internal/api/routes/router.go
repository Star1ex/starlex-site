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
  
  // After we add a dashboard with UserIndentity by jwt
  
	team:=api.Group("team")
	{
		team.Post("/create", handlers.CreateTeam)
	}
}
	// After we add a dashboard with UserIndentity by jwt
