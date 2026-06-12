package repository

import (
	"context"
	"time"

	domainSession "github.com/Star1ex/starlex-site/internal/domain/session"
	"gorm.io/gorm"
)

type SessionModel struct {
	ID               string     `gorm:"primaryKey"`
	UserID           string     `gorm:"not null;index"`
	DeviceID         string     `gorm:"not null;index"`
	UserAgent        string     `gorm:"not null;default:''"`
	IP               string     `gorm:"not null;default:''"`
	RefreshTokenHash string     `gorm:"not null;uniqueIndex"`
	CreatedAt        time.Time  `gorm:"autoCreateTime"`
	LastSeenAt       time.Time  `gorm:"not null"`
	ExpiresAt        time.Time  `gorm:"not null;index"`
	RevokedAt        *time.Time `gorm:"default:null;index"`
}

func (SessionModel) TableName() string {
	return "sessions"
}

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func fromSessionDomain(s *domainSession.Session) *SessionModel {
	return &SessionModel{
		ID:               s.ID,
		UserID:           s.UserID,
		DeviceID:         s.DeviceID,
		UserAgent:        s.UserAgent,
		IP:               s.IP,
		RefreshTokenHash: s.RefreshTokenHash,
		CreatedAt:        s.CreatedAt,
		LastSeenAt:       s.LastSeenAt,
		ExpiresAt:        s.ExpiresAt,
		RevokedAt:        s.RevokedAt,
	}
}

func toSessionDomain(m *SessionModel) *domainSession.Session {
	return &domainSession.Session{
		ID:               m.ID,
		UserID:           m.UserID,
		DeviceID:         m.DeviceID,
		UserAgent:        m.UserAgent,
		IP:               m.IP,
		RefreshTokenHash: m.RefreshTokenHash,
		CreatedAt:        m.CreatedAt,
		LastSeenAt:       m.LastSeenAt,
		ExpiresAt:        m.ExpiresAt,
		RevokedAt:        m.RevokedAt,
	}
}

func toSessionDomains(models []SessionModel) []*domainSession.Session {
	out := make([]*domainSession.Session, len(models))
	for i := range models {
		out[i] = toSessionDomain(&models[i])
	}
	return out
}

func (r *SessionRepository) Create(ctx context.Context, s *domainSession.Session) error {
	return r.db.WithContext(ctx).Create(fromSessionDomain(s)).Error
}

func (r *SessionRepository) FindByRefreshHash(ctx context.Context, refreshHash string) (*domainSession.Session, error) {
	var model SessionModel
	err := r.db.WithContext(ctx).
		Where("refresh_token_hash = ? AND revoked_at IS NULL AND expires_at > ?", refreshHash, time.Now().UTC()).
		First(&model).Error
	if err != nil {
		return nil, err
	}
	return toSessionDomain(&model), nil
}

func (r *SessionRepository) FindByID(ctx context.Context, id string) (*domainSession.Session, error) {
	var model SessionModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return toSessionDomain(&model), nil
}

func (r *SessionRepository) ListActiveByUser(ctx context.Context, userID string) ([]*domainSession.Session, error) {
	var models []SessionModel
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, time.Now().UTC()).
		Order("last_seen_at DESC").
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toSessionDomains(models), nil
}

func (r *SessionRepository) Revoke(ctx context.Context, id string) error {
	now := time.Now().UTC()
	result := r.db.WithContext(ctx).Model(&SessionModel{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Update("revoked_at", now)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SessionRepository) RevokeAllByUser(ctx context.Context, userID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&SessionModel{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now).Error
}

func (r *SessionRepository) TouchLastSeen(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Model(&SessionModel{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Update("last_seen_at", time.Now().UTC())
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SessionRepository) RotateRefreshHash(ctx context.Context, id, refreshHash string, expiresAt time.Time) error {
	result := r.db.WithContext(ctx).Model(&SessionModel{}).
		Where("id = ? AND revoked_at IS NULL", id).
		Updates(map[string]interface{}{
			"refresh_token_hash": refreshHash,
			"last_seen_at":       time.Now().UTC(),
			"expires_at":         expiresAt,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
