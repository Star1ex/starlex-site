package workspace

import "strings"

func DeriveKeyPrefix(name string) string {
	upper := strings.ToUpper(name)
	words := strings.FieldsFunc(upper, func(r rune) bool {
		return !isASCIIAlnum(r)
	})

	var initials []rune
	for _, word := range words {
		if word == "" {
			continue
		}
		initials = append(initials, rune(word[0]))
		if len(initials) == 4 {
			break
		}
	}
	if len(initials) >= 2 {
		return string(initials)
	}

	var chars []rune
	for _, r := range upper {
		if isASCIIAlnum(r) {
			chars = append(chars, r)
			if len(chars) == 4 {
				break
			}
		}
	}
	if len(chars) >= 2 {
		return string(chars)
	}
	return "WS"
}

func isASCIIAlnum(r rune) bool {
	return (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9')
}
