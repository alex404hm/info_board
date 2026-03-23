// app/api/daily-dish/route.ts

import { NextResponse } from "next/server"
import {
  extractMenuItems,
  fetchKanplaData,
  formatPriceDkk,
  MenuCandidate,
  toDateKeyInCopenhagen,
  toDateLabelDa,
} from "@/lib/kanpla-api"

const DAYS_TO_SHOW = 5

/** Pick the most complete candidate (price > photo > first). */
function pickBest(candidates: MenuCandidate[]): MenuCandidate | undefined {
  if (candidates.length === 0) return undefined
  return candidates.slice().sort((a, b) => {
    const aScore = (a.unitPrice ? 2 : 0) + (a.photo ? 1 : 0)
    const bScore = (b.unitPrice ? 2 : 0) + (b.photo ? 1 : 0)
    return bScore - aScore
  })[0]
}

function serializeCandidate(c: MenuCandidate) {
  return {
    dishName: c.dishName,
    description: c.description,
    typeName: c.typeName,
    unitPrice: c.unitPrice,
    unitSystem: c.unitSystem,
    priceLabel: formatPriceDkk(c.unitPrice, c.unitSystem),
    moduleName: c.moduleName,
    imageUrl: c.photo,
    dateLabel: toDateLabelDa(c.dateSeconds),
  }
}

export async function GET() {
  try {
    const data = await fetchKanplaData()
    const todayKey = toDateKeyInCopenhagen(Math.floor(Date.now() / 1000))

    // Extract all dates (no week filtering) — mirrors the bash script's approach
    const allByDate = extractMenuItems(data, { type: "both" })

    // Sort date keys ascending, keep only today and future, take first DAYS_TO_SHOW
    const upcomingKeys = Array.from(allByDate.keys())
      .filter((key) => key >= todayKey)
      .sort()
      .slice(0, DAYS_TO_SHOW)

    // Build week menu from those days
    const weekMenu = upcomingKeys.map((key) => {
      const { regular, vegetarian } = allByDate.get(key)!
      const bestRegular = pickBest(regular)
      const bestVegetarian = pickBest(vegetarian)
      const anyCandidate = (bestRegular ?? bestVegetarian)!
      return {
        dateKey: key,
        dayLabel: new Intl.DateTimeFormat("da-DK", {
          timeZone: "Europe/Copenhagen",
          weekday: "short",
        }).format(new Date(anyCandidate.dateSeconds * 1000)),
        dishName: bestRegular?.dishName ?? bestVegetarian?.dishName ?? "",
        regular: bestRegular
          ? {
              dishName: bestRegular.dishName,
              description: bestRegular.description,
              priceLabel: formatPriceDkk(bestRegular.unitPrice, bestRegular.unitSystem),
            }
          : null,
        vegetarian: bestVegetarian
          ? {
              dishName: bestVegetarian.dishName,
              description: bestVegetarian.description,
              priceLabel: formatPriceDkk(bestVegetarian.unitPrice, bestVegetarian.unitSystem),
            }
          : null,
      }
    })

    // Today's dish — first upcoming key is today if it matches
    const todayItems = allByDate.get(todayKey)
    if (todayItems && (todayItems.regular.length > 0 || todayItems.vegetarian.length > 0)) {
      const bestRegular = pickBest(todayItems.regular)
      const bestVegetarian = pickBest(todayItems.vegetarian)
      const primary = bestRegular ?? bestVegetarian

      if (primary) {
        return NextResponse.json({
          found: true,
          servingToday: true,
          name: primary.dishName,
          currency: data.school?.currency ?? "DKK",
          weekMenu,
          ...serializeCandidate(primary),
          regular: bestRegular ? serializeCandidate(bestRegular) : null,
          vegetarian: bestVegetarian ? serializeCandidate(bestVegetarian) : null,
        })
      }
    }

    // No dish today — find the next available dish from upcoming days
    let nextDish: MenuCandidate | undefined
    for (const key of upcomingKeys) {
      if (key <= todayKey) continue
      const { regular, vegetarian } = allByDate.get(key)!
      nextDish = pickBest(regular) ?? pickBest(vegetarian)
      if (nextDish) break
    }

    return NextResponse.json({
      found: false,
      servingToday: false,
      name: "Køkkenet serverer ikke dagens ret i dag",
      description: "Der er ingen konkret dagens ret registreret i menuen for i dag.",
      unitPrice: null,
      unitSystem: "piece",
      priceLabel: "Serveres ikke i dag",
      currency: data.school?.currency ?? "DKK",
      moduleName: nextDish?.moduleName,
      imageUrl: nextDish?.photo ?? null,
      nextDishName: nextDish?.dishName ?? null,
      nextDishType: nextDish?.typeName ?? null,
      nextDishDateLabel: nextDish ? toDateLabelDa(nextDish.dateSeconds) : null,
      weekMenu,
      regular: null,
      vegetarian: null,
    })
  } catch (error) {
    console.error("Daily dish API error:", error)
    return NextResponse.json(
      {
        error: "Could not read daily dish from Kanpla API",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
