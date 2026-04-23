package handlers

import "github.com/gofiber/fiber/v2"

func (h *Handlers) HealthCheck(c *fiber.Ctx) error {
	sqlDB, err := h.db.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "unhealthy",
			"db":     "unreachable",
		})
	}
	return c.JSON(fiber.Map{
		"status": "ok",
		"db":     "connected",
	})
}
