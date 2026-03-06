import { NextResponse } from "next/server"
import {
  fetchKanplaData,
  formatPriceDkk,
  isValidDishName,
  normalize,
  toDateKeyInCopenhagen,
  toDateLabelDa,
} from "@/lib/kanpla-api"

type Candidate = {
  moduleId: string
  moduleName: string
  typeName: string
  unitPrice: number | null
  unitSystem: string
  photo: string | null
  dateSeconds: number
  dishName: string
  description: string
  hasConcreteMenu: boolean
}

function scoreCandidate(candidate: Candidate) {
  const typeName = candidate.typeName.toLowerCase()
  let score = 0
  if (candidate.unitPrice && candidate.unitPrice > 0) score += 40
  if (candidate.photo) score += 25
  if (typeName.includes("varme ret")) score += 20
  if (typeName.includes("dagens ret")) score += 15
  if (typeName.includes("grønne")) score += 10
  return score
}

function pickBest(candidates: Candidate[]) {
  return candidates
    .slice()
    .sort(
      (a, b) =>
        scoreCandidate(b) - scoreCandidate(a) ||
        (a.unitPrice ?? Number.MAX_SAFE_INTEGER) - (b.unitPrice ?? Number.MAX_SAFE_INTEGER)
    )[0]
}

export async function GET() {
  try {
    const data = await fetchKanplaData()

    const modulesById = new Map((data.modules ?? []).map((m) => [m.id, m.name ?? "Ukendt modul"]))
    const typeRegex = /dagens\s*(ret|varme|grønne)/i
    const todayKey = toDateKeyInCopenhagen(Math.floor(Date.now() / 1000))
    const allCandidates: Candidate[] = []

    for (const [moduleId, offer] of Object.entries(data.offers ?? {})) {
      for (const item of offer.items ?? []) {
        const typeName = item.name ?? ""
        if (!typeRegex.test(typeName)) continue

        const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : item.basePrice ?? null
        const dates = item.dates ?? {}

        for (const [dateKey, dateValue] of Object.entries(dates)) {
          const dateSeconds = Number(dateKey)
          if (!Number.isFinite(dateSeconds) || !dateValue?.available) continue

          const menuName = normalize(dateValue.menu?.name ?? "")
          const menuDescription = normalize(dateValue.menu?.description ?? "")
          const hasConcreteMenu = menuName.length > 0

          allCandidates.push({
            moduleId,
            moduleName: modulesById.get(moduleId) ?? "Ukendt modul",
            typeName,
            unitPrice,
            unitSystem: item.unitSystem ?? "piece",
            photo: item.photo ?? null,
            dateSeconds,
            dishName: menuName || typeName,
            description: menuDescription,
            hasConcreteMenu,
          })
        }
      }
    }

    const todaysCandidates = allCandidates.filter(
      (candidate) => toDateKeyInCopenhagen(candidate.dateSeconds) === todayKey
    )
    const todaysDishCandidates = todaysCandidates.filter(
      (candidate) => candidate.hasConcreteMenu && isValidDishName(candidate.dishName)
    )
    const bestTodayDish = pickBest(todaysDishCandidates)

    if (bestTodayDish) {
      return NextResponse.json({
        found: true,
        servingToday: true,
        name: bestTodayDish.dishName,
        type: bestTodayDish.typeName,
        unitPrice: bestTodayDish.unitPrice,
        unitSystem: bestTodayDish.unitSystem,
        priceLabel: formatPriceDkk(bestTodayDish.unitPrice, bestTodayDish.unitSystem),
        moduleName: bestTodayDish.moduleName,
        description: bestTodayDish.description,
        imageUrl: bestTodayDish.photo,
        currency: data.school?.currency ?? "DKK",
        candidates: todaysDishCandidates.length,
        dateLabel: toDateLabelDa(bestTodayDish.dateSeconds),
      })
    }

    const nowSeconds = Math.floor(Date.now() / 1000)
    const nextDish = pickBest(
      allCandidates.filter(
        (candidate) =>
          candidate.dateSeconds > nowSeconds &&
          candidate.hasConcreteMenu &&
          isValidDishName(candidate.dishName)
      )
    )

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
    })
  } catch (error) {
    console.error("Daily dish API error:", error)
    return NextResponse.json(
      { 
        error: "Could not read daily dish from Kanpla API",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
