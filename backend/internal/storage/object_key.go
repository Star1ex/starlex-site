package storage

import (
	"errors"
	"net/url"
	"path"
	"strings"
)

var errInvalidObjectKey = errors.New("invalid object key")

func normalizeObjectKey(raw string) (string, error) {
	key := strings.TrimSpace(strings.ReplaceAll(raw, "\\", "/"))
	key = strings.TrimPrefix(key, "/")
	if key == "" || strings.Contains(key, "\x00") {
		return "", errInvalidObjectKey
	}

	cleanKey := path.Clean(key)
	if cleanKey == "." || cleanKey == "/" || cleanKey == ".." || strings.HasPrefix(cleanKey, "../") {
		return "", errInvalidObjectKey
	}

	return cleanKey, nil
}

func prefixedObjectKey(prefix, key string) (string, error) {
	cleanKey, err := normalizeObjectKey(key)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(prefix) == "" {
		return cleanKey, nil
	}

	cleanPrefix, err := normalizeObjectKey(prefix)
	if err != nil {
		return "", err
	}
	return path.Join(cleanPrefix, cleanKey), nil
}

func objectURL(baseURL, key string) (string, error) {
	cleanKey, err := normalizeObjectKey(key)
	if err != nil {
		return "", err
	}

	base := strings.TrimSpace(baseURL)
	if base == "" {
		return "", errors.New("storage public URL is empty")
	}
	if !strings.HasSuffix(base, "/") {
		base += "/"
	}

	return base + escapeObjectKey(cleanKey), nil
}

func escapeObjectKey(key string) string {
	parts := strings.Split(key, "/")
	for i, part := range parts {
		parts[i] = url.PathEscape(part)
	}
	return strings.Join(parts, "/")
}

func objectKeyFromReference(reference, baseURL string) (string, error) {
	ref := strings.TrimSpace(reference)
	if ref == "" {
		return "", errInvalidObjectKey
	}

	refURL, refIsURL := parseAbsoluteURL(ref)
	if refIsURL {
		base, baseIsURL := parseAbsoluteURL(baseURL)
		if baseIsURL && sameURLAuthority(refURL, base) {
			if key, ok := trimPathPrefix(refURL.Path, base.Path); ok {
				return normalizeObjectKey(key)
			}
		}
		if key, ok := trimPathPrefix(refURL.Path, baseURL); ok {
			return normalizeObjectKey(key)
		}
		return normalizeObjectKey(refURL.Path)
	}

	if key, ok := trimBaseURLPrefix(ref, baseURL); ok {
		return normalizeObjectKey(key)
	}

	if key, ok := trimPathPrefix(ref, baseURL); ok {
		return normalizeObjectKey(key)
	}

	return normalizeObjectKey(ref)
}

func trimBaseURLPrefix(reference, baseURL string) (string, bool) {
	base := strings.TrimSpace(baseURL)
	if base == "" {
		return "", false
	}
	if !strings.HasSuffix(base, "/") {
		base += "/"
	}
	if strings.HasPrefix(reference, base) {
		return strings.TrimPrefix(reference, base), true
	}
	return "", false
}

func trimPathPrefix(value, prefix string) (string, bool) {
	basePath := storageBasePath(prefix)
	if basePath == "" {
		return "", false
	}

	candidate := strings.ReplaceAll(value, "\\", "/")
	if !strings.HasPrefix(candidate, "/") {
		candidate = "/" + candidate
	}

	if basePath == "/" {
		return strings.TrimPrefix(candidate, "/"), true
	}
	if candidate == strings.TrimSuffix(basePath, "/") {
		return "", false
	}
	if strings.HasPrefix(candidate, basePath) {
		return strings.TrimPrefix(candidate, basePath), true
	}
	return "", false
}

func storageBasePath(baseURL string) string {
	base := strings.TrimSpace(baseURL)
	if base == "" {
		return ""
	}
	if parsed, ok := parseAbsoluteURL(base); ok {
		base = parsed.Path
	}

	base = strings.ReplaceAll(base, "\\", "/")
	base = "/" + strings.Trim(base, "/")
	if base == "/" {
		return "/"
	}
	return base + "/"
}

func parseAbsoluteURL(raw string) (*url.URL, bool) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || !parsed.IsAbs() {
		return nil, false
	}
	return parsed, true
}

func sameURLAuthority(a, b *url.URL) bool {
	return strings.EqualFold(a.Scheme, b.Scheme) && strings.EqualFold(a.Host, b.Host)
}
