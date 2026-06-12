package storage

import (
	"context"
	"fmt"
	"strings"

	"github.com/Star1ex/starlex-site/internal/config"
)

func NewStorageByEnv(cfg *config.StorageConfig) (Storage, error) {
	switch strings.ToLower(strings.TrimSpace(cfg.StorageType)) {
	case "local":
		return NewLocalStorage(
			cfg.LocalPath,
			cfg.LocalURL,
		), nil

	case "r2", "s3":
		return NewR2Storage(context.Background(), R2Config{
			AccountID:       cfg.R2.AccountID,
			AccessKeyID:     cfg.R2.AccessKeyID,
			SecretAccessKey: cfg.R2.SecretAccessKey,
			Bucket:          cfg.R2.Bucket,
			Endpoint:        cfg.R2.Endpoint,
			PublicURL:       cfg.R2.PublicURL,
			KeyPrefix:       cfg.R2.KeyPrefix,
		})

	default:
		return nil, fmt.Errorf("unknown storage type: %s", cfg.StorageType)
	}
}
