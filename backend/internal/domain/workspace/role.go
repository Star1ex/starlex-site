package workspace

import "errors"

type Role string

const (
	RoleOwner  Role = "owner"
	RoleAdmin  Role = "admin"
	RoleMember Role = "member"
	RoleGuest  Role = "guest"
)

var ErrInvalidRole = errors.New("workspace: invalid role")

func ParseRole(value string) (Role, error) {
	role := Role(value)
	if role == "" {
		return RoleMember, nil
	}
	if !role.Valid() {
		return "", ErrInvalidRole
	}
	return role, nil
}

func (r Role) Valid() bool {
	switch r {
	case RoleOwner, RoleAdmin, RoleMember, RoleGuest:
		return true
	default:
		return false
	}
}

func (r Role) Rank() int {
	switch r {
	case RoleOwner:
		return 4
	case RoleAdmin:
		return 3
	case RoleMember:
		return 2
	case RoleGuest:
		return 1
	default:
		return 0
	}
}

func (r Role) AtLeast(min Role) bool {
	return r.Rank() >= min.Rank()
}
