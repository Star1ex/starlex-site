package entity

import "time"

type PasswordResetToken struct {
	ID        string
	UserID    string
	Email     string
	TokenHash string
	CodeHash  string
	ExpiresAt time.Time
	IsUsed    bool
	CreatedAt time.Time
	RequestIP string
	UserAgent string
}

func NewPasswordResetToken(id, userID, email, tokenHash, codeHash, requestIP, userAgent string, expiresAt time.Time) *PasswordResetToken {
	return &PasswordResetToken{
		ID:        id,
		UserID:    userID,
		Email:     email,
		TokenHash: tokenHash,
		CodeHash:  codeHash,
		ExpiresAt: expiresAt,
		IsUsed:    false,
		CreatedAt: time.Now(),
		RequestIP: requestIP,
		UserAgent: userAgent,
	}
}

func (t *PasswordResetToken) IsExpired(now time.Time) bool {
	return now.After(t.ExpiresAt)
}

func (t *PasswordResetToken) IsValid(now time.Time) bool {
	return !t.IsUsed && !t.IsExpired(now)
}
