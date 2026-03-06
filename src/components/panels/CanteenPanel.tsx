"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2, UtensilsCrossed } from "lucide-react"

type CanteenItem = {
  name: string
  description: string
  price: string
  imageUrl: string | null
  type: string
}

type CanteenModule = {
  name: string
  items: CanteenItem[]
}

type CanteenResponse = {
  modules: CanteenModule[]
  error?: string
}

export function CanteenPanel() {
  const [data, setData] = useState<CanteenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/canteen")
        if (!res.ok) throw new Error("Kunne ikke hente menu")
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fejl")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const totalItems =
    data?.modules?.reduce((s, m) => s + m.items.length, 0) ?? 0

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        <p className="text-sm text-white/40">Henter menu…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    )
  }

  if (!data || totalItems === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <UtensilsCrossed className="h-8 w-8 text-white/20" />
        <p className="text-sm text-white/40">Ingen retter tilgængelige</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {data.modules.map((mod) => (
        <div key={mod.name}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
            {mod.name}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mod.items.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="ib-panel-soft overflow-hidden"
              >
                {item.imageUrl ? (
                  <div className="relative h-36 w-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center bg-amber-500/10">
                    <UtensilsCrossed className="h-6 w-6 text-amber-500/30" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[15px] font-semibold text-white/90">
                      {item.name}
                    </h4>
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                      {item.price}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
