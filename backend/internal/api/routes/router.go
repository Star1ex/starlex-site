package routes

import (
	//  _ "github.com/Star1ex/starlex-site/docs"
	"github.com/Star1ex/starlex-site/internal/api/handlers"
	"github.com/gofiber/fiber/v2"
	// fiberSwagger "github.com/swaggo/fiber-swagger"
)

func InitRoutes(app *fiber.App, h *handlers.Handlers) {

	app.Static("/uploads", "./uploads")
	// app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	api.Get("/health", h.HealthCheck)

	setupAuthRoutes(api, h)

	protected := api.Group("", h.UserIndentity, h.CSRFProtect)
	{
		protected.Post("/auth/password-change", h.ChangePassword)
		protected.Post("/auth/logout", h.Logout)
		protected.Get("/auth/sessions", h.GetSessions)
		protected.Delete("/auth/sessions/:id", h.DeleteSession)
		protected.Post("/auth/link-google", h.OAuthRateLimit, h.LinkGoogle)
		protected.Post("/auth/link-github", h.OAuthRateLimit, h.LinkGithub)
		protected.Delete("/auth/unlink-google", h.UnlinkGoogle)
		protected.Delete("/auth/unlink-github", h.UnlinkGithub)
		setupUserRoutes(protected, h)
		setupSearchRoutes(protected, h)
		setupFolderRoutes(protected, h)
		setupTaskRoutes(protected, h)
		setupWorkspaceRoutes(protected, h)
		setupProjectRoutes(protected, h)
		setupSprintRoutes(protected, h)
		setupDiscussionRoutes(protected, h)
	}
}

func setupAuthRoutes(api fiber.Router, h *handlers.Handlers) {
	auth := api.Group("/auth")
	authRateLimiter := handlers.CreateAuthRateLimiter()

	auth.Get("/csrf", h.GetCSRFToken)
	auth.Post("/login", authRateLimiter, h.Login)
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
	users.Get("/workspaces", h.GetWorkspaces)
	users.Put("/update", h.UserUpdate)
	users.Post("/photo", h.UploadPhoto)
	users.Get("/photo", h.GetPhoto)
}

func setupSearchRoutes(api fiber.Router, h *handlers.Handlers) {
	api.Get("/search/:email", h.Search)
	api.Get("/search", h.GlobalSearch)
}

func setupFolderRoutes(api fiber.Router, h *handlers.Handlers) {
	folders := api.Group("/folders")

	folders.Post("/", h.CreateFolder)
	folders.Get("/:id", h.GetFolderByID)
	folders.Put("/:id", h.UpdateFolder)
	folders.Delete("/:id", h.DeleteFolder)
	folders.Put("/:id/move", h.MoveFolder)

	folders.Get("/workspace/:workspace_id", h.GetFoldersByWorkspace)
	folders.Get("/:id/children", h.GetFoldersByParentID)
}

func setupTaskRoutes(api fiber.Router, h *handlers.Handlers) {
	tasks := api.Group("/tasks")

	tasks.Get("/:id", h.GetTaskByID)
	tasks.Put("/:id", h.UpdateTask)
	tasks.Delete("/:id", h.DeleteTask)

	tasks.Put("/:id/progress", h.UpdateTaskProgress)
	tasks.Patch("/:id/icon", h.PatchTaskIcon)
	tasks.Patch("/:id/title", h.PatchTaskTitle)
	tasks.Patch("/:id/description", h.PatchTaskDescription)
	tasks.Patch("/:id/priority", h.PatchTaskPriority)
	tasks.Patch("/:id/progress", h.PatchTaskProgress)
	tasks.Patch("/:id/assignees", h.PatchTaskAssignees)

	tasks.Get("/folder/:folder_id", h.GetFolderTasks)
	tasks.Put("/:id/move", h.MoveTaskToFolder)
}

func setupWorkspaceRoutes(api fiber.Router, h *handlers.Handlers) {
	workspaces := api.Group("/workspaces")

	workspaces.Post("/", h.CreateWorkspace)
	workspaces.Delete("/:id", h.DeleteWorkspace)
	workspaces.Patch("/:id/name", h.PatchWorkspaceName)
	workspaces.Patch("/:id/description", h.PatchWorkspaceDescription)
	workspaces.Patch("/:id/icon", h.PatchWorkspaceIcon)

	workspaces.Get("/:id/users", h.GetUsers)
	workspaces.Post("/:id/users", h.AddUserToWorkspace)
	workspaces.Delete("/:id/users", h.RemoveUserFromWorkspace)
	workspaces.Get("/:id/members", h.ListWorkspaceMembers)
	workspaces.Post("/:id/members", h.AddWorkspaceMember)
	workspaces.Patch("/:id/members/:user_id", h.PatchWorkspaceMemberRole)
	workspaces.Delete("/:id/members/:user_id", h.DeleteWorkspaceMember)

	workspaceTasks := workspaces.Group("/:workspace_id/tasks")
	{
		workspaceTasks.Post("/", h.CreateWorkspaceTask)
		workspaceTasks.Get("/", h.GetWorkspaceTasks)
		workspaceTasks.Get("/user/:user_id", h.GetUserTasks)
		workspaceTasks.Put("/:id", h.UpdateTask)
		workspaceTasks.Put("/:id/progress", h.UpdateTaskProgress)
		workspaceTasks.Patch("/:id/icon", h.PatchTaskIcon)
		workspaceTasks.Patch("/:id/title", h.PatchTaskTitle)
		workspaceTasks.Patch("/:id/description", h.PatchTaskDescription)
		workspaceTasks.Patch("/:id/priority", h.PatchTaskPriority)
		workspaceTasks.Patch("/:id/progress", h.PatchTaskProgress)
		workspaceTasks.Patch("/:id/assignees", h.PatchTaskAssignees)
		workspaceTasks.Delete("/:id", h.DeleteTask)
	}
}

