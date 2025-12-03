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

	users := api.Group("/users", handlers.UserIndentity)
	{
		users.Post("/photo", handlers.UploadPhoto)
		users.Get("/teams", handlers.GetTeams)
	}

	auth := api.Group("/auth")
	{
		auth.Post("/login", handlers.Login)
		auth.Post("/register", handlers.Register)

	}

	search := api.Group("/search", handlers.UserIndentity)
	{
		search.Get("/:email", handlers.Search)
	}

	// After we add a dashboard with UserIndentity by jwt

	team := api.Group("/team", handlers.UserIndentity)
	{
		team.Post("/", handlers.CreateTeam)
		team.Get("/:id", handlers.GetUsers)
		tasks := team.Group("/:team_id/tasks")
		{
			tasks.Post("/", handlers.CreateTask)
			tasks.Get("/", handlers.GetTeamTasks)
			tasks.Get("/assigned/:user_id", handlers.GetUserTasks)
		}
	}
}
