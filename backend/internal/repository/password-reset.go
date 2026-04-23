package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type PasswordResetTokenModel struct {
	ID        string `gorm:"primaryKey"`
	UserID    string `gorm:"index"`
	Email     string `gorm:"index;not null"`
	TokenHash string `gorm:"index;not null"`
	CodeHash  string `gorm:"index;not null"`
	ExpiresAt int64  `gorm:"not null"`
	IsUsed    bool   `gorm:"default:false"`
	CreatedAt int64  `gorm:"autoCreateTime"`
	RequestIP string `gorm:"size:64"`
	UserAgent string `gorm:"size:255"`
}

func (PasswordResetTokenModel) TableName() string {
	return "password_reset_tokens"
}

type PasswordResetRepository struct {
	db *gorm.DB
}

func NewPasswordResetRepository(db *gorm.DB) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

func fromPasswordResetDomain(t *entity.PasswordResetToken) *PasswordResetTokenModel {
	return &PasswordResetTokenModel{
		ID:        t.ID,
		UserID:    t.UserID,
		Email:     t.Email,
		TokenHash: t.TokenHash,
		CodeHash:  t.CodeHash,
		ExpiresAt: t.ExpiresAt.Unix(),
		IsUsed:    t.IsUsed,
		CreatedAt: t.CreatedAt.Unix(),
		RequestIP: t.RequestIP,
		UserAgent: t.UserAgent,
	}
}

func toPasswordResetDomain(m *PasswordResetTokenModel) *entity.PasswordResetToken {
	return &entity.PasswordResetToken{
		ID:        m.ID,
		UserID:    m.UserID,
		Email:     m.Email,
		TokenHash: m.TokenHash,
		CodeHash:  m.CodeHash,
		ExpiresAt: time.Unix(m.ExpiresAt, 0),
		IsUsed:    m.IsUsed,
		CreatedAt: time.Unix(m.CreatedAt, 0),
		RequestIP: m.RequestIP,
		UserAgent: m.UserAgent,
	}
}

func (r *PasswordResetRepository) Create(ctx context.Context, token *entity.PasswordResetToken) error {
	return r.db.WithContext(ctx).Create(fromPasswordResetDomain(token)).Error
}

func (r *PasswordResetRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*entity.PasswordResetToken, error) {
	var model PasswordResetTokenModel
	err := r.db.WithContext(ctx).
		Where("token_hash = ?", tokenHash).
		Order("created_at DESC").
		First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("reset token not found")
		}
		return nil, err
	}
	return toPasswordResetDomain(&model), nil
}

func (r *PasswordResetRepository) GetByCodeHash(ctx context.Context, email, codeHash string) (*entity.PasswordResetToken, error) {
	var model PasswordResetTokenModel
	err := r.db.WithContext(ctx).
		Where("email = ? AND code_hash = ?", email, codeHash).
		Order("created_at DESC").
		First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("reset code not found")
		}
		return nil, err
	}
	return toPasswordResetDomain(&model), nil
}

func (r *PasswordResetRepository) MarkAsUsed(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&PasswordResetTokenModel{}).
		Where("id = ?", id).
		Update("is_used", true).Error
}

func (r *PasswordResetRepository) DeleteExpired(ctx context.Context, nowUnix int64) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("expires_at < ? OR (is_used = ? AND created_at < ?)", nowUnix, true, nowUnix-86400).
		Delete(&PasswordResetTokenModel{})
	return result.RowsAffected, result.Error
}
