"use client"

import { useEffect, useMemo, useState } from "react"
import { Mail, Phone, ShieldCheck } from "lucide-react"

import type { Employee } from "@/types"

type PriorityContact = {
  name: string
  email: string
  phone?: string
  title: string
}

const CONTACT_ORDER: PriorityContact[] = [
  {
    name: "Kristian Kure",
    email: "kku@tec.dk",
    title: "Instruktør",
  },
  {
    name: "Casper Nordkvist Vestergaard",
    email: "cv@tec.dk",
    phone: "+45 2545 3757",
    title: "Instruktør",
  },
  {
    name: "Tuner Budanur",
    email: "tbu@tec.dk",
    phone: "+45 2545 3314",
    title: "Instruktør",
  },
  {
    name: "Mathias Casper Lynge Le-Holding",
    email: "mcll@tec.dk",
    title: "Instruktør",
  },
]

function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return { firstLine: name, secondLine: "" }
  return {
    firstLine: parts.slice(0, -1).join(" "),
    secondLine: parts[parts.length - 1],
  }
}

function toDisplayContact(base: PriorityContact, match?: Employee): PriorityContact {
  if (!match) return base
  return {
    name: match.name,
    email: match.email,
    phone: match.phone ?? base.phone,
    title: "Instruktør",
  }
}

export function ContactsPanel() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/employees", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((data) => {
        setEmployees(Array.isArray(data.employees) ? data.employees : [])
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false))
  }, [])

  const contacts = useMemo(() => {
    const instructorEmployees = employees.filter((employee) => employee.title.trim() === "Instruktør")

    return CONTACT_ORDER.map((contact) => {
      const match = instructorEmployees.find(
        (employee) =>
          employee.email.toLowerCase() === contact.email.toLowerCase() ||
          employee.name.toLowerCase() === contact.name.toLowerCase(),
      )
      return toDisplayContact(contact, match)
    })
  }, [employees])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-[28px]" style={{ background: "var(--surface)" }} />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="contact-hero">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: "#8ab4ff" }}>
            Kontakter
          </p>
          <h2 className="mt-2 text-2xl font-bold" style={{ color: "#edf4ff" }}>
            Vigtigste instruktører
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "#8ea6c8" }}>
            De vigtigste kontaktpersoner er samlet her, så de er hurtige at finde på skærmen.
          </p>
        </div>
        <div className="contact-hero-badge">
          <ShieldCheck className="h-4 w-4" />
          Prioriterede kontakter
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {contacts.map((contact) => {
          const { firstLine, secondLine } = splitName(contact.name)

          return (
            <article key={contact.email} className="priority-contact-card">
              <div className="priority-contact-card-top">
                <span className="priority-contact-chip">Instruktør</span>
              </div>

              <div className="space-y-1">
                <p className="priority-contact-name">{firstLine}</p>
                {secondLine ? <p className="priority-contact-name">{secondLine}</p> : null}
              </div>

              <p className="priority-contact-title">{contact.title}</p>

              <div className="priority-contact-details">
                <div className="priority-contact-row">
                  <span className="priority-contact-label">Email</span>
                  <a href={`mailto:${contact.email}`} className="priority-contact-value">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                </div>

                {contact.phone ? (
                  <div className="priority-contact-row">
                    <span className="priority-contact-label">Telefon</span>
                    <a href={`tel:${contact.phone}`} className="priority-contact-value">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{contact.phone}</span>
                    </a>
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
