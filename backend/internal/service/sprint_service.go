package service

import (
	"context"
	"errors"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/security"
	"gorm.io/gorm"
)

var (
	ErrSprintHasTasks     = errors.New("sprint has tasks")
	ErrActiveSprintExists = errors.New("active sprint already exists")
	ErrSubtaskLimit       = errors.New("subtask limit reached")
)

type SprintService struct {
	sprintRepo *repository.SprintRepository
}

func (s *SprintService) SearchInTeams(ctx context.Context, teamIDs []string, query string) ([]*entity.Sprint, error) {
	return s.sprintRepo.SearchInTeams(ctx, teamIDs, query)
}

func NewSprintService(sprintRepo *repository.SprintRepository) *SprintService {
	return &SprintService{sprintRepo: sprintRepo}
}

func (s *SprintService) CreateSprint(ctx context.Context, teamID, createdBy, name, goal string, startDate, endDate *time.Time) (*entity.Sprint, error) {
	sprint := &entity.Sprint{
		ID:        security.GenerateNewID(),
		Name:      name,
		Goal:      goal,
		TeamID:    teamID,
		Status:    "planning",
		StartDate: startDate,
		EndDate:   endDate,
		CreatedBy: createdBy,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if err := s.sprintRepo.Create(ctx, sprint); err != nil {
		return nil, err
	}
	return sprint, nil
}

func (s *SprintService) GetTeamSprints(ctx context.Context, teamID string) ([]*entity.Sprint, error) {
	return s.sprintRepo.GetTeamSprints(ctx, teamID)
}

func (s *SprintService) GetSprintByID(ctx context.Context, id string) (*entity.Sprint, error) {
	return s.sprintRepo.GetByID(ctx, id)
}

func (s *SprintService) UpdateSprint(ctx context.Context, id, name, goal string, startDate, endDate *time.Time) (*entity.Sprint, error) {
	sprint := &entity.Sprint{
		ID:        id,
		Name:      name,
		Goal:      goal,
		StartDate: startDate,
		EndDate:   endDate,
	}
	if err := s.sprintRepo.Update(ctx, sprint); err != nil {
		return nil, err
	}
	return s.sprintRepo.GetByID(ctx, id)
}

func (s *SprintService) StartSprint(ctx context.Context, id, teamID string) (*entity.Sprint, error) {
	sprint, err := s.sprintRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if sprint.TeamID != teamID {
		return nil, gorm.ErrRecordNotFound
	}
	active, err := s.sprintRepo.HasActiveSprint(ctx, teamID, id)
	if err != nil {
		return nil, err
	}
	if active {
		return nil, ErrActiveSprintExists
	}
	if sprint.StartDate == nil {
		now := time.Now().UTC()
		sprint.StartDate = &now
	}
	updates := &entity.Sprint{
		ID:        id,
		Status:    "active",
		StartDate: sprint.StartDate,
	}
	if err := s.sprintRepo.Update(ctx, updates); err != nil {
		return nil, err
	}
	return s.sprintRepo.GetByID(ctx, id)
}

func (s *SprintService) CompleteSprint(ctx context.Context, id string, moveTarget *string) (*entity.Sprint, error) {
	sprint, err := s.sprintRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.sprintRepo.MoveIncompleteTasks(ctx, id, moveTarget); err != nil {
		return nil, err
	}
	if sprint.EndDate == nil {
		now := time.Now().UTC()
		sprint.EndDate = &now
	}
	updates := &entity.Sprint{
		ID:      id,
		Status:  "completed",
		EndDate: sprint.EndDate,
	}
	if err := s.sprintRepo.Update(ctx, updates); err != nil {
		return nil, err
	}
	return s.sprintRepo.GetByID(ctx, id)
}

func (s *SprintService) ArchiveSprint(ctx context.Context, id string) (*entity.Sprint, error) {
	if err := s.sprintRepo.Update(ctx, &entity.Sprint{ID: id, Status: "archived"}); err != nil {
		return nil, err
	}
	return s.sprintRepo.GetByID(ctx, id)
}

func (s *SprintService) DeleteSprint(ctx context.Context, id string) error {
	count, err := s.sprintRepo.CountTasks(ctx, id)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrSprintHasTasks
	}
	return s.sprintRepo.Delete(ctx, id)
}

func (s *SprintService) MoveTaskToSprint(ctx context.Context, taskID string, sprintID *string) error {
	return s.sprintRepo.UpdateTaskSprint(ctx, taskID, sprintID)
}

func (s *SprintService) UpdateTaskPosition(ctx context.Context, taskID string, position int) error {
	return s.sprintRepo.UpdateTaskPosition(ctx, taskID, position)
}

func (s *SprintService) CreateSubtask(ctx context.Context, taskID, title string) (*entity.Subtask, error) {
	count, err := s.sprintRepo.CountSubtasks(ctx, taskID)
	if err != nil {
		return nil, err
	}
	if count >= 50 {
		return nil, ErrSubtaskLimit
	}
	subtask := &entity.Subtask{
		ID:       security.GenerateNewID(),
		TaskID:   taskID,
		Title:    title,
		IsDone:   false,
		Position: int(count),
	}
	if err := s.sprintRepo.CreateSubtask(ctx, subtask); err != nil {
		return nil, err
	}
	return subtask, nil
}

func (s *SprintService) GetSubtaskByID(ctx context.Context, id string) (*entity.Subtask, error) {
	return s.sprintRepo.GetSubtask(ctx, id)
}

func (s *SprintService) UpdateSubtask(ctx context.Context, id string, title *string, isDone *bool, position *int) (*entity.Subtask, error) {
	existing, err := s.sprintRepo.GetSubtask(ctx, id)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	if title != nil {
		updates["title"] = *title
	}
	if isDone != nil {
		updates["is_done"] = *isDone
	}
	if position != nil {
		updates["position"] = *position
	}
	if err := s.sprintRepo.UpdateSubtask(ctx, id, updates); err != nil {
		return nil, err
	}
	if title != nil {
		existing.Title = *title
	}
	if isDone != nil {
		existing.IsDone = *isDone
	}
	if position != nil {
		existing.Position = *position
	}
	return existing, nil
}

func (s *SprintService) DeleteSubtask(ctx context.Context, id string) error {
	return s.sprintRepo.DeleteSubtask(ctx, id)
}
