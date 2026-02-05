package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type UserModel struct {
	ID             string         `gorm:"primaryKey"`
	Email          string         `gorm:"unique;not null"`
	Password       *string        `gorm:"default:null"`
	FirstName      string         `gorm:"not null;size:50"`
	LastName       string         `gorm:"not null;size:50"`
	PhotoURL       *string        `gorm:"default:null"`
	AvatarURL      *string        `gorm:"default:null"`
	GoogleID       *string        `gorm:"uniqueIndex;default:null"`
	GithubID       *string        `gorm:"uniqueIndex;default:null"`
	AuthProviders  datatypes.JSON `gorm:"type:jsonb;default:'[]'"`
	NameOverridden bool           `gorm:"default:false"`
	Role           string         `gorm:"default:'member'"`
	IsVerified     bool           `gorm:"default:false"`
	TokenVersion   int            `gorm:"default:1"`
	Teams          []TeamModel    `gorm:"many2many:users_teams"`
}

type UserRepository struct {
	db *gorm.DB
}

// factory from domain structure
func fromDomain(u *entity.User) *UserModel {
	authProviders := normalizeAuthProviders(u)
	model := &UserModel{
		ID:             u.ID,
		Email:          u.Email,
		FirstName:      u.FirstName,
		LastName:       u.LastName,
		Role:           u.Role,
		TokenVersion:   u.TokenVersion,
		AvatarURL:      u.AvatarURL,
		GoogleID:       u.GoogleID,
		GithubID:       u.GithubID,
		NameOverridden: u.NameOverridden,
		AuthProviders:  marshalAuthProviders(authProviders),
	}
	if u.Password != "" {
		model.Password = &u.Password
	}
	// Handle nil pointer for Photo_URL
	if u.Photo_URL != nil {
		model.PhotoURL = u.Photo_URL
	}
	return model
}

