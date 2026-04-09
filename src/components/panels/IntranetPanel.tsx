"use client"

import { useRouter } from "next/navigation"
import { createContext, useContext, type ComponentType, type CSSProperties } from "react"
import { ArrowLeft, Info, ChevronRight } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { IntranetSection, ContentBlock } from "@/lib/intranet-static"

// ─── Icon renderer ─────────────────────────────────────────────────────────────

function IconRenderer({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  const iconMap = LucideIcons as unknown as Record<string, ComponentType<{ className?: string; style?: CSSProperties }>>
  const Icon = iconMap[name] ?? LucideIcons.Info
  return <Icon className={className} style={style} />
}

// ─── Navigation context ────────────────────────────────────────────────────────

const NavContext = createContext<((key: string) => void) | null>(null)

// ─── Content renderer ─────────────────────────────────────────────────────────

function ContentRenderer({ blocks, accentColor }: { blocks: ContentBlock[]; accentColor: string }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)", lineHeight: "1.8" }}>
              {block.text}
            </p>
          )
        }

        if (block.type === "subheading") {
          return (
            <div key={i} className="flex items-center gap-3 pt-2">
              <div className="h-4 w-0.5 shrink-0 rounded-full" style={{ background: accentColor }} />
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
                {block.text}
              </h3>
            </div>
          )
        }

        if (block.type === "list") {
          return (
            <ul key={i} className="flex flex-col gap-2 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <ChevronRight className="mt-[3px] h-3.5 w-3.5 shrink-0" style={{ color: accentColor, opacity: 0.7 }} />
                  <span className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)", lineHeight: "1.75" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === "note") {
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
              style={{
                background: `${accentColor}0d`,
                boxShadow: "var(--panel-shadow-soft)",
              }}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)", lineHeight: "1.75" }}>
                {block.text}
              </p>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// ─── Hub card ─────────────────────────────────────────────────────────────────

function HubCard({ section, onClick }: { section: IntranetSection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-3xl text-left cursor-pointer transition-all duration-300 active:scale-[0.98] hover:-translate-y-1"
      style={{
        background: "linear-gradient(160deg, var(--surface-soft) 0%, var(--surface) 100%)",
        boxShadow: "var(--panel-shadow-soft)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${section.accentColor}40` }}
      />

      {/* Colored top band */}
      <div
        className="relative flex items-center justify-center py-8"
        style={{ background: `${section.accentColor}18` }}
      >
        <div
          className="flex h-15 w-15 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: section.iconBg, color: section.iconColor }}
        >
          <IconRenderer name={section.icon} className="h-7 w-7" />
        </div>
      </div>

      {/* Text area */}
      <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
          {section.title}
        </p>
        <p className="text-[11px] leading-snug line-clamp-2" style={{ color: "var(--foreground-muted)", opacity: 0.95 }}>
          {section.subtitle}
        </p>
      </div>
    </button>
  )
}

// ─── Hub view ─────────────────────────────────────────────────────────────────

function HubView({ sections }: { sections: IntranetSection[] }) {
  const navigate = useContext(NavContext)

  return (
    <div className="flex flex-col gap-7">
      <p className="max-w-3xl text-sm" style={{ color: "var(--foreground-muted)", lineHeight: "1.75" }}>
        Alt du behøver som lærling – løn, befordring, fravær og meget mere.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sections.map((section) => (
          <HubCard key={section.key} section={section} onClick={() => navigate?.(section.key)} />
        ))}
      </div>
    </div>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function DetailView({ section, onBack }: { section: IntranetSection; onBack: () => void }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start rounded-xl px-3 py-2 text-xs font-semibold transition-opacity duration-200 hover:opacity-70 active:scale-95 cursor-pointer"
        style={{
          background: "var(--surface-soft)",
          color: "var(--foreground-muted)",
          boxShadow: "var(--panel-shadow-soft)",
        }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tilbage
      </button>

      {/* Hero card */}
      <div
        className="relative flex items-center gap-5 overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(165deg, var(--surface-soft) 0%, var(--surface) 100%)",
          boxShadow: "var(--panel-shadow)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
          style={{ background: `${section.accentColor}35` }}
        />
        <div
          className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: section.iconBg, color: section.iconColor }}
        >
          <IconRenderer name={section.icon} className="h-8 w-8" />
        </div>
        <div className="relative z-10">
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
        className="rounded-3xl p-6"
        style={{
          background: "var(--surface-soft)",
          boxShadow: "var(--panel-shadow-soft)",
        }}
      >
        <ContentRenderer blocks={section.blocks} accentColor={section.accentColor} />
      </div>
    </div>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

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
