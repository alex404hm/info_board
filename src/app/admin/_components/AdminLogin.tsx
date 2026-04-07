"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, CheckCircle, Mail, Lock, ShieldAlert } from "lucide-react"
import Image from "next/image"

import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

function AdaptiveLogo() {
  // Default false = black logo (safe for light backgrounds; admin login is always light)
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const update = () => {
      const html = document.documentElement
      // Explicit theme class takes priority
      if (html.classList.contains("dark")) { setIsDark(true); return }
      if (html.classList.contains("light")) { setIsDark(false); return }
      // Fall back to system preference
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }

    update()

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", update)

    // Watch for class changes on <html> (e.g. theme script applies dark class)
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => {
      media.removeEventListener("change", update)
      observer.disconnect()
    }
  }, [])

  return (
    <Image
      src="/logo.svg"
      alt="Logo"
      width={96}
      height={33}
      priority
      className={isDark ? "brightness-0 invert" : "brightness-0"}
    />
  )
}

/* ─── Shared page shell ──────────────────────────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

/* ─── Countdown display ──────────────────────────────────────────────────── */
function Countdown({ unlockAt }: { unlockAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, unlockAt - Date.now()))

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, unlockAt - Date.now())
      setRemaining(left)
      if (left === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [unlockAt])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <span className="font-mono font-semibold">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AdminLogin() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-sent">("login")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Rate-limiting state
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [unlockCountdown, setUnlockCountdown] = useState(0)

  // Progressive delay between attempts (ms): 0, 2s, 4s, 8s…
  const attemptDelay = useRef(0)

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil

  // Unlock when countdown expires
  useEffect(() => {
    if (!lockoutUntil) return
    const timeout = setTimeout(() => {
      setLockoutUntil(null)
      setAttempts(0)
      attemptDelay.current = 0
      setError("")
    }, Math.max(0, lockoutUntil - Date.now()))
    return () => clearTimeout(timeout)
  }, [lockoutUntil])

  // Keep countdown value in sync (so the button label updates)
  useEffect(() => {
    if (!lockoutUntil) return
    const interval = setInterval(() => {
      setUnlockCountdown(Math.max(0, lockoutUntil - Date.now()))
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (isLockedOut) return

    setError("")
    setLoading(true)

    // Progressive delay
    if (attemptDelay.current > 0) {
      await new Promise((r) => setTimeout(r, attemptDelay.current))
    }

    try {
      await signIn.email(
        { email: email.trim().toLowerCase(), password },
        {
          onSuccess: () => {
            router.push("/admin/dashboard")
            router.refresh()
          },
          onError: (ctx) => {
            const newAttempts = attempts + 1
            setAttempts(newAttempts)
            setPassword("")

            // Double delay each time: 0 → 2s → 4s → 8s → 16s
            attemptDelay.current = attemptDelay.current === 0 ? 2000 : attemptDelay.current * 2

            if (ctx.error.status === 429 || newAttempts >= MAX_ATTEMPTS) {
              setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS)
              setError("")
            } else {
              const left = MAX_ATTEMPTS - newAttempts
              setError(
                left === 1
                  ? "Forkert e-mail eller adgangskode. 1 forsøg tilbage."
                  : `Forkert e-mail eller adgangskode. ${left} forsøg tilbage.`,
              )
            }
          },
        },
      )
    } catch {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPassword("")
      attemptDelay.current = attemptDelay.current === 0 ? 2000 : attemptDelay.current * 2

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS)
      } else {
        setError(`Forkert e-mail eller adgangskode. ${MAX_ATTEMPTS - newAttempts} forsøg tilbage.`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotError("")
    setForgotLoading(true)
    const { error } = await authClient.requestPasswordReset({
      email: forgotEmail.trim().toLowerCase(),
      redirectTo: "/reset-password",
    })
    if (error) {
      setForgotError("Kunne ikke sende nulstillingsmail. Prøv igen.")
    } else {
      setMode("forgot-sent")
    }
    setForgotLoading(false)
  }

  /* ── forgot-sent ── */
  if (mode === "forgot-sent") {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-6 text-center">
          <AdaptiveLogo />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Tjek din indbakke</h1>
            <p className="text-sm text-muted-foreground">
              Hvis <span className="font-medium text-foreground">{forgotEmail}</span> har en konto,
              har vi sendt et nulstillingslink. Det udløber om 1 time.
            </p>
          </div>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => { setMode("login"); setForgotEmail("") }}
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage til log ind
          </Button>
        </div>
      </Layout>
    )
  }

  /* ── forgot password ── */
  if (mode === "forgot") {
    return (
      <Layout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <AdaptiveLogo />
            <h1 className="text-xl font-bold">Glemt adgangskode?</h1>
            <p className="text-sm text-muted-foreground">
              Indtast din e-mail, så sender vi dig et nulstillingslink.
            </p>
          </div>

          <form onSubmit={handleForgot} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@tec.dk"
                  required
                  autoFocus
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={forgotLoading}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {forgotError && (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Kunne ikke sende nulstillingsmail. Prøv igen.
              </p>
            )}

            <Button
              type="submit"
              disabled={forgotLoading}
              size="lg"
              className="w-full"
            >
              {forgotLoading ? "Sender…" : "Send nulstillingslink"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => setMode("login")}
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbage til log ind
            </Button>
          </form>
        </div>
      </Layout>
    )
  }

  /* ── sign in ── */
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6">
            {/* Logo + heading */}
            <div className="flex flex-col items-center gap-2 text-center">
              <AdaptiveLogo />
              <h1 className="text-xl font-bold">Velkommen tilbage</h1>
              <p className="text-sm text-muted-foreground">
                Log ind for at tilgå administrationspanelet.
              </p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="instruktor@tec.dk"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isLockedOut}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Adgangskode</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => { setMode("forgot"); setForgotEmail(email) }}
                >
                  Glemt adgangskode?
                </Button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || isLockedOut}
                  className="h-11 pl-9 pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full w-11 rounded-l-none text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Lockout banner */}
            {isLockedOut && lockoutUntil && (
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Kontoen er midlertidigt låst</p>
                  <p className="text-xs text-destructive/80">
                    For mange fejlede forsøg. Prøv igen om{" "}
                    <Countdown unlockAt={lockoutUntil} />.
                  </p>
                </div>
              </div>
            )}

            {/* Per-attempt error */}
            {!isLockedOut && error && (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || isLockedOut}
              size="lg"
              className="w-full"
            >
              {loading
                ? "Logger ind…"
                : isLockedOut && lockoutUntil
                  ? `Låst — ${Math.ceil(unlockCountdown / 60000)} min tilbage`
                  : "Log ind"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
