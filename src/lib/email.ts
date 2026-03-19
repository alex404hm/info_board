import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM ?? "onboarding@antify.alexander-holm.com"
const FROM = `TEC Info Board <${FROM_ADDRESS}>`
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

// ── shared HTML wrapper ────────────────────────────────────────────────────────

function emailLayout(body: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#040b16;font-family:system-ui,-apple-system,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">

            <!-- Sender avatar row -->
            <tr><td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <!-- Avatar circle with logo (table-based for email client compat) -->
                    <table cellpadding="0" cellspacing="0" style="width:48px;height:48px;">
                      <tr>
                        <td align="center" valign="middle" style="width:48px;height:48px;border-radius:50%;background:#0f1f38;border:1.5px solid rgba(255,255,255,0.12);">
                          <img src="${BASE_URL}/logo.svg" alt="TEC" width="26" height="9" style="display:block;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <span style="display:block;font-size:14px;font-weight:600;color:#f4f6ff;line-height:1.3;">TEC Info Board</span>
                    <span style="display:block;font-size:12px;color:#65718a;line-height:1.3;">${FROM_ADDRESS}</span>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Card -->
            <tr><td style="background:#101b2f;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
              <!-- Card header strip with logo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0a1525;padding:20px 32px;border-bottom:1px solid rgba(255,255,255,0.07);">
                    <img src="${BASE_URL}/logo.svg" alt="TEC" height="18" style="display:block;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 32px 32px;">
                    ${body}
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Footer -->
            <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#65718a;">
              TEC Info Board · Frederiksberg · This email was sent automatically.
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

// ── invite email ───────────────────────────────────────────────────────────────

export async function sendInviteEmail(
  to: string,
  token: string,
  role: string
): Promise<string> {
  const link = `${BASE_URL}/invite/${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[INVITE – no RESEND_API_KEY]\nTo: ${to}  Role: ${role}\nLink: ${link}\n`)
    return link
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "You've been invited to TEC Info Board",
    html: emailLayout(`
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#10b981;text-transform:uppercase;letter-spacing:0.06em;">You're invited</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#f4f6ff;line-height:1.25;">Welcome to TEC Info Board</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#a3b2d4;line-height:1.6;">
          You've been invited to join as a <strong style="color:#f4f6ff;">${role}</strong>.
          Click below to set up your name and password.
        </p>
        <a href="${link}" style="display:inline-block;background:#10b981;color:#fff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          Accept Invitation →
        </a>
        <p style="margin:28px 0 0;font-size:12px;color:#65718a;">
          This link expires in 7 days. If you weren't expecting this, you can ignore this email.
        </p>
      `
    ),
  })

  return link
}

// ── reset password email ───────────────────────────────────────────────────────

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[RESET PASSWORD – no RESEND_API_KEY]\nTo: ${to}\nLink: ${url}\n`)
    return
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your TEC Info Board password",
    html: emailLayout(`
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#818cf8;text-transform:uppercase;letter-spacing:0.06em;">Password reset</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#f4f6ff;line-height:1.25;">Reset your password</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#a3b2d4;line-height:1.6;">
          We received a request to reset the password for your account.
          Click the button below to choose a new password.
        </p>
        <a href="${url}" style="display:inline-block;background:#6366f1;color:#fff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          Reset Password →
        </a>
        <p style="margin:28px 0 0;font-size:12px;color:#65718a;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      `
    ),
  })
}
