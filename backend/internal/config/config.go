package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/Team-Tracks/team-track-site/internal/logger"
	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseConfig        DatabaseConfig
	StorageConfig         StorageConfig
	TelegramNotifications TelegramNotifications
	EmailConfig           EmailConfig
	FrontendBaseURL       string
	JWTSecret             string
	OAuthConfig           OAuthConfig
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	DB_Name  string
	Password string
	Database string
	SSLMode  string
}

type StorageConfig struct {
	StorageType string
	LocalPath   string
	LocalURL    string
}

type TelegramNotifications struct {
	Token  string
	ChatID string
}

type OAuthConfig struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string
	GithubClientID     string
	GithubClientSecret string
	GithubCallbackURL  string
}

// Loading full config with data from .env file
// If .env file is not found, uses environment variables (useful for Docker)
func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		logger.Log.Warnw(".env file not found, using environment variables", "error", err)
		// Don't fail - in Docker, environment variables are set directly
	}

	return &Config{
		EmailConfig: EmailConfig{
			SMTPHost:     os.Getenv("SMTP_HOST"),
			SMTPPort:     os.Getenv("SMTP_PORT"),
			SMTPUsername: os.Getenv("SMTP_USERNAME"),
			SMTPPassword: os.Getenv("SMTP_PASSWORD"),
			FromEmail:    os.Getenv("SMTP_FROM_EMAIL"),
			FromName:     os.Getenv("SMTP_FROM_NAME"),
		},

		DatabaseConfig: DatabaseConfig{
			Host:     getEnvStr("DB_HOST", "db"),
			Port:     getDBPort(getEnvStr("DB_HOST", "db"), getEnvInt("DB_PORT", 5432)),
			User:     os.Getenv("DB_USER"),
			DB_Name:  os.Getenv("DB_NAME"),
			Password: os.Getenv("DB_PASSWORD"),
			Database: os.Getenv("DB_NAME"),
			SSLMode:  getEnvStr("DB_SSL_MODE", "disable"),
		},

		StorageConfig: StorageConfig{
			StorageType: os.Getenv("STORAGE_TYPE"),
			LocalPath:   os.Getenv("LOCAL_PATH"),
			LocalURL:    os.Getenv("LOCAL_URL"),
		},

		TelegramNotifications: TelegramNotifications{
			Token:  os.Getenv("TOKEN_TELEGRAM_NOTIFICATIONS"),
			ChatID: os.Getenv("CHAT_ID_TELEGRAM_BOT_NOTIFICATIONS"),
		},

		FrontendBaseURL: os.Getenv("FRONTEND_BASE_URL"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		OAuthConfig: OAuthConfig{
			GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			GoogleCallbackURL:  os.Getenv("GOOGLE_CALLBACK_URL"),
			GithubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			GithubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			GithubCallbackURL:  os.Getenv("GITHUB_CALLBACK_URL"),
		},
	}
}

// For convert port
func getEnvInt(key string, defaultValue int) int {
	valStr := os.Getenv(key)
	if valStr == "" {
		return defaultValue
	}

	val, err := strconv.Atoi(valStr)
	if err != nil {
		logger.Log.Warnw("cannot parse int env var, using default", "key", key, "value", valStr, "default", defaultValue, "error", err)
		return defaultValue
	}
	return val
}

func getEnvStr(key string, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}

// Force port 5432 when using the internal Docker service host "db"
func getDBPort(host string, envPort int) int {
	if host == "db" {
		return 5432
	}
	return envPort
}

// Make a DSN
func (db *DatabaseConfig) DSN() string {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		db.Host, db.Port, db.User, db.Password, db.DB_Name, db.SSLMode,
	)

	return dsn
}
