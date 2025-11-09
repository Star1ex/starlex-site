package handlers

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
)

type Handlers struct {
	service user.Service
}

func NewHandlers(service user.Service) *Handlers {
	return &Handlers{
		service: service,
	}
}
