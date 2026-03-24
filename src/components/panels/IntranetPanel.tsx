"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createContext, useContext, useState, useMemo } from "react"
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  MapPin,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

// ── Types ─────────────────────────────────────────────────────────────────────

export type IntranetPageData = {
  id: string
  key: string
  title: string
  subtitle: string | null
  icon: string
  iconColor: string
  iconBg: string
  bgFrom: string
  bgTo: string
  glowA: string
  glowB: string
  accentColor: string
  content: string
  order: number
  updatedAt: Date
}

// ── In-app browser context ────────────────────────────────────────────────────

const OpenUrlContext = createContext<((url: string) => void) | null>(null)

// ── Icon Renderer ─────────────────────────────────────────────────────────────

function IconRenderer({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Info
  return <IconComponent className={className} style={style} />
}

// ── In-app browser overlay ────────────────────────────────────────────────────

function InAppBrowser({ url, onBack }: { url: string; onBack: () => void }) {
  const domain = (() => {
    try { return new URL(url).hostname.replace(/^www\./, "") }
    catch { return url }
  })()

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
      }}
    >
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: "var(--surface-muted)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95"
          style={{
            background: "var(--surface-soft)",
            border: "1px solid var(--surface-border)",
            color: "var(--foreground-muted)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbage
        </button>
        <span className="truncate text-xs" style={{ color: "var(--foreground-soft)" }}>{domain}</span>
      </div>
      <iframe src={url} className="flex-1 w-full border-0" title={domain} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" />
    </div>
  )
}

// ── Shared UI components ──────────────────────────────────────────────────────

function InfoBox({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const s = {
    info: { bg: "rgba(95,157,255,0.08)", border: "rgba(95,157,255,0.28)", icon: <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#5f9dff" }} /> },
    warning: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.32)", icon: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f97316" }} /> },
    success: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.28)", icon: <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} /> },
  }[type]
  return (
    <div className="flex gap-2.5 rounded-xl p-3.5 text-sm leading-relaxed" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      {s.icon}
      <div style={{ color: "var(--foreground-muted)" }}>{children}</div>
    </div>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest first:mt-0" style={{ color: "var(--foreground-soft)" }}>
      <ChevronRight className="h-3 w-3 shrink-0" />
      {children}
    </h3>
  )
}

function BulletList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-1.5">
      {children}
    </ul>
  )
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
      <span>{children}</span>
    </li>
  )
}

function LinkPill({ href, children, internal = false }: { href: string; children: React.ReactNode; internal?: boolean }) {
  const openUrl = useContext(OpenUrlContext)
  const baseStyle = { color: "var(--accent)", border: "1px solid rgba(95,157,255,0.22)", background: "rgba(95,157,255,0.06)" }
  const className = "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5 active:scale-95"

  if (internal) {
    return (
      <Link href={href} className={className} style={baseStyle}>
        {children}
        <ExternalLink className="h-3 w-3 opacity-60" />
      </Link>
    )
  }
  return (
    <button onClick={() => openUrl?.(href)} className={className} style={baseStyle}>
      {children}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  )
}

// ── Markdown Renderer ─────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-6">{children}</h2>,
          h3: ({ children }) => <H3>{children}</H3>,
          h4: ({ children }) => <h4 className="text-sm font-bold mb-2 mt-4" style={{ color: "var(--foreground)" }}>{children}</h4>,
          p: ({ children }) => {
            const text = children?.toString() || ""
            if (text.startsWith("!! ")) {
              return <InfoBox type="warning">{text.slice(3)}</InfoBox>
            }
            if (text.startsWith("*** ")) {
              return <InfoBox type="success">{text.slice(4)}</InfoBox>
            }
            return <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{children}</p>
          },
          ul: ({ children }) => <BulletList>{children}</BulletList>,
          li: ({ children }) => <BulletItem>{children}</BulletItem>,
          blockquote: ({ children }) => <InfoBox type="info">{children}</InfoBox>,
          a: ({ href, children }) => {
            const isInternal = href?.startsWith("/")
            return <LinkPill href={href || "#"} internal={isInternal}>{children}</LinkPill>
          },
          strong: ({ children }) => <strong className="font-bold" style={{ color: "var(--foreground)" }}>{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl my-4" style={{ border: "1px solid var(--surface-border)" }}>
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--surface-border)" }}>{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>{children}</th>,
          tr: ({ children }) => <tr className="border-b last:border-0 border-[var(--surface-border)]" style={{ background: "transparent" }}>{children}</tr>,
          td: ({ children }) => <td className="px-4 py-2.5 text-sm" style={{ color: "var(--foreground-muted)" }}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ── Detail view ────────────────────────────────────────────────────────────────

