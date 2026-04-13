"use client"

import Image from "next/image"
import { Droplets, Wind, Thermometer } from "lucide-react"
import { getWeatherIcon } from "@/lib/utils"
import { useWeatherData } from "@/hooks/use-api-data"

export function WeatherPanel() {
  const weather = useWeatherData()
  const icon    = getWeatherIcon(weather?.symbolCode ?? undefined, weather?.updatedAt)
  const days    = weather?.forecastDays ?? []
  const windMs  = weather?.windMs ?? null
  const windKmh = weather?.windKmh ?? null

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
          <div className="flex gap-2 gap-3">
            <div className="panel-stat px-3 py-2.5 text-center px-4 py-3">
              <Droplets className="mx-auto mb-1 h-4 w-4 text-accent" />
              <p className="text-base font-semibold text-foreground-strong text-lg">{weather?.humidityPct ?? "--"}%</p>
              <p className="text-[9px] text-subtle text-[10px]">Fugtighed</p>
            </div>
            <div className="panel-stat px-3 py-2.5 text-center px-4 py-3">
              <Wind className="mx-auto mb-1 h-4 w-4 text-subtle" />
              <p className="text-base font-semibold text-foreground-strong text-lg">
                {windMs == null ? "--" : windMs.toFixed(1).replace(".", ",")}
              </p>
              <p className="text-[9px] text-subtle text-[10px]">m/s</p>
            </div>
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
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 h-8 w-8">
                  <Wind className="h-3.5 w-3.5 text-muted h-4 w-4" />
                </div>
                <p className="text-[10px] font-semibold text-muted text-xs">
                  {day.windMs != null ? `${day.windMs.toFixed(1).replace(".", ",")} m/s` : "--"}
                </p>
              </div>
            </div>
          )) : (
            <p className="col-span-5 py-8 text-center text-xs text-sky-300/50">Henter prognose…</p>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="surface-panel p-4 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Dagens vejr</p>
        <div className="grid grid-cols-2 gap-2 grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-4">
            <Thermometer className="h-5 w-5 shrink-0 text-sky-400" />
            <div>
              <p className="text-lg font-black text-foreground-strong">{weather?.temperatureC ?? "--"}°</p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">Temp</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-4">
            <Droplets className="h-5 w-5 shrink-0 text-teal-400" />
            <div>
              <p className="text-lg font-black text-foreground-strong">{weather?.humidityPct ?? "--"}%</p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">Fugtighed</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-4">
            <Wind className="h-5 w-5 shrink-0 text-violet-400" />
            <div>
              <p className="text-lg font-black text-foreground-strong">
                {windMs == null ? "--" : windMs.toFixed(1).replace(".", ",")}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">Vind m/s</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-4">
            <Wind className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-lg font-black text-foreground-strong">{windKmh ?? "--"}</p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">Vind km/t</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
