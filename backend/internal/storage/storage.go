package storage

import (
	"context"
	"mime/multipart"
)

// Intarfaces for storage
type Storage interface {

	// Upload file by header, path
	UploadFile(ctx context.Context, file *multipart.FileHeader, path string) (string, error)

	// Delete file by path
	DeleteFile(ctx context.Context, path string) error
}
