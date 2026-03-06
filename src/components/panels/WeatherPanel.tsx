"use client"

import Image from "next/image"
import { Droplets, Wind, ThermometerSun } from "lucide-react"
import { getWeatherIcon } from "@/lib/utils"
import { useWeatherData } from "@/hooks/use-api-data"

function fmtDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })
}

export function WeatherPanel() {
  const weather = useWeatherData()
  const icon = getWeatherIcon(weather?.symbolCode ?? undefined, weather?.updatedAt)
  const days = weather?.forecastDays ?? []

  return (
    <div className="space-y-4">
      {/* Current conditions */}
      <div className="ib-panel flex items-center gap-6 p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-500/10">
          <Image
            src={icon}
            alt={weather?.condition ?? "Vejr"}
            width={56}
            height={56}
            className="h-14 w-14"
          />
        </div>
        <div>
          <p className="text-5xl font-bold tracking-tight text-white">
            {weather?.temperatureC ?? "--"}°
          </p>
          <p className="mt-1 text-sm text-white/50">
            {weather?.condition ?? "Henter…"}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="ib-panel-soft px-4 py-3 text-center">
            <Droplets className="mx-auto mb-1 h-4 w-4 text-sky-400" />
            <p className="text-lg font-semibold text-white/80">
              {weather?.humidityPct ?? "--"}%
            </p>
            <p className="text-[10px] text-white/30">Fugtighed</p>
          </div>
          <div className="ib-panel-soft px-4 py-3 text-center">
            <Wind className="mx-auto mb-1 h-4 w-4 text-white/40" />
            <p className="text-lg font-semibold text-white/80">
              {weather?.windKmh ?? "--"}
            </p>
            <p className="text-[10px] text-white/30">km/t</p>
          </div>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="ib-panel p-5">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          <ThermometerSun className="h-3.5 w-3.5" /> 7-dages prognose
        </p>
        <div className="space-y-1">
          {days.length > 0 ? (
            days.map((day) => (
              <div
                key={day.date}
                className="flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <div className="w-16 text-xs">
                  <p className="font-semibold text-white/80">{day.weekday}</p>
                  <p className="text-white/30">{fmtDay(day.date)}</p>
                </div>
                <Image
                  src={getWeatherIcon(day.symbolCode)}
                  alt={day.condition}
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <p className="flex-1 truncate text-xs text-white/50">
                  {day.condition}
                </p>
                <p className="text-sm font-semibold text-white/80">
                  {day.maxC ?? "--"}°{" "}
                  <span className="font-normal text-white/40">/ {day.minC ?? "--"}°</span>
                </p>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-white/40">
              Henter prognose…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
