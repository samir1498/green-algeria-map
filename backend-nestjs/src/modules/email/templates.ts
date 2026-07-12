export interface EmailTemplateData {
  name?: string;
  url?: string;
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f4f7f4;
  margin: 0;
  padding: 0;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #2e7d32;
  color: #ffffff;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-weight: 600;
`;

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="${baseStyle}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color: #2e7d32; padding: 24px 32px; color: #ffffff; font-size: 20px; font-weight: 700;">
                🌱 Green Algeria Map
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h1 style="font-size: 22px; color: #1b3a1d; margin: 0 0 16px;">${title}</h1>
                ${bodyHtml}
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
</html>`;
}

export function verificationEmailTemplate(data: EmailTemplateData): string {
  const greeting = data.name ? `Hi ${data.name},` : 'Hi,';
  const body = `
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">${greeting}</p>
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">
      Thanks for joining Green Algeria Map! Please confirm your email address to activate your account.
    </p>
    <p style="margin: 24px 0;">
      <a href="${data.url}" style="${buttonStyle}">Verify my email</a>
    </p>
    <p style="color: #5f6f60; font-size: 13px;">
      Or paste this link into your browser: <br />
      <a href="${data.url}" style="color: #2e7d32; word-break: break-all;">${data.url}</a>
    </p>`;
  return layout('Verify your email', body);
}

export function passwordResetTemplate(data: EmailTemplateData): string {
  const greeting = data.name ? `Hi ${data.name},` : 'Hi,';
  const body = `
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">${greeting}</p>
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <p style="margin: 24px 0;">
      <a href="${data.url}" style="${buttonStyle}">Reset password</a>
    </p>
    <p style="color: #5f6f60; font-size: 13px;">
      Or paste this link into your browser: <br />
      <a href="${data.url}" style="color: #2e7d32; word-break: break-all;">${data.url}</a>
    </p>`;
  return layout('Reset your password', body);
}

export function welcomeEmailTemplate(data: EmailTemplateData): string {
  const greeting = data.name ? `Hi ${data.name},` : 'Hi,';
  const body = `
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">${greeting}</p>
    <p style="color: #2f3a30; font-size: 15px; line-height: 1.6;">
      Your email has been verified. Welcome to Green Algeria Map — let's plant some trees together! 🌳
    </p>`;
  return layout('Welcome to Green Algeria Map', body);
}