func setupProjectRoutes(api fiber.Router, h *handlers.Handlers) {
	// Workspace-scoped: create and list projects.
	wsProjects := api.Group("/workspaces/:workspace_id/projects")
	{
		wsProjects.Post("/", h.CreateProject)
		wsProjects.Get("/", h.GetWorkspaceProjects)
	}

	// Project-scoped operations.
	projects := api.Group("/projects")
	{
		projects.Get("/:id", h.GetProjectByID)
		projects.Patch("/:id", h.UpdateProject)
		projects.Delete("/:id", h.DeleteProject)

		projects.Get("/:id/members", h.GetProjectMembers)
		projects.Post("/:id/members", h.AddProjectMember)
		projects.Delete("/:id/members", h.RemoveProjectMember)

		projects.Get("/:id/tasks", h.GetProjectTasks)
		projects.Post("/:id/tasks", h.CreateProjectTask)
	}
}

func setupSprintRoutes(api fiber.Router, h *handlers.Handlers) {
	sprints := api.Group("/workspaces/:workspace_id/sprints")
	{
		sprints.Post("/", h.CreateSprint)
		sprints.Get("/", h.GetWorkspaceSprints)
		sprints.Get("/:id", h.GetSprintByID)
		sprints.Patch("/:id", h.UpdateSprint)
		sprints.Post("/:id/start", h.StartSprint)
		sprints.Post("/:id/complete", h.CompleteSprint)
		sprints.Post("/:id/archive", h.ArchiveSprint)
		sprints.Delete("/:id", h.DeleteSprint)
	}

	tasks := api.Group("/tasks")
	{
		tasks.Patch("/:id/sprint", h.MoveTaskToSprint)
		tasks.Patch("/:id/position", h.UpdateTaskPosition)
		tasks.Post("/:task_id/subtasks", h.CreateSubtask)
		tasks.Patch("/:task_id/subtasks/:id", h.UpdateSubtask)
		tasks.Delete("/:task_id/subtasks/:id", h.DeleteSubtask)
	}
}

func setupDiscussionRoutes(api fiber.Router, h *handlers.Handlers) {
	api.Post("/tasks/:id/discussions", h.CreateTaskDiscussion)
	api.Post("/folders/:id/discussions", h.CreateFolderDiscussion)
	api.Get("/tasks/:id/discussions", h.GetTaskDiscussions)
	api.Get("/folders/:id/discussions", h.GetFolderDiscussions)
	api.Get("/discussions/:id", h.GetDiscussionByID)
	api.Patch("/discussions/:id", h.UpdateDiscussion)
	api.Delete("/discussions/:id", h.DeleteDiscussion)
	api.Post("/discussions/:id/messages", h.CreateDiscussionMessage)
	api.Patch("/discussions/:did/messages/:mid", h.UpdateDiscussionMessage)
	api.Delete("/discussions/:did/messages/:mid", h.DeleteDiscussionMessage)
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
		users.Get("/workspaces", handlers.GetWorkspaces)
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
		folder.Get("/workspace/:workspace_id", handlers.GetFoldersByWorkspace)
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

	workspace := api.Group("/workspace", handlers.UserIndentity)
	{
		workspace.Post("/", handlers.CreateWorkspace)
		workspace.Get("/:id", handlers.GetUsers)
		workspace.Delete("/:id/users", handlers.RemoveUserFromWorkspace)
		workspace.Post("/:id/add", handlers.AddUserToWorkspace)
		workspace.Delete("/delete", handlers.DeleteWorkspace)
		tasks := workspace.Group("/:workspace_id/tasks")
		{
			tasks.Post("/", handlers.CreateTask)
			tasks.Get("/", handlers.GetWorkspaceTasks)
			tasks.Get("/assigned/:user_id", handlers.GetUserTasks)
			tasks.Put("/:task_id/update_progress", handlers.UpdateTaskProgress)
			tasks.Put("/:task_id/update", handlers.UpdateTask)
			tasks.Delete("/:task_id", handlers.DeleteTask)
		}
	}
}

*/
