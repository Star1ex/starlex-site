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
	Users       []UserModel `gorm:"many2many:users_teams"`
}

func fromDomainToTeam(team *entity.Team) *TeamModel {
	return &TeamModel{
		ID:          team.ID,
		Name:        team.Name,
		Description: team.Description,
	}
}

func toTeamDomain(Team *TeamModel) *entity.Team {
	return &entity.Team{
		ID:          Team.ID,
		Name:        Team.Name,
		Description: Team.Description,
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
		err := tx.WithContext(ctx).Create(newTeam).Error
		if err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrTeamAlreadyExists
			}
			log.Println(err)
			return err
		}

		creatorUser := UserModel{ID: userID, Role: "owner"}
		err = tx.WithContext(ctx).Model(newTeam).Association("Users").Append(&creatorUser)
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
		usersInTeam[i] = toDomain(&user)
	}
	return usersInTeam, nil

}
