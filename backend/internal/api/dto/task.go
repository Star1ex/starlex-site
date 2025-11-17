package dto

type TaskApi struct{
	UserID string `json:"user_id" binding:"required"`
	Task string `json:"task" binding:"required"`
	Description string `json:"description" binding:"required"`
}