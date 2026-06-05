package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

type LocalStorage struct {
	BasePath string
	BaseURL  string
}

func NewLocalStorage(basePath, baseURL string) *LocalStorage {
	_ = os.MkdirAll(basePath, os.ModePerm)
	// Normalize BaseURL so returned URLs work both behind a proxy (nginx)
	// and when an absolute URL is configured via env.
	if baseURL == "" {
		baseURL = "/uploads/"
	} else if strings.HasPrefix(baseURL, "http://") || strings.HasPrefix(baseURL, "https://") {
		if !strings.HasSuffix(baseURL, "/") {
			baseURL += "/"
		}
	} else {
		// treat as relative path - ensure leading and trailing slash
		if !strings.HasPrefix(baseURL, "/") {
			baseURL = "/" + baseURL
		}
		if !strings.HasSuffix(baseURL, "/") {
			baseURL += "/"
		}
	}

	return &LocalStorage{
		BasePath: basePath,
		BaseURL:  baseURL,
	}
}

func (s *LocalStorage) UploadFile(ctx context.Context, file *multipart.FileHeader, path string) (string, error) {
	// normalize path (no leading slash)
	path = strings.TrimPrefix(path, "/")
	cleanPath := filepath.Clean(path)
	if cleanPath == "." || cleanPath == "/" || strings.HasPrefix(cleanPath, "..") {
		return "", errors.New("invalid upload path")
	}

	dst := filepath.Join(s.BasePath, path)
	baseAbs, err := filepath.Abs(s.BasePath)
	if err != nil {
		return "", fmt.Errorf("resolve storage base: %w", err)
	}
	dstAbs, err := filepath.Abs(dst)
	if err != nil {
		return "", fmt.Errorf("resolve upload path: %w", err)
	}
	if !strings.HasPrefix(dstAbs, baseAbs+string(filepath.Separator)) && dstAbs != baseAbs {
		return "", errors.New("path traversal blocked")
	}

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

	// Build URL by concatenating base URL and path
	url := fmt.Sprintf("%s%s", s.BaseURL, path)
	return url, nil
}

func (s *LocalStorage) DeleteFile(ctx context.Context, path string) error {
	cleanPath := filepath.Clean(strings.TrimPrefix(path, "/"))
	if cleanPath == "." || cleanPath == "/" || strings.HasPrefix(cleanPath, "..") {
		return errors.New("invalid delete path")
	}
	dst := filepath.Join(s.BasePath, cleanPath)
	baseAbs, err := filepath.Abs(s.BasePath)
	if err != nil {
		return err
	}
	dstAbs, err := filepath.Abs(dst)
	if err != nil {
		return err
	}
	if !strings.HasPrefix(dstAbs, baseAbs+string(filepath.Separator)) && dstAbs != baseAbs {
		return errors.New("path traversal blocked")
	}
	return os.Remove(dstAbs)
}