// factory to domain structure
func toDomain(u *UserModel) *entity.User {
	authProviders := unmarshalAuthProviders(u.AuthProviders)
	if len(authProviders) == 0 {
		authProviders = deriveAuthProvidersFromModel(u)
	}
	photoURL := u.PhotoURL
	tokenVersion := u.TokenVersion
	if tokenVersion == 0 {
		tokenVersion = 1
	}
	password := ""
	if u.Password != nil {
		password = *u.Password
	}
	return &entity.User{
		ID:             u.ID,
		Email:          u.Email,
		Password:       password,
		FirstName:      u.FirstName,
		LastName:       u.LastName,
		Role:           u.Role,
		Photo_URL:      photoURL,
		AvatarURL:      u.AvatarURL,
		GoogleID:       u.GoogleID,
		GithubID:       u.GithubID,
		AuthProviders:  authProviders,
		NameOverridden: u.NameOverridden,
		IsVerified:     u.IsVerified,
		TokenVersion:   tokenVersion,
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
			return ErrUserAlreadyExists
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

	err := r.db.WithContext(ctx).
		Where("email = ?", email).
		First(&model).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return toDomain(&model), nil
}

func (r *UserRepository) GetByGoogleID(ctx context.Context, googleID string) (*entity.User, error) {
	var model UserModel
	err := r.db.WithContext(ctx).
		Where("google_id = ?", googleID).
		First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return toDomain(&model), nil
}

func (r *UserRepository) GetByGithubID(ctx context.Context, githubID string) (*entity.User, error) {
	var model UserModel
	err := r.db.WithContext(ctx).
		Where("github_id = ?", githubID).
		First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
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
	if updates.AvatarURL != nil {
		updatedUser["avatar_url"] = updates.AvatarURL
	}
	if updates.GoogleID != nil {
		updatedUser["google_id"] = updates.GoogleID
	}
	if updates.GithubID != nil {
		updatedUser["github_id"] = updates.GithubID
	}
	if updates.AuthProviders != nil {
		updatedUser["auth_providers"] = marshalAuthProviders(updates.AuthProviders)
	}
	if updates.NameOverridden {
		updatedUser["name_overridden"] = updates.NameOverridden
	}
	if updates.IsVerified {
		updatedUser["is_verified"] = updates.IsVerified
	}
	if updates.TokenVersion != 0 {
		updatedUser["token_version"] = updates.TokenVersion
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

func (r *UserRepository) UpdatePasswordAndTokenVersion(ctx context.Context, userID, hashedPassword string, tokenVersion int) error {
	userEntity, err := r.Get(ctx, userID)
	if err != nil {
		return err
	}
	userEntity.Password = hashedPassword
	authProviders := normalizeAuthProviders(userEntity)
	return r.db.WithContext(ctx).
		Model(&UserModel{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"password":       hashedPassword,
			"token_version":  tokenVersion,
			"auth_providers": marshalAuthProviders(authProviders),
		}).Error
}

func (r *UserRepository) GetTokenVersion(ctx context.Context, userID string) (int, error) {
	var user UserModel
	err := r.db.WithContext(ctx).
		Select("token_version").
		Where("id = ?", userID).
		First(&user).Error
	if err != nil {
		return 0, err
	}
	if user.TokenVersion == 0 {
		return 1, nil
	}
	return user.TokenVersion, nil
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

// mark is verified user
func (r *UserRepository) MarkIsVerified(ctx context.Context, userID string) error {
	result := r.db.WithContext(ctx).
		Model(&UserModel{}).
		Where("id = ?", userID).
		Update("is_verified", true)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}

	return nil
}

// check is verified user
func (r *UserRepository) IsVerified(ctx context.Context, userID string) (bool, error) {
	var user UserModel
	err := r.db.WithContext(ctx).Select("is_verified").Where("id = ?", userID).First(&user).Error
	if err != nil {
		return false, err
	}

	return user.IsVerified, nil
}

func (r *UserRepository) UpdateOAuthFields(ctx context.Context, userID string, update user.OAuthUpdate) error {
	updates := map[string]interface{}{}
	if update.GoogleIDSet {
		if update.GoogleID == nil {
			updates["google_id"] = nil
		} else {
			updates["google_id"] = *update.GoogleID
		}
	}
	if update.GithubIDSet {
		if update.GithubID == nil {
			updates["github_id"] = nil
		} else {
			updates["github_id"] = *update.GithubID
		}
	}
	if update.AvatarURL != nil {
		updates["avatar_url"] = *update.AvatarURL
	}
	if update.FirstName != nil {
		updates["firstName"] = *update.FirstName
	}
	if update.LastName != nil {
		updates["lastName"] = *update.LastName
	}
	if update.Email != nil {
		updates["email"] = *update.Email
	}
	if update.IsVerified != nil {
		updates["is_verified"] = *update.IsVerified
	}
	if update.NameOverridden != nil {
		updates["name_overridden"] = *update.NameOverridden
	}
	if update.AuthProvidersSet {
		updates["auth_providers"] = marshalAuthProviders(update.AuthProviders)
	}
	if len(updates) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).
		Model(&UserModel{}).
		Where("id = ?", userID).
		Updates(updates).Error
}

func marshalAuthProviders(providers []string) datatypes.JSON {
	if len(providers) == 0 {
		return datatypes.JSON([]byte("[]"))
	}
	data, err := json.Marshal(providers)
	if err != nil {
		return datatypes.JSON([]byte("[]"))
	}
	return datatypes.JSON(data)
}

func unmarshalAuthProviders(data datatypes.JSON) []string {
	if len(data) == 0 {
		return []string{}
	}
	var providers []string
	if err := json.Unmarshal(data, &providers); err != nil {
		return []string{}
	}
	return providers
}

func deriveAuthProvidersFromModel(u *UserModel) []string {
	providers := []string{}
	if u.Password != nil && *u.Password != "" {
		providers = append(providers, "local")
	}
	if u.GoogleID != nil && *u.GoogleID != "" {
		providers = append(providers, "google")
	}
	if u.GithubID != nil && *u.GithubID != "" {
		providers = append(providers, "github")
	}
	return providers
}

func normalizeAuthProviders(u *entity.User) []string {
	if u == nil {
		return []string{}
	}
	providers := []string{}
	if u.Password != "" {
		providers = append(providers, "local")
	}
	if u.GoogleID != nil && *u.GoogleID != "" {
		providers = append(providers, "google")
	}
	if u.GithubID != nil && *u.GithubID != "" {
		providers = append(providers, "github")
	}
	if len(u.AuthProviders) > 0 {
		return u.AuthProviders
	}
	return providers
}
