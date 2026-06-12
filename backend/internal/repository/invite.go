package repository

import (
	"context"
	"errors"
	"time"

	domaininvite "github.com/Star1ex/starlex-site/internal/domain/invite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type InviteModel struct {
	ID          string     `gorm:"primaryKey"`
	WorkspaceID string     `gorm:"not null;index"`
	Token       string     `gorm:"not null;uniqueIndex"`
	Role        string     `gorm:"not null;default:'member';index"`
	CreatedBy   string     `gorm:"not null;index"`
	ExpiresAt   *time.Time `gorm:"default:null;index"`
	MaxUses     *int       `gorm:"default:null"`
	UseCount    int        `gorm:"not null;default:0"`
	RevokedAt   *time.Time `gorm:"default:null;index"`
	CreatedAt   time.Time  `gorm:"autoCreateTime"`
}

func (InviteModel) TableName() string {
	return "workspace_invites"
}

type InviteRepository struct {
	db *gorm.DB
}

func NewInviteRepository(db *gorm.DB) *InviteRepository {
	return &InviteRepository{db: db}
}

func fromInviteDomain(invite *domaininvite.Invite) *InviteModel {
	return &InviteModel{
		ID:          invite.ID,
		WorkspaceID: invite.WorkspaceID,
		Token:       invite.Token,
		Role:        invite.Role,
		CreatedBy:   invite.CreatedBy,
		ExpiresAt:   invite.ExpiresAt,
		MaxUses:     invite.MaxUses,
		UseCount:    invite.UseCount,
		RevokedAt:   invite.RevokedAt,
		CreatedAt:   invite.CreatedAt,
	}
}

func toInviteDomain(model *InviteModel) *domaininvite.Invite {
	return &domaininvite.Invite{
		ID:          model.ID,
		WorkspaceID: model.WorkspaceID,
		Token:       model.Token,
		Role:        model.Role,
		CreatedBy:   model.CreatedBy,
		ExpiresAt:   model.ExpiresAt,
		MaxUses:     model.MaxUses,
		UseCount:    model.UseCount,
		RevokedAt:   model.RevokedAt,
		CreatedAt:   model.CreatedAt,
	}
}

func toInviteDomains(models []InviteModel) []*domaininvite.Invite {
	invites := make([]*domaininvite.Invite, len(models))
	for i := range models {
		invites[i] = toInviteDomain(&models[i])
	}
	return invites
}

func (r *InviteRepository) Create(ctx context.Context, invite *domaininvite.Invite) error {
	return r.db.WithContext(ctx).Create(fromInviteDomain(invite)).Error
}

func (r *InviteRepository) FindByToken(ctx context.Context, token string) (*domaininvite.Invite, error) {
	var model InviteModel
	err := r.db.WithContext(ctx).First(&model, "token = ?", token).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domaininvite.ErrInviteNotFound
		}
		return nil, err
	}
	return toInviteDomain(&model), nil
}

func (r *InviteRepository) FindByID(ctx context.Context, id string) (*domaininvite.Invite, error) {
	var model InviteModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domaininvite.ErrInviteNotFound
		}
		return nil, err
	}
	return toInviteDomain(&model), nil
}

func (r *InviteRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]*domaininvite.Invite, error) {
	var models []InviteModel
	err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toInviteDomains(models), nil
}

func (r *InviteRepository) Consume(ctx context.Context, token string, now time.Time) (*domaininvite.Invite, error) {
	var consumed *domaininvite.Invite
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var model InviteModel
		err := tx.WithContext(ctx).
			Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&model, "token = ?", token).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return domaininvite.ErrInviteNotFound
			}
			return err
		}

		invite := toInviteDomain(&model)
		if err := invite.InvalidReason(now); err != nil {
			return err
		}

		model.UseCount++
		if err := tx.WithContext(ctx).Model(&InviteModel{}).
			Where("id = ?", model.ID).
			Update("use_count", model.UseCount).Error; err != nil {
			return err
		}
		consumed = toInviteDomain(&model)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return consumed, nil
}

func (r *InviteRepository) Revoke(ctx context.Context, id string, revokedAt time.Time) error {
	result := r.db.WithContext(ctx).Model(&InviteModel{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Update("revoked_at", revokedAt)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domaininvite.ErrInviteNotFound
	}
	return nil
}
