"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from "lucide-react"

const SLIDE = {
  enter: { x: "60%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-60%", opacity: 0 },
}

const transition = { type: "spring" as const, stiffness: 280, damping: 28 }

type Props = {
  token: string
  email: string
  role: string
}

export default function InviteForm({ token, email, role }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleFinish() {
    setError("")
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.")
      return
    }
    setSubmitting(true)
    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.")
      setSubmitting(false)
      return
    }
    setStep(3)
    setSubmitting(false)
  }

  const roleBadge =
    role === "admin" ? (
      <span style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
        Admin
      </span>
    ) : (
      <span style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
        Teacher
      </span>
    )

  return (
    <div style={{ minHeight: "100svh", background: "var(--background, #040b16)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground, #f4f6ff)" }}>TEC Info Board</span>
        </div>

        {/* Slide container */}
        <div style={{ position: "relative", overflow: "hidden", minHeight: 340 }}>
          <AnimatePresence mode="wait">
            {/* Step 0 – Welcome */}
            {step === 0 && (
              <motion.div key="welcome" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  You're invited
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 16px", lineHeight: 1.2 }}>
                  Welcome to TEC Info Board
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--foreground-muted, #a3b2d4)" }}>{email}</span>
                  <span>·</span>
                  {roleBadge}
                </div>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", lineHeight: 1.6, margin: "0 0 40px" }}>
                  We'll get you set up in just a few steps. It only takes a minute.
                </p>
                <button onClick={() => setStep(1)} style={btnStyle}>
                  Get started <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </motion.div>
            )}

            {/* Step 1 – Name */}
            {step === 1 && (
              <motion.div key="name" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Step 1
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 8px", lineHeight: 1.2 }}>
                  What's your name?
                </h1>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", margin: "0 0 32px" }}>
                  This is how you'll appear in the system.
                </p>
                <label style={labelStyle}>Full name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim().length >= 2 && setStep(2)}
                  placeholder="e.g. Jane Doe"
                  style={inputStyle}
                />
                <button
                  onClick={() => { if (name.trim().length >= 2) setStep(2) }}
                  disabled={name.trim().length < 2}
                  style={{ ...btnStyle, opacity: name.trim().length < 2 ? 0.45 : 1, marginTop: 24 }}
                >
                  Continue <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </motion.div>
            )}

            {/* Step 2 – Password */}
            {step === 2 && (
              <motion.div key="password" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Step 2
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 8px", lineHeight: 1.2 }}>
                  Create your password
                </h1>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", margin: "0 0 32px" }}>
                  Minimum 10 characters.
                </p>

                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <input
                    autoFocus
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    placeholder="••••••••••"
                    style={{ ...inputStyle, paddingRight: 44, marginBottom: 0 }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)} style={eyeBtnStyle}>
                    {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>

                <label style={labelStyle}>Confirm password</label>
                <div style={{ position: "relative", marginBottom: 0 }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && !submitting && handleFinish()}
                    placeholder="••••••••••"
                    style={{ ...inputStyle, paddingRight: 44, marginBottom: 0 }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} style={eyeBtnStyle}>
                    {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: "#f87171", marginTop: 10, padding: "8px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <button onClick={handleFinish} disabled={submitting} style={{ ...btnStyle, marginTop: 24, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : null}
                  {submitting ? "Setting up…" : "Complete setup"}
                </button>
              </motion.div>
            )}

            {/* Step 3 – Done */}
            {step === 3 && (
              <motion.div key="done" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={transition} style={{ position: "absolute", width: "100%" }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}
                >
                  <CheckCircle style={{ width: 28, height: 28, color: "#10b981" }} />
                </motion.div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground, #f4f6ff)", margin: "0 0 12px", lineHeight: 1.2 }}>
                  You're all set, {name.split(" ")[0]}!
                </h1>
                <p style={{ fontSize: 15, color: "var(--foreground-muted, #a3b2d4)", lineHeight: 1.6, margin: "0 0 40px" }}>
                  Your account is ready. Sign in with {email} to access the admin panel.
                </p>
                <a href="/admin" style={{ ...btnStyle, display: "inline-flex", textDecoration: "none" }}>
                  Go to sign in <ArrowRight style={{ width: 16, height: 16 }} />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--foreground-subtle, #65718a); }
        input:focus { outline: none; border-color: rgba(16,185,129,0.5) !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
      `}</style>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "13px 22px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s",
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 15,
  color: "var(--foreground, #f4f6ff)",
  marginBottom: 0,
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--foreground, #f4f6ff)",
  marginBottom: 8,
}

const eyeBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--foreground-subtle, #65718a)",
  display: "flex",
  alignItems: "center",
}
