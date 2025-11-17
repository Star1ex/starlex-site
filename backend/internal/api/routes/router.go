package routes

import (
	_ "github.com/Team-Tracks/team-track-site/docs"
	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/gofiber/fiber/v2"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

func InitRoutes(app *fiber.App, handlers *handlers.Handlers) {

	// --- Swagger ---

	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	auth := api.Group("/auth")
	{
		auth.Post("/login", handlers.Login)
		auth.Post("/register", handlers.Register)
	}

	// After we add a dashboard with UserIndentity by jwt

	team := api.Group("/team")
	{
		team.Post("/", handlers.CreateTeam)
		team.Get("/:id", handlers.GetUsers)
		task := team.Group("/task")
		{
			task.Post("/new",handlers.CreateTask)
		}
	}
}
