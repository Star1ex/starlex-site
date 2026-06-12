package storage

import (
	"context"
	"errors"
	"fmt"
	"mime"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

const r2Region = "auto"

type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	Endpoint        string
	PublicURL       string
	KeyPrefix       string
}

type r2Client interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
}

type R2Storage struct {
	client    r2Client
	bucket    string
	publicURL string
	keyPrefix string
}

func NewR2Storage(ctx context.Context, cfg R2Config) (*R2Storage, error) {
	if err := cfg.validate(); err != nil {
		return nil, err
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(r2Region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("load R2 config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(options *s3.Options) {
		options.BaseEndpoint = aws.String(cfg.resolvedEndpoint())
		options.UsePathStyle = true
	})

	return newR2Storage(client, cfg)
}

func newR2Storage(client r2Client, cfg R2Config) (*R2Storage, error) {
	if err := cfg.validate(); err != nil {
		return nil, err
	}

	keyPrefix := strings.TrimSpace(cfg.KeyPrefix)
	if keyPrefix != "" {
		cleanPrefix, err := normalizeObjectKey(keyPrefix)
		if err != nil {
			return nil, fmt.Errorf("invalid R2 key prefix: %w", err)
		}
		keyPrefix = cleanPrefix
	}

	return &R2Storage{
		client:    client,
		bucket:    strings.TrimSpace(cfg.Bucket),
		publicURL: strings.TrimRight(strings.TrimSpace(cfg.PublicURL), "/"),
		keyPrefix: keyPrefix,
	}, nil
}

func (cfg R2Config) validate() error {
	switch {
	case strings.TrimSpace(cfg.Bucket) == "":
		return errors.New("R2 bucket is required")
	case strings.TrimSpace(cfg.AccessKeyID) == "":
		return errors.New("R2 access key id is required")
	case strings.TrimSpace(cfg.SecretAccessKey) == "":
		return errors.New("R2 secret access key is required")
	case strings.TrimSpace(cfg.PublicURL) == "":
		return errors.New("R2 public URL is required")
	case strings.TrimSpace(cfg.Endpoint) == "" && strings.TrimSpace(cfg.AccountID) == "":
		return errors.New("R2 account id or endpoint is required")
	default:
		return nil
	}
}

func (cfg R2Config) resolvedEndpoint() string {
	if endpoint := strings.TrimSpace(cfg.Endpoint); endpoint != "" {
		return strings.TrimRight(endpoint, "/")
	}
	return fmt.Sprintf("https://%s.r2.cloudflarestorage.com", strings.TrimSpace(cfg.AccountID))
}

func (s *R2Storage) UploadFile(ctx context.Context, file *multipart.FileHeader, key string) (string, error) {
	objectKey, err := prefixedObjectKey(s.keyPrefix, key)
	if err != nil {
		return "", fmt.Errorf("invalid upload key: %w", err)
	}

	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("open file: %w", err)
	}
	defer src.Close()

	contentType := detectUploadContentType(src, file)
	if _, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(objectKey),
		Body:          src,
		ContentLength: aws.Int64(file.Size),
		ContentType:   aws.String(contentType),
		CacheControl:  aws.String("public, max-age=31536000, immutable"),
	}); err != nil {
		return "", fmt.Errorf("upload to R2: %w", err)
	}

	publicURL, err := objectURL(s.publicURL, objectKey)
	if err != nil {
		return "", err
	}
	return publicURL, nil
}

func (s *R2Storage) DeleteFile(ctx context.Context, reference string) error {
	objectKey, err := s.objectKeyFromReference(reference)
	if err != nil {
		return fmt.Errorf("invalid delete key: %w", err)
	}

	_, err = s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return fmt.Errorf("delete from R2: %w", err)
	}
	return nil
}

func (s *R2Storage) objectKeyFromReference(reference string) (string, error) {
	refURL, refIsURL := parseAbsoluteURL(reference)
	publicURL, publicIsURL := parseAbsoluteURL(s.publicURL)
	if refIsURL && publicIsURL && !sameURLAuthority(refURL, publicURL) {
		return "", errors.New("storage reference is outside configured R2 public URL")
	}
	return objectKeyFromReference(reference, s.publicURL)
}

func detectUploadContentType(src multipart.File, file *multipart.FileHeader) string {
	header := make([]byte, 512)
	n, err := src.Read(header)
	if _, seekErr := src.Seek(0, 0); seekErr != nil {
		return fallbackUploadContentType(file)
	}
	if err == nil && n > 0 {
		if detected := http.DetectContentType(header[:n]); detected != "application/octet-stream" {
			return detected
		}
	}
	return fallbackUploadContentType(file)
}

func fallbackUploadContentType(file *multipart.FileHeader) string {
	if headerType := strings.TrimSpace(file.Header.Get("Content-Type")); headerType != "" {
		return headerType
	}
	if extType := mime.TypeByExtension(strings.ToLower(file.Filename)); extType != "" {
		return extType
	}
	return "application/octet-stream"
}