function DetailView({ cat, onBack }: { cat: IntranetPageData; onBack: () => void }) {
  return (
    <div>
      <div className="mb-5 flex items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95"
          style={{ background: "var(--surface-soft)", border: "1px solid var(--surface-border)", color: "var(--foreground-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbage
        </button>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-2xl px-6 py-7" style={{ background: `linear-gradient(135deg, ${cat.bgFrom}, ${cat.bgTo})` }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ background: cat.glowA }} />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-2xl" style={{ background: cat.glowB }} />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: cat.iconBg, border: "1px solid rgba(255,255,255,0.16)", boxShadow: `0 0 24px ${cat.glowA}` }}>
            <IconRenderer name={cat.icon} className="h-7 w-7" style={{ color: cat.iconColor }} />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight text-white">{cat.title}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{cat.subtitle}</p>
          </div>
        </div>
      </div>

      <MarkdownContent content={cat.content} />

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(95,157,255,0.1)" }}>
          <MapPin className="h-4 w-4" style={{ color: "#5f9dff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Spørgsmål?</p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Kontakt studieadministrationen eller din uddannelsesvejleder på TEC.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkPill href="/kontakter" internal>Kontakter</LinkPill>
          <LinkPill href="https://www.tec.dk">tec.dk</LinkPill>
        </div>
      </div>
    </div>
  )
}

// ── Hub view ───────────────────────────────────────────────────────────────────

function HubView({ categories }: { categories: IntranetPageData[] }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--foreground)" }}>Intranet</h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--foreground-muted)" }}>Løn, befordring, læreplads og rettigheder for lærlinge</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.key}
            href={`/intranet/${cat.key}`}
            className="group flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
            style={{ background: "var(--surface)", border: "1px solid var(--surface-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = cat.accentColor + "66"
              el.style.boxShadow = `0 0 0 1px ${cat.accentColor}44, 0 4px 20px ${cat.accentColor}22`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = "var(--surface-border)"
              el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.18)"
            }}
          >
            <div className="relative flex items-center justify-center overflow-hidden" style={{ aspectRatio: "4/3", background: `linear-gradient(145deg, ${cat.bgFrom}, ${cat.bgTo})` }}>
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl" style={{ background: cat.glowA }} />
              <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full blur-2xl" style={{ background: cat.glowB }} />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: cat.iconBg, border: "1px solid rgba(255,255,255,0.14)", boxShadow: `0 0 20px ${cat.glowA}` }}>
                <IconRenderer name={cat.icon} className="h-8 w-8" style={{ color: cat.iconColor }} />
              </div>
            </div>
            <div className="px-4 py-3.5" style={{ borderTop: "1px solid var(--surface-border)" }}>
              <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{cat.title}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: "var(--foreground-muted)" }}>{cat.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main exports ────────────────────────────────────────────────────────────────

export function IntranetPanel({ categories }: { categories: IntranetPageData[] }) {
  return <HubView categories={categories} />
}

export function IntranetSectionPage({ sectionKey, categories }: { sectionKey: string; categories: IntranetPageData[] }) {
  const [browserUrl, setBrowserUrl] = useState<string | null>(null)
  const router = useRouter()
  const cat = categories.find((c) => c.key === sectionKey)
  if (!cat) return null

  return (
    <OpenUrlContext.Provider value={setBrowserUrl}>
      {browserUrl && <InAppBrowser url={browserUrl} onBack={() => setBrowserUrl(null)} />}
      <DetailView cat={cat} onBack={() => router.push("/intranet")} />
    </OpenUrlContext.Provider>
  )
}
