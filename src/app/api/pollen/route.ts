import { NextResponse } from "next/server"

export type PollenItem = {
  name: string
  level: number | null   // 0–4 scale
  label: string          // "Ingen" | "Lav" | "Moderat" | "Høj" | "Meget høj"
}

export type PollenApiResponse = {
  updatedAt: string
  location: string
  items: PollenItem[]
  source: string
}

function levelLabel(n: number | null): string {
  if (n === null) return "Ingen data"
  if (n === 0) return "Ingen"
  if (n === 1) return "Lav"
  if (n === 2) return "Moderat"
  if (n === 3) return "Høj"
  return "Meget høj"
}

// Astma-Allergi Danmark RSS → extract pollen counts from title/description
async function fetchFromAstmaAllergi(): Promise<PollenItem[] | null> {
  try {
    const res = await fetch("https://www.astma-allergi.dk/umbraco/api/pollenapi/getpollenrss", {
      headers: { "User-Agent": "TEC-InfoBoard/1.0" },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const xml = await res.text()

    // Parse <title> entries like "Birk: 12", "Græs: 3" etc.
    const entries: PollenItem[] = []
    const re = /<title><!\[CDATA\[([^:]+):\s*([\d]+)\]\]><\/title>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(xml)) !== null) {
      const name = m[1].trim()
      const raw = parseInt(m[2], 10)
      // Map raw count → 0–4 scale (thresholds vary by type, use a simple bucket)
      let level = 0
      if (raw >= 1 && raw < 10) level = 1
      else if (raw >= 10 && raw < 50) level = 2
      else if (raw >= 50 && raw < 200) level = 3
      else if (raw >= 200) level = 4
      entries.push({ name, level, label: levelLabel(level) })
    }
    return entries.length > 0 ? entries : null
  } catch {
    return null
  }
}

export async function GET() {
  const live = await fetchFromAstmaAllergi()

  // Canonical list of Danish pollen types always shown
  const types = ["Birk", "Græs", "Bynke", "El", "Hassel", "Alternaria"]

  const items: PollenItem[] = types.map((name) => {
    const found = live?.find((p) => p.name.toLowerCase().includes(name.toLowerCase()))
    return found ?? { name, level: null, label: "Ingen data" }
  })

  const payload: PollenApiResponse = {
    updatedAt: new Date().toISOString(),
    location: "København",
    items,
    source: "Astma-Allergi Danmark",
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  })
}
