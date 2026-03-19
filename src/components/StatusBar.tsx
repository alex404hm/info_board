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
      className="status-bar flex w-full min-h-[68px] shrink-0 items-center justify-between overflow-hidden px-2 sm:px-6 lg:px-10"
    >
      {/* Left — Branding */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center hover:opacity-75 transition-opacity">
          <Image src="/logo.svg" alt="TEC" width={100} height={36} priority className="h-7 w-auto brightness-0 invert sm:h-9" />
        </Link>
        <div className="hidden h-6 w-px sm:block status-bar-divider" />
        <span className="hidden text-sm font-semibold text-soft md:inline">Infotavle</span>
      </div>

      {/* Right — Weather · Clock · Date */}
      <div className="ml-2 flex min-w-0 flex-1 items-center justify-end gap-2 sm:ml-3 sm:gap-6">
        <div className="hidden shrink-0 items-center gap-2 min-[390px]:flex">
          <Image src={iconSrc} alt="" width={28} height={28} className="h-6 w-6 sm:h-7 sm:w-7" />
          <span className="text-sm font-bold tabular-nums sm:text-base text-foreground-strong">
            {weather?.temperatureC ?? "--"}°
          </span>
        </div>

        <div className="hidden h-6 w-px sm:block status-bar-divider" />

        <div className="min-w-0 text-right">
          <p className="text-base leading-none font-bold tabular-nums tracking-tight sm:text-xl text-foreground-strong">
            {time}
          </p>
          <p className="hidden max-w-[42vw] truncate text-[11px] font-medium capitalize md:block md:max-w-none text-soft">
            {date}
          </p>
        </div>
      </div>
    </header>
  )
}
