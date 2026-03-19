"use client"

import Image from "next/image"
import { Droplets, Wind, Thermometer } from "lucide-react"
import { getWeatherIcon } from "@/lib/utils"
import { useWeatherData } from "@/hooks/use-api-data"

export function WeatherPanel() {
  const weather = useWeatherData()
  const icon    = getWeatherIcon(weather?.symbolCode ?? undefined, weather?.updatedAt)
  const days    = weather?.forecastDays ?? []
  const windMs  = weather?.windKmh != null ? weather.windKmh / 3.6 : null

  return (
    <div className="space-y-4">

      {/* ── Current conditions ── */}
      <div className="surface-panel flex items-center gap-6 p-6">
        <div className="panel-icon flex h-20 w-20 items-center justify-center rounded-2xl">
          <Image src={icon} alt={weather?.condition ?? "Vejr"} width={56} height={56} className="h-14 w-14" />
        </div>
        <div>
          <p className="text-5xl font-bold tracking-tight text-foreground-strong">
            {weather?.temperatureC ?? "--"}°
          </p>
          <p className="mt-1 text-sm text-muted">{weather?.condition ?? "Henter…"}</p>
          <p className="mt-1 text-xs text-subtle">Stamholmen 193, 2650 Hvidovre</p>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="panel-stat px-4 py-3 text-center">
            <Droplets className="mx-auto mb-1 h-4 w-4 text-accent" />
            <p className="text-lg font-semibold text-foreground-strong">{weather?.humidityPct ?? "--"}%</p>
            <p className="text-[10px] text-subtle">Fugtighed</p>
          </div>
          <div className="panel-stat px-4 py-3 text-center">
            <Wind className="mx-auto mb-1 h-4 w-4 text-subtle" />
            <p className="text-lg font-semibold text-foreground-strong">
              {windMs == null ? "--" : windMs.toFixed(1).replace(".", ",")}
            </p>
            <p className="text-[10px] text-subtle">m/s</p>
          </div>
        </div>
      </div>

      {/* ── 5-day forecast ── */}
      <div className="rounded-2xl bg-sky-950/60 border border-sky-800/40 p-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-sky-300/70">5-dages prognose</p>
        <div className="grid grid-cols-5 gap-3">
          {days.length > 0 ? days.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-4 rounded-2xl border border-sky-700/30 bg-sky-900/40 px-3 py-8 text-center min-h-[360px] justify-between transition-colors hover:bg-sky-800/40"
            >
              {/* Day */}
              <p className="text-sm font-extrabold uppercase tracking-widest text-foreground-strong">
                {day.weekday}
              </p>

              <div className="w-8 h-px bg-white/10" />

              {/* Icon */}
              <Image
                src={getWeatherIcon(day.symbolCode)}
                alt={day.condition}
                width={72}
                height={72}
                className="h-18 w-18 drop-shadow-xl"
              />

              <div className="w-8 h-px bg-white/10" />

              {/* Temp */}
              <p className="text-3xl font-black tracking-tight text-foreground-strong">
                {day.maxC ?? "--"}°
              </p>

              {/* Wind */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Wind className="h-4 w-4 text-muted" />
                </div>
                <p className="text-xs font-semibold text-muted">
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
      <div className="surface-panel p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Dagens vejr</p>
        <div className="grid grid-cols-4 gap-2">
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
              <p className="text-lg font-black text-foreground-strong">{weather?.windKmh ?? "--"}</p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">Vind km/t</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
