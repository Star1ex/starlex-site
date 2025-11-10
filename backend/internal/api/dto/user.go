package dto

import "github.com/Team-Tracks/team-track-site/internal/domain/user"

type UserApi struct {
	ID        string `json:"id"`
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
	FirstName string `jsob:"first_name"`
	LastName  string `json:"last_name"`
}

func ToUserApi(u *user.User) *UserApi {
	return &UserApi{
		ID:        u.ID,
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

func FromUserApi(u *UserApi) *user.User {
	return &user.User{
		ID:        u.ID,
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}
