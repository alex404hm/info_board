import { NextResponse } from "next/server"
import { 
  fetchKanplaData,
  formatPriceDkk,
  toDateKeyInCopenhagen,
} from "@/lib/kanpla-api"

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

export async function GET() {
  try {
    const data = await fetchKanplaData()
    const modulesById = new Map((data.modules ?? []).map((m) => [m.id, m.name ?? "Ukendt modul"]))
    const todayKey = toDateKeyInCopenhagen(Math.floor(Date.now() / 1000))

    const moduleItems = new Map<string, CanteenItem[]>()

    for (const [moduleId, offer] of Object.entries(data.offers ?? {})) {
      const moduleName = modulesById.get(moduleId) ?? "Ukendt modul"

      for (const item of offer.items ?? []) {
        const typeName = item.name ?? ""
        // Kanpla prices are in øre (e.g. 3500 = 35.00 kr)
        const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : (item.basePrice ?? null)
        const dates = item.dates ?? {}

        let todayMenu: { name?: string; description?: string } | null = null
        let isAvailableToday = false

        for (const [dateKey, dateValue] of Object.entries(dates)) {
          const dateSeconds = Number(dateKey)
          if (!Number.isFinite(dateSeconds)) continue
          if (toDateKeyInCopenhagen(dateSeconds) !== todayKey) continue
          if (!dateValue?.available) continue

          isAvailableToday = true
          if (dateValue.menu?.name?.trim()) {
            todayMenu = dateValue.menu
          }
          break
        }

        if (!isAvailableToday) continue

        const displayName = todayMenu?.name?.trim() || typeName
        const description = todayMenu?.description?.trim() || ""

        const lower = displayName.toLowerCase()
        if (/god\s*(fredag|weekend)|lukket|producerer\s+ikke|serveres\s+ikke|ferie|helligdag/.test(lower)) {
          continue
        }

        const canteenItem: CanteenItem = {
          name: displayName,
          description,
          price: formatPriceDkk(unitPrice, item.unitSystem),
          imageUrl: item.photo ?? null,
          type: typeName,
        }

        const existing = moduleItems.get(moduleName)
        if (existing) {
          existing.push(canteenItem)
        } else {
          moduleItems.set(moduleName, [canteenItem])
        }
      }
    }

    const modules: CanteenModule[] = []
    for (const [name, items] of moduleItems) {
      modules.push({ name, items })
    }

    return NextResponse.json({ modules })
  } catch (error) {
    console.error("Canteen API error:", error)
    return NextResponse.json(
      { 
        error: "Could not read canteen data from Kanpla API",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
