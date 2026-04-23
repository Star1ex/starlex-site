package security

import (
	"errors"

	"github.com/alexedwards/argon2id"
)

var params = argon2id.Params{
	Memory:      32 * 1024, // 32 MB
	Iterations:  2,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

// HashPassword
func HashPassword(password string) (string, error) {
	return argon2id.CreateHash(password, &params)
}

// VerifyPassword
func VerifyPassword(hash, password string) (bool, error) {
	return argon2id.ComparePasswordAndHash(password, hash)
}

var ErrUnknownPassword error = errors.New("security:hash:unknown password")
var ErrInvalidCred error = errors.New("security:hash:invalid credentials")
