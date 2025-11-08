package repository

import "errors"

var ErrAlreadyExists error = errors.New("repository: user with this email already exists")