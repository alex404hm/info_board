"use client"

import { useState, useEffect, useCallback } from "react"
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  RefreshCw,
  Monitor,
  Globe,
  Smartphone,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Send,
} from "lucide-react"
import { authClient, useSession } from "@/lib/auth-client"
import Settings2FA from "@/components/admin/Settings2FA"
import { cn } from "@/lib/utils"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"

// ── helpers ──────────────────────────────────────────────────────────────────

function parseBrowser(ua: string | null | undefined) {
  if (!ua) return { browser: "Unknown browser", os: "Unknown OS" }
  const browser = ua.includes("Edg")
    ? "Edge"
    : ua.includes("Chrome")
    ? "Chrome"
    : ua.includes("Firefox")
    ? "Firefox"
    : ua.includes("Safari")
    ? "Safari"
    : "Browser"
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS")
    ? "macOS"
    : ua.includes("Linux")
    ? "Linux"
    : ua.includes("Android")
    ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad")
    ? "iOS"
    : "Unknown OS"
  return { browser, os }
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type Session = {
  id: string
  token: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string | Date
  expiresAt: string | Date
  current?: boolean
}

// ── sub-components ────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("admin-panel p-6", className)}>
      {children}
    </div>
  )
}

function CardHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
}: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  right,
}: {
  value: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  right?: React.ReactNode
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "admin-input w-full",
          "transition-all focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40",
          disabled && "cursor-not-allowed opacity-50",
          right && "pr-10",
        )}
      />
      {right && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center">
          {right}
        </div>
      )}
    </div>
  )
}

