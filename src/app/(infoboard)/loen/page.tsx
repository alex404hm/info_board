import { SectionPageShell } from "@/components/SectionPageShell"
import { LoenPanel } from "@/components/panels/LoenPanel"

export default function LoenPage() {
  return (
    <SectionPageShell title="Løn" subtitle="Lønsatser for lærlinge — timeløn og månedsløn">
      <LoenPanel />
    </SectionPageShell>
  )
}
