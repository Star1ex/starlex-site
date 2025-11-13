package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"gorm.io/gorm"
)

type User struct {
	ID        string `gorm:"primaryKey"`
	Email     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	FirstName string `gorm:"not null;size:50"`
	LastName  string `gorm:"not null;size:50"`
	Teams []Team `gorm:"many2many:users_teams"`
}

type UserRepository struct {
	db *gorm.DB
}

// factory from domain structure
func fromDomain(u *user.User) *User {
	return &User{
		ID:        u.ID,
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

// factory to domain structure
func toDomain(u *User) *user.User {
	return &user.User{
		ID:        u.ID,
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser method for registration
func (r *UserRepository) Create(ctx context.Context, u *user.User) error {
	//Сreating a user
	err := r.db.WithContext(ctx).Create(fromDomain(u)).Error
	if err != nil {
		//Uniqueness check
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrAlreadyExists
		}
		return err
	}
	return nil
}

// Delete user by ID
func (r *UserRepository) Delete(ctx context.Context, id string) error {
	return nil
}

// Retrieves user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	var model User
	//Search for a user by email
	result := r.db.WithContext(ctx).Where("email = ?", email).First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, result.Error
	}
	//Use toDomain factory
	return toDomain(&model), nil
}


func(r *UserRepository) GetUserTeams(ctx context.Context, userID string)([]*team.Team,error){
	var userModel User
	err := r.db.WithContext(ctx).Preload("Teams").First(&userModel, "id = ?",userID).Error
	if err!=nil{
		if errors.Is(err,gorm.ErrRecordNotFound){
			return nil,ErrUserNotFound
		}
		return nil,err
	}

	teams:=userModel.Teams
	teamsInUser:=make([]*team.Team,len(teams))
	for i,team:=range teams{
		teamsInUser[i]=toTeamDomain(&team)
	}
	return teamsInUser,nil
}