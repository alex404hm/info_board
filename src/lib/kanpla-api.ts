/**
 * Shared utilities for Kanpla API integration
 */

export type KanplaItem = {
  id?: string
  name?: string
  description?: string
  unitPrice?: number | null
  basePrice?: number | null
  unitSystem?: string
  photo?: string
  dates?: Record<
    string,
    {
      available?: boolean
      menu?: {
        name?: string
        description?: string
      }
    }
  >
}

export type KanplaFrontendPayload = {
  modules?: Array<{ id: string; name?: string }>
  offers?: Record<string, { items?: KanplaItem[] }>
  school?: { currency?: string }
}

/**
 * Format price in Danish Kroner
 */
export function formatPriceDkk(unitPrice?: number | null, unitSystem?: string): string {
  if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return "Dagspris"
  }

  const dkk = unitPrice / 100
  if (unitSystem === "kilogram") {
    return `${dkk.toFixed(2).replace(".", ",")} kr/kg`
  }

  return `${dkk.toFixed(2).replace(".", ",")} kr`
}

/**
 * Convert Unix timestamp to Copenhagen date key (YYYY-MM-DD)
 */
export function toDateKeyInCopenhagen(dateSeconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateSeconds * 1000))
}

/**
 * Format date label in Danish
 */
export function toDateLabelDa(dateSeconds: number): string {
  return new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateSeconds * 1000))
}

/**
 * Normalize text by trimming and collapsing whitespace
 */
export function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

/**
 * Check if a name represents a valid dish (not a status message)
 */
export function isValidDishName(name: string): boolean {
  const lower = name.toLowerCase()
  const nonDishPattern =
    /god\s*(fredag|weekend)|lukket|ingen\s+dagens\s+ret|producerer\s+ikke|serveres\s+ikke|ferie|helligdag/
  return !nonDishPattern.test(lower)
}

/**
 * Fetch data from Kanpla API
 */
export async function fetchKanplaData(): Promise<KanplaFrontendPayload> {
  const response = await fetch("https://app.kanpla.dk/api/internal/load/frontend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      language: "en",
      schoolId: "iMwN4jrkbNRtmgU9Yb94",
    }),
    next: { revalidate: 600 },
  })

  if (!response.ok) {
    throw new Error(`Kanpla API returned status ${response.status}`)
  }

  return response.json()
}
