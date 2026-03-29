import { INTRANET_SECTIONS } from "@/lib/intranet-static"
import {
  BookOpen, Bus, Briefcase, Shield, HeartPulse, CalendarOff, Banknote, Info,
  ExternalLink, type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  Bus, Briefcase, BookOpen, Shield, HeartPulse, CalendarOff, Banknote, Info,
}

function SectionCard({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  accentColor,
  content,
  sectionKey,
}: {
  title: string
  subtitle: string
  icon: string
  iconColor: string
  iconBg: string
  accentColor: string
  content: string
  sectionKey: string
}) {
  const Icon = ICON_MAP[icon] ?? Info

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-all hover:border-border hover:shadow-md">
      {/* Accent top bar */}
      <div className="h-0.5 w-full" style={{ background: accentColor }} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: iconBg, color: iconColor }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <a
            href={`/intranet/${sectionKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Se side"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Preview text */}
        <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {content}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border/40 pt-3">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{ background: iconBg, color: iconColor }}
          >
            {sectionKey}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
            Aktiv
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminIntranetPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Intranet</h1>
          <p className="text-xs text-muted-foreground">
            {INTRANET_SECTIONS.length} statiske informationssider
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <p className="text-blue-300/80">
          Intranet-siderne er statiske og vedligeholdes direkte i koden. Klik på{" "}
          <ExternalLink className="inline h-3.5 w-3.5" /> for at se siden på infoskærmen.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTRANET_SECTIONS.map((section) => (
          <SectionCard
            key={section.key}
            title={section.title}
            subtitle={section.subtitle}
            icon={section.icon}
            iconColor={section.iconColor}
            iconBg={section.iconBg}
            accentColor={section.accentColor}
            content={section.content}
            sectionKey={section.key}
          />
        ))}
      </div>
    </div>
  )
}
