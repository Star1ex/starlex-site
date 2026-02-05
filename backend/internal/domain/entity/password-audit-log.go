package entity

import "time"

type PasswordAuditLog struct {
	ID        string
	UserID    string
	Email     string
	Action    string
	Success   bool
	Reason    string
	IP        string
	UserAgent string
	CreatedAt time.Time
}

func NewPasswordAuditLog(id, userID, email, action string, success bool, reason, ip, userAgent string) *PasswordAuditLog {
	return &PasswordAuditLog{
		ID:        id,
		UserID:    userID,
		Email:     email,
		Action:    action,
		Success:   success,
		Reason:    reason,
		IP:        ip,
		UserAgent: userAgent,
		CreatedAt: time.Now(),
	}
}
