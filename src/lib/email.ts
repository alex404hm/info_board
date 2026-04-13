import nodemailer from "nodemailer"

const hasSmtpCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)

const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE !== "false",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

const FROM = `TEC Info Board <${process.env.SMTP_USER}>`
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

function requireTransporter() {
  if (!transporter) {
    throw new Error("SMTP_USER and SMTP_PASS environment variables are required")
  }
  return transporter
}


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
              TEC &middot; Hvidovre &middot; Denmark
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
  const mailer = requireTransporter()
  const link = `${BASE_URL}/invite/${token}`

  const roleLabel = role === "admin" ? "Administrator" : "Instruktør"

  await mailer.sendMail({
    from: FROM,
    to,
    subject: "Du er blevet inviteret til TEC Info Board",
    html: emailLayout({
      headerText: "Du er inviteret",
      bodyText: `Klik på knappen nedenfor for at oprette din konto som <strong>${roleLabel}</strong> på TEC Info Board.<br/>Denne invitation udløber om 7 dage.`,
      linkText: "Accepter invitation",
      linkHref: link,
      primaryColor: "#10b981",
      infoText: `Bekræftelse af denne anmodning vil oprette din konto sikkert med ${to}`,
      highlightEmail: to,
      footerText: "Hvis du ikke forventede denne invitation, kan du roligt ignorere denne e-mail.",
    }),
  })

  return link
}

// ── reset password email ───────────────────────────────────────────────────────

export async function sendResetPasswordEmail(to: string, url: string): Promise<void> {
  const mailer = requireTransporter()

  await mailer.sendMail({
    from: FROM,
    to,
    subject: "Nulstil din TEC Info Board adgangskode",
    html: emailLayout({
      headerText: "Nulstil din adgangskode",
      bodyText: `Klik på knappen nedenfor for at nulstille din adgangskode.<br/>Dette link udløber om 1 time.`,
      linkText: "Nulstil adgangskode",
      linkHref: url,
      primaryColor: "#6366f1",
      infoText: `Denne anmodning blev foretaget for ${to}`,
      highlightEmail: to,
      footerText: "Hvis du ikke har anmodet om en adgangskoderemsætning, kan du roligt ignorere denne e-mail.",
    }),
  })
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  const mailer = requireTransporter()
  return mailer.sendMail({
    from: FROM,
    to,
    subject,
    html,
    text,
  })
}