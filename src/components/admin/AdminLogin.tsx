"use client"

import React, { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowLeft, CheckCircle, Mail, Lock, ShieldAlert, Loader2 } from "lucide-react"
import Image from "next/image"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function AdaptiveLogo() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const update = () => {
      const html = document.documentElement
      if (html.classList.contains("dark")) { setIsDark(true); return }
      if (html.classList.contains("light")) { setIsDark(false); return }
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }
    update()
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", update)
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => { media.removeEventListener("change", update); observer.disconnect() }
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

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

function Countdown({ unlockAt }: { unlockAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, unlockAt - Date.now()))
  useEffect(() => {
    const iv = setInterval(() => {
      const left = Math.max(0, unlockAt - Date.now())
      setRemaining(left)
      if (left === 0) clearInterval(iv)
    }, 1000)
    return () => clearInterval(iv)
  }, [unlockAt])
  const m = Math.floor(remaining / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return <span className="font-mono font-semibold">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
}

export default function AdminLogin() {
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-sent" | "redirecting">("login")

  // Login state
  const [email, setEmail]             = useState("")
  const [password, setPassword]       = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState("")
  const [loading, setLoading]         = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  // IP rate-limit state
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil

  useEffect(() => {
    if (!blockedUntil) return
    const t = setTimeout(() => {
      setBlockedUntil(null)
      setError("")
    }, Math.max(0, blockedUntil - Date.now()))
    return () => clearTimeout(t)
  }, [blockedUntil])

  // Forgot password state
  const [forgotEmail, setForgotEmail]   = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError]   = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (isBlocked) return

    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json().catch(() => null) as {
        success?: boolean
        message?: string
        blockedUntil?: string
        attemptsRemaining?: number
      } | null

      if (res.ok && data?.success) {
        setMode("redirecting")
        window.location.href = "/admin/dashboard"
        return
      }

      setPassword("")

      if (res.status === 429 && data?.blockedUntil) {
        setBlockedUntil(new Date(data.blockedUntil).getTime())
        return
      }

      setAttemptsRemaining(data?.attemptsRemaining ?? null)
      setError(data?.message ?? "Forkert e-mail eller adgangskode.")
    } catch {
      setPassword("")
      setError("Netværksfejl. Prøv igen om et øjeblik.")
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotError("")
    setForgotLoading(true)
    const { error: authError } = await authClient.requestPasswordReset({
      email: forgotEmail.trim().toLowerCase(),
      redirectTo: "/reset-password",
    })
    if (authError) {
      setForgotError("Kunne ikke sende nulstillingsmail. Prøv igen.")
    } else {
      setMode("forgot-sent")
    }
    setForgotLoading(false)
  }

  /* ── redirecting ── */
  if (mode === "redirecting") {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-4 text-center">
          <AdaptiveLogo />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Logger ind…</p>
        </div>
      </Layout>
    )
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
          <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => { setMode("login"); setForgotEmail("") }}>
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
                {forgotError}
              </p>
            )}

            <Button type="submit" disabled={forgotLoading} size="lg" className="w-full">
              {forgotLoading ? "Sender…" : "Send nulstillingslink"}
            </Button>

            <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => setMode("login")}>
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
            <div className="flex flex-col items-center gap-2 text-center">
              <AdaptiveLogo />
              <h1 className="text-xl font-bold">Velkommen tilbage</h1>
              <p className="text-sm text-muted-foreground">
                Log ind for at tilgå administrationspanelet.
              </p>
            </div>

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
                  disabled={loading || isBlocked}
                  className="h-11 pl-9"
                />
              </div>
            </div>

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
                  disabled={loading || isBlocked}
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

            {/* IP rate-limit banner */}
            {isBlocked && blockedUntil && (
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold">For mange forsøg</p>
                  <p className="text-xs text-destructive/80">
                    Prøv igen om <Countdown unlockAt={blockedUntil} />.
                  </p>
                </div>
              </div>
            )}

            {!isBlocked && error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <p>{error}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="mt-1 text-xs font-medium text-destructive/80">
                    {attemptsRemaining === 1
                      ? "1 forsøg tilbage"
                      : `${attemptsRemaining} forsøg tilbage`}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading || isBlocked} size="lg" className="w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Logger ind…</>
              ) : isBlocked && blockedUntil ? (
                "Blokeret — prøv igen om lidt"
              ) : (
                "Log ind"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
