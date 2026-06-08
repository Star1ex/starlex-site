package workspace

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Member struct {
	User     *entity.User
	Role     Role
	JoinedAt time.Time
}
