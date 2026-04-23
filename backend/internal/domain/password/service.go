package password

import "context"

type Service interface {
	RequestReset(ctx context.Context, email, ip, userAgent string) error
	VerifyReset(ctx context.Context, email, token, code string) error
	ResetPassword(ctx context.Context, email, token, code, newPassword, ip, userAgent string) error
	ChangePassword(ctx context.Context, userID, currentPassword, newPassword, ip, userAgent string) error
	CleanupExpiredTokens(ctx context.Context) (int64, error)
}
