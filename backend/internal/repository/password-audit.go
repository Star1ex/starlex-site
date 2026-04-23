package repository

import (
	"context"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type PasswordAuditLogModel struct {
	ID        string `gorm:"primaryKey"`
	UserID    string `gorm:"index"`
	Email     string `gorm:"index;not null"`
	Action    string `gorm:"index;not null"`
	Success   bool   `gorm:"default:false"`
	Reason    string `gorm:"size:255"`
	IP        string `gorm:"size:64"`
	UserAgent string `gorm:"size:255"`
	CreatedAt int64  `gorm:"autoCreateTime"`
}

func (PasswordAuditLogModel) TableName() string {
	return "password_audit_logs"
}

type PasswordAuditRepository struct {
	db *gorm.DB
}

func NewPasswordAuditRepository(db *gorm.DB) *PasswordAuditRepository {
	return &PasswordAuditRepository{db: db}
}

func fromPasswordAuditDomain(l *entity.PasswordAuditLog) *PasswordAuditLogModel {
	return &PasswordAuditLogModel{
		ID:        l.ID,
		UserID:    l.UserID,
		Email:     l.Email,
		Action:    l.Action,
		Success:   l.Success,
		Reason:    l.Reason,
		IP:        l.IP,
		UserAgent: l.UserAgent,
		CreatedAt: l.CreatedAt.Unix(),
	}
}

func (r *PasswordAuditRepository) Create(ctx context.Context, log *entity.PasswordAuditLog) error {
	return r.db.WithContext(ctx).Create(fromPasswordAuditDomain(log)).Error
}

func (r *PasswordAuditRepository) CountByEmailSince(ctx context.Context, email, action string, since time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&PasswordAuditLogModel{}).
		Where("email = ? AND action = ? AND created_at >= ?", email, action, since.Unix()).
		Count(&count).Error
	return count, err
}
