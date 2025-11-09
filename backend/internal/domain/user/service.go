package user

import "context"

type Service interface {

	// CRUD
	Create(ctx *context.Context, u *User) error

	// GetByEmail
	GetByEmail(ctx *context.Context, email string) (*User, error)
}
