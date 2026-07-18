package auth

import (
	"os"

	"github.com/jeromesth/go-better-auth/plugin"
)

type autoVerifyPlugin struct{}

func (p *autoVerifyPlugin) ID() string {
	return "auto-verify"
}

func (p *autoVerifyPlugin) UserCreateHooks() []plugin.UserCreateHookFn {
	if os.Getenv("REQUIRE_EMAIL_VERIFICATION") != "false" {
		return nil
	}
	return []plugin.UserCreateHookFn{
		func(data map[string]any) map[string]any {
			data["email_verified"] = true
			return data
		},
	}
}
