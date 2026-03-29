import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetPanel } from "@/components/panels/IntranetPanel"
import { INTRANET_SECTIONS } from "@/lib/intranet-static"

export default function IntranetPage() {
  return (
    <SectionPageShell
      title="Intranet"
      subtitle="Løn, befordring, læreplads og rettigheder for lærlinge"
    >
      <IntranetPanel sections={INTRANET_SECTIONS} />
    </SectionPageShell>
  )
}
