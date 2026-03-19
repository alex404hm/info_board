import { NextResponse } from "next/server"

const LAT = 55.6147
const LON = 12.4769

type MetTimePoint = {
  time: string
  data: {
    instant: {
      details: {
        air_temperature: number
        relative_humidity: number
        wind_speed: number
      }
    }
    next_1_hours?: {
      summary?: { symbol_code?: string }
    }
    next_6_hours?: {
      summary?: { symbol_code?: string }
    }
  }
}

function toDanishCondition(symbol?: string) {
  if (!symbol) return "Ukendt"

  const code = symbol.toLowerCase()

  if (code.includes("clearsky")) return "Klart"
  if (code.includes("fair")) return "Let skyet"
  if (code.includes("partlycloudy")) return "Delvist skyet"
  if (code.includes("cloudy")) return "Overskyet"
  if (code.includes("fog")) return "Tåget"
  if (code.includes("heavyrain")) return "Kraftig regn"
  if (code.includes("rain")) return "Regn"
  if (code.includes("sleet")) return "Slud"
  if (code.includes("snow")) return "Sne"
  if (code.includes("thunder")) return "Torden"

  return "Skiftende vejr"
}

function weekday(date: string) {
  return new Date(date).toLocaleDateString("da-DK", {
    weekday: "long",
  })
}

function groupByDay(timeseries: MetTimePoint[]) {
  const map = new Map<string, MetTimePoint[]>()

  for (const point of timeseries) {
    const date = point.time.split("T")[0]

    if (!map.has(date)) map.set(date, [])

    map.get(date)!.push(point)
  }

  return Array.from(map.entries()).slice(0, 5)
}

function buildForecast(timeseries: MetTimePoint[]) {
  const days = groupByDay(timeseries)

  return days.map(([date, points]) => {
    const temps = points
      .map(p => p.data.instant.details.air_temperature)
      .filter(t => typeof t === "number")

    const noon = points.find(p => p.time.includes("12:00"))

    const symbol =
      noon?.data?.next_6_hours?.summary?.symbol_code ??
      points[0]?.data?.next_1_hours?.summary?.symbol_code

    const windSpeeds = points.map(p => p.data.instant.details.wind_speed).filter(w => typeof w === "number")
    const avgWindMs = windSpeeds.length > 0 ? Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length * 10) / 10 : null

    return {
      date,
      weekday: weekday(date),
      minC: Math.round(Math.min(...temps)),
      maxC: Math.round(Math.max(...temps)),
      condition: toDanishCondition(symbol),
      symbolCode: symbol ?? null,
      windMs: avgWindMs,
    }
  })
}

export async function GET() {
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TEC-InfoBoard/1.0 contact@example.com",
        Accept: "application/json",
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather" },
        { status: 502 }
      )
    }

    const data = await response.json()

    const timeseries: MetTimePoint[] = data?.properties?.timeseries

    if (!Array.isArray(timeseries) || timeseries.length === 0) {
      return NextResponse.json(
        { error: "Weather data missing" },
        { status: 502 }
      )
    }

    const first = timeseries[0]
    const details = first.data.instant.details

    const symbol =
      first?.data?.next_1_hours?.summary?.symbol_code ??
      first?.data?.next_6_hours?.summary?.symbol_code

    const payload = {
      location: {
        lat: LAT,
        lon: LON,
      },
      updatedAt: first.time,
      temperatureC: Math.round(details.air_temperature),
      humidityPct: Math.round(details.relative_humidity),
      windMs: details.wind_speed,
      windKmh: Math.round(details.wind_speed * 3.6),
      symbolCode: symbol ?? null,
      condition: toDanishCondition(symbol),
      forecastDays: buildForecast(timeseries),
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, s-maxage=600, stale-while-revalidate=1800",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected weather error" },
      { status: 500 }
    )
  }
}