package user

import "context"

type Repository interface {

	// CRUD
	Create(ctx context.Context, u *User) error
	Delete(ctx context.Context, id string) error

	// Get user by email
	GetByEmail(ctx context.Context, email string) (*User, error)
}
