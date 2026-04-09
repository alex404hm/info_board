/**
 * Shared utilities for Kanpla API integration
 */

export type KanplaItem = {
  id?: string
  productId?: string  // actual field name in Kanpla API responses
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
      } | null
    }
  >
}

type KanplaFrontendPayload = {
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

  // unitPrice is in øre ex. VAT — convert to kr and add 25% Danish VAT
  const dkk = (unitPrice / 100) * 1.25
  const rounded = Math.round(dkk * 100) / 100

  if (unitSystem === "kilogram") {
    return `${rounded.toFixed(2).replace(".", ",")} kr/kg`
  }

  // Show whole numbers without decimals (e.g. 23 kr, not 23,00 kr)
  const label = rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(2).replace(".", ",")
  return `${label} kr`
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
  if (!text) return ""
  return text.trim().replace(/\s+/g, " ")
}

/**
 * Check if a name represents a valid dish (not a status message)
 */
function isValidDishName(name: string): boolean {
  const lower = name.toLowerCase()
  const nonDishPattern =
    /god\s*(fredag|weekend)|lukket|ingen\s+dagens\s+ret|producerer\s+ikke|serveres\s+ikke|ferie|helligdag/
  return !nonDishPattern.test(lower)
}

// ── Menu extraction ────────────────────────────────────────────────────────

/** Known Kanpla IDs for TEC Hvidovre — update if the school reconfigures. */
const MENU_MODULE_ID = "vrDRxcc978C9NUVWQyIo"
const REGULAR_PRODUCT_ID = "YxejqLX6uyT6QgZwsqjf"
const VEGETARIAN_PRODUCT_ID = "i1nzbhUmR3pazvmxKOja"

export type MenuType = "regular" | "vegetarian"

export type MenuCandidate = {
  moduleId: string
  moduleName: string
  typeName: string
  menuType: MenuType
  unitPrice: number | null
  unitSystem: string
  photo: string | null
  dateSeconds: number
  dateKey: string
  dishName: string
  description: string
}

type DayMenuItems = {
  regular: MenuCandidate[]
  vegetarian: MenuCandidate[]
}

/**
 * Classify a menu item as regular or vegetarian.
 * Checks productId (actual Kanpla field) and id, falls back to item name.
 */
function classifyMenuType(item: KanplaItem): MenuType {
  const pid = item.productId ?? item.id
  if (pid === VEGETARIAN_PRODUCT_ID) return "vegetarian"
  if (pid === REGULAR_PRODUCT_ID) return "regular"
  return /grøn|vegetar/i.test(item.name ?? "") ? "vegetarian" : "regular"
}

/**
 * Extract daily menu candidates from Kanpla API data, keyed by YYYY-MM-DD.
 *
 * Scoped to the known menu module so generic wrapper items (e.g. "Dagens ret"
 * with a static "Klimabuffet" name) in other modules are ignored.
 *
 * @param data      Raw payload from fetchKanplaData()
 * @param options
 *   dateKeys  – if provided, only return entries for these date keys
 *   type      – "regular" | "vegetarian" | "both" (default "both")
 */
export function extractMenuItems(
  data: KanplaFrontendPayload,
  options?: { dateKeys?: string[]; type?: MenuType | "both" }
): Map<string, DayMenuItems> {
  const wantType = options?.type ?? "both"
  const modulesById = new Map((data.modules ?? []).map((m) => [m.id, m.name ?? "Ukendt modul"]))
  const result = new Map<string, DayMenuItems>()

  // Only look inside the dedicated menu module; skip all other modules.
  const menuOffer = data.offers?.[MENU_MODULE_ID]
  if (!menuOffer?.items) return result

  for (const item of menuOffer.items) {
    const typeName = item.name ?? ""
    const menuType = classifyMenuType(item)
    
    // Skip if we're filtering by type and this item doesn't match
    if (wantType !== "both" && menuType !== wantType) continue

    const unitPrice =
      typeof item.unitPrice === "number" ? item.unitPrice : item.basePrice ?? null

    // Skip items without dates
    if (!item.dates) continue
    
    for (const [rawKey, dateValue] of Object.entries(item.dates)) {
      const dateSeconds = Number(rawKey)
      if (!Number.isFinite(dateSeconds) || !dateValue?.available) continue

      const dateKey = toDateKeyInCopenhagen(dateSeconds)
      if (options?.dateKeys && !options.dateKeys.includes(dateKey)) continue

      // Get the dish name from the menu data
      const dishName = dateValue.menu?.name ? normalize(dateValue.menu.name) : ""
      if (!dishName || !isValidDishName(dishName)) continue

      const candidate: MenuCandidate = {
        moduleId: MENU_MODULE_ID,
        moduleName: modulesById.get(MENU_MODULE_ID) ?? "Ukendt modul",
        typeName: typeName || (menuType === "regular" ? "Dagens ret" : "Dagens grønne ret"),
        menuType,
        unitPrice,
        unitSystem: item.unitSystem ?? "piece",
        photo: item.photo ?? null,
        dateSeconds,
        dateKey,
        dishName,
        description: dateValue.menu?.description ? normalize(dateValue.menu.description) : "",
      }

      if (!result.has(dateKey)) {
        result.set(dateKey, { regular: [], vegetarian: [] })
      }
      result.get(dateKey)![menuType].push(candidate)
    }
  }

  // Sort candidates within each day by date
  for (const [_, { regular, vegetarian }] of result) {
    regular.sort((a, b) => a.dateSeconds - b.dateSeconds)
    vegetarian.sort((a, b) => a.dateSeconds - b.dateSeconds)
  }

  return result
}

/**
 * Get a specific dish type for a given date
 */
function getDishForDate(
  data: KanplaFrontendPayload,
  dateKey: string,
  type: MenuType = "regular"
): MenuCandidate | null {
  const menuMap = extractMenuItems(data, { dateKeys: [dateKey], type })
  const dayMenu = menuMap.get(dateKey)
  if (!dayMenu) return null
  
  const candidates = dayMenu[type]
  if (candidates.length === 0) return null
  
  // Return the first candidate (should be only one per type per day)
  return candidates[0]
}

/**
 * Get today's dish
 */
function getTodaysDish(
  data: KanplaFrontendPayload,
  type: MenuType = "regular"
): MenuCandidate | null {
  const todaySeconds = Math.floor(Date.now() / 1000)
  const todayKey = toDateKeyInCopenhagen(todaySeconds)
  return getDishForDate(data, todayKey, type)
}

/**
 * Get dishes for the next N days
 */
function getUpcomingDishes(
  data: KanplaFrontendPayload,
  days: number = 7,
  type: MenuType = "regular"
): MenuCandidate[] {
  const menuMap = extractMenuItems(data, { type })
  const nowSeconds = Math.floor(Date.now() / 1000)
  const todayKey = toDateKeyInCopenhagen(nowSeconds)
  
  const upcoming: MenuCandidate[] = []
  
  // Sort all dates and get upcoming ones
  const sortedDates = Array.from(menuMap.keys()).sort()
  
  for (const dateKey of sortedDates) {
    if (dateKey >= todayKey && upcoming.length < days) {
      const dayMenu = menuMap.get(dateKey)
      if (dayMenu && dayMenu[type].length > 0) {
        // Take the first candidate (should be only one per day)
        upcoming.push(dayMenu[type][0])
      }
    }
  }
  
  return upcoming
}

// ── Fetch ───────────────────────────────────────────────────────────────────

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