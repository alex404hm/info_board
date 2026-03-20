import type { ComponentType } from "react"

import { CalendarPanel } from "@/components/panels/CalendarPanel"
import { CanteenPanel } from "@/components/panels/CanteenPanel"
import { ContactsPanel } from "@/components/panels/ContactsPanel"
import { DeparturesPanel } from "@/components/panels/DeparturesPanel"
import { KokkenvagtPanel } from "@/components/panels/KokkenvagtPanel"
import { LoenPanel } from "@/components/panels/LoenPanel"
import { NewsPanel } from "@/components/panels/NewsPanel"
import { TrafikPanel } from "@/components/panels/TrafikPanel"
import { WeatherPanel } from "@/components/panels/WeatherPanel"

export type InfoBoardSection = {
  slug: string
  title: string
  subtitle?: string
  Panel: ComponentType
}

export const INFOBOARD_SECTIONS: InfoBoardSection[] = [
  {
    slug: "afgange",
    title: "Afgange",
    subtitle: "Live afgange fra naermeste station",
    Panel: DeparturesPanel,
  },
  {
    slug: "kantine",
    title: "Kantine",
    subtitle: "Dagens menu og retter fra kanpla",
    Panel: CanteenPanel,
  },
  {
    slug: "kalender",
    title: "Kalender",
    subtitle: "Skolekalender, helligdage og aktiviteter",
    Panel: CalendarPanel,
  },
  {
    slug: "nyheder",
    title: "Nyheder",
    subtitle: "Seneste nyheder fra DR.dk",
    Panel: NewsPanel,
  },
  {
    slug: "kontakter",
    title: "Kontakter",
    subtitle: "Vigtige kontaktpersoner og instruktoerer",
    Panel: ContactsPanel,
  },
  {
    slug: "vejr",
    title: "Vejr",
    subtitle: "Lokal vejrstatus og 7-dages prognose",
    Panel: WeatherPanel,
  },
  {
    slug: "trafik",
    title: "Trafik Info",
    subtitle: "Aktuelle trafikhændelser i København – DR Trafik",
    Panel: TrafikPanel,
  },
  {
    slug: "kokkenvagt",
    title: "Køkkenvagt",
    subtitle: "Vagtplan og instruktioner for køkkenet",
    Panel: KokkenvagtPanel,
  },
  {
    slug: "loen",
    title: "Løn",
    subtitle: "Lønsatser for lærlinge — timeløn og månedsløn",
    Panel: LoenPanel,
  },
]

export const INFOBOARD_SECTION_MAP = Object.fromEntries(
  INFOBOARD_SECTIONS.map((section) => [section.slug, section])
) as Record<string, InfoBoardSection>
