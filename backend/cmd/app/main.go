package main

import (
	"github.com/Team-Tracks/team-track-site/internal/app"
)

// @title TeamTrack API
// @version 1.0
// @description This is the API for TeamTrack web-site
// @host localhost:3000
// @BasePath /api
// @schemes http
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer {your_token}"
func main() {
	app.StartServer()
}
