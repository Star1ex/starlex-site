package main

import (
	"github.com/Team-Tracks/team-track-site/internal/app"
)

// @title TeamTrack API
// @version 1.0
// @description This is the API for TeamTrack web-site
// @host localhost: 3000
// @BasePath /api
// @schemes http
func main() {
	app.StartServer()
}
