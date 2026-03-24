"use client"

import { useEffect, useState } from "react"
import { Mail, Phone } from "lucide-react"

type Contact = {
  id: number
  name: string
  email: string | null
  phone: string | null
  profilePicture: string
  role: string
}

const SHOWN_NAMES = [
  "Casper Nordkvist Vestergaard",
  "Kristian Kure",
  "Tuner Budanur",
  "Mathias Casper Lynge Le-Holding",
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
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
      className={`flex items-center justify-center rounded-full font-bold select-none ${className}`}
      style={{
        background: "var(--surface-alt)",
        border: "2px solid var(--surface-border)",
        color: "var(--foreground-muted)",
      }}
    >
      {getInitials(contact.name)}
    </div>
  )
}

function ContactCard({ contact }: { contact: Contact }) {
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
        <div className="flex items-center gap-4">
          <Avatar contact={contact} className="h-16 w-16 shrink-0 text-xl" />
          <div className="min-w-0">
            <p className="font-bold text-lg leading-snug truncate" style={{ color: "var(--foreground)" }}>
              {contact.name}
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--foreground-subtle)" }}>{contact.role}</p>
          </div>
        </div>

        <div className="h-px" style={{ background: "var(--surface-border)" }} />

        <div className="flex flex-col gap-2.5">
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
            >
              <Mail className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="truncate group-hover:underline">{contact.email}</span>
            </a>
          ) : (
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm"
              style={{ background: "var(--surface-soft)", color: "var(--foreground-soft)", opacity: 0.5 }}
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>Ingen email</span>
            </div>
          )}
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

/* ─── Main panel ─────────────────────────────────────────────────────────── */
export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/kontakter", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { contacts: [] }))
      .then((data) => {
        const all: Contact[] = Array.isArray(data.contacts) ? data.contacts : []
        const filtered = SHOWN_NAMES.map((name) => all.find((c) => c.name === name)).filter(Boolean) as Contact[]
        setContacts(filtered)
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-60 animate-pulse rounded-2xl" style={{ background: "var(--surface)" }} />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--foreground-soft)" }}>
          Vigtigste kontakter
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {contacts.map((c) => <ContactCard key={c.id} contact={c} />)}
        </div>
      </div>
    </section>
  )
}
