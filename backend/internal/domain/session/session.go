package session

import "time"

type Session struct {
	ID               string
	UserID           string
	DeviceID         string
	UserAgent        string
	IP               string
	RefreshTokenHash string
	CreatedAt        time.Time
	LastSeenAt       time.Time
	ExpiresAt        time.Time
	RevokedAt        *time.Time
}

func (s *Session) IsActive(now time.Time) bool {
	return s != nil && s.RevokedAt == nil && now.Before(s.ExpiresAt)
}
