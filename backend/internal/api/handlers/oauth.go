package handlers

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/security"
	"github.com/gofiber/fiber/v2"
)

const (
	oauthStateCookieSuffix  = "state"
	oauthActionCookieSuffix = "action"
	oauthUserCookieSuffix   = "user"
	oauthReturnCookieSuffix = "return_to"
	oauthActionLogin        = "login"
	oauthActionLink         = "link"
)

type oauthProfile struct {
	Provider      string
	ProviderID    string
	Email         string
	EmailVerified bool
	FirstName     string
	LastName      string
	AvatarURL     string
}

type oauthAccessToken struct {
	AccessToken string `json:"access_token"`
}

type githubTokenResponse struct {
	AccessToken      string `json:"access_token"`
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

func (h *Handlers) OAuthRateLimit(ctx *fiber.Ctx) error {
	if h.oauthLimiter == nil {
		return ctx.Next()
	}
	key := fmt.Sprintf("%s:%s", ctx.IP(), ctx.Path())
	if !h.oauthLimiter.Allow(key) {
		return ctx.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
			"error": "too many requests, please try again later",
		})
	}
	return ctx.Next()
}

func (h *Handlers) StartGoogleOAuth(ctx *fiber.Ctx) error {
	if err := h.validateOAuthConfig("google"); err != nil {
		log.Printf("[ERROR] oauth config google: %v", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "oauth configuration error"})
	}
	returnTo := sanitizeReturnTo(ctx.Query("redirect"))
	state, err := security.GenerateSecureToken(32)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to start oauth"})
	}

	h.setOAuthCookies(ctx, "google", state, oauthActionLogin, "", returnTo)
	authURL := h.googleAuthURL(state)
	log.Printf("oauth google start: ip=%s return_to=%s", ctx.IP(), returnTo)
	return ctx.Redirect(authURL, fiber.StatusFound)
}

func (h *Handlers) StartGithubOAuth(ctx *fiber.Ctx) error {
	if err := h.validateOAuthConfig("github"); err != nil {
		log.Printf("[ERROR] oauth config github: %v", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "oauth configuration error"})
	}
	returnTo := sanitizeReturnTo(ctx.Query("redirect"))
	state, err := security.GenerateSecureToken(32)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to start oauth"})
	}

	h.setOAuthCookies(ctx, "github", state, oauthActionLogin, "", returnTo)
	authURL := h.githubAuthURL(state)
	log.Printf("oauth github start: ip=%s return_to=%s", ctx.IP(), returnTo)
	return ctx.Redirect(authURL, fiber.StatusFound)
}

func (h *Handlers) LinkGoogle(ctx *fiber.Ctx) error {
	if err := h.validateOAuthConfig("google"); err != nil {
		log.Printf("[ERROR] oauth config google: %v", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "oauth configuration error"})
	}
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	state, err := security.GenerateSecureToken(32)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to start oauth"})
	}
	returnTo := sanitizeReturnTo(ctx.Query("redirect"))
	h.setOAuthCookies(ctx, "google", state, oauthActionLink, userID, returnTo)
	log.Printf("oauth google link start: user=%s ip=%s", userID, ctx.IP())
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"auth_url": h.googleAuthURL(state),
	})
}

func (h *Handlers) LinkGithub(ctx *fiber.Ctx) error {
	if err := h.validateOAuthConfig("github"); err != nil {
		log.Printf("[ERROR] oauth config github: %v", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "oauth configuration error"})
	}
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	state, err := security.GenerateSecureToken(32)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to start oauth"})
	}
	returnTo := sanitizeReturnTo(ctx.Query("redirect"))
	h.setOAuthCookies(ctx, "github", state, oauthActionLink, userID, returnTo)
	log.Printf("oauth github link start: user=%s ip=%s", userID, ctx.IP())
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"auth_url": h.githubAuthURL(state),
	})
}

