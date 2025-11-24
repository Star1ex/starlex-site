package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseConfig DatabaseConfig
	StorageConfig  StorageConfig
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

// Loading full config with data from .env.example.example
func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Fatalf("error loading .env.example.example file: %v", err)
	}

	return &Config{
		DatabaseConfig: DatabaseConfig{
			Host:     os.Getenv("DB_HOST"),
			Port:     getEnvInt("DB_PORT", 5432),
			User:     os.Getenv("DB_USER"),
			DB_Name:  os.Getenv("DB_NAME"),
			Password: os.Getenv("DB_PASSWORD"),
			Database: os.Getenv("DB_NAME"),
			SSLMode:  os.Getenv("DB_SSL_MODE"),
		},

		StorageConfig: StorageConfig{
			StorageType: os.Getenv("STORAGE_TYPE"),
			LocalPath:   os.Getenv("LOCAL_PATH"),
			LocalURL:    os.Getenv("LOCAL_URL"),
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
		log.Printf("warning: cannot parse %s=%s as int, using default %d", key, valStr, defaultValue)
		return defaultValue
	}
	return val
}

// Make a DSN
func (db *DatabaseConfig) DSN() string {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		db.Host, db.Port, db.User, db.Password, db.DB_Name, db.SSLMode,
	)

	return dsn
}
