package security

import (
	"errors"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string)(string,error){
	newPassword,err:=bcrypt.GenerateFromPassword([]byte(password),14)
	if err != nil{
		log.Println(err)
		return "",ErrInvalidCred
	}
	return string(newPassword),nil
}

func ComparePassword(userPassword ,inputPassword string)error{
	err:=bcrypt.CompareHashAndPassword([]byte(userPassword),[]byte(inputPassword))
	if err != nil{
		if errors.Is(err,bcrypt.ErrMismatchedHashAndPassword){
			log.Println(err)
			return ErrUnknownPassword
		}
		log.Println(err)
		return ErrInvalidCred
	}
}



var ErrUnknownPassword error = errors.New("security:hash:unknown password")
var ErrInvalidCred error = errors.New("security:hash:invalid credentials")