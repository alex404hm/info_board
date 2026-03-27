"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, CheckCircle, Mail, Lock } from "lucide-react"
import Image from "next/image"

import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/* ─── Shared page shell ──────────────────────────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
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
  const [attempts, setAttempts] = useState(0)
  const tooManyAttempts = attempts >= 5

  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (tooManyAttempts) return
    setError("")
    setLoading(true)
    try {
      await signIn.email(
        { email: email.trim().toLowerCase(), password },
        {
          onSuccess: () => router.refresh(),
          onError: (ctx) => {
            setAttempts((n) => n + 1)
            setError(
              ctx.error.status === 429
                ? "Too many attempts. Please wait a moment."
                : "Invalid email or password.",
            )
          },
        },
      )
    } catch {
      setAttempts((n) => n + 1)
      setError("Invalid email or password.")
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
      setForgotError("Could not send reset email. Please try again.")
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
          <Image src="/logo.svg" alt="Logo" width={96} height={33} priority className="brightness-0 invert" />
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
            <Image src="/logo.svg" alt="Logo" width={96} height={33} priority className="brightness-0 invert" />
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

            <button
              type="submit"
              disabled={forgotLoading}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9"
            >
              {forgotLoading ? "Sender…" : "Send nulstillingslink"}
            </button>

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
              <Image
                src="/logo.svg"
                alt="Logo"
                width={96}
                height={33}
                priority
                className="brightness-0 invert"
              />
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
                  disabled={loading || tooManyAttempts}
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
                  disabled={loading || tooManyAttempts}
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

            {/* Error */}
            {(error || tooManyAttempts) && (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {tooManyAttempts
                  ? "For mange fejlede forsøg. Genindlæs siden for at prøve igen."
                  : error === "Invalid email or password."
                    ? "Forkert e-mail eller adgangskode."
                    : error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || tooManyAttempts}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9"
            >
              {loading ? "Logger ind…" : "Log ind"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
