package storage

import (
	"fmt"

	"github.com/Team-Tracks/team-track-site/internal/config"
)

func NewStorageByEnv(cfg *config.StorageConfig) (Storage, error) {

	switch cfg.StorageType {
	case "local":
		return NewLocalStorage(
			cfg.LocalPath,
			cfg.LocalURL,
		), nil

	case "s3":
		return nil, fmt.Errorf("s3 not implemented")

	default:
		return nil, fmt.Errorf("unknown storage type: %s", cfg.StorageType)
	}
}
