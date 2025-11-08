package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"gorm.io/gorm"
)
type User struct{
	ID        string `gorm:"primaryKey"`
	Email     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	FirstName string `gorm:"not null;size:50"`
	LastName  string `gorm:"not null;size:50"`
}


type UserRepository struct{
	db *gorm.DB
}

func fromDomain(u *user.User)*User{
	return &User{
		ID: u.ID,
		Email: u.Email,
		Password: u.Password,
		FirstName: u.FirstName,
		LastName: u.LastName,
	}
}

func toDomain(u *User)*user.User{
	return &user.User{
		ID: u.ID,
		Email: u.Email,
		Password: u.Password,
		FirstName: u.FirstName,
		LastName: u.LastName,
	}
}

func NewRepository(db *gorm.DB)*UserRepository{
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(ctx context.Context,u *user.User)error{
	err:=r.db.WithContext(ctx).Create(fromDomain(u)).Error
	if err!=nil{
		if errors.Is(err, gorm.ErrDuplicatedKey){
			return ErrAlreadyExists
		}
		return err
	}
	return nil
}

func (r *UserRepository) GetUserByEmail(ctx context.Context,email string)(*user.User,error){
	var model User
	result:=r.db.WithContext(ctx).Where("email = ?", email).First(&model)
	if result.Error != nil{
		if errors.Is(result.Error,gorm.ErrRecordNotFound){
			return nil,ErrUserNotFound
		}
		return nil,result.Error
	}
	return toDomain(&model),nil
}
