package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type UserModel struct {
	ID        string      `gorm:"primaryKey"`
	Email     string      `gorm:"unique;not null"`
	Password  string      `gorm:"not null"`
	FirstName string      `gorm:"not null;size:50"`
	LastName  string      `gorm:"not null;size:50"`
	PhotoURL  string      `gorm:"default:null"`
	Role      string      `gorm:"default:null"`
	Teams     []TeamModel `gorm:"many2many:users_teams"`
}

type UserRepository struct {
	db *gorm.DB
}

// factory from domain structure
func fromDomain(u *entity.User) *UserModel {
	return &UserModel{
		ID:        u.ID,
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		PhotoURL:  *u.Photo_URL,
	}
}

// factory to domain structure
func toDomain(u *UserModel) *entity.User {
	return &entity.User{
		ID:        u.ID,
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Photo_URL: &u.PhotoURL,
	}
}

func toUserDomains(users []*UserModel) []*entity.User {
	response := make([]*entity.User, len(users))
	for i, user := range users {
		response[i] = toDomain(user)
	}
	return response
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser method for registration
func (r *UserRepository) Create(ctx context.Context, u *entity.User) error {
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
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	var model UserModel
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

func (r *UserRepository) GetUserTeams(ctx context.Context, userID string) ([]*entity.Team, error) {
	var userModel UserModel
	err := r.db.WithContext(ctx).Preload("Teams").Find(&userModel, "id = ?", userID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	teams := userModel.Teams
	teamsInUser := make([]*entity.Team, len(teams))
	for i, team := range teams {
		teamsInUser[i] = toTeamDomain(&team)
	}
	return teamsInUser, nil
}

func (r *UserRepository) GetByIDs(ctx context.Context, ids []string) ([]*entity.User, error) {
	var models []*UserModel
	err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toUserDomains(models), nil
}

func (r *UserRepository) Get(ctx context.Context, id string) (*entity.User, error) {
	var user UserModel
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return toDomain(&user), nil
}

func (r *UserRepository) Search(ctx context.Context, email string) ([]*entity.User, error) {
	var models []*UserModel
	err := r.db.
		Where("email ILIKE ?", email+"%").
		Find(&models).Error
	return toUserDomains(models), err
}

func (r *UserRepository) UpdatePhoto(id, photo_url string) error {
	if photo_url == "" {
		return errors.New("photo_url is empty")
	}

	return r.db.Model(&UserModel{}).Where("id = ?", id).Update("photo_url", photo_url).Error
}

func (r *UserRepository) Update(ctx context.Context, updates *entity.User, id string) error {
	updatedUser := map[string]interface{}{}
	if updates.Email != "" {
		updatedUser["email"] = updates.Email
	}
	if updates.Password != "" {
		updatedUser["password"] = updates.Password
	}
	if updates.FirstName != "" {
		updatedUser["firstName"] = updates.FirstName
	}
	if updates.LastName != "" {
		updatedUser["lastName"] = updates.LastName
	}
	if updates.Photo_URL != nil {
		updatedUser["photo_url"] = updates.Photo_URL
	}

	var user UserModel
	err := r.db.WithContext(ctx).Model(&user).Where("id = ?", id).Updates(updatedUser).Error
	if err != nil {
		return err
	}
	err = r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("record not found after update")
		}
		return err
	}
	return nil
}

func (r *UserRepository) GetPhoto(ctx context.Context, userID string) (string, error) {
	var photo string

	err := r.db.WithContext(ctx).
		Model(&UserModel{}).
		Select("photo_url").
		Where("id = ?", userID).
		Scan(&photo).Error

	if err != nil {
		return "", err
	}

	return photo, err
}
