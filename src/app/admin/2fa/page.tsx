"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

const MAX_ATTEMPTS = 5

/* ─── Layout shell (identical to AdminLogin) ─────────────────────────────── */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-svh flex-col p-8 md:p-12"
      style={
        {
          "--input": "rgba(255,255,255,0.13)",
          "--ring": "rgba(95,157,255,0.45)",
        } as React.CSSProperties
      }
    >
      <div>
        <Image
          src="/logo.svg"
          alt="TEC"
          width={72}
          height={26}
          className="h-6 w-auto"
          style={{ width: "auto" }}
          priority
        />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

/* ─── 2FA page ───────────────────────────────────────────────────────────── */
export default function TwoFactorPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const isLocked = attempts >= MAX_ATTEMPTS

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (code.length === 6 && !loading && !isLocked) {
      void verify(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function verify(value: string) {
    setError("")
    setLoading(true)
    try {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: value,
      })
      if (verifyError) {
        const next = attempts + 1
        setAttempts(next)
        setCode("")
        if (next >= MAX_ATTEMPTS) {
          setError("Too many failed attempts. Please sign in again.")
        } else {
          setError(
            `Invalid code. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`,
          )
        }
      } else {
        // Success — full page navigation so the new session cookie is picked up
        window.location.replace("/admin")
      }
    } catch {
      const next = attempts + 1
      setAttempts(next)
      setCode("")
      setError(
        next >= MAX_ATTEMPTS
          ? "Too many failed attempts. Please sign in again."
          : `Invalid code. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`,
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(value: string) {
    if (!loading && !isLocked) {
      setCode(value)
      if (error) setError("")
    }
  }

  function goBack() {
    window.location.replace("/admin")
  }

  /* ── Locked state ── */
  if (isLocked) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Too many attempts</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;ve entered an incorrect code {MAX_ATTEMPTS} times. Please sign in again to
              receive a new session.
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={goBack}>
            Back to sign in
          </Button>
        </div>
      </Layout>
    )
  }

  /* ── Normal state ── */
  return (
    <Layout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Two-factor authentication</h1>
            <p className="text-sm text-muted-foreground">
              Open your authenticator app and enter the 6-digit code.
            </p>
          </div>
        </div>

        {/* OTP input */}
        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={handleChange}
            disabled={loading}
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground text-center">
            Works with Google Authenticator, Microsoft Authenticator, Authy, and more.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive text-center">
            {error}
          </p>
        )}

        {/* Loading indicator shown while auto-submitting */}
        {loading && !error && (
          <p className="text-sm text-muted-foreground text-center">Verifying…</p>
        )}

        {/* Back link */}
        <Button
          type="button"
          variant="ghost"
          className="w-full gap-2 text-muted-foreground"
          onClick={goBack}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Button>
      </div>
    </Layout>
  )
}
