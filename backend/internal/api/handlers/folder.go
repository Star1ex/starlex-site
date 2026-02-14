package handlers

import (
	"context"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

// Swagger disabled: CreateFolder godoc
// Swagger disabled: Summary      Create a new folder
// Swagger disabled: Description  Creates a new folder for the authenticated user. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        folder       body      dto.FolderDTO             true  "Folder data"
// Swagger disabled: Success      200          {object}  dto.FolderDTO             "Successfully created folder"
// Swagger disabled: Failure      400          {object}  map[string]string         "Invalid request body"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/ [post]
func (h *Handlers) CreateFolder(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
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

	folder := dto.ToDomainFolder(&req)
	// Enforce ownership from auth context, never trust client-supplied owner_id.
	folder.OwnerID = userID
	if folder.TeamID != nil && *folder.TeamID != "" {
		if err := h.requireTeamMember(ctx, *folder.TeamID, userID); err != nil {
			return err
		}
	}
	if folder.Name == "" {
		folder.Name = "New Folder"
	}
	now := time.Now().UTC()
	if folder.CreatedAt.IsZero() {
		folder.CreatedAt = now
	}
	if folder.UpdatedAt.IsZero() {
		folder.UpdatedAt = folder.CreatedAt
	}
	err := h.folderService.Create(context.Background(), folder)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolder(folder))
}

// Swagger disabled: GetFolderByID godoc
// Swagger disabled: Summary      Get folder by ID
// Swagger disabled: Description  Retrieves a single folder by its unique identifier passed as a query parameter. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        id           query     string                    true  "Folder ID"
// Swagger disabled: Success      200          {object}  dto.FolderDTO             "Folder data"
// Swagger disabled: Failure      400          {object}  map[string]string         "Missing or invalid 'id' query parameter"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/ [get]
func (h *Handlers) GetFolderByID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	id := ctx.Params("id")
	if _, err := h.requireFolderAccess(ctx, id, userID); err != nil {
		return err
	}
	folder, err := h.folderService.GetByID(context.Background(), id)
	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(200).JSON(dto.FromDomainFolder(folder))
}

// Swagger disabled: GetFoldersByUserID godoc
// Swagger disabled: Summary      Get folders of the authenticated user
// Swagger disabled: Description  Returns all folders owned by the currently authenticated user. User ID is extracted from the JWT token.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Success      200          {array}   dto.FolderDTO             "List of user folders"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/direct [get]
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

// Swagger disabled: GetFoldersByTeam godoc
// Swagger disabled: Summary      Get folders by team ID
// Swagger disabled: Description  Returns all folders belonging to a specific team. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        team_id      path      string                    true  "Team ID"
// Swagger disabled: Success      200          {array}   dto.FolderDTO             "List of team folders"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/team/{team_id} [get]
func (h *Handlers) GetFoldersByTeam(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	teamID := ctx.Params("team_id")
	if err := h.requireTeamMember(ctx, teamID, userID); err != nil {
		return err
	}

	folders, err := h.folderService.GetTeamFolders(context.Background(), teamID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolders(folders))
}

// Swagger disabled: GetFoldersByParentID godoc
// Swagger disabled: Summary      Get sub-folders by parent folder ID
// Swagger disabled: Description  Returns all child folders of a given parent folder passed as a query parameter. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        parent_id    query     string                    true  "Parent folder ID"
// Swagger disabled: Success      200          {array}   dto.FolderDTO             "List of sub-folders"
// Swagger disabled: Failure      400          {object}  map[string]string         "Missing or invalid 'parent_id' query parameter"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/sub [get]
func (h *Handlers) GetFoldersByParentID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	parentID := ctx.Params("id")
	if parentID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing folder id"})
	}

	parentFolder, err := h.requireFolderAccess(ctx, parentID, userID)
	if err != nil {
		return err
	}

	folders, err := h.folderService.GetSubFolders(context.Background(), parentID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	filtered := make([]*dto.FolderDTO, 0, len(folders))
	for _, child := range folders {
		if parentFolder.TeamID != nil && *parentFolder.TeamID != "" {
			if child.TeamID != nil && *child.TeamID == *parentFolder.TeamID {
				filtered = append(filtered, dto.FromDomainFolder(child))
			}
			continue
		}
		if child.OwnerID == userID {
			filtered = append(filtered, dto.FromDomainFolder(child))
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(filtered)
}

// Swagger disabled: UpdateFolder godoc
// Swagger disabled: Summary      Update an existing folder
// Swagger disabled: Description  Updates folder fields (name, color, icon, position, etc.) by providing the full folder payload with the target ID. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        folder       body      dto.FolderDTO             true  "Updated folder data (must include id)"
// Swagger disabled: Success      200          {string}  string                    "Successfully updated folder"
// Swagger disabled: Failure      400          {object}  map[string]string         "Invalid request body"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/update [put]
func (h *Handlers) UpdateFolder(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderIDParams := ctx.Params("id")
	var req dto.FolderDTO

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	req.ID = folderIDParams
	if _, err := h.requireFolderAccess(ctx, req.ID, userID); err != nil {
		return err
	}
	req.OwnerID = userID
	err := h.folderService.Update(context.Background(), dto.ToDomainFolder(&req))
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully updated folder")
}

// Swagger disabled: DeleteFolder godoc
// Swagger disabled: Summary      Delete a folder by ID
// Swagger disabled: Description  Permanently deletes a folder by the provided folder ID. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        folder_id    body      dto.FolderDeleteDTO       true  "Folder ID to delete"
// Swagger disabled: Success      200          {string}  string                    "Successfully deleted folder"
// Swagger disabled: Failure      400          {object}  map[string]string         "Invalid request body"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/delete [delete]
func (h *Handlers) DeleteFolder(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
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
	if _, err := h.requireFolderAccess(ctx, folderID, userID); err != nil {
		return err
	}

	err := h.folderService.Delete(context.Background(), folderID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully deleted folder")
}

// Swagger disabled: MoveFolder godoc
// Swagger disabled: Summary      Move a folder to a new parent
// Swagger disabled: Description  Changes the parent folder of an existing folder, effectively moving it in the folder tree. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        move         body      dto.FolderMoveDTO         true  "Folder ID and target parent folder ID"
// Swagger disabled: Success      200          {string}  string                    "Successfully moved folder"
// Swagger disabled: Failure      400          {object}  map[string]string         "Invalid request body"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/move [put]
func (h *Handlers) MoveFolder(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderID := ctx.Params("id")
	if folderID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "folder ID is required in URL"})
	}
	sourceFolder, err := h.requireFolderAccess(ctx, folderID, userID)
	if err != nil {
		return err
	}

	var req dto.FolderMoveDTO
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	req.FolderID = folderID
	if req.ParentID != "" {
		parentFolder, err := h.requireFolderAccess(ctx, req.ParentID, userID)
		if err != nil {
			return err
		}
		if sourceFolder.TeamID != nil && *sourceFolder.TeamID != "" {
			if parentFolder.TeamID == nil || *parentFolder.TeamID != *sourceFolder.TeamID {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot move team folder under another team"})
			}
		}
	}

	err = h.folderService.Move(context.Background(), req.FolderID, &req.ParentID)

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully moved folder")
}
