/**
 * Security Email Alerts Service
 * Sends notifications for suspicious login activity, account lockouts, and security events
 */

import { db } from "@/db"
import * as schema from "@/db/schema"
import { sendEmail } from "@/lib/email"

interface SuspiciousLoginEmailParams {
  userEmail: string
  userName?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  reason: "new_device" | "repeated_failures" | "unusual_location"
  actionUrl: string
}

interface AccountLockoutEmailParams {
  userEmail: string
  userName?: string
  lockedUntil: Date
  ipAddress: string
  attemptCount: number
  supportEmail: string
}

interface LoginSuccessFromNewDeviceParams {
  userEmail: string
  userName?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  approvalUrl: string
}

/**
 * Parse user agent to extract device/browser info
 */
function parseUserAgent(userAgent: string): string {
  try {
    // Simple parsing - in production, use a library like 'ua-parser-js'
    if (userAgent.includes("Chrome")) return "Chrome browser"
    if (userAgent.includes("Firefox")) return "Firefox browser"
    if (userAgent.includes("Safari")) return "Safari browser"
    if (userAgent.includes("Mobile")) return "Mobile device"
    if (userAgent.includes("Windows")) return "Windows device"
    if (userAgent.includes("Mac")) return "Mac device"
    if (userAgent.includes("Linux")) return "Linux device"
    return "Unknown device"
  } catch {
    return "Unknown device"
  }
}

/**
 * Send suspicious login alert email
 */
export async function sendSuspiciousLoginAlert(
  params: SuspiciousLoginEmailParams
) {
  const {
    userEmail,
    userName,
    ipAddress,
    userAgent,
    timestamp,
    reason,
    actionUrl,
  } = params

  const deviceInfo = parseUserAgent(userAgent)
  const timeStr = timestamp.toLocaleString()

  let reasonText = ""
  switch (reason) {
    case "new_device":
      reasonText = `A login attempt was made from a new device (${deviceInfo})`
      break
    case "repeated_failures":
      reasonText =
        "Multiple failed login attempts were detected on your account"
      break
    case "unusual_location":
      reasonText = `A login was detected from a new location (IP: ${ipAddress})`
      break
  }

  const subject = "🔒 Security Alert: Unusual Login Activity"

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="border-left: 4px solid #ef4444; padding: 20px; background: #fef2f2;">
        <h2 style="color: #991b1b; margin-top: 0;">Security Alert</h2>
        <p style="color: #7f1d1d; font-size: 16px;">Hi ${userName || "there"},</p>
        
        <p style="color: #7f1d1d; margin: 20px 0;">
          <strong>${reasonText}</strong> at ${timeStr}.
        </p>

        <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceInfo}</p>
          <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${timeStr}</p>
        </div>

        <p style="color: #7f1d1d; margin: 20px 0;">
          If this was you, you can ignore this email. If you don't recognize this activity, 
          <strong>please change your password immediately</strong> and click the button below.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Secure Your Account
          </a>
        </div>

        <p style="color: #7f1d1d; font-size: 12px; margin-top: 30px;">
          If you did not initiate this login attempt, please secure your account immediately. 
          Our support team is here to help if you need assistance.
        </p>
      </div>

      <div style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
        <p>This is an automated security notification. Please do not reply to this email.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: userEmail,
    subject,
    html: htmlContent,
  })
}

/**
 * Send account locked notification
 */
