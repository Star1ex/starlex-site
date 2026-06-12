package entity

import "time"

type User struct {
	ID             string
	Email          string
	Password       string
	FirstName      string
	LastName       string
	Role           string
	Photo_URL      *string
	AvatarURL      *string
	GoogleID       *string
	GithubID       *string
	AuthProviders  []string
	NameOverridden bool
	IsVerified     bool
	TokenVersion   int

	// Minimal account metadata (privacy-conscious: IPs kept server-side only).
	SignupIP    *string
	LastLoginIP *string
	LastLoginAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewUser(id, email, hashedPassword, firstName, lastName string) *User {
	defaultRole := "member"
	return &User{
		ID:            id,
		Email:         email,
		Password:      hashedPassword,
		FirstName:     firstName,
		LastName:      lastName,
		Role:          defaultRole,
		Photo_URL:     nil, // Explicitly set to nil, will be set later if needed
		AvatarURL:     nil,
		GoogleID:      nil,
		GithubID:      nil,
		AuthProviders: []string{"local"},
		IsVerified:    false,
		TokenVersion:  1,
	}
}
