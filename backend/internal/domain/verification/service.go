package verification

import "context"

type Service interface {
	GenerateAndSendCode(ctx context.Context, userID, email, firstName string) error
	VerifyCode(ctx context.Context, userID, code string) error
	generateCode() (string, error)
}
