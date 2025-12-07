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
		err = tx.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Update("role", "owner").Error
		if err != nil {
			return err
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
