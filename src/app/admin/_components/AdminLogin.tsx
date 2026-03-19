"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react"
import { signIn, authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

const inputStyle = {
  background: "var(--surface)",
  borderColor: "var(--surface-border)",
  color: "var(--foreground)",
  height: "2.625rem",
} as const

const inputClass = "w-full text-sm placeholder:text-[color:var(--foreground-subtle)] focus-visible:border-[color:var(--accent)] focus-visible:ring-[color:var(--accent)]/20"

export default function AdminLogin() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "forgot" | "forgot-sent">("login")

  // Login state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const tooManyAttempts = attempts >= 5

  // Forgot password state
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
                : "Invalid email or password."
            )
          },
        }
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
    const { error } = await authClient.forgetPassword({
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

  // ── shared branding ──────────────────────────────────────────────────────────
  const Branding = () => (
    <div className="relative hidden lg:flex flex-col justify-between p-10"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--surface-border)" }}>
      <Image src="/logo.svg" alt="TEC" width={72} height={26} className="h-7 w-auto" />
      <blockquote className="space-y-2">
        <p className="text-lg font-medium leading-relaxed" style={{ color: "var(--foreground)" }}>
          "Keeping students and staff informed — every day, every screen."
        </p>
        <footer className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          TEC — Frederiksberg
        </footer>
      </blockquote>
    </div>
  )

  const MobileLogo = () => (
    <div className="lg:hidden mb-2">
      <Image src="/logo.svg" alt="TEC" width={56} height={20} className="h-5 w-auto" />
    </div>
  )

  // ── forgot sent ──────────────────────────────────────────────────────────────
  if (mode === "forgot-sent") {
    return (
      <div className="admin-theme grid min-h-svh lg:grid-cols-2">
        <Branding />
        <div className="flex items-center justify-center p-8" style={{ background: "var(--background)" }}>
          <div className="w-full max-w-sm space-y-5">
            <MobileLogo />
            <div className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <CheckCircle className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Check your inbox
              </h1>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                If <strong style={{ color: "var(--foreground)" }}>{forgotEmail}</strong> has an account, we've sent a password reset link. It expires in 1 hour.
              </p>
            </div>
            <button
              onClick={() => { setMode("login"); setForgotEmail("") }}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--foreground-muted)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── forgot password form ─────────────────────────────────────────────────────
  if (mode === "forgot") {
    return (
      <div className="admin-theme grid min-h-svh lg:grid-cols-2">
        <Branding />
        <div className="flex items-center justify-center p-8" style={{ background: "var(--background)" }}>
          <div className="w-full max-w-sm space-y-6">
            <MobileLogo />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Forgot password?
              </h1>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" style={{ color: "var(--foreground)" }}>Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@tec.dk"
                  required
                  autoFocus
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={forgotLoading}
                  style={inputStyle}
                  className={inputClass}
                />
              </div>

              {forgotError && (
                <div className="rounded-lg px-3.5 py-2.5 text-sm"
                  style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                  {forgotError}
                </div>
              )}

              <Button type="submit" disabled={forgotLoading} className="w-full"
                style={{ background: "#6366f1", color: "#fff", height: "2.625rem", fontSize: "0.875rem", fontWeight: 600 }}>
                {forgotLoading ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--foreground-muted)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── sign in form ─────────────────────────────────────────────────────────────
  return (
    <div className="admin-theme grid min-h-svh lg:grid-cols-2">
      <Branding />
      <div className="flex items-center justify-center p-8" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm space-y-6">
          <MobileLogo />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Sign in
            </h1>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              Enter your credentials to access the admin panel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: "var(--foreground)" }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@tec.dk"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || tooManyAttempts}
                style={inputStyle}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" style={{ color: "var(--foreground)" }}>Password</Label>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setForgotEmail(email) }}
                  className="text-xs transition-colors hover:underline"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || tooManyAttempts}
                  style={{ ...inputStyle, paddingRight: "2.75rem" }}
                  className={inputClass}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--foreground-subtle)" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {(error || tooManyAttempts) && (
              <div className="rounded-lg px-3.5 py-2.5 text-sm"
                style={{
                  background: tooManyAttempts ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                  border: `1px solid ${tooManyAttempts ? "rgba(245,158,11,0.25)" : "rgba(248,113,113,0.25)"}`,
                  color: tooManyAttempts ? "#fbbf24" : "#f87171",
                }}>
                {tooManyAttempts ? "Too many failed attempts. Refresh the page to try again." : error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || tooManyAttempts}
              className="w-full"
              style={{ background: "var(--accent)", color: "#fff", height: "2.625rem", fontSize: "0.875rem", fontWeight: 600 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
