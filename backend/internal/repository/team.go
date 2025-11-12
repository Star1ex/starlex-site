package repository

import (
	"context"
	"errors"
	"log"

	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"gorm.io/gorm"
)

type Team struct{
	ID string `gorm:"primaryKey"`
	Name string `gorm:"unique;not null"`
	Description string `gorm:"not null"`
	Users []User `gorm:"many2many:users_teams"`
}

func fromDomainToTeam(team *team.Team)*Team{
	return &Team{
		ID: team.ID,
		Name: team.Name,
		Description: team.Description,
	}
}

type TeamRepository struct{
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB)*TeamRepository{
	return &TeamRepository{
		db: db,
	}
}


func (t *TeamRepository) CreateAndAddCreator(ctx context.Context, team *team.Team, userId string)error{
	err := t.db.Transaction(func(tx *gorm.DB) error {
		//Creating team
		newTeam:=fromDomainToTeam(team)
		err:=tx.WithContext(ctx).Create(newTeam).Error
		if err !=nil {
			if errors.Is(err,gorm.ErrDuplicatedKey){
				return ErrTeamAlreadyExists
			}
			log.Println(err)
			return err
		}

		//Add creator into team
		creatorUser:=User{ID: userId}
		err=tx.WithContext(ctx).Model(newTeam).Association("Users").Append(&creatorUser)
		if err !=nil{
			return err
		}
		return nil
	})
	if err != nil{
		return err
	}
	return nil
}