func (h *Handlers) HandleGoogleCallback(ctx *fiber.Ctx) error {
	if err := h.validateOAuthConfig("google"); err != nil {
		return h.redirectOAuthError(ctx, "google", "config_error", "")
	}
	state := ctx.Query("state")
	if state == "" {
		return h.redirectOAuthError(ctx, "google", "missing_state", "")
	}
	if err := h.validateOAuthState(ctx, "google", state); err != nil {
		log.Printf("oauth google state mismatch: ip=%s err=%v", ctx.IP(), err)
		return h.redirectOAuthError(ctx, "google", "invalid_state", "")
	}
	defer h.clearOAuthCookies(ctx, "google")

	if errParam := ctx.Query("error"); errParam != "" {
		log.Printf("oauth google denied: ip=%s error=%s", ctx.IP(), errParam)
		return h.redirectOAuthError(ctx, "google", errParam, h.getOAuthReturnTo(ctx, "google"))
	}
	code := ctx.Query("code")
	if code == "" {
		return h.redirectOAuthError(ctx, "google", "missing_code", h.getOAuthReturnTo(ctx, "google"))
	}

	profile, err := h.fetchGoogleProfile(ctx.Context(), code)
	if err != nil {
		log.Printf("oauth google profile error: ip=%s err=%v", ctx.IP(), err)
		return h.redirectOAuthError(ctx, "google", "profile_error", h.getOAuthReturnTo(ctx, "google"))
	}

	return h.completeOAuth(ctx, "google", profile)
}

func (h *Handlers) HandleGithubCallback(ctx *fiber.Ctx) error {
	if err := h.validateOAuthConfig("github"); err != nil {
		return h.redirectOAuthError(ctx, "github", "config_error", "")
	}
	state := ctx.Query("state")
	if state == "" {
		return h.redirectOAuthError(ctx, "github", "missing_state", "")
	}
	if err := h.validateOAuthState(ctx, "github", state); err != nil {
		log.Printf("oauth github state mismatch: ip=%s err=%v", ctx.IP(), err)
		return h.redirectOAuthError(ctx, "github", "invalid_state", "")
	}
	defer h.clearOAuthCookies(ctx, "github")

	if errParam := ctx.Query("error"); errParam != "" {
		log.Printf("oauth github denied: ip=%s error=%s", ctx.IP(), errParam)
		return h.redirectOAuthError(ctx, "github", errParam, h.getOAuthReturnTo(ctx, "github"))
	}
	code := ctx.Query("code")
	if code == "" {
		return h.redirectOAuthError(ctx, "github", "missing_code", h.getOAuthReturnTo(ctx, "github"))
	}

	profile, err := h.fetchGithubProfile(ctx.Context(), code)
	if err != nil {
		log.Printf("oauth github profile error: ip=%s err=%v", ctx.IP(), err)
		return h.redirectOAuthError(ctx, "github", "profile_error", h.getOAuthReturnTo(ctx, "github"))
	}

	return h.completeOAuth(ctx, "github", profile)
}

func (h *Handlers) UnlinkGoogle(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	userEntity, err := h.userService.Get(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}
	if userEntity.GoogleID == nil || *userEntity.GoogleID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "google account not linked"})
	}
	remaining := authProvidersAfterUnlink(userEntity, user.ProviderGoogle)
	if len(remaining) == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot unlink the last authentication method"})
	}
	update := user.OAuthUpdate{
		GoogleIDSet:      true,
		GoogleID:         nil,
		AuthProviders:    remaining,
		AuthProvidersSet: true,
	}
	if err := h.userService.UpdateOAuthFields(ctx.Context(), userID, update); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to unlink google account"})
	}
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "google account unlinked"})
}

func (h *Handlers) UnlinkGithub(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	userEntity, err := h.userService.Get(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}
	if userEntity.GithubID == nil || *userEntity.GithubID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "github account not linked"})
	}
	remaining := authProvidersAfterUnlink(userEntity, user.ProviderGithub)
	if len(remaining) == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot unlink the last authentication method"})
	}
	update := user.OAuthUpdate{
		GithubIDSet:      true,
		GithubID:         nil,
		AuthProviders:    remaining,
		AuthProvidersSet: true,
	}
	if err := h.userService.UpdateOAuthFields(ctx.Context(), userID, update); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to unlink github account"})
	}
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "github account unlinked"})
}

