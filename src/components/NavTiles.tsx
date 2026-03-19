"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  TILE_DEFINITIONS,
  type TileConfig,
} from "@/lib/tiles-config"

export function NavTiles() {
  const [config, setConfig] = useState<TileConfig[] | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await fetch("/api/tiles-config", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as TileConfig[]
        if (mounted && Array.isArray(data)) setConfig(data)
      } catch { /* keep hidden until next attempt */ }
    }

    void load()
    const id = setInterval(load, 2 * 60 * 1000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  if (config === null) {
    return <div className="shrink-0 nav-tiles" style={{ minHeight: "88px" }} />
  }

  const visible = config
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ cfg: c, def: TILE_DEFINITIONS.find((d) => d.id === c.id) }))
    .filter((t): t is { cfg: TileConfig; def: (typeof TILE_DEFINITIONS)[number] } =>
      t.def !== undefined
    )

  if (visible.length === 0) return null

  return (
    <div className="shrink-0 nav-tiles">
      {/* subtle gradient separator */}
      <div className="nav-tiles-separator" />

      <div className="flex w-full items-stretch gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5">
        {visible.map(({ cfg, def }) => {
          const Icon = def.icon
          return (
            <Link
              key={def.id}
              href={def.href}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-2",
                "rounded-xl px-2 py-3 sm:rounded-2xl sm:py-4",
                "transition-colors duration-200 ease-out",
                "nav-tile-card",
                def.iconBg,
              )}
            >
              {/* icon container */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                  def.iconWrapBg,
                )}
              >
                {def.logoSrc ? (
                  <Image
                    src={def.logoSrc}
                    alt={def.logoAlt ?? cfg.label}
                    width={20}
                    height={20}
                    className="h-full w-full rounded-[3px] object-fill"
                  />
                ) : (
                  <Icon className="h-5 w-5 nav-tile-icon-color drop-shadow-sm" />
                )}
              </div>

              {/* label */}
              <span
                className={cn(
                  "w-full truncate text-center font-semibold tracking-wide",
                  "text-[9px] leading-tight sm:text-[11px]",
                  "nav-tile-label",
                )}
              >
                {cfg.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
