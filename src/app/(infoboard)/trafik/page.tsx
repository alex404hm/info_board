import { SectionPageShell } from "@/components/SectionPageShell"
import { TrafikPanel } from "@/components/panels/TrafikPanel"

export default function TrafikPage() {
  return (
    <SectionPageShell title="Trafik Info" subtitle="Aktuelle trafikhændelser i København – DR Trafik">
      <TrafikPanel />
    </SectionPageShell>
  )
}
