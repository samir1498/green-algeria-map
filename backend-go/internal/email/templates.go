package email

import "fmt"

func layout(title, body string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>%s</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f4; margin: 0; padding: 0;">
    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color: #2e7d32; padding: 24px 32px; color: #ffffff; font-size: 20px; font-weight: 700;">
                🌱 Green Algeria Map
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h1 style="font-size: 22px; color: #1b3a1d; margin: 0 0 16px;">%s</h1>
                %s
                <p style="color: #5f6f60; font-size: 13px; margin-top: 28px;">
                  If you did not request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px; background-color: #f4f7f4; color: #8a978c; font-size: 12px;">
                © Green Algeria Map — Reforesting Algeria, one tree at a time.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`, title, title, body)
}

func button(url, label string) string {
	return fmt.Sprintf(`<p style="margin: 24px 0;">
      <a href="%s" style="display: inline-block; background-color: #2e7d32; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600;">%s</a>
    </p>
    <p style="color: #5f6f60; font-size: 13px;">
      Or paste this link into your browser: <br />
      <a href="%s" style="color: #2e7d32; word-break: break-all;">%s</a>
    </p>`, url, label, url, url)
}

// VerificationEmail builds the verification email HTML body.
func VerificationEmail(name, url string) string {
	greeting := "Hi,"
	if name != "" {
		greeting = "Hi " + name + ","
	}
	body := fmt.Sprintf(`<p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">%s</p>
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">
      Thanks for joining Green Algeria Map! Please confirm your email address to activate your account.
    </p>%s`, greeting, button(url, "Verify my email"))
	return layout("Verify your email", body)
}

// PasswordResetEmail builds the password reset email HTML body.
func PasswordResetEmail(name, url string) string {
	greeting := "Hi,"
	if name != "" {
		greeting = "Hi " + name + ","
	}
	body := fmt.Sprintf(`<p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">%s</p>
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>%s`, greeting, button(url, "Reset password"))
	return layout("Reset your password", body)
}
