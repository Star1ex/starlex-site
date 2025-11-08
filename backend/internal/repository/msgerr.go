package repository

import "errors"

var ErrAlreadyExists error = errors.New("repository: user with this email already exists")
var ErrUserNotFound error = errors.New("repository: user with this email not found")