package user

type OAuthUpdate struct {
	GoogleID        *string
	GithubID        *string
	GoogleIDSet     bool
	GithubIDSet     bool
	AvatarURL       *string
	FirstName       *string
	LastName        *string
	Email           *string
	IsVerified      *bool
	NameOverridden  *bool
	AuthProviders   []string
	AuthProvidersSet bool
}

const (
	ProviderLocal  = "local"
	ProviderGoogle = "google"
	ProviderGithub = "github"
)
