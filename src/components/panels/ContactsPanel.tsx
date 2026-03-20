"use client"

import { useEffect, useState } from "react"
import { Mail, Phone } from "lucide-react"

type Contact = {
  id: number
  name: string
  email: string
  phone: string | null
  profilePicture: string
  role: string
  prioritized: boolean
}

const ROLE_LABEL: Record<string, string> = {
  admin:   "Administrator",
  Instruktør: "Instruktør",
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function Avatar({ contact, className }: { contact: Contact; className?: string }) {
  if (contact.profilePicture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={contact.profilePicture}
        alt={contact.name}
        className={`rounded-full object-cover ${className}`}
        style={{ border: "2px solid rgba(255,255,255,0.10)" }}
      />
    )
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-foreground select-none ${className}`}
      style={{
        background: "var(--surface-alt)",
        border: "2px solid var(--surface-border)",
        color: "var(--foreground-muted)",
      }}
    >
      {getInitials(contact.name, contact.email)}
    </div>
  )
}

/* ─── Featured card (top 4) — horizontal layout ─────────────────────────── */
function FeaturedCard({ contact }: { contact: Contact }) {
  const role = ROLE_LABEL[contact.role] ?? contact.role

  return (
    <article
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 45%, color-mix(in srgb, var(--accent) 10%, transparent) 100%)",
          opacity: 0.65,
        }}
      />

      <div className="relative flex flex-col gap-5 p-5">
        {/* Avatar + name row */}
        <div className="flex items-center gap-4">
          <Avatar contact={contact} className="h-16 w-16 shrink-0 text-xl" />
          <div className="min-w-0">
            <div className="mb-1">
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  background: "color-mix(in srgb, var(--accent) 18%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 24%, transparent)",
                  color: "var(--foreground-soft)",
                }}
              >
                Prioriteret
              </span>
            </div>
            <p className="font-bold text-lg leading-snug truncate" style={{ color: "var(--foreground)" }}>
              {contact.name ?? contact.email}
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-subtle)" }}>{role}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: "var(--surface-border)" }} />

        {/* Contact info */}
        <div className="flex flex-col gap-2.5">
          <a
            href={`mailto:${contact.email}`}
            className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
          >
            <Mail className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
            <span className="truncate group-hover:underline">{contact.email}</span>
          </a>
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
            >
              <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="group-hover:underline">{contact.phone}</span>
            </a>
          ) : (
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm"
              style={{ background: "var(--surface-soft)", color: "var(--foreground-soft)", opacity: 0.5 }}
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span>Ingen telefon</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/* ─── Regular card — vertical / compact ─────────────────────────────────── */
function ContactCard({ contact }: { contact: Contact }) {
  const role = ROLE_LABEL[contact.role] ?? contact.role

  return (
    <article
      className="flex flex-col items-center gap-4 rounded-2xl p-5 text-center transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.22)",
      }}
    >
      <Avatar contact={contact} className="h-14 w-14 text-lg" />

      <div className="min-w-0 w-full">
        <p className="font-bold text-base leading-snug" style={{ color: "var(--foreground)" }}>
          {contact.name ?? contact.email}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-subtle)" }}>{role}</p>
      </div>

      <div className="w-full flex flex-col gap-2 mt-auto">
        <a
          href={`mailto:${contact.email}`}
          className="group flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
          style={{ background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
        >
          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
          <span className="truncate group-hover:underline">{contact.email}</span>
        </a>
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
            style={{ background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
          >
            <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
            <span>{contact.phone}</span>
          </a>
        )}
      </div>
    </article>
  )
}

/* ─── Main panel ─────────────────────────────────────────────────────────── */
export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch("/api/kontakter", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { contacts: [] }))
      .then((data) => setContacts(Array.isArray(data.contacts) ? data.contacts : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false))
  }, [])

  // Sort: prioritized first, then alphabetically by name
  const sorted = [...contacts].sort((a, b) => {
    if (a.prioritized !== b.prioritized) return b.prioritized ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const featured = sorted.slice(0, 4)
  const rest     = sorted.slice(4)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl" style={{ background: "var(--surface)" }} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="font-medium" style={{ color: "var(--foreground-muted)" }}>Ingen kontakter fundet</p>
        <p className="text-sm" style={{ color: "var(--foreground-subtle)" }}>
          Inviter instruktører og administratorer til platformen for at de vises her.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-10">
      {/* ── Featured 4 ── */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--foreground-soft)" }}>
          Vigtigste kontakter
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((c) => <FeaturedCard key={c.id} contact={c} />)}
        </div>
      </div>

      {/* ── Rest ── */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "var(--surface-border)" }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--foreground-soft)" }}>
              Alle kontakter · {contacts.length}
            </p>
            <div className="h-px flex-1" style={{ background: "var(--surface-border)" }} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rest.map((c) => <ContactCard key={c.id} contact={c} />)}
          </div>
        </div>
      )}
    </section>
  )
}
