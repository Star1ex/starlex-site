package handlers

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/logger"
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

	req.Name = sanitizeStrict(req.Name)
	req.Icon = sanitizeStrict(req.Icon)

	folder := dto.ToDomainFolder(&req)
	// Enforce ownership from auth context, never trust client-supplied owner_id.
	folder.OwnerID = userID
	if folder.WorkspaceID != nil && *folder.WorkspaceID != "" {
		if err := h.requireWorkspaceMember(ctx, *folder.WorkspaceID, userID); err != nil {
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
	err := h.folderService.Create(ctx.Context(), folder)
	if err != nil {
		logger.Log.Errorw("create folder failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
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
	folder, err := h.folderService.GetByID(ctx.Context(), id)
	if err != nil {
		logger.Log.Errorw("get folder failed", "error", err)
		return ctx.Status(500).JSON(fiber.Map{"error": "internal server error"})
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

	folders, err := h.folderService.GetUserFolders(ctx.Context(), userID)
	if err != nil {
		logger.Log.Errorw("get user folders failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolders(folders))
}

// Swagger disabled: GetFoldersByWorkspace godoc
// Swagger disabled: Summary      Get folders by workspace ID
// Swagger disabled: Description  Returns all folders belonging to a specific workspace. Requires JWT authentication.
// Swagger disabled: Tags         folders
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        workspace_id      path      string                    true  "Workspace ID"
// Swagger disabled: Success      200          {array}   dto.FolderDTO             "List of workspace folders"
// Swagger disabled: Failure      401          {object}  map[string]string         "User not authorized"
// Swagger disabled: Failure      500          {object}  map[string]string         "Internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /folder/workspace/{workspace_id} [get]
func (h *Handlers) GetFoldersByWorkspace(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}

	folders, err := h.folderService.GetWorkspaceFolders(ctx.Context(), workspaceID)
	if err != nil {
		logger.Log.Errorw("get workspace folders failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
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

	folders, err := h.folderService.GetSubFolders(ctx.Context(), parentID)
	if err != nil {
		logger.Log.Errorw("get subfolders failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	filtered := make([]*dto.FolderDTO, 0, len(folders))
	for _, child := range folders {
		if parentFolder.WorkspaceID != nil && *parentFolder.WorkspaceID != "" {
			if child.WorkspaceID != nil && *child.WorkspaceID == *parentFolder.WorkspaceID {
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

	req.Name = sanitizeStrict(req.Name)
	req.Icon = sanitizeStrict(req.Icon)

	req.ID = folderIDParams
	if _, err := h.requireFolderAccess(ctx, req.ID, userID); err != nil {
		return err
	}
	req.OwnerID = userID
	err := h.folderService.Update(ctx.Context(), dto.ToDomainFolder(&req))
	if err != nil {
		logger.Log.Errorw("update folder failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
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

	err := h.folderService.Delete(ctx.Context(), folderID)
	if err != nil {
		logger.Log.Errorw("delete folder failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
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
		if sourceFolder.WorkspaceID != nil && *sourceFolder.WorkspaceID != "" {
			if parentFolder.WorkspaceID == nil || *parentFolder.WorkspaceID != *sourceFolder.WorkspaceID {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot move workspace folder under another workspace"})
			}
		}
	}

	err = h.folderService.Move(ctx.Context(), req.FolderID, &req.ParentID)

	if err != nil {
		logger.Log.Errorw("move folder failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON("Successfully moved folder")
}
