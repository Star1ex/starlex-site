package entity

import "time"

// PendingRegistration holds a sign-up that has not been verified yet. No row is
// created in the users table until the email is confirmed; on confirmation the
// account is created from this record and the pending entry is deleted. This
// keeps the users table free of unverified/abandoned accounts and ensures an
// email address is only persisted as a real user once proven reachable.
type PendingRegistration struct {
	ID           string
	Email        string
	PasswordHash string
	FirstName    string
	LastName     string
	Code         string
	ExpiresAt    time.Time
	Attempts     int
	SignupIP     string
	CreatedAt    time.Time
}

func NewPendingRegistration(id, email, passwordHash, firstName, lastName, code, signupIP string, ttl time.Duration) *PendingRegistration {
	return &PendingRegistration{
		ID:           id,
		Email:        email,
		PasswordHash: passwordHash,
		FirstName:    firstName,
		LastName:     lastName,
		Code:         code,
		ExpiresAt:    time.Now().Add(ttl),
		Attempts:     0,
		SignupIP:     signupIP,
		CreatedAt:    time.Now(),
	}
}

func (p *PendingRegistration) IsExpired() bool {
	return time.Now().After(p.ExpiresAt)
}
