package entity

import "time"

type VerificationCode struct {
	ID        string
	UserID    string
	Code      string
	ExpiresAt time.Time
	IsUsed    bool
	CreatedAt time.Time
}

func NewVerificationCode(id, userID, code string) *VerificationCode {
	return &VerificationCode{
		ID:        id,
		UserID:    userID,
		Code:      code,
		ExpiresAt: time.Now().Add(15 * time.Minute),
		IsUsed:    false,
		CreatedAt: time.Now(),
	}
}

func (v *VerificationCode) IsExpired() bool {
	return time.Now().After(v.ExpiresAt)
}

func (v *VerificationCode) IsValid() bool {
	return !v.IsUsed && !v.IsExpired()
}
