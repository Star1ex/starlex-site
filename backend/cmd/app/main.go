package main

import (
	"github.com/Team-Tracks/team-track-site/internal/app"
	// ДОДАНО: Swagger docs import disabled
	// _ "github.com/Team-Tracks/team-track-site/docs"
)

// Swagger disabled: title TeamTrack API
// Swagger disabled: version 1.0
// Swagger disabled: description This is the API for TeamTrack web-site
// Swagger disabled: host localhost:3000
// Swagger disabled: BasePath /api
// Swagger disabled: schemes http
// Swagger disabled: securityDefinitions.apikey BearerAuth
// Swagger disabled: in header
// Swagger disabled: name Authorization
// Swagger disabled: description Type "Bearer {your_token}"
func main() {
	app.StartServer()
}
