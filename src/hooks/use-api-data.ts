"use client"

import { useEffect, useRef, useState } from "react"

import type {
  DeparturesApiResponse,
  DepartureGroup,
  DailyDishApiResponse,
  Departure,
  WeatherApiResponse,
} from "@/types"

export function useWeatherData() {
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null)

  useEffect(() => {
    let mounted = true
    let inFlight = false

    const loadWeather = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const response = await fetch("/api/weather", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as WeatherApiResponse
        if (mounted) setWeather(data)
      } catch {
        // Keep last known values on transient failure.
      } finally {
        inFlight = false
      }
    }

    loadWeather()
    const id = setInterval(loadWeather, 10 * 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === "visible") loadWeather()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onVisible)
    return () => {
      mounted = false
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onVisible)
    }
  }, [])

  return weather
}

export function useDailyDishData() {
  const [dailyDishData, setDailyDishData] = useState<DailyDishApiResponse | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetch("/api/daily-dish")
        if (!response.ok) return
        const data = (await response.json()) as DailyDishApiResponse
        if (mounted) setDailyDishData(data)
      } catch {
        // Keep fallback content on error.
      }
    }

    load()
    const id = setInterval(load, 10 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  return dailyDishData
}

export function useDeparturesData() {
  const [departures, setDepartures] = useState<Departure[]>([])
  const departuresRef = useRef<Departure[]>([])

  useEffect(() => {
    let mounted = true
    let timer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false

    const hasChanged = (next: Departure[]) => {
      const current = departuresRef.current
      if (next.length !== current.length) return true
      return next.some((item, index) => {
        const prev = current[index]
        return (
          item.line !== prev?.line ||
          item.destination !== prev?.destination ||
          item.sourceStopId !== prev?.sourceStopId ||
          item.time !== prev?.time ||
          item.platform !== prev?.platform ||
          item.delayMin !== prev?.delayMin ||
          item.cancelled !== prev?.cancelled
        )
      })
    }

    const load = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const response = await fetch("/api/departures", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as DeparturesApiResponse
        const nextDepartures = Array.isArray(data.departures)
          ? data.departures
          : Array.isArray(data.groups)
            ? data.groups.flatMap((group) => group.departures)
            : []

        if (mounted && hasChanged(nextDepartures)) {
          departuresRef.current = nextDepartures
          setDepartures(nextDepartures)
        }
      } catch {
        // Keep previous departures on transient errors.
      } finally {
        inFlight = false
      }
    }

    const nextVisibleTick = () => {
      const now = Date.now()
      const msToMinute = 60_000 - (now % 60_000)
      return Math.max(15_000, msToMinute + 350)
    }

    const schedule = (ms: number) => {
      if (!mounted) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        await load()
        schedule(document.visibilityState === "visible" ? nextVisibleTick() : 5 * 60_000)
      }, ms)
    }

    const onVisible = async () => {
      if (document.visibilityState !== "visible") return
      await load()
      schedule(nextVisibleTick())
    }

    load().finally(() => schedule(nextVisibleTick()))
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onVisible)

    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onVisible)
    }
  }, [])

  return departures
}

export function useDepartureGroupsData() {
  const [groups, setGroups] = useState<DepartureGroup[]>([])
  const groupsRef = useRef<DepartureGroup[]>([])

  useEffect(() => {
    let mounted = true

    const hasChanged = (next: DepartureGroup[]) => {
      const prev = groupsRef.current
      if (next.length !== prev.length) return true

      const signature = (items: DepartureGroup[]) =>
        items
          .map((group) => {
            const first = group.departures[0]
            return [
              group.id,
              group.sourceStopId,
              group.sourceStopName,
              group.departures.length,
              first?.line ?? "",
              first?.time ?? "",
              first?.cancelled ? "1" : "0",
            ].join("|")
          })
          .join("||")

      return signature(next) !== signature(prev)
    }

    const load = async () => {
      try {
        const response = await fetch("/api/departures", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as DeparturesApiResponse
        const nextGroups = Array.isArray(data.groups) ? data.groups : []
        if (mounted && hasChanged(nextGroups)) {
          groupsRef.current = nextGroups
          setGroups(nextGroups)
        }
      } catch {
        // Keep previous data on transient errors.
      }
    }

    void load()
    const id = setInterval(load, 60_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  return groups
}
