package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/security"
)

type TeamService struct{
	repo team.Repository
}

func NewTeamService(repo team.Repository)*TeamService{
	return &TeamService{repo: repo}
}

func (s *TeamService) CreateTeam(ctx context.Context,name,description,userID string)(*team.Team,error){
	newId:=security.GenerateNewID()
	newTeam:=team.NewTeam(newId,name,description)
	err:=s.repo.CreateAndAddCreator(ctx,newTeam,userID)
	if err!=nil{
		return nil,err
	}
	return newTeam,nil
}