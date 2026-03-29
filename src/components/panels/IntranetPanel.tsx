"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createContext, useContext, type ComponentType, type CSSProperties } from "react"
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { IntranetSection } from "@/lib/intranet-static"

// ─── Icon renderer ─────────────────────────────────────────────────────────────

function IconRenderer({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  const iconMap = LucideIcons as unknown as Record<string, ComponentType<{ className?: string; style?: CSSProperties }>>
  const Icon = iconMap[name] ?? LucideIcons.Info
  return <Icon className={className} style={style} />
}

// ─── Navigation context ────────────────────────────────────────────────────────

const NavContext = createContext<((key: string) => void) | null>(null)

// ─── Hub view ─────────────────────────────────────────────────────────────────

function HubView({ sections }: { sections: IntranetSection[] }) {
  const navigate = useContext(NavContext)

  return (
    <div className="flex flex-col">
      {/* Intro */}
      <div className="mb-6">
        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          Alt du behøver som lærling – løn, befordring, fravær og meget mere.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => navigate?.(section.key)}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "var(--surface-soft)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Icon */}
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: section.iconBg, color: section.iconColor }}
            >
              <IconRenderer name={section.icon} className="h-5 w-5" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                {section.title}
              </p>
              <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--foreground-muted)" }}>
                {section.subtitle}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1" style={{ color: section.accentColor }}>
              <span className="text-[11px] font-semibold">Læs mere</span>
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function DetailView({ section, onBack }: { section: IntranetSection; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 hover:opacity-70"
        style={{
          background: "var(--surface-soft)",
          color: "var(--foreground-muted)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tilbage
      </button>

      {/* Hero card */}
      <div
        className="flex items-center gap-5 rounded-2xl p-6"
        style={{
          background: "var(--surface-soft)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: section.iconBg, color: section.iconColor }}
        >
          <IconRenderer name={section.icon} className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {section.title}
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: "var(--foreground-muted)" }}>
            {section.subtitle}
          </p>
        </div>
      </div>

      {/* Content card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--surface-soft)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)", lineHeight: "1.75" }}>
          {section.content}
        </p>

        <div className="mt-6 pt-4" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
          <Link
            href={`/intranet/${section.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-80 active:scale-[0.98]"
            style={{
              background: section.iconBg,
              color: section.iconColor,
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Åbn fuld side
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function IntranetPanel({ sections }: { sections: IntranetSection[] }) {
  const router = useRouter()
  return (
    <NavContext.Provider value={(key) => router.push(`/intranet/${key}`)}>
      <HubView sections={sections} />
    </NavContext.Provider>
  )
}

export function IntranetSectionPage({
  sectionKey,
  sections,
}: {
  sectionKey: string
  sections: IntranetSection[]
}) {
  const router = useRouter()
  const section = sections.find((s) => s.key === sectionKey)
  if (!section) return null
  return <DetailView section={section} onBack={() => router.push("/intranet")} />
}
