"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { getWeatherIcon } from "@/lib/utils"
import { useWeatherData } from "@/hooks/use-api-data"

// Palette
// --color-1: #F1F2F5  --color-2: #BEBFC2  --color-3: #8E8F92
// --color-4: #616264  --color-5: #37383A  --color-6: #121213

export function StatusBar() {
  const [now, setNow] = useState<Date>(() => new Date())
  const weather = useWeatherData()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const date = now.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })
  const iconSrc = getWeatherIcon(weather?.symbolCode ?? undefined, weather?.updatedAt)

  return (
    <header
      className="status-bar flex w-full min-h-17 shrink-0 items-center justify-between overflow-hidden px-10"
    >
      {/* Left - Branding */}
      <div className="flex min-w-0 items-center gap-4">
        <Link href="/" className="flex items-center transition-opacity hover:opacity-75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="TEC"
            width={100}
            height={36}
            className="h-9 w-auto brightness-0 invert"
          />
        </Link>
      </div>

      {/* Right - Weather, Clock, Date */}
      <div className="ml-3 flex min-w-0 flex-1 items-center justify-end gap-6">
        <div className="flex shrink-0 items-center gap-2">
          <Image src={iconSrc} alt="" width={28} height={28} className="h-7 w-7" />
          <span className="text-base font-bold tabular-nums text-foreground-strong">
            {weather?.temperatureC ?? "--"}°
          </span>
        </div>

        <div className="h-6 w-px status-bar-divider" />

        <div className="min-w-0 text-right">
          <p className="text-xl leading-none font-bold tabular-nums tracking-tight text-foreground-strong">
            {time}
          </p>
          <p className="max-w-none truncate text-[11px] font-bold capitalize text-foreground-strong">
            {date}
          </p>
        </div>
      </div>
    </header>
  )
}
