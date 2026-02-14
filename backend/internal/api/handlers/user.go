package handlers

import (
	"context"
	"io"
	"log"
	"mime"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) GetUser(c *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(c)
	if authErr != nil {
		return authErr
	}

	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id",
		})
	}

	user, err := h.userService.Get(context.Background(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to load user",
		})
	}

	return c.Status(fiber.StatusOK).JSON(dto.ToUserProfile(user))
}

// Swagger disabled: GetTeams godoc
// Swagger disabled: Summary      Get teams by user
// Swagger disabled: Description  Returns a list of all tasks for a given team.
// Swagger disabled: Tags         users
// Swagger disabled: Param        user_id  path      string       true  "User ID"
// Swagger disabled: Success      200      {array}   dto.TeamResponse "List of teams"
// Swagger disabled: Failure      500      {object}  map[string]string "Server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /team/:id [get]
func (h *Handlers) GetTeams(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	teams, err := h.userService.GetTeams(ctx.Context(), userID)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{})
	}
	response := dto.ToTeamsResponse(teams)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// Swagger disabled: UploadPhoto godoc
// Swagger disabled: Summary Upload user photo
// Swagger disabled: Description Uploads a photo file for a specific user
// Swagger disabled: Tags users
// Swagger disabled: Accept multipart/form-data
// Swagger disabled: Produce json
// Swagger disabled: Param id path string true "User ID"
// Swagger disabled: Param photo formData file true "Photo file"
// Swagger disabled: Success 200 {object} map[string]string
// Swagger disabled: Failure 400 {object} map[string]string
// Swagger disabled: Failure 500 {object} map[string]string
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router /users/{id}/photo [post]
func (h *Handlers) UploadPhoto(c *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(c)
	if authErr != nil {
		return authErr
	}
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id",
		})
	}

	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid file",
		})
	}
	const maxUploadSize = 2 * 1024 * 1024
	if file.Size <= 0 || file.Size > maxUploadSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "file size must be between 1 byte and 2MB",
		})
	}
	if !isAllowedImageUpload(file.Filename, file) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "unsupported file type",
		})
	}

	url, err := h.userService.UploadUserPhoto(c.Context(), userID, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to upload photo",
		})
	}

	return c.JSON(fiber.Map{"url": url})
}

func isAllowedImageUpload(filename string, file *multipart.FileHeader) bool {
	allowedExt := map[string]struct{}{
		".jpg":  {},
		".jpeg": {},
		".png":  {},
		".webp": {},
	}

	ext := strings.ToLower(filepath.Ext(filename))
	if _, ok := allowedExt[ext]; !ok {
		return false
	}

	src, err := file.Open()
	if err != nil {
		return false
	}
	defer src.Close()

	header := make([]byte, 512)
	n, err := io.ReadFull(src, header)
	if err != nil && err != io.ErrUnexpectedEOF {
		return false
	}
	contentType := http.DetectContentType(header[:n])
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return false
	}
	switch mediaType {
	case "image/jpeg", "image/png", "image/webp":
		return true
	default:
		return false
	}
}

func (h *Handlers) GetPhoto(c *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(c)
	if authErr != nil {
		return authErr
	}
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id",
		})
	}

	photoURL, err := h.userService.GetPhoto(context.Background(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "photo not found",
		})
	}

	return c.JSON(fiber.Map{
		"url": photoURL,
	})
}

func (h *Handlers) UserUpdate(c *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(c)
	if authErr != nil {
		return authErr
	}
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id",
		})
	}

	var updates dto.UserUpdate

	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	// Prevent privilege escalation via self-service profile update.
	updates.Role = ""

	err := h.userService.Update(context.Background(), dto.FromUseUpdate(&updates), userID)
	if err != nil {
		log.Println(err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"Status": "successfuly updated user"})
}
