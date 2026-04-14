"use client"

import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "@/lib/api-fetch"
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  BookOpen,
  Mail,
  X,
  ChevronDown,
  Send,
  Clock,
  Check,
  Link2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type User = {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: string
}

type RoleOption = {
  value: string
  label: string
  icon: typeof BookOpen
  activeBg: string
  border: string
  color: string
}

// ── Role dropdown ──────────────────────────────────────────────────────────────

const ROLES: RoleOption[] = [
  {
    value: "teacher",
    label: "Instruktør",
    icon: BookOpen,
    activeBg: "bg-sky-500/10",
    border: "border-sky-500/25",
    color: "text-sky-400",
  },
  {
    value: "admin",
    label: "Administrator",
    icon: Shield,
    activeBg: "bg-amber-500/10",
    border: "border-amber-500/25",
    color: "text-amber-400",
  },
]

function RoleDropdown({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled: boolean
  onChange: (role: string) => void
}) {
  const current = ROLES.find((r) => r.value === value) ?? ROLES[0]
  const Icon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary text-secondary-foreground px-2.5 py-1.5 text-xs font-semibold transition-all hover:bg-secondary/70",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          {disabled ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
          {current.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {ROLES.map((role) => {
          const RIcon = role.icon
          const isActive = role.value === value
          return (
            <DropdownMenuItem
              key={role.value}
              onClick={() => { if (role.value !== value) onChange(role.value) }}
              className="flex items-center gap-2 text-xs font-medium cursor-pointer"
            >
              <RIcon className="h-3.5 w-3.5" />
              {role.label}
              {isActive && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })
}

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

type Toast = { id: number; type: "success" | "error"; message: string }

// Invite modal mode
type InviteMode = "email" | "link"

// ── Page ───────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteMode, setInviteMode] = useState<InviteMode>("email")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("teacher")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  // Create user modal
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [createRole, setCreateRole] = useState("teacher")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Role update
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // Resend invite
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)

  const toast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch("/api/admin/users")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users)
    } catch {
      toast("error", "Kunne ikke hente brugere")
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { void loadUsers() }, [loadUsers])

  function openCreate() {
    setCreateName("")
    setCreateEmail("")
    setCreatePassword("")
    setCreateRole("teacher")
    setCreateError("")
    setShowCreate(true)
  }

  async function handleCreate() {
    setCreateError("")
    if (!createName.trim()) { setCreateError("Indtast et navn."); return }
    if (!createEmail.trim() || !createEmail.includes("@")) { setCreateError("Indtast en gyldig e-mailadresse."); return }
    if (createPassword.length < 10) { setCreateError("Adgangskoden skal være mindst 10 tegn."); return }
    setCreating(true)
    const res = await apiFetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName.trim(), email: createEmail.trim(), password: createPassword, role: createRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCreateError(data.error ?? "Kunne ikke oprette bruger.")
    } else {
      toast("success", `Bruger ${createName.trim()} oprettet`)
      setShowCreate(false)
      void loadUsers()
    }
    setCreating(false)
  }

  function openInvite(mode: InviteMode = "email") {
    setInviteMode(mode)
    setInviteEmail("")
    setInviteRole("teacher")
    setInviteError("")
    setInviteSent(false)
    setInviteLink("")
    setLinkCopied(false)
    setShowInvite(true)
  }

  async function handleInvite() {
    setInviteError("")
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Indtast venligst en gyldig e-mailadresse.")
      return
    }
    setInviting(true)

    const endpoint = inviteMode === "link"
      ? "/api/admin/invite/link"
      : "/api/admin/invite"

    const res = await apiFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      setInviteError(data.error ?? "Kunne ikke oprette invitation.")
    } else {
      setInviteLink(data.inviteLink ?? "")
      setInviteSent(true)
      void loadUsers()
    }
    setInviting(false)
  }

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  async function handleResendInvite(email: string) {
    setResendingEmail(email)
    const res = await apiFetch("/api/admin/invite/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast("error", data.error ?? "Kunne ikke gensende invitation.")
    } else {
      toast("success", `Invitation gensendt til ${email}`)
    }
    setResendingEmail(null)
  }

  async function handleRoleChange(id: string, role: string) {
    setUpdatingRole(id)
    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast("error", data.error ?? "Kunne ikke opdatere rolle.")
    } else {
      toast("success", "Rolle opdateret")
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    }
    setUpdatingRole(null)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await apiFetch(`/api/admin/users/${deleteId}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      toast("error", data.error ?? "Kunne ikke slette bruger.")
    } else {
      toast("success", "Bruger slettet")
      setUsers((prev) => prev.filter((u) => u.id !== deleteId))
    }
    setDeleteId(null)
    setDeleting(false)
  }

  const pendingCount = users.filter((u) => !u.name).length

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto",
            t.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-400"
          )}>
            {t.type === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brugerstyring</h1>
          <p className="mt-1 text-sm text-muted">
            Administrer instruktør- og administrator-konti
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                {pendingCount} afventer
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Send e-mail invite */}
          <Button onClick={() => openInvite("email")} title="Inviter bruger via e-mail">
            <Mail className="h-4 w-4" />
            Inviter via e-mail
          </Button>
          {/* Generate link invite */}
          <Button variant="outline" onClick={() => openInvite("link")} title="Generer invitationslink">
            <Link2 className="h-4 w-4" />
            Generer link
          </Button>
          {/* Manual create */}
          <Button variant="outline" size="icon" onClick={openCreate} title="Opret bruger manuelt">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Users table */}
      <div className="admin-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Alle brugere
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted">({users.length})</span>
            )}
          </h2>
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Opdater
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-(--surface-soft)" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted opacity-50" />
            <p className="text-muted">Ingen brugere endnu. Inviter nogen for at komme i gang.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {users.map((u) => {
              const isPending = !u.name
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-(--surface-soft) transition-colors"
                >
                  {/* Avatar */}
                  {u.image ? (
                    <img
                      src={u.image}
                      alt={u.name ?? u.email}
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border/40"
                    />
                  ) : (
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isPending
                        ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20"
                        : "bg-emerald-600/20 text-emerald-400"
                    )}>
                      {initials(u.name, u.email)}
                    </div>
                  )}

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {u.name ?? (
                          <span className="italic text-muted">Afventer opsætning</span>
                        )}
                      </p>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shrink-0 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                          <Clock className="h-2.5 w-2.5" />
                          Afventer
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden text-xs text-muted block mr-1">
                      {fmtDate(u.createdAt)}
                    </span>

                    <RoleDropdown
                      value={u.role}
                      disabled={updatingRole === u.id}
                      onChange={(role) => handleRoleChange(u.id, role)}
                    />

                    {isPending && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(u.email)}
                        disabled={resendingEmail === u.email}
                        title="Gensend invitationsmail"
                        className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-400"
                      >
                        {resendingEmail === u.email ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden inline">Gensend</span>
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => setDeleteId(u.id)}
                      title="Slet bruger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Invite modal ──────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-panel w-full max-w-md p-6">
            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {inviteMode === "email" ? (
                    <Mail className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Link2 className="h-4 w-4 text-sky-400" />
                  )}
                  {inviteMode === "email" ? "Inviter via e-mail" : "Generer invitationslink"}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {inviteMode === "email"
                    ? "Brugeren modtager et link direkte i sin indbakke."
                    : "Kopier linket og send det manuelt til brugeren."}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowInvite(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mode toggle */}
            {!inviteSent && (
              <div className="mb-5 flex gap-1 rounded-xl border border-border/40 bg-muted/20 p-1">
                {(["email", "link"] as InviteMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setInviteMode(m); setInviteError("") }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      inviteMode === m
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "email" ? (
                      <><Mail className="h-3.5 w-3.5" /> Send e-mail</>
                    ) : (
                      <><Link2 className="h-3.5 w-3.5" /> Kopier link</>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!inviteSent ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    E-mailadresse
                  </label>
                  <input
                    autoFocus
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError("") }}
                    onKeyDown={(e) => e.key === "Enter" && !inviting && handleInvite()}
                    placeholder="instruktor@tec.dk"
                    className="admin-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Rolle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((role) => {
                      const RIcon = role.icon
                      const isSelected = inviteRole === role.value
                      return (
                        <Button
                          key={role.value}
                          type="button"
                          variant="ghost"
                          onClick={() => setInviteRole(role.value)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                            isSelected
                              ? cn(role.activeBg, role.border, role.color, "ring-1 ring-inset", role.border)
                              : "border-border/60 bg-(--surface-soft) text-muted hover:text-foreground hover:border-border"
                          )}
                        >
                          <RIcon className={cn("h-4 w-4", isSelected ? role.color : "")} />
                          {role.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {inviteError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <p className="text-sm text-red-400">{inviteError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button onClick={handleInvite} disabled={inviting} className="flex-1">
                    {inviting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : inviteMode === "email" ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {inviting
                      ? "Behandler…"
                      : inviteMode === "email"
                      ? "Send invitation"
                      : "Generer link"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowInvite(false)}>
                    Annuller
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Success state ── */
              <div className="space-y-4">
                {inviteMode === "email" ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-5 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Invitation sendt!</p>
                      <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/70">
                        En e-mail er sendt til <strong>{inviteEmail}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-50 px-4 py-5 text-center dark:border-sky-500/20 dark:bg-sky-500/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-500/20">
                      <Link2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sky-700 dark:text-sky-400">Link genereret!</p>
                      <p className="mt-0.5 text-xs text-sky-600/80 dark:text-sky-400/70">
                        Kopier linket og send det manuelt til <strong>{inviteEmail}</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Link display (shown for both modes) */}
                {inviteLink && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Invitationslink <span className="text-muted-foreground/60">(udløber om 7 dage)</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground font-mono">
                        {inviteLink}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={copyLink}
                        title="Kopier link"
                        className={cn(
                          "shrink-0 transition-colors",
                          linkCopied ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {linkCopied ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => setShowInvite(false)}>
                  Færdig
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create user modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-panel w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  Opret bruger manuelt
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Brugeren kan logge ind med det valgte kodeord med det samme.
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Navn</label>
                <input
                  autoFocus
                  type="text"
                  value={createName}
                  onChange={(e) => { setCreateName(e.target.value); setCreateError("") }}
                  placeholder="Fornavn Efternavn"
                  className="admin-input w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">E-mailadresse</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => { setCreateEmail(e.target.value); setCreateError("") }}
                  placeholder="instruktor@tec.dk"
                  className="admin-input w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Adgangskode</label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => { setCreatePassword(e.target.value); setCreateError("") }}
                  onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
                  placeholder="Mindst 10 tegn"
                  className="admin-input w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Rolle</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const RIcon = role.icon
                    const isSelected = createRole === role.value
                    return (
                      <Button
                        key={role.value}
                        type="button"
                        variant="ghost"
                        onClick={() => setCreateRole(role.value)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                          isSelected
                            ? cn(role.activeBg, role.border, role.color, "ring-1 ring-inset", role.border)
                            : "border-border/60 bg-(--surface-soft) text-muted hover:text-foreground hover:border-border"
                        )}
                      >
                        <RIcon className={cn("h-4 w-4", isSelected ? role.color : "")} />
                        {role.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {createError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{createError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button onClick={handleCreate} disabled={creating} className="flex-1">
                  {creating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {creating ? "Opretter…" : "Opret bruger"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Annuller
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="admin-panel mx-4 w-full max-w-sm p-6">
            <div className="mb-4 flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <h3 className="mb-1 text-center font-semibold text-foreground">Slet bruger?</h3>
            <p className="mb-5 text-center text-sm text-muted">
              Dette vil permanent slette brugeren og alle deres sessioner. Dette kan ikke fortrydes.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
              >
                {deleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? "Sletter…" : "Slet"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">
                Annuller
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
