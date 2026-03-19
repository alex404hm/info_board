import { NextResponse } from "next/server"

import { fetchKanplaData, formatPriceDkk, normalize, toDateKeyInCopenhagen, type KanplaItem } from "@/lib/kanpla-api"

type CanteenItem = {
  name: string
  price: string
  category: string
}

const PRIMARY_OFFER_ID = "n8JTISR5cgYOjM2dS4IE"

function isAvailableToday(item: KanplaItem) {
  const dates = item.dates ?? {}
  const todayKey = toDateKeyInCopenhagen(Math.floor(Date.now() / 1000))

  return Object.entries(dates).some(([dateSeconds, value]) => {
    const numericDate = Number(dateSeconds)
    if (!Number.isFinite(numericDate) || !value?.available) return false
    return toDateKeyInCopenhagen(numericDate) === todayKey
  })
}

function normalizeCategory(name: string, description?: string) {
  const s = normalize(`${name} ${description ?? ""}`).toLowerCase()

  if (
    s.includes("kaffe") ||
    s.includes("espresso") ||
    s.includes("americano") ||
    s.includes("cappuccino") ||
    s.includes("latte") ||
    s.includes("macchiato") ||
    s.includes("varm kakao") ||
    s.includes("kakao lavazza") ||
    /\bte\b/.test(s) ||
    s.includes("chai")
  ) {
    return "Varme drikke"
  }

  if (
    s.includes("drik") ||
    s.includes("juice") ||
    s.includes("sodavand") ||
    s.includes("kildevand") ||
    s.includes("vand") ||
    s.includes("iste") ||
    s.includes("milkshake") ||
    s.includes("smoothie") ||
    s.includes("aloe vera") ||
    s.includes("red bull") ||
    s.includes("monster") ||
    s.includes("vitamin well") ||
    s.includes("cocio")
  ) {
    return "Drikkevarer"
  }

  if (
    s.includes("morgenmad") ||
    s.includes("bagel") ||
    s.includes("bolle") ||
    s.includes("croissant") ||
    s.includes("wienerbrød") ||
    s.includes("skyr") ||
    s.includes("yoghurt") ||
    s.includes("müsli") ||
    s.includes("toast") ||
    s.includes("sandwich") ||
    s.includes("pizza") ||
    s.includes("pølsehorn")
  ) {
    return "Morgenmad"
  }

  return "Diverse"
}

function pickOffer(data: Awaited<ReturnType<typeof fetchKanplaData>>) {
  const offers = data.offers ?? {}

  if (offers[PRIMARY_OFFER_ID]?.items?.length) {
    return offers[PRIMARY_OFFER_ID]
  }

  const modulesById = new Map((data.modules ?? []).map((module) => [module.id, module.name ?? ""]))

  const fallbackEntry = Object.entries(offers).find(([offerId, offer]) => {
    const moduleName = (modulesById.get(offerId) ?? "").toLowerCase()
    return offer.items?.length && (moduleName.includes("kantine") || moduleName.includes("menu"))
  })

  return fallbackEntry?.[1]
}

export async function GET() {
  try {
    const data = await fetchKanplaData()
    const offer = pickOffer(data)

    if (!offer?.items?.length) {
      return NextResponse.json({ items: [] })
    }

    const items: CanteenItem[] = offer.items
      .filter((item) => item.name)
      .filter((item) => {
        const hasDates = Object.keys(item.dates ?? {}).length > 0
        return !hasDates || isAvailableToday(item)
      })
      .map((item) => {
        const name = normalize(item.name ?? "Unavngivet vare")
        const description = normalize(item.description ?? "")
        const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : item.basePrice ?? null

        return {
          name,
          price: formatPriceDkk(unitPrice, item.unitSystem),
          category: normalizeCategory(name, description),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, "da-DK"))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Canteen API error:", error)
    return NextResponse.json(
      {
        error: "Could not read canteen data from Kanpla API",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
