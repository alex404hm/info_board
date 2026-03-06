import { NextResponse } from "next/server"

const LAT = 55.61472
const LON = 12.47695

function toYrCoord(value: number) {
  // Yr recommends up to 4 decimals in requests.
  return value.toFixed(4)
}

function toDanishCondition(symbolCode?: string): string {
  if (!symbolCode) return "Ukendt"
  const code = symbolCode.toLowerCase()

  if (code.includes("clearsky")) return "Klart"
  if (code.includes("fair")) return "Let skyet"
  if (code.includes("partlycloudy")) return "Delvist skyet"
  if (code.includes("cloudy")) return "Overskyet"
  if (code.includes("fog")) return "Tåget"
  if (code.includes("heavyrain")) return "Kraftig regn"
  if (code.includes("rain")) return "Regn"
  if (code.includes("sleet")) return "Slud"
  if (code.includes("heavysnow")) return "Kraftig sne"
  if (code.includes("snow")) return "Sne"
  if (code.includes("thunder")) return "Torden"

  return "Skiftende vejr"
}

type MetTimePoint = {
  time?: string
  data?: {
    instant?: { details?: { air_temperature?: number } }
    next_1_hours?: { summary?: { symbol_code?: string } }
    next_6_hours?: { summary?: { symbol_code?: string } }
  }
}

function toWeekdayLabel(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`)
  return date.toLocaleDateString("da-DK", { weekday: "short" })
}

function toDateKey(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function pickDaySymbol(points: MetTimePoint[]) {
  const noonPoint = points.find((point) => {
    const t = point.time ? new Date(point.time) : null
    return t && !Number.isNaN(t.getTime()) && t.getHours() >= 11 && t.getHours() <= 14
  })

  const preferred = noonPoint ?? points[0]
  return preferred?.data?.next_6_hours?.summary?.symbol_code ?? preferred?.data?.next_1_hours?.summary?.symbol_code
}

function buildForecastDays(timeseries: MetTimePoint[]) {
  const grouped = new Map<string, MetTimePoint[]>()

  for (const point of timeseries) {
    const key = toDateKey(point.time)
    if (!key) continue
    const existing = grouped.get(key) ?? []
    existing.push(point)
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .slice(0, 7)
    .map(([date, points]) => {
      const temps = points
        .map((point) => Number(point.data?.instant?.details?.air_temperature))
        .filter((value) => Number.isFinite(value)) as number[]

      const minC = temps.length ? Math.round(Math.min(...temps)) : null
      const maxC = temps.length ? Math.round(Math.max(...temps)) : null
      const symbol = pickDaySymbol(points)

      return {
        date,
        weekday: toWeekdayLabel(date),
        minC,
        maxC,
        condition: toDanishCondition(symbol),
      }
    })
}

export async function GET() {
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${toYrCoord(LAT)}&lon=${toYrCoord(LON)}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TEC-InfoBoard/1.0 (https://www.tec.dk; contact: it-support@tec.dk)",
        Accept: "application/json",
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not fetch weather from Yr", status: response.status },
        { status: 502 }
      )
    }

    const data = await response.json()
    const timeseries = data?.properties?.timeseries

    if (!Array.isArray(timeseries) || timeseries.length === 0) {
      return NextResponse.json({ error: "Weather payload missing timeseries" }, { status: 502 })
    }

    const first = timeseries[0]
    const details = first?.data?.instant?.details
    const next1 = first?.data?.next_1_hours?.summary?.symbol_code
    const next6 = first?.data?.next_6_hours?.summary?.symbol_code

    const temperature = Number(details?.air_temperature)
    const humidity = Number(details?.relative_humidity)
    const wind = Number(details?.wind_speed)

    const payload = {
      location: {
        address: "Stamholmen 193, 2650 Hvidovre",
        lat: LAT,
        lon: LON,
      },
      updatedAt: first?.time ?? new Date().toISOString(),
      temperatureC: Number.isFinite(temperature) ? Math.round(temperature) : null,
      humidityPct: Number.isFinite(humidity) ? Math.round(humidity) : null,
      windMs: Number.isFinite(wind) ? wind : null,
      windKmh: Number.isFinite(wind) ? Math.round(wind * 3.6) : null,
      symbolCode: next1 ?? next6 ?? null,
      condition: toDanishCondition(next1 ?? next6),
      forecastDays: buildForecastDays(timeseries),
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    })
  } catch {
    return NextResponse.json({ error: "Unexpected weather error" }, { status: 500 })
  }
}
