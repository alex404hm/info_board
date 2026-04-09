"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, UtensilsCrossed, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

type CanteenItem     = { name: string; price: string; category: string }
type CanteenResponse = { items: CanteenItem[]; error?: string }
type SortDir         = "asc" | "desc" | null

const CANTEEN_CATEGORIES = [
  { key: "Drikkevarer",   slug: "drikkevarer",  label: "Drikkevarer",  image: "/logo/drikkevarer.png", color: "#38bdf8" },
  { key: "Morgenmad",    slug: "morgenmad",     label: "Morgenmad",    image: "/logo/morgenmad.jpg",    color: "#fbbf24" },
  { key: "Varme drikke", slug: "varme-drikke",  label: "Varme drikke", image: "/logo/varmedrikke.jpg",  color: "#fb923c" },
  { key: "Diverse",      slug: "diverse",       label: "Diverse",      image: "/logo/diverse.jpeg",     color: "#c4b5fd" },
] as const

// Uniform price badge — same color for all categories
const PRICE_COLOR  = "#38bdf8"
const PRICE_BG     = "rgba(56, 189, 248, 0.094)"
const PRICE_BORDER = "rgba(56, 189, 248, 0.208)"

const HOVER_BORDER = "rgba(59, 130, 246, 0.95)"

function parsePrice(p: string) {
  const m = p.match(/(\d+),(\d+)/)
  if (m) return parseFloat(`${m[1]}.${m[2]}`)
  const m2 = p.match(/(\d+)/)
  return m2 ? parseFloat(m2[1]) : 0
}

// ─── Shared data hook ─────────────────────────────────────────────────────────

function useCanteenData() {
  const [data, setData]       = useState<CanteenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

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

  return { data, loading, error }
}

// ─── Grid / hub view ─────────────────────────────────────────────────────────

export function CanteenGrid() {
  const { data, loading, error } = useCanteenData()
  const router = useRouter()

  const countFor = useMemo(() => {
    const map: Record<string, number> = {}
    if (!data?.items) return map
    for (const item of data.items) {
      const hit = CANTEEN_CATEGORIES.find(c => c.key === item.category)
      const slug = hit ? hit.slug : "diverse"
      map[slug] = (map[slug] ?? 0) + 1
    }
    return map
  }, [data])

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

  return (
    <div className="flex flex-1 overflow-y-auto custom-scrollbar" style={{ background: "var(--background)" }}>
      <div className="m-auto w-full max-w-[1400px] p-6 md:p-10">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {CANTEEN_CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => router.push(`/kantine/${cat.slug}`)}
              className="group flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-200 ease-out active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid transparent" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = "var(--surface-soft)"
                el.style.borderColor = HOVER_BORDER
                el.style.boxShadow = `0 0 0 1px ${HOVER_BORDER}`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = "var(--surface)"
                el.style.borderColor = "transparent"
                el.style.boxShadow = "none"
              }}
            >
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
              </div>
              <div className="px-4 py-3.5">
                <p className="truncate text-base font-bold" style={{ color: "var(--foreground)" }}>{cat.label}</p>
                {countFor[cat.slug] != null && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--foreground-muted)" }}>{countFor[cat.slug]} varer</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Detail view ─────────────────────────────────────────────────────────────

export function CanteenDetail({ slug }: { slug: string }) {
  const { data, loading, error } = useCanteenData()
  const router = useRouter()
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const cat = CANTEEN_CATEGORIES.find(c => c.slug === slug)

  const visibleItems = useMemo(() => {
    if (!data?.items || !cat) return []
    const defined = new Set<string>(CANTEEN_CATEGORIES.map(c => c.key))
    let list = cat.slug === "diverse"
      ? data.items.filter(i => !defined.has(i.category) || i.category === "Diverse")
      : data.items.filter(i => i.category === (cat.key as string))
    if (sortDir === "asc")  list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
    if (sortDir === "desc") list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
    return list
  }, [data, cat, sortDir])

  const SortIcon = sortDir === "asc" ? ArrowUp : sortDir === "desc" ? ArrowDown : ArrowUpDown

  if (!cat) return null

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* Hero image */}
      <div className="relative h-60 shrink-0 overflow-hidden">
        <Image src={cat.image} alt={cat.label} fill className="object-cover" priority sizes="100vw" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.78) 100%)" }}
        />

        {/* Back button */}
        <div className="absolute inset-x-0 top-0 px-5 pt-4">
          <button
            onClick={() => router.push("/kantine")}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-95"
            style={{ background: "var(--surface-soft)", border: "1px solid var(--surface-border)", color: "var(--foreground-muted)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tilbage
          </button>
        </div>

        {/* Category title */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <p className="text-3xl font-black tracking-tight text-white drop-shadow-lg">{cat.label}</p>
          {visibleItems.length > 0 && (
            <p className="mt-1 text-sm font-medium text-white/60">{visibleItems.length} varer</p>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div
        className="flex shrink-0 items-center justify-end px-5 py-3 md:px-10"
        style={{ background: "var(--surface-muted)" }}
      >
        <button
          onClick={() => setSortDir(d => d === null ? "asc" : d === "asc" ? "desc" : null)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95"
          style={sortDir
            ? { background: `${PRICE_COLOR}22`, border: `1px solid ${PRICE_COLOR}55`, color: PRICE_COLOR }
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
            <div>
              {visibleItems.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="flex items-center gap-4 py-3.5"
                  style={{
                    borderBottom: idx < visibleItems.length - 1 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PRICE_COLOR }} />
                  <span className="flex-1 text-sm font-medium leading-snug" style={{ color: "var(--foreground)" }}>
                    {item.name}
                  </span>
                  <span
                    className="shrink-0 rounded-lg px-3 py-1 text-xs font-bold tabular-nums"
                    style={{ color: PRICE_COLOR, background: PRICE_BG, border: `1px solid ${PRICE_BORDER}` }}
                  >
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

