"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  LayoutGrid,
  Save,
  CheckCircle,
  RefreshCw,
  Monitor,
  RotateCcw,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import {
  TILE_DEFINITIONS,
  DEFAULT_TILE_CONFIG,
  type TileConfig,
  type TileId,
} from "@/lib/tiles-config"

// ── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        checked ? "bg-emerald-500" : "bg-[color:var(--surface-soft)]",
        disabled ? "opacity-40 cursor-not-allowed grayscale-[0.5]" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  )
}

// ── Tile preview (mirrors NavTiles on the board) ─────────────────────────────

function TilePreview({ config }: { config: TileConfig[] }) {
  const visible = config
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ cfg: c, def: TILE_DEFINITIONS.find((d) => d.id === c.id) }))
    .filter(
      (t): t is { cfg: TileConfig; def: (typeof TILE_DEFINITIONS)[number] } =>
        t.def !== undefined,
    )

  const count = visible.length

  function layoutClass(n: number) {
    if (n <= 3) return "flex justify-center gap-2"
    if (n === 4) return "grid grid-cols-4 gap-2"
    if (n === 5) return "grid grid-cols-5 gap-2"
    return "grid grid-cols-6 gap-2"
  }

  if (count === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Ingen paneler synlige — aktiver mindst ét ovenfor.
      </p>
    )
  }

  return (
    <div className={layoutClass(count)}>
      {visible.map(({ cfg, def }) => {
        const Icon = def.icon
        return (
          <div
            key={def.id}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl px-3 py-3",
              "border border-white/[0.09] bg-white/[0.04]",
              count <= 3 && "w-32",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                def.iconBg,
              )}
            >
              {def.logoSrc ? (
                <Image
                  src={def.logoSrc}
                  alt={def.logoAlt ?? cfg.label}
                  width={18}
                  height={18}
                  className="h-full w-full rounded-md object-fill"
                />
              ) : (
                <Icon className="h-4 w-4 text-foreground" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-foreground">
              {cfg.label || def.defaultLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DisplayPage() {
  const [config, setConfig] = useState<TileConfig[]>(DEFAULT_TILE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Drag state
  const dragItem = useRef<TileId | null>(null)
  const dragOverItem = useRef<TileId | null>(null)
  const [draggingId, setDraggingId] = useState<TileId | null>(null)
  const [dragOverId, setDragOverId] = useState<TileId | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tiles-config", { cache: "no-store" })
        if (res.ok) {
          const data = (await res.json()) as TileConfig[]
          if (Array.isArray(data)) setConfig(data)
        }
      } catch { /* keep defaults */ }
      setLoading(false)
    }
    void load()
  }, [])

  useUnsavedChangesGuard({
    enabled: dirty,
    title: "Er du sikker på, at du vil forlade siden?",
    description: "Hvis du forlader siden nu, mister du dine ændringer.",
    confirmText: "Forlad",
    cancelText: "Bliv og gem",
  })

  function update(id: TileId, patch: Partial<TileConfig>) {
    setConfig((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )
    setDirty(true)
    setSaved(false)
  }

  function resetToDefaults() {
    setConfig(DEFAULT_TILE_CONFIG)
    setDirty(true)
    setSaved(false)
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(id: TileId) {
    dragItem.current = id
    setDraggingId(id)
  }

  function handleDragEnter(id: TileId) {
    dragOverItem.current = id
    setDragOverId(id)
  }

  function handleDrop() {
    const fromId = dragItem.current
    const toId = dragOverItem.current
    if (!fromId || !toId || fromId === toId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    setConfig((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const fromIdx = sorted.findIndex((c) => c.id === fromId)
      const toIdx = sorted.findIndex((c) => c.id === toId)
      const next = [...sorted]
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return next.map((c, i) => ({ ...c, order: i }))
    })

    setDirty(true)
    setSaved(false)
    dragItem.current = null
    dragOverItem.current = null
    setDraggingId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    dragItem.current = null
    dragOverItem.current = null
    setDraggingId(null)
    setDragOverId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/tiles-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setDirty(false)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const sorted = [...config].sort((a, b) => a.order - b.order)
  const visibleCount = config.filter((c) => c.visible).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visning og layout</h1>
          <p className="text-muted text-sm mt-1">
            Styr hvilke navigationsfelter der vises på infoskærmen, og tilpas deres navne og rækkefølge.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4" />
            Nulstil
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            variant={saved ? "outline" : "default"}
            className={saved ? "border-emerald-600/40 text-emerald-400" : ""}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Gemt
              </>
            ) : saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Gemmer…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Gem ændringer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tile configuration */}
      <div className="admin-panel overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60">
          <div className="w-9 h-9 bg-violet-400/10 rounded-lg flex items-center justify-center shrink-0">
            <LayoutGrid className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold">Navigationsfelter</h2>
            <p className="text-muted text-xs mt-0.5">
              {visibleCount} af {config.length} felter synlige · træk rækker for at ændre rækkefølge
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[color:var(--surface-soft)] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sorted.map((cfg) => {
              const def = TILE_DEFINITIONS.find((d) => d.id === cfg.id)
              if (!def) return null
              const Icon = def.icon
              const isDragging = draggingId === cfg.id
              const isDragTarget = dragOverId === cfg.id && draggingId !== cfg.id

              return (
                <div
                  key={cfg.id}
                  draggable
                  onDragStart={() => handleDragStart(cfg.id)}
                  onDragEnter={() => handleDragEnter(cfg.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition-all duration-150 select-none",
                    cfg.visible ? "bg-[color:var(--surface)]" : "bg-[color:var(--surface-muted)]",
                    isDragging && "opacity-40",
                    isDragTarget && "ring-2 ring-inset ring-emerald-500/60 bg-emerald-950/20",
                  )}
                >
                  {/* Drag handle */}
                  <div className="shrink-0 cursor-grab active:cursor-grabbing text-soft hover:text-muted transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Icon preview */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity",
                      def.iconBg,
                      !cfg.visible && "opacity-40",
                    )}
                  >
                    {def.logoSrc ? (
                      <Image
                        src={def.logoSrc}
                        alt={def.logoAlt ?? def.defaultLabel}
                        width={22}
                        height={22}
                        className="h-full w-full rounded-lg object-fill"
                      />
                    ) : (
                      <Icon className="h-5 w-5 text-foreground" />
                    )}
                  </div>

                  {/* Name + label input */}
                  <div className="flex flex-1 min-w-0 flex-col gap-1">
                    <span
                      className={cn(
                        "text-xs font-medium uppercase tracking-wider",
                        cfg.visible ? "text-muted" : "text-soft",
                      )}
                    >
                      {def.defaultLabel}
                    </span>
                    <input
                      type="text"
                      value={cfg.label}
                      onChange={(e) => update(cfg.id, { label: e.target.value })}
                      placeholder={def.defaultLabel}
                      disabled={!cfg.visible}
                      className={cn(
                        "w-full max-w-xs rounded-md border px-3 py-1.5 text-sm transition-colors",
                        "admin-input",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
                        !cfg.visible && "opacity-40 cursor-not-allowed",
                      )}
                    />
                  </div>

                  {/* Visibility badge */}
                  <div className="shrink-0 flex items-center gap-2.5">
                    {cfg.visible ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <Eye className="w-3.5 h-3.5" />
                        Synlig
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                        <EyeOff className="w-3.5 h-3.5" />
                        Skjult
                      </span>
                    )}
                    <Toggle
                      checked={cfg.visible}
                      onChange={(v) => update(cfg.id, { visible: v })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Live preview removed as requested */}
    </div>
  )
}
