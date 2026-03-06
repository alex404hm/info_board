import { SectionPageShell } from "@/components/SectionPageShell"
import { DeparturesPanel } from "@/components/panels/DeparturesPanel"

export default function DeparturesPage() {
  return (
    <SectionPageShell title="Afgange" subtitle="Live afgange fra naermeste station">
      <DeparturesPanel />
    </SectionPageShell>
  )
}
