package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/logger"
	"gorm.io/gorm"
)

type TeamModel struct {
	ID          string      `gorm:"primaryKey"`
	Name        string      `gorm:"unique;not null"`
	Description string      `gorm:"not null"`
	Icon        string      `gorm:"not null;default:''"`
	OwnerID     string      `gorm:"not null"`
	Users       []UserModel `gorm:"many2many:users_teams"`
}

func fromDomainToTeam(team *entity.Team) *TeamModel {
	return &TeamModel{
		ID:          team.ID,
		Name:        team.Name,
		Description: team.Description,
		Icon:        team.Icon,
		OwnerID:     team.OwnerID,
	}
}

func toTeamDomain(Team *TeamModel) *entity.Team {
	return &entity.Team{
		ID:          Team.ID,
		Name:        Team.Name,
		Description: Team.Description,
		Icon:        Team.Icon,
		OwnerID:     Team.OwnerID,
	}
}

type TeamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{
		db: db,
	}
}

func (t *TeamRepository) CreateAndAddCreator(ctx context.Context, team *entity.Team, userID string) error {
	err := t.db.Transaction(func(tx *gorm.DB) error {
		//Creating team
		newTeam := fromDomainToTeam(team)
		newTeam.OwnerID = userID
		err := tx.WithContext(ctx).Create(newTeam).Error
		if err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrTeamAlreadyExists
			}
			logger.Log.Errorw("create team failed", "error", err)
			return err
		}

		// Add creator to team
		creatorUser := UserModel{ID: userID}
		err = tx.WithContext(ctx).Model(newTeam).Association("Users").Append(&creatorUser)
		if err != nil {
			return err
		}

		// Set role to "owner" for the creator
		// Use Updates with map to ensure the update works correctly
		result := tx.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"role": "owner",
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			logger.Log.Warnw("No rows updated when setting role to owner", "user_id", userID)
		}

		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (t *TeamRepository) GetTeam(ctx context.Context, teamId string) ([]*entity.User, error) {
	var teamModel TeamModel
	err := t.db.WithContext(ctx).Preload("Users").First(&teamModel, "id = ?", teamId).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTeamNotFound
		}
		return nil, err
	}
	users := teamModel.Users
	usersInTeam := make([]*entity.User, len(users))
	for i, user := range users {
		if user.ID == teamModel.OwnerID {
			user.Role = "owner"
		} else {
			user.Role = "member"
		}
		usersInTeam[i] = toDomain(&user)
	}
	return usersInTeam, nil
}

func (r *TeamRepository) Delete(ctx context.Context, teamID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var team TeamModel

		if err := tx.Preload("Users").
			First(&team, "id = ?", teamID).Error; err != nil {
			return err
		}

		// delete many2many
		if err := tx.Model(&team).
			Association("Users").Clear(); err != nil {
			return err
		}

		if err := tx.Delete(&team).Error; err != nil {
			return err
		}

		return nil
	})
}

// GetTeamByID returns team by ID (used to check ownership)
func (t *TeamRepository) GetTeamByID(ctx context.Context, teamID string) (*entity.Team, error) {
	var teamModel TeamModel
	err := t.db.WithContext(ctx).First(&teamModel, "id = ?", teamID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTeamNotFound
		}
		return nil, err
	}
	return toTeamDomain(&teamModel), nil
}

func (t *TeamRepository) UpdateName(ctx context.Context, teamID string, name string) error {
	result := t.db.WithContext(ctx).Model(&TeamModel{}).Where("id = ?", teamID).Update("name", name)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return ErrTeamAlreadyExists
		}
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTeamNotFound
	}
	return nil
}

func (t *TeamRepository) UpdateIcon(ctx context.Context, teamID string, icon string) error {
	result := t.db.WithContext(ctx).Model(&TeamModel{}).Where("id = ?", teamID).Update("icon", icon)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTeamNotFound
	}
	return nil
}

func (t *TeamRepository) UpdateDescription(ctx context.Context, teamID string, description string) error {
	result := t.db.WithContext(ctx).Model(&TeamModel{}).Where("id = ?", teamID).Update("description", description)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTeamNotFound
	}
	return nil
}

// AddUserToTeam
func (t *TeamRepository) AddUserToTeam(ctx context.Context, teamID string, userID string) error {
	return t.db.Transaction(func(tx *gorm.DB) error {
		var team TeamModel
		if err := tx.WithContext(ctx).First(&team, "id = ?", teamID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTeamNotFound
			}
			return err
		}

		var user UserModel
		if err := tx.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrUserNotFound
			}
			return err
		}
		var count int64
		tx.WithContext(ctx).Model(&team).Where("id = ?", userID).Association("Users").Count()
		if count > 0 {
			return errors.New("user already in team")
		}

		if err := tx.WithContext(ctx).Model(&team).Association("Users").Append(&user); err != nil {
			return err
		}

		return nil
	})
}

func (t *TeamRepository) RemoveUserFromTeam(ctx context.Context, teamID string, userID string) error {
	return t.db.Transaction(func(tx *gorm.DB) error {
		var team TeamModel
		if err := tx.WithContext(ctx).First(&team, "id = ?", teamID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("team not found")
			}
			return err
		}

		// Check if user is the owner
		if team.OwnerID == userID {
			return errors.New("cannot remove team owner from team")
		}

		var user UserModel
		if err := tx.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("user not found")
			}
			return err
		}

		// Check if user is actually in the team
		var count int64
		count = tx.WithContext(ctx).Model(&team).Where("id = ?", userID).Association("Users").Count()
		if count == 0 {
			return errors.New("user is not in this team")
		}

		// Remove user from team
		if err := tx.WithContext(ctx).Model(&team).Association("Users").Delete(&user); err != nil {
			return err
		}

		return nil
	})
}
