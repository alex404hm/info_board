"use client"

import { useState, useEffect, useCallback } from "react"
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
  Copy,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type User = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-400 border border-violet-500/20">
        <Shield className="h-3 w-3" />Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
      <BookOpen className="h-3 w-3" />Teacher
    </span>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("teacher")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [copied, setCopied] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Role update
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const toast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users)
    } catch {
      toast("error", "Failed to load users")
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { void loadUsers() }, [loadUsers])

  function openInvite() {
    setInviteEmail("")
    setInviteRole("teacher")
    setInviteError("")
    setInviteLink("")
    setCopied(false)
    setShowInvite(true)
  }

  async function handleInvite() {
    setInviteError("")
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address.")
      return
    }
    setInviting(true)
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) {
      setInviteError(data.error ?? "Failed to send invite.")
    } else {
      setInviteLink(data.inviteLink)
      void loadUsers()
      toast("success", "Invitation sent!")
    }
    setInviting(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRoleChange(id: string, role: string) {
    setUpdatingRole(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast("error", data.error ?? "Failed to update role.")
    } else {
      toast("success", "Role updated")
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    }
    setUpdatingRole(null)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${deleteId}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      toast("error", data.error ?? "Failed to delete user.")
    } else {
      toast("success", "User deleted")
      setUsers((prev) => prev.filter((u) => u.id !== deleteId))
    }
    setDeleteId(null)
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto",
            t.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"
          )}>
            {t.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted">Manage teacher and admin accounts</p>
        </div>
        <button onClick={openInvite} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {/* Users table */}
      <div className="admin-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-semibold text-foreground">
            All Users
            {!loading && <span className="ml-2 text-sm font-normal text-muted">({users.length})</span>}
          </h2>
          <button onClick={loadUsers} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-[color:var(--surface-soft)]" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted opacity-50" />
            <p className="text-muted">No users yet. Invite someone to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[color:var(--surface-soft)] transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400">
                  {initials(u.name, u.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.name ?? <span className="text-muted italic">Pending setup</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={u.role}
                    disabled={updatingRole === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={cn("rounded-lg border border-border/60 bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs text-foreground focus:border-accent/60 focus:outline-none transition-opacity", updatingRole === u.id && "opacity-50 cursor-not-allowed")}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <RoleBadge role={u.role} />
                  <span className="hidden text-xs text-muted sm:block">{fmtDate(u.createdAt)}</span>
                  <button onClick={() => setDeleteId(u.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.08] text-red-400 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-panel w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  Invite User
                </h3>
                <p className="text-xs text-muted mt-0.5">They'll receive a link to set up their account.</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!inviteLink ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
                  <input
                    autoFocus
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError("") }}
                    onKeyDown={(e) => e.key === "Enter" && !inviting && handleInvite()}
                    placeholder="teacher@tec.dk"
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="admin-input w-full"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {inviteError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <p className="text-sm text-red-400">{inviteError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={handleInvite} disabled={inviting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                    {inviting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {inviting ? "Sending…" : "Send Invite"}
                  </button>
                  <button onClick={() => setShowInvite(false)} className="rounded-lg border border-border/60 px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="text-sm text-emerald-400">Invitation sent to <strong>{inviteEmail}</strong></p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-2">Share this link manually if email isn't configured:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-[color:var(--surface-soft)] border border-border/60 px-3 py-2 text-xs text-foreground font-mono">
                      {inviteLink}
                    </code>
                    <button onClick={copyLink} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted hover:text-foreground transition-colors">
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={() => setShowInvite(false)} className="w-full rounded-lg border border-border/60 px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="admin-panel mx-4 w-full max-w-sm p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="mb-1 font-semibold text-foreground">Delete user?</h3>
            <p className="mb-5 text-sm text-muted">This will permanently delete the user and all their sessions. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
                {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border border-border/60 px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
