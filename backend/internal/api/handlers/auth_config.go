package handlers

type OAuthConfig struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string
	GithubClientID     string
	GithubClientSecret string
	GithubCallbackURL  string
}

type AuthConfig struct {
	JWTSecret       string
	FrontendBaseURL string
	OAuth           OAuthConfig
}
