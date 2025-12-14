package repository

import (
	"context"
	"errors"
	"log"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type TeamModel struct {
	ID          string      `gorm:"primaryKey"`
	Name        string      `gorm:"unique;not null"`
	Description string      `gorm:"not null"`
	OwnerID     string      `gorm:"not null"`
	Users       []UserModel `gorm:"many2many:users_teams"`
}

func fromDomainToTeam(team *entity.Team) *TeamModel {
	return &TeamModel{
		ID:          team.ID,
		Name:        team.Name,
		Description: team.Description,
		OwnerID:     team.OwnerID,
	}
}

func toTeamDomain(Team *TeamModel) *entity.Team {
	return &entity.Team{
		ID:          Team.ID,
		Name:        Team.Name,
		Description: Team.Description,
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
			log.Println(err)
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
			log.Printf("Warning: No rows updated when setting role to owner for user %s", userID)
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
