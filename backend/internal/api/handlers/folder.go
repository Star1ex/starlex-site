package handlers

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

// CreateFolder godoc
// @Summary      Create a new folder
// @Description  Creates a new folder for the authenticated user. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        folder       body      dto.FolderDTO             true  "Folder data"
// @Success      200          {string}  string                    "Successfully created folder"
// @Failure      400          {object}  map[string]string         "Invalid request body"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/ [post]
func (h *Handlers) CreateFolder(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var req dto.FolderDTO

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.folderService.Create(context.Background(), dto.ToDomainFolder(&req))
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return ctx.Status(fiber.StatusOK).JSON("Successfully created folder")
}

// GetFolderByID godoc
// @Summary      Get folder by ID
// @Description  Retrieves a single folder by its unique identifier passed as a query parameter. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        id           query     string                    true  "Folder ID"
// @Success      200          {object}  dto.FolderDTO             "Folder data"
// @Failure      400          {object}  map[string]string         "Missing or invalid 'id' query parameter"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/ [get]
func (h *Handlers) GetFolderByID(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	id := ctx.Params("id")
	folder, err := h.folderService.GetByID(context.Background(), id)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(200).JSON(dto.FromDomainFolder(folder))
}

// GetFoldersByUserID godoc
// @Summary      Get folders of the authenticated user
// @Description  Returns all folders owned by the currently authenticated user. User ID is extracted from the JWT token.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Success      200          {array}   dto.FolderDTO             "List of user folders"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/direct [get]
func (h *Handlers) GetFoldersByUserID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folders, err := h.folderService.GetUserFolders(context.Background(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolders(folders))
}

// GetFoldersByTeam godoc
// @Summary      Get folders by team ID
// @Description  Returns all folders belonging to a specific team. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        team_id      path      string                    true  "Team ID"
// @Success      200          {array}   dto.FolderDTO             "List of team folders"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/team/{team_id} [get]
func (h *Handlers) GetFoldersByTeam(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	teamID := ctx.Params("team_id")

	folders, err := h.folderService.GetTeamFolders(context.Background(), teamID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolders(folders))
}

// GetFoldersByParentID godoc
// @Summary      Get sub-folders by parent folder ID
// @Description  Returns all child folders of a given parent folder passed as a query parameter. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        parent_id    query     string                    true  "Parent folder ID"
// @Success      200          {array}   dto.FolderDTO             "List of sub-folders"
// @Failure      400          {object}  map[string]string         "Missing or invalid 'parent_id' query parameter"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/sub [get]
func (h *Handlers) GetFoldersByParentID(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	parentID := ctx.Query("parent_id")
	if parentID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing required query parameter: parent_id",
		})
	}

	folders, err := h.folderService.GetSubFolders(context.Background(), parentID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolders(folders))
}

// UpdateFolder godoc
// @Summary      Update an existing folder
// @Description  Updates folder fields (name, color, icon, position, etc.) by providing the full folder payload with the target ID. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        folder       body      dto.FolderDTO             true  "Updated folder data (must include id)"
// @Success      200          {string}  string                    "Successfully updated folder"
// @Failure      400          {object}  map[string]string         "Invalid request body"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/update [put]
func (h *Handlers) UpdateFolder(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var req dto.FolderDTO

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.folderService.Update(context.Background(), dto.ToDomainFolder(&req))
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully updated folder")
}

// DeleteFolder godoc
// @Summary      Delete a folder by ID
// @Description  Permanently deletes a folder by the provided folder ID. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        folder_id    body      dto.FolderDeleteDTO       true  "Folder ID to delete"
// @Success      200          {string}  string                    "Successfully deleted folder"
// @Failure      400          {object}  map[string]string         "Invalid request body"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/delete [delete]
func (h *Handlers) DeleteFolder(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}
	//var req dto.FolderDeleteDTO

	//if err := ctx.BodyParser(&req); err != nil {
	//	return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
	//		"error": "Invalid request body",
	//	})
	//}

	folderID := ctx.Params("id")

	err := h.folderService.Delete(context.Background(), folderID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully deleted folder")
}

// MoveFolder godoc
// @Summary      Move a folder to a new parent
// @Description  Changes the parent folder of an existing folder, effectively moving it in the folder tree. Requires JWT authentication.
// @Tags         folders
// @Accept       json
// @Produce      json
// @Param        move         body      dto.FolderMoveDTO         true  "Folder ID and target parent folder ID"
// @Success      200          {string}  string                    "Successfully moved folder"
// @Failure      400          {object}  map[string]string         "Invalid request body"
// @Failure      401          {object}  map[string]string         "User not authorized"
// @Failure      500          {object}  map[string]string         "Internal server error"
// @Security     BearerAuth
// @Router       /folder/move [put]
func (h *Handlers) MoveFolder(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var req dto.FolderMoveDTO

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.folderService.Move(context.Background(), req.FolderID, &req.ParentID)

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully moved folder")
}
