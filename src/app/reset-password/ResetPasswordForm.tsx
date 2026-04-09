"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
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

function passwordStrength(pw: string) {
  if (!pw.length) return { score: 0, label: "", color: "" }
  let s = 0
  if (pw.length >= 10) s++
  if (pw.length >= 14) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return { score: s, label: "Meget svag",  color: "bg-red-500" }
  if (s === 2) return { score: s, label: "Svag",        color: "bg-orange-400" }
  if (s === 3) return { score: s, label: "Middel",      color: "bg-amber-400" }
  if (s === 4) return { score: s, label: "Stærk",       color: "bg-emerald-500" }
  return           { score: s, label: "Meget stærk", color: "bg-emerald-500" }
}

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [showPw, setShowPw]       = useState(false)
  const [showCf, setShowCf]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [done, setDone]           = useState(false)

  const strength = passwordStrength(password)
  const pwReady  = password.length >= 10 && password === confirm

  // No token — invalid/expired link
  if (!token) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-6 text-center">
          <AdaptiveLogo />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Ugyldigt link</h1>
            <p className="text-sm text-muted-foreground">
              Nulstillingslinket mangler eller er udløbet. Anmod om et nyt link nedenfor.
            </p>
          </div>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage til log ind
          </Button>
        </div>
      </Layout>
    )
  }

  // Success state
  if (done) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-6 text-center">
          <AdaptiveLogo />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Adgangskode opdateret</h1>
            <p className="text-sm text-muted-foreground">
              Din adgangskode er nu ændret. Du kan logge ind med den nye adgangskode.
            </p>
          </div>
          <Button className="w-full" size="lg" onClick={() => router.push("/admin")}>
            Gå til log ind
          </Button>
        </div>
      </Layout>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pwReady) return
    setError("")
    setLoading(true)
    try {
      const { error: authError } = await authClient.resetPassword({
        newPassword: password,
        token: token ?? undefined,
      })
      if (authError) {
        setError("Nulstilling mislykkedes. Linket er muligvis udløbet — anmod om et nyt.")
      } else {
        setDone(true)
      }
    } catch {
      setError("Noget gik galt. Prøv igen om et øjeblik.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <AdaptiveLogo />
          <h1 className="text-xl font-bold">Nulstil adgangskode</h1>
          <p className="text-sm text-muted-foreground">
            Vælg en ny adgangskode på mindst 10 tegn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rp-pw">Ny adgangskode</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="rp-pw"
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                required
                autoFocus
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                disabled={loading}
                className="h-11 pl-9 pr-11"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        n <= strength.score ? strength.color : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rp-cf">Bekræft adgangskode</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="rp-cf"
                type={showCf ? "text" : "password"}
                placeholder="••••••••••"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError("") }}
                disabled={loading}
                aria-invalid={confirm.length > 0 && confirm !== password ? true : undefined}
                className="h-11 pl-9 pr-11"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCf((v) => !v)}
                className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs text-destructive">Adgangskoderne stemmer ikke overens</p>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading || !pwReady}>
            {loading ? "Gemmer…" : "Gem ny adgangskode"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage til log ind
          </Button>
        </form>
      </div>
    </Layout>
  )
}
