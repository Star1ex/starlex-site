package workspace

import (
	"errors"
	"strings"
)

var (
	ErrInvalidName              = errors.New("workspace: invalid name")
	ErrInvalidKeyPrefix         = errors.New("workspace: invalid key prefix")
	ErrInvalidMemberDefaultRole = errors.New("workspace: invalid member default role")
)

type SettingsUpdate struct {
	Name              *string
	Description       *string
	Icon              *string
	Color             *string
	KeyPrefix         *string
	DefaultTaskStatus *string
	MemberDefaultRole *string
}

func NormalizeKeyPrefix(value string) (string, error) {
	prefix := strings.ToUpper(strings.TrimSpace(value))
	if len(prefix) < 2 || len(prefix) > 4 {
		return "", ErrInvalidKeyPrefix
	}
	for _, r := range prefix {
		if !isASCIIAlnum(r) {
			return "", ErrInvalidKeyPrefix
		}
	}
	return prefix, nil
}
