package routes

import (
	//  _ "github.com/Star1ex/starlex-site/docs"
	"github.com/Star1ex/starlex-site/internal/api/handlers"
	fiberws "github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	// fiberSwagger "github.com/swaggo/fiber-swagger"
)

func InitRoutes(app *fiber.App, h *handlers.Handlers) {

	app.Static("/uploads", "./uploads")
	// app.Get("/swagger/*", fiberSwagger.WrapHandler)

	api := app.Group("/api")

	api.Get("/health", h.HealthCheck)

	setupAuthRoutes(api, h)
	api.Get("/invites/:token", h.GetInvitePreview)
	api.Get("/ws", h.PrepareWorkspaceWebSocket, fiberws.New(h.HandleWorkspaceWebSocket))

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
		setupTaskRoutes(protected, h)
		setupWorkspaceRoutes(protected, h)
		setupInviteRoutes(protected, h)
		setupLabelRoutes(protected, h)
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
	users.Get("/preferences", h.GetUserPreferences)
	users.Patch("/preferences", h.PatchUserPreferences)
	users.Put("/update", h.UserUpdate)
	users.Post("/photo", h.UploadPhoto)
	users.Get("/photo", h.GetPhoto)
}

func setupSearchRoutes(api fiber.Router, h *handlers.Handlers) {
	api.Get("/search/:email", h.Search)
	api.Get("/search", h.GlobalSearch)
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
	tasks.Patch("/:id/status", h.PatchTaskStatus)
	tasks.Patch("/:id/due-date", h.PatchTaskDueDate)
	tasks.Patch("/:id/assignees", h.PatchTaskAssignees)
	tasks.Patch("/:id/labels", h.PatchTaskLabels)

}

func setupWorkspaceRoutes(api fiber.Router, h *handlers.Handlers) {
	workspaces := api.Group("/workspaces")

	workspaces.Post("/", h.CreateWorkspace)
	workspaces.Delete("/:id", h.DeleteWorkspace)
	workspaces.Patch("/:id/name", h.PatchWorkspaceName)
	workspaces.Patch("/:id/description", h.PatchWorkspaceDescription)
	workspaces.Patch("/:id/icon", h.PatchWorkspaceIcon)
	workspaces.Patch("/:id/color", h.PatchWorkspaceColor)
	workspaces.Patch("/:id/settings", h.PatchWorkspaceSettings)

	workspaces.Get("/:id/users", h.GetUsers)
	workspaces.Post("/:id/users", h.AddUserToWorkspace)
	workspaces.Delete("/:id/users", h.RemoveUserFromWorkspace)
	workspaces.Get("/:id/members", h.ListWorkspaceMembers)
	workspaces.Post("/:id/members", h.AddWorkspaceMember)
	workspaces.Patch("/:id/members/:user_id", h.PatchWorkspaceMemberRole)
	workspaces.Delete("/:id/members/:user_id", h.DeleteWorkspaceMember)
	workspaces.Get("/:id/invites", h.ListWorkspaceInvites)
	workspaces.Post("/:id/invites", h.CreateWorkspaceInvite)
	workspaces.Get("/:id/labels", h.ListWorkspaceLabels)
	workspaces.Post("/:id/labels", h.CreateWorkspaceLabel)

	workspaceTasks := workspaces.Group("/:workspace_id/tasks")
	{
		workspaceTasks.Post("/", h.CreateWorkspaceTask)
		workspaceTasks.Get("/", h.GetWorkspaceTasks)
		workspaceTasks.Get("/query", h.QueryWorkspaceTasks)
		workspaceTasks.Get("/categories", h.GetWorkspaceTaskCategories)
		workspaceTasks.Get("/user/:user_id", h.GetUserTasks)
		workspaceTasks.Put("/:id", h.UpdateTask)
		workspaceTasks.Put("/:id/progress", h.UpdateTaskProgress)
		workspaceTasks.Patch("/:id/icon", h.PatchTaskIcon)
		workspaceTasks.Patch("/:id/title", h.PatchTaskTitle)
		workspaceTasks.Patch("/:id/description", h.PatchTaskDescription)
		workspaceTasks.Patch("/:id/priority", h.PatchTaskPriority)
		workspaceTasks.Patch("/:id/progress", h.PatchTaskProgress)
		workspaceTasks.Patch("/:id/status", h.PatchTaskStatus)
		workspaceTasks.Patch("/:id/due-date", h.PatchTaskDueDate)
		workspaceTasks.Patch("/:id/assignees", h.PatchTaskAssignees)
		workspaceTasks.Patch("/:id/labels", h.PatchTaskLabels)
		workspaceTasks.Delete("/:id", h.DeleteTask)
	}
}

func setupLabelRoutes(api fiber.Router, h *handlers.Handlers) {
	labels := api.Group("/labels")
	labels.Patch("/:id", h.PatchLabel)
	labels.Delete("/:id", h.DeleteLabel)
}

func setupInviteRoutes(api fiber.Router, h *handlers.Handlers) {
	invites := api.Group("/invites")
	invites.Post("/:token/accept", h.AcceptInvite)
	invites.Delete("/:id", h.DeleteInvite)
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
	api.Get("/tasks/:id/discussions", h.GetTaskDiscussions)
	api.Get("/discussions/:id", h.GetDiscussionByID)
	api.Patch("/discussions/:id", h.UpdateDiscussion)
	api.Delete("/discussions/:id", h.DeleteDiscussion)
	api.Post("/discussions/:id/messages", h.CreateDiscussionMessage)
	api.Patch("/discussions/:did/messages/:mid", h.UpdateDiscussionMessage)
	api.Delete("/discussions/:did/messages/:mid", h.DeleteDiscussionMessage)
}
