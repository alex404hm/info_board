import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM ?? "onboarding@antify.alexander-holm.com"
const FROM = `TEC Info Board <${FROM_ADDRESS}>`
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

// ── shared HTML wrapper ────────────────────────────────────────────────────────

function emailLayout(opts: {
  headerText: string
  bodyText: string
  linkText: string
  linkHref: string
  primaryColor: string
  infoText: string
  highlightEmail?: string
  footerText: string
}) {
  const {
    headerText,
    bodyText,
    linkText,
    linkHref,
    primaryColor,
    infoText,
    highlightEmail,
    footerText,
  } = opts

  const infoHtml = highlightEmail
    ? infoText.replace(
        highlightEmail,
        `<a href="mailto:${highlightEmail}" style="color:${primaryColor};text-decoration:none;">${highlightEmail}</a>`
      )
    : infoText

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${headerText}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:500px;">

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Logo header -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" style="background:#0f1c30;padding:28px 32px;">
                <img src="https://info.alexander-holm.com/logo.svg" alt="TEC" width="72" height="25" style="display:block;" />
              </td>
            </tr>
          </table>

          <!-- Content -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:40px 40px 12px;">

                <!-- Header text -->
                <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#0d1117;line-height:1.25;text-align:center;">
                  ${headerText}
                </h1>

                <!-- Body text -->
                <p style="margin:0 0 32px;font-size:15px;color:#555e6d;line-height:1.65;text-align:center;">
                  ${bodyText}
                </p>

                <!-- CTA button -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center" style="padding-bottom:32px;">
                      <a href="${linkHref}"
                         style="display:block;width:100%;box-sizing:border-box;background:${primaryColor};color:#ffffff;padding:15px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;text-align:center;">
                        ${linkText}
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr><td style="border-top:1px solid #e8eaed;padding-bottom:24px;"></td></tr>
                </table>

                <!-- Info text -->
                <p style="margin:0 0 8px;font-size:14px;color:#555e6d;line-height:1.6;text-align:center;">
                  ${infoHtml}
                </p>

              </td>
            </tr>
          </table>

          <!-- Footer inside card -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" style="background:#f8f9fb;border-top:1px solid #e8eaed;padding:18px 40px;">
                <p style="margin:0;font-size:12px;color:#9aa3ae;line-height:1.5;">
                  ${footerText}
                </p>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- Below-card footer -->
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-size:12px;color:#9aa3ae;">
              TEC &middot; Frederiksberg &middot; Denmark
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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

  const roleLabel = role === "admin" ? "Administrator" : "Instruktør"

  await resend.emails.send({
    from: FROM,
    to,
    subject: "You've been invited to TEC Info Board",
    html: emailLayout({
      headerText: "You've been invited",
      bodyText: `Click the button below to set up your account as a <strong>${roleLabel}</strong> on TEC Info Board.<br/>This invitation expires in 7 days.`,
      linkText: "Accept Invitation",
      linkHref: link,
      primaryColor: "#10b981",
      infoText: `Confirming this request will securely create your account using ${to}`,
      highlightEmail: to,
      footerText: "If you didn't expect this invitation, you can safely ignore this email.",
    }),
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
    html: emailLayout({
      headerText: "Reset your password",
      bodyText: `Click the button below to reset your password.<br/>This link expires in 1 hour.`,
      linkText: "Reset Password",
      linkHref: url,
      primaryColor: "#6366f1",
      infoText: `This request was made for ${to}`,
      highlightEmail: to,
      footerText: "If you didn't request a password reset, you can safely ignore this email.",
    }),
  })
}
