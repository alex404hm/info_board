"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { weatherIconFromCondition } from "@/lib/utils"
import { useWeatherData } from "@/hooks/use-api-data"

/**
 * Ambient top bar — branding, live weather, clock, date.
 */
export function StatusBar() {
  const [now, setNow] = useState<Date>(() => new Date())
  const weather = useWeatherData()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const date = now.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const iconSrc = weatherIconFromCondition(weather?.condition)

  return (
    <header className="flex w-full min-h-[68px] shrink-0 items-center justify-between overflow-hidden border-b border-white/[0.06] bg-[#0d1528] px-2 sm:px-6 lg:px-10">
      {/* Left — Branding */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Image
          src="/logo.svg"
          alt="TEC"
          width={100}
          height={36}
          priority
          className="h-7 w-auto brightness-0 invert sm:h-9"
        />
        <div className="hidden h-6 w-px bg-white/10 sm:block" />
        <span className="hidden text-sm font-semibold text-white/40 md:inline">Infotavle</span>
      </div>

      {/* Right — Weather · Clock · Date */}
      <div className="ml-2 flex min-w-0 flex-1 items-center justify-end gap-2 sm:ml-3 sm:gap-6">
        <div className="hidden shrink-0 items-center gap-2 min-[390px]:flex">
          <Image
            src={iconSrc}
            alt=""
            width={28}
            height={28}
            className="h-6 w-6 sm:h-7 sm:w-7"
          />
          <span className="text-sm font-bold tabular-nums text-white/90 sm:text-base">
            {weather?.temperatureC ?? "--"}°
          </span>
        </div>

        <div className="hidden h-6 w-px bg-white/10 sm:block" />

        <div className="min-w-0 text-right">
          <p className="text-base leading-none font-bold tabular-nums tracking-tight text-white sm:text-xl">
            {time}
          </p>
          <p className="hidden max-w-[42vw] truncate text-[11px] font-medium capitalize text-white/40 md:block md:max-w-none">
            {date}
          </p>
        </div>
      </div>
    </header>
  )
}
