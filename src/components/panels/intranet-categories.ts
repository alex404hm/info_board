import {
  Bus,
  Briefcase,
  Star,
  Umbrella,
  Heart,
  Clock,
  GraduationCap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type SectionKey =
  | "befordring"
  | "laerepladssogning"
  | "emma"
  | "forsikring"
  | "sygdom"
  | "fravaer_orlov"
  | "ydelse"

export type Category = {
  key: SectionKey
  icon: LucideIcon
  iconColor: string
  iconBg: string
  bgFrom: string
  bgTo: string
  glowA: string
  glowB: string
  accentColor: string
  title: string
  subtitle: string
}

export const CATEGORIES: Category[] = [
  {
    key: "befordring",
    icon: Bus,
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.22)",
    bgFrom: "rgba(30,58,138,0.95)",
    bgTo: "rgba(15,23,42,0.99)",
    glowA: "rgba(96,165,250,0.22)",
    glowB: "rgba(59,130,246,0.12)",
    accentColor: "#60a5fa",
    title: "Befordring",
    subtitle: "Tilskud og refusionsskema",
  },
  {
    key: "laerepladssogning",
    icon: Briefcase,
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.22)",
    bgFrom: "rgba(49,46,129,0.95)",
    bgTo: "rgba(30,27,75,0.99)",
    glowA: "rgba(129,140,248,0.22)",
    glowB: "rgba(99,102,241,0.12)",
    accentColor: "#818cf8",
    title: "Læreplads",
    subtitle: "Søgning og aftaleformer",
  },
  {
    key: "emma",
    icon: Star,
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.22)",
    bgFrom: "rgba(120,53,15,0.95)",
    bgTo: "rgba(69,26,3,0.99)",
    glowA: "rgba(251,191,36,0.22)",
    glowB: "rgba(245,158,11,0.12)",
    accentColor: "#fbbf24",
    title: "EMMA",
    subtitle: "Krav og løbende evaluering",
  },
  {
    key: "forsikring",
    icon: Umbrella,
    iconColor: "#c084fc",
    iconBg: "rgba(192,132,252,0.22)",
    bgFrom: "rgba(88,28,135,0.95)",
    bgTo: "rgba(59,7,100,0.99)",
    glowA: "rgba(192,132,252,0.22)",
    glowB: "rgba(168,85,247,0.12)",
    accentColor: "#c084fc",
    title: "Forsikring",
    subtitle: "Dækning under uddannelse",
  },
  {
    key: "sygdom",
    icon: Heart,
    iconColor: "#f87171",
    iconBg: "rgba(248,113,113,0.22)",
    bgFrom: "rgba(127,29,29,0.95)",
    bgTo: "rgba(69,10,10,0.99)",
    glowA: "rgba(248,113,113,0.22)",
    glowB: "rgba(239,68,68,0.12)",
    accentColor: "#f87171",
    title: "Sygdom",
    subtitle: "Fraværsprocedurer og regler",
  },
  {
    key: "fravaer_orlov",
    icon: Clock,
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.22)",
    bgFrom: "rgba(124,45,18,0.95)",
    bgTo: "rgba(67,20,7,0.99)",
    glowA: "rgba(251,146,60,0.22)",
    glowB: "rgba(249,115,22,0.12)",
    accentColor: "#fb923c",
    title: "Fravær & Orlov",
    subtitle: "Barsel, fravær og fridage",
  },
  {
    key: "ydelse",
    icon: GraduationCap,
    iconColor: "#2dd4bf",
    iconBg: "rgba(45,212,191,0.22)",
    bgFrom: "rgba(19,78,74,0.95)",
    bgTo: "rgba(4,47,46,0.99)",
    glowA: "rgba(45,212,191,0.22)",
    glowB: "rgba(20,184,166,0.12)",
    accentColor: "#2dd4bf",
    title: "Skoleydelse",
    subtitle: "Din ydelse under oplæring",
  },
]
