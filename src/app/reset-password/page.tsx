"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import Image from "next/image"

const SLIDE = {
  enter: { x: "60%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-60%", opacity: 0 },
}
const transition = { type: "spring" as const, stiffness: 280, damping: 28 }

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [step, setStep] = useState<"form" | "done" | "invalid">("form")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) setStep("invalid")
  }, [token])

  const hints = [
    { ok: password.length >= 10, label: "At least 10 characters" },
    { ok: /[A-Z]/.test(password), label: "One uppercase letter" },
    { ok: /[0-9]/.test(password), label: "One number" },
    { ok: confirm === password && confirm.length > 0, label: "Passwords match" },
  ]

  async function handleReset() {
    setError("")
    if (password !== confirm) { setError("Passwords do not match."); return }
    if (password.length < 10) { setError("Password must be at least 10 characters."); return }
    setSubmitting(true)
    const { error: err } = await authClient.resetPassword({ newPassword: password, token })
    if (err) {
      setError(err.message ?? "Invalid or expired reset link. Please request a new one.")
      setSubmitting(false)
    } else {
      setStep("done")
    }
  }

  return (
    <div style={{ minHeight: "100svh", background: "var(--background, #040b16)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ marginBottom: 48 }}>
          <Image src="/logo.svg" alt="TEC" width={72} height={26} style={{ height: 26, width: "auto" }} />
        </div>

        <div style={{ position: "relative", overflow: "hidden", minHeight: 320 }}>
          <AnimatePresence mode="wait">
            {step === "invalid" && (
              <motion.div key="invalid" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <AlertCircle style={{ width: 24, height: 24, color: "#f87171" }} />
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 12px" }}>
                  Invalid link
                </h1>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", lineHeight: 1.6, margin: "0 0 32px" }}>
                  This reset link is missing or invalid. Please request a new one from the sign-in page.
                </p>
                <button onClick={() => router.push("/admin")} style={btnStyle("#6366f1")}>
                  Back to sign in <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </motion.div>
            )}

            {step === "form" && (
              <motion.div key="form" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Password reset
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 8px", lineHeight: 1.2 }}>
                  Choose a new password
                </h1>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", margin: "0 0 28px" }}>
                  Minimum 10 characters.
                </p>

                <label style={labelStyle}>New password</label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <input
                    autoFocus
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    placeholder="••••••••••"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} style={eyeStyle}>
                    {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>

                <label style={labelStyle}>Confirm password</label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && !submitting && handleReset()}
                    placeholder="••••••••••"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} style={eyeStyle}>
                    {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>

                {/* strength hints */}
                {password.length > 0 && (
                  <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    {hints.map(h => (
                      <li key={h.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: h.ok ? "#10b981" : "#65718a", flexShrink: 0 }} />
                        <span style={{ color: h.ok ? "#f4f6ff" : "#65718a" }}>{h.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {error && (
                  <p style={{ fontSize: 13, color: "#f87171", margin: "0 0 12px", padding: "8px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <button onClick={handleReset} disabled={submitting} style={{ ...btnStyle("#6366f1"), opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : null}
                  {submitting ? "Saving…" : "Reset password"}
                </button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}
                >
                  <CheckCircle style={{ width: 28, height: 28, color: "#10b981" }} />
                </motion.div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 12px" }}>
                  Password updated!
                </h1>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", lineHeight: 1.6, margin: "0 0 32px" }}>
                  Your password has been changed. You can now sign in with your new password.
                </p>
                <button onClick={() => router.push("/admin")} style={btnStyle("#6366f1")}>
                  Go to sign in <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus { outline: none; border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }`}</style>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

const btnStyle = (bg: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 8,
  background: bg, color: "#fff", border: "none", borderRadius: 10,
  padding: "13px 22px", fontSize: 15, fontWeight: 600, cursor: "pointer",
})

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10, padding: "12px 14px", fontSize: 15,
  color: "var(--foreground, #f4f6ff)",
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "var(--foreground, #f4f6ff)", marginBottom: 8,
}

const eyeStyle: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  color: "var(--foreground-subtle, #65718a)", display: "flex", alignItems: "center",
}
