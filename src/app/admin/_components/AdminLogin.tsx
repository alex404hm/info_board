"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, CheckCircle, Mail, Lock } from "lucide-react"

import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/* ─── Shared page shell ──────────────────────────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center p-8 md:p-12"
      style={{
        '--input': 'rgba(255,255,255,0.13)',
        '--ring': 'rgba(95,157,255,0.45)',
        backgroundColor: '#0a0a0a',
      } as React.CSSProperties}
    >
      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-sm">{children}</div>
      </div>
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
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">
              If <span className="font-medium text-foreground">{forgotEmail}</span> has an account,
              we&apos;ve sent a reset link. It expires in 1 hour.
            </p>
          </div>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => { setMode("login"); setForgotEmail("") }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Button>
        </div>
      </Layout>
    )
  }

  /* ── forgot password ── */
  if (mode === "forgot") {
    return (
      <Layout>
        <div className="flex flex-col gap-8">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleForgot} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-email">Email</Label>
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

            <Button type="submit" size="lg" disabled={forgotLoading} className="w-full">
              {forgotLoading ? "Sending…" : "Send reset link"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => setMode("login")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Button>
          </form>
        </div>
      </Layout>
    )
  }

  /* ── sign in ── */
  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the admin panel.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => { setMode("forgot"); setForgotEmail(email) }}
              >
                Forgot password?
              </button>
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
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {(error || tooManyAttempts) && (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {tooManyAttempts
                ? "Too many failed attempts. Refresh the page to try again."
                : error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading || tooManyAttempts}
            className="w-full"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </Layout>
  )
}
