import { NextResponse } from "next/server"

const ACCESS_ID = process.env.REJSEPLANEN_API_KEY ?? "9dcb0f23-6df6-4de5-b5a6-d17a83e07265"
const LAT = 55.61472
const LON = 12.47695

type RejseplanenStop = {
  StopLocation?: {
    extId?: string
    name?: string
  }
}

type RejseplanenDeparture = {
  ProductAtStop?: { line?: string; catOut?: string }
  Product?: Array<{ line?: string; catOut?: string }>
  direction?: string
  stop?: string
  stopExtId?: string
  date?: string
  time?: string
  rtDate?: string
  rtTime?: string
  track?: string
  rtTrack?: string
  rtPlatform?: string
  platform?: string
}

function formatInMinutes(date: Date) {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMin = Math.max(0, Math.round(diffMs / 60000))
  return `${diffMin} min`
}

function parseDateTime(date?: string, time?: string) {
  if (!date || !time) return null
  const [yyyy, mm, dd] = date.split("-").map(Number)
  const [hh, min] = time.split(":").map(Number)
  if ([yyyy, mm, dd, hh, min].some((x) => Number.isNaN(x))) return null
  return new Date(yyyy, mm - 1, dd, hh, min)
}

function delayMinutes(dep: RejseplanenDeparture) {
  const scheduled = parseDateTime(dep.date, dep.time)
  const realtime = parseDateTime(dep.rtDate ?? dep.date, dep.rtTime)
  if (!scheduled || !realtime) return 0
  return Math.max(0, Math.round((realtime.getTime() - scheduled.getTime()) / 60000))
}

function toType(dep: RejseplanenDeparture): "bus" | "train" {
  const cat = (dep.ProductAtStop?.catOut ?? dep.Product?.[0]?.catOut ?? "").toLowerCase()
  if (cat.includes("tog") || cat.includes("train") || cat.includes("s-tog")) return "train"
  return "bus"
}

export async function GET() {
  try {
    const nearUrl =
      `https://www.rejseplanen.dk/api/location.nearbystops?accessId=${ACCESS_ID}` +
      `&originCoordLat=${LAT}&originCoordLong=${LON}&format=json&maxNo=1`

    const nearResponse = await fetch(nearUrl, { next: { revalidate: 300 } })
    if (!nearResponse.ok) {
      return NextResponse.json({ error: "Could not fetch nearby stops" }, { status: 502 })
    }

    const nearData = (await nearResponse.json()) as {
      stopLocationOrCoordLocation?: RejseplanenStop[]
    }

    const firstStop = nearData.stopLocationOrCoordLocation?.[0]?.StopLocation
    const stopId = firstStop?.extId
    const stopName = firstStop?.name ?? "Stoppested"

    if (!stopId) {
      return NextResponse.json({ error: "No nearby stop found" }, { status: 502 })
    }

    const depUrl =
      `https://www.rejseplanen.dk/api/departureBoard?accessId=${ACCESS_ID}` +
      `&id=${encodeURIComponent(stopId)}&format=json&maxJourneys=10`

    const depResponse = await fetch(depUrl, { next: { revalidate: 30 } })
    if (!depResponse.ok) {
      return NextResponse.json({ error: "Could not fetch departures" }, { status: 502 })
    }

    const depData = (await depResponse.json()) as {
      Departure?: RejseplanenDeparture[]
      DepartureBoard?: { Departure?: RejseplanenDeparture[] }
    }

    const list = depData.Departure ?? depData.DepartureBoard?.Departure ?? []

    const departures = list.slice(0, 6).map((dep) => {
      const line = dep.ProductAtStop?.line ?? dep.Product?.[0]?.line ?? "?"
      const scheduledAt = parseDateTime(dep.rtDate ?? dep.date, dep.rtTime ?? dep.time)
      const time = scheduledAt ? formatInMinutes(scheduledAt) : dep.rtTime ?? dep.time ?? "--"

      return {
        line,
        destination: dep.direction ?? "Ukendt retning",
        from: dep.stop ?? stopName,
        time,
        type: toType(dep),
        platform: dep.rtTrack ?? dep.track ?? dep.rtPlatform ?? dep.platform ?? "?",
        delayMin: delayMinutes(dep),
      }
    })

    return NextResponse.json(
      {
        stop: stopName,
        stopId,
        departures,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=25, stale-while-revalidate=60",
        },
      }
    )
  } catch {
    return NextResponse.json({ error: "Unexpected departures error" }, { status: 500 })
  }
}
