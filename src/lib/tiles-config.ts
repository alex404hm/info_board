import { Train, Utensils, CalendarDays, Newspaper, Users, CloudSun, Car, Coffee, MessageSquare, BookOpen } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type TileId = "afgange" | "kantine" | "kalender" | "nyheder" | "kontakter" | "vejr" | "trafik" | "kokkenvagt" | "beskeder" | "intranet"

type TileDefinition = {
  id: TileId
  defaultLabel: string
  href: string
  icon: LucideIcon
  logoSrc?: string
  logoAlt?: string
  iconBg: string
  iconWrapBg: string
}

export const TILE_DEFINITIONS: TileDefinition[] = [
  {
    id: "afgange",
    defaultLabel: "Afgange",
    href: "/afgange",
    icon: Train,
    logoSrc: "/logo/dsb.svg",
    logoAlt: "DSB",
    iconBg: "bg-blue-500/10",
    iconWrapBg: "bg-blue-500/15",
  },
  {
    id: "kantine",
    defaultLabel: "Kantine",
    href: "/kantine",
    icon: Utensils,
    logoSrc: "/logo/kanpla.png",
    logoAlt: "Kanpla",
    iconBg: "bg-amber-500/10",
    iconWrapBg: "bg-amber-500/15",
  },
  {
    id: "kalender",
    defaultLabel: "Kalender",
    href: "/kalender",
    icon: CalendarDays,
    logoSrc: "/logo/outlook.svg",
    logoAlt: "Outlook",
    iconBg: "bg-emerald-500/10",
    iconWrapBg: "bg-emerald-500/15",
  },
  {
    id: "nyheder",
    defaultLabel: "Nyheder",
    href: "/nyheder",
    icon: Newspaper,
    logoSrc: "/logo/dr-news.svg",
    logoAlt: "DR Nyheder",
    iconBg: "bg-rose-500/10",
    iconWrapBg: "bg-rose-500/15",
  },
  {
    id: "kontakter",
    defaultLabel: "Kontakter",
    href: "/kontakter",
    icon: Users,
    iconBg: "bg-violet-500/10",
    iconWrapBg: "bg-violet-500/15",
  },
  {
    id: "vejr",
    defaultLabel: "Vejr",
    href: "/vejr",
    icon: CloudSun,
    logoSrc: "/weather/02d.svg",
    logoAlt: "Vejr",
    iconBg: "bg-sky-500/10",
    iconWrapBg: "bg-sky-500/15",
  },
  {
    id: "trafik",
    defaultLabel: "Trafik",
    href: "/trafik",
    icon: Car,
    logoSrc: "/logo/p4-trafik.svg",
    logoAlt: "Trafik",
    iconBg: "bg-orange-500/10",
    iconWrapBg: "bg-orange-500/15",
  },
  {
    id: "kokkenvagt",
    defaultLabel: "Køkkenvagt",
    href: "/kokkenvagt",
    icon: Coffee,
    iconBg: "bg-amber-700/10",
    iconWrapBg: "bg-amber-700/15",
  },
  {
    id: "beskeder",
    defaultLabel: "Beskeder",
    href: "/beskeder",
    icon: MessageSquare,
    iconBg: "bg-yellow-500/10",
    iconWrapBg: "bg-yellow-500/15",
  },
  {
    id: "intranet",
    defaultLabel: "Intranet",
    href: "/intranet",
    icon: BookOpen,
    iconBg: "bg-indigo-500/10",
    iconWrapBg: "bg-indigo-500/15",
  },
]

export type TileConfig = {
  id: TileId
  visible: boolean
  label: string
  order: number
}

export const DEFAULT_TILE_CONFIG: TileConfig[] = TILE_DEFINITIONS.map((t, i) => ({
  id: t.id,
  visible: true,
  label: t.defaultLabel,
  order: i,
}))

export const TILES_SETTING_KEY = "tiles_config"
