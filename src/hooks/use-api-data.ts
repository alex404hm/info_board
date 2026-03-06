"use client"

import { useEffect, useRef, useState } from "react"

import type {
  DailyDishApiResponse,
  Departure,
  WeatherApiResponse,
} from "@/types"

export function useWeatherData() {
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null)

  useEffect(() => {
    let mounted = true

    const loadWeather = async () => {
      try {
        const response = await fetch("/api/weather")
        if (!response.ok) return
        const data = (await response.json()) as WeatherApiResponse
        if (mounted) setWeather(data)
      } catch {
        // Keep last known values on transient failure.
      }
    }

    loadWeather()
    const id = setInterval(loadWeather, 10 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
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
          item.time !== prev?.time ||
          item.platform !== prev?.platform ||
          item.delayMin !== prev?.delayMin
        )
      })
    }

    const load = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const response = await fetch("/api/departures", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as { departures?: Departure[] }
        if (mounted && Array.isArray(data.departures) && hasChanged(data.departures)) {
          departuresRef.current = data.departures
          setDepartures(data.departures)
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
