package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/security"
	"github.com/microcosm-cc/bluemonday"
	"gorm.io/gorm"
)

var ErrDiscussionForbidden = errors.New("discussion action not permitted")
var ErrMessageEmpty = errors.New("message content is empty")

var discussionSanitizer = bluemonday.UGCPolicy()

func sanitizeDiscussionContent(content string) string {
	return discussionSanitizer.Sanitize(content)
}

type DiscussionService struct {
	repo *repository.DiscussionRepository
}

func NewDiscussionService(repo *repository.DiscussionRepository) *DiscussionService {
	return &DiscussionService{repo: repo}
}

func (s *DiscussionService) CreateDiscussion(ctx context.Context, taskID *string, folderID *string, teamID, createdBy, title, content, contentType string) (*entity.Discussion, error) {
	now := time.Now().UTC()
	var teamIDPtr *string
	if strings.TrimSpace(teamID) != "" {
		teamIDCopy := teamID
		teamIDPtr = &teamIDCopy
	}
	discussion := &entity.Discussion{
		ID:         security.GenerateNewID(),
		Title:      title,
		TaskID:     taskID,
		FolderID:   folderID,
		TeamID:     teamIDPtr,
		CreatedBy:  createdBy,
		IsResolved: false,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := s.repo.Create(ctx, discussion); err != nil {
		return nil, err
	}

	contentType = normalizeContentType(contentType)
	if strings.TrimSpace(content) != "" {
		message := &entity.DiscussionMessage{
			ID:           security.GenerateNewID(),
			DiscussionID: discussion.ID,
			AuthorID:     createdBy,
			Content:      sanitizeDiscussionContent(content),
			ContentType:  contentType,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if err := s.repo.CreateMessage(ctx, message); err != nil {
			return nil, err
		}
	}

	return s.repo.GetByID(ctx, discussion.ID)
}

func (s *DiscussionService) GetDiscussionsByTask(ctx context.Context, taskID string) ([]*entity.Discussion, error) {
	return s.repo.GetByTask(ctx, taskID)
}

func (s *DiscussionService) GetDiscussionsByFolder(ctx context.Context, folderID string) ([]*entity.Discussion, error) {
	return s.repo.GetByFolder(ctx, folderID)
}

func (s *DiscussionService) GetDiscussionByID(ctx context.Context, id string) (*entity.Discussion, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *DiscussionService) UpdateDiscussion(ctx context.Context, id string, title *string, isResolved *bool) (*entity.Discussion, error) {
	updates := map[string]interface{}{}
	if title != nil {
		updates["title"] = *title
	}
	if isResolved != nil {
		updates["is_resolved"] = *isResolved
	}
	if err := s.repo.UpdateDiscussion(ctx, id, updates); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *DiscussionService) DeleteDiscussion(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *DiscussionService) CreateMessage(ctx context.Context, discussionID, authorID, content, contentType string) (*entity.DiscussionMessage, error) {
	if strings.TrimSpace(content) == "" {
		return nil, ErrMessageEmpty
	}
	contentType = normalizeContentType(contentType)
	message := &entity.DiscussionMessage{
		ID:           security.GenerateNewID(),
		DiscussionID: discussionID,
		AuthorID:     authorID,
		Content:      sanitizeDiscussionContent(content),
		ContentType:  contentType,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}
	if err := s.repo.CreateMessage(ctx, message); err != nil {
		return nil, err
	}
	return s.repo.GetMessageByID(ctx, message.ID)
}

func (s *DiscussionService) UpdateMessage(ctx context.Context, discussionID, messageID, authorID, content string) (*entity.DiscussionMessage, error) {
	if strings.TrimSpace(content) == "" {
		return nil, ErrMessageEmpty
	}
	message, err := s.repo.GetMessageByID(ctx, messageID)
	if err != nil {
		return nil, err
	}
	if message.DiscussionID != discussionID {
		return nil, gorm.ErrRecordNotFound
	}
	if message.AuthorID != authorID {
		return nil, ErrDiscussionForbidden
	}
	updates := map[string]interface{}{
		"content":    sanitizeDiscussionContent(content),
		"updated_at": time.Now().UTC(),
	}
	if err := s.repo.UpdateMessage(ctx, messageID, updates); err != nil {
		return nil, err
	}
	return s.repo.GetMessageByID(ctx, messageID)
}

func (s *DiscussionService) DeleteMessage(ctx context.Context, discussionID, messageID, authorID string) error {
	message, err := s.repo.GetMessageByID(ctx, messageID)
	if err != nil {
		return err
	}
	if message.DiscussionID != discussionID {
		return gorm.ErrRecordNotFound
	}
	if message.AuthorID != authorID {
		return ErrDiscussionForbidden
	}
	return s.repo.DeleteMessage(ctx, messageID)
}

func normalizeContentType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "blocknote":
		return "blocknote"
	case "markdown", "":
		return "markdown"
	default:
		return "markdown"
	}
}
