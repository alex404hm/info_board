import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetOnePage } from "@/components/panels/IntranetOnePage"

export default function IntranetPage() {
  return (
    <SectionPageShell
      title="Intranet"
      fullWidth
      subtitle="Løn, befordring, læreplads og rettigheder for lærlinge"
    >
      <IntranetOnePage />
    </SectionPageShell>
  )
}