function SaveBtn({
  onClick,
  loading,
  saved,
  disabled,
}: {
  onClick: () => void
  loading: boolean
  saved: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "mt-4 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
        saved
          ? "bg-emerald-600/20 border border-emerald-600/40 text-emerald-400"
          : "bg-emerald-600 hover:bg-emerald-500 text-white",
        (loading || disabled) && "cursor-not-allowed opacity-50",
      )}
    >
      {saved ? (
        <><CheckCircle className="h-4 w-4" /> Saved</>
      ) : loading ? (
        <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
      ) : (
        <><Save className="h-4 w-4" /> Save changes</>
      )}
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: sessionData } = useSession()
  const currentUser = sessionData?.user

  // ── profile ──
  const [name, setName] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    if (currentUser?.name) setName(currentUser.name)
  }, [currentUser?.name])

  async function handleSaveProfile() {
    setProfileLoading(true)
    setProfileError("")
    setProfileSaved(false)
    const { error } = await authClient.updateUser({ name })
    if (error) {
      setProfileError(error.message ?? "Failed to update profile.")
    } else {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    }
    setProfileLoading(false)
  }

  // ── reset via email ──
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState("")

  async function handleSendReset() {
    if (!currentUser?.email) return
    setSendingReset(true)
    setResetError("")
    setResetSent(false)
    const { error } = await authClient.requestPasswordReset({
      email: currentUser.email,
      redirectTo: "/reset-password",
    })
    if (error) {
      setResetError("Could not send reset email. Please try again.")
    } else {
      setResetSent(true)
      setTimeout(() => setResetSent(false), 5000)
    }
    setSendingReset(false)
  }

  // ── password ──
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState("")

  async function handleSavePassword() {
    setPwError("")
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return }
    if (newPw.length < 10) { setPwError("New password must be at least 10 characters."); return }
    setPwLoading(true)
    const { error } = await authClient.changePassword({ currentPassword: currentPw, newPassword: newPw })
    if (error) {
      setPwError(error.message ?? "Failed to change password.")
    } else {
      setPwSaved(true)
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
      setTimeout(() => setPwSaved(false), 2500)
    }
    setPwLoading(false)
  }

  // ── sessions ──
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const { data } = await authClient.listSessions()
      if (Array.isArray(data)) {
        const currentToken = sessionData?.session?.token
        setSessions(
          (data as Session[]).map((s) => ({
            ...s,
            current: s.token === currentToken,
          }))
        )
      }
    } catch { /* ignore */ }
    setSessionsLoading(false)
  }, [sessionData?.session?.token])

  useEffect(() => { void loadSessions() }, [loadSessions])

  async function handleRevoke(token: string) {
    setRevoking(token)
    await authClient.revokeSession({ token })
    await loadSessions()
    setRevoking(null)
  }

  const profileDirty = name.trim() !== (currentUser?.name ?? "").trim()
  const passwordDirty = Boolean(currentPw || newPw || confirmPw)
  const hasUnsavedChanges = profileDirty || passwordDirty

  const unsavedSections = [
    profileDirty ? "profiloplysninger" : null,
    passwordDirty ? "adgangskodefelter" : null,
  ].filter(Boolean).join(" og ")

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Du har ikke-gemte ændringer",
    description: `Du har ikke-gemte ændringer i ${unsavedSections}. Hvis du forlader siden nu, går ændringerne tabt.`,
    confirmText: "Forlad uden at gemme",
    cancelText: "Bliv og gem",
  })

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={toggle}
      className="flex h-6 w-6 items-center justify-center text-muted hover:text-foreground transition-colors"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Account</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your personal information, password, and active sessions.
        </p>
      </div>

      {/* ── Profile ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          icon={User}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          title="Profile"
          subtitle="Update your display name"
        />

        <div className="space-y-4 max-w-md">
          <Field label="Display name">
            <TextInput
              value={name}
              onChange={setName}
              placeholder="Your name"
            />
          </Field>

          <Field label="Email address">
            <TextInput
              value={currentUser?.email ?? ""}
              disabled
              right={<Mail className="h-4 w-4 text-muted" />}
            />
            <p className="mt-1.5 text-xs text-muted">
              Email changes require account verification — contact your administrator.
            </p>
          </Field>

          {profileError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{profileError}</p>
            </div>
          )}

          <SaveBtn
            onClick={handleSaveProfile}
            loading={profileLoading}
            saved={profileSaved}
            disabled={!name.trim() || name === currentUser?.name}
          />
        </div>
      </Card>

      {/* ── Password ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          icon={Lock}
          iconColor="text-violet-400"
          iconBg="bg-violet-400/10"
          title="Password"
          subtitle="Change your login password"
        />

        <div className="space-y-4 max-w-sm">
          <Field label="Current password">
            <TextInput
              value={currentPw}
              onChange={setCurrentPw}
              type={showCurrent ? "text" : "password"}
              placeholder="••••••••••"
              right={eyeBtn(showCurrent, () => setShowCurrent((v) => !v))}
            />
          </Field>
          <Field label="New password">
            <TextInput
              value={newPw}
              onChange={setNewPw}
              type={showNew ? "text" : "password"}
              placeholder="Min. 10 characters"
              right={eyeBtn(showNew, () => setShowNew((v) => !v))}
            />
          </Field>
          <Field label="Confirm new password">
            <TextInput
              value={confirmPw}
              onChange={setConfirmPw}
              type={showNew ? "text" : "password"}
              placeholder="Repeat new password"
            />
          </Field>

          {/* Password strength hints */}
          {newPw && (
            <ul className="space-y-1 text-xs">
              {[
                { ok: newPw.length >= 10, label: "At least 10 characters" },
                { ok: /[A-Z]/.test(newPw), label: "One uppercase letter" },
                { ok: /[0-9]/.test(newPw), label: "One number" },
                { ok: confirmPw === newPw && confirmPw.length > 0, label: "Passwords match" },
              ].map((hint) => (
                <li key={hint.label} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      hint.ok ? "bg-emerald-400" : "bg-muted",
                    )}
                  />
                  <span className={hint.ok ? "text-foreground" : "text-muted"}>
                    {hint.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {pwError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{pwError}</p>
            </div>
          )}

          <SaveBtn
            onClick={handleSavePassword}
            loading={pwLoading}
            saved={pwSaved}
            disabled={!currentPw || !newPw || !confirmPw}
          />

          <div className="mt-6 pt-5 border-t border-border/40">
            <p className="text-sm text-muted mb-3">
              Forgot your current password? We'll send a reset link to your email.
            </p>
            {resetError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 mb-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{resetError}</p>
              </div>
            )}
            <button
              onClick={handleSendReset}
              disabled={sendingReset || resetSent}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all border",
                resetSent
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  : "bg-transparent border-border/60 text-muted hover:text-foreground hover:border-border",
                (sendingReset || resetSent) && "cursor-not-allowed opacity-60",
              )}
            >
              {resetSent ? (
                <><CheckCircle className="h-4 w-4" /> Reset link sent — check your inbox</>
              ) : sendingReset ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4" /> Send reset link to my email</>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* ── Active Sessions ──────────────────────────────────────────── */}
      <Card>
        <CardHeader
          icon={ShieldCheck}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          title="Aktive sessioner"
          subtitle="Se og administrer dine aktive logins og enheder."
        />
        {/* ...existing session rendering code... */}
      </Card>

      {/* ── 2FA Setup ──────────────────────────────────────────────── */}
      <Card className="mt-8">
        <div className="mb-6">
          <h2 className="font-semibold text-foreground text-xl">Opsætning af 2FA</h2>
          <p className="text-sm text-muted">Beskyt din konto med to-faktor-godkendelse.</p>
        </div>
        <Settings2FA />
      </Card>
    </div>
  )
}
