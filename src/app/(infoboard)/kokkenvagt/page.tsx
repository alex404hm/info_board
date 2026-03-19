import { SectionPageShell } from "@/components/SectionPageShell"
import { KokkenvagtPanel } from "@/components/panels/KokkenvagtPanel"

export default function KokkenvagtPage() {
  return (
    <SectionPageShell title="Køkkenvagt" subtitle="Vagtplan og instruktioner for køkkenet">
      <KokkenvagtPanel />
    </SectionPageShell>
  )
}
