package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type TeamModel struct {
	ID          string     `gorm:"primaryKey"`
	Name        string     `gorm:"unique;not null"`
	Description string     `gorm:"not null"`
	Users       []UserTeam `gorm:"foreignKey:TeamID"`
}
type UserTeam struct {
	UserID string `gorm:"primaryKey"`
	TeamID string `gorm:"primaryKey"`
	Role   string `gorm:"not null"` // "owner", "member", ...
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
	return t.db.Transaction(func(tx *gorm.DB) error {
		newTeam := fromDomainToTeam(team)
		if err := tx.WithContext(ctx).Create(newTeam).Error; err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrTeamAlreadyExists
			}
			return err
		}
		userTeam := UserTeam{
			UserID: userID,
			TeamID: newTeam.ID,
			Role:   "owner",
		}
		if err := tx.WithContext(ctx).Create(&userTeam).Error; err != nil {
			return err
		}

		return nil
	})
}
func (t *TeamRepository) GetTeam(ctx context.Context, teamId string) ([]*entity.User, error) {
	var userTeams []UserTeam
	err := t.db.WithContext(ctx).Where("team_id = ?", teamId).Find(&userTeams).Error
	if err != nil {
		return nil, err
	}

	if len(userTeams) == 0 {
		return nil, ErrTeamNotFound
	}

	usersInTeam := make([]*entity.User, len(userTeams))
	for i, ut := range userTeams {
		var userModel UserModel
		if err := t.db.WithContext(ctx).First(&userModel, "id = ?", ut.UserID).Error; err != nil {
			return nil, err
		}
		userDomain := toDomain(&userModel)
		userDomain.Role = ut.Role
		usersInTeam[i] = userDomain
	}

	return usersInTeam, nil
}
