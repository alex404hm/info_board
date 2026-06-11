"use client"

import Image from "next/image"
import { Wind } from "lucide-react"
import { getWeatherIcon } from "@/lib/utils"
import { useWeatherData } from "@/hooks/use-api-data"

export function WeatherPanel() {
  const weather = useWeatherData()
  const icon    = getWeatherIcon(weather?.symbolCode ?? undefined, weather?.updatedAt)
  const days    = weather?.forecastDays ?? []

  return (
    <div className="space-y-4">

      {/* ── Current conditions ── */}
      <div className="surface-panel p-4 p-6">
        <div className="flex items-center gap-4 gap-6">
          <div className="panel-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl h-20 w-20">
            <Image src={icon} alt={weather?.condition ?? "Vejr"} width={56} height={56} className="h-10 w-10 h-14 w-14" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-4xl font-bold tracking-tight text-foreground-strong text-5xl">
              {weather?.temperatureC ?? "--"}°
            </p>
            <p className="mt-1 text-sm text-muted">{weather?.condition ?? "Henter…"}</p>
            <p className="mt-0.5 text-xs text-subtle">Stamholmen 193, 2650 Hvidovre</p>
          </div>
        </div>
      </div>

      {/* ── 5-day forecast ── */}
      <div className="rounded-2xl bg-sky-950/60 border border-sky-800/40 p-4 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-300/70">5-dages prognose</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar grid grid-cols-5 gap-3">
          {days.length > 0 ? days.map((day) => (
            <div
              key={day.date}
              className="flex shrink-0 w-[calc(33.33%-6px)] flex-col items-center gap-3 rounded-2xl border border-sky-700/30 bg-sky-900/40 px-2 py-5 text-center w-auto min-h-[280px] gap-4 px-3 py-8 justify-between transition-colors hover:bg-sky-800/40"
            >
              {/* Day */}
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-foreground-strong text-sm">
                {day.weekday}
              </p>

              <div className="w-6 h-px bg-white/10 w-8" />

              {/* Icon */}
              <Image
                src={getWeatherIcon(day.symbolCode)}
                alt={day.condition}
                width={56}
                height={56}
                className="h-12 w-12 drop-shadow-xl h-16 w-16"
              />

              <div className="w-6 h-px bg-white/10 w-8" />

              {/* Temp */}
              <p className="text-2xl font-black tracking-tight text-foreground-strong text-3xl">
                {day.maxC ?? "--"}°
              </p>

              {/* Wind */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400/15 ring-1 ring-sky-400/30">
                  <Wind className="h-4.5 w-4.5 text-sky-400" />
                </div>
                <p className="text-xs font-semibold text-sky-300">
                  {day.windMs != null ? `${day.windMs.toFixed(1).replace(".", ",")} m/s` : "--"}
                </p>
              </div>
            </div>
          )) : (
            <p className="col-span-5 py-8 text-center text-xs text-sky-300/50">Henter prognose…</p>
          )}
        </div>
      </div>

    </div>
  )
}