export async function sendAccountLockedAlert(
  params: AccountLockoutEmailParams
) {
  const {
    userEmail,
    userName,
    lockedUntil,
    ipAddress,
    attemptCount,
    supportEmail,
  } = params

  const unlockTime = lockedUntil.toLocaleString()

  const subject = "🔐 Your Account Has Been Temporarily Locked"

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="border-left: 4px solid #ca8a04; padding: 20px; background: #fef3c7;">
        <h2 style="color: #92400e; margin-top: 0;">Account Locked</h2>
        <p style="color: #92400e; font-size: 16px;">Hi ${userName || "there"},</p>
        
        <p style="color: #92400e; margin: 20px 0;">
          Your account has been temporarily locked for security reasons after <strong>${attemptCount} failed login attempts</strong>.
        </p>

        <div style="background: #fed7aa; border: 1px solid #fdba74; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Locked Until:</strong> ${unlockTime}</p>
          <p style="margin: 5px 0;"><strong>Failed Attempts From IP:</strong> ${ipAddress}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> Multiple failed login attempts detected</p>
        </div>

        <p style="color: #92400e; margin: 20px 0;">
          Your account will automatically unlock after the lockout period expires. 
          You can then try logging in again with your correct password.
        </p>

        <h3 style="color: #92400e; margin-top: 30px;">What You Should Do:</h3>
        <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
          <li>Make sure you use the correct password when the lock expires</li>
          <li>If you forgot your password, use the password reset option</li>
          <li>If you didn't attempt these logins, change your password immediately</li>
        </ul>

        <p style="color: #92400e; margin: 20px 0;">
          If you need immediate assistance, please contact our support team: <strong>${supportEmail}</strong>
        </p>
      </div>

      <div style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
        <p>This is an automated security notification. Please do not reply to this email.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: userEmail,
    subject,
    html: htmlContent,
  })
}

/**
 * Send "new device login" notification for approval
 */
export async function sendNewDeviceLoginNotification(
  params: LoginSuccessFromNewDeviceParams
) {
  const {
    userEmail,
    userName,
    ipAddress,
    userAgent,
    timestamp,
    approvalUrl,
  } = params

  const deviceInfo = parseUserAgent(userAgent)
  const timeStr = timestamp.toLocaleString()

  const subject = "✅ New Device Login - Review Activity"

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="border-left: 4px solid #16a34a; padding: 20px; background: #f0fdf4;">
        <h2 style="color: #166534; margin-top: 0;">New Device Login</h2>
        <p style="color: #166534; font-size: 16px;">Hi ${userName || "there"},</p>
        
        <p style="color: #166534; margin: 20px 0;">
          A successful login from a <strong>new device</strong> has been detected on your account.
        </p>

        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceInfo}</p>
          <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${timeStr}</p>
        </div>

        <p style="color: #166534; margin: 20px 0;">
          If this was you, no action is needed. If you don't recognize this device, 
          please review your account activity immediately.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" 
             style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Review Account Activity
          </a>
        </div>

        <p style="color: #166534; font-size: 12px; margin-top: 30px;">
          To learn more about your account security, visit your security settings.
        </p>
      </div>

      <div style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
        <p>This is an automated security notification. Please do not reply to this email.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: userEmail,
    subject,
    html: htmlContent,
  })
}

/**
 * Queue email notification with retry logic
 */
export async function queueSecurityEmail(
  type:
    | "suspicious_login"
    | "account_locked"
    | "new_device_login"
    | "password_changed",
  payload: Record<string, any>,
  retryCount = 0
) {
  const MAX_RETRIES = 3

  try {
    switch (type) {
      case "suspicious_login":
        await sendSuspiciousLoginAlert(
          payload as SuspiciousLoginEmailParams
        )
        break
      case "account_locked":
        await sendAccountLockedAlert(
          payload as AccountLockoutEmailParams
        )
        break
      case "new_device_login":
        await sendNewDeviceLoginNotification(
          payload as LoginSuccessFromNewDeviceParams
        )
        break
    }

    // Log successful email send
    console.log(`[Security Email] ${type} sent successfully to ${payload.userEmail}`)
  } catch (error) {
    console.error(`[Security Email Error] Failed to send ${type}:`, error)

    if (retryCount < MAX_RETRIES) {
      // Retry with exponential backoff
      const delayMs = Math.pow(2, retryCount) * 1000
      setTimeout(
        () => queueSecurityEmail(type, payload, retryCount + 1),
        delayMs
      )
    } else {
      console.error(
        `[Security Email Fatal] Max retries exceeded for ${type} to ${payload.userEmail}`
      )
    }
  }
}
