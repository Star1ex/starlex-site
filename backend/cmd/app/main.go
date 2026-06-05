package main

import (
	"github.com/Star1ex/starlex-site/internal/app"
	// _ "github.com/Star1ex/starlex-site/docs"
)

// Swagger disabled: title Starlex API
// Swagger disabled: version 1.0
// Swagger disabled: description This is the API for Starlex web-site
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
