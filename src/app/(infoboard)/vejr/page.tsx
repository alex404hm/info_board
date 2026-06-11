import { SectionPageShell } from "@/components/SectionPageShell"
import { WeatherPanel } from "@/components/panels/WeatherPanel"

export default function WeatherPage() {
  return (
    <SectionPageShell title="Vejr" subtitle="Lokal vejrstatus og 5-dages prognose">
      <WeatherPanel />
    </SectionPageShell>
  )
}
