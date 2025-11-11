package security

import "github.com/google/uuid"


func GenerateNewID()string{
	id := uuid.New().String()
	return id
}