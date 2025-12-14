package routes

import (
	_ "github.com/Team-Tracks/team-track-site/docs"
	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/gofiber/fiber/v2"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

func InitRoutes(app *fiber.App, handlers *handlers.Handlers) {

	// --- Swagger ---

	app.Static("/uploads", "./uploads")

	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	users := api.Group("/users", handlers.UserIndentity)
	{
		users.Post("/photo", handlers.UploadPhoto)
		users.Get("/teams", handlers.GetTeams)
		users.Get("/photo", handlers.GetPhoto)
		users.Put("/update", handlers.UserUpdate)
		users.Get("/profile", handlers.GetUser)
	}

	auth := api.Group("/auth")
	{
		auth.Post("/login", handlers.Login)
		auth.Post("/register", handlers.Register)

	}

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.SendString("healthy")
	})

	search := api.Group("/search", handlers.UserIndentity)
	{
		search.Get("/:email", handlers.Search)
	}

	// After we add a dashboard with UserIndentity by jwt

	team := api.Group("/team", handlers.UserIndentity)
	{
		team.Post("/", handlers.CreateTeam)
		team.Get("/:id", handlers.GetUsers)
		team.Delete("/:id/users", handlers.RemoveUserFromTeam)
		team.Post("/:id/add", handlers.AddUserToTeam)
		tasks := team.Group("/:team_id/tasks")
		{
			tasks.Post("/", handlers.CreateTask)
			tasks.Get("/", handlers.GetTeamTasks)
			tasks.Get("/assigned/:user_id", handlers.GetUserTasks)
			tasks.Put("/:task_id/update_progress", handlers.UpdateTaskProgress)
			tasks.Put("/:task_id/update", handlers.UpdateTask)
			tasks.Delete("/:task_id", handlers.DeleteTask)
		}
	}
}
