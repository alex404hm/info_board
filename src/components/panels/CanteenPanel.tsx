"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, UtensilsCrossed, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Image from "next/image"

type CanteenItem     = { name: string; price: string; category: string }
type CanteenResponse = { items: CanteenItem[]; error?: string }
type SortDir         = "asc" | "desc" | null

const CATEGORIES = [
  { key: "Drikkevarer",  label: "Drikkevarer",  image: "/logo/drikkevarer.png", color: "#38bdf8", hoverBorder: "rgba(56,189,248,0.6)"  },
  { key: "Morgenmad",   label: "Morgenmad",    image: "/logo/morgenmad.jpg",    color: "#fbbf24", hoverBorder: "rgba(251,191,36,0.6)"  },
  { key: "Varme drikke",label: "Varme drikke", image: "/logo/varmedrikke.jpg",  color: "#fb923c", hoverBorder: "rgba(251,146,60,0.6)"  },
  { key: "Diverse",     label: "Diverse",      image: "/logo/diverse.jpeg",     color: "#c4b5fd", hoverBorder: "rgba(196,181,253,0.6)" },
] as const

type CategoryKey = (typeof CATEGORIES)[number]["key"]

function parsePrice(p: string) { const m = p.match(/(\d+\.?\d*)/); return m ? parseFloat(m[1]) : 0 }
function formatPrice(price: string) {
  const m = price.match(/(\d+\.?\d*)\s*DKK/i)
  if (!m) return price
  const n = parseFloat(m[1])
  return `${n % 1 === 0 ? Math.floor(n) : n.toFixed(2)} kr`
}

interface CanteenPanelProps {
  onSelectionChange?: (hasSelection: boolean) => void
}

export function CanteenPanel({ onSelectionChange }: CanteenPanelProps) {
  const [data, setData]         = useState<CanteenResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<CategoryKey | null>(null)
  const [sortDir, setSortDir]   = useState<SortDir>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/canteen")
        if (!res.ok) throw new Error("Kunne ikke hente menuen")
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fejl")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function select(key: CategoryKey | null) {
    setSortDir(null)
    setSelected(key)
    onSelectionChange?.(key !== null)
  }

  const countFor = useMemo(() => {
    const map: Record<string, number> = {}
    if (!data?.items) return map
    for (const item of data.items) {
      const hit = CATEGORIES.find(c => c.key === item.category)
      const k   = hit ? item.category : "Diverse"
      map[k] = (map[k] ?? 0) + 1
    }
    return map
  }, [data])

  const visibleItems = useMemo(() => {
    if (!data?.items || !selected) return []
    const defined = new Set(CATEGORIES.map(c => c.key))
    let list = selected === "Diverse"
      ? data.items.filter(i => !defined.has(i.category) || i.category === "Diverse")
      : data.items.filter(i => i.category === selected)
    if (sortDir === "asc")  list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
    if (sortDir === "desc") list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
    return list
  }, [data, selected, sortDir])

  const activeCat = CATEGORIES.find(c => c.key === selected)
  const SortIcon  = sortDir === "asc" ? ArrowUp : sortDir === "desc" ? ArrowDown : ArrowUpDown

  if (loading) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin opacity-40" />
      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Henter menu…</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <UtensilsCrossed className="h-8 w-8 opacity-25" />
      <p className="text-xs text-red-400">{error}</p>
    </div>
  )

  /* ── Detail view ──────────────────────────────────────────────────────── */
  if (selected && activeCat) return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* Hero image — taller, back button only */}
      <div className="relative shrink-0 h-60 overflow-hidden">
        <Image src={activeCat.image} alt={activeCat.label} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.78) 100%)" }} />

        {/* Back button — top left */}
        <div className="absolute inset-x-0 top-0 px-5 pt-4">
          <button
            onClick={() => select(null)}
            className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/55 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tilbage
          </button>
        </div>

        {/* Category title — bottom left */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <p className="text-3xl font-black tracking-tight text-white drop-shadow-lg">{activeCat.label}</p>
          {visibleItems.length > 0 && (
            <p className="mt-1 text-sm font-medium text-white/60">{visibleItems.length} varer</p>
          )}
        </div>
      </div>

      {/* Sort bar — sits between hero and list */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 md:px-10"
        style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--surface-muted)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
          {visibleItems.length === 0 ? "Ingen varer" : `${visibleItems.length} varer`}
        </p>
        <button
          onClick={() => setSortDir(d => d === null ? "asc" : d === "asc" ? "desc" : null)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95"
          style={sortDir
            ? { background: `${activeCat.color}22`, border: `1px solid ${activeCat.color}55`, color: activeCat.color }
            : { background: "var(--surface-soft)", border: "1px solid var(--surface-border)", color: "var(--foreground-muted)" }
          }
        >
          <SortIcon className="h-3.5 w-3.5" />
          {sortDir === "asc" ? "Billigst først" : sortDir === "desc" ? "Dyrest først" : "Sorter pris"}
        </button>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: "var(--background)" }}>
        <div className="mx-auto w-full max-w-[860px] px-5 py-4 md:px-10">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <UtensilsCrossed className="h-10 w-10 opacity-20" />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Ingen varer i dag</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--surface-border)" }}>
              {visibleItems.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-center gap-4 py-3.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: activeCat.color }} />
                  <span className="flex-1 text-sm font-medium leading-snug" style={{ color: "var(--foreground)" }}>{item.name}</span>
                  <span
                    className="shrink-0 rounded-lg px-3 py-1 text-xs font-bold tabular-nums"
                    style={{ color: activeCat.color, background: `${activeCat.color}18`, border: `1px solid ${activeCat.color}35` }}
                  >
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  /* ── Category grid ────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-1 overflow-y-auto custom-scrollbar" style={{ background: "var(--background)" }}>
      <div className="m-auto w-full max-w-[1400px] p-6 md:p-10">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => select(cat.key)}
              className="group flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-200 ease-out active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = "var(--surface-soft)"
                el.style.borderColor = cat.hoverBorder
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = "var(--surface)"
                el.style.borderColor = "var(--surface-border)"
              }}
            >
              {/* Photo — taller aspect ratio */}
              <div className="relative overflow-hidden rounded-t-2xl" style={{ aspectRatio: "4/3" }}>
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(8,12,22,0.6) 100%)" }}
                />
                {/* Item count badge */}
                {countFor[cat.key] != null && (
                  <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)" }}>
                    {countFor[cat.key]}
                  </span>
                )}
              </div>

              {/* Label strip */}
              <div className="px-4 py-3.5" style={{ borderTop: "1px solid var(--surface-border)" }}>
                <p className="truncate text-base font-bold" style={{ color: "var(--foreground)" }}>{cat.label}</p>
                {countFor[cat.key] != null && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--foreground-muted)" }}>{countFor[cat.key]} varer</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
