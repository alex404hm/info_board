"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  LogOut,
  KeyRound,
  Camera,
  X,
} from "lucide-react"
import Image from "next/image"
import { authClient, useSession } from "@/lib/auth-client"
import Settings2FA from "@/components/admin/Settings2FA"
import { cn } from "@/lib/utils"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"

// ── helpers ───────────────────────────────────────────────────────────────────

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

function getDeviceIcon(ua: string | null | undefined) {
  if (!ua) return Globe
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return Smartphone
  return Monitor
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type SessionItem = {
  id: string
  token: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string | Date
  expiresAt: string | Date
  current?: boolean
}

// ── shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("admin-panel p-6", className)}>{children}</div>
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
  label = "Gem ændringer",
  savedLabel = "Gemt",
}: {
  onClick: () => void
  loading: boolean
  saved: boolean
  disabled?: boolean
  label?: string
  savedLabel?: string
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
        <><CheckCircle className="h-4 w-4" /> {savedLabel}</>
      ) : loading ? (
        <><RefreshCw className="h-4 w-4 animate-spin" /> Gemmer…</>
      ) : (
        <><Save className="h-4 w-4" /> {label}</>
      )}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
      <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
      <p className="text-sm text-red-400">{message}</p>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: sessionData } = useSession()
  const currentUser = sessionData?.user

  // ── avatar ──
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview,  setAvatarPreview]  = useState<string | null>(null)
  const [avatarFile,     setAvatarFile]     = useState<File | null>(null)
  const [avatarLoading,  setAvatarLoading]  = useState(false)
  const [avatarSaved,    setAvatarSaved]    = useState(false)
  const [avatarError,    setAvatarError]    = useState("")

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setAvatarError("Billedet må max være 4 MB."); return }
    setAvatarError("")
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleAvatarCancel() {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleUploadAvatar() {
    if (!avatarFile) return
    setAvatarLoading(true)
    setAvatarError("")
    try {
      const fd = new FormData()
      fd.append("avatar", avatarFile)
      const res = await fetch("/api/admin/avatar", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) { setAvatarError(json.error ?? "Upload fejlede."); return }
      const { error } = await authClient.updateUser({ image: json.url })
      if (error) { setAvatarError(error.message ?? "Kunne ikke opdatere profilbillede."); return }
      setAvatarSaved(true)
      setAvatarFile(null)
      setAvatarPreview(null)
      setTimeout(() => setAvatarSaved(false), 3000)
    } finally {
      setAvatarLoading(false)
    }
  }

  const currentAvatar = avatarPreview ?? currentUser?.image ?? null
  const initials = (currentUser?.name ?? currentUser?.email ?? "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

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
      setProfileError(error.message ?? "Kunne ikke opdatere profil.")
    } else {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    }
    setProfileLoading(false)
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

  const pwHints = [
    { ok: newPw.length >= 10, label: "Mindst 10 tegn" },
    { ok: /[A-Z]/.test(newPw), label: "Ét stort bogstav" },
    { ok: /[0-9]/.test(newPw), label: "Ét tal" },
    { ok: confirmPw === newPw && confirmPw.length > 0, label: "Adgangskoder stemmer overens" },
  ]
  const pwStrong = pwHints.every((h) => h.ok)

  async function handleSavePassword() {
    setPwError("")
    if (newPw !== confirmPw) { setPwError("Adgangskoderne stemmer ikke overens."); return }
    if (newPw.length < 10) { setPwError("Ny adgangskode skal være mindst 10 tegn."); return }
    setPwLoading(true)
    const { error } = await authClient.changePassword({ currentPassword: currentPw, newPassword: newPw, revokeOtherSessions: false })
    if (error) {
      setPwError(error.message ?? "Kunne ikke ændre adgangskode.")
    } else {
      setPwSaved(true)
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
      setTimeout(() => setPwSaved(false), 3000)
    }
    setPwLoading(false)
  }

  // ── sessions ──
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState("")
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    setSessionsError("")
    try {
      const { data, error } = await authClient.listSessions()
      if (error) {
        setSessionsError("Kunne ikke hente sessioner.")
      } else if (Array.isArray(data)) {
        const currentToken = sessionData?.session?.token
        setSessions(
          (data as SessionItem[]).map((s) => ({
            ...s,
            current: s.token === currentToken,
          })).sort((a, b) => {
            if (a.current) return -1
            if (b.current) return 1
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
        )
      }
    } catch {
      setSessionsError("Kunne ikke hente sessioner.")
    }
    setSessionsLoading(false)
  }, [sessionData?.session?.token])

  useEffect(() => { void loadSessions() }, [loadSessions])

  async function handleRevoke(token: string) {
    setRevoking(token)
    await authClient.revokeSession({ token })
    await loadSessions()
    setRevoking(null)
  }

  async function handleRevokeAll() {
    setRevoking("__all__")
    await authClient.revokeOtherSessions()
    await loadSessions()
    setRevoking(null)
  }

  // ── unsaved guard ──
  const profileDirty = name.trim() !== (currentUser?.name ?? "").trim()
  const passwordDirty = Boolean(currentPw || newPw || confirmPw)
  const hasUnsavedChanges = profileDirty || passwordDirty

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Du har ikke-gemte ændringer",
    description: `Du har ikke-gemte ændringer. Hvis du forlader siden nu, går ændringerne tabt.`,
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

  const otherSessions = sessions.filter((s) => !s.current)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Min konto</h1>
        <p className="mt-1 text-sm text-muted">
          Administrer dine profiloplysninger, adgangskode og aktive sessioner.
        </p>
      </div>

      {/* ── Profile ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          icon={User}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          title="Profil"
          subtitle="Opdater dit visningsnavn"
        />

        {/* Avatar */}
        <div className="mb-6 flex items-end gap-5">
          <div className="relative shrink-0">
            {/* Avatar circle */}
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border/60 bg-muted/40 flex items-center justify-center">
              {currentAvatar ? (
                <Image
                  src={currentAvatar}
                  alt="Profilbillede"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized={currentAvatar.startsWith("blob:")}
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{initials}</span>
              )}
            </div>
            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-white shadow transition-transform hover:scale-110"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            {avatarFile ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleUploadAvatar}
                  disabled={avatarLoading}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    avatarSaved
                      ? "bg-emerald-600/20 border border-emerald-600/40 text-emerald-400"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white",
                    avatarLoading && "cursor-not-allowed opacity-60",
                  )}
                >
                  {avatarLoading
                    ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploader…</>
                    : <><Save className="h-3.5 w-3.5" /> Gem billede</>}
                </button>
                <button
                  onClick={handleAvatarCancel}
                  className="flex items-center gap-1 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Annuller
                </button>
                <span className="text-xs text-muted-foreground truncate max-w-[160px]">{avatarFile.name}</span>
              </div>
            ) : avatarSaved ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4" /> Profilbillede opdateret
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Skift profilbillede
              </button>
            )}
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP eller GIF · Max 4 MB</p>
            {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <Field label="Visningsnavn">
            <TextInput
              value={name}
              onChange={setName}
              placeholder="Dit navn"
            />
          </Field>

          <Field label="E-mailadresse">
            <TextInput
              value={currentUser?.email ?? ""}
              disabled
              right={<Mail className="h-4 w-4 text-muted" />}
            />
            <p className="mt-1.5 text-xs text-muted">
              E-mail kan kun ændres af en administrator.
            </p>
          </Field>

          {profileError && <ErrorBanner message={profileError} />}

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
          icon={KeyRound}
          iconColor="text-violet-400"
          iconBg="bg-violet-400/10"
          title="Skift adgangskode"
          subtitle="Du skal kende din nuværende adgangskode for at ændre den"
        />

        <div className="space-y-4 max-w-sm">
          <Field label="Nuværende adgangskode">
            <TextInput
              value={currentPw}
              onChange={setCurrentPw}
              type={showCurrent ? "text" : "password"}
              placeholder="••••••••••"
              right={eyeBtn(showCurrent, () => setShowCurrent((v) => !v))}
            />
          </Field>

          <div className="border-t border-border/30 pt-4 space-y-4">
            <Field label="Ny adgangskode">
              <TextInput
                value={newPw}
                onChange={setNewPw}
                type={showNew ? "text" : "password"}
                placeholder="Min. 10 tegn"
                right={eyeBtn(showNew, () => setShowNew((v) => !v))}
              />
            </Field>
            <Field label="Bekræft ny adgangskode">
              <TextInput
                value={confirmPw}
                onChange={setConfirmPw}
                type={showNew ? "text" : "password"}
                placeholder="Gentag ny adgangskode"
              />
            </Field>
          </div>

          {/* Strength hints */}
          {newPw && (
            <ul className="space-y-1.5 text-xs">
              {pwHints.map((hint) => (
                <li key={hint.label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0 transition-colors",
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

          {pwError && <ErrorBanner message={pwError} />}

          {pwSaved && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-400">Adgangskode er ændret.</p>
            </div>
          )}

          <SaveBtn
            onClick={handleSavePassword}
            loading={pwLoading}
            saved={false}
            disabled={!currentPw || !newPw || !confirmPw || !pwStrong}
            label="Skift adgangskode"
          />
        </div>
      </Card>

      {/* ── Active Sessions ──────────────────────────────────────────── */}
      <Card>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Aktive sessioner</h2>
              <p className="text-sm text-muted">Alle enheder og browsers du er logget ind på.</p>
            </div>
          </div>
          {otherSessions.length > 0 && (
            <button
              onClick={handleRevokeAll}
              disabled={revoking === "__all__"}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all",
                "border-red-500/30 text-red-400 hover:bg-red-500/10",
                revoking === "__all__" && "cursor-not-allowed opacity-50",
              )}
            >
              {revoking === "__all__" ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Log ud alle andre
            </button>
          )}
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Henter sessioner…
          </div>
        ) : sessionsError ? (
          <ErrorBanner message={sessionsError} />
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheck className="h-8 w-8 text-muted mb-2 opacity-40" />
            <p className="text-sm text-muted">Ingen aktive sessioner fundet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const { browser, os } = parseBrowser(s.userAgent)
              const DeviceIcon = getDeviceIcon(s.userAgent)
              const isRevoking = revoking === s.token
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 transition-all",
                    s.current
                      ? "border-blue-500/30 bg-blue-500/5"
                      : "border-border/60 bg-card/50",
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    s.current ? "bg-blue-500/15" : "bg-muted/30",
                  )}>
                    <DeviceIcon className={cn("h-4 w-4", s.current ? "text-blue-400" : "text-muted")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {browser} · {os}
                      </span>
                      {s.current && (
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/25">
                          Denne enhed
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 flex-wrap">
                      {s.ipAddress && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {s.ipAddress}
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        Logget ind {fmtDate(s.createdAt)}
                      </span>
                      <span className="text-xs text-muted">
                        Udløber {fmtDate(s.expiresAt)}
                      </span>
                    </div>
                  </div>

                  {!s.current && (
                    <button
                      onClick={() => handleRevoke(s.token)}
                      disabled={isRevoking}
                      title="Log ud denne session"
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                        "border-red-500/25 text-red-400 hover:bg-red-500/10",
                        isRevoking && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {isRevoking
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── 2FA Setup ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          icon={Lock}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          title="To-faktor-godkendelse"
          subtitle="Beskyt din konto med et ekstra lag sikkerhed"
        />
        <Settings2FA />
      </Card>
    </div>
  )
}
