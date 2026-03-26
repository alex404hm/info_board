import { NextResponse } from "next/server"
import { db } from "@/db"
import { calendarEvent } from "@/db/schema"

export const dynamic = "force-dynamic"

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string | null
  allDay: boolean
  location: string | null
  description: string | null
  category: string | null
}

// ─── Danish public holidays + school holidays ─────────────────────────────────

function getEasterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const mm2 = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * mm2 + 114) / 31)
  const day = ((h + l - 7 * mm2 + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function shiftDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toLocalISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}T00:00:00`
}

function isoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const w1Mon = new Date(jan4)
  w1Mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const result = new Date(w1Mon)
  result.setDate(w1Mon.getDate() + (week - 1) * 7)
  return result
}

function buildDanishHolidays(): CalendarEvent[] {
  const currentYear = new Date().getFullYear()
  const events: CalendarEvent[] = []

  for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
    const easter = getEasterSunday(year)

    const easterRelative: [string, number][] = [
      ["Palmesøndag", -7],
      ["Skærtorsdag", -3],
      ["Langfredag", -2],
      ["1. Påskedag", 0],
      ["2. Påskedag", 1],
      ["Kristi Himmelfartsdag", 39],
      ["1. Pinsedag", 49],
      ["2. Pinsedag", 50],
    ]
    for (const [title, offset] of easterRelative) {
      events.push({
        id: `helligdag-${year}-${title.replace(/\W/g, "")}`,
        title,
        start: toLocalISO(shiftDays(easter, offset)),
        end: null,
        allDay: true,
        location: null,
        description: "Dansk helligdag",
        category: "Helligdag",
      })
    }

    const fixedDates: [string, number, number][] = [
      ["Nytårsdag", 1, 1],
      ["Grundlovsdag", 6, 5],
      ["1. Juledag", 12, 25],
      ["2. Juledag", 12, 26],
    ]
    for (const [title, mo, dy] of fixedDates) {
      events.push({
        id: `helligdag-${year}-${mo}-${dy}`,
        title,
        start: `${year}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}T00:00:00`,
        end: null,
        allDay: true,
        location: null,
        description: "Dansk helligdag",
        category: "Helligdag",
      })
    }

    // School holidays (Copenhagen / Capital Region)
    const vinterStart = isoWeekStart(year, 7)
    events.push({ id: `ferie-${year}-vinter`, title: "Vinterferie", start: toLocalISO(vinterStart), end: toLocalISO(shiftDays(vinterStart, 7)), allDay: true, location: null, description: "Skoleferie · Uge 7", category: "Ferie" })

    const paaskeStart = shiftDays(easter, -9)
    events.push({ id: `ferie-${year}-paask`, title: "Påskeferie", start: toLocalISO(paaskeStart), end: toLocalISO(shiftDays(easter, 2)), allDay: true, location: null, description: "Skoleferie · Påskeuge", category: "Ferie" })

    const sommerStart = isoWeekStart(year, 26)
    events.push({ id: `ferie-${year}-sommer`, title: "Sommerferie", start: toLocalISO(sommerStart), end: toLocalISO(isoWeekStart(year, 33)), allDay: true, location: null, description: "Sommerferie", category: "Ferie" })

    const efteraarStart = isoWeekStart(year, 42)
    events.push({ id: `ferie-${year}-efteraar`, title: "Efterårsferie", start: toLocalISO(efteraarStart), end: toLocalISO(shiftDays(efteraarStart, 7)), allDay: true, location: null, description: "Skoleferie · Uge 42", category: "Ferie" })

    events.push({ id: `ferie-${year}-jul`, title: "Juleferie", start: `${year}-12-21T00:00:00`, end: `${year + 1}-01-06T00:00:00`, allDay: true, location: null, description: "Skoleferie · Juleferien", category: "Ferie" })
  }

  return events
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  const holidays = buildDanishHolidays()

  try {
    const dbEvents = await db
      .select({
        id: calendarEvent.id,
        title: calendarEvent.title,
        start: calendarEvent.start,
        end: calendarEvent.end,
        allDay: calendarEvent.allDay,
        location: calendarEvent.location,
        description: calendarEvent.description,
        category: calendarEvent.category,
      })
      .from(calendarEvent)

    const events = [...dbEvents, ...holidays].sort((a, b) => a.start.localeCompare(b.start))
    return NextResponse.json({ configured: true, events })
  } catch {
    const events = holidays.sort((a, b) => a.start.localeCompare(b.start))
    return NextResponse.json({ configured: true, events })
  }
}
