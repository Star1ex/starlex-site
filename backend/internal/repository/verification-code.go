package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type VerificationCodeModel struct {
	ID        string `gorm:"primaryKey"`
	UserID    string `gorm:"not null;index"`
	Code      string `gorm:"not null;size:6;index"`
	ExpiresAt int64  `gorm:"not null"`
	IsUsed    bool   `gorm:"default:false"`
	CreatedAt int64  `gorm:"autoCreateTime"`
}

type VerificationRepository struct {
	db *gorm.DB
}

func NewVerificationRepository(db *gorm.DB) *VerificationRepository {
	return &VerificationRepository{db: db}
}

func fromVerificationDomain(v *entity.VerificationCode) *VerificationCodeModel {
	return &VerificationCodeModel{
		ID:        v.ID,
		UserID:    v.UserID,
		Code:      v.Code,
		ExpiresAt: v.ExpiresAt.Unix(),
		IsUsed:    v.IsUsed,
		CreatedAt: v.CreatedAt.Unix(),
	}
}

func toVerificationDomain(m *VerificationCodeModel) *entity.VerificationCode {
	return &entity.VerificationCode{
		ID:        m.ID,
		UserID:    m.UserID,
		Code:      m.Code,
		ExpiresAt: time.Unix(m.ExpiresAt, 0),
		IsUsed:    m.IsUsed,
		CreatedAt: time.Unix(m.CreatedAt, 0),
	}
}

// create new code
func (r *VerificationRepository) Create(ctx context.Context, code *entity.VerificationCode) error {
	return r.db.WithContext(ctx).Create(fromVerificationDomain(code)).Error
}

// return code by userID
func (r *VerificationRepository) GetByUserID(ctx context.Context, userID string) (*entity.VerificationCode, error) {
	var model VerificationCodeModel
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_used = ?", userID, false).
		Order("created_at DESC").
		First(&model).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("verification code not found")
		}
		return nil, err
	}

	return toVerificationDomain(&model), nil
}

func (r *VerificationRepository) GetByCode(ctx context.Context, code string) (*entity.VerificationCode, error) {
	var model VerificationCodeModel
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&model).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("verification code not found")
		}
		return nil, err
	}

	return toVerificationDomain(&model), nil
}

func (r *VerificationRepository) MarkAsUsed(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Model(&VerificationCodeModel{}).
		Where("id = ?", id).
		Update("is_used = ?", true).Error
}

// delete code by userID
func (r *VerificationRepository) DeleteByUserID(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Delete(&VerificationCodeModel{}).Error
}
