package dto

import "time"

type SessionResponse struct {
	ID          string    `json:"id"`
	DeviceLabel string    `json:"device_label"`
	UserAgent   string    `json:"user_agent"`
	IP          string    `json:"ip"`
	CreatedAt   time.Time `json:"created_at"`
	LastSeenAt  time.Time `json:"last_seen_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	Current     bool      `json:"current"`
}
