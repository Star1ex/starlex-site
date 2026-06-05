package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"gorm.io/gorm"
)

// ErrPendingNotFound is returned when no pending registration exists for an email.
var ErrPendingNotFound = errors.New("pending registration not found")

type PendingRegistrationModel struct {
	ID           string `gorm:"primaryKey"`
	Email        string `gorm:"uniqueIndex;not null"`
	PasswordHash string `gorm:"not null"`
	FirstName    string `gorm:"not null;size:50"`
	LastName     string `gorm:"not null;size:50"`
	Code         string `gorm:"not null;size:6;index"`
	ExpiresAt    int64  `gorm:"not null"`
	Attempts     int    `gorm:"default:0"`
	SignupIP     string `gorm:"default:''"`
	CreatedAt    int64  `gorm:"autoCreateTime"`
}

func (PendingRegistrationModel) TableName() string {
	return "pending_registrations"
}

type PendingRegistrationRepository struct {
	db *gorm.DB
}

func NewPendingRegistrationRepository(db *gorm.DB) *PendingRegistrationRepository {
	return &PendingRegistrationRepository{db: db}
}

func fromPendingDomain(p *entity.PendingRegistration) *PendingRegistrationModel {
	return &PendingRegistrationModel{
		ID:           p.ID,
		Email:        p.Email,
		PasswordHash: p.PasswordHash,
		FirstName:    p.FirstName,
		LastName:     p.LastName,
		Code:         p.Code,
		ExpiresAt:    p.ExpiresAt.Unix(),
		Attempts:     p.Attempts,
		SignupIP:     p.SignupIP,
	}
}

func toPendingDomain(m *PendingRegistrationModel) *entity.PendingRegistration {
	return &entity.PendingRegistration{
		ID:           m.ID,
		Email:        m.Email,
		PasswordHash: m.PasswordHash,
		FirstName:    m.FirstName,
		LastName:     m.LastName,
		Code:         m.Code,
		ExpiresAt:    time.Unix(m.ExpiresAt, 0),
		Attempts:     m.Attempts,
		SignupIP:     m.SignupIP,
		CreatedAt:    time.Unix(m.CreatedAt, 0),
	}
}

// Upsert replaces any existing pending registration for the email with the new
// one, atomically, so only the latest sign-up attempt is ever active.
func (r *PendingRegistrationRepository) Upsert(ctx context.Context, p *entity.PendingRegistration) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("email = ?", p.Email).Delete(&PendingRegistrationModel{}).Error; err != nil {
			return err
		}
		return tx.Create(fromPendingDomain(p)).Error
	})
}

func (r *PendingRegistrationRepository) GetByEmail(ctx context.Context, email string) (*entity.PendingRegistration, error) {
	var model PendingRegistrationModel
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPendingNotFound
		}
		return nil, err
	}
	return toPendingDomain(&model), nil
}

func (r *PendingRegistrationRepository) DeleteByEmail(ctx context.Context, email string) error {
	return r.db.WithContext(ctx).
		Where("email = ?", email).
		Delete(&PendingRegistrationModel{}).Error
}

func (r *PendingRegistrationRepository) IncrementAttempts(ctx context.Context, email string) error {
	return r.db.WithContext(ctx).
		Model(&PendingRegistrationModel{}).
		Where("email = ?", email).
		UpdateColumn("attempts", gorm.Expr("attempts + 1")).Error
}
