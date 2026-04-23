package logger

import "go.uber.org/zap"

var Log *zap.SugaredLogger

func Init(env string) {
	var base *zap.Logger
	var err error
	if env == "production" {
		base, err = zap.NewProduction()
	} else {
		base, err = zap.NewDevelopment()
	}
	if err != nil {
		panic(err)
	}
	Log = base.Sugar()
}
