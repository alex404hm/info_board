"use client"

import React, { useRef, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight, Loader2, User2, ImagePlus,
  Lock, Eye, EyeOff, CheckCircle, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneNumberInput } from "@/components/ui/phone-input"

/* ─── Animation ──────────────────────────────────────────────────────────── */
const SLIDE = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}
const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 }

type Props = { token: string; email: string; role: string }

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ({ target }) => {
      const img = new window.Image()
      img.onload = () => {
        const MAX = 400
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement("canvas")
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.88))
      }
      img.onerror = reject
      img.src = target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function InviteForm({ token, email, role }: Props) {
  const [step,       setStep]      = useState(0)
  const [dir,        setDir]       = useState(1)
  const [firstName,  setFirstName] = useState("")
  const [lastName,   setLastName]  = useState("")
  const [phone,      setPhone]     = useState("")
  const [photo,      setPhoto]     = useState<string | null>(null)
  const [password,   setPassword]  = useState("")
  const [confirm,    setConfirm]   = useState("")
  const [showPw,     setShowPw]    = useState(false)
  const [showCf,     setShowCf]    = useState(false)
  const [error,      setError]     = useState("")
  const [submitting, setSubmitting]= useState(false)
  const [dragging,   setDragging]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const name      = `${firstName.trim()} ${lastName.trim()}`.trim()
  const strength  = passwordStrength(password)
  const nameReady = firstName.trim().length >= 2 && lastName.trim().length >= 2
  const pwReady   = password.length >= 10 && password === confirm
  const initials  = (firstName.trim()[0] ?? "").toUpperCase() + (lastName.trim()[0] ?? "").toUpperCase()

  function go(n: number) {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }

  async function handleFinish() {
    setError("")
    if (!pwReady) return
    setSubmitting(true)
    const res  = await fetch(`/api/invite/${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, password, phoneNumber: phone.trim() || null, image: photo }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Noget gik galt."); setSubmitting(false); return }
    go(5)
    setSubmitting(false)
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    try { setPhoto(await compressImage(file)) } catch {}
  }

  return (
    <div className="flex min-h-svh flex-col p-8 p-12" style={{ "--input": "rgba(255,255,255,0.13)", "--ring": "rgba(95,157,255,0.45)" } as React.CSSProperties}>
      {/* Logo */}
      <div>
        <Image
          src="/logo.svg"
          alt="TEC"
          width={56}
          height={20}
          className="brightness-0 invert"
          priority
        />
      </div>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">

          {/* Step dots */}
          {step > 0 && step < 5 && (
            <div className="mb-8 flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-border"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="relative" style={{ minHeight: 400 }}>
            <AnimatePresence mode="wait" custom={dir}>

              {/* ── Step 0: Welcome ── */}
              {step === 0 && (
                <motion.div key="s0" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SPRING} className="absolute inset-0 flex flex-col gap-7">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Opsæt din profil</h1>
                    <p className="text-sm text-muted-foreground">
                      {email} — {role === "admin" ? "Administrator" : "Instruktør"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Det tager kun et par minutter at komme i gang.
                    </p>
                  </div>
                  <Button size="lg" className="w-full" onClick={() => go(1)}>
                    Kom i gang <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 1: Name ── */}
              {step === 1 && (
                <motion.div key="s1" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SPRING} className="absolute inset-0 flex flex-col gap-7">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trin 1 af 4</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Hvad hedder du?</h2>
                    <p className="text-sm text-muted-foreground">Sådan fremstår du i systemet.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inv-fn">Fornavn</Label>
                      <div className="relative">
                        <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="inv-fn"
                          autoFocus
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && document.getElementById("inv-ln")?.focus()}
                          placeholder="f.eks. Jane"
                          className="h-11 pl-9"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inv-ln">Efternavn</Label>
                      <div className="relative">
                        <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="inv-ln"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && nameReady && go(2)}
                          placeholder="f.eks. Doe"
                          className="h-11 pl-9"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {name.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">{email}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button size="lg" className="w-full" onClick={() => go(2)} disabled={!nameReady}>
                    Fortsæt <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 2: Phone ── */}
              {step === 2 && (
                <motion.div key="s2" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SPRING} className="absolute inset-0 flex flex-col gap-7">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trin 2 af 4</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Telefonnummer</h2>
                    <p className="text-sm text-muted-foreground">Valgfrit — bruges til kontaktlisten.</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="inv-phone">Telefon</Label>
                    <PhoneNumberInput
                      id="inv-phone"
                      value={phone}
                      onChange={setPhone}
                      defaultCountry="DK"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && go(3)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button size="lg" className="flex-1" onClick={() => go(3)}>
                      Fortsæt <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => { setPhone(""); go(3) }}>
                      Spring over
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Photo ── */}
              {step === 3 && (
                <motion.div key="s3" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SPRING} className="absolute inset-0 flex flex-col gap-7">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trin 3 af 4</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Profilbillede</h2>
                    <p className="text-sm text-muted-foreground">Valgfrit — upload et foto af dig selv.</p>
                  </div>

                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void handleFile(f) }}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                      dragging ? "border-primary bg-card" : photo ? "border-border bg-card" : "border-border hover:border-primary/40 hover:bg-card"
                    }`}
                  >
                    {photo ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo} alt="Preview" className="h-20 w-20 rounded-full object-cover ring-2 ring-border" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPhoto(null) }}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Klik for at skifte billede</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card">
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Klik for at uploade</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG eller WEBP</p>
                        </div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
                  </div>

                  <div className="flex gap-3">
                    <Button size="lg" className="flex-1" onClick={() => go(4)}>
                      Fortsæt <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => { setPhoto(null); go(4) }}>
                      Spring over
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: Password ── */}
              {step === 4 && (
                <motion.div key="s4" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SPRING} className="absolute inset-0 flex flex-col gap-7">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trin 4 af 4</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Opret adgangskode</h2>
                    <p className="text-sm text-muted-foreground">Mindst 10 tegn.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inv-pw">Adgangskode</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="inv-pw"
                          autoFocus
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError("") }}
                          placeholder="••••••••••"
                          className="h-11 pl-9 pr-11"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                          className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1 pt-0.5">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(n => (
                              <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= strength.score ? strength.color : "bg-border"}`} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">{strength.label}</p>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="inv-cf">Bekræft adgangskode</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="inv-cf"
                          type={showCf ? "text" : "password"}
                          value={confirm}
                          onChange={(e) => { setConfirm(e.target.value); setError("") }}
                          onKeyDown={(e) => e.key === "Enter" && pwReady && !submitting && handleFinish()}
                          placeholder="••••••••••"
                          aria-invalid={confirm.length > 0 && confirm !== password ? true : undefined}
                          className="h-11 pl-9 pr-11"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowCf(v => !v)}
                          className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                          {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirm.length > 0 && confirm !== password && (
                        <p className="text-xs text-destructive">Adgangskoderne stemmer ikke overens</p>
                      )}
                    </div>

                    {error && (
                      <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
                    )}
                  </div>

                  <Button size="lg" className="w-full" onClick={handleFinish} disabled={submitting || !pwReady}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Opretter konto…" : "Fuldfør opsætning"}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </motion.div>
              )}

              {/* ── Step 5: Done ── */}
              {step === 5 && (
                <motion.div key="s5" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SPRING} className="absolute inset-0 flex flex-col items-center justify-center gap-7 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card"
                  >
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </motion.div>

                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Du er klar, {firstName}!</h2>
                    <p className="text-sm text-muted-foreground">
                      Log ind med <span className="font-medium text-foreground">{email}</span>.
                    </p>
                  </div>

                  <div className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </div>

                  <Button size="lg" className="w-full" asChild>
                    <a href="/admin">
                      Gå til log ind <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
