package dto

import (
	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type UserApi struct {
	Email     string  `json:"email" binding:"required"`
	Password  string  `json:"password" binding:"required"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Role      string  `json:"role"`
	Photo_URL *string `json:"photo_url"`
}

type UserResponse struct {
	ID            string   `json:"id"`
	Email         string   `json:"email"`
	FirstName     string   `json:"firstName"`
	LastName      string   `json:"lastName"`
	Role          string   `json:"role"`
	Photo_URL     *string  `json:"photo_url"` // Keep snake_case for photo_url as it's used in frontend
	AvatarURL     *string  `json:"avatar_url"`
	AuthProviders []string `json:"auth_providers"`
	GoogleID      *string  `json:"google_id"`
	GithubID      *string  `json:"github_id"`
	IsVerified    bool     `json:"email_verified"`
}

type UserUpdate struct {
	Email     string  `json:"email"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Role      string  `json:"role"`
	Photo_URL *string `json:"photo_url"`
}

type User struct {
	ID            string   `json:"id"`
	Email         string   `json:"email"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	Role          string   `json:"role"`
	PhotoURL      *string  `json:"photo_url"`
	AvatarURL     *string  `json:"avatar_url"`
	AuthProviders []string `json:"auth_providers"`
	GoogleID      *string  `json:"google_id"`
	GithubID      *string  `json:"github_id"`
	IsVerified    bool     `json:"is_verified"`
}

type UserProfile struct {
	Email         string   `json:"email"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	Role          string   `json:"role"`
	Photo_URL     *string  `json:"photo_url"`
	AvatarURL     *string  `json:"avatar_url"`
	AuthProviders []string `json:"auth_providers"`
	GoogleID      *string  `json:"google_id"`
	GithubID      *string  `json:"github_id"`
	IsVerified    bool     `json:"email_verified"`
}

type AddUserToWorkspace struct {
	Email string `json:"email" validate:"required,email"`
}

func ToUserApi(u *entity.User) *UserApi {
	return &UserApi{
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Photo_URL: u.Photo_URL,
	}
}

func FromUserApi(u *UserApi) *entity.User {
	return &entity.User{
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Role:      u.Role,
		Photo_URL: u.Photo_URL,
	}
}

func ToUserResponseIsVerified(u *entity.User) *User {
	return &User{
		ID:            u.ID,
		Email:         u.Email,
		FirstName:     u.FirstName,
		LastName:      u.LastName,
		Role:          u.Role,
		PhotoURL:      u.Photo_URL,
		AvatarURL:     u.AvatarURL,
		AuthProviders: u.AuthProviders,
		GoogleID:      u.GoogleID,
		GithubID:      u.GithubID,
		IsVerified:    u.IsVerified,
	}
}

func ToUserResponse(u *entity.User) *UserResponse {
	return &UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		FirstName:     u.FirstName,
		LastName:      u.LastName,
		Role:          u.Role,
		Photo_URL:     u.Photo_URL,
		AvatarURL:     u.AvatarURL,
		AuthProviders: u.AuthProviders,
		GoogleID:      u.GoogleID,
		GithubID:      u.GithubID,
		IsVerified:    u.IsVerified,
	}
}

func ToUserUpdate(u *entity.User) *UserUpdate {
	return &UserUpdate{
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Role:      u.Role,
		Photo_URL: u.Photo_URL,
	}
}

func FromUseUpdate(u *UserUpdate) *entity.User {
	return &entity.User{
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Role:      u.Role,
		Photo_URL: u.Photo_URL,
	}
}
func ToUserProfile(u *entity.User) *UserProfile {
	return &UserProfile{
		Email:         u.Email,
		FirstName:     u.FirstName,
		LastName:      u.LastName,
		Role:          u.Role,
		Photo_URL:     u.Photo_URL,
		AvatarURL:     u.AvatarURL,
		AuthProviders: u.AuthProviders,
		GoogleID:      u.GoogleID,
		GithubID:      u.GithubID,
		IsVerified:    u.IsVerified,
	}
}