func (h *Handlers) completeOAuth(ctx *fiber.Ctx, provider string, profile oauthProfile) error {
	if profile.Email == "" {
		return h.redirectOAuthError(ctx, provider, "email_missing", h.getOAuthReturnTo(ctx, provider))
	}
	action := h.getOAuthAction(ctx, provider)
	linkUserID := h.getOAuthLinkUser(ctx, provider)
	returnTo := h.getOAuthReturnTo(ctx, provider)

	log.Printf("oauth %s callback: ip=%s action=%s", provider, ctx.IP(), action)

	userEntity, err := h.resolveOAuthUser(ctx.Context(), provider, action, linkUserID, profile)
	if err != nil {
		log.Printf("oauth %s user resolve error: ip=%s action=%s err=%v", provider, ctx.IP(), action, err)
		return h.redirectOAuthError(ctx, provider, "account_error", returnTo)
	}

	h.userService.PublishUserLogin(userEntity)

	_, refreshTokenStr, err := h.issueTokens(userEntity)
	if err != nil {
		log.Printf("oauth %s token error: ip=%s err=%v", provider, ctx.IP(), err)
		return h.redirectOAuthError(ctx, provider, "token_error", returnTo)
	}

	h.setRefreshCookie(ctx, refreshTokenStr)

	return h.redirectOAuthSuccess(ctx, returnTo)
}

