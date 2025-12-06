package storage

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
)

type LocalStorage struct {
	BasePath string
	BaseURL  string
}

func NewLocalStorage(basePath, baseURL string) *LocalStorage {
	_ = os.MkdirAll(basePath, os.ModePerm)
	return &LocalStorage{
		BasePath: basePath,
		BaseURL:  baseURL,
	}
}

func (s *LocalStorage) UploadFile(ctx context.Context,
	file *multipart.FileHeader, path string) (string, error) {

	dst := filepath.Join(s.BasePath, path)
	if err := os.MkdirAll(filepath.Dir(dst), os.ModePerm); err != nil {
		return "", fmt.Errorf("create dir: %w", err)
	}

	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("open file: %w", err)
	}

	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return "", fmt.Errorf("create dst: %w", err)
	}

	defer out.Close()

	if _, err := io.Copy(out, src); err != nil {
		return "", fmt.Errorf("copy: %w", err)
	}

	url := fmt.Sprintf("%s%s", s.BaseURL, path)
	return url, nil
}

func (s *LocalStorage) DeleteFile(ctx context.Context, path string) error {
	dst := filepath.Join(s.BasePath, path)
	return os.Remove(dst)
}
