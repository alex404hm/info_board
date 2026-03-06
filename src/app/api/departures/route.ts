import { NextResponse } from "next/server"

import type { Departure, DepartureGroup } from "@/types"

const ACCESS_ID = process.env.REJSEPLANEN_API_KEY ?? "9dcb0f23-6df6-4de5-b5a6-d17a83e07265"

// Closest stop to the school (Kokkeldal 500S)
const STOP_ID_1 = process.env.REJSEPLANEN_STOP_ID_1 ?? process.env.REJSEPLANEN_STOP_ID ?? "3849"
// Alternative stop (Ørestad 500S)
const STOP_ID_2 = process.env.REJSEPLANEN_STOP_ID_2 ?? "2859"

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
  cancelled?: boolean | string
  canceled?: boolean | string
  cancel?: boolean | string
  rtCncl?: boolean | string
  reachable?: boolean | string
  JourneyStatus?: string
  journeyStatus?: string
  notes?: Array<{ text?: string }>
  Remarks?: { Remark?: Array<{ text?: string; type?: string }> }
}

type StopConfig = {
  stopId: string
  sourceStopSlot: 1 | 2
  title: string
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

function isTruthy(value: unknown): boolean {
  if (value === true) return true
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return ["true", "1", "yes", "y", "cancelled", "canceled", "aflyst"].includes(normalized)
  }
  return false
}

function isCancelled(dep: RejseplanenDeparture): boolean {
  if (
    isTruthy(dep.cancelled) ||
    isTruthy(dep.canceled) ||
    isTruthy(dep.cancel) ||
    isTruthy(dep.rtCncl)
  ) {
    return true
  }

  if (dep.reachable === false || (typeof dep.reachable === "string" && dep.reachable.toLowerCase() === "false")) {
    return true
  }

  const statusText = `${dep.JourneyStatus ?? ""} ${dep.journeyStatus ?? ""}`.toLowerCase()
  if (statusText.includes("cancel") || statusText.includes("aflyst")) return true

  const noteText = (dep.notes ?? []).map((note) => note.text ?? "").join(" ").toLowerCase()
  if (noteText.includes("cancel") || noteText.includes("aflyst")) return true

  const remarkText = (dep.Remarks?.Remark ?? [])
    .map((remark) => `${remark.type ?? ""} ${remark.text ?? ""}`)
    .join(" ")
    .toLowerCase()
  if (remarkText.includes("cancel") || remarkText.includes("aflyst")) return true

  return false
}

function etaSortValue(dep: Departure): number {
  if (dep.cancelled) return Number.MAX_SAFE_INTEGER
  const minutes = Number.parseInt(dep.time, 10)
  return Number.isFinite(minutes) ? minutes : Number.MAX_SAFE_INTEGER - 1
}

async function fetchStopDepartures(config: StopConfig): Promise<DepartureGroup> {
  const depUrl =
    `https://www.rejseplanen.dk/api/departureBoard?accessId=${ACCESS_ID}` +
    `&id=${encodeURIComponent(config.stopId)}&format=json&maxJourneys=12`

  const depResponse = await fetch(depUrl, { next: { revalidate: 30 } })

  if (!depResponse.ok) {
    return {
      id: config.stopId,
      sourceStopSlot: config.sourceStopSlot,
      title: config.title,
      sourceStopId: config.stopId,
      sourceStopName: `Stoppested ${config.stopId}`,
      departures: [],
      error: `HTTP ${depResponse.status}`,
    }
  }

  const depData = (await depResponse.json()) as {
    Departure?: RejseplanenDeparture[]
    DepartureBoard?: { Departure?: RejseplanenDeparture[] }
  }

  const list = depData.Departure ?? depData.DepartureBoard?.Departure ?? []
  const departures: Departure[] = list
    // ✅ Fix: only keep departures that actually belong to the requested stop
    .filter((dep) => {
      const depStopId = dep.stopExtId?.trim()
      return !depStopId || depStopId === config.stopId.trim()
    })
    .map((dep) => {
      const cancelled = isCancelled(dep)
      const line = dep.ProductAtStop?.line ?? dep.Product?.[0]?.line ?? "?"
      const scheduledAt = parseDateTime(dep.rtDate ?? dep.date, dep.rtTime ?? dep.time)
      const time = cancelled
        ? "Aflyst"
        : scheduledAt
          ? formatInMinutes(scheduledAt)
          : dep.rtTime ?? dep.time ?? "--"

      return {
        line,
        destination: dep.direction ?? "Ukendt retning",
        from: dep.stop ?? "Stoppested",
        sourceStopId: dep.stopExtId ?? config.stopId,
        sourceStopName: dep.stop ?? `Stoppested ${config.stopId}`,
        sourceStopSlot: config.sourceStopSlot,
        time,
        type: toType(dep),
        platform: dep.rtTrack ?? dep.track ?? dep.rtPlatform ?? dep.platform ?? "?",
        delayMin: cancelled ? 0 : delayMinutes(dep),
        cancelled,
      }
    })
    .sort((a, b) => etaSortValue(a) - etaSortValue(b))
    .slice(0, 6)

  return {
    id: config.stopId,
    sourceStopSlot: config.sourceStopSlot,
    title: config.title,
    sourceStopId: config.stopId,
    sourceStopName: departures[0]?.sourceStopName ?? `Stoppested ${config.stopId}`,
    departures,
  }
}

export async function GET() {
  try {
    const stop1 = STOP_ID_1.trim()
    const stop2 = STOP_ID_2.trim()

    if (!stop1 || !stop2) {
      return NextResponse.json(
        {
          error: "Please configure two stop IDs via REJSEPLANEN_STOP_ID_1 and REJSEPLANEN_STOP_ID_2",
        },
        { status: 500 }
      )
    }

    const configs: StopConfig[] = [
      { stopId: stop2, sourceStopSlot: 2, title: "Tættest mod skolen" },
      { stopId: stop1, sourceStopSlot: 1, title: "Alternativt stoppested" },
    ]

    const settled = await Promise.allSettled(configs.map(fetchStopDepartures))

    const groups: DepartureGroup[] = settled.map((result, index) => {
      if (result.status === "fulfilled") return result.value

      const cfg = configs[index]
      return {
        id: cfg.stopId,
        sourceStopSlot: cfg.sourceStopSlot,
        title: cfg.title,
        sourceStopId: cfg.stopId,
        sourceStopName: `Stoppested ${cfg.stopId}`,
        departures: [],
        error: "Fetch failed",
      }
    })

    return NextResponse.json(
      {
        fetchedAt: new Date().toISOString(),
        stopIds: [stop1, stop2],
        groups,
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