package routes

import (
	//  _ "github.com/Team-Tracks/team-track-site/docs"
	"github.com/Team-Tracks/team-track-site/internal/api/handlers"
	"github.com/gofiber/fiber/v2"
	// fiberSwagger "github.com/swaggo/fiber-swagger"
)

func InitRoutes(app *fiber.App, h *handlers.Handlers) {

	app.Static("/uploads", "./uploads")
	// app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("healthy")
	})

	setupAuthRoutes(api, h)

	protected := api.Group("", h.UserIndentity)
	{
		protected.Post("/auth/password-change", h.ChangePassword)
		protected.Post("/auth/link-google", h.OAuthRateLimit, h.LinkGoogle)
		protected.Post("/auth/link-github", h.OAuthRateLimit, h.LinkGithub)
		protected.Delete("/auth/unlink-google", h.UnlinkGoogle)
		protected.Delete("/auth/unlink-github", h.UnlinkGithub)
		setupUserRoutes(protected, h)
		setupSearchRoutes(protected, h)
		setupFolderRoutes(protected, h)
		setupTaskRoutes(protected, h)
		setupTeamRoutes(protected, h)
	}
}

func setupAuthRoutes(api fiber.Router, h *handlers.Handlers) {
	auth := api.Group("/auth")
	authRateLimiter := handlers.CreateAuthRateLimiter()

	auth.Get("/csrf", h.GetCSRFToken)
	auth.Post("/login", authRateLimiter, h.Login)
	auth.Post("/logout", h.Logout)
	auth.Post("/register", authRateLimiter, h.Register)
	auth.Post("/refresh", h.Refresh)
	auth.Post("/resend-code", authRateLimiter, h.ResendCode)
	auth.Post("/verify", h.VerifyEmail)
	auth.Post("/password-reset/request", authRateLimiter, h.RequestPasswordReset)
	auth.Post("/password-reset/verify", h.VerifyPasswordReset)
	auth.Post("/password-reset/confirm", h.ResetPassword)
	auth.Get("/google", h.OAuthRateLimit, h.StartGoogleOAuth)
	auth.Get("/google/callback", h.OAuthRateLimit, h.HandleGoogleCallback)
	auth.Get("/github", h.OAuthRateLimit, h.StartGithubOAuth)
	auth.Get("/github/callback", h.OAuthRateLimit, h.HandleGithubCallback)
}

func setupUserRoutes(api fiber.Router, h *handlers.Handlers) {
	users := api.Group("/users")
	users.Get("/profile", h.GetUser)
	users.Get("/teams", h.GetTeams)
	users.Put("/update", h.UserUpdate)
	users.Post("/photo", h.UploadPhoto)
	users.Get("/photo", h.GetPhoto)
}

func setupSearchRoutes(api fiber.Router, h *handlers.Handlers) {
	api.Get("/search/:email", h.Search)
}

func setupFolderRoutes(api fiber.Router, h *handlers.Handlers) {
	folders := api.Group("/folders")

	folders.Post("/", h.CreateFolder)
	folders.Get("/:id", h.GetFolderByID)
	folders.Put("/:id", h.UpdateFolder)
	folders.Delete("/:id", h.DeleteFolder)
	folders.Put("/:id/move", h.MoveFolder)

	folders.Get("/", h.GetFoldersByUserID)
	folders.Get("/team/:team_id", h.GetFoldersByTeam)
	folders.Get("/:id/children", h.GetFoldersByParentID)
}

func setupTaskRoutes(api fiber.Router, h *handlers.Handlers) {
	tasks := api.Group("/tasks")

	tasks.Post("/", h.CreatePersonalTask)
	tasks.Get("/", h.GetPersonalTasks)
	tasks.Get("/:id", h.GetTaskByID)
	tasks.Put("/:id", h.UpdateTask)
	tasks.Delete("/:id", h.DeleteTask)

	tasks.Put("/:id/progress", h.UpdateTaskProgress)
	tasks.Patch("/:id/title", h.PatchTaskTitle)
	tasks.Patch("/:id/description", h.PatchTaskDescription)
	tasks.Patch("/:id/priority", h.PatchTaskPriority)
	tasks.Patch("/:id/progress", h.PatchTaskProgress)
	tasks.Patch("/:id/assignees", h.PatchTaskAssignees)

	tasks.Get("/folder/:folder_id", h.GetFolderTasks)
	tasks.Get("/without-folder", h.GetTasksWithoutFolder)
	tasks.Put("/:id/move", h.MoveTaskToFolder)
}

func setupTeamRoutes(api fiber.Router, h *handlers.Handlers) {
	teams := api.Group("/teams")

	teams.Post("/", h.CreateTeam)
	teams.Delete("/:id", h.DeleteTeam)
	teams.Patch("/:id/name", h.PatchTeamName)
	teams.Patch("/:id/description", h.PatchTeamDescription)

	teams.Get("/:id/users", h.GetUsers)
	teams.Post("/:id/users", h.AddUserToTeam)
	teams.Delete("/:id/users", h.RemoveUserFromTeam)

	teamTasks := teams.Group("/:team_id/tasks")
	{
		teamTasks.Post("/", h.CreateTeamTask)
		teamTasks.Get("/", h.GetTeamTasks)
		teamTasks.Get("/user/:user_id", h.GetUserTasks)
		teamTasks.Put("/:id", h.UpdateTask)
		teamTasks.Put("/:id/progress", h.UpdateTaskProgress)
		teamTasks.Patch("/:id/title", h.PatchTaskTitle)
		teamTasks.Patch("/:id/description", h.PatchTaskDescription)
		teamTasks.Patch("/:id/priority", h.PatchTaskPriority)
		teamTasks.Patch("/:id/progress", h.PatchTaskProgress)
		teamTasks.Patch("/:id/assignees", h.PatchTaskAssignees)
		teamTasks.Delete("/:id", h.DeleteTask)
	}
}

//		----- OLD ROUTES -----

/*
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
		auth.Post("/resend-code", handlers.ResendCode)
		auth.Post("/verify", handlers.VerifyEmail)
	}

	folder := api.Group("/folder", handlers.UserIndentity)
	{
		folder.Post("/", handlers.CreateFolder)
		folder.Get("/", handlers.GetFolderByID)
		folder.Get("/direct", handlers.GetFoldersByUserID)
		folder.Get("/team/:team_id", handlers.GetFoldersByTeam)
		folder.Get("/sub", handlers.GetFoldersByParentID)
		folder.Put("/update", handlers.UpdateFolder)
		folder.Delete("/delete", handlers.DeleteFolder)
		folder.Put("/move", handlers.MoveFolder)
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
		team.Delete("/delete", handlers.DeleteTeam)
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

*/