func (h *Handlers) resolveOAuthUser(ctx context.Context, provider, action, linkUserID string, profile oauthProfile) (*entity.User, error) {
	if action == oauthActionLink {
		if linkUserID == "" {
			return nil, errors.New("missing link user id")
		}
		return h.linkOAuthAccount(ctx, linkUserID, profile)
	}

	existingByProvider, err := h.findByProvider(ctx, provider, profile.ProviderID)
	if err == nil && existingByProvider != nil {
		return h.updateOAuthUser(ctx, existingByProvider, profile)
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	existingByEmail, err := h.userService.GetByEmail(ctx, profile.Email)
	if err == nil && existingByEmail != nil {
		return h.linkExistingByEmail(ctx, existingByEmail, profile)
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	return h.createOAuthUser(ctx, profile)
}

func (h *Handlers) linkOAuthAccount(ctx context.Context, userID string, profile oauthProfile) (*entity.User, error) {
	userEntity, err := h.userService.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(profile.Email, userEntity.Email) {
		return nil, errors.New("email mismatch for linking")
	}

	otherUser, err := h.findByProvider(ctx, profile.Provider, profile.ProviderID)
	if err == nil && otherUser != nil && otherUser.ID != userEntity.ID {
		return nil, errors.New("provider already linked to another account")
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	update := h.buildOAuthUpdate(ctx, userEntity, profile, true)
	if err := h.userService.UpdateOAuthFields(ctx, userEntity.ID, update); err != nil {
		return nil, err
	}
	return h.userService.Get(ctx, userEntity.ID)
}

func (h *Handlers) linkExistingByEmail(ctx context.Context, userEntity *entity.User, profile oauthProfile) (*entity.User, error) {
	otherUser, err := h.findByProvider(ctx, profile.Provider, profile.ProviderID)
	if err == nil && otherUser != nil && otherUser.ID != userEntity.ID {
		return nil, errors.New("provider already linked to another account")
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return nil, err
	}

	update := h.buildOAuthUpdate(ctx, userEntity, profile, true)
	if err := h.userService.UpdateOAuthFields(ctx, userEntity.ID, update); err != nil {
		return nil, err
	}
	return h.userService.Get(ctx, userEntity.ID)
}

func (h *Handlers) updateOAuthUser(ctx context.Context, userEntity *entity.User, profile oauthProfile) (*entity.User, error) {
	update := h.buildOAuthUpdate(ctx, userEntity, profile, false)
	if err := h.userService.UpdateOAuthFields(ctx, userEntity.ID, update); err != nil {
		return nil, err
	}
	return h.userService.Get(ctx, userEntity.ID)
}

func (h *Handlers) buildOAuthUpdate(ctx context.Context, userEntity *entity.User, profile oauthProfile, ensureProvider bool) user.OAuthUpdate {
	update := user.OAuthUpdate{}
	if profile.AvatarURL != "" {
		update.AvatarURL = &profile.AvatarURL
	}
	if profile.Email != "" && !strings.EqualFold(profile.Email, userEntity.Email) {
		if email := h.maybeUpdateEmail(ctx, profile.Email, userEntity.ID); email != "" {
			update.Email = &email
		}
	}
	if !userEntity.NameOverridden {
		first, last := profile.FirstName, profile.LastName
		if first == "" && last == "" {
			first, last = fallbackNameFromEmail(profile.Email)
		}
		if first != "" {
			update.FirstName = &first
		}
		if last != "" {
			update.LastName = &last
		}
	}
	verified := true
	update.IsVerified = &verified

	providers := mergeAuthProviders(userEntity, profile.Provider)
	update.AuthProviders = providers
	update.AuthProvidersSet = true

	if ensureProvider {
		if profile.Provider == user.ProviderGoogle {
			update.GoogleIDSet = true
			update.GoogleID = &profile.ProviderID
		}
		if profile.Provider == user.ProviderGithub {
			update.GithubIDSet = true
			update.GithubID = &profile.ProviderID
		}
	}

	return update
}

func (h *Handlers) createOAuthUser(ctx context.Context, profile oauthProfile) (*entity.User, error) {
	firstName := profile.FirstName
	lastName := profile.LastName
	if firstName == "" && lastName == "" {
		firstName, lastName = fallbackNameFromEmail(profile.Email)
	}
	newUser := &entity.User{
		ID:            security.GenerateNewID(),
		Email:         profile.Email,
		Password:      "",
		FirstName:     firstName,
		LastName:      lastName,
		Role:          "member",
		Photo_URL:     nil,
		AvatarURL:     nil,
		GoogleID:      nil,
		GithubID:      nil,
		AuthProviders: []string{profile.Provider},
		IsVerified:    true,
		TokenVersion:  1,
	}
	if profile.AvatarURL != "" {
		newUser.AvatarURL = &profile.AvatarURL
	}
	if profile.Provider == user.ProviderGoogle {
		newUser.GoogleID = &profile.ProviderID
	}
	if profile.Provider == user.ProviderGithub {
		newUser.GithubID = &profile.ProviderID
	}

	if err := h.userService.CreateOAuth(ctx, newUser); err != nil {
		return nil, err
	}
	h.userService.PublishUserRegistered(newUser)
	return newUser, nil
}

func (h *Handlers) findByProvider(ctx context.Context, provider, providerID string) (*entity.User, error) {
	if provider == user.ProviderGoogle {
		return h.userService.GetByGoogleID(ctx, providerID)
	}
	if provider == user.ProviderGithub {
		return h.userService.GetByGithubID(ctx, providerID)
	}
	return nil, repository.ErrUserNotFound
}

func mergeAuthProviders(userEntity *entity.User, provider string) []string {
	providers := map[string]bool{}
	if userEntity.Password != "" {
		providers[user.ProviderLocal] = true
	}
	for _, p := range userEntity.AuthProviders {
		providers[p] = true
	}
	if userEntity.GoogleID != nil && *userEntity.GoogleID != "" {
		providers[user.ProviderGoogle] = true
	}
	if userEntity.GithubID != nil && *userEntity.GithubID != "" {
		providers[user.ProviderGithub] = true
	}
	if provider != "" {
		providers[provider] = true
	}
	result := make([]string, 0, len(providers))
	for p := range providers {
		result = append(result, p)
	}
	return result
}

func authProvidersAfterUnlink(userEntity *entity.User, provider string) []string {
	providers := []string{}
	if userEntity.Password != "" {
		providers = append(providers, user.ProviderLocal)
	}
	if provider != user.ProviderGoogle && userEntity.GoogleID != nil && *userEntity.GoogleID != "" {
		providers = append(providers, user.ProviderGoogle)
	}
	if provider != user.ProviderGithub && userEntity.GithubID != nil && *userEntity.GithubID != "" {
		providers = append(providers, user.ProviderGithub)
	}
	return providers
}

func (h *Handlers) maybeUpdateEmail(ctx context.Context, email, userID string) string {
	if email == "" {
		return ""
	}
	existing, err := h.userService.GetByEmail(ctx, email)
	if err == nil && existing != nil && existing.ID != userID {
		return ""
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return ""
	}
	return email
}

func (h *Handlers) googleAuthURL(state string) string {
	values := url.Values{}
	values.Set("client_id", h.oauthConfig.GoogleClientID)
	values.Set("redirect_uri", h.oauthConfig.GoogleCallbackURL)
	values.Set("response_type", "code")
	values.Set("scope", "openid email profile")
	values.Set("state", state)
	values.Set("access_type", "offline")
	values.Set("prompt", "consent")
	return "https://accounts.google.com/o/oauth2/v2/auth?" + values.Encode()
}

func (h *Handlers) githubAuthURL(state string) string {
	values := url.Values{}
	values.Set("client_id", h.oauthConfig.GithubClientID)
	values.Set("redirect_uri", h.oauthConfig.GithubCallbackURL)
	values.Set("scope", "user:email read:user")
	values.Set("state", state)
	return "https://github.com/login/oauth/authorize?" + values.Encode()
}

func (h *Handlers) fetchGoogleProfile(ctx context.Context, code string) (oauthProfile, error) {
	tokenResp, err := h.exchangeGoogleCode(ctx, code)
	if err != nil {
		return oauthProfile{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://openidconnect.googleapis.com/v1/userinfo", nil)
	if err != nil {
		return oauthProfile{}, err
	}
	req.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return oauthProfile{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return oauthProfile{}, fmt.Errorf("google userinfo status %d", resp.StatusCode)
	}

	var userinfo struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userinfo); err != nil {
		return oauthProfile{}, err
	}

	first, last := userinfo.GivenName, userinfo.FamilyName
	if first == "" && last == "" {
		first, last = fallbackNameFromEmail(userinfo.Email)
	}

	return oauthProfile{
		Provider:      user.ProviderGoogle,
		ProviderID:    userinfo.Sub,
		Email:         userinfo.Email,
		EmailVerified: userinfo.EmailVerified,
		FirstName:     first,
		LastName:      last,
		AvatarURL:     userinfo.Picture,
	}, nil
}

func (h *Handlers) exchangeGoogleCode(ctx context.Context, code string) (struct {
	AccessToken string `json:"access_token"`
}, error) {
	values := url.Values{}
	values.Set("code", code)
	values.Set("client_id", h.oauthConfig.GoogleClientID)
	values.Set("client_secret", h.oauthConfig.GoogleClientSecret)
	values.Set("redirect_uri", h.oauthConfig.GoogleCallbackURL)
	values.Set("grant_type", "authorization_code")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(values.Encode()))
	if err != nil {
		return struct {
			AccessToken string `json:"access_token"`
		}{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return struct {
			AccessToken string `json:"access_token"`
		}{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return struct {
			AccessToken string `json:"access_token"`
		}{}, fmt.Errorf("google token status %d", resp.StatusCode)
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return tokenResp, err
	}
	if tokenResp.AccessToken == "" {
		return tokenResp, errors.New("missing access token")
	}
	return tokenResp, nil
}

func (h *Handlers) fetchGithubProfile(ctx context.Context, code string) (oauthProfile, error) {
	tokenResp, err := h.exchangeGithubCode(ctx, code)
	if err != nil {
		return oauthProfile{}, err
	}

	userReq, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user", nil)
	if err != nil {
		return oauthProfile{}, err
	}
	userReq.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	userReq.Header.Set("Accept", "application/vnd.github+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(userReq)
	if err != nil {
		return oauthProfile{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return oauthProfile{}, fmt.Errorf("github user status %d", resp.StatusCode)
	}

	var userinfo struct {
		ID        int64  `json:"id"`
		Name      string `json:"name"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
		Email     string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userinfo); err != nil {
		return oauthProfile{}, err
	}

	email := userinfo.Email
	if email == "" {
		email, err = h.fetchGithubPrimaryEmail(ctx, tokenResp.AccessToken)
		if err != nil {
			return oauthProfile{}, err
		}
	}

	first, last := splitName(userinfo.Name)
	if first == "" {
		first = userinfo.Login
	}

	return oauthProfile{
		Provider:      user.ProviderGithub,
		ProviderID:    fmt.Sprintf("%d", userinfo.ID),
		Email:         email,
		EmailVerified: true,
		FirstName:     first,
		LastName:      last,
		AvatarURL:     userinfo.AvatarURL,
	}, nil
}

func (h *Handlers) exchangeGithubCode(ctx context.Context, code string) (struct {
	AccessToken string `json:"access_token"`
}, error) {
	values := url.Values{}
	values.Set("code", code)
	values.Set("client_id", h.oauthConfig.GithubClientID)
	values.Set("client_secret", h.oauthConfig.GithubClientSecret)
	values.Set("redirect_uri", h.oauthConfig.GithubCallbackURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://github.com/login/oauth/access_token", strings.NewReader(values.Encode()))
	if err != nil {
		return struct {
			AccessToken string `json:"access_token"`
		}{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return struct {
			AccessToken string `json:"access_token"`
		}{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return struct {
			AccessToken string `json:"access_token"`
		}{}, fmt.Errorf("github token status %d", resp.StatusCode)
	}

	var tokenResp githubTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return oauthAccessToken{}, err
	}
	if tokenResp.Error != "" {
		return oauthAccessToken{}, fmt.Errorf("github token error: %s", tokenResp.Error)
	}
	if tokenResp.AccessToken == "" {
		return oauthAccessToken{}, errors.New("missing access token")
	}
	return oauthAccessToken{AccessToken: tokenResp.AccessToken}, nil
}

func (h *Handlers) fetchGithubPrimaryEmail(ctx context.Context, accessToken string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user/emails", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/vnd.github+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("github emails status %d", resp.StatusCode)
	}

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", err
	}

	for _, email := range emails {
		if email.Primary && email.Verified {
			return email.Email, nil
		}
	}
	for _, email := range emails {
		if email.Verified {
			return email.Email, nil
		}
	}
	return "", errors.New("no verified github email")
}

func (h *Handlers) validateOAuthState(ctx *fiber.Ctx, provider, state string) error {
	cookieState := ctx.Cookies(oauthCookieName(provider, oauthStateCookieSuffix))
	if cookieState == "" || state == "" || subtle.ConstantTimeCompare([]byte(cookieState), []byte(state)) != 1 {
		return errors.New("state mismatch")
	}
	return nil
}

func (h *Handlers) getOAuthAction(ctx *fiber.Ctx, provider string) string {
	action := ctx.Cookies(oauthCookieName(provider, oauthActionCookieSuffix))
	if action == "" {
		return oauthActionLogin
	}
	return action
}

func (h *Handlers) getOAuthLinkUser(ctx *fiber.Ctx, provider string) string {
	return ctx.Cookies(oauthCookieName(provider, oauthUserCookieSuffix))
}

func (h *Handlers) getOAuthReturnTo(ctx *fiber.Ctx, provider string) string {
	return ctx.Cookies(oauthCookieName(provider, oauthReturnCookieSuffix))
}

func (h *Handlers) setOAuthCookies(ctx *fiber.Ctx, provider, state, action, userID, returnTo string) {
	exp := time.Now().Add(10 * time.Minute)
	h.setCookie(ctx, oauthCookieName(provider, oauthStateCookieSuffix), state, exp)
	h.setCookie(ctx, oauthCookieName(provider, oauthActionCookieSuffix), action, exp)
	if userID != "" {
		h.setCookie(ctx, oauthCookieName(provider, oauthUserCookieSuffix), userID, exp)
	}
	if returnTo != "" {
		h.setCookie(ctx, oauthCookieName(provider, oauthReturnCookieSuffix), returnTo, exp)
	}
}

func (h *Handlers) clearOAuthCookies(ctx *fiber.Ctx, provider string) {
	exp := time.Now().Add(-1 * time.Hour)
	h.setCookie(ctx, oauthCookieName(provider, oauthStateCookieSuffix), "", exp)
	h.setCookie(ctx, oauthCookieName(provider, oauthActionCookieSuffix), "", exp)
	h.setCookie(ctx, oauthCookieName(provider, oauthUserCookieSuffix), "", exp)
	h.setCookie(ctx, oauthCookieName(provider, oauthReturnCookieSuffix), "", exp)
}

func (h *Handlers) redirectOAuthSuccess(ctx *fiber.Ctx, returnTo string) error {
	return ctx.Redirect(h.frontendAppURL(returnTo), fiber.StatusFound)
}

func (h *Handlers) redirectOAuthError(ctx *fiber.Ctx, provider, errorCode, returnTo string) error {
	values := url.Values{}
	values.Set("error", errorCode)
	values.Set("provider", provider)
	if returnTo != "" {
		values.Set("return_to", returnTo)
	}
	return ctx.Redirect(h.frontendCallbackURL(values), fiber.StatusFound)
}

func (h *Handlers) frontendCallbackURL(values url.Values) string {
	base := strings.TrimRight(h.frontendBaseURL, "/")
	if base == "" {
		base = ""
	}
	return base + "/oauth/callback?" + values.Encode()
}

func (h *Handlers) frontendAppURL(returnTo string) string {
	base := strings.TrimRight(h.frontendBaseURL, "/")
	target := sanitizeReturnTo(returnTo)
	if base == "" {
		return target
	}
	return base + target
}

func (h *Handlers) setCookie(ctx *fiber.Ctx, name, value string, expires time.Time) {
	ctx.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    value,
		Expires:  expires,
		HTTPOnly: true,
		Secure:   h.isSecureCookie(),
		SameSite: "Lax",
		Path:     "/",
	})
}

func (h *Handlers) setRefreshCookie(ctx *fiber.Ctx, token string) {
	ctx.Cookie(&fiber.Cookie{
		Name:     "refreshToken",
		Value:    token,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   h.isSecureCookie(),
		SameSite: "Lax",
		Path:     "/",
	})
}

func (h *Handlers) clearRefreshCookie(ctx *fiber.Ctx) {
	ctx.Cookie(&fiber.Cookie{
		Name:     "refreshToken",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   h.isSecureCookie(),
		SameSite: "Lax",
		Path:     "/",
	})
}

func (h *Handlers) isSecureCookie() bool {
	return strings.HasPrefix(strings.ToLower(h.frontendBaseURL), "https://")
}

func (h *Handlers) validateOAuthConfig(provider string) error {
	if provider == "google" {
		if h.oauthConfig.GoogleClientID == "" || h.oauthConfig.GoogleClientSecret == "" || h.oauthConfig.GoogleCallbackURL == "" {
			return errors.New("google oauth not configured")
		}
		return nil
	}
	if provider == "github" {
		if h.oauthConfig.GithubClientID == "" || h.oauthConfig.GithubClientSecret == "" || h.oauthConfig.GithubCallbackURL == "" {
			return errors.New("github oauth not configured")
		}
		return nil
	}
	return errors.New("unknown provider")
}

func sanitizeReturnTo(raw string) string {
	if raw == "" {
		return "/dashboard"
	}
	if strings.HasPrefix(raw, "/") && !strings.HasPrefix(raw, "//") {
		return raw
	}
	return "/dashboard"
}

func oauthCookieName(provider, suffix string) string {
	return fmt.Sprintf("oauth_%s_%s", provider, suffix)
}

func splitName(full string) (string, string) {
	parts := strings.Fields(full)
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func fallbackNameFromEmail(email string) (string, string) {
	local := strings.Split(strings.TrimSpace(email), "@")
	if len(local) == 0 || local[0] == "" {
		return "", ""
	}
	parts := strings.FieldsFunc(local[0], func(r rune) bool {
		return r == '.' || r == '_' || r == '-'
	})
	if len(parts) == 0 {
		return local[0], ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}
